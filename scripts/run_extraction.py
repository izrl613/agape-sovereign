#!/usr/bin/env python3
"""Run PDF extraction for two ranges: first N pages, then M pages."""
import json
import sys
from pathlib import Path

from agents.extraction import ExtractionAgent
from agents.pdf_loader import extract_pdf_text


def run(pdf_path: Path, first_pages: int, second_pages: int, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    extractor = ExtractionAgent()

    # Process first range: pages 1..first_pages
    print(f"Processing pages 1..{first_pages}")
    text1 = extract_pdf_text(pdf_path, start_page=1, end_page=first_pages)
    res1 = extractor.run(text1)
    out1 = out_dir / "extraction_first.json"
    out1.write_text(json.dumps(res1.__dict__, indent=2))
    print(f"Wrote {out1}")

    # Process next range: pages (first_pages+1)..(first_pages+second_pages)
    start2 = first_pages + 1
    end2 = first_pages + second_pages
    print(f"Processing pages {start2}..{end2}")
    text2 = extract_pdf_text(pdf_path, start_page=start2, end_page=end2)
    res2 = extractor.run(text2)
    out2 = out_dir / "extraction_second.json"
    out2.write_text(json.dumps(res2.__dict__, indent=2))
    print(f"Wrote {out2}")

    return str(out1), str(out2)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: run_extraction.py <pdf-path> [first_pages=100] [second_pages=25] [out_dir=workspace_outputs]")
        sys.exit(2)

    pdf_path = Path(sys.argv[1])
    first_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    second_pages = int(sys.argv[3]) if len(sys.argv) > 3 else 25
    out_dir = Path(sys.argv[4]) if len(sys.argv) > 4 else Path.cwd() / "workspace_outputs"

    a, b = run(pdf_path, first_pages, second_pages, out_dir)
    print("Completed:", a, b)
