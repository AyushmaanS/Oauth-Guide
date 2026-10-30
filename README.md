# OAuthPath

OAuthPath tells a developer what it really takes to get OAuth credentials for an app: how hard it is, how long it takes, who has to do each step (an agent, you, or the provider's review queue), and what could block you. Every claim carries an evidence label, and every guide says how far we actually went.

- **Live site:** _added after deployment_ (see "Deployment" below)
- **Source:** https://github.com/AyushmaanS/Oauth-Guide
- **Credentials:** none are in this repository or its history (`scripts/check-secrets.sh --history` is clean). Keys live only in `.env.local` (git-ignored) and in the hosting dashboard.

## What you get

A guide leads with a **verdict** (difficulty, time to credentials, time to production, human effort, biggest launch risk), then the steps, requirements, blockers with fixes, an **agent-vs-you split**, what was tested and what could not be, and the sources.

There are two ways to get one:

- **Library** (6 apps, researched in depth, walked through where the provider's terms allowed it, then claim-checked): GitHub, Gmail (Google), LinkedIn, Discord, Slack, Spotify.
- **Live**: type any app name or website. A bounded research agent finds sources, fixed code stages build the guide, the public pages are probed read-only, and the result is saved at a shareable link. Live guides are faster and carry lighter evidence, and say so.

## Evidence labels

| Label | Meaning |
|---|---|
| **Tested** | We observed it, and only up to the gate we reached. Reading a page is never "tested". A tested claim always points at a recorded observation (probe, trace, metadata or walkthrough step). |
| **Documented** | An official provider source says so (linked, with retrieval date). |
| **Reported** | Only community or third-party sources say so. |
| **Unverified** | Inferred, conflicting or unsourced. Our own estimates (shown with "≈" and an "Estimate" chip) are always unverified. |

Rules in code (`src/lib/schema/guide.ts`, `validate.ts`): every cited source must exist; "documented" needs an official source; "reported" needs a non-official one; "tested" needs a testNote and an observation that exists. Difficulty is computed by `rubric.ts` from enumerated factors, never chosen by a model. Who does each step is computed by `handoff.ts` from requirement tags. When sources leave a factor open, the guide shows a best-to-worst range and labelled inference instead of guessing.

## Attempt levels, and exactly what each library guide observed

| Level | Meaning |
|---|---|
| **L1** | Documentation read. Nothing observed. |
| **L2** | Gate probed: the provider's public pages were requested read-only and the public path followed to the first sign-in wall, bot check or form. No account used. |
| **L3** | Signed-in walkthrough with a free account in a separate browser profile, stopped at the first step only a human may do. Library guides only. |

| Guide | Difficulty | Level | What was observed |
|---|---|---|---|
| GitHub | easy | L3 | Registered and read a throwaway OAuth app. No review, payment or terms screen. Found: the form says "Redirect URIs" (up to 10), expiring tokens are on by default, the secret needs a separate click. |
| Gmail (Google) | hard | L3 | Cloud blocks project creation until 2-step verification is on; the consent-screen wizard needs real contact emails; `gmail.readonly` is filed under restricted scopes. Stopped before creating a client. |
| Discord | hard | L3 | App creation is instant after ticking the Developer Terms; the secret and bot token stay hidden until reset. Intent toggles need no review below 10,000 users. Discord's terms are ambiguous on automation (see below). |
| Slack | hard | L3 | Creating an app needs a workspace, not just an account; credentials exist from creation, before any install; install is disabled until a scope is added. |
| Spotify | gated | L3 | The dashboard needs accepted Developer Terms and a verified email before "Create app" works; a free account could create the app but Web API access was greyed out. |
| LinkedIn | gated | L2 | **No walkthrough:** LinkedIn's User Agreement bans automated access, so the guide stays at L2 with that reason stated. |

No walkthrough ever submitted an app for review, paid, or revealed a client secret. Details and diffs: `content/attempts/*.json` and `content/verification/*-merge-diff.md`.

## The walkthrough protocol (summary)

Full text: [`docs/ATTEMPT-PROTOCOL.md`](docs/ATTEMPT-PROTOCOL.md). Claude Code drove the owner's real browser, with the owner present, under these rules:

- Written consent per provider (`docs/DECISIONS.md` D-017, D-018) and a terms check first; free accounts only; a separate browser profile; throwaway names (`oauthpath-test-<date>`) and `localhost` or `127.0.0.1` redirect URIs; no real data.
- **Hard stops, handed back to the human:** login, email or phone verification, 2FA, CAPTCHA, identity or business verification, payment, accepting legal terms, and any "submit for review" action (never clicked).
- Secrets are never copied into chat, files or logs. Observations are capped at 200 characters.
- Irreversible deletions were left to the owner. **Cleanup status: the Discord, Slack and Spotify test apps and the throwaway Slack workspace had not yet been deleted at the time of the last check, and each guide's "what we could not verify" says so.**
- The website itself never holds provider logins and never performs signed-in actions.

## The Attempt Kit (visitor-run, private)

Every guide includes an **Attempt Kit**: a prompt you can give to your own browser-capable AI agent. It lists the steps, the allowed domains, the stop rules (stop and hand back at any login, verification, 2FA, CAPTCHA, identity check, payment, terms or review submission), safety rules (free account, separate profile, throwaway names, no secrets in chat, clean up) and a log template. You run it privately in your own account. The site never runs it and never publishes a result as "Verified". It is built only from validated guide data and has unit tests for the stop rules, allow-list, injection defence and hostile step text. **It has not been dry-run with a real agent.**

## How the pipeline is built, and who decides what

Legend: **D** deterministic code, **L1** one constrained model call (fixed prompt, JSON, schema-validated, at most one repair), **A** a model proposing actions that our code validates and executes, **A\*** Claude Code with the owner.

| Step | Built as | Why |
|---|---|---|
| Input validation, slug, private-address rejection | D | Safety; nothing to judge. |
| Resolve app → provider domains, OAuth support | D search + L1 | Needs language understanding; output is validated. |
| Gather evidence | **A** (live default) or D fixed search (library) | See comparison below. |
| Composio managed-auth status | D | Read from Composio's public directory by code; a model never sets it. |
| Extract difficulty factors | L1 | Reading prose; the result is only inputs to the rubric. |
| Follow-up research and labelled inference for unknown factors | A / L1 | Narrow questions only; inferred values are shown as estimates. |
| **Difficulty label, best/worst range** | **D** (`rubric.ts`) | Must be reproducible and explainable. |
| Write the guide body, requirement tags per step | L1 | Prose, with sources and tags validated. |
| Step owners and handoff table | **D** (`handoff.ts`) | A model never decides who does a step. |
| Self-check of weak claims | L1 verdicts, D applies them | A model may only lower a label. |
| Gate probe, public flow trace, provider metadata | D (SSRF-safe GET) | Read-only, allow-listed, robots.txt respected. |
| Page reading and link choice during the trace | L1 ×2 in parallel | Reads a page and picks the next link **by index**; code keeps the allow-list and the evidence label. |
| Attempt level, evidence labels, validation, storage | **D** | Never delegated. |
| Signed-in walkthroughs, claim verification | A\* | Needs real accounts and judgement, with the owner. |

**What agents do and do not do here.** The live research agent only proposes `search` or `read` actions as JSON. Our code checks each against budgets (7 actions, 55 seconds by default) and an allow-list, runs it through Tavily, and wraps the result as untrusted text. It cannot browse freely, click, write, or send anything. No model sets a label, a difficulty, an attempt level or a step owner. There is no free-form agent loop in the product, on purpose: the evidence has to be auditable.

### Agent versus fixed gather (measured honestly)

On 5 apps (Zoom, Dropbox, HubSpot, Spotify, Atlassian), one run each, same models: the agent averaged 79 s versus 66 s, used about twice the model calls (10.6 versus 4.8), found marginally more official sources and checklist coverage (5.2 versus 4.8 of 8), and produced more unverified claims (5.8 versus 3.8). Labels flipped between runs for both strategies. **The agent was not shown to be better.** It is the live default by product choice (`docs/DECISIONS.md` D-013), and `GATHER_MODE=fixed` switches it off. One run per app is inside run-to-run noise.

## Architecture

```
 browser ──► /api/generate (SSE) ──► rate limit + daily cap (Redis)
                 │
                 ▼
   resolve ─► gather (agent | fixed) ─► factors ─► [follow-up] ─► bounds/inference
                                                         │
                                  rubric (D) ◄───────────┘
                                                         ▼
        synthesize (L1) ─► assemble (D: owners, handoff) ─► self-check (L1) ┐
                                                                            ├─► validate (D) ─► store
        probes: gate probe ─► public flow trace ─► metadata (D + page reader) ┘
 
 library:  content/guides/*.json  ◄── scripts/generate-guide.ts, merge-attempt.ts, verification
 pages:    / (library + generate box) · /guide/[slug] · /about
```

## Key decisions

- **Verdict first.** A reader decides in seconds whether this is a quick job or a multi-week gate.
- **Evidence labels everywhere**, enforced by schema, so a claim cannot look more certain than its source.
- **Difficulty is computed, never chosen by a model**, and unknowns widen a range instead of being guessed.
- **Fast live mode versus deep library mode**, explained rather than hidden.
- **Agents are bounded and their output is validated.** The research agent only proposes; our code acts.
- **Honest scope of "tested".** It means observed, on a date, up to a gate.
- **Model reads pages, code keeps the safeguards.** A gate claim needs a quote that code finds on the page.
- **The Attempt Kit stays.** We cannot safely automate signed-in walkthroughs, so visitors run one privately with their own agent.

All decisions with reasons and measured results: [`docs/DECISIONS.md`](docs/DECISIONS.md). Pipeline as built: [`docs/PIPELINE.md`](docs/PIPELINE.md).

## Evidence and verification summary

Claim sampling (not exhaustive), done by Claude Code subagents fetching primary pages, then corrections applied with changelog lines. **No human has checked every claim; the owner's read-through is the human check.**

| Guide | Checked | Confirmed | Corrected | Overstated | Could not verify | Log |
|---|---|---|---|---|---|---|
| GitHub | 24 | 15 | 0 | 3 | 6 | [log](content/verification/github.md) |
| Gmail | 25 | 11 | 1 | 3 | 10 | [log](content/verification/gmail.md) |
| LinkedIn | 29 | 8 | 6 | 2 | 13 | [log](content/verification/linkedin.md) |
| Discord | 22 | 10 | 1 | 4 | 7 | [log](content/verification/discord.md) |
| Slack | 30 | 10 | 6 | 4 | 10 | [log](content/verification/slack.md) |
| Spotify | 27 | 10 | 6 | 4 | 7 | [log](content/verification/spotify.md) |

What we learned, corrected and could not verify, in plain words: [`docs/LEARNINGS.md`](docs/LEARNINGS.md). Examples of corrections: Spotify's extended quota is organization-only (the difficulty was recomputed from hard to gated), Slack's Marketplace review is up to ten weeks, LinkedIn's `w_organization_social` belongs to a different product than the guide said, Google Cloud needs 2-step verification before it will create a project.

**Provider terms on automated console use** (research notes in `docs/RESEARCH-NOTES/`): GitHub allowed with care; Google a gray area; Slack ambiguous, allowed-leaning; Spotify ambiguous, allowed-leaning; **Discord ambiguous, leaning against automated access** (the owner ran one walkthrough knowingly, and the guide says so); **LinkedIn: no walkthrough**. This is not legal advice.

## Limitations

- **No approval was completed.** No walkthrough submitted anything for review, so every review duration and outcome is from documentation or reports, not observation.
- **Time and effort figures are estimates** wherever no source states them, and are marked as such. Walkthrough timings are one run each and approximate.
- **Library walkthroughs are one account on one day.** Other account types, countries or organizations may see different screens.
- **Live guides are lighter.** They are not human-verified, and labels can differ between runs because a model reads the sources. The run takes roughly 100 to 150 seconds.
- **The public-path trace often ends early.** Many consoles are JavaScript apps or sit behind login, and we say "unclear" rather than guess. None of the six library traces ended at a code-confirmed sign-in wall: they ended at dead ends, JavaScript pages or the hop limit. (An earlier Gmail trace that looked like a wall was a classifier false positive on a documentation page, now fixed.)
- **The model page reader is slower** (about 8 s per call) and, in our small sample, was not clearly better than the rules at reaching the console.
- **Some provider pages could not be fetched** (Discord support pages returned HTTP 403), so those claims are marked unverified.
- **Sources change.** Each guide shows when it was generated.
- **Cleanup:** see the walkthrough protocol section.
- The Attempt Kit has not been dry-run with a real agent, and the Upstash Redis store was covered by tests with a fake client until deployment.

## Setup

Requirements: Node 20+ (developed on a newer Node), an OpenAI-compatible gateway key and a Tavily key.

```bash
git clone https://github.com/AyushmaanS/Oauth-Guide.git
cd Oauth-Guide
npm install
cp .env.example .env.local      # then fill FASTROUTER_API_KEY and TAVILY_API_KEY
npm run dev                      # http://localhost:3000
```

Useful commands:

```bash
npm test                         # unit tests (no network)
npm run lint && npm run typecheck
npm run guide -- "GitHub"        # deep mode: writes content/guides/<slug>.json after validation
npm run smoke                    # live mode on a set of unfamiliar apps; prints timing and pass/fail
npm run merge -- github          # merge content/attempts/github.json into the guide
bash scripts/check-secrets.sh --history   # secrets sweep over the full git history
```

Environment variable **names** are in `.env.example` (never values). `STORE_DRIVER=fs` stores live guides in `.data/` locally; `STORE_DRIVER=remote` uses Upstash Redis (`UPSTASH_REDIS_REST_URL`/`_TOKEN` or `KV_REST_API_URL`/`_TOKEN`) for guides and the rate limit.

## Deployment

Next.js on Vercel with an Upstash Redis store added through the Marketplace. Set the environment variables from `.env.example` in the Vercel dashboard (never in the repository), with `STORE_DRIVER=remote`. The generate route sets `maxDuration = 300`.
