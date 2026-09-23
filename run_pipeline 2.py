#!/usr/bin/env python3
"""
run_pipeline.py — Agape Sovereign local pipeline CLI

Usage:
    python3 run_pipeline.py --source /path/to/plan.pdf
    python3 run_pipeline.py --source /path/to/plan.pdf --export
    python3 run_pipeline.py --source /path/to/plan.pdf --out /tmp/my-run
    python3 run_pipeline.py --llm-status

Model priority (zero external billing):
    1. LM Studio  http://localhost:1234  qwen3.5-9b-sushi-coder-rl-mlx
    2. Ollama     http://localhost:11434 qwen2.5-coder:7b
"""

import argparse
import json
import sys
import time
import uuid
from pathlib import Path

# ── sys.path: allow running from repo root without pip install ─────────────────
sys.path.insert(0, str(Path(__file__).parent))

from agents.lmstudio import lmstudio_available, ollama_available, LMSTUDIO_MODEL
from agents.orchestrator import OrchestratorAgent
from agents.core_storage import CoreStorageManager


def print_banner(model_info: str) -> None:
    print("=" * 62)
    print("  AGAPE SOVEREIGN — Local Pipeline Runner")
    print(f"  Model: {model_info}")
    print("=" * 62)


def check_llm_status() -> None:
    print("\n── Local LLM Status ──────────────────────────────────────")
    ok_ls, model_ls = lmstudio_available()
    ok_ol, model_ol = ollama_available()

    if ok_ls:
        print(f"  ✅  LM Studio  RUNNING  →  {model_ls}")
    else:
        print("  🔴  LM Studio  not available  (start via Developer > Local Server)")

    if ok_ol:
        print(f"  ✅  Ollama     RUNNING  →  {model_ol}")
    else:
        print("  🔴  Ollama     not available")

    if not ok_ls and not ok_ol:
        print("\n  ⚠️  No local LLM found — pipeline will use regex-only extraction.")
    print()


def run(source: str, out_dir: str, user_id: str, enable_export: bool) -> dict:
    src_path = Path(source)
    if not src_path.exists():
        print(f"  ✗  Source not found: {src_path}", file=sys.stderr)
        sys.exit(1)

    run_id = str(uuid.uuid4())[:8]
    output_path = Path(out_dir) / f"run_{run_id}"

    # Determine active model for display
    ok_ls, model_ls = lmstudio_available()
    ok_ol, model_ol = ollama_available()
    active_model = model_ls if ok_ls else (model_ol if ok_ol else "regex-only")
    print_banner(active_model)

    print(f"\n  Source  : {src_path}")
    print(f"  Run ID  : {run_id}")
    print(f"  Output  : {output_path}")
    print(f"  Export  : {'YES (sovereign identity bundle)' if enable_export else 'no'}")
    print()

    store = CoreStorageManager(namespace=run_id)

    t0 = time.time()
    try:
        orchestrator = OrchestratorAgent(output_dir=output_path, user_id=user_id)
        result = orchestrator.run(str(src_path), enable_export=enable_export)
    except Exception as exc:
        print(f"\n  ✗  Pipeline failed: {exc}", file=sys.stderr)
        sys.exit(1)

    elapsed = time.time() - t0

    # Persist run summary to local ledger
    summary = {
        "status": result.get("status", "completed"),
        "plan_summary": result.get("plan_summary", ""),
        "model": active_model,
        "elapsed_s": round(elapsed, 2),
        "output_dir": str(output_path),
    }
    store.record_pipeline_run(run_id, summary)

    # Handle sovereign export mnemonic securely
    mnemonic = result.pop("_mnemonic_phrase", None)

    print(f"\n  ── Execution complete ({elapsed:.1f}s) ──────────────────────")
    print(f"  Status      : {result.get('status')}")
    print(f"  Plan summary: {result.get('plan_summary', '')[:80]}")

    print("\n  Agent steps:")
    for step in result.get("agents", []):
        icon = "✅" if step["status"] == "completed" else "❌"
        print(f"    {icon}  {step['name']:<20}  {step['status']}")

    print(f"\n  Reports written to: {output_path}/")

    if mnemonic:
        print("\n  ⭐  SOVEREIGN EXPORT COMPLETE")
        print("  ┌─────────────────────────────────────────────────────────┐")
        print("  │  MNEMONIC RECOVERY PHRASE (record this and keep safe):  │")
        print(f"  │  {mnemonic:<57}│")
        print("  └─────────────────────────────────────────────────────────┘")
        print("  ⚠️  This phrase is NOT saved to disk. Store it safely now.\n")

    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Agape Sovereign local pipeline runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--source", "-s",
        help="Path to input PDF or Markdown plan file",
    )
    parser.add_argument(
        "--out", "-o",
        default=str(Path.cwd() / "workspace_outputs"),
        help="Output directory (default: ./workspace_outputs)",
    )
    parser.add_argument(
        "--user-id", "-u",
        default="local",
        help="User identifier for sovereign export (default: local)",
    )
    parser.add_argument(
        "--export",
        action="store_true",
        help="Enable sovereign identity export (Crown Jewel module)",
    )
    parser.add_argument(
        "--llm-status",
        action="store_true",
        help="Check which local LLMs are available and exit",
    )
    args = parser.parse_args()

    if args.llm_status:
        check_llm_status()
        if args.source is None:
            return

    if not args.source:
        parser.print_help()
        sys.exit(1)

    run(
        source=args.source,
        out_dir=args.out,
        user_id=args.user_id,
        enable_export=args.export,
    )


if __name__ == "__main__":
    main()
