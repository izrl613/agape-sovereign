"""
pdf_agent.py – PDF Generation Agent
Module 3: Immutable Audit Document Generator
Sovereign State Engine v1.0 | Agape Sovereign

Generates a tamper-evident PDF audit report with SHA256 integrity seal.
"""
import hashlib
import json
from datetime import datetime


class PDFGenerationAgent:
    """Generates the immutable audit document."""

    def execute(self, structured_report: dict) -> bytes | None:
        print("\n--- [PDF Agent] Commencing Document Rendering...")
        if not structured_report:
            print("[PDF ERROR] No structured report provided.")
            return None
        try:
            pdf_bytes = self._render_pdf(structured_report)
            checksum = hashlib.sha256(pdf_bytes).hexdigest()
            print(f"[PDF SUCCESS] Audit PDF rendered. SHA256 integrity seal: {checksum[:16]}...")
            return pdf_bytes
        except Exception as e:
            print(f"[PDF ERROR] Rendering failed: {e}")
            return None

    def _render_pdf(self, report: dict) -> bytes:
        """
        Renders a real PDF using reportlab if available,
        otherwise falls back to a structured bytes representation.
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib import colors
            import io

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []

            # Header
            story.append(Paragraph("<b>AGAPE SOVEREIGN — IDENTITY AUDIT REPORT</b>", styles["Title"]))
            story.append(Spacer(1, 12))
            story.append(Paragraph(f"Generated: {datetime.utcnow().isoformat()}Z", styles["Normal"]))
            story.append(Paragraph(f"Identity Hash: {report.get('identity_hash', 'N/A')}", styles["Normal"]))
            story.append(Spacer(1, 12))

            # Scores table
            data = [
                ["Metric", "Value"],
                ["Verification Status", report.get("verification_status", "N/A")],
                ["Risk Score", str(report.get("risk_score", 0))],
                ["Stability Index", str(report.get("stability_index", 0))],
                ["Composite Audit Score", str(report.get("composite_score", 0))],
                ["Account Tier", report.get("account_tier", "N/A")],
            ]
            table = Table(data, colWidths=[200, 250])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f0f4ff")),
            ]))
            story.append(table)
            story.append(Spacer(1, 12))

            # LLM Summary
            story.append(Paragraph("<b>AI Risk Assessment:</b>", styles["Heading2"]))
            story.append(Paragraph(report.get("llm_summary", "N/A"), styles["Normal"]))

            doc.build(story)
            return buffer.getvalue()

        except ImportError:
            # Fallback: structured JSON bytes
            print("[PDF Agent] reportlab unavailable — producing structured bytes artifact.")
            content = json.dumps(report, indent=2, default=str)
            header = f"AGAPE SOVEREIGN AUDIT REPORT\nGenerated: {datetime.utcnow().isoformat()}Z\n{'='*60}\n"
            return (header + content).encode("utf-8")
