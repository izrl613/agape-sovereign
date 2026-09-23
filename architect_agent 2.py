"""
architect_agent.py — ARCHITECT AI | Agape Sovereign Enclave
Digital Identity Federated Footprint (DIFF) Intelligence Platform
Version: 2026-LTS | Compliance: ECRA 2026

AI Backend: LOCAL OFFLINE LLM ONLY
  Primary:  LM Studio  — http://localhost:1234  (qwen3.5-9b-sushi-coder-rl-mlx)
  Fallback: Ollama     — http://localhost:11434  (gemma2:2b / qwen2.5-coder:7b)

NO VERTEX AI. NO GEMINI API. NO CLOUD AI CALLS.
All inference runs through the local MCP server (mcp_server/) or directly
against the local LLM endpoints above.
"""
from __future__ import annotations

import sys
import os

# ---------------------------------------------------------------------------
# Route project imports when running from repo root
# ---------------------------------------------------------------------------
_REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from agents.lmstudio import chat_complete  # noqa: E402


# ---------------------------------------------------------------------------
# System Prompt — full ARCHITECT AI persona (offline-safe, no cloud refs)
# ---------------------------------------------------------------------------
_ARCHITECT_SYSTEM_PROMPT = '''# ARCHITECT AI — SOVEREIGN INTELLIGENCE ENGINE
## Agape Sovereign Enclave | Digital Identity Federated Footprint (DIFF)
### Version: 2026-LTS | Compliance: ECRA 2026 | Runtime: Offline LLM + MCP Server

---

## AGENT IDENTITY & CORE DIRECTIVE

You are Architect AI, the sovereign intelligence engine of the Agape Sovereign
privacy and security platform at sovereign.nyc. You are NOT a general-purpose
assistant. You are a specialized, real-time, privacy-first DIFF intelligence
agent. Your sole purpose: help users understand, protect, reclaim, and harden
every dimension of their digital identity across email, social media, devices,
cloud storage, data brokers, and the open web.

Every finding is classified as:
- NUKED  — Exposure identified. Actionable removal/remediation available.
- KNOXED — Exposure secured, encrypted, or passkey-hardened. Asset protected.
- MONITORED — Under observation; no immediate action required.

---

## OPERATOR CONTEXT

- Platform: Agape Sovereign | Domain: sovereign.nyc
- Admin: Israel David (Izrael) — idin@agape.nyc | agape@sovereign.nyc
- Architecture: Firebase zero-knowledge, session-scoped, no plaintext PII
- AI Backend: LOCAL OFFLINE LLM — LM Studio / Ollama. NO VERTEX AI.
- Compliance: ECRA 2026 LTS, GDPR, CCPA, WebAuthn Level 3, FIDO2, NIST 800-63B

---

## ZERO-KNOWLEDGE PRIVACY MANDATE

1. No PII stored in plaintext. All identity data is AES-256 encrypted client-side.
2. Session-scoped context only. No cross-session memory without explicit user save.
3. No data shared with third parties, administrator, or cloud AI providers.
4. Admin access is hardware-bound (WebAuthn passkey, physical device only).
5. Data minimization: collect only what the active DIFF module requires.

---

## DIFF MODULE ROUTING

You route every query through one filter first:
"Is this about the user's Digital Identity Federated Footprint?"
- YES → route to the appropriate DIFF module (16 modules available)
- NO  → respond: "Architect AI is focused exclusively on your digital identity
         security and privacy. Redirect your question to a topic within your
         DIFF profile."

### Module Router (16 DIFF Vectors)
M01 Email Security     | M02 Social Media PII   | M03 Device Security
M04 Dark Web Exposure  | M05 Cloud Storage       | M06 Data Broker Removal
M07 Password & Creds   | M08 Network & DNS       | M09 Financial Identity
M10 Identity Documents | M11 Third-Party OAuth   | M12 Communication Privacy
M13 Public Records     | M14 AI/Biometric Data   | M15 OSINT Surface
M16 Sovereign Score Engine

---

## SOVEREIGN SCORE ENGINE

SovereignScore = 100 - sum(ModuleRiskScore x ModuleWeight)

Score Tiers:
85-100 → KNOXED SOVEREIGN  (Neon Blue  #00D4FF)
65-84  → PARTIALLY SECURED (Neon Orange #FF7A18)
40-64  → EXPOSURE RISK     (Neon Magenta #FF2E9F)
0-39   → CRITICALLY NUKED  (Pulsing Red)

---

## BEHAVIORAL RULES

- Precise, authoritative, technically rigorous. Never alarmed.
- No filler phrases ("Great question!", "Certainly!", "Of course!").
- Lead with the answer, support with technical context.
- Use NUKED/KNOXED/DIFF/SOVEREIGN vocabulary naturally.
- Timestamp advisories: "As of Q1 2026..."
- After each module: recommend the next logical DIFF module.
- Hard limits: no offensive security, no unauthorized access guidance,
  no cross-user data, no admin disclosure to non-admin users.
'''


# ---------------------------------------------------------------------------
# ArchitectAgent — offline LLM wrapper
# ---------------------------------------------------------------------------

class ArchitectAgent:
    """
    Architect AI intelligence agent backed exclusively by local offline LLM.

    Usage:
        agent = ArchitectAgent()
        response = agent.chat("Scan my email breach surface.")
        print(response)
    """

    def __init__(self) -> None:
        self._history: list[dict] = []

    # ------------------------------------------------------------------

    def chat(self, user_message: str, max_tokens: int = 1200) -> tuple[str, str]:
        """
        Send a message to Architect AI and return (response_text, backend).

        backend is 'lmstudio:<model>', 'ollama:<model>', or 'unavailable'.
        """
        self._history.append({"role": "user", "content": user_message})

        messages = [
            {"role": "system", "content": _ARCHITECT_SYSTEM_PROMPT},
            *self._history[-20:],  # keep last 20 turns for context
        ]

        response_text, backend = chat_complete(
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.2,
        )

        if response_text:
            self._history.append({"role": "assistant", "content": response_text})
        else:
            response_text = (
                "[ARCHITECT AI OFFLINE] Local LLM unavailable. "
                "Ensure LM Studio is running with the API server enabled "
                "(Developer tab > Local API Server ON) or start Ollama."
            )
            backend = "unavailable"

        return response_text, backend

    def reset(self) -> None:
        """Clear conversation history for a new session."""
        self._history.clear()

    def sovereign_score(self, module_scores: dict[str, float]) -> float:
        """
        Calculate composite Sovereign Score from per-module risk scores.

        module_scores: {module_name: risk_score (0-100)}
        Returns: SovereignScore (0-100, higher = more secure)
        """
        weights = {
            "email_breach": 0.12,
            "data_broker": 0.12,
            "dark_web": 0.12,
            "credential_strength": 0.10,
            "device_security": 0.10,
            "social_media_pii": 0.08,
            "network_security": 0.08,
            "cloud_storage": 0.07,
            "financial_identity": 0.07,
            "third_party_oauth": 0.05,
            "communication_privacy": 0.04,
            "identity_documents": 0.03,
            "public_records": 0.01,
            "ai_biometric": 0.01,
        }
        penalty = sum(
            module_scores.get(k, 0) * w for k, w in weights.items()
        )
        return round(max(0.0, min(100.0, 100.0 - penalty)), 2)


# ---------------------------------------------------------------------------
# MCP-compatible tool interface (used by mcp_server/server.py)
# ---------------------------------------------------------------------------

_global_agent = ArchitectAgent()


def architect_ai_tool(user_message: str, session_id: str | None = None) -> dict:
    """
    MCP tool entry-point for Architect AI.

    Called by the MCP server to handle a chat turn.
    Returns { "response": str, "backend": str }
    """
    response, backend = _global_agent.chat(user_message)
    return {"response": response, "backend": backend}


# ---------------------------------------------------------------------------
# CLI smoke-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    agent = ArchitectAgent()
    print("ARCHITECT AI — Offline LLM Boot Test")
    print("=" * 50)
    test_q = "What is my current DIFF exposure surface and Sovereign Score baseline?"
    print(f"Q: {test_q}\n")
    resp, backend = agent.chat(test_q)
    print(f"Backend: {backend}\n")
    print(resp)
    print("\nAgent configurations generated successfully.")
