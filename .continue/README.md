# Continue Workspace Config

This workspace is configured to use local Ollama models in Antigravity IDE.

Primary model:

- `Gemma 4 E4B Ollama` -> `gemma4:e4b`

Autocomplete model:

- `Qwen Coder 1.5B Local` -> `qwen2.5-coder:1.5b-base`

Embeddings:

- `nomic-embed-text:latest`

Ollama must be running at:

```text
http://127.0.0.1:11434
```

The same config is saved in both places for compatibility:

- `.continue/agents/new-config.yaml`
- `.continue/config.yaml`

The config also includes guardrails telling Continue not to scan heavy folders
such as `node_modules`, `.git`, `dist`, `build`, `coverage`, and caches unless
explicitly requested.
