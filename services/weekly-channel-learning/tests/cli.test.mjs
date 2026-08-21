import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {chmod, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("a weekly run is idempotent when autonomy is disabled", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "weekly-learning-"));
  const configPath = resolve(temporary, "config.json");
  const config = {
    schemaVersion: 1,
    timezone: "Europe/Amsterdam",
    stateRoot: resolve(temporary, "state"),
    reviewer: {enabled: false},
    accounts: [{
      slug: "example",
      label: "Example",
      provider: {kind: "fixture", path: resolve(root, "fixtures", "account.json")},
      maturityHours: 72,
      cohortDays: 7,
      minimumCohortPosts: 3,
      minimumDecisionPosts: 6,
      topicRules: [{name: "specific-surprise", patterns: ["hidden|secret|unexpected"]}],
      experimentBacklog: [],
    }],
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, {mode: 0o600});
  await chmod(configPath, 0o600);
  const first = await execute(["run", "--config", configPath, "--now", "2026-08-21T10:00:00.000Z"]);
  assert.equal(first.code, 0, first.stderr);
  const second = await execute(["run", "--config", configPath, "--now", "2026-08-21T10:00:00.000Z"]);
  assert.equal(second.code, 0, second.stderr);
  const output = JSON.parse(second.stdout);
  assert.equal(output.collection.status, "already-collected");
  assert.equal(output.weekly.status, "already-reported");
  const proposal = JSON.parse(await readFile(resolve(temporary, "state", "runs", "2026-W34", "proposals", "example.json"), "utf8"));
  assert.equal(proposal.status, "disabled");
  assert.equal(proposal.application, null);
  await rm(temporary, {recursive: true, force: true});
});

function execute(args) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [resolve(root, "src", "cli.mjs"), ...args], {stdio: ["ignore", "pipe", "pipe"]});
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => resolvePromise({code, stdout, stderr}));
  });
}
