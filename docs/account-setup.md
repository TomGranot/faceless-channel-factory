# Set up accounts and credentials

Use this guide when a channel has a name, validated source, and approved preview.

## Choose ownership

Create new brand-owned accounts, connect accounts you already control, or give a human operator a written setup checklist. Record the recovery email, MFA owner, platform handle, and Postiz integration ID for each account.

Do not base the channel on a purchased account. A seller may retain recovery access, the audience may be synthetic, and a platform may enforce its transfer rules after the automation is live.

## Complete the human work

The scaffold writes the exact platform checks to `accounts.humanSetup.requiredChecks`. A human owner or authorized operator must complete them:

1. Create or recover each account on a phone and verify the desktop login.
2. Set owner-controlled recovery, MFA, and backup-code custody.
3. Switch Instagram to a Professional account in the app.
4. Create an owner-controlled Facebook Page and link it to Instagram.
5. Create and verify the TikTok account on phone and desktop.
6. Create the YouTube channel and review feature eligibility when Shorts joins the destination list.
7. Complete each scheduler OAuth flow and verify the selected destination.
8. Publish one private or disposable test through the production path.

Meta makes the Facebook Page link optional for a standalone Professional Instagram account. Require the link for this factory's full third-party publishing, cross-app inbox, analytics, and comment-reply support. Keep the destination below `ready` if you choose the standalone path. Follow Meta's current [Professional account](https://www.facebook.com/help/instagram/502981923235522/) and [Page-linking](https://www.facebook.com/help/instagram/402748553849926) instructions.

After each check passes, copy its name into `completedChecks`. Set `humanSetup.status` to `ready` only when the list is complete and `scripts/validate-channel.py` passes.

## Use a managed operator when location matters

[TokPortal](https://www.tokportal.com/) advertises account creation and native publishing from local phones for TikTok and Instagram. It does not cover the full Facebook or YouTube checklist. Confirm current platform support, rules, pricing, ownership, recovery, MFA handoff, and data retention before purchase. The August 2026 trial used USD 200–250 per month as a rough planning range. Obtain a current quote before purchase.

## Connect Postiz

1. Connect Instagram, Facebook, TikTok, and YouTube through their OAuth flows when each platform is in scope.
2. Confirm the displayed account name before accepting each integration.
3. Record integration IDs in the worker secret environment, not `channel.json`.
4. Upload a disposable vertical MP4.
5. Schedule a private or disposable test through the same API path production will use.
6. Reconcile the Postiz ID and platform release URL.

## Add supporting providers

- Browser: create a short-lived, non-recorded session key where possible.
- Voice: set a monthly usage cap and retain speech timing data.
- AgentMail: create a dedicated send-only inbox key for failure alerts.
- Worker: use SSH keys and a non-root service account for routine jobs.

## Store secrets

Use the cloud provider's secret store. On a single Linux worker, use a root-owned environment file with mode `0600`. Pass only the variables each service needs. Keep secrets out of shell output, generated docs, activity history, crash messages, and Git.

## Acceptance test

The account setup is complete when every required human check is recorded, the validator accepts `humanSetup.status: ready`, a private post publishes through the production API path, its release URL reconciles, the disposable content can be removed, and an intentional test failure sends one email without duplicating on retry.
