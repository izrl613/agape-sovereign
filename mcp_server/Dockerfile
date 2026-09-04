# Architect AI MCP Server — Cloud Run Dockerfile
# Offline LLM via Ollama. NO VERTEX AI. NO GEMINI API.
#
# Architecture:
#   - Python MCP server (server.py) on port 8080
#   - Ollama runs as a sidecar process inside the same container
#   - Model: gemma2:2b (lightweight, ~1.5GB, near-zero inference cost)
#   - LM Studio fallback available via LMSTUDIO_HOST env var (local dev only)
#
# Cloud Run Notes:
#   - Requires min-instances=0 for cost savings (cold start ~60s on model load)
#   - Set min-instances=1 for consistent latency (small always-on cost)
#   - Memory: 4Gi recommended for gemma2:2b
#   - CPU: 2 vCPU minimum

FROM python:3.12-slim

# Install Ollama
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && \
    curl -fsSL https://ollama.ai/install.sh | sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set Ollama to store models in a consistent location
ENV OLLAMA_MODELS=/app/models
ENV OLLAMA_HOST=http://localhost:11434

# MCP Server config
ENV MCP_PORT=8080
ENV LMSTUDIO_HOST=http://localhost:1234
ENV OLLAMA_MODEL=gemma2:2b

# Create app directory
WORKDIR /app

# Copy MCP server source
COPY mcp_server/server.py ./mcp_server/server.py
COPY mcp_server/requirements.txt ./mcp_server/requirements.txt

# Copy startup script
COPY mcp_server/start.sh ./start.sh
RUN chmod +x ./start.sh

# Pull model at build time for faster cold starts
# (this adds ~1.5GB to image size — trade-off: faster startup vs larger image)
RUN ollama serve & \
    sleep 8 && \
    ollama pull gemma2:2b && \
    pkill ollama || true

# Expose MCP server port
EXPOSE 8080

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./start.sh"]
