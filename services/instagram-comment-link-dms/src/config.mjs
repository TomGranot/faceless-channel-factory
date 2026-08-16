import {readFile} from "node:fs/promises";
import {absolute, assertMode600} from "./io.mjs";

export const LIVE_CONFIRMATION = "I_UNDERSTAND_INSTAGRAM_PRIVATE_REPLY_WRITES";

export async function loadConfig(env = process.env) {
  const mode = env.MODE || "fixture";
  const writeMode = env.WRITE_MODE || "disabled";
  if (!["fixture", "live"].includes(mode)) throw new Error("MODE must be fixture or live.");
  if (!["disabled", "live"].includes(writeMode)) throw new Error("WRITE_MODE must be disabled or live.");
  const channelsPath = absolute(env.CHANNELS_FILE || "config/channels.local.json");
  let channels;
  if (mode === "fixture") {
    channels = [
      {id: "channel-alpha", postizIntegrationId: "fixture-channel-a-instagram", instagramAccountId: "fixture-channel-a-account", accessTokenEnv: "CHANNEL_A_INSTAGRAM_ACCESS_TOKEN", keyword: "SOURCE", ctaLinePrefix: "On Instagram, comment SOURCE", sourceLinePrefix: "Open the source →", dmPrefix: "Here is the source:", ownUsername: "channel_alpha_demo"},
      {id: "channel-beta", postizIntegrationId: "fixture-channel-b-instagram", instagramAccountId: "fixture-channel-b-account", accessTokenEnv: "CHANNEL_B_INSTAGRAM_ACCESS_TOKEN", keyword: "DETAIL", ctaLinePrefix: "On Instagram, comment DETAIL", sourceLinePrefix: "See the source record:", dmPrefix: "Here is the source record:", ownUsername: "channel_beta_demo"},
    ];
  } else {
    const file = JSON.parse(await readFile(channelsPath, "utf8"));
    if (file.schemaVersion !== 1 || !Array.isArray(file.channels) || !file.channels.length) throw new Error("CHANNELS_FILE must contain schemaVersion 1 and at least one channel.");
    channels = file.channels;
  }
  for (const channel of channels) {
    for (const key of ["id", "postizIntegrationId", "instagramAccountId", "accessTokenEnv", "keyword", "ctaLinePrefix", "sourceLinePrefix", "dmPrefix"]) {
      if (!channel[key]) throw new Error(`Channel ${channel.id || "unknown"} is missing ${key}.`);
    }
    if (mode === "live" && !env[channel.accessTokenEnv]) throw new Error(`${channel.accessTokenEnv} is required.`);
  }
  if (mode === "live" && !env.POSTIZ_API_KEY) throw new Error("POSTIZ_API_KEY is required in live mode.");
  if (writeMode === "live") {
    if (mode !== "live") throw new Error("Live writes require MODE=live.");
    if (env.LIVE_CONFIRMATION !== LIVE_CONFIRMATION) throw new Error("Live writes require the exact LIVE_CONFIRMATION phrase.");
    if (!env.LIVE_UNLOCK_FILE) throw new Error("Live writes require LIVE_UNLOCK_FILE.");
    await assertMode600(env.LIVE_UNLOCK_FILE);
  }
  return {
    mode,
    writeMode,
    channels,
    statePath: absolute(env.STATE_FILE || "data/state.json"),
    fixturePostsPath: absolute(env.FIXTURE_POSTS_FILE || "fixtures/postiz-posts.json"),
    fixtureCommentsPath: absolute(env.FIXTURE_COMMENTS_FILE || "fixtures/instagram-comments.json"),
    postizBase: (env.POSTIZ_API_URL || "https://api.postiz.com/public/v1").replace(/\/$/u, ""),
    postizApiKey: env.POSTIZ_API_KEY,
    lookbackDays: boundedInteger(env.POSTIZ_LOOKBACK_DAYS, 120, 1, 365),
    graphBase: (env.INSTAGRAM_GRAPH_URL || "https://graph.instagram.com/v25.0").replace(/\/$/u, ""),
    maxCommentsPerPost: boundedInteger(env.MAX_COMMENTS_PER_POST, 500, 1, 1000),
    maxWritesPerRun: boundedInteger(env.MAX_WRITES_PER_RUN, 10, 1, 50),
    env,
  };
}

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = value == null || value === "" ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) throw new Error(`Expected an integer from ${minimum} to ${maximum}.`);
  return parsed;
}
