"""DataMapper — positional-cue and pattern-driven entity mapping layer.

Sits between ExtractionEngine (raw text) and Validator (clean records).
Applies sovereign-domain business patterns to locate and label structured
fields within unstructured document text.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class MappedRecord:
    """A single labelled data record produced by DataMapper."""
    label: str           # e.g. "identity_token", "capacity_limit", "user_email"
    value: str           # raw matched value
    confidence: float    # 0.0 – 1.0; 1.0 = exact regex match
    page_hint: int = -1  # page index in source doc (-1 = unknown)
    source_span: str = ""  # excerpt for audit trail


# ── Sovereign-domain field patterns ────────────────────────────────────────
_PATTERNS: Dict[str, re.Pattern] = {
    "identity_token":   re.compile(r'\b([A-F0-9]{64})\b', re.IGNORECASE),
    "sha256_hash":      re.compile(r'\b(?:SHA-?256|sha256)[:\s]+([A-Fa-f0-9]{64})\b'),
    "user_email":       re.compile(r'\b([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b'),
    "capacity_limit":   re.compile(r'\b(\d+)\s*(?:user|seat|slot)s?\s*(?:cap|limit|max)\b', re.IGNORECASE),
    "zero_trust_rule":  re.compile(r'zero[- ]trust[:\s]+(.{10,80})', re.IGNORECASE),
    "mnemonic_phrase":  re.compile(r'(?:mnemonic|bip-?39)[:\s]+(.{20,120})', re.IGNORECASE),
    "firebase_project": re.compile(r'project[_\s]?(?:id)?[:\s]+([a-z][a-z0-9-]{4,28}[a-z0-9])', re.IGNORECASE),
    "domain":           re.compile(r'\b((?:[a-z0-9-]+\.)+(?:nyc|ai|io|com|org|app))\b', re.IGNORECASE),
    "version_tag":      re.compile(r'\bv(\d+\.\d+(?:\.\d+)?)\b'),
    "date_iso":         re.compile(r'\b(\d{4}-\d{2}-\d{2})\b'),
    "dollar_amount":    re.compile(r'\$\s*([\d,]+(?:\.\d{1,2})?)\b'),
}


class DataMapper:
    """Maps structured fields from plain text into labelled MappedRecord list.

    Usage::

        mapper = DataMapper()
        records = mapper.map(full_text, page_hints=doc.pages)
    """

    def map(
        self,
        text: str,
        page_hints: Optional[List[str]] = None,
    ) -> List[MappedRecord]:
        records: List[MappedRecord] = []

        for label, pattern in _PATTERNS.items():
            for match in pattern.finditer(text):
                value = match.group(1) if match.lastindex else match.group(0)
                # Determine page hint from pages list
                page_idx = -1
                if page_hints:
                    char_pos = match.start()
                    running = 0
                    for i, page in enumerate(page_hints):
                        running += len(page) + 2  # +2 for "\n\n" separator
                        if char_pos < running:
                            page_idx = i
                            break

                # Snippet for audit trail
                start = max(0, match.start() - 20)
                end = min(len(text), match.end() + 20)
                span = text[start:end].replace("\n", " ")

                records.append(MappedRecord(
                    label=label,
                    value=value.strip(),
                    confidence=1.0,
                    page_hint=page_idx,
                    source_span=span,
                ))

        return records

    def to_dict(self, records: List[MappedRecord]) -> Dict[str, List[str]]:
        """Group records by label into a plain dict for downstream use."""
        result: Dict[str, List[str]] = {}
        for r in records:
            result.setdefault(r.label, [])
            if r.value not in result[r.label]:
                result[r.label].append(r.value)
        return result
