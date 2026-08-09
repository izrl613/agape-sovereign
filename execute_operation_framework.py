#!/usr/bin/env python3
"""
execute_operation_framework.py — Master entry point for Operation Framework execution.

Implements the dual-phase deployment defined in OPERATION FRAMEWORK.PDF:

  Phase 1 — Document Pipeline (OrchestratorAgent)
    Ingestion → Extraction → DataMapper → Validator → Synthesis → Audit → PDF Report

  Phase 2 — Sovereign State Engine (POAOrchestrator)
    ZTNA Gate → Capacity Check → IVM → AI Agent → PDF Generator → Export/Recovery

Usage:
    python3 execute_operation_framework.py
    python3 execute_operation_framework.py --pdf "/path/to/OPERATION FRAMEWORK.PDF"
    python3 execute_operation_framework.py --skip-poa          # document pipeline only
    python3 execute_operation_framework.py --skip-document    # identity engine only
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
sys.path.insert(0, str(ROOT))

DEFAULT_PDF = ROOT / "OPERATION FRAMEWORK.PDF"
DEFAULT_OUT = ROOT / "workspace_outputs" / "operation_framework_run"


def _banner(title: str) -> None:
    print("\n" + "=" * 64)
    print(f"  {title}")
    print("=" * 64)


def run_document_pipeline(pdf_path: Path, output_dir: Path, enable_export: bool) -> dict:
    """Phase 1: Full agent orchestration against the Operation Framework PDF."""
    from agents.lmstudio import lmstudio_available, ollama_available
    from agents.orchestrator import OrchestratorAgent
    from agents.core_storage import CoreStorageManager

    ok_ls, model_ls = lmstudio_available()
    ok_ol, model_ol = ollama_available()
    active_model = model_ls if ok_ls else (model_ol if ok_ol else "regex-only")

    _banner("PHASE 1 — Document Pipeline (OrchestratorAgent)")
    print(f"  Source : {pdf_path}")
    print(f"  Output : {output_dir}")
    print(f"  Model  : {active_model}")
    print(f"  Export : {'yes' if enable_export else 'no'}")

    run_id = hashlib.sha256(f"{pdf_path}{time.time()}".encode()).hexdigest()[:8]
    doc_out = output_dir / f"document_pipeline_{run_id}"
    doc_out.mkdir(parents=True, exist_ok=True)

    store = CoreStorageManager(namespace=run_id)
    t0 = time.time()

    orchestrator = OrchestratorAgent(output_dir=doc_out, user_id="operation-framework")
    result = orchestrator.run(str(pdf_path), enable_export=enable_export)

    elapsed = time.time() - t0
    mnemonic = result.pop("_mnemonic_phrase", None)

    summary = {
        "phase": "document_pipeline",
        "status": result.get("status", "completed"),
        "run_id": run_id,
        "source": str(pdf_path),
        "output_dir": str(doc_out),
        "model": active_model,
        "elapsed_s": round(elapsed, 2),
        "agents": result.get("agents", []),
        "pdf_report": result.get("pdf_report"),
        "plan_summary": result.get("plan_summary", "")[:200],
    }
    store.record_pipeline_run(run_id, summary)

    (output_dir / "phase1_document_pipeline.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    print(f"\n  Phase 1 complete ({elapsed:.1f}s) — status: {summary['status']}")
    for step in summary.get("agents", []):
        icon = "✓" if step.get("status") == "completed" else "✗"
        print(f"    {icon}  {step.get('name', '?')}")

    if mnemonic:
        print("\n  SOVEREIGN EXPORT — mnemonic (not persisted to disk):")
        print(f"    {mnemonic}")

    return summary


def run_sovereign_engine(output_dir: Path, auth_type: str, user_id: str | None) -> dict:
    """Phase 2: POA Orchestrator — identity audit state engine."""
    from sovereign.poa_orchestrator import POAOrchestrator

    _banner("PHASE 2 — Sovereign State Engine (POAOrchestrator)")
    print(f"  Auth   : {auth_type}")
    print(f"  Output : {output_dir}")

    engine_out = output_dir / "sovereign_engine"
    engine_out.mkdir(parents=True, exist_ok=True)

    t0 = time.time()
    orchestrator = POAOrchestrator(output_dir=engine_out)
    result = orchestrator.run(auth_type=auth_type, user_identifier=user_id)
    elapsed = time.time() - t0

    summary = {
        "phase": "sovereign_state_engine",
        "status": result.get("status", "unknown"),
        "elapsed_s": round(elapsed, 2),
        "output_dir": str(engine_out),
        **{k: v for k, v in result.items() if k != "mnemonic_phrase"},
    }

    mnemonic = result.get("mnemonic_phrase")
    if mnemonic:
        print("\n  RECOVERY MNEMONIC (not persisted to disk):")
        print(f"    {mnemonic}")

    (output_dir / "phase2_sovereign_engine.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    print(f"\n  Phase 2 complete ({elapsed:.1f}s) — status: {summary['status']}")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Execute Operation Framework (dual-phase)")
    parser.add_argument(
        "--pdf",
        default=str(DEFAULT_PDF),
        help=f"Path to OPERATION FRAMEWORK.PDF (default: {DEFAULT_PDF.name})",
    )
    parser.add_argument(
        "--out", "-o",
        default=str(DEFAULT_OUT),
        help="Output directory for all artifacts",
    )
    parser.add_argument("--skip-document", action="store_true", help="Skip Phase 1 document pipeline")
    parser.add_argument("--skip-poa", action="store_true", help="Skip Phase 2 sovereign state engine")
    parser.add_argument("--export", action="store_true", help="Enable sovereign identity export in Phase 1")
    parser.add_argument("--auth-type", default="Google", help="Auth pathway for Phase 2")
    parser.add_argument("--user-id", default=None, help="Optional user identifier for Phase 2")
    args = parser.parse_args()

    pdf_path = Path(args.pdf).resolve()
    output_dir = Path(args.out).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not args.skip_document and not pdf_path.exists():
        print(f"ERROR: PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    run_id = str(uuid.uuid4())[:8]
    started = datetime.now(timezone.utc).isoformat()

    _banner("AGAPE SOVEREIGN — OPERATION FRAMEWORK EXECUTION")
    print(f"  Run ID  : {run_id}")
    print(f"  Started : {started}")
    print(f"  PDF     : {pdf_path if not args.skip_document else '(skipped)'}")

    manifest: dict = {
        "run_id": run_id,
        "started_at": started,
        "source_pdf": str(pdf_path),
        "output_dir": str(output_dir),
        "phases": {},
    }

    t_total = time.time()

    if not args.skip_document:
        manifest["phases"]["document_pipeline"] = run_document_pipeline(
            pdf_path, output_dir, enable_export=args.export
        )

    if not args.skip_poa:
        manifest["phases"]["sovereign_engine"] = run_sovereign_engine(
            output_dir, auth_type=args.auth_type, user_id=args.user_id
        )

    manifest["elapsed_s"] = round(time.time() - t_total, 2)
    manifest["completed_at"] = datetime.now(timezone.utc).isoformat()
    manifest["status"] = "SUCCESS" if all(
        p.get("status") in ("completed", "SUCCESS")
        for p in manifest["phases"].values()
    ) else "PARTIAL"

    manifest_path = output_dir / "operation_framework_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    _banner("OPERATION FRAMEWORK — EXECUTION COMPLETE")
    print(f"  Status   : {manifest['status']}")
    print(f"  Elapsed  : {manifest['elapsed_s']}s")
    print(f"  Manifest : {manifest_path}")
    print()


if __name__ == "__main__":
    main()
