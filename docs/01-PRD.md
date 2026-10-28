# OAuthPath — Product Requirements Document

Status: v4 (research agent, attempt levels, handoff rule, gate probe + public flow trace + provider metadata, Attempt Kit) · Owner: Ayushmaan · Consumer: Claude Code (implementing agent)
Working name: **OAuthPath** (rename freely).

---

## 1. One-paragraph summary

Developers building AI agents need their users to connect third-party apps (Gmail, Slack, Notion...). For many apps, the developer must first register their own **OAuth app** with the provider and sometimes get it **approved**. Nobody tells them up front whether that is a 30-minute task or a multi-week process. OAuthPath is a web product where a developer looks up an app (or types any app name/URL) and gets a **shareable guide** that leads with an honest **verdict** (how hard, how long, what blocks approval), then gives the steps, the blockers and fixes, and a clear split between what an agent can do and what the human must do. Every claim is labelled by how well it is evidenced (Tested / Documented / Reported / Unverified).

## 2. Background (for implementers with no domain context)

- **OAuth**: the "Sign in with Google / Allow access" mechanism. It lets a user grant software limited access to their account at another company without sharing a password.
- **Provider**: the company whose app is being connected (Google, Slack, Notion, LinkedIn...).
- **OAuth app**: a registration the *developer* creates with the provider ("my product wants these permissions"). The provider returns a client ID and secret. Some providers require review before the app can be used by the public.
- **User connection**: each end user clicking "Allow" on the consent screen. It only works if the OAuth app exists and is permitted.
- **Composio**: a platform that sits between AI agents and apps, handling tool definitions, login flows, token storage/refresh and API calls. It offers **managed OAuth**: for many apps Composio supplies one shared OAuth app so the developer skips registration. For other apps, or when the developer wants their own branding/scopes/rate limits, the developer must **bring their own (BYO) OAuth app**. The BYO path is where the pain returns, and is what this product addresses.
- The assignment this builds towards comes from Composio. Its directory: https://docs.composio.dev/toolkits/managed-auth (note: it renders client-side; may need a browser or alternate source to read).

## 3. Problem

Today a developer pieces together docs, unfamiliar console flows and provider emails. They cannot tell:
1. How hard it is (instant credentials vs. review vs. partnership gate).
2. How long (an hour vs. weeks of waiting).
3. What blocks approval (verified domain, privacy policy, demo video, security assessment, business account, paid plan...).
4. Whether managed OAuth is enough, or when they must switch to their own app.
5. What an agent can do for them and where they must take over.

Unknown timelines are the real cost: a launch plan built on "OAuth takes a day" collapses when it takes a month.

## 4. Target user

**Primary persona: "Launch-minded agent builder".** A developer (or small team) building an AI agent/product that will connect *their customers'* accounts to third-party apps. They are close to, or planning, a real launch. They are technically capable but new to this specific provider's OAuth process.

Out of scope personas (state in README): hobbyists connecting only their own account (no approval needed), and enterprise IT/security reviewers.

## 5. Jobs to be done

1. "Before I commit to this integration, tell me how painful the OAuth setup will be."
2. "Tell me exactly what to do first, then next."
3. "Tell me what will slow or block approval and what to do when it does."
4. "Tell me whether I can launch on managed OAuth and when I must go custom."
5. "Give me something I can paste to my teammate/PM/CTO."

## 6. Product principles

1. **Verdict first.** Lead with judgment (difficulty, time, approval risk), not a docs summary.
2. **Honest evidence.** Never present a guess as a fact. Every claim carries an evidence label, source, and retrieval date. "Unverified" is a valid and prominent state.
3. **Ranges over false precision.** Show time as ranges with the basis ("docs say 3–5 business days; community reports up to several weeks").
4. **Actionable ordering.** The reader should always know the next action and who owns it (agent, human, or provider wait).
5. **Shareable by default.** Every guide has a stable URL and a plain-text/markdown copy.
6. **Graceful degradation.** A live run that cannot finish still shows what it found, labelled, never a blank error.
7. **Observe, don't just read.** The brief asks agents to attempt as much of the setup as is practical and to let what they discover shape the guidance. Attempts (probes, console walkthroughs, signed-in walkthroughs) are first-class: observations rewrite the verdict, steps, time/effort and handoff table, and corrections to documentation are shown.
8. **Say how far we observed.** Every guide states its **attempt level** (8.3). We never imply a live guide was verified the way a library guide was.
9. **Agency where the problem is open-ended, control where trust is at stake.** In live mode a *bounded research agent* decides what to search and read (an unfamiliar app needs adaptive investigation). Everything that decides labels, difficulty, validation and saving is deterministic code or a single constrained LLM call. See the pipeline classification in the engineering spec, section 6.0.

## 7. Scope

### 7.1 In scope (MVP, take-home slice)

| # | Feature | Notes |
|---|---|---|
| F1 | **Library** of deeply researched guides for **3 varied apps** (4th is stretch) | Static content generated offline with the deep pipeline, then **signed-in walkthrough attempts** (required for at least 2 apps, using a free account) and verification. Apps are chosen so that a free-account attempt is possible |
| F2 | **Search/lookup** across the library | Name match; shows difficulty badge |
| F3 | **Live generation**: user submits app name or website; a **bounded research agent** investigates (searching and reading adaptively against a checklist, with hard limits); the guide is then produced by fixed stages, shown with live progress, and saved at a stable URL | Works for apps outside library. The user sees the agent's steps ("Searching developer docs...", "Reading review policy...") and which checklist items could not be covered |
| F4 | **Guide page** with the standard structure (Section 8) | Same renderer for library and live guides |
| F5 | **Evidence system**: label per claim, sources list, "what we tested" and "what we could not verify" panels | Core differentiator |
| F6 | **Share**: stable URL, copy-link, copy-as-markdown | |
| F7 | **Method page** (`/about`): explains pipeline, evidence labels, difficulty rubric, limitations | |
| F8 | **Verification log**: a documented sample check of library guidance against real sources/attempts: what was confirmed, corrected, unverifiable | Delivered as `content/verification/*.md` and linked from /about |
| F9 | **README** with setup, key decisions, limitations | Assignment deliverable |
| F10 | **Handoff rule**: each step is tagged with what it requires (login, payment, identity, legal acceptance, review wait, text drafting, etc.) and **code** assigns the owner (agent / you / provider wait) | Replaces model judgment for the "what an agent can do vs. where you take over" table |
| F11 | **Gate probe, public flow trace, and provider metadata check (live and library)**: safe read-only requests classify each step's URL (public / login redirect / CAPTCHA or bot check / forbidden / not found / input required / unclear JavaScript shell); a **flow trace** follows the public path hop by hop (max 5, links only, never typing or submitting) and records where it ends; a **metadata check** reads the provider's public OAuth metadata (endpoints, listed scopes, PKCE, whether dynamic client registration is supported) | Gives live guides an *observed* public path and first gate. Deterministic code, with at most a few tiny model calls to choose the next link when rules are unclear |
| F12 | **Signed-in walkthrough (library)**: Claude Code drives the owner's signed-in browser through the real setup with a free account, stops before irreversible or human-only steps, and logs what happened. Observations **rewrite** the guide | Follows the protocol in spec 6.9; requires owner consent |
| F13 | **Attempt Kit (live guides)**: a generated, copy-paste prompt the *visitor* runs with their own browser-capable agent and their own free account to attempt the setup themselves; the agent stops at human-only steps and returns a log | The visitor performs this step; nothing runs in anyone else's accounts. Results stay with the visitor (not published as "Verified") |

### 7.2 Stretch (only if time remains, in this order)

1. Agent-prepared drafts inside guides (scope-justification text, privacy-policy checklist, redirect URI checklist).
2. Composio managed-OAuth status field per app (with source), if reliably retrievable.
3. "Re-verify" button that re-runs the live pipeline on a library guide and shows a diff.
4. Library grows to 4+ apps.
5. Hosted headless browser for the flow trace on JavaScript-rendered pages (click links and non-submitting controls only, never type).
6. Opt-in sharing of visitor Attempt Kit logs as a clearly weaker "Community-attempted" label.

### 7.3 Non-goals

- All 100 apps. (The system must be *capable* of producing them; a `scripts/` batch path is enough.)
- User accounts, auth, payments, comments.
- Actually completing any provider approval or using paid accounts.
- Storing or handling any OAuth credentials or user tokens.
- Running signed-in browser automation on the server in live mode (no stored provider logins; no actions in anyone's accounts from the website).
- A central request queue for signed-in verification (replaced by the visitor-run Attempt Kit).
- Production hardening beyond sensible rate limiting and input validation.

## 8. The guide: content model (what the user sees)

Every guide uses one fixed structure, top to bottom:

1. **Header**: app name, logo-free (no scraped logos), provider site, "Library (deep research)" or "Live-generated" badge, generated date, **confidence summary** (counts of Tested/Documented/Reported/Unverified claims) and the **attempt level** (8.3).
2. **Verdict card** (the most important element)
   - Difficulty: `Easy | Moderate | Hard | Gated` (see rubric 8.1)
   - Time to first working credentials (range + basis)
   - Time to production-ready / approval wait (range + basis, or "no approval required")
   - Effort (hours of human work, range)
   - One-sentence summary a PM could repeat.
   - "Biggest risk to your launch date."
3. **Managed vs. your own app**: when Composio-style managed OAuth is enough for prototyping, when you must bring your own, and why (branding, scopes, rate limits, approval gating). Shows `composioManaged: yes | no | unknown` if known, with source.
4. **Before you start (requirements)**: accounts, business/individual verification, paid plan needs, domain ownership, privacy policy/terms URLs, HTTPS redirect URIs, demo video, security assessment, etc. Each as a checklist item with an evidence label.
5. **Step-by-step path**: ordered steps. Each step has: title, who acts (`agent | you | provider-wait`), estimated time, link to the exact provider page, and evidence label.
6. **Scopes and nuances**: scope classes (e.g., sensitive vs. restricted), testing-mode limits (test users caps, token expiry in testing), unverified-app warnings, rate limits, quirks.
7. **Blockers and fixes**: common rejection/stall reasons → what to do → who to contact/where to appeal.
8. **What an agent can do vs. where you take over**: handoff table **derived by code** from per-step requirement tags (8.4), each row showing whether the split was *observed* (we hit that gate) or *inferred* (from documentation). Be concrete (e.g., "Agent can draft your scope justification; you must record the demo video and click submit").
9. **How far we observed, what we tested, what we couldn't verify**: attempt level badge; the **public path we could follow** (flow trace: each hop, where it ended and why) and gate probe results (URL, classification, date); **provider metadata** observations (endpoints, listed scopes, PKCE, dynamic registration) where published; for library guides, the attempt log (steps taken, date, where it stopped and why a human is needed, documentation corrections found); and a list of open uncertainties.
10. **Sources**: numbered list: title, URL, retrieved-at date, which claims it supports.
11. **Next action**: single sentence "Do this next".
12. **Upgrade this guide (Attempt Kit)**: shown on live-generated guides (and optionally library guides): explains the visitor-run attempt and offers the copy-paste kit (8.5).

### 8.1 Difficulty rubric (shown on /about; computed in code from factors)

Factors extracted per app (each enumerated, not free text):

| Factor | Values |
|---|---|
| registration_friction | instant / account_needed / paid_or_business_account |
| review_required | none / for_public_use / for_sensitive_scopes / always |
| review_depth | none / automated / manual / security_assessment / partnership_contract |
| docs_quality | clear / partial / poor |
| approval_wait_basis | documented / reported / unknown |
| special_requirements | list (domain verification, demo video, privacy policy, DPA, etc.) |

Mapping (initial; tune after the research spike):
- **Easy**: instant or account_needed, review none or only for public marketplace listing.
- **Moderate**: manual review or several special requirements, wait measured in days.
- **Hard**: sensitive/restricted-scope review, or security assessment, wait measured in weeks.
- **Gated**: partnership/contract/approval required to get access at all, or paid/business account mandatory.

The LLM fills the factors; **code** maps them to the difficulty label. This keeps the verdict explainable and consistent.

### 8.2 Evidence labels (definitions are product-critical)

| Label | Meaning | Requirement |
|---|---|---|
| **Tested** | We performed or observed it directly | Must state what was done, date, and where it stopped (e.g., "opened developer console; stopped at sign-in wall"). |
| **Documented** | An official provider source states it | Must link the source and retrieval date. |
| **Reported** | Community/third-party only (forums, blogs, Q&A) | Must link source; displayed as weaker. |
| **Unverified** | Inferred, conflicting, or no source | Shown prominently; never used for the headline time estimate without saying so. |

Rules: a claim with no source cannot be Documented or Reported. Time estimates inherit the weakest evidence behind them. Conflicting sources → state both, label Unverified or Reported. `Tested` is allowed only for what was actually observed at the attempt level reached (e.g., "GET of this URL redirected to a sign-in page on <date>"); it never extends to what lies behind the gate.

### 8.3 Attempt levels (shown on every guide)

| Level | Name | What was done | Where it appears |
|---|---|---|---|
| **L1** | Docs read | Sources read and synthesized | Every guide (minimum) |
| **L2** | Gate probed | Each step URL requested read-only; the public path followed hop by hop (flow trace) to the first access gate; provider metadata read where published. Library guides also reach the sign-in wall in a real browser | Live (probe, trace, metadata) and library |
| **L3** | Signed-in walkthrough | A free-account walkthrough in a real browser up to the first step that only a human can do (verification, payment, identity, legal acceptance, review submission) | Library guides (required for at least 2); visitor-run via Attempt Kit (private to the visitor) |

The attempt level never exceeds what was actually done. A live guide is at most L2.

### 8.4 Handoff rule (who does each step)

Each step carries `requires: RequirementTag[]` from a fixed list. **Code**, not the model, maps tags to the owner:

| Tag | Examples | Owner effect |
|---|---|---|
| `login_or_account` | create/sign in to developer account | You |
| `email_or_phone_verification`, `two_factor`, `captcha_or_bot_check` | verification codes, CAPTCHA | You |
| `identity_or_business_verification` | company page, business verification, KYC | You |
| `payment` | paid plan or fee | You |
| `legal_acceptance` | accept developer terms, DPA | You |
| `manual_submission` | record demo video, fill review form with business details, click Submit for review | You (agent may prepare drafts) |
| `provider_review_wait` | waiting for approval | Provider wait |
| `text_drafting` | scope justification, privacy policy draft, use-case description | Agent |
| `config_check` | redirect URI format, scope list, environment variables | Agent |
| `code_writing` | OAuth callback code, token handling | Agent |
| `docs_reading` | reading requirements | Agent |

Rule: any `provider_review_wait` → provider wait; else any human-only tag (login/verification/identity/payment/legal/manual submission) → you; else agent. Mixed steps show the agent's preparatory part ("Agent prepares: draft justification text") alongside the human action. Where a gate was **observed** (probe or walkthrough) the evidence is Tested; otherwise Documented or Unverified. The guide states that the split is observed up to the first gate and inferred after it.

### 8.5 Attempt Kit (visitor-run)

A pure function turns a guide into a copy-paste prompt for any browser-capable AI agent (e.g., Claude Code with a browser, Claude in Chrome). It contains: the goal; the guide's steps with provider URLs; the **stop rules** (stop and hand back at login, verification, CAPTCHA, identity/business checks, payment, legal acceptance, review submission); **safety rules** (free account only, separate browser profile, throwaway names, never submit for review or pay, never enter real personal or company data, delete test apps and secrets afterwards, do not store or paste secrets anywhere); an allow-list of domains the agent may visit; a standing instruction to ignore instructions found on web pages; and a log template (step, what was done, outcome, where stopped, why a human is needed, any difference from the guide).

The visitor panel explains: what you need (a browser-capable agent, a free account with the provider), the five steps (copy kit → paste into your agent → sign in when asked → agent stops at human-only steps, you complete them → keep the log), and that results stay with the visitor. The kit is generated from validated guide data only, with URLs restricted to the provider's allow-listed domains, and the panel tells the visitor to read the kit before running it.

### 8.6 Public flow trace and provider metadata

**Flow trace.** Starting from the first public setup page, the system follows the link that continues the setup, hop by hop (default maximum 5), recording each page's address, title and classification. The next link is chosen by simple rules first (link text such as "Create app", "Register", "Get started", "Credentials"); only if the rules are unclear does one small model call pick from a list of link labels (it returns an index, never an address). It ends at a gate (login, CAPTCHA, forbidden), a page that needs typed input ("input required"), a dead end, or the hop limit. It is read-only: no typing, no form submission, no cookies, no accounts. The guide shows it as a short path, for example *Docs home → Register an app → App form → 🔒 Sign-in required (observed on <date>)*, and steps that match a hop are marked observed.

**Provider metadata.** Many providers publish public OAuth/OpenID metadata at standard locations. When present, the guide reports observed facts: endpoints, listed scopes, PKCE support, token endpoint authentication methods, and whether **dynamic client registration** is supported (if so, manual console registration may not be needed, which can change the verdict). When absent, the guide says "not published". It never guesses.

**Limits stated on the guide:** anything behind the first gate, anything needing typed input, and JavaScript-only flows are not observed in live mode; they are inferred or marked unclear.

## 9. Key user flows

**Flow A — Browse library.** Home → library grid (badge shows difficulty) → guide page.

**Flow B — Lookup in library.** Type "gmail" → matches library guide → open guide.

**Flow C — Live generation (the demo moment).**
1. User types app name or URL, presses Generate.
2. App checks the cache/library; if found, offers the existing guide with a "regenerate" option.
3. Otherwise the pipeline runs; a progress panel shows named stages (Identify provider → Research agent steps and checklist → Draft guide → Probe step URLs and trace the public path → Check provider metadata → Assign who-does-what → Self-check).
4. Sections appear as they complete; the final guide is saved at `/guide/<slug>`.
5. If something fails or times out: show partial guide with Unverified labels and a clear "incomplete" banner. Offer retry.

**Flow D — Share.** Copy link or copy markdown from the guide header.

**Flow E — Upgrade a live guide (visitor-run).** On a live guide the visitor opens "Upgrade this guide", reads the explanation, copies the Attempt Kit, pastes it into their own browser-capable agent, signs in to a free provider account when asked, completes any human-only steps the agent hands back, and keeps the resulting log. The site shows this as optional and states plainly that it requires the visitor's own agent and account.

**Flow F — Build a library guide (owner, offline).** Deep pipeline generates the draft (L1/L2) → owner consents and signs in to a free account in a separate browser profile → Claude Code runs the signed-in walkthrough per spec 6.9 → observations are merged and rewrite verdict, steps, time/effort, handoffs → verification sample is checked → guide is published at L3 (or L2 with the reason stated).

## 10. Demo apps (library) — selection criteria and hypotheses

Pick apps spanning the difficulty range. **These are hypotheses to be confirmed by the research spike (Sprint 1); do not assert them as facts in the product.**

| Slot | Hypothesis | Why it's useful |
|---|---|---|
| Easy | GitHub (OAuth App / GitHub App) | Likely instant credentials; also a nuance: OAuth App vs GitHub App choice |
| Moderate | Slack or Notion | Likely instant for internal use, review for public distribution/listing |
| Hard | Google (Gmail scopes) | Sensitive/restricted scope verification; testing-mode limits; possible security assessment |
| Gated | LinkedIn (or another partner-program provider) | Access to useful scopes may require program approval |

**Library size and feasibility:** 3 apps are required, chosen so that a free-account signed-in attempt is realistically possible (GitHub is the likely easy case; Google's consent-screen and scope flow can be explored with a free Cloud account without submitting for verification). A provider whose first step needs a company page, paid plan or partner approval may stay at L2 with the reason documented; that is a valid, informative result. A 4th app is stretch.

If a hypothesis turns out wrong (e.g., the "gated" app is actually easy), swap the app or report the surprise: *what we learned* is valued over confirming expectations.

**Unfamiliar-app test set** (to rehearse live generation before the demo, none in the library): e.g., Zoom, Dropbox, HubSpot, Atlassian, Spotify, Shopify, X/Twitter, plus one obscure app and one app with no OAuth (should fail gracefully and say so).

## 11. Success criteria

Mapped to the assignment's evaluation:

1. **Understanding of the problem**: verdict-first guides; managed vs. BYO framing; /about explains why.
2. **Useful guidance**: a developer can follow a guide without outside help; each step has an owner and a link.
3. **Judgment about evidence**: every claim labelled; verification log shows corrections and unverifiable items.
4. **Thoughtful use of agents**: documented pipeline classification (deterministic vs. single LLM call vs. agentic); a bounded research agent in live mode with visible steps and coverage gaps; agentic browser attempts and claim verification (Claude Code) in deep mode; clear agent/human split inside each guide; offline deep mode vs. live fast mode, explained honestly.
5. **It works live**: an unfamiliar app produces a coherent guide in under ~2 minutes (target), with graceful degradation when it can't.

Acceptance checks (all must pass before submission):
- [ ] 3 library guides render, each with all applicable sections (1–11; section 12 optional on library guides), valid schema.
- [ ] At least 2 library guides reach L3 with an attempt log (date, steps, where stopped, why human needed) that visibly changed the guide (e.g., a documentation correction, a measured time-to-credentials, or an observed handoff).
- [ ] Every live guide shows an attempt level, gate probe results, and an Attempt Kit panel; the kit text passes its tests (stop rules, allow-list, safety rules present).
- [ ] Live guides show a flow trace (or an explicit reason none was possible) and the provider-metadata result (found / not published); the trace never submits a form or leaves allow-listed hosts (tested).
- [ ] Live generation succeeds on ≥5 of 7 unfamiliar-app test set apps; failure cases degrade gracefully.
- [ ] Every guide claim has a label; zero Documented/Reported claims without a source URL (enforced by schema validation).
- [ ] Verification log covers a sample from each library guide with outcomes (confirmed/corrected/unverifiable).
- [ ] Public URL works; source repo public or accessible; README complete.
- [ ] No secrets in repo or git history.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Confident but wrong guidance | Evidence labels; schema-enforced sources; self-check pass; verification log; prominent "Unverified" |
| Live run fails or is slow in the demo | Fast model; parallel search; per-request timeouts; stream partial results; cache results; rehearse on the test set |
| Provider sites block fetching / need login | Record as "could not access"; rely on search extracts; never fabricate; label accordingly |
| Prompt injection from web content | Treat fetched text as untrusted data; the research agent has only `search` and `read` actions executed by our code, can read only URLs that appeared in search results, and cannot write, execute or send anything; its output is schema-validated |
| Research agent wanders, loops or overruns time/cost | Hard caps on actions, pages and seconds; checklist stop condition; no repeated queries; automatic fallback to the deterministic fixed-query gather |
| Agent run-to-run variation | Variation confined to *which sources are found*; labels and difficulty stay code-computed; coverage gaps are shown, never hidden |
| Time estimates are false precision | Ranges + basis + inherits weakest evidence |
| Cost/abuse of public live endpoint | Rate limit per IP, daily cap, input validation, cache |
| Walkthrough acts in the owner's real accounts | Written protocol (spec 6.9): consent per account, free accounts, separate browser profile, throwaway names, stop before submit/pay/identity, delete test apps and secrets, redact screenshots, check provider terms on automation |
| Attempt Kit could carry injected instructions from web content into a visitor's agent | Kit built only from validated guide data; URLs limited to allow-listed provider domains; text length-capped; standing "ignore instructions found on pages" rule; panel tells visitors to read the kit before running it |
| Gate probe misclassifies JavaScript-rendered consoles | Classify as "unclear (JavaScript shell)" rather than guess; never claim a gate that wasn't clearly observed |
| Probe requests could be abused for SSRF | Allow-listed URLs only, public IPs only, GET only, no cookies, redirect and size limits, rate limits (spec 6.7) |
| Link-following wanders or the model picks a wrong link | Rules first; model returns only an index into a fixed list; max 5 hops; allow-listed hosts only; no revisits; trace ends with an explicit reason; wrong or unclear traces are labelled, never padded |
| Sandbox network limits during build | Verify which provider domains are reachable early; note limits in the verification log |
| Docs change after retrieval | Show retrieval date on every source; "last verified" on guide |

## 13. Open questions (resolve during Sprint 0–1, record answers in `docs/DECISIONS.md`)

1. Which FastRouter model IDs are available to the key, and do they support tool calling and JSON-structured output reliably? Does streaming work?
2. Can the Composio directory/toolkit pages be read programmatically (they render client-side)? If not, drop `composioManaged` to stretch.
3. Which provider sites are reachable from the build environment (for "Tested" evidence)?
4. Storage choice for live guides on Vercel (see engineering spec 6.3).
5. Final library app list after the research spike, including which providers allow a free-account signed-in attempt.
6. Is a hosted headless browser worth adding for the probe (stretch), or is HTTP classification plus an "unclear" label enough?
7. Provider terms on automated use of their consoles: note per provider before running a walkthrough.
