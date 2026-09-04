"""IngestionAgent — sovereign data pipeline file ingestion with OCR fallback.

Extraction priority order:
  1. pdftotext (fastest, text-layer PDFs)
  2. PyMuPDF embedded text (pdfplumber / fitz)
  3. Tesseract OCR via pytesseract + Pillow (image-only / corrupted PDFs)
  4. Companion .md file (pre-extracted sidecar)
"""

import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Union


class IngestionAgent:
    def run(self, source: Union[str, Path]) -> Dict[str, object]:
        if isinstance(source, Path):
            source_path = source
        elif isinstance(source, str):
            if "\n" in source or source.strip().startswith(("#", "##", "###", "-", "*", "1.", "2.", "3.")):
                return {
                    "source": "inline-text",
                    "source_type": "text",
                    "text": source,
                    "path": None,
                }
            source_path = Path(source)
        else:
            raise TypeError("source must be a string or Path")

        if not source_path.exists():
            raise FileNotFoundError(f"Input file not found: {source_path}")

        if source_path.suffix.lower() == ".pdf":
            text = self._extract_pdf_text(source_path)
            source_type = "pdf"
        else:
            text = source_path.read_text(encoding="utf-8", errors="ignore")
            source_type = source_path.suffix.lower().lstrip(".") or "text"

        return {
            "source": str(source_path),
            "source_type": source_type,
            "text": text,
            "path": str(source_path),
        }

    # ------------------------------------------------------------------
    # PDF text extraction — multi-tier with OCR fallback
    # ------------------------------------------------------------------

    def _extract_pdf_text(self, pdf_path: Path) -> str:
        # Tier 1: pdftotext (poppler) — fastest for native text PDFs
        text = self._try_pdftotext(pdf_path)
        if text:
            return text

        # Tier 2: PyMuPDF embedded text extraction
        text = self._try_pymupdf(pdf_path)
        if text:
            return text

        # Tier 3: OCR via Tesseract (handles image-only / corrupted PDFs)
        text = self._try_tesseract_ocr(pdf_path)
        if text:
            return text

        # Tier 4: Companion markdown sidecar
        markdown_path = pdf_path.with_suffix(".md")
        if markdown_path.exists():
            return markdown_path.read_text(encoding="utf-8", errors="ignore")

        raise RuntimeError(
            "PDF text extraction failed across all tiers. "
            "Install poppler (pdftotext), PyMuPDF, or Tesseract, "
            "or supply a companion .md sidecar file."
        )

    def _try_pdftotext(self, pdf_path: Path) -> str:
        pdftotext = shutil.which("pdftotext")
        if not pdftotext:
            return ""
        try:
            result = subprocess.run(
                [pdftotext, str(pdf_path), "-"],
                capture_output=True,
                text=True,
                check=False,
                timeout=60,
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout
        except (subprocess.TimeoutExpired, OSError):
            pass
        return ""

    def _try_pymupdf(self, pdf_path: Path) -> str:
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(str(pdf_path))
            pages = []
            for page in doc:
                try:
                    t = page.get_text("text")
                    if t.strip():
                        pages.append(t)
                except Exception:
                    pass
            doc.close()
            return "\n\n".join(pages)
        except ImportError:
            return ""
        except Exception:
            return ""

    def _try_tesseract_ocr(self, pdf_path: Path) -> str:
        """Render each PDF page to an image then run Tesseract OCR."""
        try:
            import fitz  # PyMuPDF for rendering
        except ImportError:
            return ""

        try:
            import pytesseract
            from PIL import Image
            import io
        except ImportError:
            return ""

        pages_text = []
        try:
            doc = fitz.open(str(pdf_path))
            total = len(doc)
            for i, page in enumerate(doc):
                try:
                    # Render at 200 DPI for reasonable OCR quality
                    mat = fitz.Matrix(200 / 72, 200 / 72)
                    pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_text = pytesseract.image_to_string(img, lang="eng")
                    if ocr_text.strip():
                        pages_text.append(f"--- Page {i + 1}/{total} ---\n{ocr_text}")
                except Exception:
                    pages_text.append(f"--- Page {i + 1}/{total} --- [unreadable]")
            doc.close()
        except Exception:
            return ""

        return "\n\n".join(pages_text)
