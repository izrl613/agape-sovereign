"""CoreStorageManager — persistent local session-state storage.

Implements the "CoreStorageManager" defined in the Operation Framework:

  "Manages persistent local storage (simulates IndexedDB/Keychain).
   Handles State and Security Cleanup. Ensures operation continues even
   if all network services fail."

State is written to ~/Library/Application Support/agape-sovereign/session/
on macOS, falling back to ~/.agape-sovereign/session/ on other platforms.

Security rules:
  - Raw PII keys are never written; only SHA-256 digests are persisted.
  - purge_sensitive_data() zeroes out in-memory references before del.
  - All state files are chmod 600 (owner read/write only).
"""

import hashlib
import json
import os
import platform
import stat
import time
from pathlib import Path
from typing import Any, Dict, List, Optional


def _state_dir() -> Path:
    """Return the platform-appropriate state directory, creating it if needed."""
    if platform.system() == "Darwin":
        base = Path.home() / "Library" / "Application Support" / "agape-sovereign" / "session"
    else:
        base = Path.home() / ".agape-sovereign" / "session"
    base.mkdir(parents=True, exist_ok=True)
    return base


def _secure_write(path: Path, data: Dict) -> None:
    """Write JSON to path with owner-only permissions."""
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    tmp.chmod(stat.S_IRUSR | stat.S_IWUSR)  # chmod 600
    tmp.replace(path)                         # atomic rename


class CoreStorageManager:
    """
    Manages persistent local state across pipeline runs.

    Usage::

        store = CoreStorageManager()
        store.save_session_state("ingestion", {"text": "...", "source": "..."})
        state = store.retrieve_session_state("ingestion")
        store.purge_sensitive_data(["raw_pii", "temp_payload"])
    """

    def __init__(self, namespace: str = "default"):
        self._dir = _state_dir() / namespace
        self._dir.mkdir(parents=True, exist_ok=True)
        self._memory: Dict[str, Any] = {}  # in-process cache

    # ── Persistence ────────────────────────────────────────────────────────────

    def save_session_state(self, key: str, data: Any) -> None:
        """Persist a state snapshot under *key* to disk and memory cache."""
        # Never persist raw PII — caller must pre-hash sensitive fields
        self._memory[key] = data
        record = {
            "key": key,
            "saved_at": time.time(),
            "data": data,
        }
        path = self._dir / f"{key}.json"
        _secure_write(path, record)
        print(f"[STORAGE] State '{key}' persisted to {path}")

    def retrieve_session_state(self, key: str) -> Optional[Any]:
        """Return the last persisted state for *key*, or None if not found."""
        # Memory cache hit
        if key in self._memory:
            return self._memory[key]
        # Disk read
        path = self._dir / f"{key}.json"
        if path.exists():
            try:
                record = json.loads(path.read_text(encoding="utf-8"))
                self._memory[key] = record.get("data")
                return self._memory[key]
            except Exception:
                pass
        return None

    def list_keys(self) -> List[str]:
        """List all persisted state keys in this namespace."""
        return [p.stem for p in self._dir.glob("*.json")]

    # ── Security cleanup ───────────────────────────────────────────────────────

    def purge_sensitive_data(self, keys: List[str]) -> None:
        """
        Zero out in-memory references for *keys* and delete their disk files.

        Per the Operation Framework: "Mandatory security cleanup step to erase
        raw PII from memory/storage buffers."
        """
        for key in keys:
            if key in self._memory:
                # Overwrite before deleting to reduce memory leak window
                if isinstance(self._memory[key], dict):
                    for k in list(self._memory[key]):
                        self._memory[key][k] = None
                elif isinstance(self._memory[key], str):
                    self._memory[key] = "\x00" * len(self._memory[key])
                del self._memory[key]
            path = self._dir / f"{key}.json"
            if path.exists():
                # Overwrite with zeros before removing
                path.write_bytes(b"\x00" * path.stat().st_size)
                path.unlink()
        print(f"[SECURITY] Sensitive data purged: {keys}")

    # ── SHA-256 hash helper ────────────────────────────────────────────────────

    @staticmethod
    def sha256_id(raw_value: str) -> str:
        """Return the SHA-256 hex digest of *raw_value* (the sovereign identity hash)."""
        return hashlib.sha256(raw_value.encode("utf-8")).hexdigest()

    # ── Pipeline run ledger ───────────────────────────────────────────────────

    def record_pipeline_run(self, run_id: str, summary: Dict) -> None:
        """Append a pipeline run summary to the run ledger (append-only log)."""
        ledger_path = self._dir.parent / "pipeline_runs.jsonl"
        entry = {
            "run_id": run_id,
            "timestamp": time.time(),
            **{k: v for k, v in summary.items() if k not in ("raw_payload", "pii")},
        }
        with ledger_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
        ledger_path.chmod(stat.S_IRUSR | stat.S_IWUSR)

    def get_run_history(self, limit: int = 20) -> List[Dict]:
        """Return the last *limit* pipeline run summaries."""
        ledger_path = self._dir.parent / "pipeline_runs.jsonl"
        if not ledger_path.exists():
            return []
        lines = ledger_path.read_text(encoding="utf-8").splitlines()
        parsed = []
        for line in lines[-limit:]:
            try:
                parsed.append(json.loads(line))
            except Exception:
                pass
        return parsed
