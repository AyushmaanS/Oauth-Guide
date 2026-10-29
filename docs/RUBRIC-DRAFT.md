# Difficulty rubric — DRAFT v0 (Sprint 1), to become `src/lib/rubric.ts`

Computed by code from enumerated factors. The LLM fills factors; it never picks the label.
Drafted from the Sprint 1 notes (GitHub, Slack, Notion, Google/Gmail, LinkedIn). Thresholds are first guesses, tested against these five apps only.

## Factors (spec 5, plus two proposed additions marked NEW)
registrationFriction · reviewRequired · reviewDepth · docsQuality · waitBasis · specialRequirements[]
- NEW `useCase`: the use case the verdict is computed for (text, e.g. "agent reads and sends a customer's Gmail"). Needed because difficulty depends on scope tier: Google is easy for sign-in only and hard for Gmail read; LinkedIn is self-serve for sign-in/share and gated for page management.
- NEW `businessEntityRequired`: yes | no | unknown. LinkedIn's Community Management tier needs a registered legal organisation and a verified company Page admin; this is different from "paid" and decides "gated".

## Mapping (evaluated top to bottom, first match wins)
1. **gated** if `reviewDepth = partnership_contract`, OR `registrationFriction = paid_or_business_account`, OR `businessEntityRequired = yes` for the stated use case.
2. **hard** if `reviewDepth = security_assessment`, OR (`reviewRequired = for_sensitive_scopes` AND `reviewDepth = manual`) for the stated use case, OR documented/reported wait is weeks.
3. **moderate** if `reviewRequired` is `for_public_use` or `always` with `manual`/`automated` review, OR `specialRequirements.length >= 3`.
4. **easy** if registration is `instant` or `account_needed` AND review is `none` (an optional marketplace listing does not count).
5. **unknown** if the factors needed for rules 1–4 are `unknown` (never guess a label).

## Back-test against the notes (suggested values come from the research notes; unverified until Sprint 6)
| App (use case) | Factors | Label |
|---|---|---|
| GitHub (OAuth/GitHub App for customers) | instant, none, none, clear; wait unknown; note: customer orgs must approve OAuth Apps | easy |
| Slack (unlisted public distribution) | account_needed, none for unlisted; Marketplace is 10 business days + up to 10 weeks and needs 10 active workspaces | easy for unlisted, hard if Marketplace is required — a use-case split |
| Notion (public connection) | unclear: docs say the credentials appear after "submit for review" — unresolved | unknown until resolved |
| Google/Gmail (read/send mail) | account_needed, for_sensitive_scopes (send) / restricted (read), manual + security assessment (CASA) if server-stored; about 6 weeks documented | hard |
| LinkedIn (sign-in/share only) | account_needed, none, none | easy |
| LinkedIn (Community Management / page management) | legal organisation + verified Page admin, manual review, no fixed wait | gated |

## Things reality changed
- A single label per app is misleading for Slack, Google and LinkedIn. **Proposal:** every guide states its `useCase` in the verdict, and the library guides cover the use case an agent builder most likely has (Gmail read/send; LinkedIn posting for members; Slack unlisted install).
- "Wait" matters as much as review type: Google restricted ≈ 6 weeks (documented) vs Slack Marketplace up to 10 weeks.
- Customer-side approval (GitHub org owners must approve OAuth Apps) is a launch blocker that no provider review captures; shown as a requirement/blocker, not in the label.
