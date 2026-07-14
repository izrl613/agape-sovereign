#!/usr/bin/env bash
# Architect AI MCP Server — local quick start
# Ensures Ollama is serving gemma4:e4b, then starts the MCP server locally.
#
# For production (sovereign.nyc), deploy to Cloud Run instead:
#   cd architect-mcp-server
#   gcloud run deploy architect-ai \
#     --source . \
#     --region us-central1 \
#     --project agape-sovereign \
#     --set-env-vars OLLAMA_BASE_URL=<your-ollama-url>,ALLOWED_ORIGINS=https://sovereign.nyc \
#     --allow-unauthenticated

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🏛️  Architect AI MCP Server — Startup"
echo ""

# 1. Check Ollama
if ! command -v ollama &>/dev/null; then
  echo "❌  Ollama not found. Install from https://ollama.com/download"
  exit 1
fi

# 2. Ensure Ollama is running
if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "▶  Starting Ollama..."
  ollama serve &
  OLLAMA_PID=$!
  sleep 2
  echo "   Ollama started (PID $OLLAMA_PID)"
else
  echo "✅  Ollama already running"
fi

# 3. Check model
if ! ollama list 2>/dev/null | grep -q "gemma4:e4b"; then
  echo "Pulling gemma4:e4b (about 9.6 GB; first run only)..."
  ollama pull gemma4:e4b
fi
echo "Model gemma4:e4b ready"

# 4. Install deps if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "📦  Installing dependencies..."
  cd "$SCRIPT_DIR" && npm install
fi

# 5. Start MCP server
echo ""
echo "🚀  Starting MCP server on http://127.0.0.1:3001"
echo ""
cd "$SCRIPT_DIR" && npm run dev
