# Pipeline as built (Sprint 3, deep mode)

Legend: **D** deterministic code · **L1** single constrained LLM call (fixed prompt, JSON, zod-validated, one repair retry) · **A** agentic · **A\*** agentic by Claude Code with the owner.
Code: `src/lib/pipeline/`. CLI: `npm run guide -- "GitHub"` writes `content/guides/<slug>.json` only if validation passes.

| # | Step | Built as | File |
|---|---|---|---|
| 1 | Input validation, normalisation, slug | D | `resolve.ts` (`validateInput`, `slugify`) |
| 2 | Resolve app → provider domains, supports OAuth? | D (Tavily search) + L1 | `resolve.ts` |
| 3 | Gather evidence (deep) | D: ~13 parallel searches, dedupe, rank official first, extract ≤15 pages, relevance filter | `gather/fixed.ts` |
| 3b | Composio managed-OAuth status | D: reads Composio's public directory; the model never sets it | `composio.ts` |
| 3c | Checklist coverage | D: text-presence check per item (what was retrieved, not whether it is right) | `gather/checklist.ts` |
| 4 | Factors from sources | L1 | `factors.ts` |
| 5 | Difficulty label | D | `rubric.ts` |
| 6 | Synthesize guide body, with requirement tags per step | L1 (+1 repair retry) | `synthesize.ts` |
| 6b | Assemble: step links must equal a fetched source URL; unsourced ranges lose their numbers; actors and handoff computed | D | `synthesize.ts` (`assemble`) |
| 7 | Gate probe, public flow trace, provider metadata | D (read-only GET via `safefetch`) + optional L1 link chooser (index only, max 4 calls); runs in parallel with the self-check | `src/lib/probe/` |
| 7b | Merge observations: tested evidence scoped to what was seen, `login_or_account` added at observed gates, attempt level L1→L2 | D | `probe/apply.ts` |
| 8 | Handoff mapping | D | `handoff.ts` |
| 9 | Self-check | L1 reviewer returns verdicts only; code applies downgrades | `selfcheck.ts` |
| 10 | Validate and persist | D | `validate.ts`, CLI |
| 11–14 | Browser walk, signed-in walkthrough, merge, verification | A\* with owner (Sprint 6) | |

Deviations from spec 6.0 / 6.1:
- Prompts are TypeScript modules (`prompts/*.ts`), not `.md` files, so they bundle on Vercel without file tracing.
- Checklist coverage is a text-presence check; the agent-based coverage tracking arrives with the live research agent (Sprint 4).
- Guides are produced at attempt level **L1** until the probe/trace (Sprint 5) and walkthroughs (Sprint 6).

Safety properties in code (tested with mocked model and search):
- All fetched text is wrapped in `<<<UNTRUSTED_SOURCE>>>` blocks with the delimiter characters stripped, and every system prompt says it is data.
- The model never sets labels beyond documented/reported/unverified; `tested` is impossible from the pipeline. Documented-without-official-source is downgraded.
- Difficulty, step owners and the handoff table are recomputed in code; model values are overwritten.
- Source publisher is classified by code (provider-run forums, issue threads and discussions count as community, not official).
- A stage failure degrades to a labelled incomplete guide instead of throwing.

## Added in Sprints 4-5
- Live mode: bounded research agent (default for live, owner decision D-013) with specific-question enforcement; follow-up round; best/worst-case bounds; labelled inference (D-014).
- Probes (Sprint 5): safe fetch rules (https only, allow-list = provider registrable domains and official source domains, never Composio; DNS validated per hop and pinned; max 3 redirects, never followed off the allow-list; GET only; no cookies; 200 KB cap; robots.txt respected). Classifier is conservative: JavaScript shells are `js_shell_unclear`, never a guessed gate.
- Attempt Kit: `attemptkit.ts` builds a visitor-run prompt from validated guide data only.
