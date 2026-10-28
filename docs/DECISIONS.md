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
