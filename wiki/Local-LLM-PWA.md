# Local LLM PWA

> *100% local, privacy-first AI chat — Zero cloud dependencies*

The **Local LLM PWA** is a Progressive Web App component of agape.sovereign that enables AI chat using locally-running language models via Ollama. No data leaves the device.

---

## Architecture

```
local-llm-pwa/
├── frontend/          # React + Vite + TypeScript PWA
│   └── src/
│       ├── components/    # ChatInterface, ModelManager, SettingsPanel
│       ├── context/       # Chat, Models, UI, Genkit Context providers
│       └── services/      # API service layer
├── backend/           # Node.js + Genkit + Express server
│   └── src/
│       ├── server.ts      # Express + WebSocket server
│       ├── genkit.ts      # Genkit config with Ollama plugin
│       └── flows.ts       # Chat, models, embeddings flows
└── vscode-extension/  # VS Code integration
    └── src/
        └── extension.ts   # Extension entry point
```

---

## Features

- **100% Local** — No data leaves your machine
- **Multiple Models** — Llama 3.2, Gemma 2, Phi 3.5, Qwen 2.5, Mistral, CodeLlama, and more
- **Streaming Chat** — Real-time token streaming with Markdown support
- **PWA Ready** — Installable, works offline, responsive
- **VS Code Extension** — Manage models and chat from the editor
- **Genkit Powered** — Google's Genkit framework for AI workflows
- **Model Management** — Download, delete, and manage models from UI

---

## Quick Start

### Prerequisites
- Node.js 20+
- [Ollama](https://ollama.com/download) installed

```bash
# Install all dependencies
npm run install:all

# Start Ollama (separate terminal)
ollama serve

# Pull a model
ollama pull llama3.2:3b

# Start dev servers
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

---

## Supported Models

| Model | Size | Best For |
|-------|------|----------|
| `llama3.2:3b` | 2.0 GB | General chat, reasoning |
| `llama3.2:1b` | 1.3 GB | Fast responses, low RAM |
| `gemma2:2b` | 1.6 GB | Efficient, multilingual |
| `gemma2:9b` | 5.5 GB | Higher quality |
| `phi3.5:3.8b` | 2.3 GB | Microsoft SLM |
| `qwen2.5:3b` | 2.0 GB | Multilingual, coding |
| `mistral:7b` | 4.1 GB | High quality general |
| `codellama:7b` | 3.8 GB | Code generation |
| `deepseek-coder:6.7b` | 3.8 GB | Code specialized |
| `nomic-embed-text` | 274 MB | Embeddings / RAG |

---

## VS Code Extension

The bundled VS Code extension provides:

- **Activity Bar Panel** — Chat, models, and backend status
- **Commands** — Start/stop backend, pull models, refresh model list
- **Keybindings** — `Ctrl+Alt+L` open chat, `Ctrl+Alt+B` start backend
- **Settings** — Configure Ollama URL, backend port, default model

### Install from Source
```bash
cd vscode-extension
npm install && npm run compile
# Press F5 in VS Code to launch extension host
```

---

## Environment Variables

```env
# Backend
PORT=3000
OLLAMA_HOST=http://localhost:11434

# Frontend
VITE_API_URL=http://localhost:3000
VITE_OLLAMA_URL=http://localhost:11434
```

---

## Docker

```bash
docker build -t local-llm-pwa .
docker run -p 3000:3000 -p 5173:5173 local-llm-pwa
```

---

## Privacy Properties

- No telemetry or analytics
- No external network requests (only local Ollama)
- Chat history in browser IndexedDB only
- CORS restricted to localhost origins

---

*Part of the agape.sovereign privacy stack. See [[Architecture]] for system overview.*
