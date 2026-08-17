# Changelog

This file records user-visible changes to the portable skill, plugin, reference worker, and repository contract.

## Unreleased

No unreleased changes.

## 1.0.0 - 2026-08-17

### Added

- A direct quickstart and an explicit boundary between repository components and production integrations.
- A source and rights matrix linked to the dated permissions research.
- A standalone, anonymized live-trial report.
- Contribution, support, roadmap, conduct, issue, and pull-request guidance.
- A cross-platform copy installer and portability checks for macOS, Linux, and Windows.
- A guarded manual reconciliation command for ambiguous Instagram private replies.
- CodeQL and Dependabot configuration.

### Changed

- The README now leads with setup and proof before the competitor comparison.
- GitHub Actions and validation tools are pinned to reviewed versions.
- The README labels agent-behavior evals as specifications until a host-backed runner executes them.

### Fixed

- Long-running comment workers renew an owner-specific lease and cannot lose mutual exclusion because of lock age alone.
- Crash-stranded `sending` records move to an explicit `uncertain` state for manual reconciliation.
- Malformed caption URLs no longer abort a complete polling cycle.
- Support requests use an enabled GitHub issue form.

### Security

- Binary assets require an explicit privacy decision and may not carry embedded text or EXIF metadata.

## Release policy

Each release should state:

- supported Agent Skills hosts and tested versions;
- schema or behavior changes affecting channel contracts;
- new or changed provider assumptions;
- known limitations and required human gates;
- the validation commands run against the release commit.

Install production deployments from a tagged release or an exact commit rather than an unpinned branch.
