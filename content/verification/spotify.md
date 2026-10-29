# Spotify guide verification

Verified 2026-10-29 by Claude Code (claim sampling; not exhaustive)

Pages fetched this task (all public): Q = https://developer.spotify.com/documentation/web-api/concepts/quota-modes ; B = https://developer.spotify.com/blog/2026-07-23-web-api-quota-updates ; R = https://developer.spotify.com/documentation/web-api/concepts/redirect_uri ; O = https://developer.spotify.com/documentation/open-access/concepts ; A = https://developer.spotify.com/documentation/web-api/concepts/apps ; G = https://developer.spotify.com/documentation/web-api/tutorials/getting-started ; RL = https://developer.spotify.com/documentation/web-api/concepts/rate-limits . Attempts log: content/attempts/spotify.json.

Note: WebFetch returns a model-summarised extraction, so quotes are as returned by that tool, not raw HTML.

| # | Claim | Label | Check (URL + what was compared) | Outcome | Note |
|---|-------|-------|------|---------|------|
| 1 | verdict.timeToCredentials 0.25-2 h | unverified | A and G: no statement of how long app creation takes (G: "No statement found"). | unverifiable | Honestly labelled unverified. Plausible, no source. |
| 2 | verdict.timeToProduction 7-28 days; "no source states a turnaround time" | unverified | Q: "This review process can take up to six weeks." | corrected | A turnaround IS documented: up to six weeks (42 days). The 28-day max is below the documented ceiling; "no source states" is false. |
| 3 | verdict.humanEffortHours 3-10 h | unverified | A, G, Q: no effort figures anywhere. | unverifiable | Remains an estimate, labelled correctly. |
| 4 | Step 1 estimate "5-30 minutes" | none (estimate) | A, G: no timing stated. | unverifiable | Estimate; sp-1 log has no durations either. |
| 5 | Step 2 "20-60 minutes" | estimate | No source timing. | unverifiable | Estimate. |
| 6 | Step 3 "10-30 minutes" | estimate | A: lists steps only, no time ("The page doesn't state how long creating an app takes"). | unverifiable | Log has no durations. |
| 7 | Steps 4-8 estimates (10-20 min, 2-6 h, 30-60 min, 1-3 h, 1-3 h) | estimate | No source gives any. | unverifiable | Present as estimates only. |
| 8 | Step 9 "1-4 weeks (our estimate)"; "No source states a turnaround time" | unverified | Q: "This review process can take up to six weeks." | corrected | Documented: up to six weeks. Range should be "up to 6 weeks". |
| 9 | Up to 25 Client IDs per developer account (raised from 1) | documented | A: "You can create up to 25 apps per developer account." B: "Client ID limit increased from 1 to 25" per developer account. Q does not mention it. | confirmed | Source s9 (blog) and s4 (Apps) both support it. |
| 10 | Dev Mode quota counted per developer account, not per Client ID; apps share one budget | documented | B: quota "counted per developer account"; "Previously... counted per app." Q: quota "limits the number of requests made through development mode apps that belong to a single developer account." | confirmed | |
| 11 | 429 body has "reason": "QUOTA_EXCEEDED"; rate-limit 429s do not carry it | documented | Q: 429 with `"reason": "QUOTA_EXCEEDED"` on quota exceeded. B: same, "distinguishes them from rate limits". RL: no reason field documented for rate limits. | confirmed | The "rate-limit 429s do not carry this reason" half is inferred from RL not documenting a field; reasonable. Guide self-check flagged this as weak though it is supported by s1/s9. |
| 12 | Premium required for Dev Mode (guide: "Spotify's docs say Premium is needed"; tested label on free-account observation) | tested | Q: "The app owner must have a Spotify Premium account for apps in development mode to function." G: tutorial assumes Premium. A: no mention. Log sp-2: Web API checkbox greyed out + Premium banner on free account. | confirmed | Observation is supported by sp-2. But the guide's checklist lists this under neither documented nor requirements; add as documented requirement. |
| 13 | Dev Mode user limit unknown ("sources do not describe user limits"; blocker labelled unverified) | unverified | Q: "Up to 5 authenticated Spotify users can use an app that is in development mode"; each user must be on the allowlist. A: "limits on the number of users who can install it". | corrected | This is documented, not unknown. Guide claims Dev Mode limits are not described. |
| 14 | Extended quota requires an application/review; whether it exists is unknown (step 8, checkFirst, reviewRequired inferred) | unverified | Q: extended quota mode is applied for; "This review process can take up to six weeks"; evaluates compliance with Developer Policy. | corrected | Existence of review is documented. |
| 15 | Business entity not required / "no source states" (businessEntityRequired: "no") | unverified | Q: "Spotify only accepts applications from organizations (not individuals)." Applicants must be a legally registered business or organization. | corrected | For extended quota an organization IS required. For Dev Mode registration none is required (A, G silent). The "no" is wrong for production use. |
| 16 | 250k MAU threshold for extended quota (not in guide) | absent | Q: lists "at least 250k MAUs" as a minimum. | corrected | Guide omits this key go/no-go fact. Add it. |
| 17 | Redirect URI rules: loopback accepted; "plain localhost is rejected" (sp-4) | tested | R: "`localhost` is not allowed as redirect URI."; loopback IP literals via `http://127.0.0.1:PORT` / `http://[::1]:PORT`; HTTPS required otherwise. Log sp-4: 127.0.0.1:3000/callback accepted; localhost not tested. | confirmed | Tested claim (loopback accepted) supported by sp-4; wording correctly says localhost rejection is docs-only. However guide step 4 detail and `tested.unverified` say redirect URI rules are unknown, which is now documented via R. Step 4 agentPrep ("https where it is not local") is consistent. |
| 18 | Open Access: separate partner API, approved partners only, Client IDs allow-listed by Partner Management | documented | O: "available only for approved partners"; "must be allow-listed by the Spotify Partner Management team". | confirmed | "Separate / does not apply to Web API agent" is the guide's interpretation; fine, hedged ("not clearly"). |
| 19 | Keep Client Secret out of browsers/client software | documented | O: secret "should not be shared with users, browsers or client software." A: "Always store the client secret key securely". | confirmed | |
| 20 | Step 1 "tested" (sp-1) | tested | Log sp-1: login redirect, Developer Terms checkbox, verify email before Create app; owner did all three. | confirmed | Supported. Detail "captured sources do not detail account verification steps" is now outdated but harmless. Outcome in log is stopped_human_required, not completed. |
| 21 | Step 3 "tested" (sp-2, sp-3); "Creating a Client ID also generates a Client Secret" | tested | Log sp-2/sp-3: app created in Dev mode; secret behind "View client secret", NOT viewed. A: "Client Secret, the key you will use to authorize..." | overstated | Created app and Dev mode are observed. But the secret's existence was only seen as a hidden button and steps title "obtain Client ID and Secret": the secret was never obtained. Label tested covers only app creation, Client ID. |
| 22 | Dev mode, 180-day refresh token lifetime | tested | Log sp-3 states it. No fetched doc mentions 180 days (not checked beyond Q/A/G). | confirmed | Supported by log only. |
| 23 | Step 2 labelled "tested" (read Apps and Quota docs) | tested | Guide testNote itself: "Only reachability was observed" (probe HTTP 200, no sp-* step). Log has no step for it. | overstated | Reachability is not a walkthrough observation. Downgrade to documented (Q is a fetched, readable page). |
| 24 | Step 5 labelled "tested" (Authorization Code flow) | tested | Same: reachability only; log steps sp-1..5 do not cover it; stoppedAt says steps 5-9 not attempted. | overstated | Contradicts the guide's own attemptLevelReason. Downgrade to documented. |
| 25 | Step 6 labelled "tested" (scopes) | tested | Same: reachability only; steps 5-9 not attempted. | overstated | Downgrade to documented. Same for handoff.agentCanDo entries for steps 2, 5, 6. |
| 26 | OAuth metadata (3 scopes, PKCE S256, no registration endpoint) labelled tested | tested | Not fetched by me (accounts.spotify.com well-known not in scope this run); guide cites a read on 2026-10-29. | unverifiable | Not independently checked. |
| 27 | Step 4 "tested" with empty sourceIds | tested | Log sp-4 supports loopback accepted. | confirmed | Fine; add source R. |

## Summary

Counts (27 rows): confirmed = 9, 10, 11, 12, 17, 18, 19, 20, 22, 27 (10); corrected = 2, 8, 13, 14, 15, 16 (6); overstated = 21, 23, 24, 25 (4); unverifiable = 1, 3, 4, 5, 6, 7, 26 (7). Total 27.

Could not verify: all per-step time estimates and the three verdict figures (no source gives times for app creation or effort); the 180-day refresh token lifetime and everything under the sp-* log beyond the log itself (I did not log in); the OAuth metadata (row 26); the Android auth-lib claim, Composio managed-auth claim, and Developer Terms/agent-driving ambiguity (not sampled). The Premium doc statement appears in Q and G, not in A or B.

## Proposed corrections

```json
[
  {
    "path": "verdict.timeToProduction",
    "currentText": "minDays 7, maxDays 28; basis: no source states a turnaround time",
    "newText": "Extended quota review can take up to six weeks (Quota modes docs); applications accepted only from organizations with at least 250k MAUs. Set maxDays to 42; keep minDays as an estimate.",
    "newLabel": "documented",
    "reason": "Q states 'This review process can take up to six weeks.' The 28-day cap is below the documented ceiling."
  },
  {
    "path": "steps[8].estimate / steps[8].detail",
    "currentText": "1-4 weeks (our estimate) / No source states a turnaround time.",
    "newText": "Up to 6 weeks (Spotify quota-modes docs).",
    "newLabel": "documented",
    "reason": "Q documents the review length."
  },
  {
    "path": "steps[7].detail",
    "currentText": "The sources do not say whether this application exists or what it requires.",
    "newText": "Extended quota mode is applied for via Spotify's review. Spotify only accepts applications from legally registered organizations (not individuals), with at least 250k MAUs; review can take up to six weeks.",
    "newLabel": "documented",
    "reason": "Q states organization-only, 250k MAU minimum and the six-week review."
  },
  {
    "path": "verdict.factors.businessEntityRequired",
    "currentText": "no",
    "newText": "for_extended_quota (organization required for extended quota; none stated for Development Mode registration)",
    "newLabel": "documented",
    "reason": "Q: 'Spotify only accepts applications from organizations (not individuals).'"
  },
  {
    "path": "requirements[3]",
    "currentText": "No source states that a business entity is required to register a Web API app. This is not confirmed either way.",
    "newText": "Registering a Development Mode app has no stated business requirement, but extended quota (needed to serve more than the allowlisted users) is accepted only from organizations with at least 250k MAUs.",
    "newLabel": "documented",
    "reason": "Q."
  },
  {
    "path": "blockers[1] and verdict.checkFirst[1]",
    "currentText": "the sources do not describe the Development Mode user limits",
    "newText": "Development Mode apps support up to 5 authenticated users, each added to the app's allowlist; beyond that requires extended quota.",
    "newLabel": "documented",
    "reason": "Q: 'Up to 5 authenticated Spotify users can use an app that is in development mode.'"
  },
  {
    "path": "requirements (new item)",
    "currentText": "(absent)",
    "newText": "The Development Mode app owner must have Spotify Premium for the app to function.",
    "newLabel": "documented",
    "reason": "Q: 'The app owner must have a Spotify Premium account for apps in development mode to function.'; consistent with sp-2 (Web API greyed out on free)."
  },
  {
    "path": "steps[3].detail and tested.unverified redirect-URI entry",
    "currentText": "The captured sources do not show the dashboard fields or redirect URI rules",
    "newText": "Use HTTPS unless loopback; loopback must be an explicit IP (http://127.0.0.1:PORT or http://[::1]:PORT); 'localhost' is not allowed.",
    "newLabel": "documented",
    "reason": "R states these rules. Keep step 4 'tested' only for 'loopback accepted' (sp-4)."
  },
  {
    "path": "steps[2].evidence (step 3)",
    "currentText": "label tested: Create the app and obtain Client ID and Secret",
    "newText": "Tested for app creation and Client ID only; the client secret was not viewed or obtained (sp-3).",
    "newLabel": "documented",
    "reason": "Overstated: sp-3 says the secret was never viewed. Keep a tested sub-note for app creation/Dev mode."
  },
  {
    "path": "steps[1].evidence and handoff.agentCanDo[Step 2]",
    "currentText": "tested (reachability only)",
    "newText": "documented",
    "newLabel": "documented",
    "reason": "Reachability is not a walkthrough observation; step 2 was not attempted."
  },
  {
    "path": "steps[4].evidence and handoff.agentCanDo[Step 5]",
    "currentText": "tested (reachability only)",
    "newText": "documented",
    "newLabel": "documented",
    "reason": "Step 5 was not attempted per attempt.stoppedAt."
  },
  {
    "path": "steps[5].evidence and handoff.agentCanDo[Step 6]",
    "currentText": "tested (reachability only)",
    "newText": "documented",
    "newLabel": "documented",
    "reason": "Step 6 was not attempted per attempt.stoppedAt."
  },
  {
    "path": "verdict.timeToCredentials, verdict.humanEffortHours, steps[*].estimate (except steps 8/9 above)",
    "currentText": "numeric ranges",
    "newText": "unchanged, keep the 'our estimate' wording",
    "newLabel": "unverified",
    "reason": "No fetched page states creation time or effort; keep clearly labelled as estimates."
  }
]
```

## Report

1. Claims checked: 27 rows (all time/effort figures included); 7 official pages fetched.
2. Counts: confirmed 10, corrected 6, overstated 4, unverifiable 7.
3. Key findings: (a) the guide says no turnaround/requirements are documented, but Quota modes states extended quota review takes up to six weeks, needs an organization (not individuals) and at least 250k MAUs, and Dev Mode is limited to 5 allowlisted users, with Premium needed for the owner; so the 28-day cap, "business entity: no" and the unknown-user-limit blocker are wrong; (b) 25 Client IDs per account, per-account quota, QUOTA_EXCEEDED 429, loopback-vs-localhost, and Open Access partner-only are all confirmed; (c) steps 2, 5, 6 are labelled "tested" on reachability alone (steps 5-9 not attempted), and step 3's "obtain Secret" is overstated since the secret was never viewed.
4. Could not check: per-step and verdict time/effort figures (no source exists), 180-day refresh token lifetime and sp-* observations (log only), OAuth metadata, Android auth-lib, Composio managed-auth, Developer Terms agent-use ambiguity.
5. Guide JSON was not edited; only this file was written.

## Corrections applied (2026-10-29)
Applied to `content/guides/spotify.json` with changelog lines (new official source s14): time to production now Spotify's documented maximum of six weeks; extended quota recorded as organization-only with at least 250,000 monthly active users; Development Mode limited to 5 allowlisted users with a Premium owner; redirect rules (loopback IP, no localhost) added; steps 2, 5 and 6 changed from tested to documented; step time ranges marked as our estimates. The business-entity factor changed to "yes" (stated by Spotify), and **the difficulty was recomputed by the rubric, from hard to gated**. **Not checked:** the 180-day refresh-token lifetime and the walkthrough observations (log only), the OAuth metadata, the Android auth-library claim, the Composio managed-auth claim, and the Developer Terms ambiguity.
