"""ExtractionEngine — dedicated text and OCR extraction layer.

Responsible for converting raw document bytes / file paths into clean,
structured plain text ready for the DataMapper and Validator stages.
Supports PDF (pdfplumber), plain text, and Markdown inputs.
"""

from __future__ import annotations

import io
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List


@dataclass
class ExtractedDocument:
    """Output of ExtractionEngine.extract()."""
    source_path: str
    pages: List[str] = field(default_factory=list)
    full_text: str = ""
    page_count: int = 0
    extraction_method: str = "unknown"  # "pdf", "text", "markdown"


class ExtractionEngine:
    """Converts file input → per-page text + full_text string.

    Usage::

        engine = ExtractionEngine()
        doc = engine.extract("/path/to/file.pdf")
        print(doc.full_text[:200])
    """

    def extract(self, source_path: str) -> ExtractedDocument:
        path = Path(source_path)
        if not path.exists():
            raise FileNotFoundError(f"ExtractionEngine: file not found: {source_path}")

        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return self._extract_pdf(str(path))
        elif suffix in {".md", ".txt", ".rst"}:
            return self._extract_text(str(path))
        else:
            # Generic fallback — read as UTF-8 text
            return self._extract_text(str(path), method="generic")

    # ──────────────────────────────────────────────────────────────────
    # PDF extraction via pdfplumber (zero-copy, no external server)
    # ──────────────────────────────────────────────────────────────────

    def _extract_pdf(self, path: str) -> ExtractedDocument:
        try:
            import pdfplumber  # type: ignore
        except ImportError:
            # Graceful degrade: read raw bytes as text
            return self._extract_text(path, method="pdf_raw_fallback")

        pages: List[str] = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages.append(text)

        full_text = "\n\n".join(pages)
        return ExtractedDocument(
            source_path=path,
            pages=pages,
            full_text=full_text,
            page_count=len(pages),
            extraction_method="pdf",
        )

    # ──────────────────────────────────────────────────────────────────
    # Plain-text / Markdown extraction
    # ──────────────────────────────────────────────────────────────────

    def _extract_text(self, path: str, method: str = "text") -> ExtractedDocument:
        try:
            raw = Path(path).read_text(encoding="utf-8", errors="replace")
        except Exception:
            raw = ""

        paragraphs = [p.strip() for p in raw.split("\n\n") if p.strip()]
        return ExtractedDocument(
            source_path=path,
            pages=paragraphs,
            full_text=raw,
            page_count=len(paragraphs),
            extraction_method=method or "text",
        )
