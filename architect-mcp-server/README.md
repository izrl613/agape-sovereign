# Architect AI — MCP Server

Local MCP (Model Context Protocol) server that wraps **gemma4:e2b via Ollama** for the Agape Sovereign platform — both the PWA and the Android app (`com.agape.sovereign.ai`).  
Runs on `http://127.0.0.1:3001` — fully offline, no external API calls.

## Quick Start

```bash
# One command (handles Ollama + model + deps):
./start.sh

# Or manually:
ollama serve &          # terminal 1
npm install
npm run dev             # terminal 2 — listens on :3001
```

## Endpoints

### PWA (SSE/MCP)

| Endpoint | Purpose |
|---|---|
| `GET /health` | Server + Ollama liveness check |
| `GET /sse` | MCP SSE stream (connect here first) |
| `POST /message?sessionId=<id>` | MCP JSON-RPC messages |

### Android REST bridge

Plain HTTP POST endpoints — consumed by `ArchitectMcpClient.kt` via OkHttp.  
Android emulator reaches the host at `http://10.0.2.2:3001`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/android/health` | GET | Health + Ollama status |
| `/android/ask` | POST | General AI question `{ question, context? }` |
| `/android/analyze_vector` | POST | Identity vector analysis `{ vector_id, vector_name, raw_data, sovereign_score? }` |
| `/android/audit_recommendation` | POST | Audit finding fix `{ finding, severity, affected_vectors }` |

## MCP Tools

| Tool | Description |
|---|---|
| `ask` | General privacy/security question |
| `analyze_identity_vector` | Deep NUKED/KNOXED analysis of a V-01–V-16 vector |
| `generate_audit_recommendation` | DIFF report section generator |
| `explain_security_concept` | Plain-language concept explainer |
| `health_check` | End-to-end model ping |

## PWA Integration

The PWA client is at `frontend/lib/ArchitectMCPClient.ts`.

```typescript
import { ArchitectMCPClient } from '@/lib/ArchitectMCPClient';

// Health check (no SSE connection needed)
const status = await ArchitectMCPClient.checkHealth();

// Ask a question
const client = ArchitectMCPClient.getInstance();
const result = await client.ask("Is passkey safer than a password manager?");
console.log(result.text);

// Analyze a vector
const analysis = await client.analyzeVector({
  vectorId: 'V-07',
  vectorName: 'Password Vault Analysis',
  rawData: '14 weak passwords detected, 3 reused across sites',
  sovereignScore: 42,
});
```

## Offline Architecture

```
PWA (browser, localhost:5173 or installed PWA)
  └─► ArchitectMCPClient.ts  (SSE + POST JSON-RPC)
        └─► architect-mcp-server (:3001)   ← this package
              └─► Ollama (:11434) — gemma4:e2b (7.2 GB, local)

Android app (com.agape.sovereign.ai)
  └─► ArchitectMcpClient.kt  (OkHttp REST, /android/* endpoints)
        └─► architect-mcp-server (:3001, reached via 10.0.2.2 on emulator)
              └─► Ollama (:11434) — gemma4:e2b (runs on host)
```

The service worker (`frontend/public/sw.js`) passes all `127.0.0.1:3001` and `127.0.0.1:11434` traffic directly to the network — no caching interference.  
"Offline" means: offline from the internet. The local loop always works as long as Ollama + this server are running.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ARCHITECT_MCP_PORT` | `3001` | Port for this server |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama endpoint |
| `ARCHITECT_MODEL` | `gemma4:e2b` | Model to use |

## Cline / Antigravity IDE

Add to your Cline MCP config (`~/.cline/mcp_settings.json`):

```json
{
  "mcpServers": {
    "architect-ai": {
      "command": "node",
      "args": ["/Users/aarondavid/Documents/agape-sovereign/architect-mcp-server/dist/index.js"],
      "env": {
        "ARCHITECT_MCP_PORT": "3001"
      }
    }
  }
}
```

Or use SSE transport in Antigravity IDE pointing to `http://127.0.0.1:3001/sse`.
