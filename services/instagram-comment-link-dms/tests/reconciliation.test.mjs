import assert from "node:assert/strict";
import test from "node:test";
import {RETRY_CONFIRMATION, applyReconciliationDecision, quarantineStaleSending} from "../src/reconciliation.mjs";

test("confirmed sent reconciliation preserves the deduplication record", () => {
  const state = {schemaVersion: 1, comments: {"channel-alpha:c1": {status: "uncertain"}}};
  applyReconciliationDecision(state, {
    key: "channel-alpha:c1",
    outcome: "confirmed-sent",
    providerMessageId: "message-1",
    now: () => new Date("2026-08-17T09:00:00.000Z"),
  });
  assert.deepEqual(state.comments["channel-alpha:c1"], {
    status: "sent",
    providerMessageId: "message-1",
    reconciledAt: "2026-08-17T09:00:00.000Z",
  });
});

test("confirmed not sent reconciliation requires an explicit duplicate-risk confirmation", () => {
  const state = {schemaVersion: 1, comments: {"channel-alpha:c1": {status: "uncertain"}}};
  assert.throws(
    () => applyReconciliationDecision(state, {key: "channel-alpha:c1", outcome: "confirmed-not-sent"}),
    /confirmation/i,
  );
  applyReconciliationDecision(state, {
    key: "channel-alpha:c1",
    outcome: "confirmed-not-sent",
    confirmation: RETRY_CONFIRMATION,
  });
  assert.equal(state.comments["channel-alpha:c1"], undefined);
});

test("a sending intent with no usable timestamp is quarantined", () => {
  const state = {schemaVersion: 1, comments: {"channel-alpha:c1": {status: "sending"}}};
  const quarantined = quarantineStaleSending(state, {now: () => new Date("2026-08-17T09:00:00.000Z")});
  assert.deepEqual(quarantined, ["channel-alpha:c1"]);
  assert.equal(state.comments["channel-alpha:c1"].status, "uncertain");
  assert.equal(state.comments["channel-alpha:c1"].errorCode, "invalid_sending_timestamp_reconciliation_required");
});
