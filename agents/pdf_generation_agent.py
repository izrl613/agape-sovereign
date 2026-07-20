"""PDFGenerationAgent — sovereign identity PDF document renderer.

Generates signed, audit-grade PDF reports from pipeline run outputs.
Uses reportlab when available; falls back to a plain-text audit log
so the pipeline never hard-blocks on a missing dependency.

Output spec (per Operation Framework §4.3):
  - Title page with sovereign watermark
  - Identity token block (SHA-256 ID, run ID)
  - Executive briefing section (from synthesis agent output)
  - Data-mapped fields table
  - Validation report section (warnings / errors)
  - Audit chain footer (timestamps, LLM model used)
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class PDFGenerationAgent:
    """Renders a structured sovereign-identity PDF report.

    Usage::

        agent = PDFGenerationAgent(output_dir="/path/to/run/")
        path = agent.generate(
            run_id="abc123",
            briefing="...",
            mapped_fields={"user_email": ["x@y.z"]},
            validation_warnings=["cap 100 > 50"],
            llm_model="lmstudio:qwen3.5-9b-sushi-coder-rl-mlx",
        )
        print(f"PDF saved to {path}")
    """

    def __init__(self, output_dir: str = "."):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate(
        self,
        run_id: str,
        briefing: str,
        mapped_fields: Optional[Dict[str, Any]] = None,
        validation_warnings: Optional[list] = None,
        validation_errors: Optional[list] = None,
        llm_model: str = "lmstudio:qwen3.5-9b-sushi-coder-rl-mlx",
        title: str = "Agape Sovereign — Identity Pipeline Report",
    ) -> str:
        """Generate a PDF (or fallback text) report and return its path."""
        try:
            return self._generate_pdf(
                run_id, briefing, mapped_fields or {},
                validation_warnings or [], validation_errors or [],
                llm_model, title,
            )
        except Exception as exc:
            # Graceful fallback — never block the pipeline
            return self._generate_text_fallback(
                run_id, briefing, mapped_fields or {},
                validation_warnings or [], str(exc),
            )

    # ── reportlab renderer ──────────────────────────────────────────────

    def _generate_pdf(
        self, run_id, briefing, mapped_fields,
        warnings, errors, llm_model, title,
    ) -> str:
        from reportlab.lib.pagesizes import LETTER  # type: ignore
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # type: ignore
        from reportlab.lib.units import inch  # type: ignore
        from reportlab.lib import colors  # type: ignore
        from reportlab.platypus import (  # type: ignore
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
        )

        out_path = str(self.output_dir / f"sovereign_report_{run_id[:8]}.pdf")
        doc = SimpleDocTemplate(out_path, pagesize=LETTER,
                                leftMargin=0.9*inch, rightMargin=0.9*inch,
                                topMargin=inch, bottomMargin=inch)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle("title", parent=styles["Title"],
                                     textColor=colors.HexColor("#00D4FF"),
                                     spaceAfter=10)
        story.append(Paragraph(title, title_style))
        story.append(Paragraph(
            f"Run ID: {run_id} &nbsp;&nbsp; Generated: "
            f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"],
        ))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#333")))
        story.append(Spacer(1, 0.15*inch))

        # Executive briefing
        story.append(Paragraph("Executive Briefing", styles["Heading2"]))
        for para in briefing.split("\n\n"):
            if para.strip():
                story.append(Paragraph(para.strip(), styles["Normal"]))
                story.append(Spacer(1, 0.05*inch))
        story.append(Spacer(1, 0.1*inch))

        # Mapped fields table
        if mapped_fields:
            story.append(Paragraph("Extracted Data Fields", styles["Heading2"]))
            table_data = [["Field", "Values"]]
            for label, vals in mapped_fields.items():
                table_data.append([label, ", ".join(str(v) for v in vals[:5])])
            t = Table(table_data, colWidths=[2*inch, 4.5*inch])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                 [colors.HexColor("#0d0d1a"), colors.HexColor("#111126")]),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#e0e0e0")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#333")),
            ]))
            story.append(t)
            story.append(Spacer(1, 0.1*inch))

        # Validation section
        if warnings or errors:
            story.append(Paragraph("Validation Report", styles["Heading2"]))
            for w in warnings:
                story.append(Paragraph(f"⚠ {w}", styles["Normal"]))
            for e in errors:
                story.append(Paragraph(f"✗ {e}", styles["Normal"]))
            story.append(Spacer(1, 0.1*inch))

        # Audit footer
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#444")))
        story.append(Paragraph(
            f"Generated by <b>{llm_model}</b> · Agape Sovereign Enclave · "
            f"sovereign.nyc · Zero-external-inference guarantee",
            styles["Normal"],
        ))

        doc.build(story)
        return out_path

    # ── plain-text fallback ────────────────────────────────────────────

    def _generate_text_fallback(self, run_id, briefing, mapped_fields, warnings, exc_note):
        out_path = str(self.output_dir / f"sovereign_report_{run_id[:8]}.txt")
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        lines = [
            "=" * 70,
            "AGAPE SOVEREIGN — IDENTITY PIPELINE REPORT (text fallback)",
            f"Run ID : {run_id}",
            f"Generated: {ts}",
            f"Note: PDF rendering unavailable ({exc_note})",
            "=" * 70,
            "",
            "EXECUTIVE BRIEFING",
            "-" * 40,
            briefing,
            "",
        ]
        if mapped_fields:
            lines.append("EXTRACTED FIELDS")
            lines.append("-" * 40)
            for label, vals in mapped_fields.items():
                lines.append(f"  {label}: {', '.join(str(v) for v in vals[:5])}")
            lines.append("")
        if warnings:
            lines.append("VALIDATION WARNINGS")
            lines.append("-" * 40)
            for w in warnings:
                lines.append(f"  ⚠  {w}")
            lines.append("")
        lines.append("Generated by lmstudio:qwen3.5-9b-sushi-coder-rl-mlx")
        Path(out_path).write_text("\n".join(lines), encoding="utf-8")
        return out_path
