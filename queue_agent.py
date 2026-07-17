import argparse
from pathlib import Path

from agents.workflows.runner import WorkflowRunner


def main() -> None:
    parser = argparse.ArgumentParser(description="Process queued workflow sources")
    parser.add_argument("--output-dir", default="./workspace_outputs", help="Output directory for generated artifacts")
    args = parser.parse_args()

    runner = WorkflowRunner(output_dir=Path(args.output_dir))
    results = runner.process_queue()
    print(results)


if __name__ == "__main__":
    main()
