import assert from "node:assert/strict";
import test from "node:test";
import {reviewerArguments} from "../src/reviewer.mjs";

test("the reviewer prompt is positional and cannot be consumed as an image path", () => {
  const args = reviewerArguments({
    prompt: "Review this evidence",
    runRoot: "/tmp/run",
    schemaPath: "/tmp/schema.json",
    outputPath: "/tmp/output.json",
    model: "test-model",
    assets: [{path: "/tmp/one.jpg"}, {path: "/tmp/two.jpg"}],
  });
  assert.deepEqual(args.slice(0, 2), ["exec", "Review this evidence"]);
  assert.equal(args.at(-1), "/tmp/two.jpg");
});
