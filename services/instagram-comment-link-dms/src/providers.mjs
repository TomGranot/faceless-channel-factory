import {readJson} from "./io.mjs";

export async function listPosts(config) {
  if (config.mode === "fixture") return readJson(config.fixturePostsPath, []);
  const end = new Date();
  const start = new Date(end.getTime() - config.lookbackDays * 86_400_000);
  const query = new URLSearchParams({startDate: start.toISOString(), endDate: end.toISOString()});
  const response = await readRequest(`${config.postizBase}/posts?${query}`, {Authorization: config.postizApiKey});
  return Array.isArray(response) ? response : response.posts || response.data || [];
}

export async function fixtureCommentReader(config) {
  const comments = await readJson(config.fixtureCommentsPath, {});
  return async (campaign) => comments[campaign.mediaId] || [];
}

export function liveCommentReader(config) {
  return async (campaign) => {
    const token = config.env[campaign.channel.accessTokenEnv];
    const comments = [];
    let after = null;
    while (comments.length < config.maxCommentsPerPost) {
      const query = new URLSearchParams({fields: "id,text,username,timestamp", limit: String(Math.min(100, config.maxCommentsPerPost - comments.length)), ...(after ? {after} : {})});
      const body = await readRequest(`${config.graphBase}/${encodeURIComponent(campaign.mediaId)}/comments?${query}`, {Authorization: `Bearer ${token}`});
      comments.push(...(body.data || []));
      after = body.paging?.cursors?.after || null;
      if (!after || !(body.data || []).length) break;
    }
    return comments;
  };
}

export function privateReplySender(config) {
  if (config.mode === "fixture") return async (_campaign, comment) => ({id: `fixture-message-${comment.id}`});
  return async (campaign, comment, text) => {
    const token = config.env[campaign.channel.accessTokenEnv];
    let response;
    try {
      response = await fetch(`${config.graphBase}/${encodeURIComponent(campaign.channel.instagramAccountId)}/messages`, {
        method: "POST",
        headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
        body: JSON.stringify({recipient: {comment_id: String(comment.id)}, message: {text}}),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      const error = new Error("Instagram private reply outcome is uncertain.");
      error.ambiguous = true;
      error.code = "instagram_network_uncertain";
      throw error;
    }
    const body = await response.text();
    if (!response.ok) {
      const error = new Error("Instagram private reply was not confirmed.");
      error.ambiguous = response.status === 408 || response.status === 429 || response.status >= 500;
      error.code = `instagram_http_${response.status}`;
      throw error;
    }
    let parsed;
    try {
      parsed = body ? JSON.parse(body) : {};
    } catch {
      const error = new Error("Instagram returned an unreadable success response.");
      error.ambiguous = true;
      error.code = "instagram_invalid_success_body";
      throw error;
    }
    if (!parsed.message_id && !parsed.id) {
      const error = new Error("Instagram returned no stable message ID.");
      error.ambiguous = true;
      error.code = "instagram_missing_message_id";
      throw error;
    }
    return {id: parsed.message_id || parsed.id};
  };
}

async function readRequest(url, headers) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {headers, signal: AbortSignal.timeout(20_000)});
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolvePromise) => setTimeout(resolvePromise, 250 * 2 ** attempt));
      continue;
    }
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`Read returned HTTP ${response.status}.`);
    lastError = new Error(`Read returned HTTP ${response.status}.`);
    if (attempt < 2) await new Promise((resolvePromise) => setTimeout(resolvePromise, 250 * 2 ** attempt));
  }
  throw lastError || new Error("Provider read failed.");
}
