import argparse
from pathlib import Path

from agents.orchestrator import OrchestratorAgent


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the sovereign orchestration workflow")
    parser.add_argument("--input", default="/Users/aarondavid/Desktop/Sovereign Data Pipeline Defined - 2026-07-15 21.46.md", help="Path to the workflow markdown file")
    parser.add_argument("--output-dir", default="./workspace_outputs", help="Directory for generated workflow artifacts")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    plan_text = input_path.read_text(encoding="utf-8")
    agent = OrchestratorAgent(output_dir=Path(args.output_dir))
    result = agent.run(plan_text)
    print("Workflow completed")
    print(result["status"])
    print(result["extraction"])


if __name__ == "__main__":
    main()
