#!/usr/bin/env bash
# Start the Sovereign Automation MCP Server.
# Auth is fail-closed. Provide MCP_API_KEY (and/or Firebase JWT support) or
# explicitly set MCP_REQUIRE_AUTH=false for local-only development.
set -euo pipefail

: "${MCP_PORT:=8091}"
: "${MCP_REQUIRE_AUTH:=true}"

if [[ "${MCP_REQUIRE_AUTH}" == "true" && -z "${MCP_API_KEY:-}" ]]; then
  echo "[start] WARNING: MCP_REQUIRE_AUTH=true but MCP_API_KEY is unset." >&2
  echo "[start] The server will reject all POST requests unless PyJWT+Firebase tokens are used." >&2
fi

exec python3 "$(dirname "$0")/server.py"
