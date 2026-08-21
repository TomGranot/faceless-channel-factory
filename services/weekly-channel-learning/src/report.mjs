export function renderAccountReport(analysis, review, transition = {action: "disabled", evidence: null}, application = null) {
  const lines = [
    `# ${escapeText(analysis.label)} weekly learning report`,
    "",
    `Collected: ${analysis.collectedAt}`,
    `Metric source: ${analysis.source}`,
    `Cohort mode: ${analysis.cohortMode}`,
    "",
    "## Decision",
    "",
  ];

  if (review.status === "completed") {
    lines.push(review.result.summary, "", `Verdict: **${review.result.verdict}**`, "");
  } else {
    lines.push(analysis.deterministicAssessment.reason, "", `Verdict: **${analysis.deterministicAssessment.verdict}**`, "");
  }

  lines.push(
    "## Evidence window",
    "",
    analysis.cohortWarning,
    "",
    "| Posts | Fixed-age observations | Total plays | Median plays | Mean plays | Engagement per play |",
    "| ---: | ---: | ---: | ---: | ---: | ---: |",
    `| ${analysis.sample.posts} | ${analysis.standardizedPosts} | ${number(analysis.sample.totalPlays)} | ${number(analysis.sample.medianPlays)} | ${number(analysis.sample.meanPlays)} | ${percent(analysis.sample.engagementRate)} |`,
    "",
    "## Highest and lowest results",
    "",
    "| Result | Reel | Topic | Plays | Likes | Comments | Duration | Window |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...analysis.top.map((post) => postRow("Top", post)),
    ...analysis.bottom.map((post) => postRow("Bottom", post)),
    "",
    "## Observed factor splits",
    "",
    ...factorTable("Topic", analysis.byTopic),
    "",
    ...factorTable("Duration", analysis.byDuration),
    "",
    ...factorTable("Posting time", analysis.byTime),
    "",
  );

  if (review.status === "completed") {
    lines.push("## Visual review", "");
    for (const observation of review.result.observations) {
      lines.push(`- **${escapeText(observation.evidence)}:** ${escapeText(observation.interpretation)} Confidence: ${observation.confidence}.`);
    }
    lines.push("", "## Next controlled experiment", "");
    const experiment = review.result.nextExperiment;
    lines.push(
      `- Variable: **${escapeText(experiment.variable)}**`,
      `- Hypothesis: ${escapeText(experiment.hypothesis)}`,
      `- Control: ${escapeText(experiment.control)}`,
      `- Variant: ${escapeText(experiment.variant)}`,
      `- Hold fixed: ${experiment.holdFixed.map(escapeText).join(", ")}`,
      `- Minimum sample: ${experiment.minimumPairs} matched pairs`,
      `- Primary metric: ${escapeText(experiment.primaryMetric)}`,
      `- Guard metric: ${escapeText(experiment.guardMetric)}`,
      `- Decision rule: ${escapeText(experiment.decisionRule)}`,
      "",
    );
  } else {
    lines.push(
      "## Review status",
      "",
      `The visual reviewer status is **${review.status}**. The system preserved the metrics and made no editorial change.`,
      review.error ? `Error: ${escapeText(review.error)}` : "",
      "",
    );
  }

  lines.push(
    "## Automatic control loop",
    "",
    `Lifecycle action: **${escapeText(transition.action)}**`,
    application ? `Applied policy: \`${application.policyHash}\` (${escapeText(application.status)})` : "Automatic application is disabled for this channel.",
    "",
    ...experimentEvidence(transition.evidence),
    "",
    "## Missing evidence",
    "",
    "Public counters do not expose reach, average watch time, retention, sends, saves, attributed follows, or follower versus non-follower distribution. Import platform-native Insights before treating a recommendation as causal.",
    "",
    "## Control boundary",
    "",
    "The loop may apply only an allowlisted editorial treatment. It cannot change schedules, posting cadence, budgets, credentials, account ownership, rights gates, or already queued media.",
    "",
  );
  return `${lines.filter((line) => line !== undefined).join("\n")}\n`;
}

export function proposalFromReview({analysis, review, weekKey, proposalHash, transition = {action: "disabled", evidence: null}, application = null}) {
  return {
    schemaVersion: 1,
    weekKey,
    channel: analysis.slug,
    status: transition.action,
    proposalHash,
    generatedAt: new Date().toISOString(),
    evidence: {
      collectedAt: analysis.collectedAt,
      source: analysis.source,
      cohortMode: analysis.cohortMode,
      posts: analysis.sample.posts,
    },
    verdict: review.status === "completed" ? review.result.verdict : analysis.deterministicAssessment.verdict,
    nextExperiment: review.status === "completed" ? review.result.nextExperiment : null,
    control: {action: transition.action, evidence: transition.evidence},
    application,
  };
}

function experimentEvidence(evidence) {
  if (!evidence) return ["No active experiment has fixed-age results yet."];
  return [
    "| Experiment | Matched pairs | Control median plays | Variant median plays | Primary lift | Guard lift |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    `| ${escapeText(evidence.experimentId)} | ${evidence.matchedPairs} | ${number(evidence.control.medianPlays)} | ${number(evidence.variant.medianPlays)} | ${percent(evidence.primaryLift)} | ${percent(evidence.guardLift)} |`,
  ];
}

function factorTable(label, rows) {
  return [
    `### ${label}`,
    "",
    "| Group | Posts | Median plays | Mean plays | Engagement per play |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${escapeText(row.name)} | ${row.posts} | ${number(row.medianPlays)} | ${number(row.meanPlays)} | ${percent(row.engagementRate)} |`),
  ];
}

function postRow(result, post) {
  const title = post.url ? `[${escapeText(post.title)}](${post.url})` : escapeText(post.title);
  return `| ${result} | ${title} | ${escapeText(post.topic)} | ${number(post.plays)} | ${number(post.likes)} | ${number(post.comments)} | ${number(post.durationSeconds)}s | ${post.metricWindow} |`;
}

function number(value) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString("en-US") : "unavailable";
}

function percent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "unavailable";
}

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .trim();
}
