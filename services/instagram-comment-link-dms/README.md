# Instagram comment-to-link DMs

This one-shot worker reads comments, matches a whole-word keyword, persists intent before an external write, and never retries an uncertain send.

It discovers published Instagram posts through Postiz, requires the channel-owned CTA line, binds each Instagram media ID to the source URL already carried in that post’s caption, reads comments through the official Instagram API, and sends one private reply for each matching comment.

The fixture contracts represent two unrelated formats:

- Developer launch: comment `SOURCE`; receive the URL from the `Open the source →` caption line.
- Collection reveal: comment `DETAIL`; receive the URL from the `See the source record:` caption line.

## Safe local check

```bash
npm test
npm run doctor
npm run run:once
npm run status
```

Fixture mode makes no network request. Live reads need a Postiz key, one official Instagram professional-account token per channel, and `config/channels.local.json` copied from the example.

Live writes stay disabled until all three controls are present:

```text
MODE=live
WRITE_MODE=live
LIVE_CONFIRMATION=I_UNDERSTAND_INSTAGRAM_PRIVATE_REPLY_WRITES
LIVE_UNLOCK_FILE=/absolute/path/to/a/user-created-mode-0600-file
```

The worker holds one process lock across comment reads, state changes, and private replies. It sends one private reply through `/{instagram-account-id}/messages` with the triggering `comment_id`. A network timeout, HTTP 408, HTTP 429, server error, unreadable success response, or success response without a stable message ID becomes `uncertain`. The worker will not retry that comment automatically.

## Enable the Mac worker

Do not load the LaunchAgent until each account passes one private test comment.

1. Create an official Meta app connection for each Instagram professional account and grant the permissions required to read comments and send private replies.
2. Copy `config/channels.example.json` to the ignored `config/channels.local.json`. Add each Postiz Instagram integration ID, Instagram professional-account ID, token environment name, and account username.
3. Copy `.env.example` to the ignored `.env.local`, set its mode to `0600`, set `MODE=live`, keep `WRITE_MODE=disabled`, and add the Postiz and Instagram tokens.
4. Run `npm run doctor`, then `npm run run:once`. This validates live reads without sending a reply.
5. Create an unlock file with mode `0600`, set the exact confirmation phrase, and change `WRITE_MODE=live`. Publish a private test Reel with its normal source line, comment the configured keyword from a separate test account, and run one cycle twice. The first cycle must send once; the second must deduplicate.
6. Replace `__SERVICE_DIR__` in `deploy/com.example.instagram-comment-link-dms.plist.example` with the absolute service directory. Copy the result to `~/Library/LaunchAgents/com.example.instagram-comment-link-dms.plist`, then bootstrap it with `launchctl`. It polls every five minutes and reads secrets only from `.env.local`.

The worker ignores scheduled media whose caption does not contain the configured CTA line. Apply a new CTA only to a named future batch unless the owner approves replacing scheduled media and copy.
