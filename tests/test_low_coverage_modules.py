import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from agents import core_storage as agent_storage
from agents.workflows.queue import TaskQueue
from agents.workflows.runner import WorkflowRunner
from mcp_server import server
from sovereign.ai_agent import AIAgent
from sovereign.core_storage import CoreStorageManager as SovereignStorage
from sovereign.export_recovery_agent import ExportRecoveryAgent
from sovereign.ivm_agent import IVMAgent
from sovereign.lm_studio_client import LMStudioClient
from sovereign.pdf_agent import PDFGenerationAgent


class AgentCoreStorageTests(unittest.TestCase):
    def test_persists_retrieves_lists_and_purges_state(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            state_dir = Path(tmpdir) / "session"
            with patch.object(agent_storage, "_state_dir", return_value=state_dir):
                storage = agent_storage.CoreStorageManager("test")
                state = {"name": "Alice", "token": "secret"}
                storage.save_session_state("identity", state)

                self.assertEqual(storage.retrieve_session_state("identity"), state)
                self.assertEqual(storage.list_keys(), ["identity"])
                self.assertEqual(
                    agent_storage.CoreStorageManager.sha256_id("identity"),
                    "689f6a627384c7dcb2dcc1487e540223e77bdf9dcd0d8be8a326eda65b0ce9a4",
                )

                storage.purge_sensitive_data(["identity"])
                self.assertIsNone(storage.retrieve_session_state("identity"))
                self.assertEqual(storage.list_keys(), [])

    def test_reads_disk_state_and_filters_sensitive_ledger_fields(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            state_dir = Path(tmpdir) / "session"
            with patch.object(agent_storage, "_state_dir", return_value=state_dir):
                first = agent_storage.CoreStorageManager("test")
                first.save_session_state("status", {"ready": True})
                first.record_pipeline_run(
                    "run-1",
                    {"status": "completed", "raw_payload": "pii", "pii": "secret"},
                )

                second = agent_storage.CoreStorageManager("test")
                self.assertEqual(second.retrieve_session_state("status"), {"ready": True})
                history = second.get_run_history()
                self.assertEqual(history[0]["run_id"], "run-1")
                self.assertNotIn("raw_payload", history[0])
                self.assertNotIn("pii", history[0])

                ledger = state_dir / "pipeline_runs.jsonl"
                ledger.write_text(ledger.read_text() + "not-json\n", encoding="utf-8")
                self.assertEqual(len(second.get_run_history()), 1)


class McpServerTests(unittest.TestCase):
    @staticmethod
    def _response(payload):
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps(payload).encode()
        response.__exit__.return_value = None
        return response

    def test_http_helpers_handle_success_and_errors(self):
        with patch("mcp_server.server.urllib.request.urlopen") as urlopen:
            urlopen.return_value = self._response({"ok": True})
            self.assertEqual(server._http_get("http://example.test"), {"ok": True})
            self.assertEqual(
                server._http_post("http://example.test", {"message": "hi"}),
                {"ok": True},
            )

        with patch(
            "mcp_server.server.urllib.request.urlopen",
            side_effect=OSError("offline"),
        ):
            self.assertIsNone(server._http_get("http://example.test"))
            self.assertIsNone(server._http_post("http://example.test", {}))

    def test_model_selection_prefers_configured_models_and_falls_back_sorted(self):
        with patch.object(server, "_http_get", return_value={"models": [{"name": "llama"}]}):
            with patch.object(server, "OLLAMA_MODEL_PRIORITY", ["", "llama"]):
                self.assertEqual(server._ollama_model(), "llama")

        with patch.object(
            server,
            "_http_get",
            return_value={"models": [{"name": "zeta"}, {"name": "alpha"}]},
        ):
            with patch.object(server, "OLLAMA_MODEL_PRIORITY", ["missing"]):
                self.assertEqual(server._ollama_model(), "alpha")

        with patch.object(server, "_http_get", return_value={"data": [{"id": "other"}]}):
            with patch.object(server, "LMSTUDIO_MODEL", "preferred"):
                self.assertEqual(server._lmstudio_model(), "other")

    def test_infer_uses_ollama_then_lmstudio_then_unavailable(self):
        messages = [{"role": "user", "content": "hello"}]
        with patch.object(server, "_ollama_model", return_value="ollama-model"), patch.object(
            server, "_lmstudio_model", return_value="lm-model"
        ), patch.object(
            server,
            "_http_post",
            return_value={"message": {"content": "ollama response"}},
        ) as post:
            self.assertEqual(server._infer(messages), ("ollama response", "ollama:ollama-model"))
            self.assertEqual(post.call_count, 1)

        with patch.object(server, "_ollama_model", return_value=None), patch.object(
            server, "_lmstudio_model", return_value="lm-model"
        ), patch.object(
            server,
            "_http_post",
            return_value={"choices": [{"message": {"content": "lm response"}}]},
        ):
            self.assertEqual(server._infer(messages), ("lm response", "lmstudio:lm-model"))

        with patch.object(server, "_ollama_model", return_value=None), patch.object(
            server, "_lmstudio_model", return_value=None
        ):
            text, backend = server._infer(messages)
            self.assertEqual(backend, "unavailable")
            self.assertIn("No local LLM available", text)

    def test_dispatches_protocol_methods_and_unknown_requests(self):
        self.assertEqual(server._dispatch({"id": 1, "method": "notifications/initialized"}), {})
        self.assertEqual(server._dispatch({"id": 2, "method": "initialize"})["id"], 2)
        self.assertIn("tools", server._dispatch({"id": 3, "method": "tools/list"})["result"])
        with patch.object(server, "_infer", return_value=("answer", "test")):
            result = server._dispatch(
                {
                    "id": 4,
                    "method": "tools/call",
                    "params": {"name": "architect_ai_chat", "arguments": {"message": "hi"}},
                }
            )
            self.assertEqual(result["result"]["content"][0]["text"], "answer")
        unknown = server._dispatch({"id": 5, "method": "unknown"})
        self.assertEqual(unknown["error"]["code"], -32601)


class SovereignModuleTests(unittest.TestCase):
    def test_storage_lifecycle_and_initialization(self):
        storage = SovereignStorage()
        self.assertIs(storage.init(), storage)
        storage.store("token", "secret")
        self.assertEqual(storage.retrieve("token"), "secret")
        self.assertEqual(storage.get_session_log()[0]["action"], "STORE")
        storage.purge_sensitive_data(["token", "missing"])
        self.assertIsNone(storage.retrieve("token"))

    def test_ivm_rejects_invalid_hash_and_returns_verified_payload(self):
        agent = IVMAgent()
        self.assertIsNone(agent.execute("not-a-hash"))
        payload = agent.execute("a" * 64)
        self.assertEqual(payload["verification_status"], "VERIFIED")
        self.assertEqual(len(payload["financial_records"]), 3)

    def test_export_manifest_is_deterministic_and_excludes_empty_identity(self):
        agent = ExportRecoveryAgent()
        self.assertIsNone(agent.execute(""))
        result = agent.execute("a" * 64)
        self.assertEqual(len(result["mnemonic_phrase"].split()), 12)
        self.assertEqual(result["manifest"]["target_hash"], "a" * 64)
        self.assertEqual(
            result["public_key"],
            agent._derive_public_key("a" * 64),
        )
        self.assertFalse(agent._is_limit_exceeded())


class TaskQueueTests(unittest.TestCase):
    def test_enqueue_dequeue_and_empty_queue(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            queue = TaskQueue(Path(tmpdir) / "queue.json")
            self.assertIsNone(queue.dequeue())
            first = queue.enqueue("first.md")
            second = queue.enqueue("second.md")
            self.assertEqual([first["id"], second["id"]], [1, 2])
            self.assertEqual(queue.dequeue()["source"], "first.md")
            self.assertEqual(queue.list()[0]["source"], "second.md")


class WorkflowRunnerTests(unittest.TestCase):
    def test_run_writes_manifest(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("agents.workflows.runner.OrchestratorAgent") as orchestrator:
                orchestrator.return_value.run.return_value = {
                    "status": "completed",
                    "agents": [{"name": "test", "status": "completed"}],
                }
                runner = WorkflowRunner(tmpdir)
                manifest = runner.run("plan.md")

                self.assertEqual(manifest["status"], "completed")
                self.assertTrue((Path(tmpdir) / "workflow_manifest.json").exists())

    def test_process_queue_records_success_and_failure(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            runner = WorkflowRunner(tmpdir)
            runner.queue.enqueue("good.md")
            runner.queue.enqueue("bad.md")
            with patch.object(runner, "run", side_effect=[
                {"status": "completed"},
                RuntimeError("broken"),
            ]):
                results = runner.process_queue()

            self.assertEqual(results[0]["status"], "completed")
            self.assertEqual(results[1]["status"], "failed")
            self.assertEqual(results[1]["error"], "broken")


class SovereignInferenceTests(unittest.TestCase):
    def test_ai_agent_scores_risk_and_uses_rule_based_fallback(self):
        agent = AIAgent()
        records = [
            {"amount": 50, "date": "2024-01-01"},
            {"amount": 75, "date": "2024-01-02"},
            {"amount": 15000, "date": "2022-01-01"},
        ]
        with patch.object(agent, "_get_llm_summary", return_value="fallback"):
            report = agent.execute(
                {
                    "identity_hash": "a" * 64,
                    "verification_status": "VERIFIED",
                    "account_tier": "STANDARD",
                    "financial_records": records,
                    "identity_history": [
                        {"event": "ADDRESS_CHANGE"},
                        {"event": "ADDRESS_CHANGE"},
                    ],
                }
            )

        self.assertEqual(report["risk_score"], 45)
        self.assertEqual(report["stability_index"], 0.7)
        self.assertEqual(report["llm_summary"], "fallback")
        self.assertIsNone(agent.execute(None))

    def test_lm_client_parses_models_chat_and_embeddings(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.__exit__.return_value = None
        with patch("sovereign.lm_studio_client.urllib.request.urlopen") as urlopen:
            response.__enter__.return_value.read.return_value = json.dumps(
                {"data": [{"id": "model-a"}]}
            ).encode()
            response.__enter__.return_value.__iter__.return_value = iter([])
            urlopen.return_value = response
            client = LMStudioClient(base_url="http://localhost:1234/v1")
            self.assertTrue(client.is_available())
            self.assertEqual(client.list_models(), ["model-a"])

            response.__enter__.return_value.read.return_value = json.dumps(
                {"choices": [{"message": {"content": " reply "}}]}
            ).encode()
            self.assertEqual(client.chat([{"role": "user", "content": "hi"}]), "reply")

            response.__enter__.return_value.read.return_value = json.dumps(
                {"data": [{"embedding": [0.1, 0.2]}]}
            ).encode()
            self.assertEqual(client.embed("hi"), [0.1, 0.2])

        with patch(
            "sovereign.lm_studio_client.urllib.request.urlopen",
            side_effect=OSError("offline"),
        ):
            self.assertFalse(client.is_available())
            self.assertEqual(client.list_models(), [])

    def test_pdf_agent_handles_empty_and_valid_reports(self):
        agent = PDFGenerationAgent()
        self.assertIsNone(agent.execute({}))
        pdf = agent.execute(
            {
                "identity_hash": "a" * 64,
                "verification_status": "VERIFIED",
                "risk_score": 0,
                "stability_index": 1.0,
                "composite_score": 100,
                "account_tier": "STANDARD",
                "llm_summary": "No issues.",
            }
        )
        self.assertIsInstance(pdf, bytes)
        self.assertTrue(pdf)


if __name__ == "__main__":
    unittest.main()
