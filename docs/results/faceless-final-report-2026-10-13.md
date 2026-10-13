# Faceless final report, 2026-10-13

This is the closing report for the Faceless channel factory experiment: two automated short video channels, Show HN Today and Museum Hunt, published through Postiz to Instagram, Facebook, and TikTok. Numbers come from the last analytics snapshot (collected 2026-10-13 04:44 UTC), the last daily digest (report date 2026-10-12), and a live read of Postiz on 2026-10-13 before shutdown.

## Show HN Today

Three Reels per day from Show HN posts. First post went out 2026-08-09 and the last on 2026-10-08 (UTC). Nothing was left in the queue at shutdown.

Campaign states across 922 Postiz records: 904 published, 10 error, 6 cancelled, 2 not found. Published by platform: Instagram 361, Facebook 359, TikTok 184.

Platform metrics:

| Platform | Views | Likes | Comments | Shares | Saves | Followers | Videos |
|---|---|---|---|---|---|---|---|
| Instagram (account) | 20,636 | 246 | 12 | 118 | 543 | 0 | 361 published |
| Instagram (sum of posts) | 53,005 | 584 | 28 | 306 | 1,229 | | |
| Facebook (page) | 7 media views, 6 impressions | 66 reactions on posts | 0 engagement | | | 0 | 359 published |
| Facebook (sum of post plays) | 20,372 | | | | | | |
| TikTok (account) | unavailable | 16 | | | | 0 | 183 |
| TikTok (sum of posts) | 1,841 | 11 | 0 | 0 | | | |

## Museum Hunt

Four Reels per day from public domain museum objects. First post went out 2026-08-15 and the last on 2026-10-12 (UTC).

Campaign states in the analytics snapshot (600 records, 2026-08-15 to 2026-09-13): 464 published, 136 error. Facebook carried most of the errors (117), then TikTok (13) and Instagram (6).

Platform metrics:

| Platform | Views | Likes | Comments | Shares | Saves | Followers | Videos |
|---|---|---|---|---|---|---|---|
| TikTok (account) | 6,550 | 766 | 1 recent | 0 recent | | 9 | 142 |
| TikTok (sum of posts) | 32,752 | 497 | 9 | 5 | | | |
| Instagram (digest) | 17,940 | 482 | 5 | 70 | 59 | | |
| Facebook (digest) | 0 | 15 | | | | 0 | |

### The 2026-10-04 to 2026-11-02 window

A 30 day window of 120 campaigns was queued for 2026-10-04 through 2026-11-02. When the channels were shut down on 2026-10-13, 36 campaigns had come due (2026-10-04 to 2026-10-12) and 84 were still queued.

Of the 36 that came due: TikTok 35 published and 1 error; Instagram 68 published and 4 error (two posts per campaign); Facebook 34 published and 38 error.

The 84 queued campaigns (420 Postiz posts: 168 Instagram, 168 Facebook, 84 TikTok) were deleted on 2026-10-13. 417 groups were deleted through the API; the remaining few had already gone out in the morning slot.

## What worked and what did not

Instagram was the only platform that produced meaningful reach for Show HN Today: tens of thousands of views and a high save count relative to likes. It never converted into followers.

Facebook did not work for either channel. The Page identity gate meant posts were accepted but reported almost no views, and Museum Hunt Facebook produced the bulk of all publishing errors before its channel was disabled.

Show HN TikTok never reported account level views through Postiz, and the per post sum stayed under 2,000 views over 183 videos.

Both channels ended with zero followers on Instagram and Facebook. Show HN Today also had zero TikTok followers.

TikTok was the best platform for Museum Hunt: the only one with followers (9), hundreds of likes, and roughly 33,000 summed post views. Visual, object driven content suited TikTok better than developer news.

Reliability was a recurring cost. Recovery reports, failure alerts, and a Mac side auto repair poller were needed to keep the daily cycle running, and by the end ten automation services were in a failed state.

## Shutdown

On 2026-10-13 the pages go silent. Nothing further will be published to Show HN Today or Museum Hunt.

1. Queued posts deleted: 417 Museum Hunt post groups (covering the 420 queued posts across Instagram, Facebook, and TikTok). Zero queued posts remain on those channels.
2. Postiz channels removed: the six Faceless channels (Show HN Today Instagram, Facebook, TikTok and Museum Hunt LOL Instagram, Facebook, TikTok). Only unrelated personal channels remain in the Postiz workspace. The Postiz account itself was kept.
3. Timers and services stopped: every show-hn timer and service on the production VM was disabled and stopped.
4. Mac launch agents stopped: show-hn auto repair and the two weekly learning agents were booted out and their plists moved to a disabled folder.
5. VMs deleted: show-hn-reels and faceless-factory on exe.dev.
6. Archive: production state (analytics, digests, campaigns, history, output, museum hunt campaign files) and the idea mill were archived as tarballs with SHA256 sums under ~/Archives/faceless-2026-10-13/ on the operator machine. Environment files and mail credentials were excluded.
7. Accounts left up but inactive: the Instagram, Facebook, and TikTok accounts for both brands still exist with their published videos. They are simply no longer connected to any scheduler.

Remaining manual follow ups: revoke the ElevenLabs, Anchor Browser, and AgentMail API keys, retire the two AgentMail inboxes used for alerts and the digest, and review the Postiz plan now that six channels are gone.
