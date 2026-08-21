import {createHash, randomUUID} from "node:crypto";
import {access, mkdir, readFile, rename, rm, stat, utimes, writeFile} from "node:fs/promises";
import {dirname} from "node:path";

export async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function atomicJson(path, value, {mode = 0o600} = {}) {
  await mkdir(dirname(path), {recursive: true});
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {encoding: "utf8", mode});
  await rename(temporary, path);
}

export async function atomicText(path, value, {mode = 0o600} = {}) {
  await mkdir(dirname(path), {recursive: true});
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, value, {encoding: "utf8", mode});
  await rename(temporary, path);
}

export async function pathExists(path) {
  return access(path).then(() => true).catch(() => false);
}

export async function assertPrivateFile(path) {
  const file = await stat(path);
  if (!file.isFile()) throw new Error(`Config must be a regular file: ${path}`);
  if ((file.mode & 0o077) !== 0) throw new Error(`Config must use mode 0600: ${path}`);
}

export function stableHash(value) {
  const input = typeof value === "string" ? value : JSON.stringify(sortValue(value));
  return createHash("sha256").update(input).digest("hex");
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
}

export async function withDirectoryLock(
  path,
  callback,
  {staleAfterMs = 30 * 60_000, heartbeatEveryMs = 30_000} = {},
) {
  await mkdir(dirname(path), {recursive: true});
  const owner = `${process.pid}-${randomUUID()}`;
  const marker = await acquireLock(path, owner, staleAfterMs);
  const heartbeat = setInterval(() => utimes(marker, new Date(), new Date()).catch(() => {}), heartbeatEveryMs);
  heartbeat.unref();
  try {
    return await callback();
  } finally {
    clearInterval(heartbeat);
    const currentOwner = await readFile(`${path}/owner`, "utf8").then((value) => value.trim()).catch(() => null);
    if (currentOwner === owner) await rm(path, {recursive: true, force: true});
  }
}

async function acquireLock(path, owner, staleAfterMs) {
  try {
    await mkdir(path, {mode: 0o700});
    await writeFile(`${path}/owner`, `${owner}\n`, {encoding: "utf8", mode: 0o600});
    const marker = `${path}/lease-${owner}`;
    await writeFile(marker, "", {mode: 0o600});
    return marker;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }

  const currentOwner = await readFile(`${path}/owner`, "utf8").then((value) => value.trim()).catch(() => null);
  const lease = currentOwner
    ? await stat(`${path}/lease-${currentOwner}`).catch(() => null)
    : await stat(path).catch(() => null);
  if (lease && Date.now() - lease.mtimeMs <= staleAfterMs) {
    const error = new Error("Another weekly learning cycle owns the run lock.");
    error.code = "run_lock_busy";
    throw error;
  }

  const stale = `${path}.stale-${process.pid}-${randomUUID()}`;
  await rename(path, stale).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  await rm(stale, {recursive: true, force: true});
  return acquireLock(path, owner, staleAfterMs);
}
