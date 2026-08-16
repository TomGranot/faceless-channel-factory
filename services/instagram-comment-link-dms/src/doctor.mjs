import {loadConfig} from "./config.mjs";

const config = await loadConfig();
console.log(JSON.stringify({status: "ready", mode: config.mode, writeMode: config.writeMode, channels: config.channels.map(({id, keyword}) => ({id, keyword})), providerRequestsMade: 0}, null, 2));
