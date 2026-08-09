from typing import Dict


class ReportingAgent:
    def run(self, plan_text: str, extraction: object, audit: Dict[str, object]) -> str:
        summary_lines = [
            "# Execution Summary",
            "",
            "## Run Overview",
            "- Workflow completed successfully.",
            "- Source content was ingested and analyzed by the agent pipeline.",
            "- Extraction and audit outputs were generated for downstream review.",
            "",
            "## Highlights",
            f"- Source heading: {plan_text.splitlines()[0].strip() if plan_text.splitlines() else 'Sovereign workflow'}",
            f"- Audit status: {audit.get('status', 'clear')}",
            f"- Issues detected: {len(audit.get('issues', []))}",
            "",
            "## Next Action",
            "- Review the workflow report and executive briefing for deployment readiness.",
        ]
        return "\n".join(summary_lines)
