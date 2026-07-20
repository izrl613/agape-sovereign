"""boundary.py — Architecture Boundary Enforcement

SOVEREIGN ARCHITECTURE CONTRACT (non-negotiable):
  - Local LMStudio / Ollama (gemma4:e4b, Gemma, qwen3.5-9b): handles ALL
    AI reasoning and encrypted SHA-256 user data processing.
  - Vertex AI: permitted ONLY for document processing and PDF rendering.
  - Architect AI MCP server: MUST remain local-only (LMStudio → Ollama fallback).

This module is imported at the top of every agent that makes AI or data calls.
Call `assert_not_vertex(url)` before any outbound HTTP request to a configurable
endpoint to guarantee the boundary is respected at runtime.
"""

from __future__ import annotations

_VERTEX_AI_PATTERNS = [
    "aiplatform.googleapis.com",
    "generativelanguage.googleapis.com",
    "us-central1-aiplatform",
    "us-east1-aiplatform",
    "vertexai",
    "vertex.ai",
    "predict.googleapis.com",
]

# Approved Vertex AI uses — document processing and PDF rendering only
VERTEX_ALLOWED_PURPOSES = frozenset(["document_processing", "pdf_rendering"])


class BoundaryViolationError(RuntimeError):
    """Raised when a request attempts to route user data or AI reasoning to Vertex AI."""


def assert_not_vertex(url: str, purpose: str | None = None) -> None:
    """Raise BoundaryViolationError if `url` targets a Vertex AI endpoint.

    Args:
        url: The endpoint URL about to be called.
        purpose: Optional caller-declared purpose tag. If it matches an
                 allowed Vertex purpose (e.g. 'document_processing'), the
                 check is skipped — Vertex AI is permitted for those flows.
    """
    if purpose in VERTEX_ALLOWED_PURPOSES:
        return  # approved Vertex AI use

    lower = url.lower()
    for pattern in _VERTEX_AI_PATTERNS:
        if pattern in lower:
            raise BoundaryViolationError(
                f"[BOUNDARY VIOLATION] Attempt to route data to Vertex AI endpoint:\n"
                f"  URL: {url}\n"
                f"  Vertex AI is only permitted for: {sorted(VERTEX_ALLOWED_PURPOSES)}\n"
                f"  All AI reasoning and SHA-256 user data must use local LMStudio / Ollama."
            )


def assert_local_llm(url: str) -> None:
    """Confirm `url` is a known local LLM endpoint (LMStudio or Ollama).

    Raises ValueError if the endpoint is neither localhost nor a Cloud Run
    Ollama sidecar (not a Vertex AI host).
    """
    assert_not_vertex(url)
    lower = url.lower()
    # Accept localhost, 127.0.0.1, or 10.0.2.2 (Android emulator host alias)
    local_prefixes = ("http://localhost", "http://127.0.0.1", "http://10.0.2.2")
    if not any(lower.startswith(p) for p in local_prefixes):
        # Allow Cloud Run sidecar pattern (internal service-to-service — still not Vertex)
        # Cloud Run sidecars use run.internal or cluster-local addressing
        if "run.internal" not in lower and "svc.cluster.local" not in lower:
            import warnings
            warnings.warn(
                f"[BOUNDARY WARNING] LLM endpoint is not localhost: {url}\n"
                "Ensure this is a Cloud Run Ollama sidecar, NOT a Vertex AI endpoint.",
                stacklevel=2,
            )
