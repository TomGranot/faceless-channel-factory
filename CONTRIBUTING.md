# Contributing

Contributions should make the factory safer, easier to adopt, or more honest about its operating limits.

## Before opening a change

1. Open an issue for a new source family, provider adapter, schema change, or external-write path.
2. Keep the change focused. Separate documentation, runtime behavior, and generated media when reviewers need different evidence.
3. Never commit credentials, account handles, integration IDs, live queue state, publication URLs, analytics exports, or raw provider responses.

## Source connectors

A source connector must document:

- the official API, feed, repository, or approved browser path;
- current first-party terms and robots guidance;
- what may be stored, transformed, and published;
- the item-level evidence required before release;
- rate limits, caching rules, and a dated review timestamp.

Update the [source-rights contract](.agents/skills/create-faceless-channel/references/source-rights.md) or the dated [permissions report](docs/research/source-permissions-collection-and-package.md) when the connector changes a supported source policy.

## Runtime changes

Preserve these invariants:

- persist intent before an irreversible provider request;
- give each external effect a stable idempotency key;
- reconcile an uncertain result before retrying;
- keep rights, visual QA, account ownership, billing, and ambiguous mutations as human gates;
- treat alerts as the start of bounded recovery;
- preserve missing analytics as missing.

Add a regression test or fixture for every confirmed failure mode.

## Validate the change

Run:

```bash
python3 scripts/validate-skill.py \
  .agents/skills/create-faceless-channel --strict
python3 -m unittest discover -s tests -v
npm --prefix services/instagram-comment-link-dms test
claude plugin validate . --strict
```

Run `gitleaks git . --redact` before requesting a release.

## Pull requests

Describe the user problem, the contract or behavior that changed, the evidence used, and the validation result. Include screenshots or sanitized fixtures when they help review. Keep live account and provider data out of the pull request.
