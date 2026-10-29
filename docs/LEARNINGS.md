# What we learned, corrected and could not verify (Sprint 6)

Source for the README. Dates: 2026-10-29. Logs: `content/attempts/*.json` (walkthroughs), `content/verification/*.md` (claim checks and merge diffs).

## How it was checked
- **Signed-in walkthroughs** (owner present, free accounts, separate Chrome profile, throwaway names, protocol in `docs/ATTEMPT-PROTOCOL.md`): GitHub and Google (Gmail), both up to the first step we chose not to take (no client secret was generated). LinkedIn: not run, because its User Agreement bans automated access.
- **Claim verification:** 78 claims across the three guides were sampled and each checked against a primary page fetched during the check, or against the walkthrough log. This was done by Claude Code subagents, not by a human; **the owner's read-through is the human check**. It is a sample, not a proof that every other claim is right.

| Guide | Checked | Confirmed | Corrected | Overstated | Could not verify |
|---|---|---|---|---|---|
| GitHub | 24 | 15 | 0 | 3 | 6 |
| Gmail | 25 | 11 | 1 | 3 | 10 |
| LinkedIn | 29 | 8 | 6 | 2 | 13 |

## What the walkthroughs showed that the documentation did not
- **GitHub:** the form says "Redirect URIs" (up to 10, optional wildcard), not a single callback URL; "Expire user access tokens" is on by default; the app gets a Client ID at once but a secret needs a separate click. Registering a throwaway app took roughly three minutes of clicking, with no review, payment or terms screen.
- **Google:** a Cloud project cannot be created until the account has 2-step verification on ("access blocked" page); the consent-screen wizard needs real support and contact email addresses; the scope picker lists only scopes of enabled APIs; the console files `gmail.readonly` under restricted scopes.

## What verification corrected
- **LinkedIn (largest changes):** `w_organization_social` comes with the Community Management API, not "Share on LinkedIn"; a rejected app cannot reapply (a new app and a new request are needed); production needs a second (Standard tier) review; a super admin of the Page must verify the app; the legal-organization and privacy-policy requirements are official; the open-permissions list was stale; token lifetimes were missing and were added.
- **Gmail:** `gmail.send` alone is only a sensitive scope, not restricted, so the annual security assessment applies to read access; time-to-production wording corrected (Google gives "several weeks" to "several months", nothing for the assessment).
- **GitHub:** "no GitHub review" for production was only the absence of text, and organizations with access restrictions need an owner's approval with no stated timeline, so it was downgraded to unverified.
- **Everywhere:** every time and effort range that no source states is now marked "our estimate". Walkthrough step times say "approximate, one walkthrough". Steps labelled "tested" only because their page loaded were changed to "documented" where that would mislead.

## What we could not verify
- Any duration or cost for Google's third-party security assessment.
- Whether a registered legal business entity is required for Google restricted-scope verification.
- How long organization owners take to approve a GitHub OAuth app.
- LinkedIn's create-app form fields and the exact review wait times (no walkthrough; the portal needs a login).
- Every time-to-credentials and effort figure beyond the two walkthroughs: they are estimates.
- The Composio managed-auth status in each guide (computed by code from Composio's public directory; not re-checked here).

## Limits of this evidence
Two walkthroughs on one day, one account each. They show what happened to that account, not what happens to everyone; a different account type, country or organization may see different screens.

## Pipeline bugs found by this work
- A documentation page on a sign-in-looking path (Google's `/identity/sign-in/...`) was classified "sign-in required" (a false gate) until a long-page rule was added.
- The merge step attributed every correction to the first step that differed from the docs; a correction can now name its own step.
- Link scoring penalised a provider's own name and the social-site filter removed all of `linkedin.com` on LinkedIn (both fixed).
