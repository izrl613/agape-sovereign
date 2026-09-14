#!/usr/bin/env bash
# ============================================================
# apply-keys.sh — Injects API keys into Antigravity IDE config
# Run: bash scripts/apply-keys.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.keys"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env.keys not found at $ENV_FILE"
  echo "   Create it first: cp .env.example .env.keys"
  exit 1
fi

# Load vars
source "$ENV_FILE"

echo "🔑 Applying API keys to Antigravity IDE config..."

# ── 1. Update .vscode/settings.json ──────────────────────────
SETTINGS="$ROOT/.vscode/settings.json"

if [[ -n "${OPENAI_API_KEY:-}" && "$OPENAI_API_KEY" != *"PASTE"* ]]; then
  sed -i '' "s|PASTE_YOUR_OPENAI_KEY_HERE|$OPENAI_API_KEY|g" "$SETTINGS"
  echo "  ✅ OpenAI key applied to .vscode/settings.json"
else
  echo "  ⚠️  OPENAI_API_KEY not set or still placeholder — skipping"
fi

# ── 2. Update mcp_config_backup.json ─────────────────────────
MCP_FILE="$ROOT/mcp_config_backup.json"

if [[ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" && "$GITHUB_PERSONAL_ACCESS_TOKEN" != *"PASTE"* ]]; then
  sed -i '' "s|PASTE_YOUR_GITHUB_PAT_HERE|$GITHUB_PERSONAL_ACCESS_TOKEN|g" "$MCP_FILE"
  echo "  ✅ GitHub PAT applied to mcp_config_backup.json"
else
  echo "  ⚠️  GITHUB_PERSONAL_ACCESS_TOKEN not set or still placeholder — skipping"
fi

if [[ -n "${OPENAI_API_KEY:-}" && "$OPENAI_API_KEY" != *"PASTE"* ]]; then
  sed -i '' "s|PASTE_YOUR_OPENAI_KEY_HERE|$OPENAI_API_KEY|g" "$MCP_FILE"
  echo "  ✅ OpenAI key applied to mcp_config_backup.json"
fi

# ── 3. Set git credential for GitHub ─────────────────────────
if [[ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" && "$GITHUB_PERSONAL_ACCESS_TOKEN" != *"PASTE"* ]]; then
  git -C "$ROOT" remote set-url origin "https://izrl613:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/izrl613/agape-sovereign.git"
  echo "  ✅ GitHub remote URL updated with PAT authentication"
fi

echo ""
echo "🚀 Done! Restart Antigravity IDE to load the new settings."
echo ""
echo "Next steps:"
echo "  1. Restart Antigravity IDE (Cmd+Shift+P → 'Reload Window')"
echo "  2. In Cline panel → Settings → select 'OpenAI (ChatGPT)' as provider"
echo "  3. Check GitKraken panel for GitHub integration"
