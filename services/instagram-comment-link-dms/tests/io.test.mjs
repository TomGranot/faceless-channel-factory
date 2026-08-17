import assert from "node:assert/strict";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {withDirectoryLock} from "../src/io.mjs";

test("the run lock rejects an overlapping cycle", async () => {
  const directory = await mkdtemp(join(tmpdir(), "comment-dm-lock-"));
  const lock = join(directory, "run.lock");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  const first = withDirectoryLock(lock, () => held);
  await new Promise((resolve) => setTimeout(resolve, 20));
  await assert.rejects(
    () => withDirectoryLock(lock, async () => {}),
    (error) => error.code === "run_lock_busy",
  );
  release();
  await first;
  await rm(directory, {recursive: true, force: true});
});

test("an active lease cannot be stolen only because the callback is long-running", async () => {
  const directory = await mkdtemp(join(tmpdir(), "comment-dm-lease-"));
  const lock = join(directory, "run.lock");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  const first = withDirectoryLock(lock, () => held, {staleAfterMs: 30, heartbeatEveryMs: 5});
  await new Promise((resolve) => setTimeout(resolve, 60));
  await assert.rejects(
    () => withDirectoryLock(lock, async () => {}, {staleAfterMs: 30, heartbeatEveryMs: 5}),
    (error) => error.code === "run_lock_busy",
  );
  release();
  await first;
  await rm(directory, {recursive: true, force: true});
});
