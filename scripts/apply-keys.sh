#!/usr/bin/env bash
# ================================================================
# apply-keys.sh — Injects ALL API keys into Antigravity IDE config
# Wires up every ChatGPT-equivalent connector for AGY
#
# Usage: bash scripts/apply-keys.sh
# ================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.keys"
MCP_CONFIG="$ROOT/mcp_config_backup.json"
SETTINGS="$ROOT/.vscode/settings.json"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ANTIGRAVITY IDE — ChatGPT Connector Setup v2.0    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Load .env.keys ────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env.keys not found at $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

APPLIED=0
SKIPPED=0

apply_key() {
  local key_name="$1"
  local key_value="$2"
  local placeholder="$3"
  local description="$4"

  if [[ -n "${key_value:-}" && "$key_value" != *"PASTE"* && "$key_value" != "sk-PASTE"* ]]; then
    sed -i '' "s|$placeholder|$key_value|g" "$MCP_CONFIG"
    # Also apply to settings.json if placeholder exists there
    grep -q "$placeholder" "$SETTINGS" 2>/dev/null && \
      sed -i '' "s|$placeholder|$key_value|g" "$SETTINGS"
    echo "  ✅ $description"
    ((APPLIED++)) || true
  else
    echo "  ⚠️  $description — NOT SET (skipped)"
    ((SKIPPED++)) || true
  fi
}

echo "🔑 Applying API keys..."
echo ""

apply_key "OPENAI_API_KEY"              "${OPENAI_API_KEY:-}"              "OPENAI_API_KEY_PLACEHOLDER"     "OpenAI / ChatGPT (DALL·E, GPT-4o)"
apply_key "GITHUB_PERSONAL_ACCESS_TOKEN" "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" "GITHUB_PAT_PLACEHOLDER"         "GitHub (Issues, PRs, Repos)"
apply_key "BRAVE_API_KEY"              "${BRAVE_API_KEY:-}"               "BRAVE_API_KEY_PLACEHOLDER"      "Brave Search (Web Browse)"
apply_key "FIRECRAWL_API_KEY"          "${FIRECRAWL_API_KEY:-}"           "FIRECRAWL_API_KEY_PLACEHOLDER"  "Firecrawl (Deep Web Scraping)"
apply_key "EXA_API_KEY"                "${EXA_API_KEY:-}"                 "EXA_API_KEY_PLACEHOLDER"        "EXA AI (Semantic Search)"
apply_key "NOTION_API_KEY"             "${NOTION_API_KEY:-}"              "NOTION_API_KEY_PLACEHOLDER"     "Notion (Knowledge Base)"
apply_key "SLACK_BOT_TOKEN"            "${SLACK_BOT_TOKEN:-}"             "SLACK_BOT_TOKEN_PLACEHOLDER"    "Slack (Team Messaging)"
apply_key "SLACK_TEAM_ID"              "${SLACK_TEAM_ID:-}"               "SLACK_TEAM_ID_PLACEHOLDER"      "Slack Team ID"

# ── Update git remote with GitHub PAT ─────────────────────────
if [[ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" && "$GITHUB_PERSONAL_ACCESS_TOKEN" != *"PASTE"* ]]; then
  git -C "$ROOT" remote set-url origin \
    "https://izrl613:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/izrl613/agape-sovereign.git" 2>/dev/null && \
    echo "  ✅ GitHub remote URL updated with PAT auth" || true
fi

# ── Install MCP servers via npx (pre-cache) ───────────────────
echo ""
echo "📦 Pre-installing MCP server packages..."
echo ""

install_mcp() {
  local pkg="$1"
  local name="$2"
  if npx -y "$pkg" --version &>/dev/null 2>&1; then
    echo "  ✅ $name"
  else
    # Trigger install silently
    npx -y "$pkg" --help &>/dev/null 2>&1 || true
    echo "  📥 $name (installing on first use)"
  fi
}

install_mcp "@modelcontextprotocol/server-brave-search"    "Brave Search MCP"
install_mcp "@modelcontextprotocol/server-memory"          "Memory MCP"
install_mcp "@modelcontextprotocol/server-sequential-thinking" "Sequential Thinking MCP"
install_mcp "@modelcontextprotocol/server-filesystem"      "Filesystem MCP"
install_mcp "@modelcontextprotocol/server-github"          "GitHub MCP"
install_mcp "firecrawl-mcp"                                "Firecrawl MCP"
install_mcp "@modelcontextprotocol/server-puppeteer"       "Puppeteer Web Browser MCP"

# uvx-based servers
if command -v uvx &>/dev/null; then
  uvx mcp-server-fetch --help &>/dev/null 2>&1 || true
  echo "  ✅ Fetch MCP (uvx)"
fi

# ── Summary ────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅ Applied: $APPLIED keys"
echo "  ⚠️  Skipped: $SKIPPED (fill in .env.keys to enable)"
echo "══════════════════════════════════════════════════════"
echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "  1. Copy the updated MCP config to Antigravity IDE:"
echo "     The config is at: mcp_config_backup.json"
echo "     In AGY: Cmd+Shift+P → 'Open MCP Settings' → paste content"
echo ""
echo "  2. Reload Antigravity IDE:"
echo "     Cmd+Shift+P → 'Developer: Reload Window'"
echo ""
echo "  3. Verify connectors are active:"
echo "     Look for green dots next to MCP servers in AGY sidebar"
echo ""
if [[ $SKIPPED -gt 0 ]]; then
  echo "  📝 To add missing keys:"
  echo "     Open .env.keys → fill in placeholders → re-run this script"
  echo ""
fi
echo "  📖 Full connector guide: AGENTS.md"
echo ""
