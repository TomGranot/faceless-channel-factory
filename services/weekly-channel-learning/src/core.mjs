import {assignmentArm, contentKeyFromPost} from "./control.mjs";

const DAY_MS = 86_400_000;

export function localDate(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isoWeekKey(date, timeZone) {
  const parts = localDate(date, timeZone).split("-").map(Number);
  const current = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((current - yearStart) / DAY_MS) + 1) / 7);
  return `${current.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function analyzeAccount({account, snapshot, snapshots = [], now = new Date()}) {
  const maturityHours = account.maturityHours ?? 72;
  const cohortDays = account.cohortDays ?? 7;
  const current = snapshot.accounts.find((candidate) => candidate.slug === account.slug);
  if (!current) throw new Error(`Snapshot is missing account ${account.slug}.`);

  const observations = buildObservations(account.slug, snapshots);
  const cohort = current.posts
    .filter((post) => post.publishedAt && post.plays !== null)
    .map((post) => ({...post, ageHours: (now - new Date(post.publishedAt)) / 3_600_000}))
    .filter((post) => post.ageHours >= maturityHours && post.ageHours < maturityHours + cohortDays * 24)
    .map((post) => standardizedObservation(post, observations.get(post.id), maturityHours));

  const fallback = cohort.length < (account.minimumCohortPosts ?? 3);
  const selected = fallback
    ? current.posts
      .filter((post) => post.publishedAt && post.plays !== null)
      .map((post) => ({...post, ageHours: (now - new Date(post.publishedAt)) / 3_600_000, metricWindow: "bootstrap-lifetime"}))
    : cohort;

  const coded = selected.map((post) => codePost(post, account));
  const standardizedPosts = coded.filter((post) => post.metricWindow === `${maturityHours}h-snapshot`).length;
  const byTopic = groupSummary(coded, (post) => post.topic);
  const byDuration = groupSummary(coded, (post) => durationBucket(post.durationSeconds));
  const byTime = groupSummary(coded, (post) => timeBucket(post.publishedAt, account.timezone));
  const ranked = [...coded].sort((a, b) => (b.plays ?? -1) - (a.plays ?? -1));
  const sample = summarize(coded);

  return {
    slug: account.slug,
    label: account.label,
    source: current.source,
    collectedAt: snapshot.collectedAt,
    followers: current.profile?.followers ?? null,
    sample,
    cohortMode: fallback ? "bootstrap-lifetime" : standardizedPosts === coded.length ? `${maturityHours}h-standardized` : "mature-age-window",
    standardizedPosts,
    cohortWarning: fallback
      ? `Fewer than ${account.minimumCohortPosts ?? 3} posts fell in the ${maturityHours}-${maturityHours + cohortDays * 24} hour cohort. The report uses lifetime counters and does not compare them as equal-age outcomes.`
      : `${standardizedPosts} of ${coded.length} posts use a saved ${maturityHours}-hour observation. The remaining posts use current lifetime counters from the ${maturityHours}-${maturityHours + cohortDays * 24} hour age window and are not equal-age outcomes.`,
    posts: coded,
    top: ranked.slice(0, Math.min(3, ranked.length)),
    bottom: ranked.slice(Math.max(0, ranked.length - 3)).reverse(),
    byTopic,
    byDuration,
    byTime,
    deterministicAssessment: deterministicAssessment({account, sample, byTopic, byDuration, byTime}),
  };
}

export function analyzeActiveExperiment({account, snapshots = [], control, now = new Date()}) {
  const active = control?.active;
  if (!active) return null;
  const observations = buildObservations(account.slug, snapshots);
  const latestByPost = new Map();
  for (const snapshot of snapshots) {
    const current = snapshot.accounts?.find((candidate) => candidate.slug === account.slug);
    for (const post of current?.posts || []) latestByPost.set(post.id, post);
  }
  const maturityHours = account.maturityHours ?? 72;
  const posts = [...latestByPost.values()]
    .filter((post) => post.publishedAt && new Date(post.publishedAt) >= new Date(active.measurementStartsAt || active.activatedAt))
    .filter((post) => now - new Date(post.publishedAt) >= maturityHours * 3_600_000)
    .map((post) => standardizedObservation(post, observations.get(post.id), maturityHours))
    .filter((post) => post.metricWindow === `${maturityHours}h-snapshot` && Number.isFinite(post.plays))
    .map((post) => {
      const contentKey = contentKeyFromPost(post);
      if (!contentKey) return null;
      const arm = assignmentArm({
        channel: account.slug,
        experimentId: active.id,
        assignmentSalt: active.assignmentSalt,
        contentKey,
      });
      return {...codePost(post, account), contentKey, arm};
    })
    .filter(Boolean);
  const controlPosts = posts.filter((post) => post.arm === "control");
  const variantPosts = posts.filter((post) => post.arm === "variant");
  const controlSummary = summarize(controlPosts);
  const variantSummary = summarize(variantPosts);
  return {
    experimentId: active.id,
    activatedAt: active.activatedAt,
    maturityHours,
    matchedPairs: Math.min(controlPosts.length, variantPosts.length),
    totalPosts: posts.length,
    control: controlSummary,
    variant: variantSummary,
    primaryLift: ratioLift(variantSummary.medianPlays, controlSummary.medianPlays),
    guardLift: ratioLift(variantSummary.engagementRate, controlSummary.engagementRate),
    posts: posts.map(({id, shortcode, publishedAt, plays, likes, comments, engagementRate, arm, contentKey}) => ({id, shortcode, publishedAt, plays, likes, comments, engagementRate, arm, contentKey})),
  };
}

function buildObservations(slug, snapshots) {
  const byPost = new Map();
  for (const snapshot of snapshots) {
    const account = snapshot.accounts?.find((candidate) => candidate.slug === slug);
    if (!account) continue;
    for (const post of account.posts || []) {
      const list = byPost.get(post.id) || [];
      list.push({...post, observedAt: snapshot.collectedAt});
      byPost.set(post.id, list);
    }
  }
  for (const list of byPost.values()) list.sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt));
  return byPost;
}

function standardizedObservation(post, observations = [], maturityHours) {
  const target = new Date(post.publishedAt).getTime() + maturityHours * 3_600_000;
  const match = observations.find((item) => {
    const observed = new Date(item.observedAt).getTime();
    return observed >= target && observed <= target + 36 * 3_600_000 && item.plays !== null;
  });
  return match
    ? {...post, plays: match.plays, likes: match.likes, comments: match.comments, metricWindow: `${maturityHours}h-snapshot`, metricObservedAt: match.observedAt}
    : {...post, metricWindow: "current-lifetime"};
}

function codePost(post, account) {
  const text = `${post.caption || ""}`;
  const topic = (account.topicRules || []).find((rule) =>
    (rule.patterns || []).some((pattern) => new RegExp(pattern, "iu").test(text)),
  )?.name || "other";
  const engagements = sumAvailable(post.likes, post.comments);
  return {
    ...post,
    title: firstMeaningfulLine(text) || post.shortcode || post.id,
    topic,
    engagements,
    engagementRate: post.plays > 0 && engagements !== null ? engagements / post.plays : null,
  };
}

function firstMeaningfulLine(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).find(Boolean)?.slice(0, 140) || "";
}

function sumAvailable(...values) {
  const available = values.filter((value) => Number.isFinite(value));
  return available.length ? available.reduce((sum, value) => sum + value, 0) : null;
}

export function summarize(posts) {
  const plays = posts.map((post) => post.plays).filter(Number.isFinite);
  const likes = posts.map((post) => post.likes).filter(Number.isFinite);
  const comments = posts.map((post) => post.comments).filter(Number.isFinite);
  const totalPlays = plays.length ? plays.reduce((sum, value) => sum + value, 0) : null;
  const totalEngagements = [...likes, ...comments].reduce((sum, value) => sum + value, 0);
  return {
    posts: posts.length,
    totalPlays,
    meanPlays: mean(plays),
    medianPlays: median(plays),
    totalLikes: likes.length ? likes.reduce((sum, value) => sum + value, 0) : null,
    totalComments: comments.length ? comments.reduce((sum, value) => sum + value, 0) : null,
    engagementRate: totalPlays > 0 ? totalEngagements / totalPlays : null,
  };
}

function groupSummary(posts, key) {
  const groups = new Map();
  for (const post of posts) {
    const name = key(post);
    const values = groups.get(name) || [];
    values.push(post);
    groups.set(name, values);
  }
  return [...groups.entries()]
    .map(([name, values]) => ({name, ...summarize(values)}))
    .sort((a, b) => (b.medianPlays ?? -1) - (a.medianPlays ?? -1));
}

function deterministicAssessment({account, sample, byTopic, byDuration, byTime}) {
  if (sample.posts < (account.minimumDecisionPosts ?? 6)) {
    return {
      verdict: "collect-more-evidence",
      reason: `Only ${sample.posts} comparable posts are available; the decision threshold is ${account.minimumDecisionPosts ?? 6}.`,
      strongestSignals: [],
    };
  }
  const signals = [
    factorSignal("topic", byTopic),
    factorSignal("duration", byDuration),
    factorSignal("posting-time", byTime),
  ].filter(Boolean).sort((a, b) => b.medianRatio - a.medianRatio);
  return {
    verdict: "propose-one-controlled-test",
    reason: signals[0]
      ? `${signals[0].factor} has the largest observed median split, but the posts were not randomized.`
      : "No factor has enough observations on both sides for a directional comparison.",
    strongestSignals: signals,
  };
}

function factorSignal(factor, groups) {
  const eligible = groups.filter((group) => group.posts >= 3 && Number.isFinite(group.medianPlays) && group.medianPlays > 0);
  if (eligible.length < 2) return null;
  const strongest = eligible[0];
  const weakest = eligible.at(-1);
  return {
    factor,
    strongest: strongest.name,
    weakest: weakest.name,
    medianRatio: strongest.medianPlays / weakest.medianPlays,
    strongestPosts: strongest.posts,
    weakestPosts: weakest.posts,
  };
}

function durationBucket(seconds) {
  if (!Number.isFinite(seconds)) return "unavailable";
  if (seconds < 24) return "under-24s";
  if (seconds <= 31) return "24-31s";
  return "over-31s";
}

function timeBucket(value, timeZone) {
  if (!value) return "unavailable";
  const hour = Number(new Intl.DateTimeFormat("en-GB", {timeZone, hour: "2-digit", hourCycle: "h23"}).format(new Date(value)));
  if (hour < 12) return "morning";
  if (hour < 16) return "midday";
  if (hour < 20) return "afternoon";
  return "evening";
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function ratioLift(variant, control) {
  return Number.isFinite(variant) && Number.isFinite(control) && control > 0 ? variant / control - 1 : null;
}

function median(values) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}
