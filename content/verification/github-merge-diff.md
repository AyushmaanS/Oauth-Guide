# Walkthrough merge diff: github

Merged 2026-10-29. Draft -> merged.

- attemptLevel: L2 -> L3
- attemptLevelReason: Gate probed: 3 page(s) requested read-only on 2026-10-29; public path followed for 3 page(s) (dead end). No account was used. -> Signed-in walkthrough on 2026-10-29 (free account, separate browser profile) stopped at the client-secret step (guide step 4): no secret was generated; steps 5 to 7 were not attempted.
- Step 2 tags: ["login_or_account","email_or_phone_verification"] -> ["login_or_account"]
- Step 2 estimate: 5-30 minutes -> 1 min (measured in one walkthrough)
- Step 2 evidence: documented -> tested
- Step 3 estimate: 10-30 minutes -> 3 min (measured in one walkthrough)
- Step 3 evidence: documented -> tested
- Step 4 estimate: 5-15 minutes -> 1 min (measured in one walkthrough)
- Step 4 evidence: documented -> tested
- requirements[2]: "An Authorization callback URL that you own and control, sinc" (documented) -> "The form labels it 'Redirect URIs': up to 10 are allowed, with an optional wildc" (tested)
- scopesAndNuances[5]: "Access tokens can expire after eight hours with a refresh to" (documented) -> "The registration form has 'Expire user access tokens' ticked by default, which p" (tested)
- scopesAndNuances[8]: (new) -> "The Client ID is shown at once; a client secret is created only after clicking '" (tested)
- unverified (added): Steps 1, 5, 6, 7 were not walked through (the walkthrough stopped at the client-secret step (guide step 4): no secret was generated; steps 5 to 7 were not attempted); they stay as documented, not observed.
- unverified (removed): No account was used: steps after the first sign-in are inferred from documentation, not observed.
- changelog: 2026-10-29: signed-in walkthrough merged (level L3).
- changelog: 2026-10-29: corrected "An Authorization callback URL that you own and control, since ownership of it pr" to "The form labels it 'Redirect URIs': up to 10 are allowed, with an optional wildc" after the walkthrough.
- changelog: 2026-10-29: corrected "Access tokens can expire after eight hours with a refresh token that expires aft" to "The registration form has 'Expire user access tokens' ticked by default, which p" after the walkthrough.
- changelog: 2026-10-29: corrected "The app gets a unique Client ID and Client Secret." to "The Client ID is shown at once; a client secret is created only after clicking '" after the walkthrough.
