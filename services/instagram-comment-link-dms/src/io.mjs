import {randomUUID} from "node:crypto";
import {mkdir, readFile, rename, rm, stat, utimes, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";

export async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function atomicJson(path, value) {
  await mkdir(dirname(path), {recursive: true});
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {encoding: "utf8", mode: 0o600});
  await rename(temporary, path);
}

export async function assertMode600(path) {
  const file = await stat(path);
  if (!file.isFile()) throw new Error("LIVE_UNLOCK_FILE must be a regular file.");
  if ((file.mode & 0o077) !== 0) throw new Error("LIVE_UNLOCK_FILE must use mode 0600.");
}

export async function withDirectoryLock(
  path,
  callback,
  {staleAfterMs = 30 * 60_000, heartbeatEveryMs = Math.min(60_000, Math.floor(staleAfterMs / 3))} = {},
) {
  await mkdir(dirname(path), {recursive: true});
  const owner = `${process.pid}-${randomUUID()}`;
  const marker = await acquireDirectoryLock(path, owner, staleAfterMs);
  const heartbeatInterval = Math.max(1, Math.min(heartbeatEveryMs, Math.max(1, Math.floor(staleAfterMs / 3))));
  const heartbeat = setInterval(async () => {
    await utimes(marker, new Date(), new Date()).catch(() => {});
  }, heartbeatInterval);
  heartbeat.unref();
  try {
    return await callback();
  } finally {
    clearInterval(heartbeat);
    if (await ownsDirectoryLock(path, owner)) await rm(path, {recursive: true, force: true});
  }
}

async function acquireDirectoryLock(path, owner, staleAfterMs) {
  try {
    await mkdir(path, {mode: 0o700});
    await writeFile(`${path}/owner`, `${owner}\n`, {encoding: "utf8", mode: 0o600});
    const marker = `${path}/lease-${owner}`;
    await writeFile(marker, "", {encoding: "utf8", mode: 0o600});
    return marker;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }

  const currentOwner = await readFile(`${path}/owner`, "utf8").then((value) => value.trim()).catch(() => null);
  const lease = currentOwner ? await stat(`${path}/lease-${currentOwner}`).catch(() => null) : await stat(path).catch(() => null);
  if (!lease || Date.now() - lease.mtimeMs <= staleAfterMs) throw runLockBusy();

  const stalePath = `${path}.stale-${process.pid}-${randomUUID()}`;
  try {
    await rename(path, stalePath);
  } catch (error) {
    if (error.code === "ENOENT") return acquireDirectoryLock(path, owner, staleAfterMs);
    throw error;
  }
  await rm(stalePath, {recursive: true, force: true});
  return acquireDirectoryLock(path, owner, staleAfterMs);
}

async function ownsDirectoryLock(path, owner) {
  const currentOwner = await readFile(`${path}/owner`, "utf8").then((value) => value.trim()).catch(() => null);
  return currentOwner === owner;
}

function runLockBusy() {
  const error = new Error("Another comment-to-DM cycle owns the run lock.");
  error.code = "run_lock_busy";
  return error;
}

export const absolute = (value) => resolve(process.cwd(), value);
