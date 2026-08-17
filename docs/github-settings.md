# GitHub production settings

Repository files configure CI, CodeQL, Dependabot update proposals, issue forms, and contribution guidance. A maintainer must apply the remaining controls in GitHub after pushing the release commit.

## Main-branch ruleset

Create a ruleset for `main` that:

- requires a pull request and one approving review;
- requires every `validate` matrix job, the secret scan, and CodeQL to pass;
- requires conversations to be resolved;
- blocks force pushes and branch deletion;
- allows bypass only for a named emergency maintainer role.

Select the exact status-check names after the first workflow run because GitHub derives matrix names from the runner operating system.

## Security settings

Enable:

- Dependabot alerts and security updates;
- secret scanning and push protection;
- private vulnerability reporting;
- CodeQL default or advanced setup, but not both.

Keep the default workflow token read-only. Grant `security-events: write` only to CodeQL. Limit allowed Actions to the SHA-pinned actions in `.github/workflows/`.

## Release check

Before publishing a tag:

1. Run every command in the README release checklist.
2. Confirm the staged diff and complete history contain no credentials or private operating data.
3. Push the commit and wait for required checks.
4. Create the signed or annotated tag from the checked commit.
5. Publish release notes from `CHANGELOG.md` and record tested host versions.
