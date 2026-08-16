# Pipeline contract

Use this reference when building or changing a channel runtime.

## Stages and artifacts

| Stage | Required artifact | Gate |
| --- | --- | --- |
| Discover | Candidate records with stable source IDs | Source responds and terms permit the intended use |
| Select | Ranked candidates and selection reasons | Candidate is fresh, relevant, and demonstrable |
| Capture | Browser evidence and quality report | Page has useful content across the intended scroll |
| Write | Script, claim ledger, and source mapping | Every claim has evidence; narration passes quality checks |
| Render | MP4, cover image, timings, and hashes | Vertical safe areas, audio, captions, and first frame pass review |
| Approve | Render hash, rights state, destinations, schedule | Approval covers the exact bytes that will publish |
| Publish | Outbox entries and provider post IDs | Every mutation has a stable idempotency key |
| Observe | Activity log, analytics snapshot, failure state | Results reconcile to provider state |

## Daily output recovery

Treat the configured posts-per-day count as the operating target. Resolve candidates independently, record each rejection, and continue through the ranked supply. A candidate-level failure should advance to the next candidate. A batch-level failure should trigger diagnosis and a bounded same-day recovery run while valid posting windows remain. Reuse verified captures, narration, uploads, and outbox entries when their hashes and business keys still match.

Do not stop after sending an alert or reporting a failed service. A terminal failure should create one idempotent recovery claim and trigger a bounded repair worker on an authenticated operator machine or isolated worker. Limit the worker by repository, host, service, mutation type, attempt count, and wall time. Require a regression check and independent observable-state verification before it reports success.

Reconcile the scheduler directly and finish only when every platform has the required feed records and supported Story records, or when a documented safety gate, exhausted source pool, provider outage, budget ceiling, or closed publication window prevents recovery. Keep provider billing, credentials, account ownership, rights, security controls, and ambiguous provider mutations outside automated repair. Record the remaining deficit and one executable next action when recovery cannot finish.

## Source capture

Use a real browser for JavaScript applications. Scan the top, middle, and bottom before accepting a long page. Reject persistent loading UI, blank sections, broken media, login walls, and pages whose useful content cannot fill a vertical video. Never recreate a failed source page and present the reconstruction as evidence.

Store the submitted URL, final captured URL, capture time, browser route, page dimensions, quality score, and failure reason. A remote browser can retry a browser failure. It must not turn a sparse real page into fabricated content.

## Editorial model

Choose one demonstrable idea per video. Vary the hook, evidence order, and closing line. Keep the source visible for most of the runtime. Align captions to speech-provider timings. Place captions inside platform-safe margins.

Bind claims to source locations. Keep a separate statement for inference or opinion. Reject scripts with repeated scenes, malformed punctuation, source navigation copied as narration, or generic praise.

## Publication reliability

Assume a scheduler can run twice. Give each external effect a stable business key derived from channel, source item, render hash, destination, content variant, and scheduled time.

Write intent before the provider request. Persist accepted post IDs immediately. Treat timeouts and provider errors as ambiguous until reconciliation proves whether the effect occurred. Retry clean connection failures with bounded attempts and jitter. Move exhausted work to an explicit failed state and send one actionable alert.

Stories are separate effects. Current Postiz and Meta publishing can upload full Story media but cannot create Instagram's embedded Reel card or interactive link sticker. Record that limitation in the channel policy.

Treat comment-to-DM delivery as a separate external effect. Bind the published media ID to the destination URL carried by that exact content package and caption. Persist intent before replying, deduplicate by channel and platform comment ID, cap writes per poll, and quarantine ambiguous provider outcomes instead of retrying them. Do not use a static any-post link when different posts promise different destinations.

Use one repository-wide lock for activity-log writes and history rendering, committing, rebasing, and pushing. A per-file write lock does not protect a Git worktree from becoming dirty during sync. Release the repository lock before recording a sync failure so failure logging cannot deadlock.

## Improvement loop

Collect reach, views, engagement, profile visits, follows, and retention when the provider exposes them. Compare videos by normalized rates and watch-time signals. Change one variable for the next batch, such as hook, runtime, source type, voice, caption density, or CTA. Record the hypothesis before rendering.

## Daily operating digest

Send one short digest per channel timezone after a fresh analytics collection. Lead with today's feed and Story coverage. Show current views and interactions per platform, then day-over-day, week-over-week, and month-over-month view changes against exact saved report snapshots. Mark unavailable baselines as `collecting`; never convert missing provider data into zero. Name at most one recent content winner and link directly to its validated public release URL. Do not add channel metrics together when providers define them differently.

Treat provider analytics arrays as time series, not ordered lists. Select the latest valid point on or before the reporting date, because providers may return reverse-ordered data or a future-dated placeholder zero. Preserve raw responses for diagnosis and state which metrics each provider actually defines.

If channel analytics return no view metric but published-post analytics are available, aggregate the tracked published feed records and disclose that fallback in the digest. Compare periods only when the current and baseline summaries use the same source; mark a source change as `collecting` instead of presenting a false trend.

Use the attention section for publication deficits, provider errors, stale data, inactive timers, failed services, capacity thresholds, and unresolved production runs. Record recovered runs separately so the owner sees that a failure occurred without receiving a false action request. Keep provenance and freshness in a compact footer.

Treat scheduled email delivery as at-least-once. Derive one stable key from the reporting date, persist intent and the exact provider payload before sending, and reuse them on every retry. Mark delivery complete only after provider confirmation. Bound retries in one layer and send a terminal failure alert when they are exhausted.

Use a dedicated AgentMail inbox and inbox-scoped send-only key when AgentMail is available. Separate daily digests and failure alerts with labels. Keep the key out of non-email services. Before enabling unattended timers, verify one digest, one terminal failure alert, and same-key deduplication. Add signed, inbox-scoped webhooks only when delivery events or inbound mail change channel behavior.
