<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

<p align="center">
  <img src="docs/assets/readme-banner.png" alt="An impossible loom turning observable signals into one traceable ribbon of moving scenes" width="100%">
</p>

<h1 align="center">Faceless Channel Factory</h1>

<p align="center"><strong>Source-backed short-video channels, from discovery to recovery.</strong></p>

<p>
  Turn licensed, public-domain, or otherwise permitted web sources into auditable videos, scheduled posts, analytics, and bounded repair.
</p>

<p>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1f5c48.svg" alt="MIT license"></a>
  <a href=".agents/skills/create-faceless-channel/SKILL.md"><img src="https://img.shields.io/badge/Agent%20Skill-Codex%20%7C%20Claude%20Code%20%7C%20Cursor-315c87.svg" alt="Agent Skill for Codex, Claude Code, and Cursor"></a>
  <a href="#what-it-proved-in-live-trials"><img src="https://img.shields.io/badge/live%20trial-138%20published%20effects-b95f3b.svg" alt="138 published effects in a live trial"></a>
</p>

<p>
  <a href="#install-it"><strong>Install</strong></a> ·
  <a href="#start-in-60-seconds">Quick start</a> ·
  <a href="#what-it-proved-in-live-trials">Live evidence</a> ·
  <a href="docs/production-field-notes.md">Field notes</a> ·
  <a href="#how-it-differs-from-moneyprinterturbo">Comparison</a> ·
  <a href="DISTRIBUTION.md">Distribution</a> ·
  <a href="docs/architecture.md">Architecture</a> ·
  <a href="ROADMAP.md">Roadmap</a>
</p>

Start with a source. The skill defines a pipeline for discovery through documented APIs, feeds, repositories, or approved browser workflows; source and rights evidence; capture; rendering; idempotent publishing; measurement; and repair. The implementation boundary below distinguishes shipped code from operator-supplied integrations.

## Start in 60 seconds

No provider account or credential is required to scaffold a channel contract.

```bash
git clone https://github.com/<owner>/faceless-channel-factory.git
cd faceless-channel-factory

python3 scripts/create-channel.py \
  --root channels \
  --slug public-signal-radar \
  --name "Public Signal Radar" \
  --source "https://api.example.com/items" \
  --source-kind api \
  --platforms instagram,facebook,tiktok \
  --posts-per-day 3 \
  --timezone Europe/Amsterdam

python3 scripts/validate-channel.py \
  channels/public-signal-radar/channel.json
```

The scaffold writes a credential-free contract with rights gates, human account checks, destinations, schedule, cost inputs, and recovery policy. It refuses to overwrite an existing channel.

## What is included

| This repository provides | You connect for production |
| --- | --- |
| A portable Agent Skill for Codex, Cursor, Claude Code, and other Agent Skills hosts | A documented source, feed, repository, or approved browser workflow |
| Channel scaffolding, validation, and explicit cost estimation | Browser capture, rendering, voice, and persistent worker infrastructure |
| Contracts for evidence, rights, visual QA, publishing state, analytics, and bounded repair | Brand-owned social accounts and scheduler authorization |
| A guarded Instagram comment-to-DM reference worker with fixture tests | Provider credentials, alert transport, and private operating state |
| Production regressions distilled into acceptance criteria and deterministic fixtures | A human owner for rights, billing, account, and ambiguous-write gates |

Use it as a normal Agent Skill, an installable Claude Code plugin, or a production contract for a custom runtime. Generated media, live queues, account identifiers, analytics exports, and credentials stay outside Git.

## Source and rights matrix

The source itself is the editorial spine. Every item must clear an acquisition and reuse gate before scripting.

| Source family | Preferred acquisition | Release gate | Pre-generation |
| --- | --- | --- | --- |
| Open-access public collections | Documented collection API or bulk feed | The record and media carry the required public-domain, Open Access, or CC0 marker | Allowed after provenance capture |
| Licensed media archives | Official API | Item-level license or rights advisory supports the intended use | Conditional |
| npm and GitHub | Registry or platform API | Facts may be visualized; prose, logos, screenshots, and release assets require a compatible license or permission | Conditional |
| Other feeds, repositories, and pages | Documented API or feed first; approved browser workflow when necessary | Terms, robots guidance, content rights, privacy, publicity, trademark, and endorsement checks | Policy-specific |

Read the dated [source-permissions report](docs/research/source-permissions-collection-and-package.md) and the skill's [source-rights contract](.agents/skills/create-faceless-channel/references/source-rights.md) before adding a connector. These are operational controls, not legal advice.

## What it proved in live trials

One anonymized runtime supported:

- **2 unrelated content niches** built from different source types;
- **6 destination integrations** across Facebook, Instagram, and TikTok;
- **138 published effects** between August 1 and August 16, 2026;
- missing analytics preserved as missing instead of reported as zero.

| Instagram snapshot | Format A | Format B |
| --- | ---: | ---: |
| Views | 7,859 | 2,356 |
| Viewers | 5,424 | 1,964 |
| Interactions | 286 | 99 |
| Views from non-followers | 98.6% | 99.7% |

The full [live-trial report](docs/live-trial.md) separates publication counts from account metrics, records incompatible platform definitions, and states the limits of the comparison. CI keeps these claims aligned with the [anonymized machine-readable summary](docs/evidence/live-trial-summary.json).

## What the skill does

```text
discover -> verify rights and evidence -> select -> capture
         -> script -> narrate -> render -> visual QA
         -> approve exact media -> schedule idempotently
         -> reconcile -> measure -> improve or repair
```

The skill treats publication as a stateful system:

- Every claim keeps a source record.
- Every irreversible provider action starts with persisted intent and a stable idempotency key.
- A successful process exit does not prove a good video or a published post.
- A failure alert starts bounded recovery. It does not finish recovery.
- Missing analytics remain missing. The reporter never turns them into zero.
- A comment CTA ships only when the matching per-post private-reply route works.

### Implementation boundary

| Stage | Status in this repository |
| --- | --- |
| Channel contract, validation, cost model | Shipped and covered by deterministic tests |
| Rights, evidence, visual-QA, publishing, analytics, and repair policies | Shipped as Agent Skill contracts and acceptance criteria |
| Instagram comment-to-DM route | Shipped as a guarded reference worker with fixture tests and manual reconciliation |
| Source discovery, browser capture, voice, rendering, scheduling, analytics collection | Operator-supplied integrations; reference implementations remain on the roadmap |
| Live media, credentials, queues, provider state | Deliberately excluded from Git |

## How it differs from MoneyPrinterTurbo

[MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) is a strong fit for turning a topic or keyword into a finished video with a generated script, matched stock or local footage, narration, captions, music, and optional publishing. Faceless Channel Factory starts from documented source material and builds the operating system around an ongoing channel.

| | Faceless Channel Factory | MoneyPrinterTurbo |
| --- | --- | --- |
| Starting point | A documented API, feed, repository, public collection, or approved page | A topic, keyword, or custom script |
| Visual spine | The real source artifact: page, item, record, or original visualization | Local assets or stock footage matched to the script |
| Rights and provenance | A per-item evidence record, rights policy, source URL, retrieval time, and media hash are release gates | The README documents local and free-stock source options; a per-video evidence manifest is not presented as the core workflow |
| Primary unit | A recurring channel with sources, destinations, schedule, experiments, and operating state | A generated video project |
| Publishing | Idempotent outbox, separate feed and Story effects, scheduler reconciliation, and guarded comment-to-DM routes | One-click publishing to supported short-video platforms |
| Failure and measurement | Visual QA, bounded repair, reconciliation, daily analytics, and explicit missing-data handling | Generation, preview, and upload workflow |
| Best fit | Source-led explainers and data-backed recurring formats | Fast topic-to-video production with generated narration and stock or local footage |

Choose MoneyPrinterTurbo when speed from topic to finished video is the main constraint. Choose this factory when the source itself is the story and each post needs defensible provenance, publishing state, analytics, and recovery.

## Install it

List or install the portable skill through the open Skills CLI:

```bash
npx skills add <owner>/faceless-channel-factory --list
npx skills add <owner>/faceless-channel-factory \
  --skill create-faceless-channel \
  -g
```

The CLI discovers the canonical package in `.agents/skills`. The repository also supports the host-specific routes below.
Replace `<owner>` with the GitHub account or organization that hosts the repository.

### Claude Code plugin

Test the repository without installing it:

```bash
claude --plugin-dir .
```

The skill is available as `/faceless-channel-factory:create-faceless-channel`.

For marketplace installation, add the Git repository and install the plugin:

```text
/plugin marketplace add <owner>/faceless-channel-factory
/plugin install faceless-channel-factory@faceless-channel-tools
/reload-plugins
```

Replace `<owner>` with the GitHub account or organization that hosts the repository. Claude Code copies marketplace plugins into its plugin cache, so every bundled skill file must stay inside this repository.

### Codex and Cursor

Both discover the canonical project skill at:

```text
.agents/skills/create-faceless-channel/
```

Clone the repository and work from its root. For a user-wide install on macOS, Linux, or Windows, use the copy-based installer:

```bash
python3 scripts/install-skill.py --host codex
python3 scripts/install-skill.py --host cursor
```

The installer refuses to replace an existing skill. On Unix systems, you may link the canonical directory instead:

```bash
mkdir -p ~/.agents/skills
ln -s "$PWD/.agents/skills/create-faceless-channel" \
  ~/.agents/skills/create-faceless-channel
```

Cursor may also use `~/.cursor/skills/`. Codex can attach optional UI metadata from `agents/openai.yaml`.

### Claude Code standalone skill

The repository includes a project adapter at `.claude/skills/create-faceless-channel`. Claude Code 2.1.203 and later document directory-symlink discovery. On an older release, use the plugin path above or copy the canonical skill instead. For a user-wide standalone copy:

```bash
python3 scripts/install-skill.py --host claude
```

On Unix systems, you may use a symlink instead:

```bash
mkdir -p ~/.claude/skills
ln -s "$PWD/.agents/skills/create-faceless-channel" \
  ~/.claude/skills/create-faceless-channel
```

### Other coding agents

Copy `.agents/skills/create-faceless-channel` into the host's Agent Skills directory. The shared `SKILL.md` uses portable frontmatter and relative resource links. Host-specific metadata lives outside the shared core.

## Start a channel contract

No provider account is required to design or scaffold a channel.

```bash
python3 .agents/skills/create-faceless-channel/scripts/scaffold_channel.py \
  --root channels \
  --slug demo-radar \
  --name "Demo Radar" \
  --source "https://example.com/feed" \
  --source-kind feed \
  --platforms instagram,facebook,tiktok \
  --posts-per-day 3 \
  --timezone Europe/Amsterdam

python3 .agents/skills/create-faceless-channel/scripts/validate_channel.py \
  channels/demo-radar/channel.json
```

The scaffold refuses to overwrite an existing channel and writes credential names only. Bring your own source, browser, voice, scheduler, social accounts, worker, and alert transport when you move from design to production.

## Human work before automation

Account setup is a production gate. The scaffold writes platform-specific steps into `accounts.humanSetup.requiredChecks` and refuses a false `ready` state.

A human owner or authorized operator must:

- create or recover every account on a phone and verify its desktop login;
- control the recovery address, MFA, and backup codes;
- switch Instagram to a Professional account;
- create an owner-controlled Facebook Page and link it to Instagram;
- create and verify TikTok, then create and verify YouTube when Shorts joins the channel;
- approve each scheduler OAuth connection and reconcile one private or disposable post.

Meta permits a standalone Professional Instagram account. This factory requires the linked Facebook Page for its full third-party publishing, cross-app inbox, analytics, and comment-reply workflow. See the [account setup guide](docs/account-setup.md) for the exact acceptance test.

TokPortal is an optional managed path for country-local TikTok and Instagram setup and publishing. It does not complete the Facebook or YouTube work. During the August 2026 trial, the operator used USD 200–250 per month as a rough planning range. Recheck the provider's platform coverage, terms, ownership handoff, and current price before purchase.

## Lessons captured from production

The regression bank records the failures behind these acceptance criteria:

- **Rights stay in the machine record.** Verify license, source URL, retrieval time, and media hash before scripting. Keep routine compliance language out of narration and viewer-facing end cards.
- **The opening frame needs its own QA.** A close detail can hold briefly while narration starts; the reveal can then accelerate. Sample early frames for dither, tiling, blanks, luminance spikes, and unexpected crops.
- **Use the renderer's matching headless browser.** Desktop Chrome completed some frame renders while producing corrupted output or stalling before encoding. An isolated Chrome Headless Shell render fixed both classes of failure.
- **Caption spaces are data.** Alignment tokens often carry leading spaces that HTML collapses. Normalize token boundaries, preserve whitespace in the container, and test punctuation followed by a capital letter.
- **Provider limits are empirical.** A documented API ceiling did not prevent a practical WAF block. Cache valid item responses, stop on repeated HTML `403`s, cool down, probe once, then resume slowly.
- **A metric is a hook, not a story.** A download spike alone did not sustain a developer video. Move to the graph within about two seconds, then pay off a second source-backed question with a new visual scene.
- **Scheduling is an outbox problem.** Upload, feed post, Story, analytics email, and private reply are separate effects. Reconcile ambiguous results before retrying any write.
- **Alerts invoke recovery.** Retry transient reads, skip unchanged quota failures, preserve valid artifacts, start one bounded repair worker, and verify the scheduler after the repair.
- **A CTA creates an obligation.** Bind each published media ID to that post's destination URL. Persist reply intent, deduplicate by comment ID, and quarantine uncertain sends.
- **Account state changes the experiment.** Record Professional conversion, Page linking, verification, and scheduler reconnection beside the analytics snapshot. Compare launch cohorts at fixed post ages.

Read the complete acceptance criteria in [production-regressions.md](.agents/skills/create-faceless-channel/references/production-regressions.md). The repository executes deterministic scaffold, package, installation, and worker fixtures in CI. Agent-behavior prompts in `evals/evals.json` remain evaluation specifications until a host-backed runner executes them.

The [production field notes](docs/production-field-notes.md) put these failures in sequence. They use relative time and generic system roles so the operational lessons remain public without exposing the live channel, accounts, providers, identifiers, or infrastructure.

## Repository map

```text
.agents/skills/create-faceless-channel/   portable skill source
.claude/skills/                           Claude project adapter
.claude-plugin/                           Claude plugin and marketplace manifests
services/instagram-comment-link-dms/      guarded comment-to-DM reference worker
docs/                                     tutorials, reference, architecture, and research
scripts/                                  repository-level wrappers and validation
tests/                                    deterministic scaffold and package tests
```

Generated video, account configuration, live queues, analytics snapshots, and provider credentials stay outside Git.

## Validate before release

```bash
python3 scripts/validate-skill.py \
  .agents/skills/create-faceless-channel --strict

uvx --from 'skills-ref==0.1.1' agentskills validate \
  .agents/skills/create-faceless-channel

python3 -m unittest discover -s tests -v
npm --prefix services/instagram-comment-link-dms test
claude plugin validate . --strict
gitleaks git . --redact
```

The fixture-mode comment worker makes no provider request. Live comment replies remain disabled until the operator supplies official platform credentials, creates a mode-`0600` unlock file, confirms the write phrase, and passes one private test comment per account.

## Security and privacy

- Commit `.env.example` variable names only.
- Keep provider tokens in a host secret store or a mode-`0600` environment file.
- Log allowlisted opaque IDs, counts, states, durations, and error classes. Exclude authorization headers, cookies, prompts, account handles, raw provider responses, and full request bodies.
- Scan the working tree and complete Git history before publishing.
- Keep live account names, integration IDs, publication URLs, queue records, and analytics exports out of examples and reports.
- Treat every binary asset as a privacy decision. The current allowlist contains one owner-approved banner portrait; CI rejects embedded text and EXIF metadata.

## Documentation

- [Build your first channel](docs/tutorial.md)
- [Review the live-trial evidence](docs/live-trial.md)
- [Read the production field notes](docs/production-field-notes.md)
- [Add a channel to a worker](docs/how-to-add-a-channel.md)
- [Set up accounts and credentials](docs/account-setup.md)
- [Interpret analytics and experiments](.agents/skills/create-faceless-channel/references/analytics-and-experiments.md)
- [Understand the architecture](docs/architecture.md)
- [Review source feasibility](docs/research/channel-source-feasibility.md)
- [Review source permissions](docs/research/source-permissions-collection-and-package.md)
- [Read the channel configuration reference](docs/channel-config.md)
- [Review the changelog](CHANGELOG.md)
- [Review distribution and release channels](DISTRIBUTION.md)
- [See the roadmap](ROADMAP.md)
- [Review host compatibility](docs/host-compatibility.md)
- [Apply GitHub production settings](docs/github-settings.md)
- [Contribute](CONTRIBUTING.md) or [get support](SUPPORT.md)

## License

MIT
