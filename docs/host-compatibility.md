# Host compatibility

The canonical skill follows the Agent Skills directory format and keeps host-specific metadata outside its portable core.

| Path | Automated check | Remaining manual check |
| --- | --- | --- |
| Claude Code plugin | Manifest validation in the release checklist | Install the tagged marketplace release and invoke the namespaced skill |
| Claude Code standalone | Copy installer runs on macOS, Linux, and Windows | Confirm discovery on the supported Claude Code release |
| Codex | Copy installer runs on macOS, Linux, and Windows | Confirm the skill appears in a clean Codex session |
| Cursor | Copy installer runs on macOS, Linux, and Windows | Confirm the skill appears in a clean Cursor session |
| Other Agent Skills hosts | Portable frontmatter and relative-link validation | Copy into the host's documented skill directory and run one scaffold prompt |

Run a copy installation without touching a real user directory:

```bash
python3 scripts/install-skill.py \
  --host codex \
  --destination /tmp/create-faceless-channel
```

The installer refuses to overwrite an existing directory. Remove the temporary directory after inspection.
