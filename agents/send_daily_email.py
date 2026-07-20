"""Daily Report Email Sender — Composio Gmail Connector Wrapper

Sends the daily PDF report via Gmail using an OAuth2 token obtained from
the application default credentials (ADC) for idin@agape.nyc.

This script is the email-delivery companion to daily_report_agent.py.

Usage (standalone):
    python3 agents/send_daily_email.py /path/to/report.pdf agape@sovereign.nyc

Usage (end-to-end, generates PDF then emails):
    python3 agents/send_daily_email.py --generate --email agape@sovereign.nyc
"""

import argparse
import base64
import email.mime.application
import email.mime.multipart
import email.mime.text
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
REPORTS_DIR = REPO_ROOT / "workspace_outputs" / "daily_reports"

GCLOUD_PATHS = [
    "/Users/aarondavid/.gemini/antigravity-ide/scratch/google-cloud-sdk/bin/gcloud",
    "/usr/local/bin/gcloud",
    "/opt/homebrew/bin/gcloud",
]

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
]

DEFAULT_RECIPIENT = "agape@sovereign.nyc"
PROJECT = "agape-sovereign"


def find_gcloud():
    for p in GCLOUD_PATHS:
        if Path(p).exists():
            return p
    result = subprocess.run(["which", "gcloud"], capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None


def get_access_token(gcloud, scopes):
    """Get a fresh OAuth2 token via gcloud auth print-access-token."""
    try:
        result = subprocess.run(
            [gcloud, "auth", "print-access-token",
             f"--scopes={','.join(scopes)}",
             "idin@agape.nyc"],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception as e:
        print(f"[token] gcloud auth failed: {e}")
    # Fallback: application default credentials
    try:
        import google.auth
        import google.auth.transport.requests
        creds, _ = google.auth.default(scopes=scopes)
        req = google.auth.transport.requests.Request()
        creds.refresh(req)
        return creds.token
    except Exception as e:
        print(f"[token] ADC fallback failed: {e}")
    return None


def build_mime_message(pdf_path: Path, recipient: str, date_str: str) -> str:
    """Build a base64url-encoded MIME message with the PDF attached."""
    msg = email.mime.multipart.MIMEMultipart()
    msg["to"] = recipient
    msg["from"] = "idin@agape.nyc"
    msg["subject"] = f"☁️ Agape Sovereign Daily Infrastructure Report — {date_str}"

    body = f"""Hi,

Please find attached the daily infrastructure status report for the agape-sovereign project.

Date: {date_str}
Project: {PROJECT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report Sections:
  • Cloud Run Services — live health probes
  • Cloud Functions    — {PROJECT} deployed functions
  • Firestore          — 2 active databases
  • Cloud Storage      — bucket inventory
  • Enabled APIs       — full snapshot
  • Billing Budgets    — current budget config
  • Local AI           — LM Studio / Gemma status
  • GitHub Actions     — recent workflow runs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Architecture note:
  LM Studio / Gemma handles all encrypted SHA-256 data and Architect AI inference locally.
  Vertex AI is scoped exclusively to document PDF rendering ($1,000 credit preserved through 01/26/2027).

— Agape Sovereign Monitoring Agent
  Sent from: {PROJECT} daily-report-agent
"""
    msg.attach(email.mime.text.MIMEText(body, "plain"))

    if pdf_path and pdf_path.exists():
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
        attachment = email.mime.application.MIMEApplication(pdf_bytes, _subtype="pdf")
        attachment.add_header(
            "Content-Disposition", "attachment",
            filename=f"agape-sovereign-daily-{date_str}.pdf"
        )
        msg.attach(attachment)

    return base64.urlsafe_b64encode(msg.as_bytes()).decode()


def send_via_gmail_api(token: str, raw_message: str) -> dict:
    """POST to Gmail API messages.send."""
    body = json.dumps({"raw": raw_message}).encode()
    req = urllib.request.Request(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return {"error": str(e), "detail": error_body}


def run_generate_and_send(recipient: str) -> int:
    """Generate a fresh PDF and send it."""
    from agents.daily_report_agent import find_gcloud as _fg, collect_all, build_pdf, REPORTS_DIR as _rd

    gcloud = _fg()
    if not gcloud:
        print("[ERROR] gcloud not found", file=sys.stderr)
        return 1

    print("[send-daily] Collecting service data...")
    data = collect_all(gcloud)
    date_str = data["generated_date"]
    out_path = _rd / f"agape-sovereign-daily-{date_str}.pdf"

    print(f"[send-daily] Building PDF → {out_path}")
    build_pdf(data, out_path)
    print(f"[send-daily] PDF ready: {out_path.stat().st_size:,} bytes")

    return send_pdf(out_path, recipient, date_str)


def send_pdf(pdf_path, recipient, date_str=None):
    if not date_str:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    gcloud = find_gcloud()
    if not gcloud:
        print("[ERROR] gcloud not found — cannot obtain access token", file=sys.stderr)
        return 1

    print(f"[send-daily] Obtaining Gmail OAuth2 token for idin@agape.nyc...")
    token = get_access_token(gcloud, GMAIL_SCOPES)
    if not token:
        print("[ERROR] Could not obtain Gmail OAuth2 token.", file=sys.stderr)
        print("  → Try: gcloud auth login idin@agape.nyc --enable-gdrive-access", file=sys.stderr)
        return 1

    print(f"[send-daily] Building MIME message for {recipient}...")
    raw = build_mime_message(pdf_path, recipient, date_str)

    print(f"[send-daily] Sending via Gmail API...")
    result = send_via_gmail_api(token, raw)

    if "id" in result:
        print(f"[send-daily] ✓ Email sent! Message ID: {result['id']}")
        print(f"[send-daily]   To: {recipient} | Date: {date_str}")
        return 0
    else:
        print(f"[send-daily] ✗ Send failed: {result}", file=sys.stderr)
        # Log failure
        fail_log = REPORTS_DIR / f"send-failed-{date_str}.json"
        fail_log.write_text(json.dumps(result, indent=2))
        print(f"[send-daily]   Error saved: {fail_log}", file=sys.stderr)
        return 1


def main():
    parser = argparse.ArgumentParser(description="Send daily PDF report via Gmail")
    parser.add_argument("pdf_path", nargs="?", help="Path to existing PDF report")
    parser.add_argument("email", nargs="?", default=DEFAULT_RECIPIENT, help="Recipient email")
    parser.add_argument("--generate", action="store_true",
                        help="Generate PDF from live data before sending")
    parser.add_argument("--email", dest="email_flag", default=DEFAULT_RECIPIENT,
                        help="Recipient email (alternative flag form)")
    args = parser.parse_args()

    recipient = args.email_flag or args.email or DEFAULT_RECIPIENT

    if args.generate or not args.pdf_path:
        sys.exit(run_generate_and_send(recipient))
    else:
        pdf_path = Path(args.pdf_path)
        if not pdf_path.exists():
            print(f"[ERROR] PDF not found: {pdf_path}", file=sys.stderr)
            sys.exit(1)
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        sys.exit(send_pdf(pdf_path, recipient, date_str))


if __name__ == "__main__":
    main()
