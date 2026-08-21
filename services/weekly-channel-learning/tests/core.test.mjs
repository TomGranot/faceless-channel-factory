import assert from "node:assert/strict";
import test from "node:test";
import {analyzeAccount, isoWeekKey, summarize} from "../src/core.mjs";

const account = {
  slug: "test",
  label: "Test",
  timezone: "Europe/Amsterdam",
  provider: {kind: "fixture", path: "fixture"},
  maturityHours: 72,
  cohortDays: 7,
  minimumCohortPosts: 3,
  minimumDecisionPosts: 6,
  topicRules: [{name: "surprise", patterns: ["hidden|secret|unexpected"]}],
};

test("ISO week keys follow the configured local date", () => {
  assert.equal(isoWeekKey(new Date("2026-08-17T08:00:00.000Z"), "Europe/Amsterdam"), "2026-W34");
});

test("missing metrics remain unavailable instead of becoming zero", () => {
  assert.deepEqual(summarize([{plays: null, likes: null, comments: null}]), {
    posts: 1,
    totalPlays: null,
    meanPlays: null,
    medianPlays: null,
    totalLikes: null,
    totalComments: null,
    engagementRate: null,
  });
});

test("analysis finds a repeated topic split without claiming causation", () => {
  const posts = [
    ["1", "Hidden mechanism", 900, 22], ["2", "Secret compartment", 800, 25], ["3", "Unexpected function", 700, 29],
    ["4", "Identify this", 180, 34], ["5", "Identify this painting", 160, 35], ["6", "Identify this scene", 140, 36],
  ].map(([id, caption, plays, durationSeconds], index) => ({
    id, shortcode: id, url: null, publishedAt: new Date(Date.UTC(2026, 7, 14 + Math.floor(index / 2), 8)).toISOString(),
    caption, durationSeconds, plays, likes: 1, comments: 0, videoUrl: null, thumbnailUrl: null,
  }));
  const snapshot = {collectedAt: "2026-08-21T10:00:00.000Z", accounts: [{slug: "test", source: "fixture", profile: {}, posts}]};
  const result = analyzeAccount({account, snapshot, snapshots: [snapshot], now: new Date(snapshot.collectedAt)});
  assert.equal(result.sample.posts, 6);
  assert.equal(result.cohortMode, "mature-age-window");
  assert.equal(result.byTopic[0].name, "surprise");
  assert.equal(result.deterministicAssessment.verdict, "propose-one-controlled-test");
  assert.match(result.deterministicAssessment.reason, /not randomized/);
});
