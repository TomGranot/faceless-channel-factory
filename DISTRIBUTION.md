# Distribution

_Last reviewed: August 17, 2026_

**Current state:** public repository. The code and documentation gates pass, but version `1.0.0` still needs a matching tag and GitHub Release.

The GitHub repository is the source of truth. The canonical portable package lives at `.agents/skills/create-faceless-channel`; Claude Code plugin metadata and host adapters point back to that package.

## Install surfaces

| Surface | Route | Verification |
| --- | --- | --- |
| Open Skills CLI | `npx skills add <owner>/faceless-channel-factory --skill create-faceless-channel -g` | `npx skills add <owner>/faceless-channel-factory --list` finds one skill |
| Codex and Cursor | Skills CLI or the copy installer documented in the README | Start a clean session and request a channel scaffold |
| Claude Code standalone | Skills CLI, copy installer, or the repository adapter | Start a clean session and confirm skill discovery |
| Claude Code plugin | Repository marketplace manifest | Validate the plugin, install the tagged release, and invoke the namespaced skill |
| GitHub Release | Versioned source archive from a signed or annotated tag | Run the complete release gate against the tagged commit |

The README states which routes have deterministic checks and which still need a clean-host smoke test. Do not turn a successful package scan into a broader host-compatibility claim.

## Discovery channels

- [skills.sh](https://skills.sh/) for general Agent Skills discovery after the public repository has been indexed.
- [Awesome Agentic Growth & Marketing Skills](https://github.com/mikiarlo3/awesome-growth-hacking-skills) under social, community, and creator distribution.
- The repository's Claude Code marketplace manifest for plugin installation.
- GitHub topics, Releases, and the public README for direct discovery.

Directory submissions should link to a tagged release, describe the source-led and rights-aware scope, and avoid claims that depend on private production infrastructure.

## Release checklist

1. Run both skill validators, Python tests, worker tests, plugin validation, link checks, and the full-history secret scan.
2. Confirm the anonymized evidence file still matches every numeric README claim.
3. Confirm the host/version matrix and known limitations are current.
4. Create a version tag and GitHub Release with the validation commands and results.
5. Run one clean-host install from the tagged release before submitting directory pull requests.
6. Keep generated media, credentials, account identifiers, analytics exports, and provider state outside the release.

Publishing to a directory is a separate action from pushing repository changes. It requires a review of the exact listing text and destination.
