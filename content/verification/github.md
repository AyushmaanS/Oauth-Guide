# GitHub OAuth app guide: claim verification

Verified 2026-10-29 by Claude Code (claim sampling; not exhaustive)

URLs fetched in this task (A-F):
A = https://docs.github.com/en/apps/oauth-apps/using-oauth-apps/authorizing-oauth-apps
B = https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions
C = https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/rate-limits-for-oauth-apps
D = https://docs.github.com/rest/using-the-rest-api/rate-limits-for-the-rest-api
E = https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authenticating-to-the-rest-api-with-an-oauth-app
F = https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
G = https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
Log = content/attempts/github.json

| # | Claim | Label | Check (URL + what was compared) | Outcome | Note |
|---|-------|-------|---------------------------------|---------|------|
| 1 | verdict.timeToCredentials 0.25-2 h | unverified (estimate) | A, E, G, F: looked for any stated registration time or review. None states a duration; G lists the form steps and mentions no review, fee or wait. | unverifiable | Already labelled unverified. Log gh-1..gh-3 shows about 4 min of form work on a signed-in account, consistent with the low end only. |
| 2 | verdict.timeToProduction: none | documented (s3, s6) | B, E, G: searched for review/approval before production use. None is mentioned for registering or using an OAuth app. B says orgs with restrictions need owner approval. | overstated | "None" rests on absence of text, and B shows a per-org approval gate with no stated timeline. Not a GitHub review, but not "none" for org access. Downgrade to unverified or reword. |
| 3 | verdict.humanEffortHours 2-16 | unverified (estimate) | A, F, B: no source states developer effort. | unverifiable | Already labelled unverified. |
| 4 | Step 1 estimate "15-60 minutes" | none (range) | F: no time figure for choosing between OAuth app and GitHub App. | unverifiable | Pure estimate; text should say so. |
| 5 | Step 5 estimate "2-8 hours" | none (range) | F: only protocol timers (code expires in 10 min, device code 15 min), no implementation effort. | unverifiable | Pure estimate. |
| 6 | Step 6 estimate "Depends on each org owner"; "GitHub's docs do not give a timeline" | documented | B: owners are alerted to pending requests; no approval timeline stated. | confirmed | |
| 7 | Step 7 estimate "1-4 hours" | unverified | No source. | unverifiable | Already labelled unverified. |
| 8 | Steps 2, 3, 4 estimates (1, 3, 1 min "approximate, one walkthrough") | tested | Log: gh-1 minutes 1; gh-2 (1) + gh-3 (2) = 3; gh-4 minutes 1. | confirmed | Matches the log; wording "approximate, one walkthrough" is fair. |
| 9 | Verified email needed to authorize an app | documented | A: "You must verify your email address before you can authorize an OAuth app." | confirmed | Applies to users authorizing the app, as the guide says. Step 2 "tested" label cites gh-1, but the log says email verification was not checked, so that part is documented only. |
| 10 | Ten tokens per user/app/scope; ten tokens created per hour | documented | A: "limit of ten tokens ... per user/application/scope combination"; "rate limit of ten tokens created per hour". F repeats the hourly limit. C mentions a ten sign-in limit and the ten token limit. | confirmed | Over-limit behaviour (older tokens revoked / re-auth) not separately read. |
| 11 | OAuth apps limited to 2,000 access token requests/hour; lower, non-scaling limits vs GitHub Apps | documented | C: "OAuth apps are subject to a rate limit of 2,000 access token requests per hour"; "lower rate limits and do not scale". | confirmed | |
| 12 | Calls count toward user's 5,000/h; 15,000/h for members of an Enterprise Cloud org that owns or approves the app | documented | D: "personal rate limit of 5,000 requests per hour"; 15,000 if requests are made by an OAuth app "owned or approved by a GitHub Enterprise Cloud organization" and you are a member. | confirmed | D does not say the membership org must be the same org that owns/approves. |
| 13 | Source code access cannot be scoped read-only | documented | A: "Currently, you can't scope source code access to read-only." | confirmed | |
| 14 | Token limited by user's access (admin:org example) | documented | A: app with admin:org scope is not granted admin access if user is not an owner. | confirmed | |
| 15 | New orgs have access restrictions on by default | documented | B: "When you create a new organization, OAuth app access restrictions are enabled by default." | confirmed | Orgs with no restrictions letting any member-authorized app in was not re-read on this page extract. |
| 16 | On enabling restrictions apps lose access; private-repo webhooks stop for unapproved apps | documented | B: apps "immediately lose access"; "Hook deliveries from private organization repositories will no longer be sent to unapproved OAuth apps." | confirmed | |
| 17 | Members request owner approval; owners notified; privileged apps still authorizable | documented | B: "Users can request owner approval"; owners alerted; users "can still authorize privileged OAuth apps". | confirmed | |
| 18 | Web flow, device flow, implicit grant not supported; offline_access opts in to 8-hour tokens with refresh tokens | documented (step 5) | F: "implicit grant type is not supported"; device flow for headless apps; "access token expires after eight hours, and the refresh token expires after six months without use"; offline_access requested with other scopes. | confirmed | |
| 19 | Tested: registration form shows 'Redirect URIs' (up to 10, wildcard); 'Authorization callback URL' label not shown; "corrects the documentation" | tested (gh-2) | Log gh-2 supports the field list. G: "You can enter up to 10 callback URLs" and calls the field "Authorization callback URL"; E says callback ownership prevents token leakage. | confirmed | Log supports the wording. Docs differ only in label (G still says "Authorization callback URL"); the security rationale in E is not contradicted, so "corrects" applies to the label only. |
| 20 | Tested: 'Expire user access tokens' ticked by default, "corrects the documentation" | tested (gh-2) | Log gh-2 supports ticked by default. G: "Expire user access tokens is enabled by default." F states the 8h/6mo lifetimes. | overstated | Docs already say it is on by default, so it is not a correction. The guide's removal of the 8h/6mo figures dropped documented facts (F) not contradicted by the walkthrough, and "which provides refresh tokens" is an inference, not observed. |
| 21 | Tested: Client ID shown at once; secret only after 'Generate a new client secret'; "corrects the documentation" | tested (gh-4; observationRef says gh-2) | Log gh-4 supports it. E: "Every registered OAuth app is assigned a unique Client ID and Client Secret." | confirmed | Real nuance, but observationRef should be gh-4 and sourceIds is empty (should include s6). |
| 22 | Step 1 labelled "tested" | tested | Its testNote says only that a page was reachable (probe). Log has no step for it. | overstated | Reachability of a docs page is not a test of the decision content; label should be documented. |
| 23 | requirements[3]: no business entity, payment or review described | documented | G, E: "doesn't mention any of these"; Log gh-3: "No terms to accept, no payment, no review step appeared." | confirmed | Supported as absence of mention plus one walkthrough on a free account; not proof that none exists. |
| 24 | Composio managed GitHub OAuth available | documented | Not fetched (third-party to GitHub scope of this check). | unverifiable | Outside the sampled primary sources. |

## Summary

- Claims checked: 24 (rows 8, 9 etc. bundle related items).
- confirmed: 15 (rows 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23)
- corrected: 0
- overstated: 3 (rows 2, 20, 22)
- unverifiable: 6 (rows 1, 3, 4, 5, 7, 24)
- Could not verify: all time/effort estimates (timeToCredentials, humanEffortHours, step estimates for steps 1, 5, 7) have no primary source; the Composio managed-auth claim was not fetched; the offline_access scope and the over-limit revoke behaviour were not tested; Marketplace review timing (community post) not checked.

## Proposed corrections

```json
[
  {"path": "verdict.timeToProduction", "currentText": "none (documented, s3, s6)", "newText": "No GitHub review is described for registering or using an OAuth app, but organizations with access restrictions need owner approval and GitHub gives no timeline.", "newLabel": "unverified", "reason": "'None' rests on absence of text; org approval is a gating step with unknown duration."},
  {"path": "steps[0].estimate", "currentText": "15-60 minutes", "newText": "15-60 minutes (our estimate; no source states this)", "newLabel": "unverified", "reason": "No primary source gives a time for this step."},
  {"path": "steps[4].estimate", "currentText": "2-8 hours", "newText": "2-8 hours (our estimate; no source states this)", "newLabel": "unverified", "reason": "Docs give only protocol timers, not implementation effort."},
  {"path": "steps[6].estimate", "currentText": "1-4 hours", "newText": "1-4 hours (our estimate; no source states this)", "newLabel": "unverified", "reason": "No source."},
  {"path": "steps[0].evidence", "currentText": "tested (reachability only)", "newText": "Documented: GitHub recommends considering a GitHub App; the page was reachable without sign-in.", "newLabel": "documented", "reason": "A page being reachable is not a test of the decision content."},
  {"path": "scopesAndNuances[5]", "currentText": "The registration form has 'Expire user access tokens' ticked by default, which provides refresh tokens. The offline_access scope was not tested. (Docs said: ...)", "newText": "The registration form has 'Expire user access tokens' ticked by default (observed; GitHub's creating-an-OAuth-app page says the same). Expiring tokens last eight hours with a refresh token that expires after six months without use, and offline_access opts in per sign-in (documented; not tested).", "newLabel": "documented", "reason": "Docs already say expiry is on by default, so this is not a correction; the documented 8h/6mo facts are not contradicted by the walkthrough."},
  {"path": "scopesAndNuances[8].evidence", "currentText": "sourceIds [] ; observationRef gh-2", "newText": "sourceIds [\"s6\"]; observationRef gh-4", "newLabel": "documented", "reason": "The log observation supporting this claim is gh-4, and it should cite its source."},
  {"path": "steps[1].evidence", "currentText": "tested (gh-1) for verified email", "newText": "Signed in without extra prompts (tested); the verified-email requirement for authorizing users is documented only, as the log did not check email verification.", "newLabel": "documented", "reason": "gh-1 did not check email verification."},
  {"path": "managedVsOwn.managedCovers[0]", "currentText": "Composio's managed-auth directory lists GitHub ...", "newText": "unchanged text; not checked against the Composio directory in this pass", "newLabel": "unverified", "reason": "Not fetched in this verification."}
]
```

## Corrections applied (2026-10-29)
Applied to `content/guides/github.json` with changelog lines: time to production downgraded to unverified; step 1, 5 and 7 time ranges marked as our estimates; step 1 changed from tested to documented; token-expiry claim reworded and re-labelled documented; client-secret note now cites the walkthrough step gh-4 and source s6; step 2's tested note scoped. **Not applied:** the Composio managed-auth entry (computed by code from Composio's public directory, not a documentation claim; not re-checked in this pass).
