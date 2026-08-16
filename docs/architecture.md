# Why the factory keeps evidence and effects together

A faceless channel looks like a video task, but unattended operation makes it a distributed publishing system. The source can change, a browser can render an empty page, a voice provider can return imperfect timing, and a scheduler can accept a post before the client sees the response.

The factory therefore treats each video as a sealed content package. It carries source IDs, capture evidence, claims, narration, caption timings, render hashes, rights state, approval, destinations, schedule, provider IDs, cost, and analytics. The package lets an operator answer two questions later: why did we publish this, and which exact bytes reached each account?

## Real pages beat reconstructed pages

The scrolling page is evidence and visual material at the same time. A generated replacement may look cleaner, but it breaks that connection. The capture stage scans the real page and rejects it when it cannot support the video. A remote browser improves execution reliability; it does not make a weak source suitable.

## Publication uses an outbox

Cloud timers and provider clients can run twice. The outbox writes intent before each external effect and derives a stable key from the channel, source, render, destination, variant, and time. A timeout remains uncertain until provider reconciliation finds or rules out the post.

Feed posts and Stories use separate keys. Postiz can upload the full video as a Story, but its current publishing path cannot attach Instagram's embedded Reel card or link sticker. A human operator can upgrade that effect later without changing discovery, rendering, or the feed publication.

## One worker can run several channels

The heavy tools can be shared. Mutable state cannot. Each channel needs its own outbox, campaign registry, output directory, activity stream, service units, and failure identity. Staggered render windows protect memory and browser concurrency.

## The skill stays beside the factory

The skill is the executable build contract for coding agents. Keeping it in the repository allows a production failure to change code, documentation, and the regression task bank together. Host adapters point to one canonical skill directory so Codex, Cursor, and Claude Code do not drift.
