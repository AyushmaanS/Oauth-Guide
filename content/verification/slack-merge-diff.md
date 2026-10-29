# Walkthrough merge diff: slack

Merged 2026-10-29. Draft -> merged.

- attemptLevel: L2 -> L3
- attemptLevelReason: Gate probed: 7 page(s) requested read-only on 2026-10-29; public path followed for 2 page(s) (js shell unclear). No account was used. -> Signed-in walkthrough on 2026-10-29 (free account, separate browser profile) stopped at before adding scopes or installing: guide steps 1, 2 and 4 were read, steps 3 and 5 to 9 were not attempted, because a human is needed for: login_or_account.
- Step 1 tags: ["login_or_account"] -> ["login_or_account","config_check"]
- Step 1 evidence: documented -> tested
- Step 2 tags: ["config_check","docs_reading"] -> ["config_check"]
- Step 4 evidence: reported -> tested
- requirements[0]: "A Slack account to create the app and reach the App Manageme" (documented) -> "A Slack account is not enough: creating an app also needs a workspace, and the a" (tested)
- scopesAndNuances[8]: (new) -> "Install is disabled until a scope is added, and the Client ID and secrets exist " (tested)
- unverified (added): Steps 3, 5, 6, 7, 8, 9 were not walked through (the walkthrough stopped at before adding scopes or installing: guide steps 1, 2 and 4 were read, steps 3 and 5 to 9 were not attempted); they stay as documented, not observed.
- unverified (added): Cleanup was incomplete after the walkthrough: a test app may still exist.
- unverified (removed): No account was used: steps after the first sign-in are inferred from documentation, not observed.
- changelog: 2026-10-29: signed-in walkthrough merged (level L3).
- changelog: 2026-10-29: corrected "A Slack account to create the app and reach the App Management page, where the c" to "A Slack account is not enough: creating an app also needs a workspace, and the a" after the walkthrough.
- changelog: 2026-10-29: corrected "An access token appears under OAuth Tokens after you install the app." to "Install is disabled until a scope is added, and the Client ID and secrets exist " after the walkthrough.
