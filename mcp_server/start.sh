#!/bin/bash
# Architect AI MCP Server — Container Startup Script
# Starts Ollama (offline LLM) and then the MCP HTTP server
# NO VERTEX AI — all inference is local

set -e

echo "[START] Architect AI MCP Server"
echo "[START] AI Backend: LOCAL OFFLINE LLM (Ollama)"
echo "[START] Vertex AI: DISABLED"

# Start Ollama in the background
echo "[START] Starting Ollama..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "[START] Waiting for Ollama to initialize..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "[START] Ollama ready."
        break
    fi
    sleep 2
done

# Ensure preferred model is available
MODEL="${OLLAMA_MODEL:-gemma2:2b}"
echo "[START] Checking model: $MODEL"
if ! ollama list | grep -q "$MODEL"; then
    echo "[START] Pulling model $MODEL (first run)..."
    ollama pull "$MODEL"
fi
echo "[START] Model $MODEL ready."

# Start MCP server
echo "[START] Starting MCP server on port ${MCP_PORT:-8080}..."
exec python3 /app/mcp_server/server.py
