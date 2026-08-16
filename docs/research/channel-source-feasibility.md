# Channel source feasibility for daily mobile-scroll videos

Researched 2026-08-09. This review uses first-party API documentation, source policies, and terms.

## Recommendation

Pilot the sources in this order:

1. Wikimedia Commons Picture of the Day
2. The Met Open Access collection
3. Smithsonian Open Access
4. Library of Congress Free to Use and Reuse
5. USGS earthquakes
6. SEC filings

These sources combine structured discovery, durable identifiers, useful source pages, and rights metadata that a worker can check before capture. NASA APOD also fits the format, but the worker must reject third-party copyrighted entries. GitHub, iNaturalist, and Stack Exchange need stricter per-item license handling.

Every channel should store a canonical source URL and place it in the post description. Where the platform makes links hard to reach, the render can add a short source URL or QR code on the final frame. The link should resolve through a channel-owned redirect so the destination can survive source URL changes.

## Comparison

| Channel concept | Daily supply | Durable key | Visual fit | Rights friction | Setup | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Commons Picture Story | Exact daily selection | Page ID, file title, file SHA-1 | Excellent | Low when attribution comes from file metadata | No key | Pilot first |
| Museum Object Daily: The Met | Large evergreen inventory | `objectID` | Excellent | Low for records with `isPublicDomain=true` | No key | Pilot first |
| Smithsonian Object Story | Large evergreen inventory | EDAN item ID | Excellent | Low for CC0 media | Free API key | Pilot first |
| Library Time Machine | Large curated inventory | loc.gov item ID or canonical item URL | Excellent | Low inside Free to Use and Reuse sets | No key | Pilot first |
| Quake Story | Fresh events every day | USGS event `id` | Strong maps and event pages | Low for USGS-produced material | No key | Pilot first |
| Filing Story | Fresh filings on business days | CIK plus accession number | Good text scroll | Low according to SEC reuse policy | No key | Strong specialist channel |
| NASA Image Explained | Exact daily selection | APOD `date` | Excellent | Medium because APOD can contain third-party media | Free API key, `DEMO_KEY` for testing | Pilot with a hard rights gate |
| Rule Change Daily | Fresh documents on business days | Federal Register `document_number` | Good text scroll | Low for federal text, with exceptions | No key | Strong specialist channel |
| Wild Sighting Daily | Heavy daily supply | Observation ID plus photo ID | Excellent | Medium to high because every photo has its own license | No key for reads | Pilot only with license filtering |
| Stack Answer Story | Heavy daily supply | `question_id`, answer ID, revision | Good code and text scroll | Medium because CC BY-SA attribution and adaptation rules apply | Optional API key for quota | Feasible with a license template |
| New GitHub Tool | Heavy daily supply | Repository numeric ID plus README blob SHA | Strong when the README has demos | High because repository assets keep their own rights | Optional token for quota | Feasible after a license gate |

## Source notes

### 1. Commons Picture Story

- **Source and key:** Resolve the daily selection from the [Picture of the Day](https://commons.wikimedia.org/wiki/Commons:Picture_of_the_day/en), then store the MediaWiki page ID, file title, and SHA-1. The [Categorymembers API](https://www.mediawiki.org/wiki/API:Categorymembers) and [Imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo) expose the needed fields.
- **Visual and rights:** The file page combines the full image, caption, creator, source, and license. Build the on-frame credit from `extmetadata`; each file can impose different attribution or share-alike terms. See the Commons [reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses).
- **Automation:** No key. Cache the resolved record before capture.

### 2. Museum Object Daily: The Met

- **Source and key:** Rotate through unseen `objectID` values from [The Met Collection API](https://metmuseum.github.io/) and store the canonical `objectURL`.
- **Visual and rights:** Object pages combine strong imagery with maker, date, medium, dimensions, culture, and credit line. Require `isPublicDomain=true` and a non-empty `primaryImage`.
- **Automation:** No key. A seeded unseen-ID queue gives a reproducible daily selection.

### 3. Smithsonian Object Story

- **Source and key:** The official [Smithsonian Open Access client](https://github.com/Smithsonian/smithsonian-openaccess) supports search plus `newest`, `updated`, and `random` sorting. Store the EDAN item ID and record URL.
- **Visual and rights:** Records can include JPG, TIFF, 3D, and IIIF assets. Accept only CC0 media. The [Open Access FAQ](https://www.si.edu/openaccess/faq) recommends a title, author, source, license, and URL credit; the [Terms of Use](https://www.si.edu/termsofuse) note possible privacy, publicity, and trademark rights.
- **Automation:** Requires a free `api.data.gov` key. Fail closed when the asset lacks a CC0 marker.

### 4. Library Time Machine

- **Source and key:** The [loc.gov API](https://www.loc.gov/apis/json-and-yaml/) searches digitized photos, maps, books, and manuscripts without authentication. Store the item ID and canonical URL.
- **Visual and rights:** Start inside the curated [Free to Use and Reuse sets](https://www.loc.gov/free-to-use/) and retain each collection's rights statement. The Library's [copyright guidance](https://www.loc.gov/legal/understanding-copyright/) warns that the wider collection has no blanket permission.
- **Automation:** No key, with rate limits. Store the rights URL beside the item.

### 5. Quake Story

- **Source and key:** Select the highest qualifying `sig` value from the USGS past-day [GeoJSON feeds](https://earthquake.usgs.gov/earthquakes/feed/). Store the event `id`, `updated` timestamp, and detail URL; the [format](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) documents each field.
- **Visual and rights:** Event pages provide maps, magnitude, depth, felt reports, alerts, and impact products. USGS data are public domain, but third-party images can appear; credit USGS and inspect visual credits under the [USGS policy](https://pubs.usgs.gov/documentation/faq).
- **Automation:** No key. Treat an updated event as a new revision, not a new story.

### 6. Filing Story

- **Source and key:** Poll the [EDGAR submissions API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) for a company watchlist or use official [latest filings and RSS](https://www.sec.gov/search-filings). Store CIK, accession number, form type, filing date, and archive URL.
- **Visual and rights:** Filing HTML and Inline XBRL support precise text and table scrolls. The SEC says public EDGAR filing content is free to reuse in its [webmaster FAQ](https://www.sec.gov/about/webmaster-frequently-asked-questions).
- **Automation:** No key. Send a descriptive `User-Agent`, cache, use bulk files for backfills, and stay under 10 requests per second across all machines under [SEC developer guidance](https://www.sec.gov/about/developer-resources).

### 7. NASA Image Explained

- **Source and key:** [NASA APOD](https://api.nasa.gov/) returns one record per date with title, explanation, media type, URL, and an optional `copyright` field. Use the date plus a media hash as the key.
- **Visual and rights:** NASA media generally support factual informational use with source credit, but APOD includes third-party work. Reject a non-empty `copyright` field and non-image entries unless a separate review clears them. Follow NASA's [media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
- **Automation:** Use a registered key in production; `DEMO_KEY` fits testing.

### 8. Rule Change Daily

- **Source and key:** The Federal Register [documents API](https://www.federalregister.gov/api/v1/documents.json) returns document number, type, abstract, agency, publication date, HTML URL, and official PDF URL. Store `document_number` and the govinfo PDF URL.
- **Visual and rights:** HTML supports mobile scrolling; the PDF preserves evidence. Federal text generally enters the public domain, but publications can embed third-party copyrighted material. The [GovInfo policy](https://www.govinfo.gov/about/policies) explains the exception.
- **Automation:** No key. Use the API, not search-page scraping.

### 9. Wild Sighting Daily

- **Source and key:** Query the [iNaturalist API](https://api.inaturalist.org/v2/docs/) by date, place, taxon, and quality grade. Store observation ID, photo ID, update time, and URL.
- **Visual and rights:** Pages combine photos, maps, identity history, and observer notes. Treat observation data and each photo as separately licensed. The default CC BY-NC license does not fit a monetized channel, so accept only an approved license such as CC0 or CC BY and render the observer credit. See the official [license help](https://help.inaturalist.org/en/support/solutions/articles/151000175695), [Open Data documentation](https://github.com/inaturalist/inaturalist-open-data), and [Terms](https://www.inaturalist.org/pages/terms).
- **Automation:** No key for public reads. Recheck the photo license at render time.

### 10. Stack Answer Story

- **Source and key:** Poll questions by tag and sort by activity, creation, or votes. Store `question_id`, answer ID, last-edit time, and link. The [questions endpoint](https://api.stackexchange.com/docs/questions-by-ids) and [question schema](https://api.stackexchange.com/docs/types/question) expose those fields.
- **Visual and rights:** Question pages provide code and text scrolls. Public contributions carry CC BY-SA, and API applications must identify Stack Exchange as the source. Credit the title, authors, source link, and license, and mark adaptations. See [Stack Overflow licensing](https://stackoverflow.com/help/licensing) and [API terms](https://meta.stackoverflow.com/legal/api-terms-of-use).
- **Automation:** A key raises quota. Honor API `backoff` responses.

### 11. New GitHub Tool

- **Source and key:** Use [repository search](https://docs.github.com/en/rest/search/search#search-repositories) with explicit creation date, push date, language, topic, and activity thresholds. Store repository numeric ID, full name, commit SHA, and README blob SHA from the [contents API](https://docs.github.com/en/rest/repos/contents).
- **Visual and rights:** READMEs often contain screenshots, GIFs, code, and demos. Public visibility grants viewing and forking inside GitHub, not blanket off-platform reuse. Require a detected license and inspect asset-specific notices. GitHub's [licensing guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) and [Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) support this gate.
- **Automation:** Use a read-only token for production quota and cache each search window. Do not treat the human Trending page as an API contract.

## Factory requirements these sources imply

Each source adapter should return the same minimum evidence record:

```json
{
  "source": "source-adapter-name",
  "source_item_id": "durable provider identifier",
  "source_revision": "timestamp, version, or content hash",
  "canonical_url": "human source page",
  "capture_url": "page the browser will record",
  "media_urls": [],
  "license": "machine-normalized license or public-domain status",
  "license_url": "first-party license or item-rights page",
  "attribution_text": "render-ready credit",
  "rights_evidence": {},
  "discovered_at": "ISO-8601 timestamp"
}
```

The pipeline should fail before capture when any required rights field is missing. It should store a screenshot or raw metadata response as rights evidence, because a source can change a license or remove an item after publication.

The daily selector should also enforce four content gates:

1. The source ID has not appeared in the channel history.
2. The source page has enough vertical material for the target runtime.
3. The narration claims map to visible source passages or metadata.
4. The current rights record permits the planned commercial use and transformation.

These gates let one machine run several channels without turning source selection into an unreviewable scrape.
