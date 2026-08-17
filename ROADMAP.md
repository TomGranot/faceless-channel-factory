# Roadmap

The roadmap describes the next public milestones. It does not promise dates or provider support.

## Public preview

- Publish one reviewed, sanitized walkthrough from source evidence to validated channel state.
- Push the release commit, create the `v1.0.0` tag, and publish the matching GitHub release.
- Expand automated host-discovery tests beyond the cross-platform copy installer.
- Add the public project to a concise profile README and pin it after launch.
- Verify the README, social preview, topics, and installation path from a logged-out browser.

## Reference implementation

- Add one documented Open Access source adapter with fixture data.
- Add a browser-capture fixture that demonstrates blank-page and loading-state rejection.
- Add a minimal renderer interface and an approved-output manifest example.
- Define scheduler and analytics adapter interfaces without binding the skill to one provider.

## Operations

- Publish a durable outbox example with ambiguous-write reconciliation.
- Add a bounded repair-dispatcher reference implementation.
- Add a daily analytics snapshot example with missing-data tests.
- Expand the comment-to-DM worker only through official supported platform paths.

## Release criteria

A milestone is ready when its documentation matches the implemented behavior, fixtures contain no identifying data, regression tests pass, and the full Git history passes secret scanning.

Propose additions through the feature-request issue form. A source or provider request should include current first-party documentation and the rights or mutation boundary it introduces.
