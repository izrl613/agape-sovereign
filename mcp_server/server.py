"""
mcp_server/server.py — Architect AI MCP Server
Agape Sovereign Enclave | Offline LLM via MCP Protocol

Implements the Model Context Protocol (MCP) JSON-RPC 2.0 over HTTP.
Exposes one tool: architect_ai_chat

Deployment targets:
  - Local:      python mcp_server/server.py
  - Cloud Run:  Containerized via Dockerfile (Ollama sidecar for offline LLM)

AI Backend: LOCAL OFFLINE ONLY
  Primary  — Ollama at $OLLAMA_HOST (default: localhost:11434)
  Fallback — LM Studio at $LMSTUDIO_HOST (default: localhost:1234)

NO VERTEX AI. NO GEMINI API. NO CLOUD AI SERVICES.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

# ---------------------------------------------------------------------------
# Config — environment-driven for container deployments
# ---------------------------------------------------------------------------

PORT = int(os.environ.get("MCP_PORT", "8080"))
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
LMSTUDIO_HOST = os.environ.get("LMSTUDIO_HOST", "http://localhost:1234")

# Model priority list for Ollama (smallest/fastest first for Cloud Run cost)
OLLAMA_MODEL_PRIORITY = [
    os.environ.get("OLLAMA_MODEL", ""),
    "gemma2:2b",
    "gemma4:e2b",
    "qwen2.5-coder:7b",
    "llama3.2:3b",
    "mistral:7b",
]
LMSTUDIO_MODEL = os.environ.get("LMSTUDIO_MODEL", "qwen3.5-9b-sushi-coder-rl-mlx")

# MCP server metadata
SERVER_NAME = "architect-ai-mcp"
SERVER_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Architect AI system prompt (condensed for MCP tool responses)
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """You are Architect AI, the sovereign intelligence engine of the Agape Sovereign platform at sovereign.nyc.
You are a specialized, privacy-first Digital Identity Federated Footprint (DIFF) intelligence agent.
Your sole purpose: help users understand, protect, reclaim, and harden their digital identity.

Classify every finding as NUKED (exposure found), KNOXED (secured), or MONITORED.
Route queries only to those about digital identity security. Decline off-topic requests.
Admin: Israel David (idin@agape.nyc). Architecture: Firebase zero-knowledge, offline LLM, no Vertex AI.
Compliance: ECRA 2026, GDPR, CCPA, WebAuthn Level 3."""

# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------

def _http_post(url: str, payload: dict, timeout: int = 120) -> dict | None:
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            url, data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"[MCP] HTTP error → {url}: {e}", file=sys.stderr)
        return None


def _http_get(url: str, timeout: int = 3) -> dict | None:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return json.loads(resp.read())
    except Exception:
        return None


def _ollama_model() -> str | None:
    """Return first available Ollama model or None."""
    data = _http_get(f"{OLLAMA_HOST}/api/tags", timeout=3)
    if not data:
        return None
    available = {m["name"] for m in data.get("models", [])}
    for candidate in OLLAMA_MODEL_PRIORITY:
        if candidate and candidate in available:
            return candidate
    return sorted(available)[0] if available else None


def _lmstudio_model() -> str | None:
    """Return first available LM Studio model or None."""
    data = _http_get(f"{LMSTUDIO_HOST}/v1/models", timeout=2)
    if not data:
        return None
    models = [m["id"] for m in data.get("data", [])]
    if LMSTUDIO_MODEL in models:
        return LMSTUDIO_MODEL
    return models[0] if models else None


def _infer(messages: list[dict], max_tokens: int = 1200, temperature: float = 0.2) -> tuple[str, str]:
    """
    Run chat completion against offline LLM.
    Priority: Ollama → LM Studio → unavailable.
    Returns (response_text, backend_label).
    """
    # 1. Try Ollama
    model = _ollama_model()
    if model:
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        }
        result = _http_post(f"{OLLAMA_HOST}/api/chat", payload, timeout=180)
        if result:
            text = result.get("message", {}).get("content", "").strip()
            if text:
                return text, f"ollama:{model}"

    # 2. Try LM Studio (fallback for local dev)
    model = _lmstudio_model()
    if model:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
        }
        result = _http_post(f"{LMSTUDIO_HOST}/v1/chat/completions", payload, timeout=180)
        if result:
            text = (
                result.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
            if text:
                return text, f"lmstudio:{model}"

    return (
        "[ARCHITECT AI OFFLINE] No local LLM available. "
        "Start Ollama (ollama serve) or LM Studio with API server enabled.",
        "unavailable",
    )


# ---------------------------------------------------------------------------
# MCP Protocol handlers
# ---------------------------------------------------------------------------

def _mcp_initialize(req_id: Any) -> dict:
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
        },
    }


def _mcp_list_tools(req_id: Any) -> dict:
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "result": {
            "tools": [
                {
                    "name": "architect_ai_chat",
                    "description": (
                        "Chat with Architect AI — the Agape Sovereign DIFF intelligence engine. "
                        "Powered by local offline LLM (Ollama / LM Studio). No Vertex AI."
                    ),
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "message": {
                                "type": "string",
                                "description": "User message or query for Architect AI.",
                            },
                            "session_history": {
                                "type": "array",
                                "description": "Optional prior conversation turns [{role, content}].",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "role": {"type": "string"},
                                        "content": {"type": "string"},
                                    },
                                },
                            },
                        },
                        "required": ["message"],
                    },
                },
                {
                    "name": "architect_ai_health",
                    "description": "Check Architect AI MCP server health and LLM backend status.",
                    "inputSchema": {"type": "object", "properties": {}},
                },
            ]
        },
    }


def _mcp_call_tool(req_id: Any, tool_name: str, arguments: dict) -> dict:
    if tool_name == "architect_ai_health":
        ollama_model = _ollama_model()
        lmstudio_model = _lmstudio_model()
        health = {
            "status": "ok" if (ollama_model or lmstudio_model) else "degraded",
            "ollama": ollama_model or "unavailable",
            "lmstudio": lmstudio_model or "unavailable",
            "vertex_ai": "DISABLED — offline LLM only",
            "server": SERVER_NAME,
            "version": SERVER_VERSION,
        }
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(health, indent=2)}]
            },
        }

    if tool_name == "architect_ai_chat":
        user_message = arguments.get("message", "")
        history = arguments.get("session_history", [])

        messages = [{"role": "system", "content": _SYSTEM_PROMPT}]
        messages.extend(history[-18:])  # keep last 18 turns
        messages.append({"role": "user", "content": user_message})

        response_text, backend = _infer(messages)

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [{"type": "text", "text": response_text}],
                "_meta": {"backend": backend},
            },
        }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"},
    }


def _dispatch(body: dict) -> dict:
    req_id = body.get("id")
    method = body.get("method", "")

    if method == "initialize":
        return _mcp_initialize(req_id)
    if method == "tools/list":
        return _mcp_list_tools(req_id)
    if method == "tools/call":
        params = body.get("params", {})
        return _mcp_call_tool(req_id, params.get("name", ""), params.get("arguments", {}))
    if method == "notifications/initialized":
        return {}  # no response for notifications

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------

class MCPHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:  # less noisy logs
        print(f"[MCP] {fmt % args}", file=sys.stderr)

    def do_GET(self) -> None:  # health probe for Cloud Run / load balancers
        if self.path in ("/", "/health"):
            ollama_ok = bool(_ollama_model())
            lmstudio_ok = bool(_lmstudio_model())
            status = 200 if (ollama_ok or lmstudio_ok) else 503
            body = json.dumps({
                "status": "ok" if status == 200 else "degraded",
                "ollama": ollama_ok,
                "lmstudio": lmstudio_ok,
                "vertex_ai": "DISABLED",
            }).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        result = _dispatch(body)

        if not result:  # notification — no response body
            self.send_response(204)
            self.end_headers()
            return

        resp_body = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(resp_body)))
        self.end_headers()
        self.wfile.write(resp_body)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"[MCP] Architect AI MCP Server v{SERVER_VERSION}")
    print(f"[MCP] Listening on port {PORT}")
    print(f"[MCP] Ollama host  : {OLLAMA_HOST}")
    print(f"[MCP] LM Studio    : {LMSTUDIO_HOST}")
    print(f"[MCP] Vertex AI    : DISABLED (offline LLM only)")

    server = HTTPServer(("0.0.0.0", PORT), MCPHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[MCP] Server stopped.")
