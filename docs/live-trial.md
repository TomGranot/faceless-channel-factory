# Live-trial evidence

This report records an operating snapshot from two unrelated source-led short-video niches. The names describe the formats rather than the live accounts.

Snapshot: **2026-08-16**, Europe/Amsterdam. Publication counts cover August 1–16. Account metrics came from the scheduler's authenticated analytics endpoints unless the table identifies a platform-native source. The Instagram app displayed its native results as a rolling 30-day window.

## Publication and account metrics

| Niche | Platform | Published | Observed account metrics |
| --- | --- | ---: | --- |
| Public-collection reveals | Facebook | 11 | 992 media views, 887 impressions, 5 engagements |
| Public-collection reveals | TikTok | 6 | 0 views, 0 likes |
| Public-collection reveals | Instagram | 12 | Platform-native, rolling 30 days: 2,356 views, 1,964 viewers, 99 interactions; net followers unavailable |
| Developer-launch explainers | Facebook | 43 | 69 media views, 62 impressions, 0 engagements |
| Developer-launch explainers | TikTok | 23 | 981 views, 16 total likes, 4 recent likes |
| Developer-launch explainers | Instagram | 43 | Platform-native, rolling 30 days: 7,859 views, 5,424 viewers, 286 interactions, 17 profile visits; net followers unavailable |

The collection format published 29 posts across the three destinations. The developer format published 109. Across the four scheduler integrations that returned view data, the collection format recorded 992 views on 17 measured posts, or 58.4 per post. The developer format recorded 1,050 views on 66 measured posts, or 15.9 per post. Do not add the Instagram results to those totals: their platform-native windows cover 30 days rather than the August 1–16 publication period.

## What the trial supports

One runtime handled two source types, six destination integrations, and 138 published effects. It preserved missing analytics instead of turning them into zero and kept publication state separate from account metrics.

The run also exercised:

- source and rights evidence before scripting;
- browser capture and render validation;
- feed and Story effects tracked separately;
- scheduler reconciliation after ambiguous results;
- daily analytics with explicit source labels;
- bounded failure repair and same-day recovery;
- per-post comment-to-DM routing guarded by idempotency state.

## Platform observations

Platform-native checks filled both gaps in the scheduler's Instagram data. During the displayed 30-day windows:

- One anonymized format recorded 7,859 views from 5,424 viewers and 286 interactions. Non-followers produced 98.6% of views and 98.3% of interactions. Instagram attributed all interactions to Reels and reported 17 profile visits.
- The other format recorded 2,356 views from 1,964 viewers and 99 interactions. Non-followers produced 99.7% of views. Instagram attributed all interactions to Reels; the app could not display the time-series chart.

Instagram displayed net followers as unavailable for both accounts, so the report makes no follower-growth claim from these snapshots.

The operator also saw TikTok distribute more strongly near launch and then decline.

Neither TikTok account gained followers. The collection-format account received no activity, while the developer-format account received views and a small number of likes. Facebook felt slower at initial discovery, though the collection format still reached 992 media views.

These observations produce three hypotheses for the next cohort:

1. TikTok may provide the strongest cold-start reach but weak conversion.
2. Instagram may offer the best balance of views, likes, and followers.
3. Facebook may need more time or a strong visual niche.

YouTube Shorts remains untested because its channel creation and verification stayed in the human setup queue.

## Limits

Treat these numbers as operating evidence rather than a controlled niche comparison. Post age, cadence, platform distribution, sample size, and reporting windows differ. Facebook reports `Media views`; TikTok reports `Views`; Instagram's platform-native snapshots report rolling 30-day `Views`, `Viewers`, and `Interactions`, with `Profile visits` visible for one account. The scheduler still returned no Instagram account analytics.

The next report should compare cohorts at fixed post ages and keep each metric's source and definition unchanged. It should also record account state changes such as Professional conversion, Page linking, verification, and scheduler reconnection beside each snapshot.

## Reproduction rules

For a new cross-niche report:

1. Choose one reporting date and timezone.
2. Snapshot every destination on that date.
3. Report publication counts even when analytics are empty.
4. Separate scheduler-account, scheduler-post, platform-native, and operator observations.
5. Compare normalized rates only when numerator, denominator, observation window, and source match.
6. Keep handles, integration IDs, publication URLs, and raw provider responses in private operating records.

See [analytics and experiments](../.agents/skills/create-faceless-channel/references/analytics-and-experiments.md) for the reporting contract.
