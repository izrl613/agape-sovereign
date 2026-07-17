import argparse
from pathlib import Path

from agents.workflows.runner import WorkflowRunner


def main() -> None:
    parser = argparse.ArgumentParser(description="Launch the sovereign workflow agent pipeline")
    parser.add_argument("--input", default="/Users/aarondavid/Desktop/Sovereign Data Pipeline Defined - 2026-07-15 21.46.md", help="Input file or inline text")
    parser.add_argument("--output-dir", default="./workspace_outputs", help="Output directory for generated artifacts")
    args = parser.parse_args()

    runner = WorkflowRunner(output_dir=Path(args.output_dir))
    manifest = runner.run(args.input)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    import json
    main()
