import {loadConfig} from "./config.mjs";
import {runCycle} from "./core.mjs";
import {atomicJson, readJson, withDirectoryLock} from "./io.mjs";
import {fixtureCommentReader, listPosts, liveCommentReader, privateReplySender} from "./providers.mjs";

const config = await loadConfig();
const summary = await withDirectoryLock(`${config.statePath}.run-lock`, async () => {
  const state = await readJson(config.statePath, {schemaVersion: 1, comments: {}});
  if (state.schemaVersion !== 1 || typeof state.comments !== "object") throw new Error("STATE_FILE has an unsupported schema.");
  const posts = await listPosts(config);
  const listComments = config.mode === "fixture" ? await fixtureCommentReader(config) : liveCommentReader(config);
  return runCycle({
    posts,
    channels: config.channels,
    listComments,
    sendPrivateReply: privateReplySender(config),
    state,
    saveState: (value) => atomicJson(config.statePath, value),
    writesEnabled: config.writeMode === "live" || config.mode === "fixture",
    maxWrites: config.maxWritesPerRun,
  });
});
console.log(JSON.stringify({mode: config.mode, writeMode: config.writeMode, ...summary}, null, 2));
