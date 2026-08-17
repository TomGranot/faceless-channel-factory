import {quarantineStaleSending} from "./reconciliation.mjs";

const PRIVATE_HOST = /^(?:localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|\[?::1\]?$)/iu;

export function matchesKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, "iu").test(String(text || ""));
}

export function sourceUrlFromCaption(content, prefix) {
  const line = String(content || "").split(/\r?\n/u).find((candidate) => candidate.trim().startsWith(prefix));
  if (!line) return null;
  const match = line.slice(line.indexOf(prefix) + prefix.length).match(/https:\/\/[^\s<>]+/u);
  if (!match) return null;
  let url;
  try {
    url = new URL(match[0].replace(/[),.;!?]+$/u, ""));
  } catch {
    return null;
  }
  if (url.username || url.password || PRIVATE_HOST.test(url.hostname)) return null;
  return url.toString();
}

export function publishedCampaigns(posts, channels) {
  const byIntegration = new Map(channels.map((channel) => [channel.postizIntegrationId, channel]));
  const campaigns = [];
  for (const post of posts) {
    const channel = byIntegration.get(post.integration?.id);
    if (!channel || post.state !== "PUBLISHED" || !post.releaseId || post.releaseId === "missing") continue;
    const hasCtaLine = String(post.content || "").split(/\r?\n/u).some((line) => line.trim().startsWith(channel.ctaLinePrefix));
    if (!hasCtaLine) continue;
    const sourceUrl = sourceUrlFromCaption(post.content, channel.sourceLinePrefix);
    if (!sourceUrl) continue;
    campaigns.push({
      channel,
      postizPostId: String(post.id),
      mediaId: String(post.releaseId),
      sourceUrl,
    });
  }
  return campaigns;
}

export function buildDm(campaign) {
  return `${campaign.channel.dmPrefix} ${campaign.sourceUrl}`;
}

export async function runCycle({
  posts,
  channels,
  listComments,
  sendPrivateReply,
  state,
  saveState,
  writesEnabled,
  maxWrites,
  now = () => new Date(),
  sendingStaleAfterMs = 30 * 60_000,
}) {
  const campaigns = publishedCampaigns(posts, channels);
  const quarantined = quarantineStaleSending(state, {now, staleAfterMs: sendingStaleAfterMs});
  const summary = {campaigns: campaigns.length, commentsRead: 0, matched: 0, sent: 0, uncertain: 0, rejected: 0, quarantined: quarantined.length, deduplicated: 0, writesDisabled: 0};
  if (quarantined.length) await saveState(state);
  let writes = 0;
  for (const campaign of campaigns) {
    const comments = await listComments(campaign);
    summary.commentsRead += comments.length;
    for (const comment of comments) {
      if (!matchesKeyword(comment.text, campaign.channel.keyword)) continue;
      if (campaign.channel.ownUsername && String(comment.username || "").toLowerCase() === campaign.channel.ownUsername.toLowerCase()) continue;
      summary.matched += 1;
      const key = `${campaign.channel.id}:${comment.id}`;
      const existing = state.comments[key];
      if (existing) {
        summary.deduplicated += 1;
        continue;
      }
      if (!writesEnabled || writes >= maxWrites) {
        summary.writesDisabled += 1;
        continue;
      }
      state.comments[key] = {
        status: "sending",
        channelId: campaign.channel.id,
        mediaId: campaign.mediaId,
        postizPostId: campaign.postizPostId,
        commentId: String(comment.id),
        sourceUrl: campaign.sourceUrl,
        attemptedAt: now().toISOString(),
      };
      await saveState(state);
      writes += 1;
      try {
        const result = await sendPrivateReply(campaign, comment, buildDm(campaign));
        state.comments[key] = {...state.comments[key], status: "sent", providerMessageId: result.id, completedAt: now().toISOString()};
        summary.sent += 1;
      } catch (error) {
        const status = error?.ambiguous ? "uncertain" : "rejected";
        state.comments[key] = {...state.comments[key], status, errorCode: String(error?.code || "provider_error"), completedAt: now().toISOString()};
        summary[status] += 1;
      }
      await saveState(state);
    }
  }
  return summary;
}
