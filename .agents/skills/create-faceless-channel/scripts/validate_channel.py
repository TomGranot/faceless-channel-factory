#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse


def fail(messages):
    for message in messages:
        print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def required_human_checks(platforms):
    checks = {
        "owner-recovery-and-mfa-recorded",
        "mobile-login-verified",
        "desktop-login-verified",
        "scheduler-oauth-connected",
        "private-post-reconciled",
    }
    if "instagram" in platforms:
        checks.update({
            "instagram-professional-enabled",
            "facebook-page-created",
            "facebook-page-linked-to-instagram",
        })
    elif "facebook" in platforms:
        checks.add("facebook-page-created")
    if "tiktok" in platforms:
        checks.add("tiktok-account-created")
    if "youtube" in platforms:
        checks.update({
            "youtube-channel-created",
            "youtube-feature-eligibility-reviewed",
        })
    return checks


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: validate_channel.py <channel.json>")
    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    errors = []
    if data.get("schemaVersion") != 2:
        errors.append("schemaVersion must equal 2")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(data.get("slug", ""))):
        errors.append("slug must use lowercase letters, numbers, and single hyphens")
    if not str(data.get("name", "")).strip() or not str(data.get("promise", "")).strip():
        errors.append("name and promise are required")
    lifecycle = data.get("lifecycle")
    if lifecycle is not None:
        if lifecycle.get("status") not in {"active", "paused", "archived"}:
            errors.append("lifecycle.status must be active, paused, or archived")
        if lifecycle.get("status") in {"paused", "archived"} and not str(lifecycle.get("reason", "")).strip():
            errors.append("paused and archived channels require lifecycle.reason")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(lifecycle.get("changedAt", ""))):
            errors.append("lifecycle.changedAt must be an ISO date")
    accounts = data.get("accounts", {})
    if accounts.get("mode") not in {"new-brand", "existing", "managed-setup"} or accounts.get("ownershipRequired") is not True:
        errors.append("accounts must use a supported mode and require owner control")
    entrypoint = str(data.get("source", {}).get("entrypoint", ""))
    if urlparse(entrypoint).scheme not in {"http", "https"}:
        errors.append("source.entrypoint must be an HTTP(S) URL")
    platforms = data.get("publication", {}).get("platforms", [])
    if not platforms or set(platforms) - {"instagram", "facebook", "tiktok", "youtube"}:
        errors.append("publication.platforms contains an unsupported value")
    human_setup = accounts.get("humanSetup", {})
    required = human_setup.get("requiredChecks")
    completed = human_setup.get("completedChecks")
    if human_setup.get("status") not in {"required", "in-progress", "ready"}:
        errors.append("accounts.humanSetup.status must be required, in-progress, or ready")
    if not isinstance(required, list) or not all(isinstance(item, str) for item in required):
        errors.append("accounts.humanSetup.requiredChecks must be a list of check names")
        required = []
    if not isinstance(completed, list) or not all(isinstance(item, str) for item in completed):
        errors.append("accounts.humanSetup.completedChecks must be a list of check names")
        completed = []
    expected_checks = required_human_checks(platforms)
    missing_checks = sorted(expected_checks - set(required))
    if missing_checks:
        errors.append(f"accounts.humanSetup.requiredChecks is missing: {', '.join(missing_checks)}")
    unknown_completed = sorted(set(completed) - set(required))
    if unknown_completed:
        errors.append(f"accounts.humanSetup.completedChecks contains unknown checks: {', '.join(unknown_completed)}")
    if len(required) != len(set(required)) or len(completed) != len(set(completed)):
        errors.append("accounts.humanSetup check lists must not contain duplicates")
    if human_setup.get("status") == "ready" and set(required) - set(completed):
        errors.append("accounts.humanSetup cannot be ready until every required check is completed")
    posts = data.get("publication", {}).get("postsPerDay")
    if not isinstance(posts, int) or not 1 <= posts <= 10:
        errors.append("publication.postsPerDay must be an integer from 1 to 10")
    timezone = str(data.get("publication", {}).get("timezone", ""))
    if "/" not in timezone:
        errors.append("publication.timezone must be an IANA timezone")
    story = data.get("publication", {}).get("story", {})
    if story.get("mode") == "full-video" and story.get("interactiveLink") is not False:
        errors.append("automated full-video Stories cannot claim an interactive link")
    if errors:
        fail(errors)
    print(f"VALID: {path}")


if __name__ == "__main__":
    main()
