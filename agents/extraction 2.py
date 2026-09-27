"""ExtractionAgent — structured data extraction from sovereign plan text.

Three-tier approach:
  1. Regex fast-path for well-known patterns (names, dates, money, tech terms).
  2. Local LLM via LM Studio (qwen3.5-9b-sushi-coder-rl-mlx preferred) for
     semantic entity classification when regex yields insufficient data.
  3. Ollama fallback (qwen2.5-coder:7b) when LM Studio API is not running.
"""

import re
from typing import Any, Dict

from agents.lmstudio import chat_complete_json
from agents.models import ExtractionResult

# Sovereign-domain technical schematics — extended keyword list
_TECH_KEYWORDS = (
    r"OAuth|API|PDF|PWA|MCP|JSON|IndexedDB|Service Worker|WebAuthn|Passkey|"
    r"SHA-256|AES-256|PBKDF2|Firebase|Firestore|GCP|BigQuery|Vertex\s?AI|"
    r"Ollama|Gemma|Qwen|LM Studio|ECRA|DIFF audit|Zero[- ]Knowledge|sovereign|"
    r"Cloudflare|Zero Trust|IVM|IdentityToken|SHA256_ID|CoreStorage"
)


class ExtractionAgent:
    def run(self, text: str) -> ExtractionResult:
        result = self._regex_extraction(text)

        # If the text is substantial but regex yielded thin results, try LLM
        if len(text) > 500 and (
            not result.names
            and not result.financial_figures
            and len(result.technical_schematics) < 3
        ):
            result = self._llm_extraction(text, result)

        return result

    # ------------------------------------------------------------------
    # Tier 1: Regex extraction
    # ------------------------------------------------------------------

    def _regex_extraction(self, text: str) -> ExtractionResult:
        names = re.findall(r"\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b", text)
        dates = re.findall(
            r"\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{4}|\w+ \d{1,2},\s*\d{4})\b",
            text,
        )
        financial_figures = re.findall(r"\$[\d,]+(?:\.\d+)?", text)
        technical_schematics = re.findall(
            _TECH_KEYWORDS,
            text,
            flags=re.IGNORECASE,
        )
        return ExtractionResult(
            names=sorted(set(names)),
            dates=sorted(set(dates)),
            financial_figures=sorted(set(financial_figures)),
            technical_schematics=sorted(set(technical_schematics)),
        )

    # ------------------------------------------------------------------
    # Tier 2+3: LM Studio → Ollama extraction
    # ------------------------------------------------------------------

    def _llm_extraction(self, text: str, baseline: ExtractionResult) -> ExtractionResult:
        """Ask the local LLM (LM Studio or Ollama) to extract structured entities."""
        snippet = text[:6000]  # keep prompt bounded
        prompt = (
            "You are a sovereign identity data extraction agent. "
            "Analyze the following document text and respond with ONLY a JSON object "
            "containing these keys:\n"
            '  "names": [list of person/organization names],\n'
            '  "dates": [list of dates in YYYY-MM-DD format],\n'
            '  "financial_figures": [list of dollar amounts like $1,234.56],\n'
            '  "technical_schematics": [list of technical terms, standards, APIs, protocols]\n\n'
            "Document text:\n"
            f"{snippet}\n\n"
            "Respond with valid JSON only. No explanation."
        )

        data, _backend = chat_complete_json(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            temperature=0.0,
        )

        if not data:
            return baseline

        return ExtractionResult(
            names=sorted(set(data.get("names", []) + baseline.names)),
            dates=sorted(set(data.get("dates", []) + baseline.dates)),
            financial_figures=sorted(set(
                data.get("financial_figures", []) + baseline.financial_figures
            )),
            technical_schematics=sorted(set(
                data.get("technical_schematics", []) + baseline.technical_schematics
            )),
        )
