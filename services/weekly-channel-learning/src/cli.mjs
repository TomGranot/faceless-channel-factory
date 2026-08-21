#!/usr/bin/env node
import {spawn} from "node:child_process";
import {mkdir, readFile, readdir, rename, rm} from "node:fs/promises";
import {homedir} from "node:os";
import {dirname, isAbsolute, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {analyzeAccount, analyzeActiveExperiment, isoWeekKey, localDate} from "./core.mjs";
import {applyProductionPolicy, emptyControlState, planControlTransition, productionPolicy} from "./control.mjs";
import {assertPrivateFile, atomicJson, atomicText, pathExists, readJson, stableHash, withDirectoryLock} from "./io.mjs";
import {collectJsonCommandAccount} from "./json-command.mjs";
import {proposalFromReview, renderAccountReport} from "./report.mjs";
import {runReviewer} from "./reviewer.mjs";

const SERVICE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const command = args[0];
const configPath = resolveConfigPath(valueAfter("--config") || process.env.WEEKLY_LEARNING_CONFIG);
if (!command || !["doctor", "collect", "report", "run"].includes(command)) usage();
if (!configPath) throw new Error("Pass --config or set WEEKLY_LEARNING_CONFIG.");
await assertPrivateFile(configPath);
const config = validateConfig(await readJson(configPath));
config.stateRoot = expandPath(config.stateRoot);
const now = valueAfter("--now") ? new Date(valueAfter("--now")) : new Date();
if (Number.isNaN(now.getTime())) throw new Error("--now must be an ISO timestamp.");

if (command === "doctor") {
  const result = await doctor(config);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

await withDirectoryLock(resolve(config.stateRoot, "run.lock"), async () => {
  if (command === "collect") {
    console.log(JSON.stringify(await collect(config, now, {force: args.includes("--force")}), null, 2));
    return;
  }
  if (command === "report") {
    console.log(JSON.stringify(await report(config, now, {force: args.includes("--force")}), null, 2));
    return;
  }
  const collection = await collect(config, now, {force: args.includes("--force")});
  const weekly = await report(config, now, {force: args.includes("--force")});
  console.log(JSON.stringify({collection, weekly}, null, 2));
});

async function collect(config, now, {force = false} = {}) {
  const date = localDate(now, config.timezone);
  const snapshotPath = resolve(config.stateRoot, "snapshots", `${date}.json`);
  if (!force && await pathExists(snapshotPath)) return {status: "already-collected", snapshotPath};
  const accounts = [];
  for (const account of config.accounts) {
    if (account.provider.kind === "fixture") {
      const fixture = await readJson(expandPath(account.provider.path));
      accounts.push({...fixture, slug: account.slug});
    } else accounts.push(await collectJsonCommandAccount(account));
  }
  const snapshot = {
    schemaVersion: 1,
    collectedAt: now.toISOString(),
    reportingDate: date,
    timezone: config.timezone,
    metricDefinitions: {
      plays: "Current public Instagram play_count at collection time.",
      likes: "Current public Instagram like_count at collection time.",
      comments: "Current public Instagram comment_count at collection time.",
      missing: "Missing provider fields remain null and are never converted to zero.",
    },
    accounts,
  };
  await atomicJson(snapshotPath, snapshot);
  await atomicJson(resolve(config.stateRoot, "latest-snapshot.json"), {snapshotPath, collectedAt: snapshot.collectedAt});
  return {status: "collected", snapshotPath, accounts: accounts.map((account) => ({slug: account.slug, posts: account.posts.length}))};
}

async function report(config, now, {force = false} = {}) {
  const weekKey = isoWeekKey(now, config.timezone);
  const finalRoot = resolve(config.stateRoot, "runs", weekKey);
  const completePath = resolve(finalRoot, "manifest.json");
  if (!force && await pathExists(completePath)) return {status: "already-reported", weekKey, reportPath: resolve(finalRoot, "summary.md")};
  const snapshots = await loadSnapshots(config.stateRoot);
  if (!snapshots.length) throw new Error("No analytics snapshot exists. Run collect first.");
  const snapshot = snapshots.at(-1);
  const workRoot = resolve(config.stateRoot, "runs", `.${weekKey}.work-${process.pid}`);
  await rm(workRoot, {recursive: true, force: true});
  await mkdir(resolve(workRoot, "accounts"), {recursive: true});
  await mkdir(resolve(workRoot, "proposals"), {recursive: true});
  const accountResults = [];

  for (const account of config.accounts) {
    const controlPath = resolve(config.stateRoot, "control", `${account.slug}.json`);
    const control = await readJson(controlPath, emptyControlState(account.slug));
    const analysis = analyzeAccount({account: {...account, timezone: config.timezone}, snapshot, snapshots, now});
    const experimentEvidence = analyzeActiveExperiment({account: {...account, timezone: config.timezone}, snapshots, control, now});
    const review = await runReviewer({
      analysis,
      account,
      runRoot: workRoot,
      reviewer: config.reviewer,
      schemaPath: resolve(SERVICE_ROOT, "config", "reviewer-output.schema.json"),
    });
    const proposalBody = {weekKey, channel: account.slug, analysisHash: stableHash(analysis), review: review.result};
    const proposalHash = stableHash(proposalBody);
    const transition = planControlTransition({account, control, experimentEvidence, review, now, weekKey, proposalHash});
    let application = null;
    if (account.autonomy?.enabled) {
      const policy = productionPolicy({account, state: transition.state, now});
      application = await applyProductionPolicy({application: account.autonomy.application, channel: account.slug, policy});
      if (transition.action === "activated" && application.effectiveAt) transition.state.active.measurementStartsAt = application.effectiveAt;
      await atomicJson(controlPath, transition.state);
    }
    const proposal = proposalFromReview({analysis, review, weekKey, proposalHash, transition, application});
    const reportText = renderAccountReport(analysis, review, transition, application);
    const accountPath = resolve(workRoot, "accounts", `${account.slug}.md`);
    const proposalPath = resolve(workRoot, "proposals", `${account.slug}.json`);
    await atomicText(accountPath, reportText);
    await atomicJson(proposalPath, proposal);
    accountResults.push({analysis, review, transition, application, accountPath, proposalPath, proposalHash});
  }

  const summary = renderSummary(weekKey, snapshot, accountResults);
  await atomicText(resolve(workRoot, "summary.md"), summary);
  const manifest = {
    schemaVersion: 1,
    status: "complete",
    weekKey,
    generatedAt: new Date().toISOString(),
    snapshotCollectedAt: snapshot.collectedAt,
    configHash: stableHash(config),
    repositoryRevision: await gitRevision(SERVICE_ROOT),
    accounts: accountResults.map((result) => ({
      slug: result.analysis.slug,
      proposalHash: result.proposalHash,
      reviewStatus: result.review.status,
      verdict: result.review.result?.verdict || result.analysis.deterministicAssessment.verdict,
      controlAction: result.transition.action,
      policyHash: result.application?.policyHash || null,
    })),
  };
  await atomicJson(resolve(workRoot, "manifest.json"), manifest);
  if (force && await pathExists(finalRoot)) await rename(finalRoot, `${finalRoot}.replaced-${Date.now()}`);
  await rename(workRoot, finalRoot);
  await atomicJson(resolve(config.stateRoot, "latest-run.json"), {weekKey, reportPath: resolve(finalRoot, "summary.md"), manifestPath: resolve(finalRoot, "manifest.json")});
  return {status: "reported", weekKey, reportPath: resolve(finalRoot, "summary.md"), accounts: manifest.accounts};
}

async function loadSnapshots(stateRoot) {
  const root = resolve(stateRoot, "snapshots");
  const entries = await readdir(root).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
  const snapshots = [];
  for (const name of entries.filter((name) => name.endsWith(".json")).sort()) snapshots.push(await readJson(resolve(root, name)));
  return snapshots.filter(Boolean).sort((a, b) => new Date(a.collectedAt) - new Date(b.collectedAt));
}

function renderSummary(weekKey, snapshot, results) {
  const lines = [
    `# Weekly channel learning: ${weekKey}`,
    "",
    `Evidence snapshot: ${snapshot.collectedAt}`,
    "",
    "| Channel | Posts analyzed | Cohort | Review | Verdict | Proposal |",
    "| --- | ---: | --- | --- | --- | --- |",
    ...results.map((result) => {
      const verdict = result.review.result?.verdict || result.analysis.deterministicAssessment.verdict;
      return `| [${result.analysis.label}](accounts/${result.analysis.slug}.md) | ${result.analysis.sample.posts} | ${result.analysis.cohortMode} | ${result.review.status} | ${verdict}; ${result.transition.action} | \`${result.proposalHash.slice(0, 12)}\` |`;
    }),
    "",
    "Channels with autonomy enabled apply one allowlisted editorial experiment automatically. Budget, credentials, account ownership, rights, cadence, and queued publications remain outside the loop.",
    "",
  ];
  return lines.join("\n");
}

async function doctor(config) {
  const checks = [];
  checks.push({name: "state-root", ok: isAbsolute(config.stateRoot), detail: config.stateRoot});
  checks.push({name: "accounts", ok: config.accounts.length > 0, detail: `${config.accounts.length} configured`});
  if (config.reviewer?.enabled) {
    checks.push(await commandCheck(config.reviewer.command || "codex", ["--version"], "reviewer-command"));
    checks.push(await commandCheck(config.reviewer.ffmpegCommand || "ffmpeg", ["-version"], "ffmpeg"));
  }
  return {ok: checks.every((check) => check.ok), checks};
}

function commandCheck(command, commandArgs, name) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, commandArgs, {stdio: "ignore"});
    child.on("error", (error) => resolvePromise({name, ok: false, detail: error.message}));
    child.on("close", (code) => resolvePromise({name, ok: code === 0, detail: `${command} exited ${code}`}));
  });
}

function validateConfig(config) {
  if (config?.schemaVersion !== 1) throw new Error("Config schemaVersion must be 1.");
  if (!config.timezone || !config.stateRoot || !Array.isArray(config.accounts) || !config.accounts.length) throw new Error("Config requires timezone, stateRoot, and accounts.");
  const slugs = new Set();
  for (const account of config.accounts) {
    if (!/^[a-z0-9-]+$/.test(account.slug || "")) throw new Error(`Invalid account slug: ${account.slug}`);
    if (slugs.has(account.slug)) throw new Error(`Duplicate account slug: ${account.slug}`);
    slugs.add(account.slug);
    if (!account.label || !["json-command", "fixture"].includes(account.provider?.kind)) throw new Error(`Invalid provider for ${account.slug}.`);
    if (account.provider.kind === "json-command" && (!isAbsolute(account.provider.command || "") || !account.provider.options)) throw new Error(`JSON command provider for ${account.slug} needs an absolute command and options.`);
    if (account.autonomy?.enabled) {
      if (account.autonomy.application?.kind !== "json-command" || !isAbsolute(account.autonomy.application?.command || "")) throw new Error(`Automatic channel ${account.slug} needs an absolute JSON-command application.`);
      const backlog = new Set((account.experimentBacklog || []).map((experiment) => experiment.id));
      for (const id of account.autonomy.allowedExperimentIds || []) if (!backlog.has(id)) throw new Error(`Automatic experiment ${id} is missing from ${account.slug}'s backlog.`);
    }
    for (const rule of account.topicRules || []) for (const pattern of rule.patterns || []) new RegExp(pattern, "iu");
  }
  return structuredClone(config);
}

function resolveConfigPath(value) {
  return value ? expandPath(value) : null;
}

function expandPath(value) {
  if (!value) return value;
  return isAbsolute(value) ? value : value.startsWith("~/") ? resolve(homedir(), value.slice(2)) : resolve(process.cwd(), value);
}

function valueAfter(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function usage() {
  console.error("Usage: node src/cli.mjs <doctor|collect|report|run> --config /absolute/path/config.json [--force] [--now ISO]");
  process.exit(2);
}

function gitRevision(root) {
  return new Promise((resolvePromise) => {
    const child = spawn("git", ["rev-parse", "HEAD"], {cwd: root, stdio: ["ignore", "pipe", "ignore"]});
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.on("error", () => resolvePromise(null));
    child.on("close", (code) => resolvePromise(code === 0 ? output.trim() : null));
  });
}
