# Spotify (Developer Dashboard, Web API apps) - research notes

Retrieved: 2026-10-29. Read-only web research (WebFetch/WebSearch). No logins, no accounts touched. Evidence tags: Documented (official), Reported (community/third-party), Unverified (inferred/conflicting).
Note: WebFetch returns model-summarised page content, not raw HTML; exact wording, clause numbers and figures should be spot-checked before shipping as final copy.

## 1. Sources

| # | Title | URL | Publisher | Retrieved |
|---|-------|-----|-----------|-----------|
| S1 | Spotify Developer Terms | https://developer.spotify.com/terms | official | 2026-10-29 |
| S2 | Spotify Developer Policy | https://developer.spotify.com/policy | official | 2026-10-29 |
| S3 | Web API: Quota modes | https://developer.spotify.com/documentation/web-api/concepts/quota-modes | official | 2026-10-29 |
| S4 | Web API: Redirect URIs | https://developer.spotify.com/documentation/web-api/concepts/redirect_uri | official | 2026-10-29 |
| S5 | Web API: Apps (creating an app) | https://developer.spotify.com/documentation/web-api/concepts/apps | official | 2026-10-29 |
| S6 | Spotify Terms of Use (end user agreement) | https://www.spotify.com/legal/end-user-agreement/ | official | 2026-10-29 |
| S7 | February 2026 Web API Dev Mode Changes - Migration Guide | https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide | official | 2026-10-29 |
| S8 | Update on Developer Access and Platform Security (blog, 2026-02-06) | https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security | official | 2026-10-29 |
| S9 | TechCrunch: Spotify changes developer mode API to require premium accounts | https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/ | third-party news | 2026-10-29 (search result only, not fetched) |
| S10 | Activepieces: Spotify Web API free? Access modes, scopes, limits | https://www.activepieces.com/blog/spotify-web-api-free-access-modes-scopes-limits.md | third-party | 2026-10-29 (search result only, not fetched) |

Not found / not fetched: a Spotify page that explicitly addresses automating the Dashboard UI; the Spotify Platform Rules and User Guidelines (referenced by S6 but their text was not in the fetched page).

## 2. Registration path

- Steps: Dashboard (developer.spotify.com/dashboard) > "Create an App" > App Name + App Description (shown to users on the grant screen) > tick the Developer Terms of Service checkbox > CREATE; redirected to the app overview page. [S5] Documented
- Later-editable fields: Website, Redirect URIs, Android Package / iOS Bundle IDs. [S5] Documented
- Credentials: Client ID and Client Secret on the app overview page; ROTATE button regenerates the secret. [S5] Documented. S1 VI.1.1/VI.1.2 calls the client ID/secret "Security Codes", one per app, not transferable. [S1] Documented
- Delete: red DELETE button; its location is not stated on the page. [S5] Documented
- Developer account must be linked to a Spotify account, with accurate contact information. [S1 VI.1.1, S2 VII.1.1-1.2] Documented
- Redirect URI rules: HTTPS required except loopback; loopback must be an explicit IP literal, `http://127.0.0.1:PORT/...` or `http://[::1]:PORT/...`; `localhost` is NOT allowed. Exact match required, except loopback IP literals may be registered without a port and add the port at request time (RFC 8252). New validations apply to apps created from 2025-04-09; all clients expected to migrate by November 2025. [S4] Documented. So a "localhost redirect URI" must be entered as 127.0.0.1 or [::1].
- Number of apps: S5 says up to 25 apps per developer account. S7 says new apps were limited to 1 Client ID per developer from 2026-02-11, and a later note says the limit was raised to 25 as of July 2026. [S5, S7] Documented (S5 and S7 consistent with the July 2026 raise; S8 blog still says one, older).
- Premium: "The app owner must have a Spotify Premium account for apps in development mode to function." [S3] Documented. S7: "All Development Mode apps require the app owner to have an active Spotify Premium subscription"; if it lapses the app stops until resubscribed. [S7] Documented. S8: Premium rule applies to new Client IDs from 2026-02-11 and existing integrations from 2026-03-09. [S8] Documented. NOT FOUND: any official statement on whether a free account can open the dashboard and click CREATE (S3, S5, S7 are silent on creation). Secondary reporting only says Premium is required for Development Mode use [S9, S10]. Unverified: whether the Create button is blocked for free accounts.
- Verified email: not mentioned in S1, S5, S7. NOT FOUND.
- Account-owner requirements: only that the developer account is linked to a Spotify account and the owner's Premium keeps the app working. No organisation needed for development mode. [S1, S3, S7] Documented

## 3. Development mode, quota and review

- Development mode: up to 5 authenticated users per app, each must be added to the app's allowlist or API calls return 403; requests capped across all dev-mode apps of one developer account (429 QUOTA_EXCEEDED). [S3, S7, S8] Documented
- Endpoint access in dev mode is restricted to a smaller set (postponed for existing integrations). [S8] Documented
- Intended use: learning, experimentation, non-commercial personal projects; not a foundation for a business. [S8] Documented
- Extended quota mode: unlimited users, no allowlist, higher rate limit. Only organisations may apply (since 2025-05-15). Criteria: legally registered business, active launched service, at least 250,000 monthly active users, key markets, commercial viability, terms adherence. [S3] Documented
- Review process: Partner Application approved first; then Dashboard app Settings > Quota extension request, four-step questionnaire; Spotify reviews compliance and tests the app; reply by email. "Up to six weeks"; Spotify promises neither timing nor approval. [S3, S2 VII.3.3] Documented
- Extended quota is for the reviewed use case only; scope changes need a scope extension request; access can be revoked after review. [S2 VII.3.4-3.5, S1 VI.7.3] Documented

## 4. Terms on automation (not legal advice)

Verdict: AMBIGUOUS (leaning ALLOWED for a single, owner-supervised, low-volume registration). Confidence: low-medium.

- Developer Terms IV.2.4.1 bans using "any robot, spider, site search/retrieval application, or other tool to retrieve" Spotify content (aimed at content/data retrieval from the Platform, not at configuring your own app). [S1] Documented
- IV.2.4.2 bans excessive service calls; IV.2.1.4 bans interfering with Platform performance; VI.2 lets Spotify use technical measures against over-usage. A handful of page loads is not excessive. [S1] Documented
- Developer Policy II.2 bans bots, scripts or automated processes used to manipulate play/follow counts; not relevant to app registration. III.13 bans analysing Spotify Content/Service; III.14 bans AI training use. [S2] Documented
- Terms of Use Section 3: do not access the Service "in any manner not expressly permitted by these Terms"; the incorporated User Guidelines (bots/scraping) were not in the fetched text, so not assessed. [S6] Unverified
- Spotify's 2026 posture is tightening, citing "automation and AI" as a reason for stricter developer controls, but the post does not mention bots, scraping or crawling and does not address agents using the Dashboard. [S8] Documented
- Nothing fetched explicitly allows or forbids an AI agent clicking through the Dashboard in the owner's signed-in browser. The owner performs the action in their own session, accepts the terms themselves, and the volume is tiny, so it is probably not the targeted conduct; but it is "other tool" territory under IV.2.4.1 read broadly, and the owner (not the agent) must be the one who ticks and accepts the Developer Terms checkbox. Termination is at Spotify's discretion (IX.8.2-8.4) with possible revocation of Security Codes. [S1] Documented for the clauses, Unverified for the reading.
- Spot-check IV.2.4.1-2, VI.2, IX.8 and the User Guidelines in full before relying on this.

## 5. Walkthrough feasibility

Likely human-only steps (owner must do):
1. Be signed in to a Spotify account; any login, 2FA, CAPTCHA or "confirm it's you" prompt. Account creation, if none exists. Unverified which prompts appear.
2. Have (or confirm) an active Premium subscription, since dev-mode apps need it to function, and creation for free accounts is unconfirmed. Possibly the first blocker for a free account.
3. Read and tick the Developer Terms of Service checkbox (consent step; should be the owner's own act, not the agent's).
4. First-time dashboard onboarding / developer-terms acceptance screen if shown (not documented).
5. Confirming creation and any credential display (Client ID / Client Secret); the owner should decide whether the secret is ever revealed; for a throwaway app it need not be.
6. Confirming DELETE (irreversible); the agent should stop and ask first.

Agent-suitable steps: filling App Name/Description, entering the redirect URI as `http://127.0.0.1:PORT/callback` (not `localhost`), saving, navigating to the app and finding DELETE.

Estimated time: about 3-5 minutes if no blocker appears. Estimate is mine, Unverified.

Direct URLs: https://developer.spotify.com/dashboard (documented), app pages under /dashboard/<client_id> (inferred, Unverified).

## 6. Surprises

- `localhost` is explicitly rejected as a redirect URI; use 127.0.0.1 or [::1]. [S4] Documented
- Feb 2026 changes: Premium requirement, 5-user cap, one Client ID (since raised to 25), with S3 and S5 not fully updated. [S3, S5, S7, S8] Documented
- Extended quota is effectively closed to individuals (organisations with 250k MAU). [S3] Documented
- Docs do not say whether Premium is needed to create (as opposed to run) an app. Unverified.

## 7. Suggested difficulty factors

- registration_friction = moderate (form is trivial, but a Premium requirement may block a free account). Evidence: S3, S7; creation behaviour for free accounts Unverified.
- review_required = none for dev mode; extended quota requires manual review. [S3]
- review_depth = none (dev mode) / manual (extended quota).
- docs_quality = mixed (some pages out of date versus the Feb 2026 migration guide).
- approval_wait_basis = documented "up to six weeks" for extended quota only. [S3]
- special_requirements = ["spotify_premium_for_app_owner", "tos_checkbox", "loopback_ip_redirect_not_localhost", "organisation_with_250k_mau_for_extended_quota"].
