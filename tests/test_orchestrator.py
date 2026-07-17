import json
import tempfile
import unittest
from pathlib import Path

from agents.orchestrator import OrchestratorAgent


class OrchestratorAgentTests(unittest.TestCase):
    def test_runs_full_pipeline_and_writes_outputs(self):
        sample_plan = """
# Sovereign Data Pipeline Defined
## Overview
The plan uses agents, subagents, and microagents.

### Extract Mode
Extract names, dates, financial figures, and technical schematics.

### Synthesis Mode
Summarize risks, strategic goals, and financial liabilities.

### Audit Mode
Flag GDPR concerns and contractual deviations.

Example: Alice Smith, 2026-07-15, $5,000,000, and OAuth 2.0.
"""
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir)
            agent = OrchestratorAgent(output_dir=output_dir)
            result = agent.run(sample_plan)

            self.assertEqual(result["status"], "completed")
            self.assertIn("names", result["extraction"])
            self.assertIn("Alice Smith", result["extraction"]["names"])
            self.assertIn("executive_briefing", result)
            self.assertTrue((output_dir / "workflow_report.json").exists())
            self.assertTrue((output_dir / "executive_briefing.md").exists())

            payload = json.loads((output_dir / "workflow_report.json").read_text())
            self.assertEqual(payload["status"], "completed")

    def test_accepts_markdown_file_path(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            source_dir = Path(tmpdir)
            output_dir = source_dir / "out"
            source_file = source_dir / "plan.md"
            source_file.write_text(
                "# Sovereign Workflow\nThe plan covers PDF extraction and offline-first delivery.\n",
                encoding="utf-8",
            )

            agent = OrchestratorAgent(output_dir=output_dir)
            result = agent.run(source_file)

            self.assertEqual(result["status"], "completed")
            self.assertIn("Sovereign Workflow", result["plan_summary"])
            self.assertTrue((output_dir / "workflow_report.json").exists())

    def test_reports_subagent_execution(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir)
            agent = OrchestratorAgent(output_dir=output_dir)
            result = agent.run("# Sovereign Workflow\nThe plan covers PDF extraction and audit review.\n")

            self.assertEqual([step["name"] for step in result["agents"]], ["extraction", "synthesis", "audit", "reporting"])
            self.assertTrue(all(step["status"] == "completed" for step in result["agents"]))

    def test_writes_execution_summary(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir)
            agent = OrchestratorAgent(output_dir=output_dir)
            result = agent.run("# Sovereign Workflow\nThe plan covers PDF extraction and audit review.\n")

            self.assertIn("execution_summary", result)
            self.assertTrue((output_dir / "execution_summary.md").exists())

    def test_handles_pdf_input_when_companion_text_exists(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            source_dir = Path(tmpdir)
            output_dir = source_dir / "out"
            pdf_path = source_dir / "sample.pdf"
            pdf_path.write_bytes(b"%PDF-1.4\n")
            companion = source_dir / "sample.md"
            companion.write_text("# PDF Companion\nThis document describes PDF extraction and extraction audit.", encoding="utf-8")

            agent = OrchestratorAgent(output_dir=output_dir)
            result = agent.run(pdf_path)

            self.assertEqual(result["status"], "completed")
            self.assertIn("PDF Companion", result["plan_summary"])
            self.assertTrue((output_dir / "workflow_report.json").exists())


if __name__ == "__main__":
    unittest.main()
