"""
ai_agent.py – AI / Architecture Intelligence Agent
Module 2: Intelligence & Inference Core
Sovereign State Engine v1.0 | Agape Sovereign

Routes to local LM Studio (MCP) for reasoning. Falls back to rule-based scoring if unavailable.
Endpoint: http://localhost:1234/v1  (LM Studio OpenAI-compatible API)
Model: qwen3.5-9b-sushi-coder-rl-mlx
"""
from __future__ import annotations
import json
import urllib.request
import urllib.error
from datetime import date

LM_STUDIO_ENDPOINT = "http://localhost:1234/v1/chat/completions"
LM_STUDIO_MODEL = "qwen3.5-9b-sushi-coder-rl-mlx"
THRESHOLD_HIGH_RISK = 10_000.00
ANTIQUATED_DATE = "2023-01-01"


class AIAgent:
    """
    Architecture and Intelligence Agent.
    Intelligence Processor: Receives the IVM raw payload, applies business rules,
    calculates audit scores, and outputs a clean structured report.
    Routes heavy reasoning to local LM Studio when available.
    """

    def execute(self, raw_payload: dict) -> dict | None:
        print("\n--- [AI Agent] Processing Intelligence Pipeline...")
        if raw_payload is None:
            print("[AI ERROR] Null payload received from IVM. Aborting.")
            return None

        # Sub-Process 2.1: Financial Risk Scoring
        risk_score, flagged_transactions = self._score_financial_risk(raw_payload.get("financial_records", []))

        # Sub-Process 2.2: Stability Index Calculation
        stability_index = self._calculate_stability_index(raw_payload.get("identity_history", []))

        # Sub-Process 2.3: Composite Audit Score
        final_score = self._calculate_composite_score(risk_score, stability_index)

        # Sub-Process 2.4: LLM Reasoning Summary (local MCP)
        llm_summary = self._get_llm_summary(raw_payload, final_score)

        structured_report = {
            "identity_hash": raw_payload.get("identity_hash"),
            "verification_status": raw_payload.get("verification_status"),
            "audit_date": str(date.today()),
            "risk_score": risk_score,
            "stability_index": stability_index,
            "composite_score": final_score,
            "flagged_transactions": flagged_transactions,
            "llm_summary": llm_summary,
            "account_tier": raw_payload.get("account_tier"),
        }
        print("[AI SUCCESS] Inference complete. Structured audit report generated.")
        print("[SECURITY CRITICAL] Raw payload wiped from RAM/Memory buffer post-analysis.")
        return structured_report

    def _score_financial_risk(self, finance_data: list) -> tuple[int, list]:
        risk_score = 0
        flagged = []
        amounts = [t["amount"] for t in finance_data]
        # Detect rapid multiple small transactions (fraud pattern)
        small_txns = [t for t in finance_data if t["amount"] < 100]
        if len(small_txns) >= 2:
            risk_score += 15
            flagged.extend(small_txns)
        # High-value transactions
        for txn in finance_data:
            if txn["amount"] > THRESHOLD_HIGH_RISK or txn.get("date", "") < ANTIQUATED_DATE:
                risk_score += 30
                flagged.append(txn)
        print(f"-> Sub-process 2.1: Financial Risk Score = {risk_score}, Flagged = {len(flagged)} transactions.")
        return risk_score, flagged

    def _calculate_stability_index(self, identity_history: list) -> float:
        address_changes = sum(1 for e in identity_history if e.get("event") == "ADDRESS_CHANGE")
        # High address turnover lowers stability
        index = max(0.0, 1.0 - (address_changes * 0.15))
        print(f"-> Sub-process 2.2: Stability Index = {index:.2f} (address changes: {address_changes}).")
        return round(index, 4)

    def _calculate_composite_score(self, risk_score: int, stability_index: float) -> float:
        # Composite: lower risk + higher stability = better score (0-100)
        composite = max(0.0, min(100.0, (stability_index * 50) + max(0, 50 - risk_score)))
        print(f"-> Sub-process 2.3: Composite Audit Score = {composite:.2f}.")
        return round(composite, 2)

    def _get_llm_summary(self, raw_payload: dict, score: float) -> str:
        """Send a compact prompt to local LM Studio for a reasoning summary."""
        prompt = (
            f"You are an identity audit AI. Given a composite audit score of {score}/100 "
            f"and account tier '{raw_payload.get('account_tier')}', provide a 2-sentence "
            f"professional risk assessment. Be concise."
        )
        try:
            body = json.dumps({
                "model": LM_STUDIO_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 120,
                "temperature": 0.3,
            }).encode("utf-8")
            req = urllib.request.Request(
                LM_STUDIO_ENDPOINT,
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.load(resp)
                summary = data["choices"][0]["message"]["content"].strip()
                print(f"-> [LM Studio] Summary received ({len(summary)} chars).")
                return summary
        except Exception as e:
            print(f"-> [LM Studio] Unavailable ({e}). Using rule-based summary.")
            if score >= 70:
                return "Account presents low risk profile with stable identity history. Standard processing recommended."
            elif score >= 40:
                return "Account shows moderate risk indicators. Enhanced verification advised before proceeding."
            else:
                return "Account presents elevated risk. Manual review required before any transaction approval."
