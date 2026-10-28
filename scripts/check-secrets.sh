#!/usr/bin/env bash
# Blocks commits that contain likely API keys or tracked .env files.
# Usage: scripts/check-secrets.sh          -> checks staged changes
#        scripts/check-secrets.sh --history -> checks every commit in history
set -u
PATTERN='(sk-[A-Za-z0-9_-]{20,}|tvly-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|(API_KEY|SECRET|TOKEN)[A-Z_]*=["'"'"']?[A-Za-z0-9_-]{16,})'
fail=0
if [ "${1:-}" = "--history" ]; then
  hits=$(git log -p --all 2>/dev/null | grep -E '^\+' | grep -Ev '^\+\+\+' | grep -E "$PATTERN" | head -5)
  files=$(git log --all --name-only --pretty=format: | grep -E '(^|/)\.env' | grep -v '\.env\.example$' | sort -u)
else
  hits=$(git diff --cached -U0 2>/dev/null | grep -E '^\+' | grep -Ev '^\+\+\+' | grep -E "$PATTERN" | head -5)
  files=$(git diff --cached --name-only | grep -E '(^|/)\.env' | grep -v '\.env\.example$')
fi
if [ -n "$files" ]; then echo "BLOCKED: env file(s) would be committed:"; echo "$files"; fail=1; fi
if [ -n "$hits" ]; then echo "BLOCKED: possible secret found (value hidden). Matching line count: $(echo "$hits" | wc -l | tr -d ' ')"; fail=1; fi
[ $fail -eq 0 ] && echo "check-secrets: clean"
exit $fail
