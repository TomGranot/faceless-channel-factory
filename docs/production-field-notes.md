# Production field notes

These notes follow one anonymized runtime from its first successful production render. The clock uses elapsed operating time. We record the visible failure, the repair, and the evidence from the next run.

Live identifiers, channel details, providers, accounts, URLs, exact dates, and infrastructure stay in the private operating record.

## Day 1: effect boundaries and writable state

The first publication run exposed two false assumptions.

The runtime treated a feed post and its secondary-format treatment as one effect. The secondary format used the wrong treatment, then the alert transport rejected the mismatch report. We split the effects, assigned each its own stable idempotency key, and validated alert keys before delivery. The runtime now asks the operator to resolve a mismatch instead of applying an unstated policy.

The analytics process then failed while writing state. Its service sandbox protected the application directory, but the runtime state still lived inside that protected tree. We moved state behind an explicit writable boundary while keeping the code read-only. The retry completed and preserved the snapshot.

## Day 2: supply, eligibility, and history

The automatic batch exhausted its candidate pool. The source gate admitted too few truthful visual sources, and later narration checks rejected the remainder. We added source-specific adapters, kept rejection reasons, and continued scanning until the batch reached its target or tested each candidate.

A later batch created three media files, but the scheduler found two eligible items. The renderer counted file creation as success before it ran the final publication policy. We moved that policy into the renderer's success condition. The renderer keeps a rejected artifact for diagnosis but excludes it from the publishable count.

The activity writer also competed with a Git-backed history sync. Uncommitted state stopped the sync and left the audit trail behind production. We isolated history in its own clone, serialized writers, and moved frequent evidence commits to a dedicated branch. Application work no longer shares a worktree or release branch with evidence replication.

## Day 6: retries need a failure class

A quota gate could not change without human action, but the generic service retry repeated the same request. We classified quota exhaustion as an external blocker, preserved the completed artifacts, and stopped automatic repair until the prerequisite changed.

An analytics snapshot failed for the opposite reason: one read returned a transient gateway error, and the whole collection aborted. We added bounded retry to read-only calls and kept the final write atomic. The next clean run recovered the full snapshot without duplicating an effect.

## Week 2: release and recovery contracts

An immutable release omitted generated directories required by the service sandbox. The process failed before application code started, even though valid artifacts remained in the previous release. We created one manifest for persistent paths, linked each path before activation, and added a namespace smoke test. We retain the prior release until counts, links, and sandbox access pass.

A remote browser then returned valid image bytes in a format that did not match the filename. A format-specific header parser reported impossible dimensions, and all crops failed. We replaced header offsets with decoder-verified dimensions and added a mismatched-extension fixture. The replay produced a complete batch.

A repair run outlived its supervisor budget and succeeded after the supervisor had reported failure. A missing report component and masked remote exit status hid the result. We aligned the budget with one full verification cycle, used a transport that preserves exit codes, and checked the reporting runtime during release staging. The recovery record can now converge on the production state that the operator observes.

The release migration also exposed a capacity gap. A persistent browser cache existed, but the active release did not link to it, so the renderer could not find its executable. Old release bundles and generated media consumed the rest of the small worker disk. We added the browser cache to the path manifest, validate the executable before activation, retain one rollback release, and remove generated media after its retention window. Cleanup leaves durable operating state untouched and produces the same result when repeated.

The Mac recovery launcher had a second boundary error. It cleared inherited credentials before polling the worker, but also removed the SSH agent socket. Terminal access worked while scheduled polls failed. The launcher now passes the current user session's socket through the same narrow environment allowlist as the repair child, and its installed entry point must complete one read-only poll before unattended recovery counts as healthy.

## Operating model after two weeks

We spent the first two weeks turning a media pipeline into a stateful production service:

1. A producer owns the consumer's final acceptance check.
2. Transient reads may retry within a bound. Permanent gates stop for a human. Ambiguous writes reconcile before replay.
3. Mutable state lives outside immutable code and follows one declared path manifest.
4. A repair is complete only when durable source, deployed runtime, production state, and operator report agree.

The reusable checks behind these notes live in the [production regression bank](../.agents/skills/create-faceless-channel/references/production-regressions.md).
