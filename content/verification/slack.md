# Slack guide verification

Verified 2026-10-29 by Claude Code (claim sampling; not exhaustive)

Guide: `content/guides/slack.json`. Walkthrough log: `content/attempts/slack.json` (sl-1..sl-6).

Pages fetched in this task (all fetched directly, 2026-10-29):
- P1 https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps
- P2 https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide
- P3 https://docs.slack.dev/authentication/installing-with-oauth
- P4 https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace
- P5 https://docs.slack.dev/tools/developer-sandboxes
- P6 https://docs.slack.dev/app-management/distribution/
- P7 https://docs.slack.dev/slack-marketplace/distributing-your-app-in-the-slack-marketplace
- P8 https://nango.dev/blog/fix-slack-oauth-error-invalid-team-for-non-distributed-app (third party)
- Fetched but no relevant content: slack.com/blog/developers/slack-marketplace-review-process (no timing or eligibility text), docs.slack.dev/apis/web-api/rate-limits and docs.slack.dev/reference/methods/conversations.history (no mention of the non-Marketplace change), docs.slack.dev/distributing-slack-apps (404).

| # | Claim | Label | Check (URL + what was compared) | Outcome | Note |
|---|---|---|---|---|---|
| 1 | verdict.timeToCredentials 0.5-3 h | unverified | Attempt log sl-1..sl-4 (no timings recorded). No Slack page gives a time. | unverifiable | Correctly labelled unverified. The log shows app creation is instant ("Create Anyway made it instantly") but also that sign-in plus creating a new workspace was needed; no duration. |
| 2 | timeToCredentials basis and verdict.summary: app creation "needs only an account" / "with just an account" | unverified (basis), none (summary) | Attempt log sl-1 and sl-4: account alone was not enough; the owner had to create a new free workspace. | corrected | Walkthrough contradicts the wording. Say account plus a workspace. |
| 3 | verdict.timeToProduction: "at least a few weeks", upper bound 42 days | unverified (s3) | P2: "the preliminary part of the review takes up to 10 business days to receive feedback" and "the functional review takes up to 10 weeks for new submissions and 6 weeks for published apps resubmitting changes". The phrase "few weeks" was not found on P2. | corrected | Slack's stated figures give roughly up to 12 weeks for a new submission, well beyond the 42-day assumption. Turnaround "can vary depending on volume". |
| 4 | verdict.humanEffortHours 8-40 h | unverified | No Slack page states effort figures; P2 and P7 list requirements only. | unverifiable | Our estimate; label already unverified. |
| 5 | Step 1 estimate "10-30 minutes" | none (step labelled tested) | Attempt log sl-1: no timing recorded. | unverifiable | Not a documented range and no walkthrough timing; mark as an estimate. |
| 6 | Step 2 estimate "1-2 hours" | none | Attempt log sl-2/sl-3: creation instant, no scopes added, no timing. | unverifiable | The walkthrough covered only creation. |
| 7 | Step 3 estimate "0.5-2 days" | none | Not walked through; P3 gives no time. | unverifiable | Estimate only. |
| 8 | Step 4 estimate "minutes to 1 hour" | none | Attempt log sl-5: activation not attempted. P6 gives no time. P8 (third party) says activation "takes effect immediately". | unverifiable | Third party only. |
| 9 | Step 5 estimate "1-3 hours" | none | Not walked through. P5 states no setup duration. | unverifiable | Estimate only. |
| 10 | Step 6 estimate "2-5 days" | none | Not walked through; P2 and P7 give no preparation time. | unverifiable | Estimate only. |
| 11 | Step 7 estimate "1-3 hours" | none | P2 gives no submission effort figure. | unverifiable | Estimate only. |
| 12 | Step 8 estimate "Several weeks" (documented, s3) | documented | P2: up to 10 business days for preliminary feedback, up to 10 weeks functional review (new submissions), 6 weeks for resubmissions of published apps. | corrected | "Several weeks" understates the documented upper range and drops the two-stage structure. |
| 13 | Rate limit: commercially distributed non-Marketplace apps, "created after May 29, 2025 or with net new installations", conversations.history/replies 1 request/min and 15 objects; Marketplace apps unaffected | documented | P1: "limited to 1 request per minute, unless they are approved for the Slack Marketplace"; "maximum and default for the `limit` parameter has been reduced to 15 objects"; "The updated terms are effective immediately for applications created on or after May 29, 2025"; "This change will not impact Marketplace apps." | corrected | Figures confirmed. Date wording should be "on or after May 29, 2025", and P1 says terms for apps created earlier take effect June 30, 2025 (net-new installs of existing non-Marketplace apps are affected, existing installs are not). |
| 14 | Internal customer-built apps keep 50+ requests/min and up to 1,000 objects | documented | P1: "Internal customer-built applications are not impacted by these changes"; custom apps 50+ requests per minute, `limit` 1,000. | confirmed | |
| 15 | Installing in another workspace returns invalid_team_for_non_distributed_app until distribution is enabled | reported (blocker) / unverified-ish in step 4 | P3: the error "Occurs when attempting to install/authorize an undistributed Slack API app on a team where the app was not created." | confirmed | Slack docs support the error meaning, so it can be labelled documented (s2). |
| 16 | Bot scopes in `scope=`, user scopes in `user_scope=`; either or both | documented | P3: "provide a `user_scope` parameter with requested user scopes instead of, or in addition to, the `scope` parameter." | confirmed | |
| 17 | Scopes additive across installs and cannot be removed from an existing token | unverified (self-check downgrade) | P3: "each scope you request is additive to the scopes you've already been awarded"; "There is no way to remove scopes from an existing token without revoking it entirely." | confirmed | The downgrade to unverified was too cautious; the source text is present. |
| 18 | Sign in with Slack scopes cannot be combined with non-SIWS scopes in one flow | documented | P3: "SIWS user scopes cannot be combined with non-SIWS user scopes."; "Each set of scopes must be requested in a separate OAuth flow." | confirmed | |
| 19 | Slack API terms: Marketplace is the appropriate channel for commercial distribution, "whether unlisted or listed" | unverified | P1: "the Slack Marketplace is the only appropriate channel for commercially distributing apps built with Slack APIs". P6: "apps intended for commercial distribution should be submitted and approved for listing in the Slack Marketplace." | corrected | Stronger than the guide says. The "unlisted or listed" wording was not found; Slack's text says listing/approval. The "Marketplace (listed or unlisted)" reading should be dropped. |
| 20 | Marketplace eligibility threshold (active workspaces) | not in guide | P2: "Your app has been installed on 10 or more active workspaces."; "An active workspace is a workspace that has been used in the past 28 days." P7: apps "installed on less than 10 active workspaces and have less than 10 weekly active users" fall below the minimum; sandboxes excluded. | corrected | The guide omits this gate. It matters: a new app cannot be submitted until it has about 10 active installs, yet unapproved commercial apps get the 1 request/min limit meanwhile. P2 and P7 word the rule differently (P7 adds weekly active users); confirm in the live submission flow. |
| 21 | Review cannot be skipped or accelerated | documented | P2: "We are unable to skip or accelerate the review process in order to coordinate with your launch." | confirmed | |
| 22 | "Slack often gives feedback to address before listing" (step 8, biggestLaunchRisk "often returns feedback") | documented | P2: "All feedback must be addressed before your app can be listed." and feedback is given within the submission flow. | overstated | "Often" (a frequency) is not stated. Say Slack gives feedback that must be addressed. |
| 23 | Summary: "public distribution may be switched on without review" | none (summary); step 4 cites third-party s11 | P6 (Slack): activation is a checklist then "Activate Public Distribution"; the page does not say Slack reviews or approves it. P8: "No review is required to activate distribution and it takes effect immediately." Attempt log sl-5: "no review step was shown there"; activation not attempted. | unverifiable | Slack's own page is silent rather than explicit; support is the third party plus the page read in sl-5. Phrase as "Slack's docs describe no review step; not attempted". |
| 24 | Step 4 "Activate public distribution" labelled tested (sl-5) | tested | Attempt log sl-5: only the Manage Distribution page was read, four prerequisites seen; "Activation was not attempted". | overstated | Reading the checklist is a partial observation. Activation, its effect, and the error fix were not tested. |
| 25 | Steps 3, 5, 6, 7, 9 labelled tested | tested | Attempt log: sl-1..sl-6 have no entry for these steps. The guide's own testNote says "Only reachability was observed" (a GET of a docs page). `stoppedAt` says steps 3 and 5-9 were not attempted. | overstated | Pages read, nothing walked through. Same applies to the handoff.agentCanDo/youMustDo entries copying these labels. Step 3 is documented (P3), step 5 documented (P5), steps 6/7 documented (P2/P7), step 9 documented (P4). |
| 26 | Step 2 "Create the app and configure bot and user scopes" labelled tested (sl-2) | tested | Attempt log sl-2/sl-3: app created (Blank app), OAuth page read; "No scope or redirect URL was added." | overstated | Creation tested; scope configuration was not. Split or label "partially tested". |
| 27 | Step 7: submission page in app settings shows estimated review turnaround | tested (reachability) | P2: check "the estimated time for review listed on the submission page of your app settings". | confirmed | Documented, not tested. |
| 28 | Members can install apps without Owner approval by default; Workspace Owners can require approval | documented | P4: "by default, members can install them without approval from a workspace owner."; "workspace owners can enable app approval". | confirmed | P4 also notes Enterprise org policies can auto-enable approval. |
| 29 | Developer sandbox usable at no extra cost | documented | P5: sandboxes usable "without an additional cost"; eligible via the Slack Developer Program. | confirmed | P5 says a sandbox is an Enterprise org environment; basic sandboxes last one month by default. |
| 30 | Requirements/sl-3 claims: account alone not enough, a workspace is needed; Client ID visible at creation, secrets masked; install disabled until a scope is added | tested | Attempt log sl-1 (new free workspace created), sl-3 ("Install is disabled until at least one scope is added"), sl-4 (Client ID visible; secrets masked; none revealed). | confirmed | Log supports the wording. Minor: the requirements entry cites sl-4 but the workspace point comes from sl-1. |

## Summary

Claims checked: 30.

| Outcome | Count |
|---|---|
| confirmed | 10 |
| corrected | 6 |
| overstated | 4 |
| unverifiable | 10 |

Could not be verified:
- All step estimates other than step 8 (rows 5-11) and timeToCredentials / humanEffortHours: no Slack page or walkthrough timing supports them. They are estimates, not documented ranges.
- Whether public distribution truly needs no review: Slack's distribution page is silent; only a third party and the sl-5 page read support it. Activation was never attempted.
- Whether a registered legal entity or business verification is required: P7 states no such requirement, but absence of text is not proof.
- Not fetchable or silent: slack.com blog FAQ (no timing text), docs.slack.dev rate-limits and conversations.history pages (no mention of the 2025 change), docs.slack.dev/distributing-slack-apps (404). Composio managed-auth claims (s12) and the Luciq listing (s13) were not checked.

## Proposed corrections

```json
[
  {
    "path": "verdict.timeToProduction.basis",
    "currentText": "Slack recommends planning 'at least a few weeks' for Marketplace submission and review; the exact turnaround is shown on the submission page. The upper bound of 42 days is our assumption for feedback cycles.",
    "newText": "Slack's review guide says preliminary feedback takes up to 10 business days and functional review up to 10 weeks for new submissions (6 weeks for resubmissions of published apps); turnaround varies with volume and the estimate is shown on the submission page. An app must also first be installed on 10 or more active workspaces.",
    "newLabel": "documented",
    "reason": "docs.slack.dev review guide gives explicit figures; 42-day upper bound conflicts with up to roughly 12 weeks, and 'at least a few weeks' was not found on the page."
  },
  {
    "path": "steps[7].estimate",
    "currentText": "Several weeks",
    "newText": "Up to 10 business days for preliminary feedback, then up to 10 weeks for functional review (new submissions)",
    "newLabel": "documented",
    "reason": "Slack Marketplace review guide states these maximums; 'several weeks' understates them."
  },
  {
    "path": "steps[7].detail",
    "currentText": "Slack often gives feedback to address before listing. It says review cannot be skipped or accelerated and recommends at least a few weeks in the launch plan.",
    "newText": "Slack gives feedback in the submission flow and all feedback must be addressed before listing. It says it cannot skip or accelerate review to match your launch, and advises submitting as early as you can.",
    "newLabel": "documented",
    "reason": "'Often' and 'at least a few weeks' are not on the review guide; the quoted sentences are."
  },
  {
    "path": "verdict.biggestLaunchRisk",
    "currentText": "Slack Marketplace review is manual, cannot be sped up, and often returns feedback.",
    "newText": "Slack Marketplace review is manual, cannot be sped up, requires all feedback to be addressed, and needs the app to have 10 or more active workspaces before submission.",
    "newLabel": "documented",
    "reason": "Review guide: no acceleration; all feedback must be addressed; eligibility threshold of 10 or more active workspaces (used in the past 28 days)."
  },
  {
    "path": "verdict.timeToCredentials.basis",
    "currentText": "Our estimate: creating an app in the Slack developer console needs only an account, and the client ID is on the App Management page (s2); no source gives a time.",
    "newText": "Our estimate: creating an app needs a Slack account and a workspace (the walkthrough had to create a new free workspace), after which the Client ID is visible at once; no source gives a time.",
    "newLabel": "unverified",
    "reason": "Walkthrough sl-1/sl-4 contradicts 'only an account'."
  },
  {
    "path": "verdict.summary",
    "currentText": "Slack lets you create an app with just an account, and public distribution may be switched on without review.",
    "newText": "Slack lets you create an app with an account and a workspace. Slack's distribution docs describe a checklist and an Activate Public Distribution button with no review step (not attempted in our walkthrough), but Slack says commercial distribution should go through the Marketplace.",
    "newLabel": "unverified",
    "reason": "Walkthrough showed a workspace is needed; Slack's page is silent on review rather than explicit; API terms say Marketplace is the only appropriate commercial channel."
  },
  {
    "path": "scopesAndNuances[3].text",
    "currentText": "For commercially distributed apps not approved for the Marketplace, created after May 29, 2025 or with net new installations, conversations.history and conversations.replies are limited to 1 request/min and 15 objects. Marketplace apps are not affected.",
    "newText": "For commercially distributed apps not approved for the Marketplace, created on or after May 29, 2025 (earlier apps from June 30, 2025 for net new installations; existing installations unaffected), conversations.history and conversations.replies are limited to 1 request/min and a maximum and default `limit` of 15 objects. Marketplace apps are not affected.",
    "newLabel": "documented",
    "reason": "Changelog wording is 'on or after May 29, 2025' and gives a June 30, 2025 date for earlier apps."
  },
  {
    "path": "scopesAndNuances[5].text",
    "currentText": "Slack's API terms update says the Marketplace is the appropriate channel for commercial distribution, whether unlisted or listed. Check the full API Terms of Service against your business model.",
    "newText": "Slack's changelog says the Slack Marketplace is the only appropriate channel for commercially distributing apps built with Slack APIs, and the distribution docs say apps intended for commercial distribution should be submitted and approved for listing. Check the full API Terms of Service against your business model.",
    "newLabel": "documented",
    "reason": "Both docs.slack.dev pages state this; 'whether unlisted or listed' is not in them."
  },
  {
    "path": "scopesAndNuances[1].evidence.label",
    "currentText": "unverified",
    "newText": "documented",
    "newLabel": "documented",
    "reason": "Installing-with-OAuth doc states scopes are additive and cannot be removed without revoking the token."
  },
  {
    "path": "youNeedOwnWhen[1].text (managedVsOwn)",
    "currentText": "You want to commercially distribute the app: Slack's API terms point to the Marketplace (listed or unlisted) as the appropriate channel, which requires your own app.",
    "newText": "You want to commercially distribute the app: Slack says the Marketplace is the only appropriate channel for commercial distribution, which requires your own app.",
    "newLabel": "documented",
    "reason": "Changelog states Marketplace is the only appropriate channel; 'listed or unlisted' is not supported."
  },
  {
    "path": "steps[3].evidence.label",
    "currentText": "tested",
    "newText": "documented",
    "newLabel": "documented",
    "reason": "sl-5 only read the Manage Distribution page; activation was not attempted. The claim that no review is needed rests on a third party and Slack's silence, so keep that sentence marked unverified."
  },
  {
    "path": "steps[3].detail",
    "currentText": "A third-party source says that in Manage Distribution you get all checklists green and click Activate Public Distribution, with no review and immediate effect. Verify against Slack's own distribution docs.",
    "newText": "Slack's distribution docs describe completing the checklist and clicking Activate Public Distribution, and mention no review step; a third party says it takes effect immediately. Activation was not attempted in our walkthrough.",
    "newLabel": "unverified",
    "reason": "Slack's page checked; it is silent on review, not explicit."
  },
  {
    "path": "steps[1].evidence.label",
    "currentText": "tested",
    "newText": "partially tested (app creation observed; scope configuration not tested)",
    "newLabel": "documented",
    "reason": "sl-3 states no scope or redirect URL was added."
  },
  {
    "path": "steps[2].evidence.label; steps[4].evidence.label; steps[5].evidence.label; steps[6].evidence.label; steps[8].evidence.label; handoff.agentCanDo[1,3,4].evidence.label; handoff.youMustDo[1,2].evidence.label",
    "currentText": "tested",
    "newText": "documented",
    "newLabel": "documented",
    "reason": "Only reachability of docs pages was observed; walkthrough stoppedAt says steps 3 and 5-9 were not attempted."
  },
  {
    "path": "steps[0].estimate; steps[1].estimate; steps[2].estimate; steps[3].estimate; steps[4].estimate; steps[5].estimate; steps[6].estimate; verdict.timeToCredentials; verdict.humanEffortHours",
    "currentText": "(existing time ranges)",
    "newText": "Keep the ranges but mark each as 'our estimate, not documented'.",
    "newLabel": "unverified",
    "reason": "No Slack page or walkthrough timing supports them."
  },
  {
    "path": "requirements (new entry)",
    "currentText": "(missing)",
    "newText": "To submit to the Marketplace the app must be installed on 10 or more active workspaces (active = used in the past 28 days); apps with fewer than 10 active workspaces and fewer than 10 weekly active users are below the minimum.",
    "newLabel": "documented",
    "reason": "Stated on the review guide and the Marketplace distribution page; missing from the guide."
  }
]
```

Report:
1. Claims checked: 30 (all time/effort figures, rate-limit, distribution, scopes, eligibility, approval defaults, tested labels).
2. Counts: 10 confirmed, 6 corrected, 4 overstated, 10 unverifiable.
3. Key findings: (a) Slack documents up to 10 business days plus up to 10 weeks of review, so the 42-day cap and "several weeks" are too low; (b) the guide omits the 10-active-workspace Marketplace threshold, and the rate-limit date is "on or after May 29, 2025" with June 30, 2025 for older apps; (c) steps 2-9 labelled "tested" rest on page reads (activation never attempted), and "just an account" contradicts the walkthrough.
4. Could not check: step time estimates and effort hours (no source), whether distribution truly needs no review (Slack silent), business-entity requirement, Composio managed-auth claims.
5. Output: `content/verification/slack.md`; guide JSON untouched.

## Corrections applied (2026-10-29)
Applied to `content/guides/slack.json` with changelog lines (new official sources s14 and s15): Marketplace review time now Slack's documented maximums (10 business days, then 10 weeks) and the 10-active-workspace eligibility added; summary, biggest risk and time-to-credentials wording corrected (a workspace is also needed); rate-limit dates and the commercial-distribution wording corrected; scopes-are-additive upgraded to documented; steps 2 to 7 and 9 changed from tested to documented; the "no review" claim for public distribution kept as a third-party statement; all step time ranges marked as our estimates. **Not checked:** the business-entity requirement, the Composio managed-auth claims, and any timing for steps 1 to 7 (no source).
