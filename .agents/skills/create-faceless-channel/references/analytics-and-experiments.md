# Analytics and experiments

Read this reference before interpreting channel performance, changing cadence, or publishing a case study.

## Preserve metric provenance

Store each observation with one source label:

| Label | Meaning | Use |
| --- | --- | --- |
| `scheduler-account` | Account aggregate returned by the scheduler | Same-platform account trends |
| `scheduler-post` | Metrics for tracked published posts | Fallback when account analytics are empty |
| `platform-native` | Snapshot from the platform's own insights UI or API | Followers, retention, and metrics the scheduler omits |
| `operator-note` | Dated observation from a human reviewing the account | Qualitative hypotheses only |

Do not merge sources into one time series. Keep account totals separate from post totals. Keep missing values missing. Record the timezone, observation window, publication count, metric definition, and snapshot time beside each number.

When one scheduler response reports zero views alongside non-zero lifetime likes or another contradictory lifetime engagement field, label the view count `unavailable` and preserve the supported engagement value with its lifetime definition. Do not treat the contradiction as zero performance or an operational alert. Verify the view metric through the platform-native source before using it in comparisons.

When a scheduler returns no Instagram analytics but the owner sees followers and likes in the Instagram app, report both facts: the scheduler field is unavailable, and the platform-native snapshot shows the observed result. Never replace the missing scheduler field with the manual number.

## Measure launch behavior by cohort

New accounts can receive uneven early distribution. Compare videos by days since account launch and days since publication instead of reading a lifetime total as a trend.

For each destination, save:

- follower count and cumulative published posts at account age 1, 3, 7, 14, and 30 days;
- per-post views, likes, comments, shares, and watch-time fields at post age 24 hours and 7 days;
- the median and range for each publishing cohort;
- any account-state change, including Professional conversion, Page linking, verification, or scheduler reconnection.

Treat an apparent launch boost or decline as a hypothesis until at least two cohorts share the same observation window. Do not promise that a platform grants a new-account boost.

## Anonymized trial observations

One August 2026 trial produced these working observations across two unrelated niches:

- One TikTok destination received 981 scheduler-reported views and 16 lifetime likes across 23 published videos, while another received zero views and zero likes across six. Neither gained followers. The operator saw stronger distribution near launch and weaker distribution later. Neither result proves a durable platform rule.
- Instagram's scheduler account endpoint returned no metrics for either destination. A platform-native check showed roughly 15–20 followers arriving quickly on one account, along with views and likes, without manual audience development. Preserve this as a platform-native observation, not scheduler evidence.
- Facebook discovery felt weaker at launch, but the collection-format destination still returned 992 media views across 11 published videos. The developer-format destination returned 69 media views across 43. Niche, post age, and cadence differ, so the totals do not isolate platform quality.
- YouTube Shorts was not part of the trial because channel creation and verification remained a human setup task. Record it as untested.

Use these as experiment hypotheses:

1. TikTok may produce the strongest cold-start reach but weak follower conversion and fast decay.
2. Instagram may offer the best mix of followers, views, and likes when the Professional account and linked Page are configured correctly.
3. Facebook may start slowly but can still distribute a strong visual niche.

Test the hypotheses on new 7-day and 30-day cohorts. Change one content variable per batch. Keep platform setup, cadence, and observation windows stable where possible.

## Public reporting gate

Publish an anonymized aggregate only when the report includes:

- one snapshot date and timezone;
- published-post counts for every destination;
- the metric source and definition for every number;
- explicit missing-data labels;
- a note about unequal post ages, cadence, or sample sizes;
- no handles, account names, integration IDs, publication URLs, or raw provider responses.

Prefer a small honest table over a composite score. A cross-platform total is valid only for counts that share a definition, such as published effects.
