# LinkedIn guide verification

Verified 2026-10-29 by Claude Code (claim sampling; not exhaustive)

Guide: `content/guides/linkedin.json`. All pages below were fetched on 2026-10-29 (read-only, no login). Short names for URLs used in the table:

- QS = https://learn.microsoft.com/en-us/linkedin/marketing/quick-start?view=li-lms-2026-09
- CMR = https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review
- IA = https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access
- GA = https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
- AUTH = https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- ACF = https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
- CCF = https://learn.microsoft.com/en-us/linkedin/shared/authentication/client-credentials-flow
- PRT = https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens
- RL = https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits
- RUC = https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases
- TERMS = https://www.linkedin.com/legal/l/api-terms-of-use
- PAGE = https://www.linkedin.com/help/linkedin/answer/a543852
- ASSOC = https://www.linkedin.com/help/linkedin/answer/a548360/associate-an-app-with-a-linkedin-page?lang=en
- PV = https://www.linkedin.com/help/linkedin/answer/a6275638
- S14 = https://www.richardfu.net/linkedin-api-approval-rejected-organizational-website (third-party blog)

| # | Claim | Label | Check (URL + what was compared) | Outcome | Note |
|---|-------|-------|----------------------------------|---------|------|
| 1 | verdict.timeToCredentials: 0.5-4 h | unverified (estimate) | PAGE: no time estimates for creating a Page. QS Step 1: create Page, create app, no wait stated. | unverifiable | Our own estimate. Creating the app/Client ID has no documented wait. Fine as labelled. |
| 2 | verdict.timeToProduction: 7-28 days | reported (s14) | S14: he "submitted, and waited two weeks", then "Identity vetting failed". CMR, IA, QS, TERMS: no review timeline anywhere (IA only says restricted APIs have "no fixed timeline"). | overstated | The 2-week anecdote is real, but the docs show production is two reviews: Development tier, then Standard tier (screen recording, test credentials, valid privacy policy). The range covers only one review and one resubmission. Also a rejected app cannot reapply (see #20). |
| 3 | verdict.humanEffortHours: 4-20 h | unverified (estimate) | CMR: Standard tier needs company/product overview, use-case description, test credentials, screen recording per use case. No hours stated anywhere. | unverifiable | Estimate omits the Standard-tier screencast and test-credential work, so likely low for production. |
| 4 | steps[0].estimate "10-30 minutes" | tested (reachability only) | TERMS: no time figures. | unverifiable | Our estimate. The "tested" label covers only that the page loaded. |
| 5 | steps[1].estimate "30 minutes to 2 hours" (create Page) | tested (reachability only) | PAGE: "doesn't provide any time estimates". PV: Page verification "could take up to ten days". | unverifiable | Our estimate. Note the guide's own caveat on 10-day Page verification is real (see #14). |
| 6 | steps[2].estimate "15-45 minutes" (create app) | tested | QS Step 1.2: create developer app; no time. | unverifiable | Our estimate. |
| 7 | steps[3].estimate "30-60 minutes" (read restrictions) | tested | RUC: about 600-word page; no time stated. | unverifiable | Our estimate. Plausible. |
| 8 | steps[4].estimate "15-30 minutes" (redirect URL, secret) | tested | ACF Step 1: no time stated. | unverifiable | Our estimate. |
| 9 | steps[5].estimate "Hours to days" (build w_member_social flow) | tested | ACF / AUTH: no time stated. | unverifiable | Our estimate. |
| 10 | steps[6].estimate "2-8 hours" (review materials) | reported | CMR lists what to prepare (legal name, address, website, privacy policy, business email); no time. S14 gives no hours. | unverifiable | Our estimate. The label "reported" on the step is about the content, not the hours. |
| 11 | steps[7].estimate "30-90 minutes" (apply on Products tab) | tested | QS Step 1.4-1.5: apply under Products tab, complete access form; no time. | unverifiable | Our estimate. |
| 12 | steps[8].estimate "About 2 weeks reported; may vary" | reported (s14) | S14: "waited two weeks". CMR, IA, TERMS: no timeline. | confirmed | Matches the single anecdote and the statement that official sources give no timeline. Still a sample of one. |
| 13 | steps[9].estimate "1-4 hours" (confirm scopes, test post) | reported | IA: Development tier limits (500 calls/app/24h, 100/member/24h). No time stated. | unverifiable | Our estimate. |
| 14 | "A LinkedIn Page associated with the app" (requirements[2]) | documented (s7) | QS Step 1.1: "Create a LinkedIn Page". CMR: "Ensure a super admin of the LinkedIn Page associated with your organization has verified your application." ASSOC: "Your page super admin has 30 days to approve the request to associate an app with a LinkedIn Page." | overstated | Page is required, but the guide omits the super-admin requirement: the app must be verified by a super admin of the Page, who has 30 days to approve. Matters if the developer is not the Page super admin. |
| 15 | w_organization_social is "gated behind the 'Share on LinkedIn' product review" (scopesAndNuances[2], step 8) | reported (s14) | GA lists Share on LinkedIn as granting only `w_member_social` and as an open permission. IA lists `w_organization_social` under Community Management API (and Advertising API). S14 does say "gated behind their 'Share on LinkedIn' product review". | corrected | Official docs: w_organization_social comes with the Community Management API product (or Advertising API), which has the Development/Standard tier review. Share on LinkedIn gives w_member_social and is self-serve. The blog is wrong or outdated on the product name. |
| 16 | Company building the app must have legal authority to bind it (requirements[1]) | documented (s2) | TERMS section 1.1: "you have full legal authority to register an Application on behalf of that entity". | confirmed | Also "currently a member of LinkedIn in good standing" confirmed (requirements[0]). |
| 17 | Proof of legally registered, active organization; GitHub Pages docs site not accepted (requirements[5], verdict.businessEntityRequired) | reported (s14) | CMR: "Community Management APIs are only available to registered legal organizations for commercial use cases only." Review checks "Verified organization", "Verified organization website and domain address", "Verified business email address". "Personal email addresses won't pass the vetting process." | corrected | Official, not just reported. Upgrade to documented. Add business email (verified, not personal), organization legal name, registered address, website, privacy policy. Commercial use cases only. The GitHub Pages detail remains blog-only. |
| 18 | Most permissions beyond the open set need LinkedIn approval (scopesAndNuances[1]) | reported (s13) | GA: "Most permissions and partner programs require explicit approval from LinkedIn. Open Permissions are the only permissions that are available to all developers without special approval." | confirmed | Can be upgraded to documented. The 403 part is covered in #28. |
| 19 | Privacy policy: "Whether they are formally required is not confirmed" (requirements[6], tested.unverified) | reported (s14) | CMR: "Be prepared to share ... your organization's legal name, registered address, website, and privacy policy"; Standard tier review criterion "Valid privacy policy". | corrected | Formally required by the official review page. Documentation of posting behavior and data use is not stated as a requirement (still blog-only). |
| 20 | Step 9: "If rejected for identity vetting, fix the evidence and resubmit"; blockers[0] fix "Resubmit" | reported (s14) | CMR: "If your application is rejected, review the qualifications, create a new app, and submit a new Development tier access request form. You won't be able to re-apply for Development tier access with your existing app." | corrected | Rejection means a new app (new Client ID), not resubmission on the same app. Important for planning and for the time range. |
| 21 | Token lifetimes (guide states none) | n/a (gap) | ACF: "all access tokens are issued with a 60-day lifespan"; authorization code "has a 30-minute lifespan". PRT: "access tokens are valid for 60 days and programmatic refresh tokens are valid for a year"; ACF: "Programmatic refresh tokens are available for a limited set of partners"; PRT: "approved Marketing Developer Platform (MDP) partners". CCF: 2-legged "access token has a 30-minute lifespan". | corrected | Guide omits lifetimes. Add: 60-day access tokens, refresh tokens (365 days) only if enabled for the app, otherwise the member re-authorizes about every 60 days. |
| 22 | Open permissions are r_liteprofile, r_emailaddress, w_member_social (scopesAndNuances[0]) | documented (s3) | AUTH (last updated 2022): "Open permissions ... such as r_liteprofile, r_emailaddress, and w_member_social". GA (updated 2026-06): open permissions are `profile`, `email` (Sign in with LinkedIn using OpenID Connect) and `w_member_social` (Share on LinkedIn), "via self-service ... under the Products tab". | corrected | The cited page is stale. Current open set is profile, email (OpenID Connect) and w_member_social. r_liteprofile still appears in IA for some products. |
| 23 | Marketing APIs need 3-legged; 2-legged not available for Marketing APIs (scopesAndNuances[3]) | documented | AUTH: "Marketing APIs you must use Member Authorization". CCF: "2-legged OAuth authentication is not available for Marketing APIs". IA: all listed permissions are Member Permission (3-legged). | confirmed | |
| 24 | 2-legged not available by default; 401 "not allowed to create application tokens" means contact Relationship Manager / Business Development (scopesAndNuances[4], blockers[2]) | documented (s9) | CCF: "Your application cannot access these APIs by default." Error table: 401 access_denied "This application is not allowed to create application tokens" -> "Reach out to the LinkedIn Relationship Manager or Business Development team". | confirmed | |
| 25 | Self-Serve API Program vs Vetted API Programs (scopesAndNuances[5]) | documented (s2) | TERMS section 1.2: APIs "available to you immediately upon registration for an API key" and APIs "available only to developers that meet the applicable Vetted API Program eligibility criteria". | confirmed | The fetched summary quoted the descriptions; I did not see the exact program name in the excerpt. |
| 26 | Standard rate limits unpublished; shown in Analytics tab after one call; 429 on exceed (scopesAndNuances[6]) | documented (s6) | RL: "Standard rate limits are not published in documentation", Analytics tab "endpoints you have made at least 1 request to today(UTC)", "Rate limited requests will receive a 429 response." | confirmed | |
| 27 | Redirect URL: absolute HTTPS, no #, query params not relied on; Client Secret never in URLs (step 5, requirements[4]) | documented (s1) | ACF Step 1: add redirect URL "via HTTPS"; "URLs must be absolute"; "Parameters are ignored"; "URLs cannot include a #"; secret "do not pass it in the URL". | confirmed | |
| 28 | 403 "Not enough permissions" for unapproved scope (scopesAndNuances[1], blockers[1], step 10) | reported (s13) | ACF error table lists only 401 "Invalid scope" for the authorization endpoint. s13 (trykondo.com) not fetched in this task. | unverifiable | No official page fetched states the 403 text. Keep as reported; note the official page documents 401 Invalid scope instead. |
| 29 | Create app: "enter the app name, Company Page URL and logo; accept the API Terms if prompted" (step 3) | tested (reachability only) | QS Step 1.2 says only "Create a developer application in the Developer Portal". The create-app form page was not fetched (login needed; not visited). | unverifiable | Already flagged by the guide's own self-check. Label "tested" overstates what was observed (page reachable only). |

## Summary

- Claims checked: 29. Confirmed 8, corrected 6, overstated 2, unverifiable 13.
- Every time and effort figure was checked: timeToCredentials, humanEffortHours and the 9 step estimates other than step 9 have no primary source (they are the pipeline's own estimates). timeToProduction and the step 9 "2 weeks" rest on one third-party blog; no official page gives any review timeline.
- Not verified: the 403 "Not enough permissions" wording (third-party s13 not fetched), the create-app form fields, the exact "Self-Serve API Program" name, the Composio managed-auth claims (s15, out of scope), the blog's claim about what exactly was submitted.
- Not fetched: LinkedIn's developer portal (login or automation restrictions, per D-017).

Biggest findings:
1. w_organization_social comes with the Community Management API (or Advertising API), not "Share on LinkedIn" (which only grants w_member_social). That product has a Development tier then a Standard tier review.
2. A rejected app cannot reapply: you must create a new app and a new Development tier request. The "resubmit" guidance, time range and effort estimate are all affected.
3. The guide omits that a super admin of the Page must verify the app (30 days to approve), that business email, legal name, address, website and a privacy policy are formally required, and that access is for registered legal organizations with commercial use cases only. Token lifetimes (60-day access, refresh only for approved partners) are missing.

## Proposed corrections

```json
[
  {
    "path": "verdict.timeToProduction",
    "currentText": "One third-party developer reported a review of about two weeks, ending in a rejection. We widen the range to allow for a resubmission. Official sources state no review wait time.",
    "newText": "One third-party developer reported a review of about two weeks, ending in a rejection. Official sources state no review wait time. Production access needs two reviews (Development tier, then Standard tier with a screen recording and test credentials), and a rejected app cannot reapply: a new app and a new Development tier request are needed. Treat the range as a lower bound.",
    "newLabel": "reported",
    "reason": "CMR describes two tiers and says a rejected app must be recreated; the range covered only one review plus a resubmission."
  },
  {
    "path": "verdict.humanEffortHours",
    "currentText": "Our estimate: setting up the Page and app, writing a privacy policy, documenting posting behavior and data use, gathering proof of organization registration, filling in the access form, and handling a possible rejection and resubmission.",
    "newText": "Our estimate (no primary source gives hours): setting up the Page and app, privacy policy, organization proof and business email, the access form, the Standard tier screen recording and test credentials, and recreating the app if rejected.",
    "newLabel": "unverified",
    "reason": "Estimate omitted Standard tier work listed in the Community Management App Review page."
  },
  {
    "path": "steps[0].estimate",
    "currentText": "10-30 minutes",
    "newText": "10-30 minutes (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time; the 'tested' label covers only page reachability."
  },
  {
    "path": "steps[1].estimate",
    "currentText": "30 minutes to 2 hours",
    "newText": "30 minutes to 2 hours (our estimate; Page verification can take up to ten days)",
    "newLabel": "unverified",
    "reason": "The Page creation help article gives no time; Page verification help says up to ten days."
  },
  {
    "path": "steps[2].estimate",
    "currentText": "15-45 minutes",
    "newText": "15-45 minutes (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time."
  },
  {
    "path": "steps[3].estimate",
    "currentText": "30-60 minutes",
    "newText": "30-60 minutes (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time."
  },
  {
    "path": "steps[4].estimate",
    "currentText": "15-30 minutes",
    "newText": "15-30 minutes (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time."
  },
  {
    "path": "steps[5].estimate",
    "currentText": "Hours to days",
    "newText": "Hours to days (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time."
  },
  {
    "path": "steps[6].estimate",
    "currentText": "2-8 hours",
    "newText": "2-8 hours (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time."
  },
  {
    "path": "steps[7].estimate",
    "currentText": "30-90 minutes",
    "newText": "30-90 minutes (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time."
  },
  {
    "path": "steps[9].estimate",
    "currentText": "1-4 hours",
    "newText": "1-4 hours (our estimate)",
    "newLabel": "unverified",
    "reason": "No primary source gives a time."
  },
  {
    "path": "requirements[2]",
    "currentText": "A LinkedIn Page associated with the app.",
    "newText": "A LinkedIn Page associated with the app, and a super admin of that Page must verify the app (the super admin has 30 days to approve the association request).",
    "newLabel": "documented",
    "reason": "Community Management App Review and the 'Associate an app with a LinkedIn Page' help article name the super admin requirement; the guide omitted it. Add both URLs as sources."
  },
  {
    "path": "scopesAndNuances[2]",
    "currentText": "Posting to a Page needs w_organization_social, which one developer reported is gated behind the 'Share on LinkedIn' product review.",
    "newText": "Posting to a Page needs w_organization_social. LinkedIn's docs list it under the Community Management API (and Advertising API) products, which require an access request and review (Development tier, then Standard tier). 'Share on LinkedIn' only grants w_member_social. One developer's blog called the gate 'Share on LinkedIn'; the official docs do not.",
    "newLabel": "documented",
    "reason": "Increasing Access and Getting Access pages map the scopes to products differently from the blog."
  },
  {
    "path": "steps[7]",
    "currentText": "apply for the API product that provides w_organization_social ... A developer reported this as the 'Share on LinkedIn' product.",
    "newText": "apply for the Community Management API product (it provides w_organization_social) and complete the access form. Start with Development tier; Standard tier is a separate request with a screen recording and test credentials. Share on LinkedIn only provides w_member_social.",
    "newLabel": "documented",
    "reason": "Quick Start and Community Management App Review point to the Community Management API product."
  },
  {
    "path": "requirements[5]",
    "currentText": "Proof of a legally registered, active organization, such as an organizational website. A GitHub Pages docs site was reportedly not accepted.",
    "newText": "Community Management APIs are only available to registered legal organizations for commercial use cases. LinkedIn reviews approved use case, verified business email (personal addresses fail), verified organization, verified organization website and domain, and Page-verified app. Share the legal name, registered address, website and privacy policy. A GitHub Pages docs site was reportedly not accepted (blog only).",
    "newLabel": "documented",
    "reason": "Community Management App Review states these requirements officially."
  },
  {
    "path": "requirements[6]",
    "currentText": "A privacy policy, plus documentation of what the app posts, how often and what data it touches. ... Whether they are formally required is not confirmed.",
    "newText": "A privacy policy is required (the access request asks for it and Standard tier review checks for a valid one). Documentation of posting behavior and data use is what one developer wrote; LinkedIn does not list it as a requirement.",
    "newLabel": "documented",
    "reason": "Community Management App Review lists privacy policy explicitly."
  },
  {
    "path": "steps[8].detail",
    "currentText": "One developer reported a wait of about two weeks. Official sources give no timeline. If rejected for identity vetting, fix the evidence and resubmit.",
    "newText": "One developer reported a wait of about two weeks. Official sources give no timeline. If rejected, LinkedIn says to review the qualifications, create a new app and submit a new Development tier request; you cannot reapply with the same app.",
    "newLabel": "documented",
    "reason": "Community Management App Review states rejected apps cannot reapply."
  },
  {
    "path": "blockers[0].fix",
    "currentText": "Resubmit with an organizational website and evidence that show a legally registered, active organization. A GitHub Pages docs site was not accepted.",
    "newText": "Fix the evidence (organization website and domain, business email, legal name and address), then create a new app and submit a new Development tier request; the rejected app cannot reapply. A GitHub Pages docs site was not accepted (blog only).",
    "newLabel": "documented",
    "reason": "Community Management App Review."
  },
  {
    "path": "scopesAndNuances[0]",
    "currentText": "Open permissions available to all apps are r_liteprofile, r_emailaddress and w_member_social, all via 3-legged OAuth.",
    "newText": "Open permissions available to all apps are profile and email (Sign in with LinkedIn using OpenID Connect) and w_member_social (Share on LinkedIn), all via 3-legged OAuth and added self-service on the Products tab. Older pages still name r_liteprofile and r_emailaddress.",
    "newLabel": "documented",
    "reason": "Getting Access (updated 2026-06) lists the current open set; the cited OAuth overview dates from 2022."
  },
  {
    "path": "scopesAndNuances[1]",
    "currentText": "Almost everything beyond the open set, including company page data, typically needs LinkedIn approval. Requesting an unapproved scope gives a 403 'Not enough permissions' error.",
    "newText": "Everything beyond the open set needs LinkedIn approval (documented). Requesting an unapproved scope gives a 403 'Not enough permissions' error (reported by a third-party blog; LinkedIn's OAuth page documents a 401 'Invalid scope' for the authorization endpoint).",
    "newLabel": "documented",
    "reason": "Getting Access confirms the approval claim; the 403 wording has no fetched official source."
  },
  {
    "path": "scopesAndNuances[+new]",
    "currentText": "",
    "newText": "Token lifetimes: authorization codes last 30 minutes. Access tokens last 60 days (3-legged). Programmatic refresh tokens last 365 days but are only available to approved partners / apps where enabled; otherwise the member must re-authorize. 2-legged tokens last 30 minutes.",
    "newLabel": "documented",
    "reason": "Authorization Code Flow, Programmatic Refresh Tokens and Client Credentials Flow pages state these values; the guide had none."
  },
  {
    "path": "steps[2].evidence",
    "currentText": "tested (reachability only) for 'Click Create app and enter the app name, Company Page URL and logo'",
    "newText": "Click Create app in the Developer Portal. The exact form fields are not described in the sources we read.",
    "newLabel": "unverified",
    "reason": "Quick Start says only 'Create a developer application'; the form fields are not documented in fetched pages."
  }
]
```

## Corrections applied (2026-10-29)
Applied to `content/guides/linkedin.json` with changelog lines (new official sources s16 to s20 added): time to production and effort now include the second (Standard tier) review and that a rejected app cannot reapply; all step time ranges marked as our estimates; the Page super-admin, legal-organization and privacy-policy requirements now cite LinkedIn's review page; `w_organization_social` is attributed to the Community Management API, not "Share on LinkedIn"; the open-permissions list and token lifetimes were updated; step 3 no longer lists form fields that no source describes. **Not checked in this pass:** the 403 "Not enough permissions" wording (third-party source only), the create-app form fields (the Developer Portal needs a login and no walkthrough was run), and the Composio managed-auth claims.
