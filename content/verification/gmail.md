# Gmail guide verification

Verified 2026-10-29 by Claude Code (claim sampling; not exhaustive)

Pages fetched in this task (all official Google pages):
- A = https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification
- B = https://support.google.com/cloud/answer/7454865?hl=en
- C = https://developers.google.com/workspace/guides/configure-oauth-consent
- D = https://developers.google.com/workspace/marketplace/about-app-review
- E = https://developers.google.com/workspace/gmail/api/auth/scopes
- F = https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- G = https://support.google.com/cloud/answer/13463073?hl=en (no timelines or cost found)
- H = https://appdefensealliance.dev/casa (no duration or cost found)

| # | Claim | Label | Check (URL + what was compared) | Outcome | Note |
|---|---|---|---|---|---|
| 1 | verdict.timeToCredentials: 1-4 hours | unverified (estimate) | A, B, C, G: no page gives a duration for project, consent screen and client setup. Attempt log: gm-1 to gm-6 record only 1+6+1 min of agent time, and owner-timed steps (2FA, wizard) have no minutes. | unverifiable | Correctly labelled as our estimate. No change. |
| 2 | verdict.timeToProduction: 28-120 days; says Google "gives no number" | unverified (estimate) | A: "the restricted scopes verification process can potentially take several weeks to complete". B: "verification might require several months". A/H: no assessment duration. | overstated | Basis text says Google gives no number; page A does say "several weeks" for restricted-scope review, and B says "several months". The 4-12 week assessment figure has no source. Keep as unverified estimate but cite both Google phrases. |
| 3 | verdict.humanEffortHours: 16-80 hours | unverified (estimate) | A, B, C, G: no effort figures anywhere. | unverifiable | Correctly labelled. No change. |
| 4 | steps[0].estimate "10-30 minutes" (step 1) | tested (evidence) | Attempt log gm-1/gm-2: no minutes recorded; 2FA enablement by owner, time unknown. | unverifiable | Estimate not backed by the log. The observation (2FA required) is supported, the duration is not. |
| 5 | steps[1].estimate "30-90 minutes" (step 2) | tested (evidence) | Log gm-3: no minutes; owner finished the wizard off-screen. C: wizard steps match (App info, Audience, Contact, Finish). | unverifiable | Wizard structure confirmed by C and gm-3; duration unsourced. |
| 6 | steps[2].estimate "7 min (approximate, one walkthrough)" | tested | Log gm-4 minutes 1 + gm-5 minutes 6 = 7. | confirmed | Matches log. Note it excludes adding test users (none were added) so it is a lower bound for the whole step. |
| 7 | steps[3].estimate "1 min (approximate, one walkthrough)" | tested | Log gm-6 minutes 1: only opened the form; no client created. | overstated | The step title is "Create a Web application OAuth client" but the 1 min was only opening the form. Say so. |
| 8 | steps[5].estimate "1-3 days" (prepare materials) | tested (reachability only) | A: no duration for preparation. Log has no entry (only a page GET in probe). | unverifiable | Label "tested" only means the page was reachable; downgrade. |
| 9 | steps[6].estimate "1-3 hours" (submit verification) | tested (reachability only) | B/A: no submission-time figure. | unverifiable | Same: downgrade label. |
| 10 | steps[7].estimate "Weeks to several months" (Google review) | documented | A: "can potentially take several weeks"; B: "might require several months". | confirmed | Both ends are quoted by Google. |
| 11 | steps[8].estimate "Likely 4-12+ weeks" (security assessment) | tested (reachability only) | A and H: assessment required; no duration or cost stated anywhere fetched. | unverifiable | Label "tested" is misleading; downgrade to unverified. |
| 12 | steps[9].estimate "1-2 hours" (go to production) | documented | B/C: nothing on the time to publish. | unverifiable | Downgrade to unverified. |
| 13 | steps[4].estimate "Days to weeks" (build and test) | documented | No source gives a figure. | unverifiable | Downgrade to unverified. |
| 14 | Annual security assessment by Google-approved third party if restricted data is accessed from or through a third-party server | documented | A: apps with ability to access restricted data "from or through a third-party server must go through a security assessment"; reassessment "at least every 12 months". | confirmed | Matches guide wording. |
| 15 | Restricted-scope verification is required (with Additional requirements of User Data Policy) | documented | A: restricted scopes "require you to go through a scope verification process before you request the scopes"; must satisfy the "Additional requirements for specific API scopes". | confirmed | |
| 16 | Unverified apps are limited to 100 new users; unverified-app screen | documented | B: "100 new users in total, after the app presents the unverified app screen", "limited to 100 new users until it is verified". | confirmed | B does not say "lifetime"; the lifetime wording comes from the console observation gm-4 (Testing status), which is a console statement, not from B. |
| 17 | Scopes reclassified with grace period and notice | documented | B: affected apps "will be given a grace period to go through verification before the unverified app screen and user cap are applied". | confirmed | The "email notice" part was not seen in the fetched text; minor. |
| 18 | Mismatch between code and consent-screen scopes shows unverified screen | documented | B: "Make sure that scopes you request in your app are the same as what's in your OAuth consent screen." | confirmed | |
| 19 | Agree to API Services User Data Policy during consent setup | documented (weak) | C: under Finish, "I agree to the Google API Services: User Data Policy". | confirmed | |
| 20 | Scopes must be listed for apps used outside your Workspace org; add test users for External | documented | C: "you only need to list scopes for apps used by people outside your Google Workspace organization"; "If you selected External ... add test users". | confirmed | |
| 21 | Marketplace review typically takes several days; incomplete OAuth verification is a rejection reason | documented | D: "App review typically takes several days."; "The app didn't complete the OAuth verification." | confirmed | |
| 22 | Which Gmail scopes are restricted (guide: "the sources do not say", now "gmail.readonly was listed under restricted") | tested | E table: gmail.readonly Restricted; gmail.modify, gmail.compose, gmail.metadata, gmail.insert, mail.google.com Restricted; gmail.send Sensitive; gmail.labels Non-sensitive. Log gm-5 supports gmail.readonly. | corrected | The guide still lists "Which exact Gmail scopes are classified as restricted" as unverified, and the use case says "restricted Gmail scopes" including send. Per E, gmail.send alone is sensitive, not restricted, so read access (readonly/modify) is what triggers the security assessment. Important for the developer decision. |
| 23 | Requirement 1: 2-step verification needed before project creation (observationRef gm-5) | tested | Log gm-1 supports the observation. | overstated | Wording is supported by gm-1, but observationRef points to gm-5 (scopes); should be gm-1. Also the log says Cloud showed "access blocked", which may be account-specific. |
| 24 | Whether a registered legal entity is required | unverified | F: no business-entity requirement stated (only internal apps must be owned by an organization). G: nothing. | unverifiable | Correctly unverified; F is weak evidence of no stated entity requirement but not a statement. |
| 25 | Step 3 testNote: "cap of 100 users counted over the app's lifetime", publish disabled until Branding complete | tested | Log gm-4 contains exactly this text. | confirmed | Log supports it. It describes the Testing-status cap; B describes the unverified-app cap. Two caps may be conflated in the narrative. |

## Summary

- Claims checked: 25
- Counts: confirmed 11 (rows 6, 10, 14-21, 25), corrected 1 (row 22), overstated 3 (rows 2, 7, 23), unverifiable 10 (rows 1, 3, 4, 5, 8, 9, 11, 12, 13, 24)
- Could not verify: all effort and duration estimates except step 8 (Google review range) and the walkthrough timings; the security-assessment duration, cost and vendors (A and H state none); the legal-entity requirement; the "email notice" detail in row 17; the exceptions list in scopesAndNuances[0] was not specifically checked.

## Proposed corrections

```json
[
  {
    "path": "verdict.timeToProduction.basis",
    "currentText": "Our estimate: a security assessment class is typically four to twelve weeks or more. Google's help page says verification may take several months depending on data sensitivity but gives no number.",
    "newText": "Our estimate (unverified): Google's restricted-scope page says verification \"can potentially take several weeks\" and its unverified-apps page says \"several months\" depending on data sensitivity. Neither gives a duration for the third-party security assessment; the four-to-twelve-week figure is not sourced.",
    "newLabel": "unverified",
    "reason": "Basis said Google gives no number, but Google gives qualitative ranges (several weeks; several months). Assessment duration remains unsourced."
  },
  {
    "path": "steps[0].estimate",
    "currentText": "10–30 minutes",
    "newText": "10–30 minutes (unverified estimate; the walkthrough did not time this step)",
    "newLabel": "unverified",
    "reason": "Log gm-1/gm-2 record no minutes."
  },
  {
    "path": "steps[1].estimate",
    "currentText": "30–90 minutes",
    "newText": "30–90 minutes (unverified estimate; the owner finished the wizard off-screen)",
    "newLabel": "unverified",
    "reason": "Log gm-3 records no minutes."
  },
  {
    "path": "steps[3].estimate",
    "currentText": "1 min (approximate, one walkthrough)",
    "newText": "1 min to open the create-client form (approximate, one walkthrough); no client was created, so the full step was not timed",
    "newLabel": "unverified",
    "reason": "Log gm-6 only opened the form."
  },
  {
    "path": "steps[4].estimate",
    "currentText": "Days to weeks",
    "newText": "Days to weeks (unverified estimate)",
    "newLabel": "unverified",
    "reason": "No source gives a figure."
  },
  {
    "path": "steps[5].estimate",
    "currentText": "1–3 days",
    "newText": "1–3 days (unverified estimate; label was based only on page reachability)",
    "newLabel": "unverified",
    "reason": "Evidence label 'tested' only reflects a GET of the page."
  },
  {
    "path": "steps[6].estimate",
    "currentText": "1–3 hours",
    "newText": "1–3 hours (unverified estimate; label was based only on page reachability)",
    "newLabel": "unverified",
    "reason": "Evidence label 'tested' only reflects a GET of the page."
  },
  {
    "path": "steps[8].estimate",
    "currentText": "Likely 4–12+ weeks",
    "newText": "Likely 4–12+ weeks (unverified estimate; Google and the App Defense Alliance pages fetched state no duration)",
    "newLabel": "unverified",
    "reason": "No primary source gives the assessment duration; label 'tested' was reachability only."
  },
  {
    "path": "steps[9].estimate",
    "currentText": "1–2 hours",
    "newText": "1–2 hours (unverified estimate)",
    "newLabel": "unverified",
    "reason": "No source gives a figure; currently labelled documented."
  },
  {
    "path": "scopesAndNuances[6]",
    "currentText": "In the console, gmail.readonly was listed under 'restricted scopes' when declared on 2026-10-29. The scope picker only lists scopes of enabled APIs, so scopes may need to be pasted.",
    "newText": "Google's Gmail scopes page classifies gmail.readonly, gmail.modify, gmail.compose, gmail.metadata, gmail.insert and mail.google.com as restricted; gmail.send is sensitive (not restricted) and gmail.labels is non-sensitive. The console listed gmail.readonly under 'restricted scopes' on 2026-10-29. The scope picker only lists scopes of enabled APIs, so scopes may need to be pasted.",
    "newLabel": "documented",
    "reason": "Official scope table found; also shows send-only access is sensitive, which affects whether the security assessment applies. The 'Which exact Gmail scopes are restricted' item under tested.unverified can be removed."
  },
  {
    "path": "verdict.useCase",
    "currentText": "An AI agent (hosted SaaS/server-side) that reads and sends Gmail on behalf of other customers' Google accounts, using restricted Gmail scopes",
    "newText": "An AI agent (hosted SaaS/server-side) that reads and sends Gmail on behalf of other customers' Google accounts. Reading uses restricted scopes (e.g. gmail.readonly, gmail.modify); gmail.send alone is only sensitive.",
    "newLabel": "documented",
    "reason": "Google's scope table classifies gmail.send as sensitive, not restricted."
  },
  {
    "path": "requirements[0].evidence.observationRef",
    "currentText": "gm-5",
    "newText": "gm-1",
    "newLabel": "documented",
    "reason": "The 2-step-verification observation is gm-1, not gm-5 (scopes). Label in the guide stays 'tested'; only the reference is wrong."
  }
]
```

## Corrections applied (2026-10-29)
Applied to `content/guides/gmail.json` with changelog lines: time-to-production basis; every step time range marked as an unverified estimate (step 4's walkthrough time withdrawn because no client was created); steps 6, 7 and 9 changed from tested to documented; the restricted-scope list now cites Google's Gmail scopes page (added as source s15) and states that gmail.send alone is only sensitive; the use-case wording; the wrong walkthrough reference on the 2-step-verification requirement (now gm-1). **Not checked in this pass:** the exceptions list in the verification-exemptions claim, the "email notice" detail for scope reclassification, any duration or cost for the security assessment, and whether a legal business entity is required.
