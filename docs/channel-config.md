# Channel configuration reference

`channel.json` uses schema version `2`.

| Section | Purpose |
| --- | --- |
| `accounts` | New, existing, or managed account setup, ownership, and machine-readable human readiness |
| `source` | Discovery entrypoint, capture mode, selection rule, and rights policy |
| `video` | Aspect ratio, target duration, visual treatment, voice, captions, and cover |
| `publication` | Platforms, cadence, timezone, windows, scheduler, and Story mode |
| `operations` | Worker, browser, analytics, alert, and history providers |
| `budget` | Monthly ceiling and cost categories |

Run `python3 scripts/validate-channel.py <path>` after every edit. The validator checks identifiers, source URL, platforms, cadence, timezone shape, the human account checklist, and the automated Story link constraint. It rejects a channel marked `ready` until every required human check appears in `completedChecks`.

For the complete field contract used by agents, see [the skill reference](../.agents/skills/create-faceless-channel/references/configuration.md).
