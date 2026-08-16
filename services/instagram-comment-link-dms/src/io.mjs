import {mkdir, readFile, rename, rm, stat, writeFile} from "node:fs/promises";
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

export async function withDirectoryLock(path, callback, {staleAfterMs = 30 * 60_000} = {}) {
  await mkdir(dirname(path), {recursive: true});
  try {
    await mkdir(path, {mode: 0o700});
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = await stat(path).catch(() => null);
    if (!existing || Date.now() - existing.mtimeMs <= staleAfterMs) {
      const busy = new Error("Another comment-to-DM cycle owns the run lock.");
      busy.code = "run_lock_busy";
      throw busy;
    }
    const stalePath = `${path}.stale-${process.pid}-${Date.now()}`;
    await rename(path, stalePath);
    await rm(stalePath, {recursive: true, force: true});
    await mkdir(path, {mode: 0o700});
  }
  try {
    return await callback();
  } finally {
    await rm(path, {recursive: true, force: true});
  }
}

export const absolute = (value) => resolve(process.cwd(), value);
