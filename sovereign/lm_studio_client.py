"""
lm_studio_client.py – LM Studio / Local MCP Client
Sovereign State Engine v1.0 | Agape Sovereign

Provides a reusable client for all modules to route AI inference to local LM Studio.
Endpoint: http://localhost:1234/v1 (OpenAI-compatible)
Available models (detected on this machine):
  - qwen3.5-9b-sushi-coder-rl-mlx  (primary — matches Operation Framework spec)
  - google/gemma-4-e4b
  - qwen2.5-coder:7b
"""
from __future__ import annotations
import json
import urllib.request
import urllib.error
from typing import Optional

LM_STUDIO_BASE = "http://localhost:1234/v1"
DEFAULT_MODEL = "qwen3.5-9b-sushi-coder-rl-mlx"


class LMStudioClient:
    """Thin OpenAI-compatible client for local LM Studio inference."""

    def __init__(self, base_url: str = LM_STUDIO_BASE, model: str = DEFAULT_MODEL, timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def is_available(self) -> bool:
        """Check if LM Studio server is reachable."""
        try:
            req = urllib.request.Request(f"{self.base_url}/models")
            with urllib.request.urlopen(req, timeout=5):
                return True
        except Exception:
            return False

    def list_models(self) -> list[str]:
        """List available models."""
        try:
            req = urllib.request.Request(f"{self.base_url}/models")
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.load(resp)
                return [m["id"] for m in data.get("data", [])]
        except Exception:
            return []

    def chat(
        self,
        messages: list[dict],
        max_tokens: int = 512,
        temperature: float = 0.3,
        model: Optional[str] = None,
    ) -> str:
        """Send chat completion request. Returns assistant message content."""
        payload = json.dumps({
            "model": model or self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            data = json.load(resp)
            return data["choices"][0]["message"]["content"].strip()

    def embed(self, text: str, model: str = "text-embedding-nomic-embed-text-v1.5") -> list[float]:
        """Generate embeddings via local LM Studio embedding model."""
        payload = json.dumps({"model": model, "input": text}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/embeddings",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            data = json.load(resp)
            return data["data"][0]["embedding"]
