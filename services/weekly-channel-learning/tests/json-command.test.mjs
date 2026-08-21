import assert from "node:assert/strict";
import test from "node:test";
import {collectJsonCommandAccount} from "../src/json-command.mjs";

test("the JSON command adapter normalizes missing counters without a shell", async () => {
  const account = await collectJsonCommandAccount({
    slug: "example",
    provider: {
      command: "/bin/cat",
      options: {
        source: "fixture-command",
        profile: {followers: 2},
        posts: [{id: 7, publishedAt: "2026-08-20T10:00:00Z", plays: null}],
      },
    },
  });
  assert.equal(account.slug, "example");
  assert.equal(account.source, "fixture-command");
  assert.equal(account.posts[0].id, "7");
  assert.equal(account.posts[0].plays, null);
  assert.equal(account.posts[0].likes, null);
});
