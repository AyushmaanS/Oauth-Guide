# GitHub (OAuth Apps and GitHub Apps) - research notes

Retrieved: 2026-10-29. Read-only web research (WebFetch/WebSearch). No logins, no accounts touched. Evidence tags: Documented (official), Reported (community/third-party), Unverified (inferred/conflicting).
Note: WebFetch returns model-summarised page content, not raw HTML; exact wording and numbers should be spot-checked before shipping as final copy.

## 1. Sources

| # | Title | URL | Publisher | Retrieved |
|---|-------|-----|-----------|-----------|
| S1 | Creating an OAuth app | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app | official | 2026-10-29 |
| S2 | Differences between GitHub Apps and OAuth apps | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps | official | 2026-10-29 |
| S3 | Scopes for OAuth apps | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps | official | 2026-10-29 |
| S4 | Authorizing OAuth apps (building) | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps | official | 2026-10-29 |
| S5 | Registering a GitHub App | https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app | official | 2026-10-29 |
| S6 | Authorizing OAuth apps (using; org approval) | https://docs.github.com/en/apps/oauth-apps/using-oauth-apps/authorizing-oauth-apps | official | 2026-10-29 |
| S7 | About OAuth app access restrictions | https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions | official | 2026-10-29 |
| S8 | Requirements for listing an app (Marketplace) | https://docs.github.com/en/apps/github-marketplace/creating-apps-for-github-marketplace/requirements-for-listing-an-app | official | 2026-10-29 |
| S9 | Drafting a listing for your app | https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/drafting-a-listing-for-your-app | official | 2026-10-29 |
| S10 | Applying for publisher verification (surfaced via search snippet only) | https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/applying-for-publisher-verification-for-your-organization | official | 2026-10-29 (search result, page not fetched) |
| S11 | Rate limits for the REST API | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api | official | 2026-10-29 |
| S12 | About creating GitHub Apps | https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps | official | 2026-10-29 |
| S13 | Managing private keys for GitHub Apps | https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps | official | 2026-10-29 |
| S14 | Best practices for creating an OAuth app | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app | official | 2026-10-29 |
| S15 | Generating a user access token for a GitHub App | https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app | official | 2026-10-29 |
| S16 | GitHub Terms of Service | https://docs.github.com/en/site-policy/github-terms/github-terms-of-service | official | 2026-10-29 |
| S17 | GitHub Acceptable Use Policies | https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies | official | 2026-10-29 |
| S18 | Modifying an OAuth app | https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/modifying-an-oauth-app | official | 2026-10-29 |
| S19 | DevActivity: Navigating GitHub Marketplace app submissions (review timelines) | https://devactivity.com/insights/navigating-github-marketplace-app-submissions-understanding-review-timelines-and-support-a-devactivity-insight | community/third-party blog | 2026-10-29 |
| S20 | Stacklok: GitHub authorization for MCP servers (via search) | https://stacklok.com/blog/github-authorization-for-mcp-servers/ | community/third-party | 2026-10-29 (search result only, not fetched) |
| S21 | Speakeasy: state of OAuth in MCP (via search) | https://www.speakeasy.com/mcp/authorization/state-of-oauth-in-mcp | community/third-party | 2026-10-29 (search result only, not fetched) |
| S22 | Limiting OAuth app and GitHub App access requests and installations | https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations | official | 2026-10-29 (search snippet only) |
| S23 | .well-known/openid-configuration on github.com | https://github.com/.well-known/openid-configuration | official host | 2026-10-29 (HTTP 404) |
| S24 | .well-known/oauth-authorization-server on github.com | https://github.com/.well-known/oauth-authorization-server | official host | 2026-10-29 (HTTP 404) |

## 2. Registration path

### OAuth App
- Steps: profile picture > Settings > Developer settings > OAuth apps > New OAuth App (or "Register a new application") > fill form > Register application. Direct page is https://github.com/settings/developers (URL path not stated in S1; inferred from the menu path - Unverified for the exact URL). [S1] Documented
- Form fields: Application name (required), Homepage URL (required, full URL), Description (optional), Authorization callback URL (required), Enable Device Flow (optional), Expire user access tokens (checked by default). [S1] Documented
- Callback URLs: up to 10 per app. [S1] Documented. Exact match required unless wildcard matching is enabled (docs warn of security risk). Loopback redirect_uri may use any port. [S4] Documented
- Limits: a user or org can own up to 100 OAuth apps. [S1] Documented
- Owner: personal account, or any org where you have admin access. [S1] Documented
- Credentials: a Client ID is shown on the app settings page; a client secret is generated by clicking "Generate a new client secret" on that page. Source is a search-result summary of the docs, not a direct fetch of that step. [S4 search result; S1 does not say] Reported/partly Documented. Whether the secret is shown once: NOT FOUND in fetched pages. Client secret is not needed for device flow. [S4, S14] Documented
- Review before use by arbitrary users: none mentioned in S1. Any GitHub user can authorize the app immediately. (Absence of mention, not an explicit "no review" statement.) Unverified by omission; consistent with all other pages seen.
- Account requirements: free account is sufficient per docs (no paid plan is mentioned anywhere in S1/S5). Verified-email requirement: NOT FOUND in docs fetched. Org not required.

### GitHub App
- Steps: Settings (or Your organizations > Settings for an org-owned app) > Developer settings > GitHub Apps > New GitHub App > fill fields > Create GitHub App. [S5] Documented
- Fields: name (max 34 chars, globally unique), description, Homepage URL (can be a public repo/profile URL if no site), up to 10 callback URLs (optional), expire user tokens (default on), request user authorization during installation, device flow, setup URL, webhook active/URL/secret, per-permission access (read/write/none), event subscriptions, installation scope ("Only on this account" or "Any account"). [S5] Documented
- Limit: 100 GitHub Apps per user/org. [S5] Documented
- Credentials: private key is generated via app Edit > Credentials > Key pairs > New key; a PEM downloads and GitHub keeps only the public half. [S13] Documented. Client ID / client secret / App ID: not covered by fetched pages (S5 and S12 do not describe them); NOT FOUND in fetched docs, though S15 confirms client_secret is used in the web flow. [S15]
- Review before public use: none described. Setting installation scope to "Any account" makes it publicly installable. [S5] Documented (absence of review is by omission)
- Manifest flow exists (registering from a manifest) [search result only, Enterprise Cloud docs] Reported.

## 3. Review / approval
- For use by arbitrary users: no GitHub review step is described for either app type. Review depth: none. [S1, S5] Documented (by omission)
- Per-organization approval (the real gate): orgs with OAuth app access restrictions block unapproved OAuth apps from private org resources; until an owner approves, the app only reaches public org resources. Members can request approval; owners get notified. [S6, S7] Documented. This is customer-side approval by the org owner, not GitHub review.
- Marketplace listing (optional): the listing is submitted from Developer settings > "List in Marketplace"; publisher accepts the Marketplace Developer Agreement and clicks "Submit for review"; "an onboarding expert" then contacts the publisher. [S9] Documented. Search-result snippet attributes to docs that GitHub staff review submissions and that a security review occurs; S9 itself says it does not mention a security review. Conflicting: Unverified.
- Marketplace requirements: public app, value beyond authentication, valid privacy policy link, publisher contact, support link, logo/feature card/screenshots, webhooks for plan changes. [S8] Documented. Paid listings need a verified-publisher organization (verified email/domain and 2FA) [S8, S10] and at least 100 installations (GitHub App) or 200 users (OAuth app). [S8] Documented. Free listing thresholds: not stated. [S8]
- Documented wait times: NOT FOUND in official pages (S9 says it does not describe timelines). The blog S19 claims official docs say "up to 4 weeks"; I could not locate that in official docs. Unverified.
- Reported wait times: 3-7 days at best, typically 2-6 weeks, complex cases 6-8+ weeks. [S19] Reported (single third-party blog that cites a GitHub Community post by a developer waiting 3 weeks; thread itself not fetched).
- Reported rejection reasons: none listed. Statuses "Needs action" and "Rejected" exist. [S19] Reported
- Marketplace listing is not needed to let customers connect accounts.

## 4. Scopes and nuances
- No restricted/sensitive-scope verification program for OAuth app scopes. Broad scopes (repo, delete_repo, admin:org, workflow, codespace, read:audit_log) are documented as powerful, but there is no extra review for them. [S3] Documented
- Scopes only narrow what a user already can do; users can reduce a token's scopes after the flow, so the granted scopes must be checked. [S3] Documented
- OAuth app tokens: non-expiring by default in S2 ("long-lived by default"); the registration form has "Expire user access tokens" checked by default [S1]. Expiring tokens: 8-hour access token, 6-month refresh token, via the app setting or the offline_access scope. [S4] Documented. Tension between S1 (default on in the form) and S2 (long-lived by default) is not resolved: Unverified which applies to new apps.
- GitHub App user tokens: 8 hours (expires_in 28800), refresh token 6 months, and the token only reaches what both app and user can access; the scope field is empty. [S15] Documented. Installation tokens expire in about 1 hour. [S2] Documented
- Token caps: 10 tokens per user/app/scope combination; creating more revokes an old one; 10 tokens/hour creation limit triggers re-authorization; device flow: 50 user code submissions/hour/app, codes expire in 15 minutes. [S4] Documented
- PKCE: supported in web flow, S256 only, strongly recommended. [S4, S15] Documented
- Rate limits: unauthenticated 60/hr per IP; OAuth app user tokens share the user's 5,000/hr (15,000 if app owned by a GitHub Enterprise Cloud org); GitHub App installation tokens min 5,000/hr, scaling +50/hr per repo and per org user beyond 20, capped at 12,500 (15,000 on Enterprise Cloud). [S11] Documented
- Org approval: restrictions are on by default for newly created orgs, off or absent in older orgs, so many orgs auto-authorize apps. [S7] Documented. Owners can allow outside collaborators to request unapproved OAuth apps and GitHub Apps. [S7] Documented
- Org SAML SSO: users may need an active SAML session before authorizing for org resources. [S14, S15] Documented

### The difference that matters for a product connecting customers' accounts
- OAuth App: acts as the user with broad scopes; customer org owners must approve it when restrictions are on; tokens are tied to a user. Docs themselves recommend GitHub Apps instead. [S2, S14] Documented
- GitHub App: fine-grained permissions, installed per org or repo by owners/admins, persists if the installer leaves, supports short-lived tokens, higher rate limits that scale with installs, and can act independently of a user. Installation by an org owner (or repo admin) with owner approval for org permissions. [S2, S12] Documented
- Both can be registered instantly by anyone; the friction is on the customer's admin side, not GitHub's.

## 5. Special requirements
- No domain verification, privacy policy, demo video or security questionnaire to register either app type. [S1, S5] Documented (by omission)
- Homepage URL must be a full URL; for GitHub Apps a public repo or profile URL is allowed if you have no site. [S1, S5] Documented
- Marketplace only: privacy policy link, support contact, Developer Agreement, publisher verification for paid plans (domain, email, 2FA). [S8, S9, S10] Documented

## 6. Provider public OAuth metadata
- https://github.com/.well-known/openid-configuration returned HTTP 404 on 2026-10-29. [S23] Observed
- https://github.com/.well-known/oauth-authorization-server returned HTTP 404 on 2026-10-29. [S24] Observed
- Dynamic client registration: GitHub's authorization server has no registration_endpoint that I found; third-party MCP write-ups state GitHub supports neither DCR nor CIMD and that a manually created OAuth app is required. [S20, S21] Reported (search snippets, pages not fetched; one snippet quotes GitHub's MCP docs saying DCR is not supported - the original docs page was not fetched). Not checked: whether any other discovery document exists on other hosts (e.g. api.github.com), so "none" is only for the two github.com paths.

## 7. Free-path feasibility (AI agent driving owner's browser, free personal account)
- Can a free account create an app and get credentials? Per docs, yes: nothing in S1 or S5 mentions a paid plan or approval. Documented (by omission); not verified by actually doing it.
- First human-only step: the owner must already be signed in; GitHub typically asks for a "sudo mode" re-authentication (password/2FA/passkey) before sensitive settings pages. That requirement was NOT in the pages I fetched, so it is Unverified (from general knowledge). Also, ticking "Generate a new client secret" is a credential-creation action the owner should confirm. Account creation is human-only: the Terms say bots cannot create accounts ("You must be a human"). [S16 B.3] Documented
- Estimated time from docs: about 3-5 minutes for OAuth App (one form, 4 required-ish inputs, then generate secret). GitHub App about 5-10 minutes (more fields, permissions, key download). Estimate is mine, Unverified.
- Pages visited: https://github.com/settings/profile (or any page) > https://github.com/settings/developers > OAuth Apps > New OAuth App form > app settings page (client ID, Generate a new client secret). For GitHub App: https://github.com/settings/apps/new and then the app's Credentials page. Direct URLs are inferred from menu paths, Unverified.
- Naming/URL choices (homepage, callback) are the owner's, not agent-chosen.

## 8. Terms on automation (not legal advice)
- ToS B.3 (Account Requirements): a human must create an account; "machine accounts" for automated tasks are allowed with a responsible human. [S16] Documented
- ToS Section H (API Terms): abusive or excessively frequent API requests may lead to suspension; GitHub decides what counts. [S16] Documented
- AUP Section 4: bans "automated excessive bulk activity" and coordinated inauthentic activity; Section 7 defines scraping as extraction "via an automated process"; Section 9 excessive bandwidth. [S17] Documented
- The fetched text does not directly address an agent clicking through the logged-in settings UI on the owner's behalf. My reading: one low-volume, owner-supervised walkthrough to register an app is not bulk activity, spam or scraping, so it is probably not prohibited, but it is not explicitly permitted either; it is ambiguous. Confidence: medium-low. The summaries came from a fetch tool, not a full reading of the legal text, so verify sections B.3, H and AUP 4/7/9 directly. Not legal advice.

## 9. Surprises
- GitHub docs recommend GitHub Apps over OAuth apps, yet OAuth apps remain fully supported and are still simplest for "Login with GitHub". [S14] Documented
- Org-level OAuth restrictions are on by default for new orgs, but many older orgs have none and auto-authorize apps. [S7] Documented
- OAuth app review for public use does not exist; the only gate is per-customer-org approval.
- Marketplace paid thresholds differ: 100 installations (GitHub App) vs 200 users (OAuth app). [S8] Documented
- No dynamic client registration; MCP-style flows need a pre-registered app. [S20, S21] Reported
- Docs conflict on token expiry default for new OAuth apps (S1 vs S2). Unverified.
- Two documented rate-limit shapes: OAuth apps are bound to the user's shared 5,000/hr, GitHub Apps scale with installs. [S11] Documented

## 10. Suggested difficulty factors
- registration_friction = instant. Evidence: free account, one form, no approval in S1/S5. Documented (by omission). Caveat: sudo re-auth step Unverified.
- review_required = none. Evidence: no GitHub review for registering or using either app type; Marketplace listing is optional. Note per-org owner approval is customer-side. [S1, S5, S7, S9]
- review_depth = none. Evidence as above. (Marketplace would be manual if a listing is pursued.)
- docs_quality = clear. Evidence: step-by-step pages with exact fields and limits. Gap: credential issuance (client secret, GitHub App client ID) was thin in fetched pages.
- approval_wait_basis = unknown. Evidence: no GitHub review so no wait; Marketplace waits only reported by one third-party blog (S19) and not documented. If the verdict only concerns registration/use, "unknown" is the safe value.
- special_requirements = [] for registration. Optional: ["org_owner_approval_by_customer", "privacy_policy_url_for_marketplace", "publisher_verification_for_paid_marketplace"].
