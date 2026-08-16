# Source permissions for collection reveals and package signals

Research date: 2026-08-14
Scope: The Met, Smithsonian Open Access, Wikimedia Commons, Library of Congress, npm, and GitHub.
Method: Current first-party policies, documentation, robots files, and live first-party API responses only. This report is an operational source review, not legal advice.

## Decision

The factory can pre-generate videos from The Met Open Access and Smithsonian CC0 media if it keeps the source record, rights marker, retrieval date, and original credit data with every asset. Wikimedia Commons and Library of Congress material needs an item-level rights gate before rendering. npm and GitHub support package discovery and factual metadata, but public access does not grant a blanket right to reproduce README prose, screenshots, logos, or release assets.

Use the documented APIs and bulk feeds for automation. Do not treat permission to reuse an image or fact as permission to crawl the provider's HTML pages. npm forbids automated Website access in its Open Source Terms while allowing Public Registry replication through public APIs; GitHub defines scraping separately from API collection; Wikimedia and LOC publish distinct robot and API rules; The Met publishes a Collection API with its own limit. ([npm Open Source Terms](https://docs.npmjs.com/policies/open-source-terms/), [GitHub Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies), [Wikimedia API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines), [LOC API limits](https://www.loc.gov/apis/json-and-yaml/working-within-limits/), [The Met API](https://metmuseum.github.io/))

### Source tiers

| Tier | Sources | What the factory may pre-generate |
|---|---|---|
| A: blanket open-media designation | The Met records with `isPublicDomain: true` and Open Access image URLs; Smithsonian media explicitly marked CC0 | Download, cache, crop, animate, narrate over, combine, and publish commercially. Preserve provenance and screen for privacy, publicity, trademark, cultural-sensitivity, and endorsement issues. |
| B: item-level open rights | Wikimedia Commons files with a compatible license or public-domain marker; LOC items whose Rights Advisory supports the intended use | Pre-generate after recording the exact license or rights statement. Generate required attribution and ShareAlike output rules before rendering. |
| C: facts plus publisher-controlled text/assets | npm package/download metadata; GitHub repository/release metadata | Store and visualize facts such as names, versions, timestamps, tags, and download counts. Paraphrase descriptions. Use README text, embedded images, release prose, and release assets only when the repository or asset license grants commercial derivative rights. |

## 1. The Metropolitan Museum of Art

### API access and inventory

The Collection API requires no key or registration and asks clients to stay at or below 80 requests per second. Its object endpoint returns Open Access data and an image URL when an image qualifies; the object schema exposes `isPublicDomain`, `primaryImage`, `primaryImageSmall`, `additionalImages`, `rightsAndReproduction`, and `objectURL`. ([Collection API access and schema](https://metmuseum.github.io/))

Use the Collection API or the weekly Open Access CSV, not collection-page HTML. The API terms let The Met monitor and store IP and usage data, change or withdraw the service, impose transaction limits, or require keys later. They also tell clients to refresh data because records can change. ([The Met Terms, API section](https://www.metmuseum.org/policies/terms-and-conditions), [Open Access access methods](https://www.metmuseum.org/hubs/open-access))

Inventory snapshots:

- The live `/objects` response reported **502,238 publicly available object IDs** on 2026-08-14. This is a count of object records, not a count of reusable images. ([live API response](https://collectionapi.metmuseum.org/public/collection/v1/objects))
- The Met's current Open Access hub says the online collection contains **more than 492,000 Open Access works/images**. This first-party count is the best published estimate of immediately reusable image-bearing inventory. ([Open Access hub](https://www.metmuseum.org/hubs/open-access))
- A live `hasImages=true&q=*` search reported **367,645 records** on 2026-08-14. The API does not document `*` as a complete-inventory query or publish an `isPublicDomain` search filter, so do not substitute this number for the museum's Open Access count. ([live search response](https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=*))

### Rights and permitted processing

The Met applies CC0 to images of works it believes are in the public domain and to selected collection data. It permits download, sharing, modification, distribution, commercial use, and noncommercial use without a fee or permission. The policy describes high-resolution Open Access images as downloadable, shareable, and remixable without restriction. ([Image and Data Resources](https://www.metmuseum.org/policies/image-resources), [Terms FAQ](https://www.metmuseum.org/policies/terms-and-conditions))

The factory may store the original Open Access JPEGs and API metadata, create crops and motion treatments, combine them into monetized videos, and maintain a pre-generated queue. Gate on all of these fields and conditions:

1. `isPublicDomain` must equal `true`.
2. `primaryImage` or an `additionalImages` URL must come from the API response.
3. Preserve `objectID`, `objectURL`, title, creator, date, credit line, rights-and-reproduction text, source URL, API retrieval timestamp, and a hash of the downloaded file.
4. Exclude a record if `rightsAndReproduction` conflicts with the public-domain flag, the image URL disappears, or The Met removes the OA marker.

The Met warns that public-domain status does not settle third-party trademark, privacy, or publicity rights. It also disclaims non-infringement warranties. Do not use non-OA images or website prose in a commercial video without separate permission. ([The Met Terms](https://www.metmuseum.org/policies/terms-and-conditions), [Image and Data FAQ](https://www.metmuseum.org/policies/frequently-asked-questions-image-and-data-resources))

### Robots and HTML scraping

The Met's robots file disallows `/temp`, `/upload`, `/ghidorah`, `/style-guide`, `/style`, and `/welcome`; it does not publish a general crawl delay, except one second for Pinterest. Robots permission does not expand the website terms or the Open Access designation. Use the API for automated collection access and reserve HTML pages for human verification. ([The Met robots.txt](https://www.metmuseum.org/robots.txt), [Collection API terms](https://www.metmuseum.org/policies/terms-and-conditions))

**Operational rating: green for OA API images and data; red for non-OA images and copied site prose.**

## 2. Smithsonian Open Access

### API, key, limits, and inventory

The Smithsonian routes its Open Access API through api.data.gov and requires an API key. The Smithsonian developer page states that records for public-domain works can include a media URL; records with copyright or other limits can expose CC0 metadata while withholding media. ([Smithsonian Developer Tools](https://www.si.edu/openaccess/devtools), [Smithsonian API client](https://github.com/Smithsonian/smithsonian-openaccess))

api.data.gov publishes a default limit of **1,000 requests per hour per key** across participating APIs. `DEMO_KEY` allows 30 requests per IP per hour and 50 per IP per day. Clients should read `X-RateLimit-Limit` and `X-RateLimit-Remaining`; an exceeded limit returns HTTP 429. The platform lets agencies set service-specific limits, so runtime headers control if they differ from the default. ([api.data.gov Developer Manual](https://api.data.gov/docs/developer-manual/))

The live Smithsonian stats endpoint returned a `time` value of `2026-08` and 48 units on 2026-08-14. Calculations from the returned unit rows:

- **37,834,040 total object records**: sum of `total_objects`.
- **17,854,914 CC0 records**: sum of `metrics.CC0_records`.
- **5,264,758 CC0 records with CC0 media**: sum of `metrics.CC0_records_with_CC0_media`.

These are calculated record counts, not unique media-file counts. One record can contain several files, and duplicate or related records may exist across units. The 5.26 million record figure is the useful lower-bound planning inventory for records that claim at least one CC0 media asset. ([live Smithsonian stats response](https://api.si.edu/openaccess/api/v1.0/stats?api_key=DEMO_KEY))

### Rights and permitted processing

Smithsonian content carrying the CC0 icon may be used commercially or noncommercially without a fee, attribution, or further Smithsonian permission. The Open Access FAQ names creative projects, digital media, publications, and merchandising as allowed uses and explicitly permits transformation and sharing. Attribution is optional, though the Smithsonian recommends a minimal caption with title, author, source, license, and source URL. ([Open Access FAQ](https://www.si.edu/openaccess/faq), [Smithsonian Terms of Use](https://www.si.edu/termsofuse))

The factory may store and transform the media only when the API record or asset marks it CC0. Keep the asset's CC0 status, unit, object ID, title, creator, credit line, canonical URL, retrieval date, and file hash. Exclude records that expose only CC0 metadata without a media URL.

CC0 waives copyright interests, not trademark, privacy, publicity, donor, contractual, or cultural-sensitivity restrictions. Smithsonian names and trademarks do not form part of the CC0 release, and a credit line does not imply endorsement. Do not make a channel, handle, or product look official. ([Open Access FAQ](https://www.si.edu/openaccess/faq), [Smithsonian Terms of Use](https://www.si.edu/termsofuse))

**Operational rating: green for media explicitly marked CC0; metadata-only for restricted records.**

## 3. Wikimedia Commons

### API access, automation, and inventory

Use the MediaWiki Action API to fetch file URLs and `imageinfo` with `extmetadata`; this returns metadata from the file-description page, where the license, creator, attribution, and source live. Do not infer rights from the Commons host name or a category name alone. ([Commons API examples](https://commons.wikimedia.org/wiki/Commons:API/MediaWiki), [Commons reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia))

The Wikimedia Foundation API Usage Guidelines require a descriptive User-Agent with current contact information, compliance with throttling instructions and content licenses, and compliance with the robot policy for large-scale automated consumption. They prohibit traffic patterns that degrade service, request spikes, concurrency used to hide excessive use, and attempts to spread one operator across multiple user agents. ([API Usage Guidelines](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_API_Usage_Guidelines), [User-Agent Policy](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy/en))

Current 2026 request limits list 10 requests per minute for an unidentified client, 200 per minute for an unauthenticated client with a compliant User-Agent, 200 per minute for a new authenticated user, and 2,000 per minute for an established authenticated user. The same guidance asks clients to use at most three concurrent requests and honor `Retry-After` on HTTP 429. Limits can change. ([Wikimedia API rate limits](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits))

The Action API `siteinfo` statistics response reported **145,984,811 files** in its `images` field on 2026-08-14. This number covers the whole Commons file corpus, including images, audio, video, documents, many licenses, and public-domain assertions. It is not a count of files cleared for this package. ([live Commons statistics response](https://commons.wikimedia.org/w/api.php?action=query&meta=siteinfo&siprop=statistics&format=json))

### Rights and permitted processing

Commons hosts files under different terms. The Foundation owns almost none of them. For each candidate, capture the file revision ID and the exact license from `extmetadata`:

- Public-domain and CC0 files can support commercial video transformations, subject to moral rights, privacy, publicity, trademark, and local-law checks. Commons recommends attribution for provenance even where the law does not require it. ([Commons reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia))
- CC BY permits commercial copying and derivatives if the video gives appropriate creator credit, identifies or links the license, and indicates changes. ([Commons license guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses/en))
- CC BY-SA adds ShareAlike. If the video adapts the file, distribute the adaptation under the same or a compatible license. The legal boundary between an adapted image and a larger audiovisual collection can depend on the edit and jurisdiction, so route BY-SA candidates through a rights review before publication. ([Commons license guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses/en))

The factory may cache the original file, thumbnail, metadata, attribution string, license URL, source URL, revision ID, retrieval time, and hash. Render attribution in the description or credits in a form that stays attached to the published video. Do not pre-generate from a file whose license metadata is missing, internally inconsistent, tagged for deletion, or dependent on fair use. Commons warns reusers to verify each file and offers no warranty that its license information is correct. ([Commons reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia))

### API versus crawling

Commons robots.txt warns that irresponsible crawlers may lose access. For the generic agent it disallows `/w/`, `/api/`, and Special pages, while the Foundation separately publishes rules for legitimate API clients. Treat large-scale crawling and API access as separate channels: use the documented API within its limits for targeted fetches, use Wikimedia dumps for bulk work, and do not crawl dynamic HTML or Special pages. ([Commons robots.txt](https://commons.wikimedia.org/robots.txt), [Wikimedia API access policy](https://www.mediawiki.org/wiki/Wikimedia_APIs/Access_policy))

**Operational rating: yellow; approve and snapshot rights per file and revision.**

## 4. Library of Congress

### API access, limits, and inventory

The loc.gov JSON/YAML API needs no key or authentication. It exposes search, collection, format, item, and resource endpoints. The Library documents 20 JSON/YAML requests per minute, 150 image-service requests per minute, 150 storage-service media requests per minute, and 60 streaming requests per minute. Exceeding a limit can trigger a one-hour block; heavy traffic can produce 429 responses or CAPTCHAs below the stated ceiling. ([API endpoints](https://www.loc.gov/apis/json-and-yaml/requests/endpoints/), [API limits](https://www.loc.gov/apis/json-and-yaml/working-within-limits/))

Keep queries under 1,000 items per page and 100,000 items per result set. For larger discovery jobs, divide queries by facets instead of deep paging. ([API limits](https://www.loc.gov/apis/json-and-yaml/working-within-limits/))

The Free to Use and Reuse page's live JSON representation listed **100 curated thematic sets** on 2026-08-14. Calculation: length of `content.components[0].results`. The result does not expose a deduplicated item total, and sets can point into much larger collections, so 100 sets is the only defensible current inventory figure from this endpoint. ([live Free to Use JSON](https://www.loc.gov/free-to-use/?fo=json), [Free to Use and Reuse portal](https://www.loc.gov/free-to-use/))

### Rights and permitted processing

Online availability alone does not grant reuse rights. The Library says it generally does not own collection copyright and tells reusers to inspect each item's “Rights and Access” or “Rights Advisory.” Items marked public domain or “no known copyright restrictions” may be used freely, while other records may depend on permission, a specific license, or a copyright exception. Records can contain incomplete or inaccurate rights information. ([Understanding Copyright](https://www.loc.gov/legal/security-copyright-and-privacy/understanding-copyright/), [LOC legal notice](https://www.loc.gov/legal/))

Works created by Library employees in their official duties are generally U.S. public-domain works, and the Library offers them worldwide under CC0 unless it states otherwise. The curated Free to Use sets identify rights-free selections, but the factory should still store each item's rights statement and canonical record rather than treating all loc.gov media as open. ([Understanding Copyright](https://www.loc.gov/legal/security-copyright-and-privacy/understanding-copyright/), [Free to Use and Reuse portal](https://www.loc.gov/free-to-use/))

The factory may pre-generate when the item record says public domain, CC0, rights-free, or no known copyright restrictions and no separate restriction conflicts. Store the item ID, collection, title, contributor, rights advisory, source URL, digital-file URL, retrieval date, and hash. “No known restrictions” reports the Library's knowledge rather than a rightsholder's license; give that class a separate risk flag and exclude sensitive people, trademarks, donor restrictions, and unclear modern works.

### API versus crawling

LOC robots.txt disallows `/search`, `/pictures/search`, and other paths for the generic agent and specifies a five-second crawl delay. The structured API publishes different service limits. Do not crawl HTML search results; make JSON/YAML API calls at 20 per minute and fetch media through the relevant media service at its own limit. ([LOC robots.txt](https://www.loc.gov/robots.txt), [API limits](https://www.loc.gov/apis/json-and-yaml/working-within-limits/))

**Operational rating: yellow; green only after an item-level Rights Advisory check.**

## 5. npm registry and downloads data

### Official endpoints and access rules

The public registry exposes package metadata at `GET https://registry.npmjs.org/:package`, version metadata at `/:package/:version`, and search at `/-/v1/search`. A full package document can contain the README, license field, author and maintainer details, versions, repository URL, and tarball URLs. ([package metadata documentation](https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md), [registry API documentation](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md))

The first-party downloads service responds at `/downloads/point/{period}/{package}` for aggregate counts and `/downloads/range/{period}/{package}` for daily counts. The npm-owned repository that documents these endpoints has been archived since 2020 and warns that its documentation may drift, although the live endpoints still respond. Treat the endpoints as available but unsupported until npm publishes current documentation. ([npm download-counts repository](https://github.com/npm/download-counts), [live point example](https://api.npmjs.org/downloads/point/last-week/npm))

npm's Open Source Terms allow package search and download through public APIs and allow Public Registry replication. They prohibit automated access to the npm Website, prohibit copying or sharing another person's personally identifiable information without permission, prohibit bypassing access controls, and prohibit unreasonable infrastructure load. The terms name **five million requests in a month** by one individual, organization, or affiliated group as unreasonable under all circumstances. This is a hard ceiling, not a recommended operating quota. ([npm Open Source Terms](https://docs.npmjs.com/policies/open-source-terms/))

npm's crawler policy says experimental Website crawlers may receive discretionary access at one request per second or less, while high-velocity crawling may trigger an IP or User-Agent ban. This language sits uneasily beside the binding terms' general ban on automated Website access. The safe implementation uses only public registry and downloads APIs and does not crawl npmjs.com. ([npm crawler policy](https://docs.npmjs.com/policies/crawlers/), [npm Open Source Terms](https://docs.npmjs.com/policies/open-source-terms/))

### Inventory and content rights

A live registry search for `keywords:` returned `total: 3,992,457` on 2026-08-14. This special search query is an indicative package-discovery count, not a guaranteed count of active, licensable packages. Packages can be deprecated, unpublished, malicious, private, or missing clear licenses. ([live registry search response](https://registry.npmjs.org/-/v1/search?text=keywords:&size=1&from=0))

npm does not own publisher content. Publishers choose package licenses, and npm warns that registry ownership and licensing metadata may be wrong. The service license lets npm host and analyze publisher content; it does not grant downstream video producers a blanket content license. ([npm Open Source Terms, “Your Content” and disclaimers](https://docs.npmjs.com/policies/open-source-terms/))

The factory may store package name, scope, current version, publish timestamps, deprecation status, repository URL, declared SPDX license, and download-count snapshots. Drop maintainer email addresses and other personal data at ingestion. Treat names, version numbers, dates, and download counts as facts; render them in the factory's own graphics. Paraphrase package descriptions unless a verified repository license covers documentation reuse.

Do not reproduce a README, README screenshot, embedded logo, demo GIF, or tarball asset in video solely because the registry returns it. Check the package/repository license and any asset-specific notice. Store the exact version and license evidence used for each pre-generated video because publishers can change metadata or unpublish a package.

**Operational rating: green for limited factual metadata through public APIs; yellow or red for README and media reuse.**

## 6. GitHub README, release, and asset data

### API access and limits

GitHub's REST API has a dedicated README endpoint and repository-content endpoint. Public README resources can be requested without authentication; the response can provide raw content, HTML, SHA, and source/download URLs. The releases endpoint exposes release name, tag, body, timestamps, author, and assets including filename, content type, size, digest, browser download URL, and download count. Public release resources can also be requested without authentication. ([README endpoint](https://docs.github.com/en/rest/repos/contents#get-a-repository-readme), [release endpoints](https://docs.github.com/en/rest/releases/releases))

The REST API permits 60 unauthenticated requests per hour for public data and 5,000 authenticated requests per hour for a user token. Current secondary controls include at most 100 concurrent REST and GraphQL requests and 900 REST points per minute, with most GET requests costing one point. Clients must honor 403/429 responses, `Retry-After`, and rate-limit reset headers; continuing during a limit can ban an integration. ([GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api))

GitHub's API Terms prohibit token sharing to evade limits and allow suspension for abuse or excessive requests. The Acceptable Use Policies distinguish scraping from API collection and prohibit excessive automated bulk activity, infrastructure burden, spam, and resale or exploitation of the Service without written permission. Use REST endpoints, conditional requests, and bounded queues. Do not scrape repository HTML or GitHub UI. ([GitHub Terms, API section](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service), [GitHub Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies))

### Rights in repository and release content

Repository owners retain ownership of their content. A public repository lets others view and fork content through GitHub and does not by itself grant broad off-platform republication or commercial derivative rights. An adopted repository license can grant additional rights; contributions to a repository with a license generally enter under that license. ([GitHub Terms, User-Generated Content](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service))

The same rule covers README text, release notes, screenshots, demo media, logos, and uploaded release assets. API availability proves access, not a license for a video transformation. A repository license may cover documentation and assets, but projects can exclude files, include third-party material, or attach separate notices. GitHub also forbids reuse of its HTML/CSS, JavaScript, and visual design elements without permission, so render facts in the factory's own visual system instead of filming or reproducing the GitHub interface. ([GitHub Terms, ownership and GitHub IP](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service))

The factory may store repository coordinates, default branch, description, topics, stars, forks, license metadata, README SHA, release ID, tag, release timestamps, asset filenames, content types, sizes, digests, and download counts. Avoid personal profile fields that the episode does not need. Keep the repository license file, commit SHA, release ID, asset-specific notice, and retrieval date with the video record.

For pre-generation:

1. Use names, versions, dates, public counts, and other factual metadata in original graphics.
2. Paraphrase README and release-body prose; do not ingest long passages into scripts by default.
3. Use repository or release media only after confirming commercial derivative rights under the applicable license and checking third-party notices.
4. Refresh license and availability before publication. A cached pre-generated video should fail closed if the repository becomes private, the asset disappears, or the recorded license no longer matches.

GitHub's Information Usage Restrictions expressly allow public non-personal information for open-access research and public information for archival purposes, and forbid spam uses. They do not state a clear blanket permission for a commercial entertainment catalog that republishes user content. The API Terms also contemplate paid high-throughput or resale access. Product counsel or written GitHub clarification should resolve this point before a high-volume commercial package leaderboard becomes a core feed. ([GitHub Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies), [GitHub Terms, API section](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service))

**Operational rating: green for bounded factual API metadata; yellow or red for README prose and release assets without verified licenses.**

## Storage and pre-generation policy

Create one immutable source manifest per candidate asset or package:

```json
{
  "provider": "met|smithsonian|commons|loc|npm|github",
  "source_id": "provider-stable-id",
  "canonical_url": "https://...",
  "api_url": "https://...",
  "source_revision": "revision-or-sha-if-available",
  "retrieved_at": "ISO-8601",
  "content_hash": "sha256:...",
  "rights_status": "cc0|public-domain|cc-by|cc-by-sa|no-known-restrictions|metadata-only|blocked",
  "license_url": "https://...",
  "rights_text": "verbatim provider rights field",
  "creator": "...",
  "credit_line": "...",
  "required_attribution": "...",
  "commercial_derivatives_allowed": true,
  "review_flags": ["privacy", "publicity", "trademark", "cultural-sensitivity"],
  "last_revalidated_at": "ISO-8601"
}
```

Store originals only for approved Tier A and Tier B items. For blocked or metadata-only candidates, keep identifiers, facts needed for deduplication, and the source URL, but do not keep the media payload or long copyrighted prose. Revalidate source status before publication and after any takedown notice. Keep an emergency suppression list keyed by provider ID and content hash so a withdrawn asset does not return through another query.

## Unresolved questions and recommended owner decisions

1. **The Met count discrepancy.** The hub says more than 492,000 Open Access works/images, while the live image-search query produces a smaller undocumented-query count. Use record-level flags, not a bulk count, for eligibility. Contact the institution through its official support channel if capacity planning needs a precise downloadable-image count. ([Open Access hub](https://www.metmuseum.org/hubs/open-access), [Collection API](https://metmuseum.github.io/))
2. **Smithsonian record versus file count.** The stats API counts records with CC0 media, not unique files. Run a bounded API sample before estimating storage and duplicate rates. ([live stats endpoint](https://api.si.edu/openaccess/api/v1.0/stats?api_key=DEMO_KEY))
3. **Commons ShareAlike in audiovisual works.** Decide whether to exclude CC BY-SA at launch or obtain counsel on the project's standard credit and licensing treatment. Public-domain, CC0, and CC BY files create a simpler first release. ([Commons license guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses/en))
4. **LOC “no known restrictions.”** Decide whether the business accepts the residual rights risk or limits launch inventory to explicit public-domain, CC0, and rights-free statements. ([LOC copyright guide](https://www.loc.gov/legal/security-copyright-and-privacy/understanding-copyright/))
5. **npm policy conflict and downloads support.** The crawler policy describes discretionary one-request-per-second Website crawling, while the terms prohibit automated Website access; the downloads documentation is archived. Keep npmjs.com out of the crawler and ask npm/GitHub legal for written confirmation before relying on the downloads service at scale. ([crawler policy](https://docs.npmjs.com/policies/crawlers/), [Open Source Terms](https://docs.npmjs.com/policies/open-source-terms/), [download-counts repository](https://github.com/npm/download-counts))
6. **GitHub commercial catalog use.** Public API access and public-repository visibility do not settle off-platform content rights or high-throughput commercial reuse. Keep the first implementation to factual metadata from licensed repositories, and seek GitHub clarification before selling a feed or using large volumes of README/release content. ([GitHub Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service), [GitHub Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies))

## Launch recommendation

Launch with The Met OA and Smithsonian CC0 as the media backbone. Add Wikimedia public-domain, CC0, and CC BY files after the attribution pipeline passes tests. Add LOC records with explicit public-domain, CC0, or rights-free notices. Use npm and GitHub only for factual package signals rendered in original graphics until the project has a license-aware repository/asset review and written answers for high-volume commercial use.
