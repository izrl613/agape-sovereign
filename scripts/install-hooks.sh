#!/usr/bin/env bash
# scripts/install-hooks.sh
# Installs git hooks that run the auto-repair engine.
# Run once after cloning: bash scripts/install-hooks.sh
set -e
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK="$REPO_ROOT/.git/hooks/pre-commit"

cat > "$HOOK" << 'EOF'
#!/usr/bin/env bash
exec "$(git rev-parse --show-toplevel)/scripts/git-autorepair.sh"
EOF

chmod +x "$HOOK"
echo "✅ pre-commit hook installed → $HOOK"
