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
