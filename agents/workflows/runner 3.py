import json
from pathlib import Path
from typing import Dict, Union

from agents.orchestrator import OrchestratorAgent
from agents.workflows.queue import TaskQueue


class WorkflowRunner:
    def __init__(self, output_dir: Union[str, Path] | None = None, queue_file: Union[str, Path] | None = None):
        self.output_dir = Path(output_dir or Path.cwd() / "workspace_outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.queue = TaskQueue(queue_file or self.output_dir / "task_queue.json")

    def run(self, source: Union[str, Path]) -> Dict[str, object]:
        orchestrator = OrchestratorAgent(output_dir=self.output_dir)
        result = orchestrator.run(source)
        manifest = {
            "source": str(source),
            "status": result["status"],
            "agents": result.get("agents", []),
            "output_files": [
                str(self.output_dir / "workflow_report.json"),
                str(self.output_dir / "executive_briefing.md"),
            ],
        }
        (self.output_dir / "workflow_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        return manifest

    def process_queue(self) -> list[Dict[str, object]]:
        results = []
        while True:
            item = self.queue.dequeue()
            if not item:
                break
            try:
                result = self.run(item["source"])
                item["status"] = result["status"]
                item["result"] = result
            except Exception as exc:
                item["status"] = "failed"
                item["error"] = str(exc)
            results.append(item)
        return results
