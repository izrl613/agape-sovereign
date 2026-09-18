#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# git-autorepair.sh  —  Agape Sovereign Auto-Repair Engine
# Fixes common git & IDE errors so Autogenerate / Autocommit never block.
#
# Usage:
#   ./scripts/git-autorepair.sh          # run all checks + auto-fix
#   ./scripts/git-autorepair.sh --check  # dry-run (report only, no fixes)
#
# Called automatically by:
#   • .git/hooks/pre-commit              (blocks bad commits)
#   • .agents/hooks.json PostInvocation  (runs after every AGY tool use)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

DRY_RUN=false
[[ "${1:-}" == "--check" ]] && DRY_RUN=true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

FIXES=0
WARNINGS=0

info()  { echo -e "${CYAN}[autorepair]${NC} $*"; }
ok()    { echo -e "${GREEN}[  OK  ]${NC} $*"; }
fix()   { echo -e "${YELLOW}[ FIX  ]${NC} $*"; ((FIXES++)) || true; }
warn()  { echo -e "${RED}[ WARN ]${NC} $*"; ((WARNINGS++)) || true; }

echo ""
info "Running auto-repair scan for: $REPO_ROOT"
echo "────────────────────────────────────────────"

# ── 1. Validate all JSON files tracked by git ────────────────────────────────
info "Checking JSON file validity..."
JSON_ERRORS=0
while IFS= read -r -d '' f; do
  if ! node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" 2>/dev/null; then
    warn "Invalid JSON: $f"
    ((JSON_ERRORS++)) || true
  fi
done < <(git ls-files -z '*.json' 2>/dev/null)

if [[ $JSON_ERRORS -eq 0 ]]; then
  ok "All tracked JSON files are valid"
else
  warn "$JSON_ERRORS invalid JSON file(s) found — fix them before committing"
fi

# ── 2. Remove accidentally staged binary / media junk ────────────────────────
info "Checking for accidentally staged large binaries..."
LARGE_STAGED=()
while IFS= read -r f; do
  SIZE=$(git cat-file -s "$(git hash-object "$f" 2>/dev/null)" 2>/dev/null || stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
  if [[ $SIZE -gt 10485760 ]]; then # > 10 MB
    LARGE_STAGED+=("$f ($(( SIZE / 1048576 ))MB)")
  fi
done < <(git diff --cached --name-only --diff-filter=ACM 2>/dev/null)

if [[ ${#LARGE_STAGED[@]} -eq 0 ]]; then
  ok "No oversized files staged"
else
  for f in "${LARGE_STAGED[@]}"; do
    warn "Large file staged: $f"
    if [[ "$DRY_RUN" == false ]]; then
      git reset HEAD -- "${f%% *}" 2>/dev/null || true
      fix "Unstaged: $f"
    fi
  done
fi

# ── 3. Ensure .gitignore covers common IDE/tool dirs ─────────────────────────
info "Checking .gitignore coverage..."
GITIGNORE="$REPO_ROOT/.gitignore"
MISSING_IGNORES=()

# Use parallel arrays for bash 3.2 compatibility (macOS default shell)
IGNORE_PATTERNS=(".kilo/" ".cursor/" ".windsurf/" "*.log" ".DS_Store" ".env" "node_modules/")
IGNORE_LABELS=("Kilo Code IDE" "Cursor IDE" "Windsurf IDE" "Log files" "macOS metadata" "Secret env files" "Node modules")

for i in "${!IGNORE_PATTERNS[@]}"; do
  pattern="${IGNORE_PATTERNS[$i]}"
  label="${IGNORE_LABELS[$i]}"
  if ! grep -qF "$pattern" "$GITIGNORE" 2>/dev/null; then
    MISSING_IGNORES+=("$pattern  # $label")
  fi
done

if [[ ${#MISSING_IGNORES[@]} -eq 0 ]]; then
  ok ".gitignore covers all common IDE/tool patterns"
else
  if [[ "$DRY_RUN" == false ]]; then
    echo "" >> "$GITIGNORE"
    echo "# Auto-added by git-autorepair.sh" >> "$GITIGNORE"
    for entry in "${MISSING_IGNORES[@]}"; do
      echo "$entry" >> "$GITIGNORE"
      fix "Added to .gitignore: $entry"
    done
    git add .gitignore 2>/dev/null || true
  else
    for entry in "${MISSING_IGNORES[@]}"; do
      warn "Missing from .gitignore: $entry"
    done
  fi
fi

# ── 4. Remove already-tracked files that should now be ignored ───────────────
info "Checking for tracked files that should be gitignored..."
SHOULD_IGNORE=()
while IFS= read -r f; do
  if git check-ignore -q "$f" 2>/dev/null; then
    SHOULD_IGNORE+=("$f")
  fi
done < <(git ls-files 2>/dev/null)

if [[ ${#SHOULD_IGNORE[@]} -eq 0 ]]; then
  ok "No tracked files violate .gitignore"
else
  for f in "${SHOULD_IGNORE[@]}"; do
    warn "Tracked but gitignored: $f"
    if [[ "$DRY_RUN" == false ]]; then
      git rm --cached "$f" 2>/dev/null || true
      fix "Removed from git tracking: $f"
    fi
  done
fi

# ── 5. Abort if there are unresolved merge conflicts ─────────────────────────
info "Checking for merge conflict markers..."
CONFLICT_FILES=()
while IFS= read -r f; do
  if grep -qlP '^(<{7}|={7}|>{7})' "$f" 2>/dev/null; then
    CONFLICT_FILES+=("$f")
  fi
done < <(git diff --name-only --diff-filter=U 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)

if [[ ${#CONFLICT_FILES[@]} -eq 0 ]]; then
  ok "No merge conflict markers detected"
else
  for f in "${CONFLICT_FILES[@]}"; do
    warn "Conflict markers in: $f"
  done
fi

# ── 6. Ensure git user identity is set ───────────────────────────────────────
info "Checking git identity..."
GIT_USER=$(git config user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")

if [[ -z "$GIT_USER" || -z "$GIT_EMAIL" ]]; then
  if [[ "$DRY_RUN" == false ]]; then
    [[ -z "$GIT_USER" ]]  && git config user.name  "Agape Sovereign" && fix "Set git user.name = Agape Sovereign"
    [[ -z "$GIT_EMAIL" ]] && git config user.email "izrl613@github.com" && fix "Set git user.email = izrl613@github.com"
  else
    warn "Git identity not configured (user.name / user.email missing)"
  fi
else
  ok "Git identity: $GIT_USER <$GIT_EMAIL>"
fi

# ── 7. Verify remote 'origin' is reachable ───────────────────────────────────
info "Checking remote origin..."
if git ls-remote --exit-code origin HEAD &>/dev/null; then
  ok "Remote origin is reachable"
else
  warn "Remote origin is unreachable — check network / credentials"
fi

# ── 8. Ensure we are on 'main' and in sync ───────────────────────────────────
info "Checking branch sync status..."
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
if [[ "$CURRENT_BRANCH" == "main" ]]; then
  BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
  AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
  if [[ "$BEHIND" -gt 0 ]]; then
    warn "Branch is $BEHIND commit(s) behind origin/main"
    if [[ "$DRY_RUN" == false ]]; then
      git pull --rebase origin main 2>/dev/null && fix "Pulled and rebased from origin/main" || warn "Auto-pull failed — resolve manually"
    fi
  elif [[ "$AHEAD" -gt 0 ]]; then
    info "Branch is $AHEAD commit(s) ahead of origin/main (will push)"
  else
    ok "Branch is in sync with origin/main"
  fi
else
  info "On branch '$CURRENT_BRANCH' (not main)"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────────"
if [[ $JSON_ERRORS -gt 0 || ${#CONFLICT_FILES[@]} -gt 0 ]]; then
  echo -e "${RED}[autorepair] BLOCKED: $JSON_ERRORS JSON error(s), ${#CONFLICT_FILES[@]} conflict(s) must be fixed manually.${NC}"
  exit 1
fi

if [[ $FIXES -gt 0 ]]; then
  echo -e "${GREEN}[autorepair] Applied $FIXES auto-fix(es). Ready to commit.${NC}"
else
  echo -e "${GREEN}[autorepair] All checks passed. Ready to commit.${NC}"
fi
echo ""
