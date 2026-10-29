# Walkthrough merge diff: discord

Merged 2026-10-29. Draft -> merged.

- attemptLevel: L2 -> L3
- attemptLevelReason: Gate probed: 2 page(s) requested read-only on 2026-10-29; public path followed for 2 page(s) (js shell unclear). No account was used. -> Signed-in walkthrough on 2026-10-29 (free account, separate browser profile) stopped at before revealing a client secret or bot token: guide steps 3 to 5 were read, not completed; steps 6 to 11 were not attempted, because a human is needed for: legal_acceptance.
- Step 1 evidence: documented -> tested
- Step 3 tags: ["config_check"] -> ["config_check","legal_acceptance"]
- Step 3 actor: agent -> you
- Step 3 evidence: documented -> tested
- Step 4 evidence: documented -> tested
- Step 5 evidence: documented -> tested
- requirements[0]: "A Discord account is needed to register an application in th" (documented) -> "Creating the app needs a Discord account and ticking agreement to the Developer " (tested)
- scopesAndNuances[5]: "A community report says the Developer Portal's display of pu" (reported) -> "The General Information page shows the Application ID and a Public Key; the Clie" (tested)
- unverified (added): Steps 2, 6, 7, 8, 9, 10, 11 were not walked through (the walkthrough stopped at before revealing a client secret or bot token: guide steps 3 to 5 were read, not completed; steps 6 to 11 were not attempted); they stay as documented, not observed.
- unverified (added): Cleanup was incomplete after the walkthrough: a test app may still exist.
- unverified (removed): No account was used: steps after the first sign-in are inferred from documentation, not observed.
- changelog: 2026-10-29: signed-in walkthrough merged (level L3).
- changelog: 2026-10-29: corrected "A Discord account is needed to register an application in the Developer Portal a" to "Creating the app needs a Discord account and ticking agreement to the Developer " after the walkthrough.
- changelog: 2026-10-29: corrected "A community report says the Developer Portal's display of public key and secret " to "The General Information page shows the Application ID and a Public Key; the Clie" after the walkthrough.
