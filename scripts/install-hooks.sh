#!/usr/bin/env bash
# Installs the pre-commit hook (hooks are not versioned by git, so re-run after cloning).
cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
scripts/check-secrets.sh || exit 1
if [ -f package.json ] && [ -d node_modules ]; then
  npm run -s lint && npm run -s test || exit 1
fi
HOOK
chmod +x .git/hooks/pre-commit
echo "pre-commit hook installed"
