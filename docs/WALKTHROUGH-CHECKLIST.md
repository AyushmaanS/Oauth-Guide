# Walkthrough checklist (owner + Claude Code)

Applies the approved `docs/ATTEMPT-PROTOCOL.md`. Nothing starts until the owner has written a consent line for that provider in `docs/DECISIONS.md`.

## Which providers

| Provider | Terms finding (from RESEARCH-NOTES) | Plan |
|---|---|---|
| GitHub | A human must create the account; automation that is "excessive bulk" is banned. One short walkthrough on the owner's own account is not bulk. | Run (L3 target) |
| Google (Gmail) | No clause bans an AI agent in the owner's own console session; Google may block sign-in from automated browsers. | Run, with the owner signing in first themselves in the project's browser profile (L3 target) |
| LinkedIn | User Agreement bans "bots or other unauthorized automated methods"; reading is ambiguous but leans forbidden. | **No walkthrough.** Guide stays L2 with this reason. |

## Before we start (owner)

1. Create a Chrome profile used only for this project (Chrome → profile icon → Add). Do not use your everyday profile.
2. In that profile, sign in yourself to a **free** GitHub account. Complete any 2FA yourself. Do not add a payment method.
3. For Google: sign in yourself to a **free** Google account in the same project profile (a separate Google account created only for this is best). Do not enable billing or a free trial.
4. Tell me in chat: "I consent to a walkthrough on <provider>, free account only." I then record it in `docs/DECISIONS.md` with the date.
5. Keep the profile's browser window open and stay nearby: I will stop and ask you at every login, verification, 2FA, CAPTCHA, terms, payment, or review-submission screen.

## During (Claude Code)

- Follow the guide's steps in order, visiting only the provider's allow-listed domains.
- Names: `oauthpath-test-<YYYYMMDD>`; redirect URI `http://localhost:3000/callback` or `https://example.com/callback` only.
- Record each action as an attempt step (observation ≤ 200 characters, no secrets).
- Never click Submit for review/verification. Never copy a client secret anywhere. Never record real emails or account ids.

## After

1. Delete the test app(s); revoke any tokens; confirm secrets are gone. Record `cleanup`.
2. Save the redacted log to `content/attempts/<slug>.json`.
3. `npm run merge -- <slug>` (writes the guide and `content/verification/<slug>-merge-diff.md`).
4. Verification pass → `content/verification/<slug>.md`.
