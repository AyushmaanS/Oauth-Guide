# Slack - OAuth app registration research notes

Retrieved 2026-10-29. Read-only research (public docs fetched; no logins, no accounts touched).
Labels: Documented = official; Reported = community/third-party; Unverified = inferred/conflicting.

## 1. Sources

| # | Title | URL | Publisher | Retrieved |
|---|---|---|---|---|
| S1 | Installing with OAuth | https://docs.slack.dev/authentication/installing-with-oauth | official | 2026-10-29 |
| S2 | Marketplace app guidelines and requirements | https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements | official | 2026-10-29 |
| S3 | Marketplace review guide | https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide | official | 2026-10-29 |
| S4 | App distribution (public/unlisted) | https://docs.slack.dev/app-management/distribution | official | 2026-10-29 |
| S5 | Quickstart: app settings (create blank app) | https://docs.slack.dev/app-management/quickstart-app-settings | official | 2026-10-29 |
| S6 | Web API rate limits | https://docs.slack.dev/apis/web-api/rate-limits | official | 2026-10-29 |
| S7 | Changelog: rate limit changes for non-Marketplace apps (2025-05-29) | https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps | official | 2026-10-29 |
| S8 | API Terms of Service | https://slack.com/terms-of-service/api | official | 2026-10-29 |
| S9 | User Terms of Service | https://slack.com/terms-of-service/user | official | 2026-10-29 |
| S10 | Acceptable Use Policy landing page | https://slack.com/acceptable-use-policy | official | 2026-10-29 |
| S11 | Salesforce external-facing services AUP (PDF, linked from S10) | https://www.salesforce.com/content/dam/web/en_us/www/documents/legal/Agreements/policies/ExternalFacing_Services_Policy.pdf | official | 2026-10-29 (text could not be decoded) |
| S12 | OpenID discovery doc | https://slack.com/.well-known/openid-configuration | official | 2026-10-29 |
| S13 | Your Apps page | https://api.slack.com/apps | official | 2026-10-29 |
| S14 | Web search summary: WorkOS "OAuth app approval" article | https://workos.com/blog/oauth-app-approval-slack-microsoft-atlassian | third-party | 2026-10-29 (seen via search snippet only, not fetched) |
| S15 | Viktor blog on its Marketplace approval | https://getviktor.com/blog/slack-marketplace-ai-agent | third-party vendor | 2026-10-29 (search snippet only) |
| S16 | Slack Help: Manage app approval | https://slack.com/help/articles/222386767 | official | 2026-10-29 (search snippet only) |

## 2. Registration path

- Go to https://api.slack.com/apps (S13, Documented). Page says you must sign in to a Slack account to create an app. "api.slack.com docs now redirect to docs.slack.dev" per task brief; the apps dashboard URL still served at fetch time.
- Click Create New App, choose "Blank app" (S5, Documented), enter app name, pick the development workspace, Create. S5 does not mention manifests (manifest route exists in product but NOT covered by the fetched page - Unverified here).
- Credentials: S5 says an access token appears under OAuth Tokens after you install the app to the workspace. Client ID / client secret / signing secret are required for the OAuth flow (S1: client secret required at token exchange, Documented) but the page that lists where they are shown (Basic Information) was NOT fetched - NOT FOUND in fetched sources.
- Works immediately for the creator's own workspace: S5 implies yes, install to the development workspace gives a token (Documented). Workspace app-approval settings may block install (S16/Zowe via search, Reported).
- Other workspaces: implement OAuth 2.0 flow, HTTPS redirect URLs, then Manage Distribution > "Share Your App with Other Workspaces" checklist > "Activate Public Distribution" (S4, Documented). Result is an unlisted install URL plus "Add to Slack" button. No Marketplace review needed for this (S4).
- Account requirements: Slack account plus a workspace to be the dev workspace. Free vs paid plan NOT stated in S5. Whether a non-admin can create apps on a free workspace: NOT FOUND (search found none; Unverified). Default per S16: members can install without owner approval unless owners enable app approval (Reported via search snippet of official help page).
- Redirect URLs must be HTTPS, no fragments; must match or be subpath of configured URL (S1, Documented).

## 3. Review / approval

- Public distribution to arbitrary workspaces (unlisted): no review (S4, Documented). review_depth none.
- Marketplace (directory) listing: required only for listing; depth = manual, with enhanced review for certain scopes (S2: `search:read.*`, `*:history`, `files:read`, `canvases:read`, `admin.*`) - Documented.
- Eligibility gate: at least 10 active workspaces (28 days) before you can submit; not applicable to Discovery API partners (S2, S3, Documented). Coded workflows not eligible (S3).
- Documented waits (S3): preliminary review up to 10 business days; functional review up to 10 weeks for new submissions, up to 6 weeks for resubmissions of published apps. Queue place resets on resubmit during preliminary review, kept once a functional reviewer is assigned.
- Reported waits: WorkOS article puts Slack at about 12 weeks (S14, Reported, snippet only); Viktor vendor blog says typically 2-3 months (S15, Reported, marketing, anecdotal); an older Slack guide listed ~1 week + up to 8 weeks (Reported via search summary, outdated). No community forum threads on rejection found (search said none) - NOT FOUND.
- Documented return/rejection reasons (S3): bugs/poor UX, missing info or cannot install, scopes for unbuilt features, legacy/restricted or wide-data scopes, unclear docs/scope justification.

## 4. Scopes and nuances

- Bot scopes via `scope`, user scopes via `user_scope`; scopes additive across installs (S1, Documented). Optional scopes can be set in manifest (S1).
- Tokens: bot and user tokens; `oauth.v2.user.access` for user-token-only (MCP/IDE) apps (S1). Tokens do not expire by default; token rotation is opt-in for granular-permission apps, giving refresh token + expiring access token (S1, Documented).
- Auth code expires after ten minutes; `state` should be checked (S1).
- Rate limits: tiers 1-4 per method/workspace/app (S6). Since 2025-05-29 (new unlisted commercially distributed apps), `conversations.history` and `conversations.replies` are limited to 1 request/min and 15 objects per call; Marketplace apps and internal customer-built apps unaffected (S7, Documented). This is a big nuance for unlisted public apps.
- Unlisted vs listed: unlisted gives shareable install URL; once Marketplace-listed you cannot simply deactivate distribution (S4).
- Workspace admins may require app approval before install (S16, Reported/official help snippet).

## 5. Special requirements (Marketplace only; S2, Documented)

- Privacy policy linked from public landing page: data collected/used/retained, access/delete rights, contact via email or webform (physical address alone insufficient).
- Support channel, no extra account required; respond within 2 business days.
- TLS 1.2+, request signing verification, secure token storage, OAuth `state`.
- Test credentials/dummy data and a video demo of install, OAuth, use, uninstall (S3).
- At least one app collaborator after approval; Slack may delist unmaintained apps (S2).

## 6. Provider public OAuth metadata

- https://slack.com/.well-known/openid-configuration: exists. Lists authorization_endpoint https://slack.com/openid/connect/authorize, token_endpoint https://slack.com/api/openid.connect.token, userinfo, jwks_uri. NO registration_endpoint (S12, observed, fetched summarised by tool).
- https://slack.com/.well-known/oauth-authorization-server: 404 (observed).
- https://slack.com/.well-known/oauth-protected-resource: 404 (observed).
- Dynamic client registration: not observed. Apps must be registered manually in the dashboard. Note the OIDC doc is for Sign in with Slack only, not the main OAuth v2 flow.

## 7. FREE-PATH FEASIBILITY (agent driving owner's browser, free personal account)

- Can a free account create the app and get credentials? Likely yes, create-app only requires a Slack account and a development workspace (S5, S13) - Unverified for free plan specifically; no plan restriction found in fetched docs.
- First human-only step: signing in to Slack (email magic code / SSO / possible CAPTCHA), and if the owner has no workspace, creating one. Agent must not enter passwords (policy), so the owner signs in.
- Estimated minutes to credentials: ~5-10 (Unverified estimate, not measured) once signed in: Create New App > Blank app > name > workspace > open Basic Information to read client ID/secret.
- Pages visited (expected): https://api.slack.com/apps, create-app modal, app Basic Information, OAuth & Permissions (add redirect URL and scopes), Manage Distribution. Install step to own workspace may need owner click on an Allow screen.
- Not measured live; no account was touched.

## 8. Terms on automation

- API ToS (S8, section "Access to our APIs"): bars circumventing "technical processes or security measures", rate-limit abuse/"excessive or abusive usage", reverse engineering. Data Access / Real-Time Search API: background scraping unrelated to user queries prohibited. Page is silent on web UI/console automation; says the Contract grants no right to use the Services themselves, governed separately.
- User ToS (S9): no automated-access clause found on the page; incorporates the AUP by reference.
- AUP (S10/S11): policy text is in a Salesforce PDF I could not decode - NOT FOUND / could not read.
- Plain reading: the API terms govern API use, not driving the developer console in a browser. Driving the logged-in console by an agent at human pace for the owner's own app is ambiguous and not clearly forbidden; AUP unread. Confidence: low-medium. Not legal advice. Flag: AMBIGUOUS.

## 9. Surprises

- Public distribution (unlisted) needs no review, but the 2025 rate-limit change hits new unlisted commercial apps hard (history/replies 1 req/min).
- Marketplace submission blocked until 10 active workspaces.
- Docs moved from api.slack.com to docs.slack.dev; the app dashboard remains at api.slack.com/apps.
- No dynamic client registration; the OIDC metadata is only for Sign in with Slack.
- S5 quickstart doesn't mention client ID/secret location.

## 10. Suggested difficulty factors

- registration_friction: account_needed (evidence S5, S13; free-plan viability Unverified)
- review_required: for_public_use? No: public install is review-free (S4); review only for Marketplace. Suggested: none for own-app OAuth + unlisted distribution; for_sensitive_scopes applies to Marketplace listing (S2). Suggest `none` with note, or `for_public_use` if listing counts.
- review_depth: none (unlisted) / manual (Marketplace, enhanced for sensitive scopes)
- docs_quality: clear (S1, S3, S4 are detailed; minor gap on credential location in quickstart)
- approval_wait_basis: documented (S3: 10 business days + up to 10 weeks), reported waits longer (S14, S15)
- special_requirements: privacy_policy, support_contact, demo_video, test_credentials, min_10_active_workspaces, tls_and_request_signing
