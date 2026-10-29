# LinkedIn research notes (OAuthPath)

Retrieved: 2026-10-29. Read-only research; no logins, no accounts, no forms. Labels: Documented (official), Reported (community/third-party), Unverified (inferred/conflicting). Not legal advice.

## 1. Sources

| # | Title | URL | Publisher | Retrieved |
|---|---|---|---|---|
| S1 | Authenticating with OAuth 2.0 Overview | https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication | official (LinkedIn docs on MS Learn) | 2026-10-29 |
| S2 | Getting Access to LinkedIn APIs | https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access | official | 2026-10-29 |
| S3 | LinkedIn 3-Legged OAuth Flow | https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow | official | 2026-10-29 |
| S4 | Marketing: Increasing Access | https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access | official | 2026-10-29 |
| S5 | Community Management: Overview | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview | official | 2026-10-29 |
| S6 | Community Management App Review | https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review | official | 2026-10-29 |
| S7 | Marketing Quick Start | https://learn.microsoft.com/en-us/linkedin/marketing/quick-start | official | 2026-10-29 |
| S8 | LinkedIn API Partner Support | https://learn.microsoft.com/en-us/linkedin/shared/linkedin-api-partner-support-guide | official | 2026-10-29 |
| S9 | Associate an app with a LinkedIn Page (Help) | https://www.linkedin.com/help/linkedin/answer/a548360/associate-an-app-with-a-linkedin-page | official | 2026-10-29 |
| S10 | Sign In with LinkedIn using OpenID Connect | https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2 | official | 2026-10-29 |
| S11 | Share on LinkedIn | https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin | official | 2026-10-29 |
| S12 | API Rate Limiting | https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits | official | 2026-10-29 |
| S13 | Marketing API Versioning | https://learn.microsoft.com/en-us/linkedin/marketing/versioning | official | 2026-10-29 |
| S14 | OIDC discovery doc | https://www.linkedin.com/oauth/.well-known/openid-configuration | official (live endpoint) | 2026-10-29 |
| S15 | LinkedIn User Agreement | https://www.linkedin.com/legal/user-agreement | official | 2026-10-29 |
| S16 | LinkedIn API Terms of Use | https://www.linkedin.com/legal/l/api-terms-of-use | official | 2026-10-29 |
| S17 | Prohibited software and extensions (Help) | https://www.linkedin.com/help/linkedin/answer/a1341387 | official | 2026-10-29 |
| S18 | Microsoft Fabric community thread "Connecting to LinkedIn via API" | https://community.fabric.microsoft.com/t5/Desktop/Connecting-to-LinkedIn-via-API/m-p/4727044/highlight/true | community | 2026-10-29 (seen only as search result, not fetched) |
| S19 | singhamandeep.com "LinkedIn API Access & Approval" | https://singhamandeep.com/?p=1387 | community/consultancy (sells approval help; commercial interest) | 2026-10-29 (search snippet only) |
| S20 | aeroleads.com "LinkedIn API Basics" | https://aeroleads.com/blog/linkedin-api-basics/ | community/third-party | 2026-10-29 (search snippet only) |
| S21 | WorkOS LinkedIn OAuth guide | https://workos.com/docs/integrations/linkedin-oauth/what-you-will-need/1-create-the-linkedin-oauth-application | third-party | 2026-10-29 (search snippet only) |

Not fetched/could not fetch: https://www.linkedin.com/developers/apps/new returned only the title "Developers | LinkedIn" (no body; presumably needs login/JS) - NOT FOUND / could not fetch. Review status definitions page https://www.linkedin.com/help/linkedin/answer/a1449586/ was referenced by S8 but not fetched.

## 2. Registration path

- Documented (S8): log in to the Developer Portal with LinkedIn credentials, My Apps > Create App, configure details, then Products tab to select products. A member login is therefore required.
- Documented (S9): an app is associated with a LinkedIn Page; the Page's organization acts as the app's publisher. The article says a Page is required "only for certain functionality and products"; if you have none you can create one. It also says individual developers' API products need a default page before app creation can proceed (ambiguous wording). Page super admin approves/denies the verification request within 30 days. App is permanently tied to one Page, not transferable.
- Documented (S7): Marketing path step 1 is "Create a LinkedIn Page", then create the developer app.
- Unverified: whether the create-app form itself hard-requires a Page for the self-serve products. S9 wording is conflicting/ambiguous and the form could not be fetched. Reported (S21, search snippet): guides tell you to click Verify in app Settings to link the company page.
- Documented (S3): credentials (Client ID, Client Secret) appear on the app's Auth tab after app creation; redirect URLs must be HTTPS and absolute (S3). So credentials exist immediately after creation, before any product approval. Scopes depend on which Products the app has (S3).

## 3. Self-serve vs approval

- Documented (S2): "Open Permissions" are the only permissions available without special approval: Sign in with LinkedIn using OpenID Connect (profile, email; plus openid per S10) and Share on LinkedIn (w_member_social). Added via Products tab. "Most permissions and partner programs require explicit approval."
- Documented (S10): openid/profile/email product; LinkedIn notes it does not verify user identities.
- Documented (S11): Share on LinkedIn grants w_member_social; limits 150 req/day per member, 100,000/day per app.
- Gated (Documented, S2/S4):
  - Advertising API: must be approved (apply via Products tab). Dev tier then Standard (support ticket).
  - Community Management API: vetted, Dev tier then Standard tier (S5, S6). Only legal organizations for commercial use cases (S6).
  - Lead Sync, Conversions, Matched Audiences: apply per product (S4). Events Management: "self-serve API product on request" (S4, still via Apply).
  - Audience Insights, Media Planning: qualified developers only; case-by-case, no fixed timeline (S4). Company Intelligence: not accepting new applications (S4).
  - Sales Navigator (SNAP): partner application (S2). Talent (RSC, Apply Connect, etc.): partner application (S2).
  - Compliance: closed, cannot be requested (S2). Member Post Management r_member_social: closed (S5).
- What default access gives a developer building a product for customers (Documented, S2/S11/S16): sign-in with name/photo/email and posting on behalf of the authenticated member's own profile. Nothing for company-page management, ads, or reading other members' data; those need vetted programs. S16 s1.4: Self-Serve program limited to no advertising use, <=100,000 lifetime users, API not a core business function.

## 4. Review / approval for gated products

- Documented (S6) Community Management Development tier review checks: approved use case, verified business email, verified organization, verified website/domain, app verified by the Page of the same organization. Personal email will not pass. Needs organization legal name, registered address, website, privacy policy.
- Documented (S6) Standard tier: completed integration, company/product overview, test credentials for reviewers, privacy policy, compliance with data storage requirements, and a screencast demonstrating each use case (OAuth flow, posting, comment display, personal-data fields shown, etc.).
- Documented (S6): on rejection you cannot reapply with the same app; create a new app and submit a new Development tier form. (S8 offers a Reapply option only for "Insufficient Details" cases.)
- Documented (S8): vetting survey auto-generated in the portal, must be completed within 21 days; follow-ups to registered business email; identity-vetting denials can be appealed via the Developer Support form. Community Management must be the only product on its app (button greyed out otherwise).
- Documented timelines: Ads API Standard tier upgrade "can take up to 30 business days" (S8). Restricted APIs: "no fixed timeline" (S4). Dev tier for Community Management: no documented timeline found (NOT FOUND). Community Management Dev tier must be completed within 12 months (S4).
- Documented limits: CM Dev tier 500 calls/app/24h, 100/member/24h, no BATCH_GET, webhooks disabled (S4, S5). Ads Dev tier: edit up to 5 ad accounts (S4).
- Reported (S19, search snippet, consultancy with commercial interest): "2 weeks to 3 months" and another article "4-8 weeks"; sources conflict. Reported (S20, snippet): a rejection for a "data harvesting" use case and a claim of <10% approval for Community Management; unsourced third-party figure, treat as Unverified.
- Reported (S18, snippet): community answer says Community Management API access is only for approved, often partnered applications; ordinary apps get "Access denied".
- I did not find first-hand Reddit/StackOverflow rejection threads (search returned none).

## 5. Scopes and nuances

- Documented (S3): all access tokens have a 60-day lifespan (expires_in 5184000). Refresh tokens are in the response schema, but "programmatic refresh tokens are available for a limited set of partners". Standard "refresh" for others = rerun auth flow, which skips consent if member still logged in and token not expired. Auth code lifetime 30 minutes. Requesting a different scope than previously granted invalidates earlier tokens. Users must consent to all scopes together.
- Documented (S12): rate limits per app and per member per 24h, reset midnight UTC, 429 on exceed; standard limits are not published, viewable in portal Analytics tab after one call; alert emails at 75% of app limit.
- Documented (S13): Marketing APIs at https://api.linkedin.com/rest/ require Linkedin-Version: YYYYMM header (and X-Restli-Protocol-Version: 2.0.0 in the example); no default version; missing/deprecated gives error; monthly releases supported at least 1 year. Latest listed: 202610. Version 202511 sunsets 2026-11-16 (S4).
- Documented (S11): older consumer endpoints use /v2 with X-Restli-Protocol-Version: 2.0.0.
- Documented (S14): no PKCE or dynamic client registration info in metadata; see section 7.

## 6. Special requirements

- Documented: registered legal organization for commercial use (CM API) (S6); verified business email (S6); LinkedIn Page super admin verification of the app (S6, S9); no LinkedIn/Microsoft names/logos in app (S6); screencast for Standard tier (S6); test credentials for reviewers (S6); privacy policy (S6); data storage requirements (S6). No documented paid fee found for API access itself, but Ads API use implies a Campaign Manager ad account (S7) - paid ads spend not required for access per sources read (Unverified).
- Documented (S16 s2.3): test profiles must be created manually, not by scripts.

## 7. Provider public OAuth metadata

- Observed (S14, fetched 2026-10-29): OIDC discovery at https://www.linkedin.com/oauth/.well-known/openid-configuration returns issuer https://www.linkedin.com/oauth, authorization_endpoint https://www.linkedin.com/oauth/v2/authorization, token_endpoint https://www.linkedin.com/oauth/v2/accessToken, userinfo_endpoint https://api.linkedin.com/v2/userinfo, jwks_uri https://www.linkedin.com/oauth/openid/jwks, scopes_supported openid/profile/email. No registration_endpoint observed. Note the fetch tool summarized the output; the issuer string differs from the "https://www.linkedin.com" shown in S10 docs sample (Unverified which is current; the live fetch said .../oauth).
- Not tried: /.well-known/oauth-authorization-server (not fetched; NOT FOUND / not attempted).
- Conclusion (Documented by absence, medium confidence): no dynamic client registration; apps are created only in the portal.

## 8. Free-path feasibility (agent driving owner's browser, free personal account)

- This section is assessment (Unverified) based on docs, since the portal could not be fetched or used.
- Can it create an app without a Company Page? Unverified. S9 says a Page is needed only for some products; S7 says create a Page first for marketing. Likely the create form asks for a company/Page; a Page can be created free (S9) but needs the human owner.
- First human-only step: logging in (credentials/2FA/CAPTCHA risk) - and the Page super admin verification of the app (S9), plus accepting terms in the create-app form.
- Self-serve credentials without approval: Documented (S2, S3): Client ID/Secret exist on app creation; Sign In (OIDC) and Share on LinkedIn products are self-serve with no LinkedIn review. Reported (S21 snippet) conflicting: one guide says Page admin must approve the product request; unresolved.
- Estimated time (Unverified): ~10-20 minutes if a Page already exists; ~30 minutes if a Page must be created and verified. Gated products: days to months (section 4).

## 9. Terms on automation

- Documented, S15 User Agreement s8.2 (Don'ts): prohibits using "software, devices, scripts, robots or any other means" to scrape or copy the Services, and "bots or other unauthorized automated methods" to access the Services.
- Documented, S17: prohibits bots/automated methods that add contacts, message, or like/comment/share; consequences include account restriction. Browser plug-ins that alter the site's appearance are also listed.
- Documented, S16 API Terms s3.1(24): bans scraping/crawling outside the APIs; s3.1(16): no modifying APIs/credentials by automated means; s2.3: test profiles created manually, not via scripts.
- Plain reading: an AI agent clicking through the Developer Portal as the logged-in member is arguably "automated methods to access the Services", which the Agreement forbids in broad terms; LinkedIn is not explicit about developer-portal use vs. scraping. Verdict: AMBIGUOUS leaning FORBIDDEN/risky for unattended agent driving (account restriction risk). Confidence: medium. Not legal advice. Safer: human performs clicks, agent only guides.
- Public docs fetching/read-only API use through official OAuth endpoints is not covered by these bans.

## 10. Surprises / does the gated hypothesis hold?

- Partly. Hypothesis holds for anything beyond sign-in and personal posting: Marketing/Community Management/Sales/Talent need vetting and partner programs; Compliance is closed (S2, S4). It does not hold for the basic OAuth case: Sign In (OIDC) and Share on LinkedIn are self-serve (S2).
- Surprises: Community Management must be the sole product on an app (S8); rejection means new app, no reapply (S6); Dev tier call caps are tiny (S4); programmatic refresh tokens restricted to partners (S3); 60-day token life; rate limits unpublished (S12); several APIs closed to new applicants (S2, S4, S5); the User Agreement bots clause (S15) clashes with agent walkthroughs.

## 11. Suggested difficulty factors

- registration_friction: account_needed (self-serve products), with Page association/verification (Documented S9); would be paid_or_business_account only for gated business APIs (legal org, business email - S6). Confidence: medium; the Page-at-creation requirement is Unverified.
- review_required: for_sensitive_scopes (self-serve OIDC/share need none; Community Management, Ads, Sales, Talent need review; Compliance closed). Evidence S2, S4, S6.
- review_depth: manual (S6 vetting, business verification, screencast, case-by-case); partnership_contract for SNAP/Talent/Audience Insights (S2, S4).
- docs_quality: partial (clear on OAuth, but rate limits unpublished, no documented Dev-tier timeline, Page requirement ambiguous, S9/S12).
- approval_wait_basis: reported for Dev tier (community estimates conflicting, S19); documented for Ads Standard upgrade (up to 30 business days, S8) and "no fixed timeline" for restricted APIs (S4). Overall: reported.
- special_requirements: [linkedin_company_page_with_super_admin_verification, registered_legal_entity_commercial_use (CM API), verified_business_email, org_website_and_privacy_policy, screencast_for_standard_tier, test_credentials_for_reviewers, sole_product_per_app (CM API), versioned_api_header (Linkedin-Version), 60_day_tokens_refresh_only_for_partners, automation_restricted_by_user_agreement]
