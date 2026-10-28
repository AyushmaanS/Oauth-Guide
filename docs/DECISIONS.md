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
