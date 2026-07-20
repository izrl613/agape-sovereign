import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Union

from agents.audit import AuditAgent
from agents.extraction import ExtractionAgent
from agents.ingestion import IngestionAgent
from agents.models import ExtractionResult
from agents.reporting import ReportingAgent
from agents.sovereign_export import SovereignExportAgent
from agents.synthesis import SynthesisAgent


@dataclass
class AgentStep:
    name: str
    status: str
    details: str


class OrchestratorAgent:
    def __init__(self, output_dir: "Path | None" = None, user_id: str = "anonymous"):
        self.output_dir = Path(output_dir or Path.cwd() / "workspace_outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.user_id = user_id
        self.ingestion_agent = IngestionAgent()
        self.extraction_agent = ExtractionAgent()
        self.synthesis_agent = SynthesisAgent()
        self.audit_agent = AuditAgent()
        self.reporting_agent = ReportingAgent()
        self.export_agent = SovereignExportAgent()

    def run(self, plan_source: Union[str, Path], enable_export: bool = False) -> Dict[str, object]:
        ingestion = self._run_agent_step([], "ingestion", lambda: self.ingestion_agent.run(plan_source))
        plan_text = ingestion["text"]
        steps = []

        extraction = self._run_agent_step(steps, "extraction", lambda: self.extraction_agent.run(plan_text))
        briefing = self._run_agent_step(steps, "synthesis", lambda: self.synthesis_agent.run(plan_text, extraction))
        audit = self._run_agent_step(steps, "audit", lambda: self.audit_agent.run(plan_text))
        execution_summary = self._run_agent_step(steps, "reporting", lambda: self.reporting_agent.run(plan_text, extraction, audit))

        extraction_dict = {
            "names": extraction.names,
            "dates": extraction.dates,
            "financial_figures": extraction.financial_figures,
            "technical_schematics": extraction.technical_schematics,
        }

        report: Dict[str, object] = {
            "status": "completed",
            "plan_summary": plan_text.splitlines()[0].strip() if plan_text.splitlines() else "Sovereign workflow",
            "source": str(plan_source),
            "ingestion": ingestion,
            "agents": [step.__dict__ for step in steps],
            "extraction": extraction_dict,
            "executive_briefing": briefing,
            "audit": audit,
            "execution_summary": execution_summary,
        }

        # Optional sovereign export step (Crown Jewel)
        if enable_export:
            export_result = self._run_agent_step(
                steps,
                "sovereign_export",
                lambda: self.export_agent.run(
                    user_id=self.user_id,
                    extraction_data=extraction_dict,
                    output_dir=self.output_dir / "reports",
                ),
            )
            report["sovereign_export"] = export_result
            # Security: mnemonic is surfaced in the result but never written
            #           to the persistent workflow_report.json
            mnemonic = export_result.pop("mnemonic_phrase", None)
            report["_mnemonic_phrase"] = mnemonic  # caller must handle this securely

        (self.output_dir / "workflow_report.json").write_text(
            json.dumps({k: v for k, v in report.items() if k != "_mnemonic_phrase"}, indent=2)
        )
        (self.output_dir / "executive_briefing.md").write_text(briefing)
        (self.output_dir / "execution_summary.md").write_text(execution_summary)
        return report

    def _run_agent_step(self, steps: List[AgentStep], name: str, action) -> object:
        try:
            result = action()
            steps.append(AgentStep(name=name, status="completed", details=f"{name} agent completed"))
            return result
        except Exception as exc:
            steps.append(AgentStep(name=name, status="failed", details=str(exc)))
            raise
