from agents.models import ExtractionResult


class SynthesisAgent:
    def run(self, plan_text: str, extraction: ExtractionResult) -> str:
        lines = [
            "# Executive Briefing",
            "",
            "## Overview",
            "The workflow orchestrates extraction, synthesis, and audit activities for the attached sovereign document plan.",
            "",
            "## Key Findings",
            f"- Names identified: {', '.join(extraction.names) if extraction.names else 'None'}",
            f"- Dates identified: {', '.join(extraction.dates) if extraction.dates else 'None'}",
            f"- Financial figures identified: {', '.join(extraction.financial_figures) if extraction.financial_figures else 'None'}",
            f"- Technical schematics identified: {', '.join(extraction.technical_schematics) if extraction.technical_schematics else 'None'}",
            "",
            "## Risks, Goals, and Liabilities",
            "- Risk: the plan depends on structured input quality and reliable extraction coverage.",
            "- Goal: produce a complete, auditable workflow report from the source material.",
            "- Liability: missing or ambiguous source content can reduce confidence in downstream outputs.",
        ]
        return "\n".join(lines)
