# Discord (Developer Portal application, OAuth2) - research notes

Retrieved: 2026-10-29. Read-only web research (WebFetch/WebSearch). No logins, no accounts touched. Evidence tags: Documented (official), Reported (community/third-party), Unverified (inferred/conflicting/not retrieved).
Note: WebFetch returns model-summarised page content, not raw HTML; exact wording and numbers should be spot-checked before shipping as final copy.
Gap: the Developer Terms of Service, Developer Policy, the "How do I get my app verified" article and the self-bot support article all returned HTTP 403 (support-dev.discord.com / support.discord.com block the fetch tool). Their text was NOT read. Findings about them are from other pages or search snippets and are Unverified.

## 1. Sources

| # | Title | URL | Publisher | Retrieved |
|---|-------|-----|-----------|-----------|
| S1 | Discord Terms of Service | https://discord.com/terms | official | 2026-10-29 |
| S2 | Community Guidelines | https://discord.com/guidelines | official | 2026-10-29 |
| S3 | Developer Terms of Service | https://docs.discord.com/developers/policies-and-agreements/developer-terms-of-service (redirects to https://support-dev.discord.com/hc/articles/8562894815383-Discord-Developer-Terms-of-Service) | official | 2026-10-29 (HTTP 403, NOT read) |
| S4 | Developer Policy | https://docs.discord.com/developers/policies-and-agreements/developer-policy (redirects to https://support-dev.discord.com/hc/articles/8563934450327-Discord-Developer-Policy) | official | 2026-10-29 (HTTP 403, NOT read) |
| S5 | Automated User Accounts (Self-Bots) support article | https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots | official | 2026-10-29 (HTTP 403 / 404, NOT read) |
| S6 | Getting started (quick start) | https://docs.discord.com/developers/quick-start/getting-started | official | 2026-10-29 |
| S7 | OAuth2 topic | https://docs.discord.com/developers/topics/oauth2 | official | 2026-10-29 |
| S8 | Application resource | https://docs.discord.com/developers/resources/application | official | 2026-10-29 |
| S9 | How Do I Get My App Verified? | https://support-dev.discord.com/hc/en-us/articles/23926564536471-How-Do-I-Get-My-App-Verified | official | 2026-10-29 (HTTP 403, NOT read; seen in search results only) |
| S10 | Web search: account verification / app creation requirements (snippets citing Discord help centre, Claim Your Game docs, a community tutorial) | search results | mixed | 2026-10-29 |
| S11 | Web search: self-bot rules (GitHub gist, discord-api-docs issue #491, third-party sites) | search results | community | 2026-10-29 |

Old discord.com/developers/docs/... URLs return 301 to docs.discord.com/developers/...

## 2. Registration path

- Steps: open the Developer Portal, "Create App" (New Application), enter a name, click Create; you land on General Information (Application ID, Public Key, description, icon, Interactions Endpoint URL). [S6] Documented
- The Terms of Service wording for the Create step is not shown; no checkbox for accepting Developer Terms is mentioned in S6. Unverified whether the portal shows a terms checkbox at creation.
- Newly created apps have a bot user enabled by default. Bot token appears only after "Reset Token" on the Bot page and cannot be viewed again later. [S6] Documented
- Installation page: choose User Install and/or Guild Install; install link default "Discord Provided Link". Default scopes: User Install `applications.commands`; Guild Install `applications.commands` + `bot`. [S6, S8] Documented
- Instant: nothing in S6/S8 mentions review or waiting before an app exists. Documented (by omission).
- Numeric limits on apps per account: NOT FOUND in S6/S8. A guess of a team/app cap (e.g. 25) found no source. Unverified.
- Account requirements: a Discord account is the only stated prerequisite; no special account type. [S10 snippet of Discord's guide] Reported. Discord help centre says you "may be required to verify your email and phone number as part of our safety system" [S10] Reported. 2FA: not mentioned for creating apps in S6/S8; the only 2FA mention in S7 is that bots with elevated permissions need the owner's 2FA when added to servers that enforce 2FA. [S7] Documented. A community tutorial says some users with verified email still could not create an app, attributing it to stale session or pending security checks (possibly phone/2FA prompts). Reported, anecdotal, Unverified.
- Free account: yes; nothing paid is required. Server installs need a server where the installer has MANAGE_GUILD; the guide says you can create a server for free for testing. [S6] Documented

## 3. OAuth2 setup (fields and steps)

- Register the application to obtain `client_id` and `client_secret`; the secret is kept out of source code. [S7] Documented. Exact portal click path to show/reset the secret (OAuth2 tab) is not described in S6/S7: Unverified, but the OAuth2 page in the portal is where it is commonly found.
- Redirect URIs are registered on the app; `redirect_uri` must match a registered one (url-encoded). If omitted for bot flows, Discord uses the first registered URI. [S7] Documented
- Endpoints: authorize https://discord.com/oauth2/authorize; token https://discord.com/api/oauth2/token; revoke https://discord.com/api/oauth2/token/revoke (form-encoded only). [S7] Documented
- Scopes: partner-only (rpc, voice, dm_channels.read, identify.premium, etc.) need Discord approval via an account representative; `relationships.read` needs separate Social SDK submission. Ordinary scopes (identify, email, guilds, bot, applications.commands) need no approval. [S7] Documented (ordinary scopes by omission)
- Tokens: example `expires_in` 604800 (7 days); authorization code returns access + refresh token; implicit has no refresh; client credentials no refresh. Revoking any token revokes all tokens of that authorization. No formal lifetime policy stated. [S7] Documented
- PKCE: recommended with code grant, but parameters not documented on the fetched page. [S7] Documented (partial)
- Use `state` against CSRF; check `iss` equals https://discord.com when multiple providers. [S7] Documented
- Public Bot toggle: if false only the owner can add the bot to guilds. [S7, S8] Documented

## 4. Review / verification

- No review to create an app or use OAuth2 with ordinary scopes. [S6, S7] Documented (by omission)
- Privileged intents (Presence, Server Members, Message Content): bots in fewer than 100 servers use the limited flags set on the Bot page; bots in 100+ servers need approved full intents. [S8] Documented. S6 says privileged intents must be approved before app verification. [S6] Documented
- App verification (identity check) applies to bots in 100+ servers; verified bots have no guild-count limit; `VERIFICATION_PENDING_GUILD_LIMIT` flag marks unusual growth blocking verification. [S7, S8] Documented. Steps, ID requirements, team/2FA conditions and wait times: NOT FOUND (S9 unreadable). Unverified.
- A throwaway app never nears 100 servers, so none of this applies.

## 5. Terms on automation (not legal advice)

- ToS Section 9 (S1): bans scraping with "any robot, spider, crawler, scraper" without written consent; bans "spamming, auto-messaging, or auto-dialing"; bans "unauthorized software designed to modify the services"; bans overburdening systems. Documented
- ToS Section 6: no reverse engineering or decompiling of the services. Documented
- ToS Section 1: use of APIs, SDKs or developer services is governed by the Developer Terms and Developer Policy. Documented. Those documents were not read. Unverified.
- ToS Sections 2 and 4: age 13+, accurate information; fetched summary says it does not require users to be human. Documented (as summarised)
- Community Guidelines item 14: "Using self-bots or user-bots is prohibited"; reason given: "Each account must be associated with a human, not a bot." Item 13 bans spam tools including account-creation tools, token generators and CAPTCHA solvers. [S2] Documented
- Self-bot rule scope: reported as automating a user account via its user token (as opposed to bot accounts or OAuth2). [S11] Reported (a jagrosh comment in discord-api-docs issue #491, plus third-party sites). Reports of bans and warnings for self-botting. Reported
- No statement found that addresses automating the Developer Portal website, or an AI agent operating the owner's browser. Documented absence in pages read; S3/S4 unread.
- Reading: an agent driving the owner's own signed-in browser session to click through Developer Portal pages is, in effect, automation of a user account's actions in the web client, which is the thing the self-bot rule targets ("each account must be associated with a human"). It is not spam, scraping or token extraction at volume, and it is a few supervised clicks on a page Discord built for developers, but the plain text of item 14 and the ToS Section 9 "auto-" and "unauthorized software" language point against it more than the GitHub equivalent. Discord also treats its sessions with active anti-abuse detection (reported). Risk is account flagging, not legal exposure; consequence of a hit would be a warning or suspension of the owner's main account.
- Verdict: AMBIGUOUS, FORBIDDEN-leaning. Confidence: low-medium (Developer Terms, Developer Policy and the self-bot article could not be read; fetch tool gives summaries only).
- Lower-risk alternatives: owner does the clicks themselves with the agent only dictating steps; use a dedicated throwaway Discord account (but account creation must be done by a human, and phone/CAPTCHA may be needed); no Discord API exists for creating applications with a user token (not verified; using one would be a self-bot violation anyway).
- Not legal advice. Verify S3, S4, S5 directly before relying on this.

## 6. Walkthrough feasibility

Likely human-only steps:
1. Sign-in to Discord and any re-authentication, CAPTCHA, email/phone verification or 2FA challenge. Documented/Reported (phone/email may be demanded). Prohibited for the agent to do and bot detection must not be bypassed.
2. Account creation, if no account exists (human required by Community Guidelines item 14; CAPTCHA).
3. Any "I agree to the Developer Terms" checkbox or consent prompt, if shown (Unverified that one exists).
4. Revealing/resetting the client secret and bot token: credential creation, the owner should confirm and the secret should not be pasted into chat.
5. Deleting the app: portal shows a confirmation, often requiring the owner's password or 2FA code for deletion (Unverified, common behaviour); human-only if so. Deletion is irreversible: owner confirmation needed.
6. Choosing app name and redirect URI (owner's decision; use http://localhost style placeholder).

Agent-doable if the owner decides to allow it (risk noted above): navigate to the portal, Create App with a name, open the OAuth2 page, add a redirect URI, read Client ID. Estimated 3-6 minutes (mine, Unverified). Pages: https://discord.com/developers/applications > New Application > General Information > OAuth2 > (later) Delete App under General Information.

## 7. Suggested difficulty factors

- registration_friction = instant (free account, one name field). Documented by omission; caveat: possible phone/email verification gate (Reported).
- review_required = none for ordinary scopes; verification only for 100+ server bots and partner scopes.
- review_depth = none for this use.
- docs_quality = adequate (quick start omits OAuth2 click path and client secret location; verification article unreadable).
- approval_wait_basis = unknown (no wait for creation).
- special_requirements = [] for registration; optional: ["phone_or_email_verification_possible", "2fa_for_elevated_permission_bots_in_2fa_servers", "app_verification_at_100_servers"].

## 8. Surprises

- Old docs URLs now redirect to docs.discord.com and the policy documents live on support-dev.discord.com, which blocks the fetch tool.
- The Community Guidelines explicitly bans self-bots on the "human-per-account" rule, making this stricter than GitHub's machine-account allowance.
- OAuth2 doc says nothing about app review for ordinary scopes; the gates are partner scopes and 100-server verification.
