import json
from pathlib import Path
from typing import List, Dict, Union


class TaskQueue:
    def __init__(self, queue_file: Union[str, Path] | None = None):
        self.queue_file = Path(queue_file or Path.cwd() / "workspace_outputs" / "task_queue.json")
        self.queue_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.queue_file.exists():
            self.queue_file.write_text("[]", encoding="utf-8")

    def enqueue(self, source: str) -> Dict[str, object]:
        payload = self._read()
        item = {"id": len(payload) + 1, "source": source, "status": "queued"}
        payload.append(item)
        self._write(payload)
        return item

    def dequeue(self) -> Dict[str, object] | None:
        payload = self._read()
        if not payload:
            return None
        item = payload.pop(0)
        self._write(payload)
        return item

    def list(self) -> List[Dict[str, object]]:
        return self._read()

    def _read(self) -> List[Dict[str, object]]:
        return json.loads(self.queue_file.read_text(encoding="utf-8"))

    def _write(self, payload: List[Dict[str, object]]) -> None:
        self.queue_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
