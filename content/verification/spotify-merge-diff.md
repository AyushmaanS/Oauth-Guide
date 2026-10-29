# Walkthrough merge diff: spotify

Merged 2026-10-29. Draft -> merged.

- attemptLevel: L2 -> L3
- attemptLevelReason: Gate probed: 6 page(s) requested read-only on 2026-10-29; public path followed for 5 page(s) (depth limit). No account was used. -> Signed-in walkthrough on 2026-10-29 (free account, separate browser profile) stopped at before viewing the client secret or using the Web API (greyed out on a free account): guide steps 1, 3 and 4 were observed, steps 2 and 5 to 9 were not attempted, because a human is needed for: email_or_phone_verification, legal_acceptance.
- Step 1 tags: ["login_or_account"] -> ["login_or_account","legal_acceptance","email_or_phone_verification"]
- Step 1 evidence: unverified -> tested
- Step 3 tags: ["config_check"] -> ["config_check","legal_acceptance"]
- Step 3 actor: agent -> you
- Step 3 evidence: documented -> tested
- Step 4 tags: ["config_check","docs_reading"] -> ["config_check"]
- Step 4 evidence: unverified -> tested
- requirements[0]: "A Spotify developer account to create and manage Client IDs " (documented) -> "A Spotify account (a free one worked) plus accepting the Developer Terms and a v" (tested)
- scopesAndNuances[6]: (new) -> "The new app was created in Development mode, with a 180-day refresh token lifeti" (tested)
- unverified (added): Steps 2, 5, 6, 7, 8, 9 were not walked through (the walkthrough stopped at before viewing the client secret or using the Web API (greyed out on a free account): guide steps 1, 3 and 4 were observed, steps 2 and 5 to 9 were not attempted); they stay as documented, not observed.
- unverified (added): Cleanup was incomplete after the walkthrough: a test app may still exist.
- unverified (removed): No account was used: steps after the first sign-in are inferred from documentation, not observed.
- changelog: 2026-10-29: signed-in walkthrough merged (level L3).
- changelog: 2026-10-29: corrected "A Spotify developer account to create and manage Client IDs in the Spotify dashb" to "A Spotify account (a free one worked) plus accepting the Developer Terms and a v" after the walkthrough.
- changelog: 2026-10-29: corrected "New apps run in Development Mode." to "The new app was created in Development mode, with a 180-day refresh token lifeti" after the walkthrough.
