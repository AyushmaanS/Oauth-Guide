# Decisions log

Running record of decisions and [VERIFY] outcomes. Newest at the bottom.

## D-001 Docs location (Sprint 0)
The three planning docs were delivered in the repo root; moved to `docs/` as the spec expects.
`04-CLAUDE-CODE-STARTER-PROMPT.md` was not provided; not needed.

## D-002 Secrets guard (Sprint 0)
`scripts/check-secrets.sh` scans staged changes for key-shaped strings and tracked `.env*` files.
`scripts/install-hooks.sh` installs the pre-commit hook (git does not version hooks; re-run after cloning).

## D-003 Environment: Node.js missing (Sprint 0) — OPEN
The build machine had no `node`/`npm`, and no Homebrew/nvm. Needs resolving before scaffolding.

### D-003 resolved: Node installed locally
Official Node v26.13.0 (LTS "Lithium", arm64) downloaded from nodejs.org, SHA-256 verified against SHASUMS256.txt, unpacked to `.tools/node` (git-ignored; no admin rights, nothing global).
Use it with: `export PATH="$PWD/.tools/node/bin:$PATH"`. The pre-commit hook does this itself.

## D-004 Scaffold versions (Sprint 0)
create-next-app gave Next 16.4.3, React 19.3, Tailwind 4, ESLint 9. Spec said "Next.js App Router"; version not pinned, so we keep the current one. `zod` 4, `openai` 7, `@tavily/core` 0.7, Vitest 5, Prettier, `tsx` (to run scripts).
`@types/node` raised to ^24 because Vitest 5 would not install against ^20.
`tsc --noEmit` needs a prior `next build` (Next generates the `LayoutProps` types).
The scaffold's `AGENTS.md`/README were not kept; our README is written in Sprint 7.

## D-005 Sprint 0 spike results (2026-10-29) — raw data in `docs/spike-results.json`, script `scripts/spike-env.ts`

| [VERIFY] item | Outcome |
|---|---|
| FastRouter base URL `https://go.fastrouter.ai/api/v1` | **Confirmed.** OpenAI SDK works unchanged; `GET /models` returns 223 models (many are image/video/audio). |
| Models usable | Claude Haiku 5.5, Sonnet 5.5, Opus 5.5 and Gemini 3.8 Flash all answered. Model ids look like `anthropic/claude-haiku-5.5`. |
| JSON object mode + strict JSON-schema output | Worked on all four, except Gemini 3.8 Flash returned unparseable output once for json_schema. |
| Native tool calling (informational) | Worked on all four. We still use the JSON-action protocol (spec 6.5). |
| **JSON-action protocol, 10 trials, plain prompt, zod-validated** | Haiku 5.5: 10/10. Sonnet 5.5: 10/10. Opus 5.5: 10/10. Gemini 3.8 Flash: 8/10 (2 truncated/invalid). |
| Streaming | **Works** (stream:true accepted). Gateway delivered only ~4 chunks for a short reply, so it is coarse; stage-level progress stays as designed (spec 6.2). |
| Latency (single short calls, one sample) | Haiku ~0.7–2.8 s; Sonnet ~1.2–2.5 s; Opus ~1.4–2.8 s; Gemini ~2.3–3.6 s. Medians of the 10-trial run: Sonnet 1.8 s, Haiku 2.2 s, Opus 2.6 s, Gemini 3.6 s. Too small a sample to rank Haiku vs Sonnet on speed. |
| Tavily | Search 5.2 s (5 results), extract 2.6 s. Search is slower than hoped; agent budget (75 s) must allow for ~5 s per search. |
| Provider reachability from this machine | Reachable: docs.github.com, github.com (302 to login), developers.google.com, console.cloud.google.com (302 to Google sign-in), accounts.google.com OIDC metadata (200), api.slack.com, developers.notion.com, notion.so, learn.microsoft.com (LinkedIn docs), developer.linkedin.com. **Timed out at 10 s:** `www.linkedin.com/developers/apps` (the console; may block bots or just be slow; recheck in Sprint 5). Several docs URLs moved (Slack to docs.slack.dev, Notion to new paths) — the trace must follow redirects only within the allow-list, so allow-lists need the new hosts. |
| DNS/IP validation in Node | Works: `dns.lookup(all:true)` + private-range check correctly flags localhost and a rebinding-style hostname (`127.0.0.1.nip.io`). Safefetch will pin the validated IP per request. |
| Composio managed-auth directory | **Readable programmatically.** The page renders client-side, but `https://docs.composio.dev/toolkits/managed-auth.md` returns clean markdown with a table of 124 OAuth toolkits that Composio manages (GitHub, Gmail, Notion, Slack, LinkedIn all listed) and says how to confirm via the API field `composio_managed_auth_schemes`. Individual `/toolkits/github(.md)` pages timed out once; retry later. So `composioManaged` stays in scope, sourced from that page (Documented). |

## D-006 Model choice
- `MODEL_FAST = anthropic/claude-haiku-5.5` — 10/10 on the JSON-action protocol, schema output worked, cheapest Claude tier by name (price not verified; FastRouter pricing not checked).
- `MODEL_DEEP = anthropic/claude-sonnet-5.5` — 10/10, quick, stronger tier for synthesis; Opus 5.5 was also 10/10 but slower in the spike and presumably costlier, so it is kept as an upgrade option if Sonnet drafts disappoint.
- Gemini 3.8 Flash rejected for now: 2 of 10 invalid in the protocol test.
- Caveat: Opus and Gemini returned an empty string to the tiny "pong" test (max_tokens 20). Cause not investigated (possibly reasoning tokens use the budget). Pipeline calls must set generous `max_tokens` and treat empty output as a failure to retry.
- The spike used one sample per model; revisit with real pipeline prompts in Sprint 3/4.

## D-007 Sprint 1 research (2026-10-29) — notes in `docs/RESEARCH-NOTES/`
Notes were written by four read-only research subagents (public web only, no logins) and **have not yet been independently checked**. My own spot-check attempt (fetching two Google/Slack doc pages with curl) returned no readable text because they render client-side, so it verified nothing. Claims stay Documented/Reported *as labelled in the notes* until the Sprint 6 verification sample. Known gaps flagged by the agents: Google Cloud AUP only partly read; Notion terms and developer portal not fetchable; Slack AUP PDF unreadable; several community sources seen only as search snippets.

Surprises:
- LinkedIn is not simply "gated": sign-in (OIDC) and Share are self-serve with no review; Community Management etc. need a legal organisation + verified Page admin and manual review, with no fixed wait documented. Its terms (User Agreement s8.2, prohibited-software page) look hostile to bots.
- Google: reading mail is a *restricted* scope; only `gmail.send` is merely sensitive. Restricted + server storage means an annual third-party security assessment. Google's own discovery document has no registration endpoint and lists only 3 scopes.
- GitHub: no provider review at all; the real gate is each *customer's* org approving the OAuth app. GitHub itself recommends GitHub Apps over OAuth Apps. No well-known OAuth metadata (404).
- Slack: unlisted public distribution needs no review; Marketplace needs 10 active workspaces first. New rate limit of 1 request/minute on history methods for unlisted apps.
- Notion: docs say the Authorization URL only appears after submitting a connection "for review"; conflicting third-party guide. Unresolved.

## D-008 Library apps (APPROVED by owner 2026-10-29)
1. **GitHub** — Easy. Attempt-feasible (free account, instant app creation). Terms: ambiguous, medium-low confidence; a single supervised walkthrough looks probably fine.
2. **Google / Gmail** — Hard. Attempt-feasible in Testing mode without billing or verification; Google may block sign-in from automation-controlled browsers, so the owner signs in first and we use that already-signed-in session. Stop before any verification submission.
3. **LinkedIn** — Gated. Likely **L2 only**: terms look hostile to automated console use, so per protocol no walkthrough unless the owner decides otherwise; the guide documents the self-serve vs gated split with probes, trace and metadata.
Fallback / 4th: **Slack** — attempt-feasible, strongest documentation. Swap in for any app whose walkthrough cannot run, so we always keep at least 2 L3.
Not chosen: Notion (unresolved gating, terms unreadable).
Why this set: spans Easy → Hard → Gated, and the two L3 targets (GitHub, Google) are the most informative; the LinkedIn L2 is itself a finding.

## D-009 Owner approvals (2026-10-29)
Owner approved: the attempt protocol; the library list (GitHub, Google/Gmail, LinkedIn at L2; Slack fallback); the spec changes (`useCase` in the verdict, `businessEntityRequired` factor, customer-side approval shown as requirement/blocker); the draft rubric.
**This is NOT per-provider walkthrough consent.** That is requested separately, in writing, before Sprint 6.

## D-010 Sprint 2 notes
- Schema additions from D-009 are in `src/lib/schema/guide.ts`: `verdict.useCase`, `factors.businessEntityRequired`, plus `factors.waitMagnitude` (days vs weeks, needed by the rubric) and `providerMetadata.registrationEndpoint` (so "dynamic registration: supported" can be checked against a parsed value).
- Rubric (`rubric.ts`) follows `docs/RUBRIC-DRAFT.md`. One refinement: weeks of wait only makes a guide "hard" when the review is required (GitHub's optional Marketplace wait does not).
- `validateGuide` takes a structurally valid draft (`GuideShape`), repairs or downgrades what it can with warnings, then runs the full `Guide` schema. Direct schema parsing rejects instead (stricter); the pipeline will use validate.
- **Deviation:** the scaffold enabled Next `cacheComponents` and `partialPrefetching`. Turned off: incompatible with `dynamicParams` and unneeded for this app.
- The fake fixture shows in development only (or `SHOW_FIXTURE=1`); production builds show only `content/guides/*.json`. An invalid library guide fails the build (tested with a deliberately broken file).
- Dev-server note: the Browser pane's built-in launcher could not start Next (Turbopack could not find `node`). Running `npx next dev` from a shell with `.tools/node/bin` on PATH works; use that.
- Not yet done in the UI (later sprints): Attempt Kit panel, progress panel, live generation, full /about.

## D-011 Sprint 3 results (deep pipeline)
Ran `npm run guide` on GitHub, Gmail and LinkedIn with MODEL_FAST/MODEL_DEEP as chosen in D-006 (about 1–2.5 minutes per app).
Final labels (code-computed): **GitHub easy, Gmail hard, LinkedIn gated**, which match the Sprint 1 research notes. Early runs did not: see below.

What went wrong first, and what fixed it:
- Off-topic sources (a pull-request docs page, finance news, other providers' forum threads) → relevance filter (must mention OAuth; non-official pages must mention the app 3+ times).
- Provider-hosted discussions and issue threads were classified `official`, so community posts could be labelled "Documented" → classifier now treats forum/discussion/issue/question paths and community-style hosts as community.
- GitHub flipped between easy and moderate between runs: the model listed ordinary form fields (homepage URL, callback URL) as "special requirements" → prompt now says form fields do not count.
- Gmail came out "moderate" because the sources never mentioned the security assessment → added a targeted search; and the rubric now returns **unknown** when a review is required but both its depth and wait are unknown (it used to say "wait measured in days", which was false).
- LinkedIn reported "paid or business account" as the reason for Gated → rule order changed (business entity first) and the registration-friction factor is defined as only about creating the app.
- LinkedIn factor extraction failed once (model returned claims in a different shape) and silently fell back to "unknown" → claims are now parsed leniently.
- The model invented numbers in ranges ("1 hour", "14–90 days") while admitting no source → code strips numbers from any unverified range with no sources.
- Composio directory alone counted as "sources read" → now requires at least one provider-side page.

Known weaknesses (to address in Sprint 4/6):
- Run-to-run variance in factors remains possible; it changes labels only through code rules. Re-run before trusting a label.
- Retrieval misses things the notes found (for example Google's documented ~6 week restricted-scope review): the Gmail guide says "several months" from one source. The Sprint 6 verification must catch this.
- Checklist "covered" means matching text was retrieved, not that claims are right.
- Step links are dropped unless they match a fetched source URL, so many steps have no link.
- Draft guides in `content/guides/` are **L1, unverified**; do not deploy them as "verified" library guides before Sprint 6.
- Composio's own directory is treated as "official" so Composio-status can be Documented; the prompts restrict it to that statement only.

## D-012 Sprint 4: live generation, research agent, and the agent-vs-fixed comparison
Built: `/api/generate` (SSE), progress panel and generate box, fs + Redis stores, rate limit and daily cap, the bounded research agent (`gather/agent.ts`, 14 unit tests incl. prompt-injection fixture), `scripts/smoke-live.ts`.

**Store choice (answers PRD open question 4):** Upstash Redis via the Vercel Marketplace (`@upstash/redis`). One service gives both guide storage and atomic counters for the rate limit and daily cap (serverless has no shared memory, so in-memory counters would not hold). Blob would have needed a second mechanism for counters. The Redis adapter is covered by unit tests with a fake client only; it has **not** been run against a real Upstash store (Sprint 7). Env var names differ by how the store is added (`UPSTASH_REDIS_REST_*` or `KV_REST_API_*`); both accepted. [VERIFY on Vercel]

**Agent vs fixed comparison** (5 apps: Zoom, Dropbox, HubSpot, Spotify, Atlassian; fast mode, same models, one run each):

| | agent | fixed |
|---|---|---|
| avg seconds | 79 | 66 |
| avg sources used | 4.8 | 5.2 |
| avg official sources | 4.0 | 3.8 |
| avg checklist items covered (of 8) | 5.2 | 4.8 |
| avg claims unverified (steps+requirements+scopes) | 5.8 | 3.8 |
| avg LLM calls | 10.6 | 4.8 |
| labels computed | Dropbox unknown, Zoom moderate, HubSpot moderate, Spotify unknown, Atlassian hard | Dropbox moderate, HubSpot unknown, Spotify unknown, Zoom moderate, Atlassian hard |

Reading: the agent found marginally more official sources and coverage, but was slower, used twice the model calls, and its guides had more unverified claims. One run per app means differences of this size are inside run-to-run noise (labels flipped between runs for both strategies). **Decision (per the sprint-plan rule "keep the agent only if at least as good"): live mode defaults to the fixed gather.** The agent stays built, tested and selectable with `GATHER_MODE=agent`; the README must say this plainly. Cut-order item 1 is therefore already applied. Owner can overrule: it trades the visible "agent investigating" demo moment against measured quality; the progress panel still shows stages, sources and checklist with the fixed gather.

**Agent issues found while building it:** (a) the `UNREAD RESULTS` and `SOURCES SO FAR` lists were not wrapped as untrusted (caught by the injection test; fixed); (b) the relevance filter required the word "oauth", which discarded valid Marketplace/approval pages and community threads on approval times (Atlassian read 1 page in 8 actions); relaxed to a topic-keyword check.

**Smoke results (default = fixed gather, fast mode, 10 inputs, concurrency 3):** 7 of 8 unfamiliar apps passed the coherence bar (guide complete, ≥3 sources with ≥1 official, ≥3 steps, ≤150 s); average 55 s, max 77 s. The one failure (Zoom) was the model emitting `"minDays": undefined` (invalid JSON); `extractJson` now treats `undefined` as absent and Zoom re-run passes. Craigslist (no developer OAuth) returned a short "no evidence" guide; the nonsense string produced an incomplete guide with irrelevant sources, which was wrong: unidentifiable input now stops after the resolve step with an error and no research.
**Labels are often "unknown"** for unfamiliar apps (6 of 8 in the final run): the sources the fast run reads often do not state review depth or wait, and the rubric refuses to guess. That is the honest outcome but a weak demo; Sprint 5's probes and metadata may help, and the factor prompt now tells the model that "other customers must be approved or listed" means `for_public_use`.
Not yet done: browser check of the progress panel (the Browser pane was not displayed during the session; the SSE stream itself was verified with curl on a real app (Box) and the stored guide rendered at `/guide/box`).

## D-013 Owner decision: research agent is the live default (supersedes the default in D-012)
Owner chose the bounded research agent as the default for live generation, preferring the visible "agent investigating" experience over the marginal measured advantage of the fixed gather (D-012: agent ~13 s slower, 2x model calls, more unverified claims on a 5-app sample; no clear quality win).
Deep mode (library) still uses the fixed gather; `GATHER_MODE=fixed` forces the fixed gather in live mode; the agent falls back to the fixed gather automatically if it fails twice (`method: "fixed_fallback"`).
The README must report the comparison honestly: the agent was not shown to be better, and it is the default by product choice. Re-run the comparison with more apps and repeats in Sprint 7 if time allows.
Verified after the switch: 134 tests pass; Zoom and Spotify smoke runs pass with `agent` as method.

## D-014 Relaxing "Unknown": bounds, follow-up questions, inference, estimated ranges (owner request after live testing)
Problem: unfamiliar apps came out "Unknown" (6 of 8 in D-012) with no insight for the reader.

**How a label is decided now**
1. Factors stated by sources are extracted (unknown allowed).
2. **Follow-up round** (`gather/followup.ts`): up to 3 factors still unknown each get ONE precise question, one targeted search and one page read; if a new page is found, factors are re-extracted.
3. **Bounds** (`rubric.ts`): unknown factors are completed once as plausibly good and once as plausibly bad as the stated facts allow. Gated is never assumed from missing information. If both completions give the same label, the label is **established** ("holds whatever the unknown details turn out to be"): no model guess involved.
4. Otherwise an **inference step** (`infer.ts`, one model call) estimates only the unknown factors. Code enforces: stated facts are never overwritten; values must be valid; paid/business account, partnership contract, security assessment and "business entity required" are accepted only with a cited source (else capped at the next most cautious value); confidence cannot be "high" without a source; no review implies no depth or wait.
5. The label is then computed from stated + inferred values and marked **estimated**, with the best-to-worst range, the reasoning ("Our estimates"), the established facts, what is still unknown, and 2-3 "what to check first" questions (code requires each to name the app, end in "?" and not be vague). If the estimate step fails, the label stays "Unknown" but the plausible range is shown.
6. Time ranges: sourced numbers keep their evidence labels. With no source the model may give a wide range marked `estimate: true`; code forces it to Unverified, prefixes the basis with "Our estimate:", and the UI shows "≈" and an "Estimate" chip. Unmarked unsourced ranges still lose their numbers. Owner approved showing estimated time ranges on live guides.

**Question quality (all agent and follow-up steps)** (`questions.ts`): the checklist is now seven specific, closed questions. Every agent action must (a) target 1-3 question ids, (b) state `lookingFor`, one concrete fact (vague values such as "more information" are rejected), and (c) for searches, use a query that names the app, contains a term belonging to the targeted question, and is not generic. Violations are rejected in code and cost an action. The fixed-gather and follow-up query templates are tested to satisfy the same rules. Seeds are question-based, not generic.

**Results (6 unfamiliar apps, concurrency 3):** 0 of 6 "Unknown" (was 6 of 8 before): all got a label marked estimated, with reasoning and check-first questions. Agent queries and `lookingFor` values read as specific ("number of business days Dropbox says its production app review takes"). 4 of 6 met the old coherence bar; the misses were X (docs site extracts poorly, 1 source) and Zoom (154 s, over the 150 s bar).

**Costs and limits (honest):**
- Estimated labels are guesses with visible reasoning; they can be wrong (for example Atlassian came out "hard (estimate)" with a plausible range of easy to hard). That is why they are always marked and never counted as documented.
- Runs take longer: about 100-150 s with 3 runs in parallel (earlier 55-80 s). To stay near 2 minutes the research agent budget was cut to 7 actions / 55 s, the follow-up round is skipped once the run passes 80 s, and the self-check is skipped past 110 s (it was skipped for 4 of 6 apps in the last run, so those guides carry the warning "Self-check skipped"). Deep mode has no soft limits.
- Some "check first" questions are still loosely worded; the code only checks form.
- Library guides were not regenerated; run `npm run guide` again in Sprint 6 so they pick up the new fields.
