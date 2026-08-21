---
name: create-faceless-channel
description: Design, scaffold, deploy, operate, repair, or improve an automated faceless short-video channel built from auditable source discovery, rights evidence, browser capture, narration, captions, rendering, scheduling, analytics, alerts, and comment-to-DM fulfillment. Use for requests such as "create a faceless channel," "turn this source into daily videos," "fix the failed publishing automation," "schedule a month of posts," or "set up the accounts and automation." Skip one-off video edits and generic social-media advice.
---

# Create Faceless Channel

Build a channel as a measured publishing system. Keep source evidence, rendered media, account effects, cost, and recovery state connected from discovery through analytics.

## Establish the channel contract

Collect or infer these inputs:

1. Channel name, audience, and one-sentence promise.
2. The source to discover, scrape, or scroll through.
3. Selection rule and evidence required before publication.
4. Video treatment, narrator, captions, CTA, and thumbnail rule.
5. Platforms, posts per day, timezone, and posting windows.
6. Account mode: new brand-owned accounts, existing accounts, or a managed human setup.
7. Infrastructure: local preview, persistent cloud worker, Postiz, browser provider, voice provider, analytics, and AgentMail or another alert transport.
8. Budget ceiling and the metrics that decide whether the channel continues.

Ask one blocking question at a time. Infer reversible editorial defaults. Do not search for credentials or purchase accounts without explicit permission.

## Choose the execution branch

- **Design only:** produce the channel contract, account checklist, architecture, cost range, and acceptance criteria.
- **Scaffold:** run `scripts/scaffold_channel.py` and return the generated channel directory.
- **Build:** scaffold first, then implement source, capture, render, publishing, and operations adapters in that order.
- **Operate:** inspect the channel config, cloud timers, outbox, publication history, analytics, and failure alerts before changing production.
- **Improve:** change one content variable per batch and record the hypothesis in the channel history.

Read [references/pipeline-contract.md](references/pipeline-contract.md) before building or changing the runtime. Read [references/source-rights.md](references/source-rights.md) before scraping, storing source media, or pre-generating a queue. Read [references/production-regressions.md](references/production-regressions.md) when changing failure handling, recovery, captions, story structure, or render validation. Read [references/accounts-and-credentials.md](references/accounts-and-credentials.md) before connecting accounts or keys. Read [references/analytics-and-experiments.md](references/analytics-and-experiments.md) before interpreting performance or changing cadence. Read [references/configuration.md](references/configuration.md) when creating or validating `channel.json`. Read [references/channel-ideas.md](references/channel-ideas.md) only when the user wants new channel concepts.

## Scaffold a channel

Run from the factory repository:

```bash
python3 .agents/skills/create-faceless-channel/scripts/scaffold_channel.py \
  --root channels \
  --slug demo-radar \
  --name "Demo Radar" \
  --source "https://example.com/feed" \
  --source-kind feed \
  --platforms instagram,facebook,tiktok \
  --posts-per-day 3 \
  --timezone Europe/Amsterdam
```

The command refuses to overwrite an existing channel. Validate the result:

```bash
python3 .agents/skills/create-faceless-channel/scripts/validate_channel.py channels/demo-radar/channel.json
```

Before committing a production budget, look up each provider's current official price and run `scripts/estimate_monthly.py` with explicit fixed and per-video rates. Do not preserve stale provider prices in the skill.

## Build in gated stages

1. **Discover:** fetch candidates from a documented API, feed, page, repository list, or approved scraper.
2. **Select:** rank candidates and preserve the evidence behind every claim.
3. **Capture:** use a real browser, scan the page, and reject blank, broken, loading, or unsuitable sources. Derive saved-image dimensions through a media decoder because remote browsers may return bytes that do not match the requested format or filename.
4. **Write:** create varied scripts from source-specific facts. Reject repetition and malformed narration.
5. **Render:** produce a vertical source-led video, speech-aligned captions, and a useful first frame. Treat caption token whitespace as data: normalize word separators, preserve whitespace in the caption container, and test sentence-boundary pages before approval.
6. **Approve:** bind the approved render hash, rights state, destinations, and schedule.
7. **Publish:** use an idempotent outbox. Schedule feed posts and platform-supported Stories as separate effects.
8. **Observe:** log every mutation, collect platform metrics, send a concise daily operating digest, email failures, and change one variable per experiment.

When a CTA promises a link after a comment, treat fulfillment as part of publication rather than copy alone. Keep one per-post mapping from published media ID to destination URL, use an idempotent private-reply outbox, and verify the supported platform path before enabling the CTA.

Stop before publication when rights, render integrity, account ownership, destination IDs, schedule, or recovery state is unclear.

Treat the daily output target as a recovery objective. When a candidate fails, record the reason and continue through the ranked supply. When a batch fails, diagnose it, preserve valid artifacts, fix or bypass the failed stage, and start a same-day recovery while future posting windows remain. An alert starts recovery; it does not complete the task. Finish by querying the scheduler and confirming the required feed and Story effects for each platform. Stop only when a safety gate remains unresolved, no eligible source remains, or no valid publication window remains.

For unattended channels, connect terminal service failures to a bounded repair dispatcher on an authenticated operator machine or isolated worker. Give each failed invocation one stable key, claim it before starting the agent, cap repair attempts and wall time, and keep the agent inside an explicit repository, host, service, and mutation allowlist. Require a fresh regression check plus observable provider or scheduler verification. Send the owner the outcome after the attempt. Provider billing, credentials, account ownership, rights, security controls, and ambiguous external mutations remain human gates.

When a human clears an external gate such as a voice-provider subscription or quota, recheck the provider before resuming. Start one fresh service invocation, preserve valid artifacts and idempotency records, and let candidate-level content gates continue through the ranked supply. Verify provider output during the resumed run, then reconcile every required scheduler effect. Report the original blocker, the human action, the resumed invocation, and the observed result.

Send one daily digest after a fresh analytics snapshot. Keep platform metrics separate, compare views with exact one-day, one-week, and one-calendar-month saved reports, and label a missing baseline as `collecting`. Select time-series points by reporting date, never by provider array position, and never turn missing data into zero. When channel analytics are empty, aggregate tracked published-Reel metrics, disclose the fallback, and compare only against a baseline built from the same source. Label scheduler-account, scheduler-post, platform-native, and operator observations separately. State today's publication coverage, link one useful winner to its public release URL, and include only exceptions that require attention. After an owner resolves a historical provider failure, suppress it through a private resolution record that cannot hide later failures; never retry or replace the resolved publication without the owner's approval. Give each reporting day one durable delivery key, persist the exact payload before sending, and reuse both after an ambiguous failure so a reboot cannot duplicate or alter the email.

For cross-niche proof, snapshot every destination on one reporting date. Report publication counts for destinations whose analytics are empty, separate account metrics from post metrics, and disclose mismatched metric definitions. Compare normalized rates only when the numerator, denominator, observation window, and source match. Store public case studies as anonymized aggregates; keep handles, integration IDs, publication URLs, and raw responses in private operating records.

Serialize activity writes and Git-backed history sync with one repository-wide lock. Release that lock before logging a sync failure. Push high-frequency evidence to a dedicated branch or repository so operational commits do not advance the deployable release branch.

Keep generated files named by systemd `ReadWritePaths` outside immutable release directories. Link every writable path into the staged release before switching the active release, and retain the previous release until artifact counts and the service namespace pass verification.

Keep a private, append-only incident ledger with exact evidence and verification. Use a hand-reviewed allowlist as the sole source for public field notes. Public notes use relative operating time and generic failure classes; they exclude channel identity, provider coordinates, account data, infrastructure, and exact dates.

## Accounts and credentials

Support three paths:

- Create new project-owned social accounts.
- Connect accounts the owner already controls.
- Produce a checklist for a human operator or managed setup service.

Treat account setup as an explicit human gate. Require the owner or authorized operator to create or recover each account, verify phone and desktop logins, record recovery and MFA ownership, grant scheduler OAuth, and complete a private publication test. For Instagram, require a Professional account and a connected owner-controlled Facebook Page for the full publishing, analytics, cross-app inbox, and comment-reply path. Keep `accounts.humanSetup.status` below `ready` until every platform-specific check is present in `completedChecks`.

Managed in-country setup may reduce manual device work. Recheck the provider's current platforms, terms, price, ownership handoff, and recovery path before purchase. A provider that handles TikTok and Instagram does not satisfy Facebook Page linking or YouTube setup.

Do not automate social-account purchases or transfers. Keep secrets in a host secret store or root-readable environment file. Commit only `.env.example` names. Use scoped keys when providers support them.

Provision one dedicated AgentMail inbox per channel when the owner has an AgentMail account. Use it for the daily operating digest and terminal failure alerts, with labels separating those message types. Create an inbox-scoped send-only key, store it outside Git, send one test digest and one test failure alert, and verify both in the recipient mailbox before enabling unattended production. Add an inbox-scoped webhook only when the channel needs inbound mail or delivery lifecycle events. Follow the exact variables, permissions, and acceptance test in [references/accounts-and-credentials.md](references/accounts-and-credentials.md).

## Completion gate

Do not call a channel ready until:

- its source adapter returns candidates with evidence;
- capture quality rejects a known broken page;
- one preview video passes visual and narration review;
- publication dry-run names every destination and future time;
- `accounts.humanSetup.status` is `ready`, including Instagram Professional and linked-Page checks when Instagram is a destination;
- a private test post reconciles to a provider post ID and release URL;
- cloud timers, bounded retries, outbox state, activity history, analytics, the daily digest, and terminal failure email work;
- the README states current costs and platform limitations;
- the skill references and channel config match the implemented behavior.

When production credentials are missing, finish everything that does not require them and return one exact connection checklist.

## Keep the skill current

When a channel exposes a reusable production lesson, update this skill in the same change as the runtime or documentation. Add a regression case for every confirmed failure. Keep channel-specific IDs, credentials, customer information, and temporary workarounds out of the shared skill.
