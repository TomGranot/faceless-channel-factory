# Build your first channel contract

This tutorial creates a local contract for a channel that turns public API discoveries into vertical videos. You need Python 3.10 or newer. You do not need social accounts or API keys yet.

## 1. Create the channel

From the repository root, run:

```bash
python3 scripts/create-channel.py \
  --slug open-source-radar \
  --name "Open Source Radar" \
  --source "https://api.github.com/search/repositories?q=created:%3E2026-08-01&sort=stars" \
  --source-kind api \
  --platforms instagram,facebook,tiktok \
  --posts-per-day 3 \
  --timezone Europe/Amsterdam
```

You should see an absolute path ending in `channels/open-source-radar`.

## 2. Validate the contract

```bash
python3 scripts/validate-channel.py channels/open-source-radar/channel.json
```

Expected result:

```text
VALID: channels/open-source-radar/channel.json
```

The displayed path may be absolute depending on your shell.

## 3. Inspect the three artifacts

Open `channel.json`. Notice that it separates source, video, publication, operations, and budget decisions. Open `.env.example`. It contains names, not secret values. Open `SETUP.md` for the remaining production sequence.

## 4. Make one deliberate change

Change `video.targetSeconds` from `35` to `30`, then validate again. The validator should still pass.

Now change `publication.story.interactiveLink` to `true` while `story.mode` remains `full-video`. Validation should fail because Postiz cannot add an interactive link to an automated Story. Restore it to `false`.

## 5. Choose the next build step

Your contract is ready for implementation. Build discovery and capture before connecting accounts. A useful first milestone returns five source candidates, captures one real page, rejects one broken page, and renders one local preview.

You have created the configuration and exercised a production constraint without handling credentials.
