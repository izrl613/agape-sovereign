"""LMStudio local inference client — OpenAI-compatible API.

Agape Sovereign pipeline uses qwen3.5-9b-sushi-coder-rl-mlx running in LM Studio
as the primary local model for extraction and synthesis tasks.

Priority order for local LLM:
  1. LM Studio  — http://localhost:1234  (qwen3.5-9b-sushi-coder-rl-mlx preferred)
  2. Ollama     — http://localhost:11434 (qwen2.5-coder:7b fallback)

LM Studio must have "Local API Server" enabled from the Developer tab in its UI.
"""

import json
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple

# ── LM Studio ──────────────────────────────────────────────────────────────────
_LMSTUDIO_BASE = "http://localhost:1234"
_LMSTUDIO_MODELS_URL = f"{_LMSTUDIO_BASE}/v1/models"
_LMSTUDIO_CHAT_URL = f"{_LMSTUDIO_BASE}/v1/chat/completions"

# Target model as corrected by the user
LMSTUDIO_MODEL = "qwen3.5-9b-sushi-coder-rl-mlx"

# ── Ollama (fallback) ──────────────────────────────────────────────────────────
_OLLAMA_BASE = "http://localhost:11434"
_OLLAMA_TAGS_URL = f"{_OLLAMA_BASE}/api/tags"
_OLLAMA_CHAT_URL = f"{_OLLAMA_BASE}/api/chat"
_OLLAMA_PREFERRED = ["qwen2.5-coder:7b", "gemma4:e4b", "llama3:8b"]


def _http_get(url: str, timeout: int = 3) -> Optional[Dict]:
    """GET helper; returns parsed JSON or None on any failure."""
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except Exception:
        return None


def _http_post(url: str, payload: Dict, timeout: int = 120) -> Optional[Dict]:
    """POST helper; returns parsed JSON or None on any failure."""
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except Exception:
        return None


# ── Availability probes ────────────────────────────────────────────────────────

def lmstudio_available() -> Tuple[bool, str]:
    """Return (available, model_id). Checks LM Studio API and preferred model."""
    data = _http_get(_LMSTUDIO_MODELS_URL, timeout=2)
    if not data:
        return False, ""
    models = {m["id"] for m in data.get("data", [])}
    # Try exact name first, then prefix match
    if LMSTUDIO_MODEL in models:
        return True, LMSTUDIO_MODEL
    for m in models:
        if "qwen" in m.lower() and "coder" in m.lower():
            return True, m
    # Any model available beats nothing
    if models:
        return True, sorted(models)[0]
    return False, ""


def ollama_available() -> Tuple[bool, str]:
    """Return (available, model_id). Checks Ollama API."""
    data = _http_get(_OLLAMA_TAGS_URL, timeout=2)
    if not data:
        return False, ""
    available = {m["name"] for m in data.get("models", [])}
    for preferred in _OLLAMA_PREFERRED:
        if preferred in available:
            return True, preferred
    if available:
        return True, sorted(available)[0]
    return False, ""


# ── Unified inference call ─────────────────────────────────────────────────────

def chat_complete(
    messages: List[Dict[str, str]],
    max_tokens: int = 1024,
    temperature: float = 0.1,
) -> Tuple[str, str]:
    """
    Send a chat completion request to whichever local LLM is available.

    Returns (response_text, backend_label) where backend_label is
    'lmstudio', 'ollama', or 'unavailable'.
    """
    # ── Try LM Studio first ────────────────────────────────────────────────────
    ok, model_id = lmstudio_available()
    if ok:
        payload = {
            "model": model_id,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
        }
        result = _http_post(_LMSTUDIO_CHAT_URL, payload, timeout=180)
        if result:
            text = (
                result.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            if text.strip():
                return text.strip(), f"lmstudio:{model_id}"

    # ── Fall back to Ollama ────────────────────────────────────────────────────
    ok, model_id = ollama_available()
    if ok:
        payload = {
            "model": model_id,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        }
        result = _http_post(_OLLAMA_CHAT_URL, payload, timeout=180)
        if result:
            text = result.get("message", {}).get("content", "")
            if text.strip():
                return text.strip(), f"ollama:{model_id}"

    return "", "unavailable"


def chat_complete_json(
    messages: List[Dict[str, str]],
    max_tokens: int = 1024,
    temperature: float = 0.0,
) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Like chat_complete but parses and returns the JSON body.
    Strips markdown code fences before parsing.

    Returns (parsed_dict_or_None, backend_label).
    """
    import re

    raw, backend = chat_complete(messages, max_tokens=max_tokens, temperature=temperature)
    if not raw:
        return None, backend

    # Strip markdown code fences if present
    fence = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    clean = fence.group(1) if fence else raw.strip()
    # Some models add prose after the JSON block — try to trim it
    brace_end = clean.rfind("}")
    if brace_end != -1:
        clean = clean[: brace_end + 1]
    try:
        return json.loads(clean), backend
    except json.JSONDecodeError:
        return None, backend
