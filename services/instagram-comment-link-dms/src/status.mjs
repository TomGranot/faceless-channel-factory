import {loadConfig} from "./config.mjs";
import {readJson} from "./io.mjs";

const config = await loadConfig();
const state = await readJson(config.statePath, {schemaVersion: 1, comments: {}});
const statuses = Object.values(state.comments || {}).reduce((result, item) => ({...result, [item.status]: (result[item.status] || 0) + 1}), {});
console.log(JSON.stringify({mode: config.mode, writeMode: config.writeMode, comments: Object.keys(state.comments || {}).length, statuses}, null, 2));
