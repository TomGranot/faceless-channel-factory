# Channel configuration reference

Use this reference when creating or validating `channel.json`.

## Top-level fields

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `schemaVersion` | integer | yes | Configuration contract version. Current value: `2`. |
| `slug` | string | yes | Lowercase channel identifier. |
| `name` | string | yes | Human-facing channel name. |
| `promise` | string | yes | One sentence describing what viewers receive. |
| `lifecycle` | object | no | Channel state: `active`, `paused`, or `archived`, plus a reason and change date. |
| `accounts` | object | yes | Ownership and setup path. |
| `source` | object | yes | Discovery and capture contract. |
| `video` | object | yes | Render, narration, caption, and cover defaults. |
| `publication` | object | yes | Platforms, cadence, windows, scheduler, and Story policy. |
| `operations` | object | yes | Runtime, browser, alerts, analytics, and history. |
| `budget` | object | yes | Monthly ceiling and cost assumptions. |

## Lifecycle

- `status`: `active`, `paused`, or `archived`.
- `reason`: required when status is `paused` or `archived`.
- `changedAt`: ISO date for the state change.

A paused channel preserves its artifacts but must not run discovery timers, purchase provider work, connect publication accounts, schedule posts, or publish. Resuming it requires an explicit owner decision and a new observable-state check.

## Source

- `kind`: `api`, `feed`, `web`, `repository`, or `social`.
- `entrypoint`: URL used to discover candidates.
- `captureMode`: default `mobile-scroll`.
- `selectionRule`: plain-language selection contract.
- `rightsPolicy`: default `verify-before-publish`.

## Accounts

- `mode`: `new-brand`, `existing`, or `managed-setup`.
- `ownershipRequired`: must remain `true`.
- `schedulerCredentials`: default `bring-your-own`.
- `humanSetup.status`: `required`, `in-progress`, or `ready`.
- `humanSetup.requiredChecks`: machine-readable human steps derived from the destination list.
- `humanSetup.completedChecks`: checks the owner or authorized operator has completed and verified.

Every channel requires owner recovery and MFA, phone and desktop login checks, scheduler OAuth, and one reconciled private post. Instagram adds Professional-account, Facebook Page, and Page-linking checks. Facebook adds Page creation. TikTok adds account creation. YouTube adds channel creation and feature-eligibility review. The validator rejects `ready` while any required check remains incomplete.

## Video

- `aspectRatio`: default `9:16`.
- `targetSeconds`: default `35`.
- `visualTreatment`: default `source-scroll`.
- `voice`: `generated`, `recorded`, or `none`.
- `captions`: default `speech-aligned`.
- `cover`: default `first-useful-frame`.

## Publication

- `platforms`: subset of `instagram`, `facebook`, `tiktok`, `youtube`.
- `postsPerDay`: integer from `1` to `10`.
- `timezone`: IANA timezone.
- `windows`: local time ranges. The scaffold creates three broad windows.
- `scheduler`: default `postiz`.
- `story.mode`: `full-video`, `native-manual`, or `off`.
- `story.delayMinutes`: integer, default `10`.
- `story.interactiveLink`: must be `false` for automated Postiz Stories.

## Operations

- `runtime`: default `exe-dev`.
- `browser`: default `anchor`.
- `analytics`: default `postiz`.
- `alerts`: default `agentmail`; provision one dedicated channel inbox and complete its digest and failure-alert acceptance test before unattended production.
- `activityHistory`: default `git`.

## Validation errors

The validator rejects an unknown schema version, invalid slug, empty source URL, unsupported platform, incomplete or inconsistent human setup checks, non-IANA-looking timezone, cadence outside the allowed range, or an automated Story that claims an interactive link.
