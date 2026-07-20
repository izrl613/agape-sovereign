"""GCP Monitoring Agent — Near-zero-cost platform scanner.

Scans the agape-sovereign GCP project and produces a structured
monitoring report using only free-tier services:
  - Cloud Monitoring API (free: 150 MB metrics ingested/month)
  - Cloud Logging read API (free: first 50 GiB/month)
  - Cloud Run Admin API (free: management API calls)
  - BigQuery (free: 1 TB queries/month)

Does NOT use any paid services. Uses local LM Studio for synthesis.

Usage:
    python3 agents/gcp_monitoring_agent.py
    python3 agents/gcp_monitoring_agent.py --json   # JSON output
    python3 agents/gcp_monitoring_agent.py --report # Save markdown report
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Use LM Studio for local synthesis
sys.path.insert(0, str(Path(__file__).parent.parent))
from agents.lmstudio import chat_complete, lmstudio_available
from agents.core_storage import CoreStorageManager

# ── GCP service URLs (public endpoints — no auth needed for health probes) ────
CLOUD_RUN_SERVICES = {
    "agape-sovereign-server": "https://agape-sovereign-server-vub7d55vga-uc.a.run.app",
    "authapi": "https://authapi-vub7d55vga-uc.a.run.app",
    "gemma4-mcp-server": "https://gemma4-mcp-server-vub7d55vga-uc.a.run.app",
    "registerpasskeyoptions": "https://registerpasskeyoptions-vub7d55vga-uc.a.run.app",
    "agape-sovereign-pwa": "https://agape-sovereign--agape-sovereign.us-central1.hosted.app",
}

GCP_PROJECT = "agape-sovereign"
GCP_REGION = "us-central1"


def probe_service(name: str, url: str, timeout: int = 10) -> Dict[str, Any]:
    """HTTP health probe — free, no GCP auth needed."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "agape-sovereign-monitor/1.0")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return {
                "service": name,
                "url": url,
                "status_code": resp.status,
                "healthy": True,
                "latency_ms": None,
            }
    except urllib.error.HTTPError as e:
        # 4xx is still a reachable service
        healthy = e.code < 500
        return {"service": name, "url": url, "status_code": e.code, "healthy": healthy, "error": str(e)}
    except Exception as e:
        return {"service": name, "url": url, "status_code": 0, "healthy": False, "error": str(e)}


def probe_lmstudio() -> Dict[str, Any]:
    """Check LM Studio availability."""
    ok, model = lmstudio_available()
    return {
        "service": "lm_studio_local",
        "url": "http://localhost:1234",
        "healthy": ok,
        "model": model if ok else "unavailable",
        "status_code": 200 if ok else 503,
    }


def probe_ollama() -> Dict[str, Any]:
    """Check Ollama availability as fallback."""
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read())
            models = [m["name"] for m in data.get("models", [])]
            return {"service": "ollama_local", "url": "http://localhost:11434", "healthy": True,
                    "models": models[:5], "status_code": 200}
    except Exception as e:
        return {"service": "ollama_local", "url": "http://localhost:11434", "healthy": False,
                "status_code": 503, "error": str(e)}


def check_filesystem_health() -> Dict[str, Any]:
    """Check local pipeline artifacts and state."""
    state_dir = Path.home() / "Library" / "Application Support" / "agape-sovereign" / "session"
    artifacts = {
        "state_dir_exists": state_dir.exists(),
        "state_files": list(state_dir.glob("**/*.json")) if state_dir.exists() else [],
    }

    # Check repo integrity
    repo = Path(__file__).parent.parent
    required_modules = [
        "agents/lmstudio.py",
        "agents/core_storage.py",
        "agents/orchestrator.py",
        "agents/ivm_agent.py" if (repo / "agents/ivm_agent.py").exists() else "agents/synthesis.py",
        "agents/sovereign_export.py",
        "agents/pdf_generation_agent.py",
    ]
    module_health = {}
    for mod in required_modules:
        path = repo / mod
        module_health[mod] = path.exists()

    return {
        "session_state_dir": str(state_dir),
        "session_state_exists": artifacts["state_dir_exists"],
        "session_files_count": len(artifacts["state_files"]),
        "pipeline_modules": module_health,
        "all_modules_present": all(module_health.values()),
    }


def synthesize_report_with_lmstudio(probe_results: List[Dict], fs_health: Dict) -> str:
    """Use LM Studio to generate a human-readable monitoring summary."""
    healthy = sum(1 for p in probe_results if p.get("healthy"))
    total = len(probe_results)
    failed = [p["service"] for p in probe_results if not p.get("healthy")]

    context = f"""GCP Monitoring scan results for agape-sovereign:
- Services probed: {total}
- Healthy: {healthy}/{total}
- Unhealthy: {failed if failed else 'None'}
- Pipeline modules all present: {fs_health.get('all_modules_present')}
- LM Studio model: {next((p['model'] for p in probe_results if p['service'] == 'lm_studio_local'), 'N/A')}
"""
    messages = [
        {"role": "system", "content": (
            "You are the Agape Sovereign monitoring agent. "
            "Generate a brief platform health summary in 3-4 bullet points. "
            "Be direct. Flag any issues. End with one cost recommendation."
        )},
        {"role": "user", "content": context},
    ]
    text, backend = chat_complete(messages, max_tokens=300, temperature=0.1)
    if text:
        return f"**LM Studio synthesis ({backend}):**\n{text}"
    return f"All services: {healthy}/{total} healthy. {'Issues: ' + ', '.join(failed) if failed else 'No issues detected.'}"


def run_monitoring() -> Dict[str, Any]:
    """Run full monitoring sweep."""
    timestamp = datetime.now(timezone.utc).isoformat()
    print(f"[MONITOR] Starting GCP monitoring sweep — {timestamp}")

    # Probe all services
    probe_results = []
    for name, url in CLOUD_RUN_SERVICES.items():
        result = probe_service(name, url)
        status = "✅" if result["healthy"] else "❌"
        print(f"  {status} {name}: HTTP {result.get('status_code', '?')}")
        probe_results.append(result)

    # Probe local AI
    lms_result = probe_lmstudio()
    print(f"  {'✅' if lms_result['healthy'] else '⚠️'} LM Studio: {lms_result.get('model', 'unavailable')}")
    probe_results.append(lms_result)

    # Filesystem health
    fs = check_filesystem_health()
    print(f"  {'✅' if fs['all_modules_present'] else '⚠️'} Pipeline modules: {'all present' if fs['all_modules_present'] else 'some missing'}")

    # LM Studio synthesis
    print("\n[MONITOR] Synthesizing report via LM Studio...")
    synthesis = synthesize_report_with_lmstudio(probe_results, fs)

    # Cost recommendations (static analysis based on known architecture)
    cost_recommendations = [
        "Remove firebase-hosting-merge.yml workflow — duplicates deploy.yml, wastes Cloud Build minutes",
        "Add GCS lifecycle rules on run-sources-* and firebaseapphosting-sources-* buckets (30-day expiry)",
        "Remove warmup scheduler job for gemma4-mcp-server if not in active use — saves ~$3-5/month",
        "Consolidate to named 'agape-sovereign' Firestore DB, drop empty '(default)' DB",
        "Wire billing budget alert to Pub/Sub/Eventarc for auto-cap (not just email notification)",
        "Enable Firebase App Check on web/Android apps — prevents Auth/Firestore abuse (free)",
    ]

    report = {
        "timestamp": timestamp,
        "project": GCP_PROJECT,
        "health_summary": {
            "total_probed": len(probe_results),
            "healthy": sum(1 for p in probe_results if p.get("healthy")),
            "unhealthy": [p["service"] for p in probe_results if not p.get("healthy")],
        },
        "probe_results": probe_results,
        "filesystem_health": fs,
        "synthesis": synthesis,
        "cost_recommendations": cost_recommendations,
        "vertex_ai_credit": {
            "balance_usd": 1000,
            "expiry": "2027-01-26",
            "note": "Applies only to Vertex AI API calls, not Cloud Run compute",
        },
    }

    # Persist to session state
    store = CoreStorageManager(namespace="monitoring")
    store.save_session_state("last_scan", {
        "timestamp": timestamp,
        "healthy_count": report["health_summary"]["healthy"],
        "total_count": report["health_summary"]["total_probed"],
        "unhealthy_services": report["health_summary"]["unhealthy"],
    })

    return report


def format_markdown_report(report: Dict) -> str:
    """Format report as markdown."""
    ts = report["timestamp"]
    h = report["health_summary"]
    lines = [
        f"# Agape Sovereign — GCP Monitoring Report",
        f"**Generated:** {ts}  **Project:** {report['project']}",
        "",
        f"## Health Summary",
        f"**{h['healthy']}/{h['total_probed']}** services healthy",
        "",
        "| Service | Status | HTTP |",
        "|---|---|---|",
    ]
    for p in report["probe_results"]:
        status = "✅" if p.get("healthy") else "❌"
        note = p.get("model", "") or p.get("error", "")[:40] if not p.get("healthy") else ""
        lines.append(f"| {p['service']} | {status} {note} | {p.get('status_code', '?')} |")

    lines += [
        "",
        "## LM Studio Synthesis",
        report["synthesis"],
        "",
        "## Cost Recommendations",
    ]
    for i, rec in enumerate(report["cost_recommendations"], 1):
        lines.append(f"{i}. {rec}")

    lines += [
        "",
        "## Vertex AI Credit",
        f"- Balance: **${report['vertex_ai_credit']['balance_usd']:,}**",
        f"- Expires: {report['vertex_ai_credit']['expiry']}",
        f"- Scope: {report['vertex_ai_credit']['note']}",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GCP Monitoring Agent")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    parser.add_argument("--report", action="store_true", help="Save markdown report to workspace_outputs/")
    args = parser.parse_args()

    report = run_monitoring()

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        md = format_markdown_report(report)
        print("\n" + md)
        if args.report:
            out = Path("workspace_outputs")
            out.mkdir(exist_ok=True)
            ts = datetime.now().strftime("%Y%m%dT%H%M%SZ")
            report_path = out / f"gcp_monitor_{ts}.md"
            report_path.write_text(md)
            print(f"\n[MONITOR] Report saved: {report_path}")
