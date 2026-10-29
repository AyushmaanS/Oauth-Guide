# Discord guide verification

Verified 2026-10-29 by Claude Code (claim sampling; not exhaustive)

Pages fetched successfully (read in this task):
- G1 https://docs.discord.com/developers/gateway/getting-started-with-privileged-intent-review (and its .md twin)
- G2 https://docs.discord.com/developers/topics/oauth2
- G3 https://docs.discord.com/developers/events/gateway
- G4 https://docs.discord.com/developers/change-log.md (first 100k of 266k chars read)
- G5 https://docs.discord.com/developers/gateway/you-might-not-need-a-privileged-intent.md
- G6 https://docs.discord.com/developers/resources/application(.md) (no verification/ID content)

Pages that returned HTTP 403 to WebFetch (also via short-URL and alternative-path variants): support-dev.discord.com articles 40281523410967 (s15), 6276106082583 (s16), 8563934450327 (s8), 6205754771351, 6275923204375. WebSearch result summaries exist for s15/s16 but are not the page text, so claims resting only on s15/s16/s8 are marked unverifiable.

| # | Claim | Label | Check (URL + what was compared) | Outcome | Note |
|---|---|---|---|---|---|
| 1 | verdict.timeToCredentials 0.5-3 h | unverified | No primary source states a figure. dc-3 (attempts log) saw "Creation was instant, with no review", but credentials (secret/token) were never revealed. | unverifiable | Label "unverified" is correct. Basis is plausible; keep as estimate. |
| 2 | verdict.timeToProduction 7-60 days ("no source gives a review time") | unverified | G1 states review duration is not given (only the 90-day apply window). G3/G5 also give none. | unverifiable | The "no source gives a review time" half is confirmed; the 7-60 day range itself is an unsupported guess. Label correct. |
| 3 | verdict.humanEffortHours 2-10 h | unverified | No fetched page gives any effort figure. | unverifiable | Label correct. |
| 4 | Step estimates 1-5: "5-30 minutes", "30-90 minutes", "15-45 minutes" (x2), "5-15 minutes" | tested (steps 1-5) | attempts/discord.json dc-1..dc-5 record no durations or timings. | overstated | The step evidence label "tested" covers the observation, not the estimate. The estimates are untimed guesses; the estimate text should be marked unverified. |
| 5 | Step estimates 6-11: step 7 "2-6 hours", step 8 "30-60 minutes", step 9 "Unknown; likely weeks", step 10 "1-3 hours per year", step 11 "Unknown" | documented | G1 gives no durations for drafting, submitting, review or renewal. | unverifiable | Step 9's "likely weeks" and steps 7/8/10 ranges are not documented. Downgrade the estimates to unverified. "Unknown" for step 11 is honest. |
| 6 | 10,000-user threshold: past it you must apply for Privileged Intent access; under it you toggle in the portal | documented | G1: "If that number exceeds 10,000, your app needs to apply for Privileged Intent access." G3: "Apps with fewer than 10,000 users can access privileged intents by enabling them in the Developer Portal." G4: "If your app is accessible to fewer than 10,000 users, these changes do not impact your app." | confirmed | |
| 7 | "As of June 10, 2026" the threshold is user-based | documented | G1: "As of June 10th, 2026, we've made some changes to the Privileged Intents review process." G4 has a "June 10, 2026: Privileged Intent Changes" entry. | confirmed | |
| 8 | Threshold counts unique users who can see the app across all servers, not server count | documented | G1: the count is unique users who can see your app across all its servers, not server count. | confirmed | The "few large servers hit it sooner" corollary is the guide's inference, reasonable. |
| 9 | Message Content: "disabled by default; gives access to content, embeds, attachments, components and poll fields"; step 6/blocker: without the intent "the app cannot access message content fields" | documented | G1 lists `content`, `embeds`, `attachments`, `components`, `poll`. G3: "Apps without the intent will receive empty values in fields that contain user-inputted content". G5: exceptions apply: messages the app sends, DMs to the app, and messages that @mention the app. | corrected | Field list confirmed. "Cannot access" is too absolute: content is still delivered for the app's own messages, DMs and @mentions. "Disabled by default" not explicitly seen on the pages fetched. |
| 10 | Apps with Privileged Intent access must reapply once a year | documented | G1: apps with access from a prior review "must reapply each year through the Developer Portal". G3: "you will be notified annually to reapply". | confirmed | |
| 11 | 90 days to apply after notification; if missed, access is removed; can still apply later | documented | G1: "You will have 90 days from the date of the notification to apply."; "If you don't apply during this window, your app's current Privileged Intents access will be removed"; "you can still apply at any time to request access again." Annual: "you will have 90 days to reapply." | confirmed | |
| 12 | Bot verification: Developer Team owner aged 16+ submits qualifying ID via Stripe; ownership cannot be transferred | documented | s16 (support-dev.../6276106082583) and the FAQ 6275923204375 returned HTTP 403. G1, G3, G6 do not mention age 16, ID or Stripe (G1 explicitly lacks it). A WebSearch summary of s16 matched the claim but it is not page text. | unverifiable | Likely correct but I could not read a primary page. Downgrade to unverified until a human reads s16. Affects requirements[4], steps[10], blockers[2], youNeedOwnWhen[1]. |
| 13 | Token and revocation endpoints accept only application/x-www-form-urlencoded, not JSON | documented | G2: token and revocation URLs "will only accept a content type of application/x-www-form-urlencoded." | confirmed | "not JSON" is an implication of "only"; consistent. |
| 14 | `bot` scope adds bot to selected guild; applications.commands included by default; some scopes need Discord approval; applications.builds.upload approved partners only | documented | G2: bot scope places the bot into the user's selected server; applications.commands is "included by default with the bot scope"; "Some scopes require approval from Discord to use."; builds.upload is "only available to approved partners." | confirmed | "Account representative" wording not seen in the fetched summary; minor. |
| 15 | Developer Policy requires explicit permission before changing a user's account or starting processes on a user's/server's behalf | documented | s8 (support-dev.../8563934450327) returned HTTP 403, as did the short-URL variant. No other fetched page quotes it. | unverifiable | Downgrade to unverified until s8 can be read. Affects requirements[5] and steps[5] (shared with s5). |
| 16 | Step 7: at 10,000 users "the app or team owner is notified by email or system DM, and the Developer Portal shows a message" | documented | G1: for the initial review "you'll receive a notification in the Developer Portal"; for renewal "You will receive a notification when it's time to reapply." No mention of email or system DM. s15 (403) may say it. | unverifiable | Portal notification confirmed; email/DM not seen. Reword to "notified in the Developer Portal" (plus possibly email/DM per s15, unread). |
| 17 | Step 9: during review the app keeps working with the requested intents and can keep joining servers; no source states review duration or manual vs automated | documented | G1: "while in review for privileged intent access, your app will continue to function with the intents you are requesting access to." G1 states no duration and does not say manual or automated. | confirmed | "Keep joining servers" appeared only in a search summary of the notice, not on a fetched page. The no-duration claim is a true absence statement, but "likely weeks" in the step estimate is unsupported (see #5). |
| 18 | Step 2 labelled "tested": reading OAuth2 and Developer Policy docs | tested | attempts/discord.json has no step for this; the guide's own testNote says only reachability of docs.discord.com was observed. I fetched G2 and it is public. | overstated | Reachability is not a walkthrough test of the step. Relabel "documented". The Developer Policy part is unverifiable (#15). |
| 19 | Step 4 labelled "tested": configure the bot scope and invite link | tested | dc-4: generator lists about 25 scopes including bot; Bot page says tokens viewable once; "No invite link was generated." | overstated | The log supports the scope list and token-once behaviour only. "Invite link" and the applications.commands default were not observed (the latter is documented, G2). Narrow the claim or add documented label. |
| 20 | Step 5 labelled "tested": toggle Message Content; works without applying under 10,000 users | tested | dc-5: toggles exist; "the page says review applies only once a bot reaches 10,000 users. They were not toggled." Matches G1/G3 wording. | overstated | The log supports "toggles present and the page's stated threshold". It does not show the toggle works, so "tested" overstates. Say "observed (toggle not exercised)". |
| 21 | Requirements[0] / step 3 "tested": app creation needs Discord account + ticking Developer Terms and Policy; Client ID visible, Secret hidden until Reset Secret | tested | dc-2: Create is disabled until the owner ticks agreement; dc-3: "Creation was instant, with no review or verification. The Client ID and Public Key are visible; the Client Secret is hidden behind Reset Secret." | confirmed | Log supports the wording. Step 3's detail ("retrieve the client ID and client secret") was not completed in the walkthrough; the secret was never revealed. |
| 22 | App Verification and Privileged Intent review are separate processes (specialRequirements treat ID verification separately) | documented | G4 (June 10, 2026 entry): "App Verification and Privileged Intent review are now separate processes." G3: verified apps must also be approved for the intent. | confirmed | Guide does not state this explicitly in text; worth adding a sentence to step 11 and the verdict summary. |

## Summary

Claims checked: 22 (all four time/effort figures plus every step estimate, the key decision claims, and the "tested" claims against the attempts log).

| Outcome | Count | Claim #s |
|---|---|---|
| confirmed | 10 | 6, 7, 8, 10, 11, 13, 14, 17, 21, 22 |
| corrected | 1 | 9 |
| overstated | 4 | 4, 18, 19, 20 |
| unverifiable | 7 | 1, 2, 3, 5, 12, 15, 16 |

Could not be verified:
- All time/effort figures (verdict.timeToCredentials, timeToProduction, humanEffortHours, and every step estimate): no primary source gives any. They are the guide's guesses and must stay labelled unverified; the review duration is explicitly unstated by Discord's docs.
- Bot verification (age 16+, qualifying ID via Stripe, non-transferable ownership), the Developer Policy permission sentence, and "notified by email or system DM": the only pages that carry them (support-dev.discord.com, s8/s15/s16) returned HTTP 403, and no docs.discord.com page repeats them.
- Not sampled: PKCE metadata claim, Composio managed-auth claims (s13), the community report (s12), rate limits.

## Proposed corrections

```json
[
  {
    "path": "scopesAndNuances[...].text / requirements / steps[5].detail / blockers[1].fix",
    "currentText": "Without the intent, the app cannot access message content fields.",
    "newText": "Without the intent, the app receives empty values in message content fields, except for messages it sends itself, DMs to it, and messages that @mention it.",
    "newLabel": "documented",
    "reason": "Discord's gateway docs say apps without the intent receive empty values in user-content fields and list exceptions for own messages, DMs and @mentions; 'cannot access' is too absolute."
  },
  {
    "path": "steps[6].detail",
    "currentText": "At 10,000 unique users the app or team owner is notified by email or system DM, and the Developer Portal shows a message.",
    "newText": "At 10,000 unique users you are notified in the Developer Portal when it is time to apply.",
    "newLabel": "documented",
    "reason": "The fetched Discord doc mentions only a Developer Portal notification; email/system DM could not be confirmed (s15 returned 403). If a human confirms s15, the email/DM wording can return."
  },
  {
    "path": "steps[1].evidence",
    "currentText": "label: tested (observationRef: https://docs.discord.com/developers/topics/oauth2)",
    "newText": "label: documented (page reachability observed, step not walked through)",
    "newLabel": "documented",
    "reason": "attempts/discord.json has no step covering reading the docs; only reachability was observed."
  },
  {
    "path": "steps[3].evidence",
    "currentText": "label: tested (dc-4); detail 'Configure the bot scope and invite link'",
    "newText": "Keep 'tested' only for: scope list (about 25 scopes incl. bot) and tokens-viewable-once on the Bot page were observed; no invite link was generated. The applications.commands default is documented (docs.discord.com OAuth2), not tested.",
    "newLabel": "documented",
    "reason": "The log explicitly says no invite link was generated; 'tested' overstates it."
  },
  {
    "path": "steps[4].evidence",
    "currentText": "label: tested (dc-5); 'toggle on Message Content. This works without applying while the app has under 10,000 unique users.'",
    "newText": "The Bot page shows Presence, Server Members and Message Content toggles and says review applies only from 10,000 users (observed, toggles not exercised). That under-10,000 apps can enable them without applying is documented by Discord's gateway docs.",
    "newLabel": "documented",
    "reason": "The walkthrough did not toggle anything; 'tested' overstates what dc-5 shows."
  },
  {
    "path": "steps[0].estimate, steps[1].estimate, steps[2].estimate, steps[3].estimate, steps[4].estimate",
    "currentText": "5-30 minutes; 30-90 minutes; 15-45 minutes; 15-45 minutes; 5-15 minutes",
    "newText": "Same ranges, shown as 'our estimate (unverified)'; the 'tested' label applies to the observation, not the time.",
    "newLabel": "unverified",
    "reason": "attempts/discord.json records no durations; no primary source gives step timings."
  },
  {
    "path": "steps[6].estimate, steps[7].estimate, steps[8].estimate, steps[9].estimate",
    "currentText": "2-6 hours; 30-60 minutes; Unknown; likely weeks; 1-3 hours per year",
    "newText": "Mark as 'our estimate (unverified)'. For step 9 use: 'Unknown: Discord does not publish a review time'.",
    "newLabel": "unverified",
    "reason": "Discord's privileged-intent docs give no drafting, submission or review durations; 'likely weeks' is the guide's guess while the step is labelled documented."
  },
  {
    "path": "steps[8].evidence",
    "currentText": "label: documented (s5, s15) for 'Unknown; likely weeks'",
    "newText": "Keep documented only for 'app keeps working during review' and 'no source states duration'; the 'likely weeks' estimate is unverified.",
    "newLabel": "unverified",
    "reason": "Review duration is not stated anywhere fetched."
  },
  {
    "path": "requirements[4].evidence, steps[10].evidence, blockers[2].evidence, managedVsOwn.youNeedOwnWhen[1].evidence",
    "currentText": "To verify the bot, a Developer Team owner aged 16 or over must submit a qualifying ID through Stripe ... ownership cannot be transferred (label documented, s16)",
    "newText": "Same text, but flagged: not re-verified against Discord's page because support-dev.discord.com returned HTTP 403 on 2026-10-29. Check s16 manually before relying on the age, Stripe and ownership details.",
    "newLabel": "unverified",
    "reason": "Could not read s16 or the verification FAQ; no docs.discord.com page repeats the age-16/ID/Stripe claim."
  },
  {
    "path": "requirements[5].evidence, steps[5].evidence",
    "currentText": "The Developer Policy requires explicit permission before changing a user's account or starting processes on a user's or server's behalf. (label documented, s8)",
    "newText": "Same text, flagged: not re-verified; s8 returned HTTP 403 on 2026-10-29.",
    "newLabel": "unverified",
    "reason": "Primary page could not be fetched."
  },
  {
    "path": "verdict.timeToProduction.basis",
    "currentText": "Our estimate: no source gives a review time. Review only applies at 10,000+ users or at annual renewal. A manual review of this kind likely takes weeks, so the range is wide.",
    "newText": "Our estimate: Discord does not publish a review time, and no source says whether review is manual. Review only applies at 10,000+ users or at annual renewal. The 7-60 day range is a guess.",
    "newLabel": "unverified",
    "reason": "Removes the unsupported assertion that a manual review 'likely takes weeks'."
  }
]
```

## Corrections applied (2026-10-29)
Applied to `content/guides/discord.json` with changelog lines: Message Content wording; the 10,000-user notice; steps 2, 4 and 5 changed from tested to documented; step time ranges marked as our estimates and the review-time guess removed; bot-verification, ownership and Developer Policy claims downgraded to unverified because their pages returned HTTP 403; time-to-production basis. **Not checked:** the PKCE metadata claim, Composio managed-auth claims, the community report and rate limits.
