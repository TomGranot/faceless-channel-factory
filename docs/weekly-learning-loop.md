# Automate the weekly learning loop

The reference service in [`services/weekly-channel-learning`](../services/weekly-channel-learning/) turns recent Reel performance into one controlled experiment per channel.

It runs two schedules:

- a daily collector saves public counters so posts can be compared near the same publication age;
- a Monday reviewer studies the completed cohort, inspects contact sheets from the strongest and weakest Reels, and selects one bounded experiment.

The reviewer cannot change production. In proposal-only mode, the experiment remains unapplied. In owner-authorized automatic mode, a deterministic controller checks the experiment against the private allowlist, applies the policy through an idempotent adapter, and records the exact policy hash.

## Why collection runs daily

A Reel with ten days of distribution should not compete directly with one published yesterday. The collector saves one observation per reporting date. The analyzer uses the earliest observation between 72 and 108 hours after publication when available. During bootstrap, it labels lifetime counters and avoids treating them as fixed-age outcomes.

## Private and public state

Keep the installed account configuration, handles, source snapshots, contact sheets, reports, and proposal history outside Git. The repository contains only the service, schema, fixtures, and deployment examples.

The private config uses mode `0600`. Every generated JSON and Markdown artifact uses the same mode. Do not copy public release URLs, account names, raw provider responses, or reviewer inputs into a public case study.

## Reviewer boundary

The optional reviewer receives:

- the current fixed-age cohort;
- topic, duration, and posting-time summaries;
- the experiment backlog;
- contact sheets for up to three strong and three weak Reels.

It runs through `codex exec` with an ephemeral session, a read-only sandbox, a fixed JSON schema, and a ten-minute timeout. Captions and external source text remain untrusted data. The reviewer must distinguish observations from inferences and select one controlled experiment.

If the reviewer fails, the service keeps the deterministic report, records the failure, and leaves production unchanged. It does not retry through another model.

## Install on macOS

1. Copy `config/channels.example.json` into a private state directory.
2. Replace the example account, topic rules, channel context, and experiment backlog.
3. Set mode `0600` and run `doctor`.
4. Run `collect`, then `report`, and inspect the first report.
5. Copy the two example plists into `~/Library/LaunchAgents`, replace every absolute path, validate them with `plutil`, and bootstrap them with `launchctl`.

The daily schedule runs at 07:30 local time. The weekly schedule runs Monday at 09:05. macOS evaluates `StartCalendarInterval` in the machine's local timezone.

## Automatic control contract

An automatic experiment binds:

- channel and ISO week;
- proposal hash;
- one named variable;
- control and variant;
- fixed production conditions;
- primary metric and guard metric;
- minimum matched-pair count;
- expiration or completion condition;
- deterministic assignment salt;
- exact application policy hash and receipt.

Only treatments implemented by the channel runtime and named in the private allowlist may activate. The controller runs one experiment at a time. It promotes a passing variant into the baseline, reverts a loss or guard failure, and expires an inconclusive or starved test after the configured maximum.

Set the measurement start to the first publication that can contain the applied policy. Exclude content rendered or queued before activation even when it publishes later.

The loop does not control cadence, schedules, budgets, credentials, account ownership, rights gates, security settings, or already queued media.
