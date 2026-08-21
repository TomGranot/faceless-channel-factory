import assert from "node:assert/strict";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";
import {withDirectoryLock} from "../src/io.mjs";

test("an overlapping run cannot steal a fresh lock during initialization", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "weekly-learning-lock-"));
  const lock = resolve(root, "run.lock");
  let release;
  const held = new Promise((resolvePromise) => { release = resolvePromise; });
  const attempts = [
    withDirectoryLock(lock, () => held),
    withDirectoryLock(lock, () => held),
  ];
  setTimeout(release, 20);
  const results = await Promise.allSettled(attempts);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const rejection = results.find((result) => result.status === "rejected");
  assert.equal(rejection.reason.code, "run_lock_busy");
  await rm(root, {recursive: true, force: true});
});
