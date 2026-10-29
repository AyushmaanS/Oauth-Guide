# What we learned, corrected and could not verify (Sprint 6)

Source for the README. Dates: 2026-10-29. Logs: `content/attempts/*.json` (walkthroughs), `content/verification/*.md` (claim checks and merge diffs).

## How it was checked
- **Signed-in walkthroughs** (owner present, free accounts, separate Chrome profile, throwaway names, protocol in `docs/ATTEMPT-PROTOCOL.md`): GitHub and Google (Gmail), both up to the first step we chose not to take (no client secret was generated). Discord, Slack and Spotify (added later in the sprint, with their terms ambiguity stated on each guide) up to a similar stopping point. LinkedIn: not run, because its User Agreement bans automated access.
- **Claim verification:** 157 claims across the six guides were sampled and each checked against a primary page fetched during the check, or against the walkthrough log. This was done by Claude Code subagents, not by a human; **the owner's read-through is the human check**. It is a sample, not a proof that every other claim is right.

| Guide | Checked | Confirmed | Corrected | Overstated | Could not verify |
|---|---|---|---|---|---|
| GitHub | 24 | 15 | 0 | 3 | 6 |
| Gmail | 25 | 11 | 1 | 3 | 10 |
| LinkedIn | 29 | 8 | 6 | 2 | 13 |
| Discord | 22 | 10 | 1 | 4 | 7 |
| Slack | 30 | 10 | 6 | 4 | 10 |
| Spotify | 27 | 10 | 6 | 4 | 7 |

## What the walkthroughs showed that the documentation did not
- **GitHub:** the form says "Redirect URIs" (up to 10, optional wildcard), not a single callback URL; "Expire user access tokens" is on by default; the app gets a Client ID at once but a secret needs a separate click. Registering a throwaway app took roughly three minutes of clicking, with no review, payment or terms screen.
- **Google:** a Cloud project cannot be created until the account has 2-step verification on ("access blocked" page); the consent-screen wizard needs real support and contact email addresses; the scope picker lists only scopes of enabled APIs; the console files `gmail.readonly` under restricted scopes.

- **Discord:** creating the app is instant but needs ticking the Developer Terms and Policy; the client secret and bot token stay hidden until reset or reveal; the privileged-intent toggles are available without review below 10,000 users.
- **Slack:** the apps page needs its own sign-in and a workspace you own (the account only listed two large communities, so a new free workspace was created); credentials exist from creation, before any install; install is disabled until a scope is added.
- **Spotify:** the dashboard needs the Developer Terms accepted and a verified email before "Create app" turns on; a free account can create the app, but a Premium banner shows and the Web API option is greyed out.

## What verification corrected
- **LinkedIn (largest changes):** `w_organization_social` comes with the Community Management API, not "Share on LinkedIn"; a rejected app cannot reapply (a new app and a new request are needed); production needs a second (Standard tier) review; a super admin of the Page must verify the app; the legal-organization and privacy-policy requirements are official; the open-permissions list was stale; token lifetimes were missing and were added.
- **Gmail:** `gmail.send` alone is only a sensitive scope, not restricted, so the annual security assessment applies to read access; time-to-production wording corrected (Google gives "several weeks" to "several months", nothing for the assessment).
- **GitHub:** "no GitHub review" for production was only the absence of text, and organizations with access restrictions need an owner's approval with no stated timeline, so it was downgraded to unverified.
- **Slack:** Marketplace review is up to 10 business days plus up to 10 weeks (the guide had under 6 weeks); Marketplace submission needs 10 or more active workspaces; creating an app needs a workspace, not just an account.
- **Spotify:** extended quota is accepted only from organizations with at least 250,000 monthly users, review up to six weeks, and Development Mode allows 5 allowlisted users with a Premium owner. This changed a rubric factor, and the difficulty was recomputed by code from hard to gated.
- **Discord:** Message Content returns empty values (with exceptions) rather than "no access"; bot-verification and Developer Policy claims were downgraded because the support pages returned HTTP 403.
- **Everywhere:** every time and effort range that no source states is now marked "our estimate". Walkthrough step times say "approximate, one walkthrough". Steps labelled "tested" only because their page loaded were changed to "documented" where that would mislead.

## What we could not verify
- Any duration or cost for Google's third-party security assessment.
- Whether a registered legal business entity is required for Google restricted-scope verification.
- How long organization owners take to approve a GitHub OAuth app.
- Discord's bot-verification details (age 16, ID through Stripe) and Developer Policy wording: the support pages could not be fetched.
- Spotify's free-account behaviour beyond app creation (whether the Web API works without Premium was not tested).
- LinkedIn's create-app form fields and the exact review wait times (no walkthrough; the portal needs a login).
- Every time-to-credentials and effort figure beyond the two walkthroughs: they are estimates.
- The Composio managed-auth status in each guide (computed by code from Composio's public directory; not re-checked here).

## Limits of this evidence
Five walkthroughs on one day, one account each. They show what happened to that account, not what happens to everyone; a different account type, country or organization may see different screens.

## Pipeline bugs found by this work
- A documentation page on a sign-in-looking path (Google's `/identity/sign-in/...`) was classified "sign-in required" (a false gate) until a long-page rule was added.
- The merge step attributed every correction to the first step that differed from the docs; a correction can now name its own step.
- Link scoring penalised a provider's own name and the social-site filter removed all of `linkedin.com` on LinkedIn (both fixed).
