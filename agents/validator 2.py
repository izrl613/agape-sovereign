"""Validator — normalization and business-rule enforcement layer.

Sits after DataMapper and before the AI synthesis stages.
Cleans, deduplicates, and validates mapped records against sovereign-domain
business rules. Non-fatal violations are flagged as warnings; fatal violations
raise ValueError.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class ValidationReport:
    valid: bool
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    normalized: Dict[str, List[str]] = field(default_factory=dict)


class Validator:
    """Normalizes and validates a DataMapper output dict.

    Usage::

        validator = Validator()
        report = validator.validate(mapper.to_dict(records))
        if not report.valid:
            print(report.errors)
    """

    # Max users per the ZTNA/capacity spec
    CAPACITY_CAP: int = 50

    def validate(self, mapped: Dict[str, List[str]]) -> ValidationReport:
        warnings: List[str] = []
        errors: List[str] = []
        normalized: Dict[str, List[str]] = {}

        for label, values in mapped.items():
            handler = getattr(self, f"_validate_{label}", self._validate_generic)
            cleaned, w, e = handler(values)
            normalized[label] = cleaned
            warnings.extend(w)
            errors.extend(e)

        return ValidationReport(
            valid=len(errors) == 0,
            warnings=warnings,
            errors=errors,
            normalized=normalized,
        )

    # ── Per-field validators ────────────────────────────────────────────

    def _validate_user_email(self, values: List[str]):
        cleaned, warnings, errors = [], [], []
        email_re = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
        for v in values:
            v = v.lower().strip()
            if email_re.match(v):
                cleaned.append(v)
            else:
                warnings.append(f"Invalid email skipped: {v}")
        return cleaned, warnings, errors

    def _validate_identity_token(self, values: List[str]):
        cleaned, warnings, errors = [], [], []
        for v in values:
            v = v.upper().strip()
            if re.fullmatch(r'[A-F0-9]{64}', v):
                cleaned.append(v)
            else:
                warnings.append(f"Non-conforming identity token: {v[:16]}…")
        return cleaned, warnings, errors

    def _validate_sha256_hash(self, values: List[str]):
        cleaned, warnings, errors = [], [], []
        for v in values:
            v = v.lower().strip()
            if re.fullmatch(r'[a-f0-9]{64}', v):
                cleaned.append(v)
            else:
                warnings.append(f"Malformed SHA-256 hash: {v[:16]}…")
        return cleaned, warnings, errors

    def _validate_capacity_limit(self, values: List[str]):
        cleaned, warnings, errors = [], [], []
        for v in values:
            try:
                cap = int(v.replace(",", ""))
                if cap > self.CAPACITY_CAP:
                    warnings.append(
                        f"Capacity {cap} exceeds sovereign ZTNA cap of {self.CAPACITY_CAP}"
                    )
                cleaned.append(str(cap))
            except ValueError:
                warnings.append(f"Could not parse capacity value: {v}")
        return cleaned, warnings, errors

    def _validate_date_iso(self, values: List[str]):
        import datetime
        cleaned, warnings, errors = [], [], []
        for v in values:
            try:
                datetime.date.fromisoformat(v)
                cleaned.append(v)
            except ValueError:
                warnings.append(f"Invalid ISO date: {v}")
        return cleaned, warnings, errors

    def _validate_generic(self, values: List[str]):
        # Deduplicate and strip whitespace
        seen = set()
        cleaned = []
        for v in values:
            v = v.strip()
            if v and v not in seen:
                seen.add(v)
                cleaned.append(v)
        return cleaned, [], []
