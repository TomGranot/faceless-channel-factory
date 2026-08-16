# Source rights and pre-generation

Read this reference before automating discovery, downloading source media, copying page content, or building a queue that will publish weeks later.

## Separate access from reuse

Answer four questions independently:

1. Does the provider permit automated access through this API, feed, bulk file, or page?
2. Does the selected record grant commercial reuse and transformation rights for the exact media or text?
3. Do attribution, ShareAlike, privacy, publicity, trademark, cultural-sensitivity, or endorsement rules add obligations?
4. Will the evidence still be valid when the scheduled post publishes?

An accessible URL is not a reuse license. A reusable image does not grant permission to crawl the provider's HTML. Robots rules do not override terms, API policies, or item rights.

## Classify every source

| Tier | Evidence | Allowed default |
| --- | --- | --- |
| A | Provider marks the exact media CC0 or public domain | Cache, crop, animate, narrate over, and publish after third-party-rights screening |
| B | Item carries a compatible license or rights statement | Pre-generate only after recording attribution, license, modification, and ShareAlike obligations |
| C | API exposes facts while publishers retain text and assets | Store and visualize facts; paraphrase prose; use media only after a separate license check |
| Blocked | Missing, conflicting, expired, withdrawn, or unsuitable evidence | Do not download for production or publish |

Prefer official APIs, feeds, and bulk datasets. Use browser capture only when the provider permits it and the page itself is the approved source material. Do not bypass login walls, bot controls, CAPTCHAs, WAF blocks, or provider throttles to obtain a cosmetic screenshot.

## Store an immutable evidence manifest

Record at least:

```json
{
  "provider": "source-name",
  "source_id": "stable-record-id",
  "canonical_url": "https://example.org/record/123",
  "api_url": "https://api.example.org/records/123",
  "source_revision": "revision-or-sha",
  "retrieved_at": "ISO-8601",
  "content_hash": "sha256:...",
  "rights_status": "cc0|public-domain|cc-by|cc-by-sa|metadata-only|blocked",
  "license_url": "https://example.org/license",
  "rights_text": "provider rights field",
  "creator": "creator when required",
  "credit_line": "required credit",
  "commercial_derivatives_allowed": true,
  "review_flags": ["privacy", "publicity", "trademark", "cultural-sensitivity"],
  "fresh_until": "ISO-8601",
  "last_revalidated_at": "ISO-8601"
}
```

Hash the bytes actually used. When a primary media URL fails, try other official renditions in a deterministic order and record the successful URL. Never substitute an unrelated host while retaining the original rights claim.

## Pre-generate safely

A large queue is safe only when each item has immutable source evidence, a suppression key, a freshness boundary, and a pre-publication revalidation rule.

- Store originals only for Tier A and approved Tier B items.
- Keep a suppression list by provider ID and content hash so withdrawn media cannot return through another query.
- Recheck availability, rights state, license obligations, and source revision before publication.
- Fail closed if the source disappears, becomes private, changes license, or returns conflicting rights data.
- Keep routine rights language out of narration. Put required attribution in the post copy or credits and retain the full audit record privately.

## Respect practical limits

Treat documented ceilings as maximums, not target throughput. Pace sustained work below observed limits, cap concurrency, honor `Retry-After`, and cache immutable responses. Stop after repeated HTML `403` responses from a JSON API. Cool down, probe one known record, and resume slowly only after the provider returns valid JSON.

Do not spread traffic across identities, proxies, or IPs to evade a block. Preserve the prior good public manifest when a discovery run fails.
