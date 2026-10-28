# OAuthPath — Sprint Plan v4 (short, phased, for Claude Code)

v4 adds: bounded research agent (live), handoff rule, gate probe with **public flow trace and provider metadata check**, attempt levels, required signed-in walkthrough for library apps, and the visitor-run Attempt Kit. Read `01-PRD.md` and `02-ENGINEERING-SPEC.md` (sections cited below) before each sprint.

Eight sprints. Each ends with a **checkpoint**: commit, short status note, and (where marked 👤) a pause for the owner.

Rules for every sprint:
- Commit at the end of each task. Run lint and tests before commit. Run `scripts/check-secrets.sh` before every commit once it exists.
- Record decisions and [VERIFY] outcomes in `docs/DECISIONS.md` as you go.
- Never invent provider facts. If unsure, mark Unverified. "Tested" only for what was actually observed, at the level reached (spec 6.3).
- Never act in an account without the owner's consent and the protocol in `docs/ATTEMPT-PROTOCOL.md`.

Owner (non-developer) actions are flagged 👤. Claude Code states exactly what it needs in plain words, step by step.

---

## Sprint 0 — Foundation and assumptions check (≈45 min)

**Goal:** a running skeleton, and every assumption in the spec confirmed or corrected.

Tasks
1. Scaffold Next.js (App Router, TypeScript, Tailwind), ESLint, Prettier, Vitest. Add `.gitignore`, `.env.example`, folder layout from spec section 3. Initial commit.
2. 👤 Owner creates `.env.local` with `FASTROUTER_API_KEY` and `TAVILY_API_KEY` (Claude Code explains how; never asks for keys in chat or in git).
3. Write `scripts/check-secrets.sh` and a git pre-commit hook that runs it.
4. **Assumption spike** (`scripts/spike-env.ts`; print results, never keys):
   - FastRouter: list models available to the key; plain call; JSON-structured output; tool calling (informational); **JSON-action protocol round trip** (model returns a valid `search`/`read`/`finish` object reliably, 10 trials); streaming; latency of two candidate models (fast/cheap vs stronger).
   - Tavily: one search + one extract; latency.
   - Reachability: which provider docs and developer-console domains respond from this environment (GitHub, Google, Slack, Notion, LinkedIn).
   - Probe feasibility: confirm DNS/IP validation approach works in Node on the target runtime.
   - Composio managed-auth directory and toolkit pages: readable programmatically?
5. Choose `MODEL_FAST` and `MODEL_DEEP`; write results to DECISIONS.md.

Exit: `npm run dev` shows a placeholder home; spike output recorded; models chosen; secrets check passes.
Checkpoint 👤: owner reads a 5-line DECISIONS summary.

---

## Sprint 1 — Research spike, feasibility, and protocol (≈90 min) — *content drives schema*

**Goal:** learn what guides must say, which apps can be attempted with a free account, and agree the safety protocol before any walkthrough.

Tasks
1. For GitHub, Slack or Notion, Google/Gmail, LinkedIn: read official OAuth registration and review docs; find community reports on approval time and rejections. Save raw notes to `docs/RESEARCH-NOTES/<app>.md` (sources with URLs and dates, key facts, surprises).
2. **Free-path feasibility per app:** can a free account create an app and get as far as the first human-only step? What does the provider say about automated use of its console (terms)? Record in the notes.
3. Choose the **3 library apps** (4th stretch), spanning Easy → Gated where possible and including at least 2 apps with a feasible free-account walkthrough. Record surprises in DECISIONS.md.
4. Write `docs/ATTEMPT-PROTOCOL.md` from spec 6.9. 👤 Owner reads and approves it.
5. Draft difficulty rubric thresholds from real findings; adjust factors if reality doesn't fit.
6. Build `src/fixtures/sample-guide.json` (clearly fake) in the v3 schema, including requirement tags per step, a few probe results, and an L3 sample attempt log.

Exit: notes for 3–4 apps; library list chosen; protocol approved; rubric draft; fixture ready.
Checkpoint 👤: one-page "what we learned" summary; owner confirms app list and protocol.

---

## Sprint 2 — Schema, rubric, handoff, and the guide UI on fixtures (≈90 min)

**Goal:** the complete reading experience works with static data.

Tasks
1. `schema/guide.ts` (zod) with all `superRefine` rules, including attempt-level consistency and `observationRef`. Tests (positive and negative).
2. `rubric.ts` + tests for every branch.
3. `handoff.ts` (spec 6.6) + exhaustive tests.
4. `validate.ts` guarantees + tests.
5. Components and `/guide/[slug]` from `content/guides/*.json` (use the fixture): verdict card, evidence badges, **attempt level badge**, step list with actor chips and observed/inferred marks, handoff table, probe list, attempt log view, tested/uncertainty panel, sources, share bar, banners.
6. `guideToMarkdown` + snapshot test.
7. Home: library grid + lookup (generation disabled for now). `/about` skeleton.

Exit: the fixture renders every section; invalid JSON in `content/guides` fails the build; tests green; mobile layout acceptable.
Checkpoint 👤: owner reviews the page and gives plain-words feedback.

---

## Sprint 3 — Pipeline, deep mode first (≈120 min)

**Goal:** a CLI that produces a valid, evidence-labelled draft guide (L1) for any app.

Tasks
1. `llm.ts`: FastRouter client; structured-output helper (zod parse, one repair retry); timeouts; backoff.
2. `search.ts`: Tavily wrapper (parallel, timeouts, dedupe, token-budget truncation); `gather/sources.ts` (publisher classification, allow-list of provider domains).
3. `resolve.ts`, `gather/fixed.ts`, `gather/checklist.ts`, `factors.ts`, `synthesize.ts` (**with requirement tags per step**, `agentPrep`), `selfcheck.ts`; prompts in `prompts/` with the untrusted-data wrapper.
4. Orchestrator with `mode`, progress events, deadline handling, partial results (`complete: false`).
5. `scripts/generate-guide.ts` (deep): `npm run guide -- "GitHub"` writes `content/guides/<slug>.json` after validation.
6. Run on the 3 chosen apps; inspect against Sprint 1 notes; fix prompts.
7. Orchestrator tests with mocked LLM/search (soft failures, deadline, repair path, no-OAuth app).
8. Write `docs/PIPELINE.md` (classification as built; note any deviation from spec 6.0).

Exit: 3 draft library guides valid; tests green; weaknesses listed in DECISIONS.md.

---

## Sprint 4 — Live generation with the bounded research agent (≈105 min)

**Goal:** the demo moment works end to end locally.

Tasks
1. **Research agent** (`gather/agent.ts`, `prompts/agent.md`) per spec 6.5 and its unit tests (budgets, URL allow-list, repeats, not_found rule, invalid JSON → fallback, injection fixture). `agent_step` events.
2. Store adapter interface + fs implementation; remote implementation per DECISIONS. 👤 Owner creates the Vercel project and storage when asked (step-by-step).
3. `/api/generate` SSE route: input validation, cache check, rate limit + daily cap, fast-mode pipeline, heartbeat, error/partial handling.
4. `ProgressPanel` (agent steps, sources, checklist coverage) and client flow; navigate to `/guide/[slug]` on completion; incomplete banner.
5. `scripts/smoke-live.ts` over the unfamiliar-app set (Zoom, Dropbox, HubSpot, Atlassian, Spotify, Shopify, X; plus an obscure app, a non-OAuth app, a nonsense string). Record timings, failures.
6. **Agent vs fixed comparison** on 5 of those apps (official-source count, checklist coverage, duration, call counts, quality). Keep the agent only if at least as good; otherwise default to fixed gather and say so.
7. Fix top failure modes.

Exit: ≥5 of 7 unfamiliar apps give coherent guides in ~2 min locally; agent budgets and fallback verified; graceful degradation; rate limit verified; comparison recorded.
Checkpoint 👤: owner tries two apps of their choice and reports anything confusing.

---

## Sprint 5 — Gate probe, flow trace, provider metadata, handoff wiring, Attempt Kit (≈145 min)

**Goal:** every live guide shows the public path we could follow, the observed first gate, any published provider metadata, and a visitor-run upgrade path.

Tasks
1. `probe/safefetch.ts` and `probe/classify.ts` per spec 6.7 with the full SSRF/robots/size/time tests and classifier fixtures (including `input_required`).
1b. `probe/trace.ts` per spec 6.7.1: rule-based link choice first, optional one-call model chooser returning an index only, hop/time limits, stop conditions, no form submission. Tests as listed in spec section 11 (including hostile link text). Manually inspect traces on the 3 library apps and 5 unfamiliar apps; record how often the trace reached a clear gate, ended at `input_required` or `js_shell_unclear`, or went wrong.
1c. `probe/metadata.ts` per spec 6.7.2 with tests. Record which test apps publish metadata and whether any support dynamic registration.
2. Wire stages 5b (probe, trace, metadata) and 5c (handoff, attempt level) into the pipeline; `probe_result` / `trace_hop` events; `ProbeList`, `FlowTraceView` and `ProviderMetadataPanel` UI.
3. `attemptkit.ts` + tests (spec 6.8) and `AttemptKitPanel` with preview, copy button, the five plain-language steps, the "read before you run" notice, and the statement that results stay with the visitor.
4. Re-run the smoke script; record how many live guides got at least one clear probe classification, how many traces ended in a gate vs. unclear, and how many had published metadata. Note whether a hosted headless browser is worth it (stretch).
5. Manually dry-run one Attempt Kit with a browser-capable agent on a **library app with the owner's consent**, to check that the kit's stop rules and log template work. Record the result.

Exit: live guides show L2 where probes succeeded, with a flow trace and a metadata result (or the reason they are missing); trace never leaves allow-listed hosts or submits anything (tests); kit tests green; one kit dry run documented.
Checkpoint 👤: owner reads one live guide and its kit as a stranger would.

---

## Sprint 6 — Library walkthroughs, verification, and rewriting guides from observations (≈150 min) — *the credibility sprint*

**Goal:** library guides built from what the agent actually observed, plus an honest verification log.

Tasks
1. For each of the 3 library apps (per protocol, with consent): run the **signed-in walkthrough** (spec 6.9) with a free account up to the first human-only step. Save the redacted `AttemptLog` to `content/attempts/<slug>.json`. If an app cannot be attempted (company page, paid plan, partner approval), record why and keep it at L2.
2. Implement and run `scripts/merge-attempt.ts` (tests first). Confirm each merged guide differs visibly from its pre-walkthrough draft; keep the diff.
3. Verify a sample (≥8 claims per guide, including every time/effort estimate) against primary sources or the attempt log. Write `content/verification/<slug>.md` tables (claim | label | check | outcome | note). Apply corrections to the guide JSON with a changelog line. Downgrade anything unverifiable.
4. Fill `/about`: pipeline classification table, attempt levels, evidence labels, rubric, fast vs deep, walkthrough protocol summary, Attempt Kit explanation, limitations, links to verification logs.
5. Write the "what we learned / corrected / could not verify" summary (for the README).

Exit: all PRD acceptance checks about library content, walkthroughs (≥2 at L3) and verification pass.
Checkpoint 👤: owner reads one library guide fully and flags anything unclear. Owner is needed during walkthroughs to sign in and complete human-only steps.

---

## Sprint 7 — Deploy, polish, README (≈60 min)

**Goal:** a link anyone can use, and a repo anyone can run.

Tasks
1. 👤 Owner pastes keys into Vercel's dashboard (never into chat). Deploy. Confirm `maxDuration` and Fluid Compute in project settings.
2. Run `smoke-live.ts` against the deployed URL; one manual live generation in the browser, including the Attempt Kit panel.
3. Accessibility and responsive pass; empty/error states; 404 with generate CTA.
4. README per spec section 12 (pipeline classification, attempt levels, walkthrough protocol, Attempt Kit, verification summary, limitations).
5. Final secrets sweep over full git history; repo accessible to reviewers.
6. Demo rehearsal checklist: home loads fast; library guide shows verdict, attempt level and attempt log; live run on an unfamiliar app narrates agent steps and probe results; shareable link works in a new browser; copy-as-markdown works; Attempt Kit panel is clear; /about explains evidence.

Exit: PRD section 11 checks all ticked; spec 13 definition of done met.

---

## Time summary

| Sprint | Time |
|---|---|
| 0 Foundation | 0:45 |
| 1 Research spike, feasibility, protocol | 1:30 |
| 2 Schema, rubric, handoff, UI | 1:30 |
| 3 Pipeline (deep) | 2:00 |
| 4 Live flow + research agent | 1:45 |
| 5 Probe, flow trace, metadata, handoff wiring, Attempt Kit | 2:25 |
| 6 Library walkthroughs + verification | 2:30 |
| 7 Deploy + README | 1:00 |
| **Total** | **13:25** |

This is well over the 6–8 h budget, though much of it is Claude Code run time; the owner's hands-on time is the checkpoints, signing in during walkthroughs, and account setup. Be upfront about it with reviewers if needed.

## Cut order (apply top to bottom until the plan fits)

1. Ship live mode on the **fixed gather** only; keep `gather/agent.ts` as a documented, tested-but-disabled option (saves ≈45 min). State this plainly in the README.
2. Skip the self-check pass in live mode (saves ≈15 min).
3. Library walkthrough on 2 apps instead of 3; the third stays at L2 with the reason documented (saves ≈45 min).
4. Shrink `/about` to essentials; skip optional markdown polish (saves ≈20 min).
5. Simplify the Attempt Kit panel (static explanation + copy button, no preview) (saves ≈15 min).
6. Flow trace: drop the model link chooser (rules only) and reduce the hop limit to 3 (saves ≈20 min). Keep the provider metadata check; it is cheap and can change a verdict.

With cuts 1–4 the plan is about 11 h. **Never cut:** evidence labels, attempt levels, the verification log, the handoff rule, or at least two L3 library walkthroughs; they are what the brief asks for (attempt the setup; let discoveries shape the guidance; be clear about evidence).

## Risk-driven adjustments

- If FastRouter structured output or the JSON-action protocol is unreliable (Sprint 0), add a half-sprint to harden `llm.ts` and simplify the agent to fixed gather.
- If provider consoles are unreachable from the build environment, run walkthroughs from the owner's own browser (Claude in Chrome) and record the limitation.
- If a provider's terms forbid automated console use, do not run the walkthrough for that provider; document it as L2 with that reason.
