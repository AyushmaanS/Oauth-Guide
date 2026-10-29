# Research notes: Google (Gmail API scopes, Google Auth Platform / OAuth consent)

Retrieved 2026-10-29. Read-only research; no logins, no account actions.
Labels: Documented = official Google page. Reported = community/vendor/third-party. Unverified = inferred/conflicting/not directly confirmed.
Note: pages were read via a summarising fetch tool, so wording is paraphrase; fine details (UI labels) should be re-checked in a live walkthrough.

## 1. Sources

| # | Title | URL | Publisher | Retrieved |
|---|---|---|---|---|
| S1 | OpenID Discovery doc (accounts.google.com) | https://accounts.google.com/.well-known/openid-configuration | official | 2026-10-29 |
| S2 | Gmail API: Choose scopes | https://developers.google.com/workspace/gmail/api/auth/scopes | official | 2026-10-29 |
| S3 | Brand verification (production readiness) | https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification | official | 2026-10-29 |
| S4 | Sensitive scope verification | https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification | official | 2026-10-29 |
| S5 | Restricted scope verification | https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification | official | 2026-10-29 |
| S6 | Manage OAuth App Audience (Cloud Help) | https://support.google.com/cloud/answer/15549945 | official | 2026-10-29 |
| S7 | Manage App Audience / publishing (Cloud Help) | https://support.google.com/cloud/answer/15544987 | official | 2026-10-29 |
| S8 | OAuth App Verification Help Center | https://support.google.com/cloud/answer/13463073 | official | 2026-10-29 |
| S9 | OAuth App Verification FAQ | https://support.google.com/cloud/answer/13463817 | official | 2026-10-29 |
| S10 | Create access credentials (Workspace) | https://developers.google.com/workspace/guides/create-credentials | official | 2026-10-29 |
| S11 | Create a Google Cloud project (Workspace) | https://developers.google.com/workspace/guides/create-project | official | 2026-10-29 |
| S12 | Creating and managing projects (Cloud Resource Manager) | https://docs.cloud.google.com/resource-manager/docs/creating-managing-projects | official | 2026-10-29 |
| S13 | Manage OAuth clients (Cloud Help) | https://support.google.com/cloud/answer/6158849 | official | 2026-10-29 |
| S14 | Google Cloud Terms of Service | https://cloud.google.com/terms | official | 2026-10-29 (first 100k of ~146k chars read) |
| S15 | Google Terms of Service | https://policies.google.com/terms | official | 2026-10-29 |
| S16 | Google APIs Terms of Service | https://developers.google.com/terms | official | 2026-10-29 |
| S17 | Sign in with a supported browser | https://support.google.com/accounts/answer/7675428 | official | 2026-10-29 |
| S18 | Nylas: Google OAuth verification costs/timelines | https://www.nylas.com/blog/google-oauth-app-verification/ | community/vendor (sells reviews; page dated June 2021) | 2026-10-29 |
| S19 | GMass: five annoying issues with scope verification | https://www.gmass.co/blog/five-annoying-issues-google-oauth-scope-verification/ | community (article Jan 2020, comments to Oct 2021) | 2026-10-29 |
| S20 | Indie Hackers: Mailnotes product page | https://www.indiehackers.com/product/mailnotes | community | Fetch returned HTTP 403; figures only seen via a search-result snippet summary (weak) |
| S21 | Auth0 community: security assessment for Google connection | https://community.auth0.com/t/security-assessment-for-google-connection/25490 | community | Not fetched; seen only in search snippet summary |
| S22 | singhamandeep.com Google OAuth verification posts | https://singhamandeep.com/gmail-api-restricted-scope-verification/ | community/consultancy (sells services) | Not fetched; search snippet only |
| S23 | Playwright/Puppeteer Google-login blog and forum threads (e.g. Medium, Checkly, go-rod issue) | https://adequatica.medium.com/google-authentication-with-playwright-8233b207b71a ; https://docs.checklyhq.com/learn/headless/e2e-google-login ; https://redirect.github.com/go-rod/stealth/issues/26 | community | Search snippet only, not fetched |

## 2. Registration path (current console UI)

- Console entry: Google Cloud console, menu "Google Auth platform" > "Clients" > "Create Client". [Documented, S10]
- Project: created via IAM & Admin > Create a Project (name, optional project ID which cannot change later, location, Create). [Documented, S11]. The client page also says you will be prompted to create a project if none is selected. [Documented, S13]
- Auth Platform / consent must be configured ("register your application with Google Auth") before a client can be created. [Documented, S13]. The detailed consent-setup steps (app name, support email, contact email, audience, scopes) are on a separate guide I did not fetch: NOT FOUND in fetched pages; app name / support email requirement is Unverified from these sources.
- Audience: External (any Google Account holder) or Internal (only members of your Google Cloud organization; project must belong to an organization). [Documented, S6, S7]. A free personal @gmail.com has no organization, so Internal is effectively unavailable. [Unverified inference from S6]
- Gmail API must be enabled in the project (separate "Enable Workspace APIs" step). [Documented, S11 points to it; enable-step page not fetched]
- Client creation: Application type options: Web application (name + authorized JS origins or redirect URIs), Android, iOS, Chrome Extension, Desktop app (name only), TVs/limited input (name only). [Documented, S10]. There is an optional "Use this client for an AI-powered agent" checkbox that cannot be changed after creation. [Documented, S10]
- Credentials issued: a Client ID appears under "OAuth 2.0 Client IDs". S10 says "client secrets aren't used for Web applications" and does not describe secret download; this conflicts with common knowledge that web clients get a secret. Treat secret issuance for web clients as Unverified; confirm in live walkthrough.
- Billing: creating a project does not require a billing account; billing can be linked later. [Documented, S12]. S11 says you "might" need billing depending on APIs; Gmail API billing need NOT FOUND in fetched pages (Gmail API is commonly free; Unverified here).
- Permissions: creating a project needs resourcemanager.projects.create (Project Creator role); outside an org a per-user project quota applies. [Documented, S12]
- Credit card for a free personal account: NOT FOUND for project/OAuth client creation. First-time Google Cloud sign-up may show a free-trial/billing prompt; not verified here. [Unverified]

## 3. Testing vs In production

- Testing: up to 100 listed test users. [Documented, S6]
- Testing: test authorizations / refresh tokens expire after 7 days. [Documented, S6]. Exception: apps requesting only basic profile, email, OpenID skip the test-user list and 7-day expiry. [Documented, S6]
- In production: any Google Account holder; sensitive/restricted scopes may require verification. [Documented, S6]
- Unverified app (sensitive/restricted scopes not approved): 100 new-user cap for the project's lifetime, cannot be reset. [Documented, S6]. Users see the "unverified app" warning screen. [Unverified from these fetches; widely known behaviour; S19 comments reference a "not verified" screen]
- Rejected/unapproved sensitive or restricted scopes stop working for users until approved. [Documented, S9]

## 4. Gmail scope classes (S2, Documented)

- Non-sensitive: gmail.labels; gmail.addons.current.action.compose; gmail.addons.current.message.action.
- Sensitive: gmail.send; gmail.addons.current.message.metadata; gmail.addons.current.message.readonly.
- Restricted: https://mail.google.com/ (full access); gmail.readonly; gmail.compose; gmail.insert; gmail.modify; gmail.metadata; gmail.settings.basic; gmail.settings.sharing (admin/domain-wide delegation).
- Typical agent use mapping (inference from S2): send only -> gmail.send (sensitive). Read -> gmail.readonly (restricted). Read+draft+send, no permanent delete -> gmail.modify (restricted). Drafts -> gmail.compose (restricted). So any agent that reads mail needs a restricted scope. [Unverified inference, based on S2 classes]
- S9 example: full mail scope used only to send is a rejection reason; Google steers to sensitive gmail.send. [Documented]

## 5. Verification process

- Brand verification (needed when External + Published + app name/logo shown): verified domain in Search Console, public homepage (store/social listings don't count), privacy policy on same domain as homepage and linked from consent screen. [Documented, S3]
- Exempt from verification: personal use, dev/test/staging projects, service-account-only data, internal-only apps, domain-wide installs (unless sensitive/restricted). [Documented, S3]
- Sensitive-scope verification: scopes declared in console; brand verified/published first; per-scope written justification including why narrower scope won't work; demo video (English, whole grant flow, consent screen with app name, address bar showing client ID, what each scope enables) uploaded to YouTube Unlisted. [Documented, S4]
- Documented timelines: automated brand check "a few minutes"; manual brand review usually 2-3 business days; passing brand result expires after 7 days if not published. [Documented, S3]. Sensitive scope up to 10 days [Documented, S4]. FAQ estimates: brand 2-3 business days, sensitive 10 business days, restricted about 6 weeks plus security assessment (estimates, vary with developer responsiveness). [Documented, S9]
- Restricted scopes: security assessment required if restricted data is stored or transmitted via servers; run by Google-empanelled independent third-party assessors under the App Defense Alliance CASA framework; reassessment at least every 12 months; review can take several weeks; annual re-verification. [Documented, S5, S9]. Cost: not stated by Google in S5. Local-only data implicitly outside the requirement: Unverified inference.
- Reported cost: $15,000-$75,000 (Auth0 community post via search snippet; also quoted by Nylas as Google's range and "starts at $15,000" as a vendor sales claim) [Reported, S18, S21]. Contrasting report: about $540 for scan plus 2 revalidations, about $600 total [Reported, S20 via search snippet only, weak]. The two conflict; likely different CASA tiers. [Unverified reconciliation]
- Reported time for assessment: Nylas about two weeks (already SOC 2 Type II); another dev reports about 1 month total verification; a consultancy estimates 4-8 weeks [Reported, S18, S20, S22]. Nylas also says assessment often takes multiple months (page dated 2021). [Reported, S18]

## 6. Reported wait times and rejection reasons

- Official-FAQ rejection issues: scopes not approved for the project; restricted data misuse or broader scope than needed; privacy policy not covering restricted data; using Google user data to train foundation AI/ML models; unresolved high/critical security findings. [Documented, S9]
- No fixed wait after rejection; fix and resubmit all materials. [Documented, S9]
- Community: author notes official 3-5 business days (2020); commenters report months of silence and 6+ months with repeated video resubmissions (2020-2021). [Reported, S19, old]
- Community: switching scope (mail.google.com to gmail.modify) put an app back to Unverified. [Reported, S19, 2020]
- Community/vendor: vague justification ("improve user experience") and branding/domain mismatches are frequent causes. [Reported, S22 snippet, consultancy]
- Nylas: delays from Google clarification questions and failed initial assessment (remediation). [Reported, S18]
- No post-2024 community data on timelines was retrieved; all hard numbers above are dated. [Unverified currency]

## 7. Special requirements list

- Verified domain (Search Console) for brand/production; public homepage; privacy policy on same domain.
- Demo video on YouTube (unlisted) per sensitive scope.
- Per-scope written justification.
- For restricted scopes with server-side storage: third-party CASA assessment, repeated every 12 months, plus annual re-verification.
- Ban on using Google user data to train/improve foundation AI models (S9).
- Optional AI-agent client flag (S10).

## 8. Provider OAuth metadata (S1)

- HTTP 200 and JSON returned. 17 top-level keys (issuer, authorization_endpoint, device_authorization_endpoint, token_endpoint, userinfo_endpoint, revocation_endpoint, jwks_uri, ... grant_types_supported, authorization_response_iss_parameter_supported). [Documented]
- registration_endpoint: absent (no dynamic client registration). [Documented, S1]
- scopes_supported: 3 entries (openid, email, profile). Gmail scopes not listed. [Documented, S1]
- Implication: no programmatic client registration; the console is the only path (Unverified inference, no API alternative found in this research).

## 9. Free-path feasibility (signed-in walkthrough by an AI agent)

Verdict: Probably feasible without verification and without billing, for Testing mode with the owner added as a test user. [Unverified: I did not run it; based on S6, S10, S12]
- Pages likely visited: console.cloud.google.com project creator -> Google Auth platform overview/branding/audience/data access -> APIs & Services Library (Gmail API enable) -> Google Auth platform > Clients > Create Client -> client credentials dialog. (UI names Documented in S10/S11; page sequence Unverified)
- Scopes can be added to the consent screen declaration without submitting for verification; Testing mode caps 100 test users and 7-day refresh tokens. [Documented, S6]; sensitive/restricted scopes work only for listed test users in Testing mode (Unverified inference).
- Likely human-only steps: Google sign-in, 2FA/passkey, accepting Cloud Terms of Service on first console visit, possible phone verification and a billing/free-trial upsell (skippable?) [all Unverified; not observed], adding test user email, copying/downloading the secret (secret might show once).
- Estimated minutes to credentials: 10-20 if signed in and no new-account prompts; 20-40 for a brand-new Cloud user. [Unverified estimate]
- Client ID/secret are issued at client creation; verification is not needed for the credentials, only for public use. [Documented-ish, S3/S6]

## 10. Terms on automation (plain reading, not legal advice)

- Google ToS, "Don't abuse our services": prohibits automated means that violate machine-readable instructions (robots.txt) and bypassing protective measures. Plain reading: targeted at crawling content; a user driving their own console is not obviously covered. Confidence low-medium. [Documented, S15]
- Google Cloud ToS section 3.3(d): no use "in violation of the AUP" or circumventing quotas; the AUP itself was not fetched. 100k of 146k chars read. Confidence low. [Documented, S14; remainder NOT READ]
- Google APIs ToS: s2c access APIs "by the means described" in docs; s4a.4 no interference; s5e.1 no scraping returned content. These govern API clients, not console use. Confidence medium. [Documented, S16]
- No clause found that expressly bans or permits AI agents operating a user's own browser session on the console. NOT FOUND. Overall: gray area, user-owned account and user-initiated, but Google may treat automation as risk signal.
- Sign-in blocking: Google says it may block sign-in from browsers "controlled through software automation rather than a human", with unsupported extensions, or embedded in apps. [Documented, S17]. Community: Puppeteer/Playwright logins hit "this browser or app may not be secure"; stealth plugins unreliable (puppeteer-extra stealth maintenance reportedly stopped March 2023); common workaround is to reuse an already logged-in real Chrome profile (including over CDP) or saved session state. [Reported, S23 snippets only]
- Implication: the agent should start from an already signed-in browser session; the human performs login. Once signed in, console actions are not sign-in so the block is less relevant (Unverified).

## 11. Surprises

- Google Cloud now says client secrets "aren't used for Web applications" per S10; conflicts with prior knowledge. Check live.
- Discovery doc lists only 3 scopes and no registration_endpoint.
- Any agent that reads mail needs a restricted scope, so a public production path implies CASA with a reported $540 to $75k cost spread.
- New "AI-powered agent" client flag (S10), irreversible after creation.
- Unverified-app 100 new-user cap is lifetime and unresettable (S6).
- Brand verification passing result expires in 7 days if not published (S3).
- Google forbids using Google user data to train foundation models (S9), relevant for LLM agents.

## 12. Suggested difficulty factors

- registration_friction: account_needed. Evidence: free Google account + free project, no billing needed (S12), no org needed for External (S6). Confidence medium; Unverified trial/billing prompts.
- review_required: for_sensitive_scopes. Evidence: verification needed for sensitive/restricted when public (S6, S8); not for testing/personal use (S3).
- review_depth: security_assessment. Evidence: restricted Gmail read/modify scopes require third-party CASA when data is stored server-side (S5, S9). (Sensitive-only like gmail.send would be manual.)
- docs_quality: clear. Evidence: detailed official pages with checklists (S3, S4, S5, S9), although cost is not stated and consent-setup UI differs between pages.
- approval_wait_basis: documented (brand 2-3 days, sensitive about 10 business days, restricted about 6 weeks per S9) while reality per community varies, months in some old reports (S19).
- special_requirements: verified domain; public homepage; privacy policy; demo video; per-scope justification; annual CASA reassessment (restricted + server storage); 100 test-user cap and 7-day tokens in Testing; no AI-model training on Google user data.
