#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path


def parser():
    command = argparse.ArgumentParser(description="Scaffold a faceless-channel contract without credentials.")
    command.add_argument("--root", default="channels")
    command.add_argument("--slug", required=True)
    command.add_argument("--name", required=True)
    command.add_argument("--source", required=True)
    command.add_argument("--source-kind", choices=["api", "feed", "web", "repository", "social"], default="web")
    command.add_argument("--platforms", default="instagram,facebook,tiktok")
    command.add_argument("--posts-per-day", type=int, default=3)
    command.add_argument("--timezone", default="Europe/Amsterdam")
    command.add_argument("--promise")
    command.add_argument("--story-mode", choices=["full-video", "native-manual", "off"], default="full-video")
    command.add_argument("--account-mode", choices=["new-brand", "existing", "managed-setup"], default="new-brand")
    return command


def required_human_checks(platforms):
    checks = [
        "owner-recovery-and-mfa-recorded",
        "mobile-login-verified",
        "desktop-login-verified",
    ]
    if "instagram" in platforms:
        checks.extend([
            "instagram-professional-enabled",
            "facebook-page-created",
            "facebook-page-linked-to-instagram",
        ])
    elif "facebook" in platforms:
        checks.append("facebook-page-created")
    if "tiktok" in platforms:
        checks.append("tiktok-account-created")
    if "youtube" in platforms:
        checks.extend([
            "youtube-channel-created",
            "youtube-feature-eligibility-reviewed",
        ])
    if "x" in platforms:
        checks.append("x-account-created")
    checks.extend([
        "scheduler-oauth-connected",
        "private-post-reconciled",
    ])
    return checks


def main():
    args = parser().parse_args()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
        raise SystemExit("--slug must use lowercase letters, numbers, and single hyphens.")
    platforms = [value.strip() for value in args.platforms.split(",") if value.strip()]
    unknown = sorted(set(platforms) - {"instagram", "facebook", "tiktok", "youtube", "x"})
    if unknown:
        raise SystemExit(f"Unsupported platforms: {', '.join(unknown)}")
    if not 1 <= args.posts_per_day <= 10:
        raise SystemExit("--posts-per-day must be between 1 and 10.")

    target = Path(args.root).resolve() / args.slug
    if target.exists():
        raise SystemExit(f"Refusing to overwrite existing channel: {target}")
    target.mkdir(parents=True)

    promise = args.promise or f"A useful {args.name} finding, explained in under a minute."
    config = {
        "schemaVersion": 2,
        "slug": args.slug,
        "name": args.name,
        "promise": promise,
        "accounts": {
            "mode": args.account_mode,
            "ownershipRequired": True,
            "schedulerCredentials": "bring-your-own",
            "humanSetup": {
                "status": "required",
                "requiredChecks": required_human_checks(platforms),
                "completedChecks": [],
            },
        },
        "source": {
            "kind": args.source_kind,
            "entrypoint": args.source,
            "captureMode": "mobile-scroll",
            "selectionRule": "Choose fresh, source-verifiable items with one demonstrable idea.",
            "rightsPolicy": "verify-before-publish",
        },
        "video": {
            "aspectRatio": "9:16",
            "targetSeconds": 35,
            "visualTreatment": "source-scroll",
            "voice": "generated",
            "captions": "speech-aligned",
            "cover": "first-useful-frame",
        },
        "publication": {
            "platforms": platforms,
            "postsPerDay": args.posts_per_day,
            "timezone": args.timezone,
            "windows": ["09:00-11:00", "14:00-16:00", "19:00-21:00"],
            "scheduler": "postiz",
            "story": {
                "mode": args.story_mode,
                "delayMinutes": 10,
                "interactiveLink": False,
            },
        },
        "operations": {
            "runtime": "exe-dev",
            "browser": "anchor",
            "analytics": "postiz",
            "alerts": "agentmail",
            "activityHistory": "git",
        },
        "budget": {
            "monthlyCeilingUsd": 100,
            "track": ["voice", "browser", "render", "storage", "scheduler", "worker"],
        },
    }
    (target / "channel.json").write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    (target / ".env.example").write_text("\n".join([
        "SOURCE_API_KEY=",
        "POSTIZ_API_KEY=",
        "POSTIZ_INSTAGRAM_INTEGRATION_ID=",
        "POSTIZ_FACEBOOK_INTEGRATION_ID=",
        "POSTIZ_TIKTOK_INTEGRATION_ID=",
        "POSTIZ_X_INTEGRATION_ID=",
        "ANCHOR_BROWSER_API_KEY=",
        "ELEVENLABS_API_KEY=",
        "AGENTMAIL_API_KEY=",
        "AGENTMAIL_INBOX_ID=",
        "FAILURE_ALERT_RECIPIENT=",
        "DAILY_ANALYTICS_RECIPIENT=",
        "",
    ]), encoding="utf-8")
    human_checks = "\n".join(f"- [ ] `{check}`" for check in required_human_checks(platforms))
    (target / "SETUP.md").write_text(f"""# Set up {args.name}

1. Confirm the source responds and permits this use.
2. Implement discovery, selection, and capture adapters.
3. Render one local preview and approve its source evidence.
4. Complete the human account checklist below. Keep `accounts.humanSetup.status` at `required` or `in-progress` until every check is recorded in `completedChecks`.
5. Connect the accounts to Postiz and record each integration ID.
6. Run a dry publication test, then one private live test.
7. Create or request one dedicated AgentMail inbox with client ID `{args.slug}-operations` on an AgentMail-managed or verified project domain.
8. Create an inbox-scoped send-only key and copy `.env.example` into a secret store. Do not commit values.
9. Deploy the worker, analytics, history sync, daily digest, and terminal failure alert services with unattended timers disabled.
10. Send one test digest and one test failure alert. Confirm delivery and same-key deduplication.
11. Set `accounts.humanSetup.status` to `ready`, enable unattended timers, and confirm the first scheduled post and Story from provider release URLs.

## Human account checklist

{human_checks}

For Instagram, switch the account to Professional and connect it to a Facebook Page you control. Meta permits a standalone professional account, but this factory requires the linked Page for the full publishing, cross-app inbox, analytics, and comment-reply path. Complete phone and desktop logins yourself so recovery, verification, and consent stay with the owner.

The automated Story mode is `{args.story_mode}`. Automated Postiz Stories cannot contain an interactive Reel link.
""", encoding="utf-8")
    print(target)


if __name__ == "__main__":
    main()
