# Weekly channel learning

This service turns faceless-channel analytics into one bounded weekly experiment. It collects Reel counters each day through a private JSON-command adapter, preserves metric provenance, reviews a fixed-age cohort, compares topic, duration, and posting-time groups, and optionally asks a read-only Codex reviewer to inspect contact sheets from the strongest and weakest Reels.

Proposal-only mode is the default. When the owner enables `autonomy`, the controller may activate one allowlisted editorial treatment, write a versioned production policy through a private adapter, measure deterministic control and variant assignments, and promote or revert the treatment automatically.

## Install

Copy the example configuration outside Git, replace the account and editorial fields, and restrict the file:

```bash
cp config/channels.example.json "/private/path/channels.json"
chmod 600 "/private/path/channels.json"
```

Check the runtime, collect one snapshot, and produce a report:

```bash
node src/cli.mjs doctor --config "/private/path/channels.json"
node src/cli.mjs collect --config "/private/path/channels.json"
node src/cli.mjs report --config "/private/path/channels.json"
```

Install the two example LaunchAgents for daily evidence collection and a Monday report. Daily collection lets the analyzer compare posts near the same 72-hour age. The first run labels lifetime-counter comparisons as `bootstrap-lifetime` when no fixed-age history exists.

## Evidence contract

- Store each daily source snapshot once. Re-running the collector on the same reporting date is a no-op.
- Keep missing provider metrics as `null`.
- Use the earliest saved observation between 72 and 108 hours after publication when available.
- Require at least three posts in a weekly cohort and six before proposing a controlled test.
- Treat factor splits as associations because posting time, topic, duration, and creative were not randomized.
- Save the repository revision, config hash, evidence timestamp, reviewer result, and proposal hash in each run.
- Run Codex with a read-only sandbox. Source captions remain untrusted data.
- Run one active experiment per channel.
- Reconstruct the arm from the source URL in the caption and the stored assignment salt.
- Require an exact policy-hash receipt before saving a lifecycle transition.
- Revert a loss, guard failure, expired test, or test that never reaches its minimum sample.

The repository does not ship account-specific endpoints, identifiers, or credentials. Configure `provider.kind` as `json-command` and point it to a private executable. The service sends `provider.options` to that command over standard input and expects one JSON object with `source`, `profile`, and `posts`. Each post may contain `id`, `shortcode`, `url`, `publishedAt`, `caption`, `durationSeconds`, `plays`, `likes`, `comments`, `videoUrl`, and `thumbnailUrl`.

The current local collector supplies public play, like, and comment counters. Those fields cannot replace reach, retention, average watch time, sends, saves, attributed follows, or follower split. Import platform-native Insights before using those metrics or making a causal claim.

## Automatic mode

Set `autonomy.enabled` only after the owner authorizes self-adjustment. Configure:

- `allowedExperimentIds`: treatments implemented by the channel runtime;
- `minimumPairs`: the minimum balanced control and variant sample;
- `measurementDelayHours` or `measurementStartsAt`: the first publication that can contain the new policy, excluding media already rendered or queued;
- `maximumWeeks`: expiration for an inconclusive or starved test;
- primary lift, loss, and guard-decline thresholds;
- an absolute private JSON-command application path.

The application receives the channel, policy, policy hash, and idempotency key on standard input. It must apply the policy atomically and return `applied` or `already-applied` with the same policy hash. It should also return `effectiveAt`, the first publication not already rendered or queued when the policy was applied. The controller rejects any other receipt and uses `effectiveAt` as the measurement boundary.

Automatic mode cannot change posting cadence, schedules, budgets, credentials, account ownership, rights gates, security controls, or already queued media.
