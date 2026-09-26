#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# one-tap-autocommit.sh  —  Siri / Shortcuts / Menu Bar entry point
#
# Triggered by:
#   • "Hey Siri, commit my code"        (Siri Shortcut)
#   • Shortcuts app menu bar button     (one tap)
#   • npm run commit                    (terminal shorthand)
#
# Flow: repair all git errors → AI-style commit message → push → notify + speak
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
REPO="$HOME/Documents/agape-sovereign"
LOG=$(mktemp -t autocommit)

# ── Helpers ──────────────────────────────────────────────────────────────────
notify() {
  local title="$1" msg="$2" sound="${3:-default}"
  osascript -e "display notification \"$msg\" with title \"$title\" sound name \"$sound\"" 2>/dev/null || true
}

speak() {
  # Non-blocking — fire and forget so the script doesn't wait
  say "$*" &
}

bail() {
  notify "❌ Agape Commit Failed" "$1" "Basso"
  speak "Commit failed. $1"
  echo "ERROR: $1" >> "$LOG"
  cat "$LOG"
  exit 1
}

# ── 0. Repo check ─────────────────────────────────────────────────────────────
[[ -d "$REPO/.git" ]] || bail "Repo not found at $REPO"
cd "$REPO"

notify "🔧 Agape Auto-Commit" "Repairing and scanning repo..." "Tink"

# ── 1. Auto-repair all git errors ─────────────────────────────────────────────
bash scripts/git-autorepair.sh >> "$LOG" 2>&1 \
  || bail "Auto-repair found blocking errors. Check Antigravity IDE."

# ── 2. Stage everything ───────────────────────────────────────────────────────
git add -A >> "$LOG" 2>&1

# ── 3. Nothing to commit? ─────────────────────────────────────────────────────
if git diff --cached --quiet; then
  notify "✅ Agape Auto-Commit" "Nothing to commit — repo is already clean." "Glass"
  speak "Nothing to commit. Your repo is already clean."
  exit 0
fi

# ── 4. Generate a smart AI-style commit message ───────────────────────────────
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Count changes
ADDED=$(git diff --cached --name-only --diff-filter=A | wc -l | tr -d ' ')
MODIFIED=$(git diff --cached --name-only --diff-filter=M | wc -l | tr -d ' ')
DELETED=$(git diff --cached --name-only --diff-filter=D | wc -l | tr -d ' ')

# List top changed files for context
TOP_FILES=$(git diff --cached --name-only | head -4 | sed 's|.*/||' | paste -sd ', ' -)

# Pick the right conventional commit prefix
TOTAL=$((ADDED + MODIFIED + DELETED))
if   [[ $ADDED   -gt $MODIFIED && $ADDED   -gt $DELETED ]]; then PREFIX="feat"
elif [[ $DELETED -gt $MODIFIED ]];                           then PREFIX="refactor"
elif [[ $MODIFIED -ge 1 && $TOTAL -lt 4 ]];                 then PREFIX="fix"
else                                                              PREFIX="chore"
fi

# Build message
SCOPE="autogenerate"
MSG="${PREFIX}(${SCOPE}): ${TIMESTAMP} — ${TOP_FILES}"
BODY="Changes: +${ADDED} added  ~${MODIFIED} modified  -${DELETED} deleted on ${BRANCH}"

# ── 5. Commit ─────────────────────────────────────────────────────────────────
git commit -m "$MSG" -m "$BODY" >> "$LOG" 2>&1 \
  || bail "git commit failed. See Antigravity IDE terminal for details."

# ── 6. Push ───────────────────────────────────────────────────────────────────
notify "🚀 Agape Auto-Commit" "Pushing to GitHub..." "Morse"

if git push origin "$BRANCH" >> "$LOG" 2>&1; then
  PUSHED=true
else
  PUSHED=false
fi

# ── 7. Final notification + Siri voice ───────────────────────────────────────
SHORT_MSG="${MSG:0:60}"
if $PUSHED; then
  notify "✅ Commit Pushed!" "$SHORT_MSG" "Hero"
  speak "Done! Code committed and pushed to GitHub. ${ADDED} new, ${MODIFIED} updated."
else
  notify "✅ Committed (push failed)" "$SHORT_MSG — push manually" "Sosumi"
  speak "Code committed locally but push failed. Open Antigravity I D E to push manually."
fi

echo ""
echo "✅ $MSG"
echo "   $BODY"
cat "$LOG"
