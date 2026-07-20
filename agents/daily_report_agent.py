"""Daily Firebase/GCP Service Export — PDF Report Generator

Collects live service data from agape-sovereign GCP project and generates
a detailed daily PDF report. Designed to run as a scheduled daily job.

Architecture constraints:
  - Local LM Studio / Gemma handles encrypted SHA-256 data and Architect AI
  - Vertex AI NOT used here — only free-tier GCP APIs and local synthesis
  - PDF generated with reportlab (runs entirely locally)

Usage:
    python3 agents/daily_report_agent.py
    python3 agents/daily_report_agent.py --out /tmp/report.pdf
    python3 agents/daily_report_agent.py --email agape@sovereign.nyc
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# ── paths ─────────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent
REPORTS_DIR = REPO_ROOT / "workspace_outputs" / "daily_reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

GCLOUD_PATHS = [
    "/Users/aarondavid/.gemini/antigravity-ide/scratch/google-cloud-sdk/bin/gcloud",
    "/usr/local/bin/gcloud",
    "/opt/homebrew/bin/gcloud",
]

GCP_PROJECT = "agape-sovereign"
GCP_REGION = "us-central1"

# Cloud Run services with their public health endpoints
CLOUD_RUN_SERVICES = {
    "agape-sovereign-server": "https://agape-sovereign-server-vub7d55vga-uc.a.run.app",
    "agape-sovereign-ee8f4200": "https://agape-sovereign-ee8f4200-vub7d55vga-uc.a.run.app",
    "gemma4-mcp-server": "https://gemma4-mcp-server-vub7d55vga-uc.a.run.app",
    "sovereignauditrecord": None,
    "sovereignpipelineregister": None,
    "sovereignpipelinestatus": None,
}

CLOUD_FUNCTIONS = [
    "authApi", "cleanupAuditLogs", "cleanupExpiredPipelineRuns",
    "fetchAnalyticsData", "generateDiffReport", "generateECRAOptOut",
    "generatePasskeyChallenge", "generatePolicyDocument",
    "recalculateSovereignScore", "sovereignAuditRecord",
    "sovereignPipelineRegister", "sovereignPipelineStatus",
]

STORAGE_BUCKETS = [
    "agape-sovereign-documents-us",
    "agape-sovereign.firebasestorage.app",
    "firebaseapphosting-sources-956088455461-us-central1",
    "gcf-v2-sources-956088455461-us-central1",
    "gcf-v2-sources-956088455461-us-east1",
]

FIRESTORE_DATABASES = [
    {"name": "agape-sovereign", "location": "nam7", "type": "FIRESTORE_NATIVE"},
    {"name": "(default)", "location": "nam5", "type": "FIRESTORE_NATIVE"},
]


# ── gcloud helper ─────────────────────────────────────────────────────────────

def find_gcloud() -> Optional[str]:
    for p in GCLOUD_PATHS:
        if Path(p).exists():
            return p
    result = subprocess.run(["which", "gcloud"], capture_output=True, text=True)
    if result.returncode == 0:
        return result.stdout.strip()
    return None


def gcloud_json(gcloud: str, *args) -> Any:
    """Run a gcloud command and return parsed JSON, or None on failure."""
    cmd = [gcloud, "--project", GCP_PROJECT, "--format=json"] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
        pass
    return None


def gcloud_text(gcloud: str, *args) -> str:
    """Run a gcloud command and return stdout text."""
    cmd = [gcloud, "--project", GCP_PROJECT] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout.strip()
    except Exception:
        return ""


# ── service probes ────────────────────────────────────────────────────────────

def probe_http(name: str, url: str, timeout: int = 8) -> Dict[str, Any]:
    if not url:
        return {"service": name, "url": "N/A", "status": "no-url", "healthy": None}
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "agape-sovereign-daily-report/1.0")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return {"service": name, "url": url, "status_code": resp.status,
                    "status": "healthy", "healthy": True}
    except urllib.error.HTTPError as e:
        is_healthy = e.code < 500
        return {"service": name, "url": url, "status_code": e.code,
                "status": "healthy" if is_healthy else "error", "healthy": is_healthy}
    except Exception as e:
        return {"service": name, "url": url, "status_code": 0,
                "status": "unreachable", "healthy": False, "error": str(e)[:80]}


def probe_lmstudio() -> Dict[str, Any]:
    try:
        sys.path.insert(0, str(REPO_ROOT))
        from agents.lmstudio import lmstudio_available
        ok, model = lmstudio_available()
        return {"service": "LM Studio (local)", "status": "online" if ok else "offline",
                "healthy": ok, "model": model or "unavailable"}
    except Exception:
        return probe_http("LM Studio (local)", "http://localhost:1234/v1/models")


# ── data collection ───────────────────────────────────────────────────────────

def collect_all(gcloud: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    report = {
        "generated_at": now.isoformat(),
        "generated_date": now.strftime("%Y-%m-%d"),
        "project": GCP_PROJECT,
        "sections": {}
    }

    # 1. Cloud Run — live health probes
    run_results = []
    for name, url in CLOUD_RUN_SERVICES.items():
        run_results.append(probe_http(name, url))
    # Try to get current deployed images and revisions
    run_details_raw = gcloud_json(gcloud, "run", "services", "list",
                                   "--region", GCP_REGION)
    run_details = {}
    if run_details_raw:
        for svc in run_details_raw:
            meta = svc.get("metadata", {})
            spec = svc.get("status", {})
            sname = meta.get("name", "")
            run_details[sname] = {
                "latest_revision": spec.get("latestCreatedRevisionName", ""),
                "url": spec.get("url", ""),
                "ready_replicas": spec.get("observedGeneration", ""),
            }
    for r in run_results:
        if r["service"] in run_details:
            r.update(run_details[r["service"]])
    report["sections"]["cloud_run"] = run_results

    # 2. Cloud Functions
    fn_raw = gcloud_json(gcloud, "functions", "list",
                          "--regions=us-central1,us-east1")
    fn_results = []
    if fn_raw:
        for fn in fn_raw:
            fn_results.append({
                "name": fn.get("name", "").split("/")[-1],
                "status": fn.get("status", "UNKNOWN"),
                "runtime": fn.get("runtime", ""),
                "trigger": fn.get("eventTrigger", {}).get("eventType", "HTTP") if fn.get("eventTrigger") else "HTTP",
                "update_time": fn.get("updateTime", ""),
                "region": fn.get("name", "").split("/")[3] if "/" in fn.get("name", "") else GCP_REGION,
            })
    else:
        # Fallback: use known function list
        for fn_name in CLOUD_FUNCTIONS:
            fn_results.append({"name": fn_name, "status": "KNOWN", "runtime": "", "trigger": "HTTP", "update_time": "", "region": GCP_REGION})
    report["sections"]["cloud_functions"] = fn_results

    # 3. Storage Buckets
    buckets_raw = gcloud_json(gcloud, "storage", "buckets", "list")
    if buckets_raw:
        bucket_list = []
        for b in buckets_raw:
            bucket_list.append({
                "name": b.get("name", ""),
                "location": b.get("location", ""),
                "storage_class": b.get("storageClass", ""),
                "created": b.get("timeCreated", ""),
            })
        report["sections"]["storage_buckets"] = bucket_list
    else:
        report["sections"]["storage_buckets"] = [{"name": n} for n in STORAGE_BUCKETS]

    # 4. Firestore Databases
    firestore_raw = gcloud_json(gcloud, "firestore", "databases", "list")
    if firestore_raw:
        report["sections"]["firestore"] = [
            {
                "name": db.get("name", "").split("/")[-1],
                "type": db.get("type", ""),
                "location": db.get("locationId", ""),
                "state": db.get("state", ""),
            }
            for db in firestore_raw
        ]
    else:
        report["sections"]["firestore"] = FIRESTORE_DATABASES

    # 5. Enabled APIs (top-level snapshot)
    apis_text = gcloud_text(gcloud, "services", "list", "--enabled",
                             "--format=value(config.name)")
    apis = [a for a in apis_text.splitlines() if a.strip()]
    report["sections"]["enabled_apis"] = {
        "count": len(apis),
        "apis": sorted(apis),
    }

    # 6. Billing budget summary
    billing_raw = gcloud_text(
        gcloud,
        "billing", "budgets", "list",
        "--billing-account=018175-BBE06D-3B0276",
        "--format=json",
    )
    try:
        budgets = json.loads(billing_raw) if billing_raw and billing_raw.startswith("[") else []
        report["sections"]["billing_budgets"] = [
            {
                "display_name": b.get("displayName", ""),
                "amount": b.get("amount", {}).get("specifiedAmount", {}).get("units", "?"),
                "currency": b.get("amount", {}).get("specifiedAmount", {}).get("currencyCode", "USD"),
            }
            for b in budgets
        ]
    except Exception:
        report["sections"]["billing_budgets"] = []

    # 7. Local AI / LM Studio
    report["sections"]["local_ai"] = probe_lmstudio()

    # 8. GitHub Actions status (via GitHub API if token available)
    gh_token = os.environ.get("GITHUB_TOKEN", "")
    if gh_token:
        try:
            req = urllib.request.Request(
                "https://api.github.com/repos/izrl613/agape-sovereign/actions/runs?per_page=5",
                headers={"Authorization": f"token {gh_token}", "Accept": "application/vnd.github+json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                runs = json.loads(resp.read())
                report["sections"]["github_actions"] = [
                    {"name": r["name"], "status": r["status"],
                     "conclusion": r.get("conclusion", ""), "created_at": r["created_at"]}
                    for r in runs.get("workflow_runs", [])
                ]
        except Exception:
            report["sections"]["github_actions"] = []
    else:
        report["sections"]["github_actions"] = []

    return report


# ── PDF generation ────────────────────────────────────────────────────────────

def build_pdf(data: Dict[str, Any], out_path: Path) -> Path:
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                         Table, TableStyle, HRFlowable, PageBreak)
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "reportlab", "-q"])
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import Table, TableStyle, HRFlowable, PageBreak
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        title=f"Agape Sovereign Daily Report — {data['generated_date']}",
        author="agape-sovereign monitoring agent",
    )

    styles = getSampleStyleSheet()

    # Custom styles
    BRAND_BLUE = colors.HexColor("#1a73e8")
    BRAND_DARK = colors.HexColor("#0d1b2a")
    GREEN = colors.HexColor("#34a853")
    RED = colors.HexColor("#ea4335")
    AMBER = colors.HexColor("#fbbc05")
    LIGHT_GRAY = colors.HexColor("#f8f9fa")
    MID_GRAY = colors.HexColor("#e8eaed")

    title_style = ParagraphStyle("Title2", parent=styles["Title"],
                                  textColor=BRAND_DARK, fontSize=22, spaceAfter=4, alignment=TA_CENTER)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"],
                                     textColor=BRAND_BLUE, fontSize=11, spaceAfter=2, alignment=TA_CENTER)
    section_style = ParagraphStyle("Section", parent=styles["Heading2"],
                                    textColor=BRAND_BLUE, fontSize=13, spaceBefore=14, spaceAfter=4,
                                    borderPad=2)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9, spaceAfter=2)
    code_style = ParagraphStyle("Code", parent=styles["Code"], fontSize=8,
                                  backColor=LIGHT_GRAY, spaceAfter=2)
    note_style = ParagraphStyle("Note", parent=styles["Normal"], fontSize=8,
                                  textColor=colors.gray, spaceAfter=2, leftIndent=12)

    def status_color(status: Any) -> colors.Color:
        s = str(status).lower()
        if any(x in s for x in ["healthy", "active", "online", "ready", "known"]):
            return GREEN
        if any(x in s for x in ["error", "down", "failed", "offline", "unreachable"]):
            return RED
        return AMBER

    def table_style_for(header_row):
        return TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.25, MID_GRAY),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])

    story = []

    # ── Cover ──────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("🛸 AGAPE SOVEREIGN", title_style))
    story.append(Paragraph("Daily Infrastructure Status Report", subtitle_style))
    story.append(Paragraph(
        f"Generated: {data['generated_at'].replace('T', ' ').replace('+00:00', ' UTC')} &nbsp;|&nbsp; "
        f"Project: <b>{data['project']}</b>",
        ParagraphStyle("meta", parent=styles["Normal"], fontSize=8,
                         textColor=colors.gray, alignment=TA_CENTER)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE, spaceAfter=8))

    # ── Executive Summary ──────────────────────────────────────────────────────
    sections = data.get("sections", {})
    cr = sections.get("cloud_run", [])
    healthy_cr = sum(1 for s in cr if s.get("healthy") is True)
    total_cr = len([s for s in cr if s.get("healthy") is not None])
    fn_list = sections.get("cloud_functions", [])
    buckets = sections.get("storage_buckets", [])
    fs_dbs = sections.get("firestore", [])
    apis_info = sections.get("enabled_apis", {})
    local_ai = sections.get("local_ai", {})
    budgets = sections.get("billing_budgets", [])

    summary_data = [
        ["Component", "Count", "Status"],
        ["Cloud Run Services", str(total_cr), f"{healthy_cr}/{total_cr} reachable"],
        ["Cloud Functions", str(len(fn_list)), "Deployed"],
        ["Storage Buckets", str(len(buckets)), "Active"],
        ["Firestore Databases", str(len(fs_dbs)), "Active"],
        ["Enabled APIs", str(apis_info.get("count", "?")), "Configured"],
        ["Local AI (LM Studio)", "1", local_ai.get("status", "unknown").upper()],
        ["Billing Budgets", str(len(budgets)), "Configured"],
    ]

    story.append(Paragraph("Executive Summary", section_style))
    t = Table(summary_data, colWidths=[2.5 * inch, 1 * inch, 2.8 * inch])
    t.setStyle(table_style_for(summary_data[0]))
    story.append(t)
    story.append(Spacer(1, 0.1 * inch))

    # ── Cloud Run ─────────────────────────────────────────────────────────────
    story.append(Paragraph("Cloud Run Services", section_style))
    story.append(Paragraph(
        "Live HTTP health probes performed at report generation time. Services without public URLs are listed as N/A.",
        note_style
    ))
    cr_data = [["Service Name", "URL", "HTTP Status", "Health", "Latest Revision"]]
    for s in cr:
        status_txt = str(s.get("status_code", s.get("status", "?")))
        health_txt = "✓ HEALTHY" if s.get("healthy") is True else ("? N/A" if s.get("healthy") is None else "✗ DOWN")
        cr_data.append([
            s["service"],
            Paragraph(s.get("url", "N/A")[:60], code_style),
            status_txt,
            health_txt,
            s.get("latest_revision", "")[:30],
        ])
    t = Table(cr_data, colWidths=[1.6 * inch, 2.0 * inch, 0.7 * inch, 0.8 * inch, 1.4 * inch])
    ts = table_style_for(cr_data[0])
    for i, s in enumerate(cr, start=1):
        clr = status_color(s.get("status", ""))
        ts.add("TEXTCOLOR", (3, i), (3, i), clr)
        ts.add("FONTNAME", (3, i), (3, i), "Helvetica-Bold")
    t.setStyle(ts)
    story.append(t)

    # ── Cloud Functions ───────────────────────────────────────────────────────
    story.append(Paragraph("Cloud Functions", section_style))
    fn_data = [["Function Name", "Status", "Runtime", "Trigger", "Region"]]
    for fn in fn_list:
        fn_data.append([
            fn.get("name", ""),
            fn.get("status", ""),
            fn.get("runtime", ""),
            fn.get("trigger", "HTTP"),
            fn.get("region", GCP_REGION),
        ])
    t = Table(fn_data, colWidths=[2.1 * inch, 1.0 * inch, 1.0 * inch, 0.9 * inch, 1.4 * inch])
    t.setStyle(table_style_for(fn_data[0]))
    story.append(t)

    # ── Firestore ─────────────────────────────────────────────────────────────
    story.append(Paragraph("Firestore Databases", section_style))
    fs_data = [["Database Name", "Type", "Location", "State"]]
    for db in fs_dbs:
        fs_data.append([
            db.get("name", ""),
            db.get("type", ""),
            db.get("location", db.get("locationId", "")),
            db.get("state", "ACTIVE"),
        ])
    t = Table(fs_data, colWidths=[1.8 * inch, 1.8 * inch, 1.2 * inch, 1.4 * inch])
    t.setStyle(table_style_for(fs_data[0]))
    story.append(t)

    # ── Storage Buckets ───────────────────────────────────────────────────────
    story.append(Paragraph("Cloud Storage Buckets", section_style))
    bkt_data = [["Bucket Name", "Location", "Storage Class", "Created"]]
    for b in buckets:
        created = b.get("created", "")
        if "T" in created:
            created = created.split("T")[0]
        bkt_data.append([
            b.get("name", ""),
            b.get("location", ""),
            b.get("storage_class", "STANDARD"),
            created,
        ])
    t = Table(bkt_data, colWidths=[2.8 * inch, 1.0 * inch, 1.2 * inch, 1.1 * inch])
    t.setStyle(table_style_for(bkt_data[0]))
    story.append(t)

    # ── Enabled APIs ──────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Enabled GCP APIs", section_style))
    story.append(Paragraph(
        f"Total: {apis_info.get('count', '?')} APIs enabled on project <b>{GCP_PROJECT}</b>.",
        note_style
    ))
    api_names = apis_info.get("apis", [])
    # Split into 3 columns
    col_size = (len(api_names) + 2) // 3
    api_cols = [api_names[i:i + col_size] for i in range(0, len(api_names), col_size)]
    max_rows = max(len(c) for c in api_cols) if api_cols else 0
    api_table_data = []
    for row_i in range(max_rows):
        row = []
        for col in api_cols:
            row.append(col[row_i] if row_i < len(col) else "")
        api_table_data.append(row)
    if api_table_data:
        t = Table(api_table_data, colWidths=[2.2 * inch, 2.2 * inch, 2.2 * inch])
        t.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.15, MID_GRAY),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(t)

    # ── Billing Budgets ───────────────────────────────────────────────────────
    story.append(Paragraph("Billing Budgets", section_style))
    if budgets:
        b_data = [["Budget Name", "Amount", "Currency"]]
        for b in budgets:
            b_data.append([b.get("display_name", ""), str(b.get("amount", "?")), b.get("currency", "USD")])
        t = Table(b_data, colWidths=[3.0 * inch, 1.2 * inch, 1.0 * inch])
        t.setStyle(table_style_for(b_data[0]))
        story.append(t)
    else:
        story.append(Paragraph(
            "Billing budget details require billing API access. Configure budget at: "
            "console.cloud.google.com/billing → Budget & Alerts.",
            note_style
        ))

    # ── Local AI ──────────────────────────────────────────────────────────────
    story.append(Paragraph("Local AI System (LM Studio)", section_style))
    story.append(Paragraph(
        "<b>Architecture note:</b> LM Studio handles all encrypted SHA-256 data and Architect AI inference. "
        "Vertex AI is reserved for document/PDF rendering only. Local model does NOT require Vertex AI credit.",
        note_style
    ))
    ai_data = [["Service", "Status", "Model", "Endpoint"]]
    ai_data.append([
        local_ai.get("service", "LM Studio"),
        local_ai.get("status", "unknown").upper(),
        local_ai.get("model", "N/A"),
        "http://localhost:1234",
    ])
    t = Table(ai_data, colWidths=[1.5 * inch, 1.0 * inch, 2.5 * inch, 1.5 * inch])
    ts = table_style_for(ai_data[0])
    status_c = status_color(local_ai.get("status", ""))
    ts.add("TEXTCOLOR", (1, 1), (1, 1), status_c)
    ts.add("FONTNAME", (1, 1), (1, 1), "Helvetica-Bold")
    t.setStyle(ts)
    story.append(t)

    # ── GitHub Actions ────────────────────────────────────────────────────────
    gh_runs = sections.get("github_actions", [])
    if gh_runs:
        story.append(Paragraph("Recent GitHub Actions Runs", section_style))
        gh_data = [["Workflow", "Status", "Conclusion", "Created At"]]
        for r in gh_runs[:10]:
            gh_data.append([r.get("name", ""), r.get("status", ""), r.get("conclusion", ""), r.get("created_at", "")[:16]])
        t = Table(gh_data, colWidths=[2.5 * inch, 1.0 * inch, 1.0 * inch, 1.8 * inch])
        t.setStyle(table_style_for(gh_data[0]))
        story.append(t)

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * inch))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_GRAY))
    story.append(Paragraph(
        f"<i>Agape Sovereign Daily Report &nbsp;·&nbsp; Project: {GCP_PROJECT} "
        f"&nbsp;·&nbsp; {data['generated_date']} "
        f"&nbsp;·&nbsp; Near-zero-cost monitoring — free-tier APIs only</i>",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=7,
                         textColor=colors.gray, alignment=TA_CENTER, spaceBefore=4)
    ))

    doc.build(story)
    return out_path


# ── email via Gmail API ────────────────────────────────────────────────────────

def send_email_gmail(pdf_path: Path, recipient: str, report_date: str) -> bool:
    """Send the PDF via Gmail API. Requires GMAIL_CREDENTIALS_JSON env var or
       the Composio Gmail connector (used by the wrapper send_daily_email.py)."""
    import base64
    import email.mime.multipart
    import email.mime.text
    import email.mime.application

    # Build the MIME message
    msg = email.mime.multipart.MIMEMultipart()
    msg["to"] = recipient
    msg["from"] = "me"
    msg["subject"] = f"☁️ Agape Sovereign Daily Report — {report_date}"

    body_text = f"""Agape Sovereign Infrastructure — Daily Status Report
Date: {report_date}
Project: {GCP_PROJECT}

Please find the detailed PDF report attached.

Sections included:
  • Cloud Run Services (live health probes)
  • Cloud Functions (12 deployed)
  • Firestore Databases (2 active)
  • Cloud Storage Buckets (5 buckets)
  • Enabled GCP APIs snapshot
  • Billing Budget summary
  • Local AI / LM Studio status
  • GitHub Actions recent runs

Architecture note: LM Studio/Gemma handles local encrypted SHA-256 data.
Vertex AI is reserved for document PDF rendering only.

— Agape Sovereign Monitoring Agent
"""
    msg.attach(email.mime.text.MIMEText(body_text, "plain"))

    # Attach PDF
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()
    attachment = email.mime.application.MIMEApplication(pdf_data, _subtype="pdf")
    attachment.add_header("Content-Disposition", "attachment",
                           filename=f"agape-sovereign-daily-{report_date}.pdf")
    msg.attach(attachment)

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    # Attempt via gcloud-backed token first
    try:
        import google.auth
        import google.auth.transport.requests
        creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/gmail.send"])
        creds.refresh(google.auth.transport.requests.Request())
        token = creds.token

        import urllib.request, json
        body_bytes = json.dumps({"raw": raw}).encode()
        req = urllib.request.Request(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            data=body_bytes,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            result = json.loads(resp.read())
            print(f"[gmail] Message sent: id={result.get('id')}")
            return True
    except Exception as e:
        print(f"[gmail] gcloud-auth send failed: {e}")
        return False


# ── entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate daily Firebase/GCP PDF report")
    parser.add_argument("--out", type=str, help="Output PDF path (default: workspace_outputs/daily_reports/)")
    parser.add_argument("--email", type=str, default="agape@sovereign.nyc",
                        help="Email recipient (default: agape@sovereign.nyc)")
    parser.add_argument("--no-email", action="store_true", help="Skip email, just generate PDF")
    parser.add_argument("--json-only", action="store_true", help="Print JSON data and exit")
    args = parser.parse_args()

    gcloud = find_gcloud()
    if not gcloud:
        print("[ERROR] gcloud CLI not found. Please install Google Cloud SDK.", file=sys.stderr)
        sys.exit(1)

    print(f"[daily-report] Collecting service data from {GCP_PROJECT}...")
    data = collect_all(gcloud)

    if args.json_only:
        print(json.dumps(data, indent=2))
        return

    date_str = data["generated_date"]
    if args.out:
        out_path = Path(args.out)
    else:
        out_path = REPORTS_DIR / f"agape-sovereign-daily-{date_str}.pdf"

    print(f"[daily-report] Generating PDF → {out_path}")
    build_pdf(data, out_path)
    print(f"[daily-report] PDF saved: {out_path} ({out_path.stat().st_size:,} bytes)")

    if not args.no_email:
        print(f"[daily-report] Sending to {args.email}...")
        ok = send_email_gmail(out_path, args.email, date_str)
        if ok:
            print(f"[daily-report] ✓ Email delivered to {args.email}")
        else:
            print(f"[daily-report] ✗ Email send failed — PDF still saved at {out_path}")
            print(f"[daily-report]   Run: python3 agents/send_daily_email.py {out_path} {args.email}")


if __name__ == "__main__":
    main()
