import re

from agents.models import ExtractionResult


class ExtractionAgent:
    def run(self, text: str) -> ExtractionResult:
        names = re.findall(r"\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b", text)
        dates = re.findall(r"\b\d{4}-\d{2}-\d{2}\b", text)
        financial_figures = re.findall(r"\$[\d,]+(?:\.\d+)?", text)
        technical_schematics = re.findall(
            r"\b(?:OAuth|API|PDF|PWA|MCP|JSON|IndexedDB|Service Worker)\b",
            text,
            flags=re.IGNORECASE,
        )
        return ExtractionResult(
            names=sorted(set(names)),
            dates=sorted(set(dates)),
            financial_figures=sorted(set(financial_figures)),
            technical_schematics=sorted(set(technical_schematics)),
        )
