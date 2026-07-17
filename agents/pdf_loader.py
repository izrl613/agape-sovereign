import shutil
import subprocess
from pathlib import Path
from typing import Optional


def extract_pdf_text(pdf_path: Path, start_page: Optional[int] = None, end_page: Optional[int] = None) -> str:
    """Extract text from a PDF using the `pdftotext` binary.

    If `start_page`/`end_page` are provided they are passed to `pdftotext`
    using the `-f` and `-l` flags (1-based page numbers).
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    pdftotext = shutil.which("pdftotext")
    if not pdftotext:
        raise RuntimeError("pdftotext is required but not found in PATH. Install poppler utils.")

    cmd = [pdftotext, str(pdf_path), "-"]
    if start_page is not None:
        cmd[1:1] = ["-f", str(start_page)]
    if end_page is not None:
        # insert -l before the output arg
        insert_idx = 1 if start_page is None else 3
        cmd[insert_idx:insert_idx] = ["-l", str(end_page)]

    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"pdftotext failed: {result.stderr.strip()}")

    return result.stdout
