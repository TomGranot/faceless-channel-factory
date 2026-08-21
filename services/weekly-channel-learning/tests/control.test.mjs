import assert from "node:assert/strict";
import test from "node:test";
import {assignmentArm, decideActiveExperiment, emptyControlState, planControlTransition} from "../src/control.mjs";

test("experiment assignment is stable", () => {
  const input = {channel: "example", experimentId: "proof", assignmentSalt: "abc", contentKey: "https://example.com/item/1/"};
  assert.equal(assignmentArm(input), assignmentArm({...input, contentKey: "https://example.com/item/1"}));
});

test("a variant is promoted only after the sample and guard pass", () => {
  const active = {activatedAt: "2026-08-01T00:00:00.000Z", minimumPairs: 6};
  assert.equal(decideActiveExperiment({active, evidence: {matchedPairs: 6, primaryLift: 0.18, guardLift: -0.02}, autonomy: {}, now: new Date("2026-08-21T00:00:00.000Z")}), "promoted");
  assert.equal(decideActiveExperiment({active, evidence: {matchedPairs: 6, primaryLift: 0.18, guardLift: -0.2}, autonomy: {}, now: new Date("2026-08-21T00:00:00.000Z")}), "reverted");
});

test("an experiment expires from its first measurable publication, not policy activation", () => {
  const active = {activatedAt: "2026-08-01T00:00:00.000Z", measurementStartsAt: "2026-09-01T00:00:00.000Z", minimumPairs: 6};
  assert.equal(decideActiveExperiment({active, evidence: {matchedPairs: 0}, autonomy: {maximumWeeks: 4}, now: new Date("2026-09-10T00:00:00.000Z")}), "continue");
});

test("only an allowlisted backlog experiment activates", () => {
  const account = {
    slug: "example",
    autonomy: {enabled: true, allowedExperimentIds: ["proof"], minimumPairs: 6},
    experimentBacklog: [{id: "proof", variable: "opening", control: "title", variant: "proof"}],
  };
  const review = {status: "completed", result: {verdict: "propose-one-controlled-test", nextExperiment: {id: "proof", holdFixed: ["topic", "time"], minimumPairs: 6}}};
  const result = planControlTransition({account, control: emptyControlState("example"), review, now: new Date("2026-08-21T10:00:00.000Z"), weekKey: "2026-W34", proposalHash: "proposal"});
  assert.equal(result.action, "activated");
  assert.equal(result.state.active.id, "proof");
  assert.equal(result.state.active.measurementStartsAt, "2026-08-21T10:00:00.000Z");
});
