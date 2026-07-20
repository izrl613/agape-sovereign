#!/usr/bin/env bash
# ============================================================
# Agape Sovereign — Firebase Setup Script
# Run this once after cloning, or anytime you need to verify
# that all Firebase services are properly configured.
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIREBASE_PROJECT="agape-sovereign"

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Agape Sovereign — Firebase Setup Verifier     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" -eq 0 ]; then
    echo -e "  ${GREEN}✔${NC} $label"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✘${NC} $label"
    FAIL=$((FAIL + 1))
  fi
}

warn() {
  local label="$1"
  echo -e "  ${YELLOW}⚠${NC} $label"
}

# ── 1. Firebase CLI ──────────────────────────────────────────
echo -e "${CYAN}[1/6] Firebase CLI${NC}"
if npx -y firebase-tools@latest --version > /dev/null 2>&1; then
  CLI_VERSION=$(npx -y firebase-tools@latest --version 2>/dev/null)
  check "Firebase CLI v${CLI_VERSION}" 0
else
  check "Firebase CLI not available" 1
fi

# ── 2. Firebase Auth ─────────────────────────────────────────
echo -e "${CYAN}[2/6] Firebase Authentication${NC}"
FIREBASE_USER=$(npx -y firebase-tools@latest login --interactive 2>&1 | head -1 || true)
if echo "$FIREBASE_USER" | grep -qi "logged in"; then
  check "Logged in to Firebase" 0
else
  warn "Not logged in — run: npx -y firebase-tools@latest login"
  FAIL=$((FAIL + 1))
fi

# ── 3. Active Project ───────────────────────────────────────
echo -e "${CYAN}[3/6] Firebase Project${NC}"
cd "$PROJECT_ROOT"
ACTIVE_PROJECT=$(npx -y firebase-tools@latest use 2>&1 || true)
if echo "$ACTIVE_PROJECT" | grep -q "$FIREBASE_PROJECT"; then
  check "Active project: ${FIREBASE_PROJECT}" 0
else
  echo -e "  ${YELLOW}Setting active project to ${FIREBASE_PROJECT}...${NC}"
  if npx -y firebase-tools@latest use "$FIREBASE_PROJECT" > /dev/null 2>&1; then
    check "Active project set: ${FIREBASE_PROJECT}" 0
  else
    check "Failed to set active project" 1
  fi
fi

# ── 4. Dependencies ─────────────────────────────────────────
echo -e "${CYAN}[4/6] Installing Dependencies${NC}"

echo -e "  Installing root workspace (includes frontend + backend)..."
cd "$PROJECT_ROOT"
if npm install --silent 2>&1 | tail -1; then
  check "Root workspace dependencies" 0
else
  check "Root workspace dependencies" 1
fi

echo -e "  Installing functions workspace..."
cd "$PROJECT_ROOT/functions"
if npm install --silent 2>&1 | tail -1; then
  check "Functions dependencies" 0
else
  check "Functions dependencies" 1
fi

# ── 5. Service Account / ADC ────────────────────────────────
echo -e "${CYAN}[5/6] Credentials${NC}"
cd "$PROJECT_ROOT"
if [ -f "serviceAccountKey.json" ]; then
  check "serviceAccountKey.json found" 0
else
  warn "No serviceAccountKey.json — server will use Application Default Credentials"
  # Check if ADC is configured
  if gcloud auth application-default print-access-token > /dev/null 2>&1; then
    check "Application Default Credentials (ADC) configured" 0
  else
    warn "ADC not configured — run: gcloud auth application-default login"
    FAIL=$((FAIL + 1))
  fi
fi

# ── 6. Config Files ─────────────────────────────────────────
echo -e "${CYAN}[6/6] Configuration Files${NC}"
cd "$PROJECT_ROOT"

[ -f "firebase.json" ] && check "firebase.json" 0 || check "firebase.json missing" 1
[ -f ".firebaserc" ] && check ".firebaserc" 0 || check ".firebaserc missing" 1
[ -f "firebase-applet-config.json" ] && check "firebase-applet-config.json (client config)" 0 || check "firebase-applet-config.json missing" 1
[ -f "firestore.rules" ] && check "firestore.rules" 0 || check "firestore.rules missing" 1
[ -f "storage.rules" ] && check "storage.rules" 0 || check "storage.rules missing" 1
[ -f "src/firebase.ts" ] && check "src/firebase.ts (client SDK init)" 0 || check "src/firebase.ts missing" 1
[ -f "backend/services/firebase-admin.js" ] && check "backend/services/firebase-admin.js" 0 || check "backend/services/firebase-admin.js missing" 1
[ -f "functions/index.js" ] && check "functions/index.js" 0 || check "functions/index.js missing" 1

# ── Summary ──────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}All ${PASS} checks passed!${NC} Firebase is ready."
else
  echo -e "  ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}."
  echo -e "  Fix the issues above and re-run this script."
fi
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "Quick commands:"
echo -e "  ${CYAN}npm run dev${NC}              — Start frontend + backend"
echo -e "  ${CYAN}npx -y firebase-tools@latest emulators:start${NC}  — Start emulators"
echo -e "  ${CYAN}npm run deploy${NC}           — Deploy to Firebase"
echo ""

exit $FAIL
