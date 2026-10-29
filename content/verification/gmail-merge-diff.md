# Walkthrough merge diff: gmail

Merged 2026-10-29. Draft -> merged.

- attemptLevel: L2 -> L3
- attemptLevelReason: Gate probed: 4 page(s) requested read-only on 2026-10-29; public path followed for 1 page(s) (dead end). No account was used. -> Signed-in walkthrough on 2026-10-29 (free account, separate browser profile) stopped at the OAuth client creation step (guide step 4): no client or secret was created; steps 5 to 10 were not attempted, because a human is needed for: two_factor.
- Step 1 tags: ["login_or_account","config_check"] -> ["login_or_account","two_factor","config_check"]
- Step 3 tags: ["config_check","docs_reading"] -> ["config_check"]
- Step 3 estimate: 15–45 minutes -> 7 min (approximate, one walkthrough)
- Step 4 estimate: 15–30 minutes -> 1 min (approximate, one walkthrough)
- requirements[0]: "A Google Cloud account and a Google Cloud project." (documented) -> "A Google account with 2-step verification turned on was needed before Cloud woul" (tested)
- scopesAndNuances[6]: "The sources do not say which individual Gmail scopes are cla" (unverified) -> "In the console, gmail.readonly was listed under 'restricted scopes' when declare" (tested)
- unverified (added): Steps 5, 6, 7, 8, 9, 10 were not walked through (the walkthrough stopped at the OAuth client creation step (guide step 4): no client or secret was created; steps 5 to 10 were not attempted); they stay as documented, not observed.
- unverified (removed): No account was used: steps after the first sign-in are inferred from documentation, not observed.
- changelog: 2026-10-29: signed-in walkthrough merged (level L3).
- changelog: 2026-10-29: corrected "A Google Cloud account and a Google Cloud project." to "A Google account with 2-step verification turned on was needed before Cloud woul" after the walkthrough.
- changelog: 2026-10-29: corrected "The sources do not say which individual Gmail scopes are classified as restricte" to "In the console, gmail.readonly was listed under 'restricted scopes' when declare" after the walkthrough.
