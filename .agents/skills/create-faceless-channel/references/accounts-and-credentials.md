# Accounts and credentials

Read this reference before connecting social accounts, publishers, browsers, voice services, cloud workers, or alerts.

## Account paths

| Path | Use when | Required proof |
| --- | --- | --- |
| New brand-owned account | The channel is new | Recovery email, MFA, ownership record, platform eligibility |
| Existing owner-controlled account | The owner already has the audience or name | Current login, recovery control, OAuth reconnection test |
| Managed human setup | Someone else will create and connect accounts | Written ownership, recovery handoff, MFA handoff, acceptance test |

Do not buy, transfer, or automate access to third-party social accounts. Sellers may retain recovery control, followers may be inauthentic, and platforms may suspend transferred accounts. If the user wants distribution on an existing audience, propose a creator partnership or paid collaboration.

## Human setup boundary

Keep account creation, recovery, identity checks, MFA enrollment, platform consent, and the first phone and desktop logins with the owner or an authorized human operator. The runtime may generate a checklist and verify the result. It must not claim readiness from OAuth credentials alone.

Complete these checks before unattended publication:

1. Create or recover each requested platform account on a phone, then verify a desktop login.
2. Record the owner-controlled recovery address, MFA method, and backup-code custodian without putting the values in Git.
3. Switch each Instagram destination to a Professional account in the Instagram app.
4. Create a Facebook Page under the same owner and give the connecting user full Page control.
5. Link the Instagram Professional account to that Facebook Page and confirm the intended Page appears on both sides.
6. Create the TikTok account, complete any phone or region checks, and verify the profile in the mobile app and desktop browser.
7. Connect each destination to the scheduler through its official OAuth flow. Reopen the scheduler and confirm the account name and destination ID.
8. Publish one private or disposable test through the production path and reconcile both the scheduler ID and platform release URL.

Meta allows a Professional Instagram account to run without a linked Facebook Page. This factory treats the link as a production requirement because the linked setup supports third-party tools, cross-app inbox management, and the full comment-reply path. If the owner chooses standalone Instagram, record the deviation and disable any feature that depends on the Page connection. Do not label that destination fully ready. Use Meta's current instructions for [Professional account setup](https://www.facebook.com/help/instagram/502981923235522/) and [Page linking](https://www.facebook.com/help/instagram/402748553849926).

### YouTube Shorts follow-up

Keep YouTube in the channel contract even when launch starts on three platforms. Before adding it to the live destination list, have the owner create a YouTube channel, choose its name and handle, review feature eligibility in YouTube Studio, complete any requested phone or identity verification, connect the scheduler, and publish one private Short. Standard access supports Shorts with a daily limit; verification or channel history can raise that limit. Use YouTube's current [channel creation](https://support.google.com/youtube/answer/1646861) and [feature eligibility](https://support.google.com/youtube/answer/9890437) guidance.

### Managed in-country setup

A managed operator can handle the device-local work when the owner needs accounts established in another country. TokPortal currently advertises local-phone account creation and publishing for TikTok and Instagram. It does not replace the Facebook Page, Meta linking, YouTube, owner-recovery, or acceptance-test steps. Before using it:

- confirm the requested country and platforms on the provider's current site;
- obtain written account ownership, recovery, MFA, data-retention, and exit terms;
- review the affected platforms' current rules before creating an account;
- price the exact account and publishing volume at purchase time;
- run one disposable end-to-end test before committing a batch.

The August 2026 trial treated roughly USD 200–250 per month as a planning range. Preserve that figure as a dated operator estimate. Use the provider's current [service description and pricing](https://www.tokportal.com/) for a purchase decision.

## Credential groups

### Required for publication

- Postiz API key or equivalent scheduler key.
- One integration ID per platform.
- Project-owned social accounts connected through OAuth.

### Required for cloud production

- Persistent worker access, such as exe.dev.
- Browser provider key when local Chromium is unreliable.
- Voice provider key when narration is generated.
- AgentMail inbox ID, inbox-scoped send-only key, and recipient addresses when AgentMail handles digests and alerts.

### Optional

- Source API key for a private or metered feed.
- Object storage and CDN credentials.
- Platform-native analytics tokens when scheduler analytics are incomplete.

## Storage rules

Keep credentials outside Git. Commit `.env.example` with variable names only. Prefer a provider secret store. On a single Linux worker, use a root-owned environment file with mode `0600`, then expose only the needed variables to each service.

Create the narrowest key available. A failure-mail worker needs send-only access. A read-only analytics job should not receive publication credentials when the provider can separate scopes.

Never print secrets in shell output, activity history, exceptions, or generated setup documents. Redact credential-shaped fields before logging nested objects.

## AgentMail setup

Use one dedicated inbox per channel by default. Give it a stable channel-derived username and idempotent client ID so rerunning setup returns the same inbox. Offer an AgentMail-managed address for the fastest start or a project-owned domain for a branded sender.

For a custom domain, confirm ownership and obtain approval before changing DNS. Register the domain, copy AgentMail's returned DNS records exactly, preserve unrelated mail records, and merge SPF authorization into the existing SPF record instead of creating a second one. Prefer a dedicated subdomain when the root domain already handles human email. Create the inbox only after AgentMail reports the domain as verified.

Create an inbox-scoped API key with `message_send` permission for outbound digests and alerts. Do not grant inbox management, deletion, drafts, domains, labels, or webhook permissions to the production sender. Create a separate scoped key when setup automation must manage inboxes or webhooks, then remove that key from the worker after setup.

Store these values in the worker's secret store or a root-owned `0600` environment file:

```dotenv
AGENTMAIL_API_KEY=
AGENTMAIL_INBOX_ID=
FAILURE_ALERT_RECIPIENT=
DAILY_ANALYTICS_RECIPIENT=
```

Allow `DAILY_ANALYTICS_RECIPIENT` to fall back to `FAILURE_ALERT_RECIPIENT` when both messages go to the same person. Load the AgentMail environment file only into email services. Do not expose the key to capture, rendering, analytics collection, or publication workers.

Give each failure invocation and reporting date one stable delivery key. Persist the exact recipient, subject, text, HTML, and labels before the send request. Reuse that payload and key after timeouts or restarts. Record a successful send only after AgentMail returns its message and thread IDs.

Use inbox-scoped webhooks only when the channel needs inbound mail or delivery events. Subscribe to the smallest event set, usually `message.delivered`, `message.bounced`, and `message.rejected` for delivery monitoring. Store `AGENTMAIL_WEBHOOK_SECRET` only in the webhook receiver. Verify the raw request body with the Svix signature headers, deduplicate by `event_id`, return `200` before background processing, and fetch the full message through the API when a large webhook omits its body.

### AgentMail acceptance test

1. Confirm the dedicated inbox ID without printing its key.
2. If using a custom domain, confirm AgentMail reports it as verified and the existing human mail flow still works.
3. Send one labeled test digest to the configured daily recipient.
4. Send one labeled test failure alert with a single concrete recovery action.
5. Confirm both messages reached the expected mailbox and store their provider message IDs.
6. Repeat each send with the same delivery key and confirm no duplicate email appears.
7. Trigger one bounded service failure and confirm the terminal handler sends one alert after retries are exhausted.
8. If webhooks are enabled, verify one signed delivery event and one deduplicated replay.
9. Remove setup-only credentials from the worker and confirm unattended email services still run with the send-only key.

Use AgentMail's current official references for [custom domains](https://docs.agentmail.to/custom-domains), [inbox creation](https://docs.agentmail.to/api-reference/inboxes/create), [inbox-scoped keys](https://docs.agentmail.to/api-reference/inboxes/api-keys/create), [message sending](https://docs.agentmail.to/api-reference/inboxes/messages/send), [inbox-scoped webhooks](https://docs.agentmail.to/api-reference/inboxes/webhooks/create), and [webhook verification](https://www.agentmail.to/docs/webhook-verification).

## Connection acceptance test

1. Confirm every platform-specific human check in `accounts.humanSetup.requiredChecks` is complete.
2. List connected integrations without printing tokens.
3. Confirm platform account names and destination IDs.
4. Upload a private test asset.
5. Schedule one future private or disposable post.
6. Reconcile the scheduler post ID and platform release URL.
7. Remove the disposable post through the supported path.
8. Verify the activity log contains intent, acceptance, and final state without credentials.
9. Copy every required check into `completedChecks`, set `humanSetup.status` to `ready`, and validate `channel.json`.
