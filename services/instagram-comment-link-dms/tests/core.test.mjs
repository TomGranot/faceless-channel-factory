import assert from "node:assert/strict";
import test from "node:test";
import {buildDm, matchesKeyword, publishedCampaigns, runCycle, sourceUrlFromCaption} from "../src/core.mjs";

const channels = [
  {id: "channel-alpha", postizIntegrationId: "fixture-channel-a", keyword: "SOURCE", ctaLinePrefix: "On Instagram, comment SOURCE", sourceLinePrefix: "Open the source →", dmPrefix: "Here’s the source link:", ownUsername: "channel_alpha_demo"},
  {id: "channel-beta", postizIntegrationId: "fixture-channel-b", keyword: "DETAIL", ctaLinePrefix: "On Instagram, comment DETAIL", sourceLinePrefix: "See the source record:", dmPrefix: "Here’s the source record:", ownUsername: "channel_beta_demo"},
];

test("keyword matching requires a complete word and ignores case", () => {
  assert.equal(matchesKeyword("source please", "SOURCE"), true);
  assert.equal(matchesKeyword("SOURCE!", "SOURCE"), true);
  assert.equal(matchesKeyword("sourcer", "SOURCE"), false);
});

test("source URL extraction uses the channel-owned caption line", () => {
  assert.equal(sourceUrlFromCaption("Open the source → https://example.com/a.\nOther", "Open the source →"), "https://example.com/a");
  assert.equal(sourceUrlFromCaption("Random https://example.com/a", "Open the source →"), null);
  assert.equal(sourceUrlFromCaption("Open the source → https://127.0.0.1/private", "Open the source →"), null);
  assert.equal(sourceUrlFromCaption("Open the source → https://%", "Open the source →"), null);
});

test("published campaigns bind an Instagram media ID to its own source URL", () => {
  const campaigns = publishedCampaigns([
    {id: "p1", state: "PUBLISHED", releaseId: "m1", integration: {id: "fixture-channel-a"}, content: "On Instagram, comment SOURCE and I’ll DM you the source link.\nOpen the source → https://example.com/item"},
    {id: "p2", state: "QUEUE", releaseId: "m2", integration: {id: "fixture-channel-a"}, content: "On Instagram, comment SOURCE and I’ll DM you the source link.\nOpen the source → https://example.com/future"},
    {id: "p3", state: "PUBLISHED", releaseId: "m3", integration: {id: "fixture-channel-a"}, content: "Open the source → https://example.com/old-batch"},
  ], channels);
  assert.equal(campaigns.length, 1);
  assert.equal(campaigns[0].mediaId, "m1");
  assert.equal(buildDm(campaigns[0]), "Here’s the source link: https://example.com/item");
});

test("a repeated poll sends one private reply per matching comment", async () => {
  const posts = [{id: "p1", state: "PUBLISHED", releaseId: "m1", integration: {id: "fixture-channel-a"}, content: "On Instagram, comment SOURCE and I’ll DM you the source link.\nOpen the source → https://example.com/item"}];
  const state = {schemaVersion: 1, comments: {}};
  const sent = [];
  const input = {
    posts,
    channels,
    listComments: async () => [{id: "c1", text: "SOURCE", username: "reader"}],
    sendPrivateReply: async (_campaign, comment, text) => { sent.push({comment, text}); return {id: "message-1"}; },
    state,
    saveState: async () => {},
    writesEnabled: true,
    maxWrites: 10,
  };
  const first = await runCycle(input);
  const second = await runCycle(input);
  assert.equal(first.sent, 1);
  assert.equal(second.deduplicated, 1);
  assert.equal(sent.length, 1);
  assert.equal(state.comments["channel-alpha:c1"].status, "sent");
});

test("an uncertain write is persisted and never retried automatically", async () => {
  const state = {schemaVersion: 1, comments: {}};
  let attempts = 0;
  const input = {
    posts: [{id: "p1", state: "PUBLISHED", releaseId: "m1", integration: {id: "fixture-channel-a"}, content: "On Instagram, comment SOURCE and I’ll DM you the source link.\nOpen the source → https://example.com/item"}],
    channels,
    listComments: async () => [{id: "c1", text: "SOURCE", username: "reader"}],
    sendPrivateReply: async () => { attempts += 1; const error = new Error("timeout"); error.ambiguous = true; error.code = "timeout"; throw error; },
    state,
    saveState: async () => {},
    writesEnabled: true,
    maxWrites: 10,
  };
  const first = await runCycle(input);
  const second = await runCycle(input);
  assert.equal(first.uncertain, 1);
  assert.equal(second.deduplicated, 1);
  assert.equal(attempts, 1);
  assert.equal(state.comments["channel-alpha:c1"].status, "uncertain");
});

test("a stale sending intent is quarantined instead of remaining invisible", async () => {
  const state = {
    schemaVersion: 1,
    comments: {
      "channel-alpha:c1": {
        status: "sending",
        attemptedAt: "2026-08-17T08:00:00.000Z",
      },
    },
  };
  let saves = 0;
  let sends = 0;
  const summary = await runCycle({
    posts: [{id: "p1", state: "PUBLISHED", releaseId: "m1", integration: {id: "fixture-channel-a"}, content: "On Instagram, comment SOURCE and I’ll DM you the source link.\nOpen the source → https://example.com/item"}],
    channels,
    listComments: async () => [{id: "c1", text: "SOURCE", username: "reader"}],
    sendPrivateReply: async () => { sends += 1; return {id: "message-1"}; },
    state,
    saveState: async () => { saves += 1; },
    writesEnabled: true,
    maxWrites: 10,
    now: () => new Date("2026-08-17T09:00:00.000Z"),
    sendingStaleAfterMs: 30 * 60_000,
  });
  assert.equal(summary.quarantined, 1);
  assert.equal(summary.deduplicated, 1);
  assert.equal(sends, 0);
  assert.equal(saves, 1);
  assert.equal(state.comments["channel-alpha:c1"].status, "uncertain");
  assert.equal(state.comments["channel-alpha:c1"].errorCode, "stale_sending_reconciliation_required");
});
