# Add a channel to a worker

Use this guide after the channel has a validated config and one approved local preview.

## Prerequisites

- A persistent Linux worker with enough memory for the renderer.
- Project-owned social accounts with `accounts.humanSetup.status` set to `ready` after the platform checklist and private-post test pass.
- A source adapter and browser capture that pass their quality tests.
- Provider credentials stored outside Git.

## Procedure

1. Copy the channel runtime and `channel.json` to a dedicated worker directory.
2. Create a service user that owns only that channel directory and its activity history.
3. Place provider variables in a root-owned environment file with mode `0600`.
4. Run discovery, capture, render, and publication dry-runs as the service user.
5. Schedule one private or disposable live post. Save the scheduler post ID and reconcile the platform release URL.
6. Install one production service, one randomized daily timer, one analytics timer, one history-sync timer, and one failure handler.
7. Restrict each service with `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=strict`, finite timeouts, memory limits, and the smallest `ReadWritePaths` set that passes a live run.
8. Trigger every service once. Confirm its exit status, writable paths, activity events, and failure email.
9. Enable the timers only after the private post and reconciliation succeed.

## Share one worker safely

Give each channel a separate runtime directory, config, data directory, outbox, and systemd unit prefix. Share browser, renderer, and scheduler binaries, but do not share mutable campaign state. Stagger render windows so channels do not exceed memory or browser concurrency.

## Confirm the result

List the timers in local time, inspect the next daily run, and verify that the publication queue contains the expected number of feed and Story effects. The channel is not deployed if the timer exists but the private publication or failure email has not been observed.
