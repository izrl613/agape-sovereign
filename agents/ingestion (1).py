import shutil
import subprocess
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

    def _extract_pdf_text(self, pdf_path: Path) -> str:
        pdftotext = shutil.which("pdftotext")
        if pdftotext:
            result = subprocess.run(
                [pdftotext, str(pdf_path), "-"],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout

        markdown_path = pdf_path.with_suffix(".md")
        if markdown_path.exists():
            return markdown_path.read_text(encoding="utf-8", errors="ignore")

        raise RuntimeError(
            "PDF text extraction is unavailable; install pdftotext or supply a markdown/text companion file."
        )
