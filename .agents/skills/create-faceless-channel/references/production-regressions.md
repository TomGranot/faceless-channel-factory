# Production recovery regressions

Use these cases as acceptance criteria when a channel changes failure handling.

## Museum API metadata points at a dead original image

Observed failure: the object metadata and public-domain gate passed, but the listed primary image returned `404` during source preparation. Another official rendition remained available.

Required regression checks:

- Keep the object-level rights gate, then try official image candidates in deterministic order: original primary image, smaller primary rendition, then official additional images.
- Record the URL actually downloaded in the evidence manifest and hash those bytes.
- Do not substitute an image from an unrelated host or bypass the public-domain check.
- Persist completed dates, repair the source selector, and resume from the failed date without reposting reconciled dates.

## Provider quota plus notifier-only recovery

Observed failure: a daily batch exhausted its speech-provider quota. Systemd retried the identical non-retryable request three times, then emailed the owner a manual investigation prompt. No repair worker started, even though the runbook said that failure notification started recovery.

Required regression checks:

- Classify quota, billing, credentials, account, and rights failures as external blockers. Do not retry them unchanged.
- Give the failed service invocation one stable recovery key. A second poll must not start a second worker.
- Trigger a bounded repair worker for code, content, dependency, or machine failures that remain inside the configured safety scope.
- Keep billing, credentials, account ownership, rights, security controls, and ambiguous provider mutations outside automated repair.
- Require a fresh regression check and observable provider or scheduler verification before reporting success.
- Send an outcome report that names the cause, attempted repair, verification evidence, and remaining blocker. Do not end with a generic instruction to investigate.
- Strip unrelated environment credentials before starting the repair worker.

After the owner upgrades a subscription or restores quota:

- Probe the provider again or require successful provider output from the resumed run. Do not assume the account change took effect.
- Start one fresh service invocation instead of reviving the failed process or repeating all retry layers.
- Preserve valid captures, renders, outbox entries, approval hashes, and publication IDs. Reconcile ambiguous external effects before issuing another mutation.
- Treat candidate-level narration, rights, or capture rejection as supply filtering when the batch can continue. Do not misreport those skips as the terminal provider failure.
- Confirm the complete batch target and query the scheduler or platform for every required feed and Story record before declaring `verified_repair`.
- Report the original quota evidence, the human gate that changed, the new invocation ID, successful provider evidence, final service result, and scheduled-effect counts.

## Discovery API rate limit plus partial current-day data

Observed failure: a broad registry discovery scan received HTTP 429 responses. A separate range query included the current day as a zero-count bucket, which would have produced a false 100 percent decline if the scorer treated it as a complete day.

Required regression checks:

- Use public APIs, not website scraping, for discovery and metadata.
- Honor `Retry-After` and add bounded exponential backoff for 429 and transient 5xx responses.
- Pace request batches below the provider's practical limit and cap each discovery run.
- Write candidate output atomically only after every required source response passes validation.
- Exclude the current partial day and reject any historical window with missing or zeroed recent buckets unless the source confirms completeness.
- Preserve the prior successful candidate file when a scan fails.
- Record the observation window, source URLs, response time, and `fresh_until` value in every candidate.
- Classify expired trend data as `stale` or `superseded`, not as a production failure.

## Documented API ceiling exceeds the provider's practical WAF limit

Observed failure: a public-collection discovery run stayed below the source API's published per-second ceiling but issued a burst of search and object reads. The provider began returning HTML `403` responses after the first valid records. Retrying the remaining object IDs immediately extended the block and discarded useful work because the batch wrote only at the end.

Required regression checks:

- Treat repeated HTML `403` responses from a JSON API as a provider throttle or WAF block. Stop the network stage instead of replaying the full candidate list.
- Pace sustained discovery against the provider's observed practical limit, even when the documented ceiling is higher. Keep search and item-fetch budgets separate.
- Cache each successful immutable source response with its retrieval time. Resume from fresh cache entries after a block instead of fetching them again.
- Keep the public candidate manifest atomic: publish it only after the target count passes rights and metadata gates. A raw response cache may advance independently.
- Cache broad search results for a bounded period so a resumed item pass does not repeat dozens of discovery queries.
- Use ordinary documented query terms when a wildcard query triggers bot controls. Do not route around a provider block through alternate IPs, proxies, or HTML scraping.
- Probe one known item after a cooldown. Resume at a conservative rate only after the provider returns JSON again.

## Encoder success with visually corrupted frames

Observed failure: two Remotion renders ran at the same time and one output contained tiled repeats and blank frames. Remotion and the encoder exited successfully, so process status and file existence did not detect the corruption.

A later reproduction showed the installed desktop Chrome application could also emit tiled opening frames and intermittent flat-gray frames during a single isolated render. A 90-frame differential render held the composition and internal concurrency constant; desktop Chrome failed while Remotion's matching Chrome Headless Shell passed.

Required regression checks:

- Limit concurrent render jobs separately from each render's internal frame concurrency.
- Probe the final file for duration, dimensions, codec, audio, and decodability.
- Sample the first frame, several uniform frames, scene changes, and the final frame after every render.
- Add a machine-readable early-frame flicker gate. Compare consecutive-frame luminance during the first three seconds and reject isolated spikes that exceed the channel's calibrated motion envelope.
- Keep the corruption-sampling window free of deliberate high-contrast camera movement. If a legitimate zoom trips the gate, hold the opening detail through the sampling window and accelerate the later reveal; do not raise the corruption threshold until bad renders pass.
- Reject blank frames, repeated tiling, unexpected crops, missing captions, and source-proof frames that cannot be read.
- Compare perceptual hashes across samples. An implausibly static video or sudden corruption must fail visual validation.
- Rerender the affected item in isolation before reducing internal frame concurrency.
- Prefer Remotion's matching Chrome Headless Shell for unattended rendering. If a desktop-browser render corrupts frames, keep internal concurrency fixed for the first differential retry so browser choice remains the only changed variable.
- Preserve the corrupt file and validation report until the replacement passes, then remove or quarantine it through the normal artifact policy.

## Transient provider analytics read aborts the snapshot

Observed failure: an item-level Postiz analytics GET returned HTTP 502 after the collector had completed other authenticated reads. The collector had no read retry, so one transient upstream response failed the service. Its atomic writer preserved the prior successful snapshot.

Required regression checks:

- Retry read-only analytics requests after network failures, HTTP 429, and HTTP 5xx responses. Bound the retry budget and use exponential backoff; honor `Retry-After` when the provider sends it.
- Do not apply the analytics-read retry helper to create, update, delete, publish, cancel, or reschedule requests. Reconcile every ambiguous mutation before another attempt.
- Test a 502 followed by a 200 response, a non-retryable 4xx response, and exhaustion after the configured attempt limit.
- Write the new analytics snapshot atomically only after every required response passes validation. Preserve the last good snapshot when collection fails.
- Before closing recovery, query the failed provider resource again, run one fresh collection, and verify the snapshot timestamp and generated report instead of relying on the service exit code alone.

## Transient media upload failure before post creation

Observed failure: a scheduler accepted the first video's feed and Story records, then returned HTTP 502 while uploading the next video's media. The upload response contained no asset ID, and post creation for that item had not started. The batch stopped with later dry-run entries intact.

Required regression checks:

- Persist an `uploading` state and upload-attempt count before sending media.
- Retry media upload after network failures, HTTP 429, and HTTP 5xx with a small bounded budget. Rebuild the multipart body for every attempt.
- Keep upload retry separate from post creation. Never replay an ambiguous create-post request without provider reconciliation.
- Accept that a failed upload response can leave an orphan provider asset; it cannot create a public post. Record the last upload error and returned asset ID when available.
- Reuse one confirmed asset for that render hash across feed and Story effects.
- On resume, preserve already scheduled effects, retry only the failed upload, then reconcile the complete day's feed and Story records.

## Speech-aligned captions collapse sentence boundaries

Observed failure: alignment tokens contained leading spaces, but the caption renderer collapsed HTML whitespace. Sentence transitions appeared as `parts.It`, `tall.The`, and `chariot.Touching` even though the timed transcript data was correct.

Required regression checks:

- Treat caption token text as whitespace-sensitive. Do not trim every token without restoring the separator before a following word.
- Normalize token boundaries before pagination: the first word has no prefix; later words receive one leading space; closing punctuation stays attached to the preceding word.
- Render the caption container with `white-space: pre` or `pre-wrap`. Do not rely on the browser's default whitespace collapsing.
- Reapply the separator rule to each caption page because pagination libraries may trim the first token or rebuild page tokens.
- Reconstruct the complete caption text in a deterministic test and compare it with the normalized narration. Include fixtures where a sentence-ending token and the next capitalized word share one caption page.
- Normalize spoken-era abbreviations such as `B.C.` to `BCE` before voice generation, or make the collision check abbreviation-aware. A raw `[.!?][A-Za-z]` assertion mistakes the internal period in `B.C.` for a collapsed sentence boundary.
- Sample rendered frames around sentence boundaries and reject any visible punctuation-to-letter collision before approving the batch.

## Full Chrome renders every frame but never starts encoding

Observed failure: a Remotion job launched through the installed Google Chrome app reached `Rendered 953/954` and remained alive without producing an output file or starting the encoding phase. Rendering the final frame as a still succeeded, and the identical composition completed when launched through Remotion's Chrome Headless Shell.

Required regression checks:

- Track separate deadlines for frame rendering and the render-to-encode handoff. Do not treat a live process with no new frame or encoder progress as healthy.
- When the job stalls at the final frame, render that frame as a still before changing composition code. A successful still distinguishes a browser lifecycle failure from invalid final-frame math.
- Prefer Remotion's matching Chrome Headless Shell for unattended production renders. Use the desktop Chrome application only as an explicit fallback.
- Terminate the stalled job before retrying. Never let the diagnostic retry overlap the original renderer.
- Retry the item once in isolation with the headless shell, then run the normal decode and visual-sampling checks on the completed file.
- Record the original browser executable, last observed frame, stall duration, diagnostic still result, replacement browser executable, and final verification outcome in the recovery report.

## Rights evidence leaks into the story and end card

Observed failure: source-led videos repeatedly narrated the rights decision, then ended on inconsistent proof screens. One item showed a source-page screenshot while the others showed sparse cards with a raw URL, long metadata, and rights-audit language. The rights decision was correct, but the viewer-facing result felt like an internal compliance report.

Required regression checks:

- Enforce rights before scripting and preserve the license, canonical source, retrieval time, media hash, and provider evidence in the production record.
- Fail the candidate when the rights gate is missing or negative. Removing a viewer-facing label never resolves rights uncertainty.
- Keep routine rights status out of narration unless it is central to the story or attribution is legally required.
- Use one end-card system across a batch. Do not mix source screenshots and generated detail cards without an editorial reason.
- Limit a short vertical end card to three or four grouped units: object title, creator or date, compact object details, and institution or source.
- Remove raw URLs, audit timestamps, evidence labels, and legal terminology from the main visual hierarchy. Keep the canonical source in the artifact metadata and post copy.
- Run a five-second readability check at phone size and sample the handoff frame. The image reveal must finish before the end card begins, and captions must not cover its primary details.
- Test that every narration omits routine rights boilerplate while every selected item retains positive machine-readable rights evidence.

## API reconstruction presented as a captured source page

Observed failure: automated registry-page capture hit the website's bot controls, so the video rendered a browser-shaped reconstruction from registry data. The reconstruction looked like a small fake web page, occupied eight seconds with little motion, and then cut to a graph that stayed almost unchanged for the rest of the narration.

Required regression checks:

- Never label API-rendered content as a captured package page, browser screenshot, or source proof. Identify it as a registry record, data card, or other accurate representation.
- Use documented registry and downloads APIs when website automation is blocked or disallowed. Do not bypass bot controls to obtain a cosmetic screenshot.
- Remove browser chrome, fake address bars, README facsimiles, and other details that imply direct page capture.
- Give the video one takeaway: a graph mystery, one concrete item benefit, the trend reveal, and why it matters to the viewer.
- Animate the evidence in spoken order. Reveal the baseline, line movement, latest value, and percentage when the narration reaches each fact.
- Keep the source and observation window visible but subordinate. Refresh trend data inside the channel's freshness window before publication.
- Reject a scene that remains visually unchanged for more than the configured hold limit unless the spoken beat requires it.
- Run a phone-size five-second test on the opener. The item name, purpose, and primary metric must be readable without zooming.

## Trend spike treated as the entire story

Observed failure: a trend video showed a registry card and an animated activity graph, then held that graph while the narration repeated growth percentages and analyst caveats. The metric identified the candidate but did not give the viewer a reason to finish the video.

Required regression checks:

- Use the anomaly as a hook, not the complete editorial angle. Reject a script whose only new information is that a count increased.
- Move from the opening identifier to the graph within about two seconds, then leave the graph once its baseline, change, and endpoint are readable.
- Open one second curiosity loop after the graph: release timing, dependency or migration impact, maintainer evidence, real usage, security context, or another source-supported clue.
- Pay off the second loop with a distinct visual scene. Do not leave the chart static while narrating the package description.
- Source the second beat from the registry, repository, release record, maintainer statement, or another primary source. Label correlation and causal explanations as inference.
- Give the viewer one implication. Multiple unrelated facts dilute a short video.
- Keep adjacent scene luminance compatible when accelerating cuts. A fast white-to-black transition can look like flicker even when every rendered frame is valid.
- Compare retention at the hook-to-graph and graph-to-proof timestamps. Change one transition or proof treatment per test batch.

## Comment CTA exists without a reliable per-post DM route

Observed failure: a video asks viewers to comment for a link, but the publishing system has no durable mapping from that published media ID to its own destination URL. A static any-post or next-post automation can send the wrong link, skip older scheduled posts, or send the same private reply twice after a timeout.

Required regression checks:

- Add the comment keyword and destination URL to the content package before rendering. Carry the same contract into the spoken close, visual CTA, caption, publication record, and comment worker.
- Bind each published platform media ID to the destination URL from that exact post. Do not infer a dynamic link from the keyword alone or use one mutable global link for a multi-post channel.
- Treat already approved and scheduled batches as immutable. Apply a new CTA only to a named future batch unless the owner explicitly approves replacing scheduled media and copy.
- Match a whole keyword, case-insensitively, and ignore the channel's own comments. A keyword substring inside another word must not trigger a reply.
- Persist send intent before the private-reply request and deduplicate by channel plus platform comment ID.
- Hold one process lease across comment reads, intent persistence, provider writes, and final state updates. An overlapping poll must exit without reading or sending.
- Retry read-only comment and post requests only after network errors, HTTP 429, or HTTP 5xx. Return non-transient 4xx responses immediately.
- Treat timeouts, HTTP 408, HTTP 429, HTTP 5xx, and success responses without a stable provider message ID as uncertain. Quarantine the comment and reconcile it manually; never retry it automatically.
- Cap writes per poll, store only the source URL and provider identifiers needed for reconciliation, and keep access tokens out of logs and state.
- Verify one fixture send, a repeated-poll no-op, an uncertain-send no-retry case, and one private test comment on each connected account before enabling unattended polling.
- Document platform coverage honestly. When a platform cannot initiate a private reply from a comment through an approved API, keep the CTA off that destination or route it to a supported interaction.
