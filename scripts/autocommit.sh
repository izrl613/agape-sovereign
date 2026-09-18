#!/usr/bin/env bash
# scripts/autocommit.sh
# ─────────────────────────────────────────────────────────────────────────────
# Safe auto-commit + push used by the Antigravity IDE "Autogenerate" button.
# Flow: repair → stage → commit (timestamped message) → push origin/main
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# 1. Run auto-repair first — exits non-zero if JSON errors / conflicts exist
bash scripts/git-autorepair.sh || { echo "❌ Auto-repair found blocking errors. Fix them before committing."; exit 1; }

# 2. Stage everything that changed
git add -A

# 3. Check if there's actually anything to commit
if git diff --cached --quiet; then
  echo "ℹ️  Nothing to commit — working tree is clean."
  exit 0
fi

# 4. Generate a commit message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
CHANGED_FILES=$(git diff --cached --name-only | head -5 | tr '\n' ' ')
MSG="chore(autogenerate): auto-commit ${TIMESTAMP} — ${CHANGED_FILES}"

# 5. Commit
git commit -m "$MSG"
echo "✅ Committed: $MSG"

# 6. Push to origin/main
git push origin "$(git branch --show-current)" 2>&1 && echo "🚀 Pushed to origin/main" || echo "⚠️  Push failed — run 'git push origin main' manually"
