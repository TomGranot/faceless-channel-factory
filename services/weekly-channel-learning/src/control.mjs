import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {isAbsolute} from "node:path";
import {stableHash} from "./io.mjs";

export function emptyControlState(channel) {
  return {
    schemaVersion: 1,
    channel,
    baseline: {promotedExperimentIds: []},
    active: null,
    history: [],
  };
}

export function assignmentArm({channel, experimentId, assignmentSalt, contentKey}) {
  const digest = createHash("sha256")
    .update(`${channel}:${experimentId}:${assignmentSalt}:${canonicalContentKey(contentKey)}`)
    .digest();
  return digest[0] % 2 === 0 ? "control" : "variant";
}

export function canonicalContentKey(value) {
  const raw = String(value || "").trim().replace(/[),.;!?]+$/u, "");
  if (!raw) return null;
  try {
    const url = new URL(raw);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/u, "");
    return url.toString();
  } catch {
    return raw.replace(/\s+/gu, " ");
  }
}

export function contentKeyFromPost(post) {
  const match = String(post.caption || "").match(/https?:\/\/[^\s<>]+/iu);
  return canonicalContentKey(match?.[0] || post.assignmentKey || null);
}

export function planControlTransition({account, control, experimentEvidence, review, now, weekKey, proposalHash}) {
  const autonomy = account.autonomy;
  if (!autonomy?.enabled) return {state: control, action: "disabled", evidence: experimentEvidence};

  if (control.active) {
    const decision = decideActiveExperiment({active: control.active, evidence: experimentEvidence, autonomy, now});
    if (decision === "continue") return {state: control, action: "continued", evidence: experimentEvidence};
    const completed = {
      ...control.active,
      status: decision,
      completedAt: now.toISOString(),
      completedWeek: weekKey,
      evidence: experimentEvidence,
    };
    return {
      action: decision,
      evidence: experimentEvidence,
      state: {
        ...control,
        baseline: {
          ...control.baseline,
          promotedExperimentIds: decision === "promoted"
            ? [...new Set([...(control.baseline?.promotedExperimentIds || []), control.active.id])]
            : [...(control.baseline?.promotedExperimentIds || [])],
        },
        active: null,
        history: [...(control.history || []), completed],
      },
    };
  }

  const candidate = review.status === "completed" && review.result?.verdict === "propose-one-controlled-test"
    ? review.result.nextExperiment
    : null;
  const backlog = (account.experimentBacklog || []).find((experiment) => experiment.id === candidate?.id);
  const allowed = new Set(autonomy.allowedExperimentIds || []);
  if (!candidate || !backlog || !allowed.has(candidate.id)) {
    return {state: control, action: "idle", evidence: null};
  }

  const active = {
    id: candidate.id,
    status: "active",
    activatedAt: now.toISOString(),
    activatedWeek: weekKey,
    measurementStartsAt: measurementStart(autonomy, now),
    proposalHash,
    assignmentSalt: stableHash({channel: account.slug, experimentId: candidate.id, proposalHash}).slice(0, 24),
    variable: backlog.variable,
    control: backlog.control,
    variant: backlog.variant,
    holdFixed: candidate.holdFixed,
    minimumPairs: Math.max(autonomy.minimumPairs ?? 6, candidate.minimumPairs ?? 6),
    primaryMetric: "plays at fixed post age",
    guardMetric: "engagements per play",
  };
  return {state: {...control, active}, action: "activated", evidence: null};
}

export function decideActiveExperiment({active, evidence, autonomy, now}) {
  const ageWeeks = Math.max(0, (now - new Date(active.measurementStartsAt || active.activatedAt)) / (7 * 86_400_000));
  const maximumWeeks = autonomy.maximumWeeks ?? 4;
  if (!evidence || evidence.matchedPairs < active.minimumPairs) {
    return ageWeeks >= maximumWeeks ? "reverted" : "continue";
  }
  const primaryLift = evidence.primaryLift;
  const guardLift = evidence.guardLift;
  if (Number.isFinite(guardLift) && guardLift < -(autonomy.maximumGuardDecline ?? 0.1)) return "reverted";
  if (Number.isFinite(primaryLift) && primaryLift >= (autonomy.minimumPrimaryLift ?? 0.1)) return "promoted";
  if (Number.isFinite(primaryLift) && primaryLift <= -(autonomy.maximumPrimaryLoss ?? 0.1)) return "reverted";
  return ageWeeks >= maximumWeeks ? "reverted" : "continue";
}

export function productionPolicy({account, state, now}) {
  return {
    schemaVersion: 1,
    channel: account.slug,
    generatedAt: now.toISOString(),
    baseline: {
      promotedExperimentIds: [...(state.baseline?.promotedExperimentIds || [])],
    },
    experiment: state.active ? {
      id: state.active.id,
      status: "active",
      activatedAt: state.active.activatedAt,
      measurementStartsAt: state.active.measurementStartsAt,
      proposalHash: state.active.proposalHash,
      assignmentSalt: state.active.assignmentSalt,
      variable: state.active.variable,
      control: state.active.control,
      variant: state.active.variant,
    } : null,
  };
}

function measurementStart(autonomy, now) {
  if (autonomy.measurementStartsAt) {
    const configured = new Date(autonomy.measurementStartsAt);
    if (Number.isNaN(configured.getTime()) || configured < now) throw new Error("autonomy.measurementStartsAt must be a future ISO timestamp when an experiment activates.");
    return configured.toISOString();
  }
  return new Date(now.getTime() + (autonomy.measurementDelayHours ?? 0) * 3_600_000).toISOString();
}

export async function applyProductionPolicy({application, channel, policy}) {
  if (application?.kind !== "json-command" || !isAbsolute(application.command || "")) {
    throw new Error(`Automatic channel ${channel} requires an absolute JSON-command application.`);
  }
  const policyHash = stableHash(policy);
  const input = {
    action: "apply-editorial-policy",
    channel,
    idempotencyKey: `${channel}:${policyHash}`,
    policyHash,
    policy,
    options: application.options || {},
  };
  const result = await run(application.command, JSON.stringify(input), application.timeoutMs ?? 90_000);
  if (result.code !== 0) throw new Error(`Policy application for ${channel} failed: ${result.stderr.slice(-2_000)}`);
  let receipt;
  try { receipt = JSON.parse(result.stdout); } catch (error) { throw new Error(`Policy application for ${channel} returned invalid JSON: ${error.message}`); }
  if (!["applied", "already-applied"].includes(receipt.status) || receipt.policyHash !== policyHash) {
    throw new Error(`Policy application for ${channel} returned an invalid receipt.`);
  }
  if (receipt.effectiveAt && Number.isNaN(new Date(receipt.effectiveAt).getTime())) throw new Error(`Policy application for ${channel} returned an invalid effectiveAt timestamp.`);
  return {...receipt, policyHash, effectiveAt: receipt.effectiveAt ? new Date(receipt.effectiveAt).toISOString() : null};
}

function run(command, input, timeoutMs) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, [], {stdio: ["pipe", "pipe", "pipe"]});
    let stdout = "";
    let stderr = "";
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      resolvePromise(result);
    };
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-8_000); });
    child.on("error", (error) => finish({code: 1, stdout, stderr: `${stderr}\n${error.message}`}));
    child.on("close", (code) => finish({code: code ?? 1, stdout, stderr}));
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    timer.unref();
    child.on("close", () => clearTimeout(timer));
    child.stdin.end(input);
  });
}
