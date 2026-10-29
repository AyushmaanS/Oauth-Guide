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
| 7 | Probe, flow trace, metadata | **not built yet** (Sprint 5) | |
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
