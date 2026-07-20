# Local LLM PWA

> **Open-source Progressive Web App for running local LLMs with VS Code integration - Zero cloud dependencies**

A complete, privacy-first AI chat application that runs entirely on your machine. Chat with local models via Ollama, manage models, and integrate seamlessly with VS Code.

## 🌟 Features

- **🔒 100% Local** - No data leaves your machine, no cloud APIs required
- **🤖 Multiple Models** - Support for Llama 3.2, Gemma 2, Phi 3.5, Qwen 2.5, Mistral, CodeLlama, and more
- **💬 Streaming Chat** - Real-time token streaming with markdown support
- **📱 PWA Ready** - Installable, works offline, responsive design
- **🔧 VS Code Extension** - Manage models and chat from your editor
- **⚡ Genkit Powered** - Built on Google's Genkit framework for robust AI workflows
- **🎨 Modern UI** - Dark/light themes, responsive layout, accessible
- **📦 Model Management** - Download, delete, and manage models from UI

## 🏗️ Architecture

```
local-llm-pwa/
├── frontend/          # React + Vite + TypeScript PWA
│   ├── src/
│   │   ├── components/    # ChatInterface, ModelManager, SettingsPanel
│   │   ├── context/       # React Context providers (Chat, Models, UI, Genkit)
│   │   ├── services/      # API service layer
│   │   └── main.tsx       # Entry point
│   └── public/            # PWA manifest, icons, service worker
├── backend/           # Node.js + Genkit + Express server
│   ├── src/
│   │   ├── server.ts      # Express + WebSocket server
│   │   ├── genkit.ts      # Genkit configuration with Ollama plugin
│   │   └── flows.ts       # Genkit flows (chat, models, embeddings)
│   └── dist/              # Compiled output
├── vscode-extension/  # VS Code extension
│   ├── src/
│   │   └── extension.ts   # Extension entry point
│   └── package.json
└── package.json       # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js 20+** - [Download](https://nodejs.org/)
2. **Ollama** - [Install](https://ollama.com/download)
3. **VS Code** (optional) - For extension support

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/local-llm-pwa.git
cd local-llm-pwa

# Install all dependencies
npm run install:all

# Start Ollama (in separate terminal)
ollama serve

# Pull a model (in separate terminal)
ollama pull llama3.2:3b

# Start development servers
npm run dev
```

This starts:
- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3000`

### Production Build

```bash
# Build all packages
npm run build

# Start production server
npm run start
```

## 📦 VS Code Extension

### Install from Source

```bash
cd vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch extension development host
```

### Features

- **Activity Bar Panel** - Access chat, models, and backend status
- **Commands** - Start/stop backend, pull models, refresh list
- **Keybindings** - `Ctrl+Alt+L` to open chat, `Ctrl+Alt+B` to start backend
- **Settings** - Configure Ollama URL, backend port, default model

## 🛠️ Development

### Project Structure

```
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── local-llm-pwa/        # Main project (this directory)
```

### Available Scripts

```bash
# Root level
npm run dev              # Start frontend + backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run test             # Run tests

# Frontend
cd frontend
npm run dev              # Vite dev server
npm run build            # Production build
npm run preview          # Preview build

# Backend
cd backend
npm run dev              # TSX watch mode
npm run build            # TypeScript compile
npm run start            # Run compiled JS
npm run genkit:dev       # Genkit dev UI

# VS Code Extension
cd vscode-extension
npm run compile          # Compile TypeScript
npm run watch            # Watch mode
```

## 🔧 Configuration

### Environment Variables

Create `.env` from `.env.example`:

```env
# Backend
PORT=3000
OLLAMA_HOST=http://localhost:11434

# Frontend
VITE_API_URL=http://localhost:3000
VITE_OLLAMA_URL=http://localhost:11434
```

### Supported Models

| Model | Size | Best For |
|-------|------|----------|
| `llama3.2:3b` | 2.0 GB | General chat, reasoning |
| `llama3.2:1b` | 1.3 GB | Fast responses, low RAM |
| `gemma2:2b` | 1.6 GB | Efficient, multilingual |
| `gemma2:9b` | 5.5 GB | Higher quality |
| `phi3.5:3.8b` | 2.3 GB | Microsoft SLM |
| `qwen2.5:3b` | 2.0 GB | Multilingual, coding |
| `mistral:7b` | 4.1 GB | High quality |
| `codellama:7b` | 3.8 GB | Code generation |
| `deepseek-coder:6.7b` | 3.8 GB | Code specialized |
| `nomic-embed-text` | 274 MB | Embeddings/RAG |

## 🐳 Docker Support

```dockerfile
# Dockerfile (included)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --workspaces --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000 5173
CMD ["npm", "run", "start"]
```

```bash
# Build and run
docker build -t local-llm-pwa .
docker run -p 3000:3000 -p 5173:5173 local-llm-pwa
```

## 🔐 Privacy & Security

- **No telemetry** - Zero tracking or analytics
- **No external requests** - Only communicates with local Ollama
- **Local storage** - Chat history stored in browser IndexedDB
- **HTTPS ready** - Works with localhost TLS for secure contexts
- **CORS configured** - Restricted to local origins only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - Free for personal and commercial use.

## 🙏 Acknowledgments

- [Ollama](https://ollama.com/) - Local LLM runtime
- [Genkit](https://firebase.google.com/docs/genkit) - AI workflow framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React](https://react.dev/) - UI framework

---

**Built with ❤️ for privacy-conscious developers**