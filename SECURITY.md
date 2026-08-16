# Security policy

## Supported version

Security fixes target the latest release on `main`.

## Report a vulnerability

Open a private security advisory in the repository. Do not place credentials, account identifiers, private publication URLs, raw provider responses, or personal data in a public issue.

Include the affected file or component, the observed behavior, the minimum reproduction, and the impact. Redact authorization headers, cookies, tokens, and account handles.

## Repository rules

- Commit credential names in `.env.example`; keep values outside Git.
- Keep live channel directories, generated media, queue state, and analytics exports ignored.
- Persist external-write intent before the request and reconcile uncertain outcomes before retrying.
- Log allowlisted fields only: opaque IDs, counts, states, durations, and error classes.
- Run the portable validator, tests, and full-history secret scan before release.
