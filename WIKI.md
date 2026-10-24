# Sovereign Digital Identity Wiki

## 🌐 Project Vision
Sovereign.nyc is a zero-knowledge platform enabling individuals to reclaim and verify their digital identity across 16 distinct vectors.

## 🛠️ Architecture
- **Frontend**: React/Next.js with a Dynamic Identity Dashboard.
- **Auth**: Triple-path authentication (Passkey, Google, ANON).
- **AI Brain**: Architect AI (Offline Gemma 4 / Qwen3-VL via MCP Server).
- **Security**: AES-256 encryption, SHA256 session proofs, and hardware-backed Passkeys.

## 🧬 The 16 Identity Vectors
Each vector is processed by a Third Party Agent (TPA) and verified via specialized APIs (Plaid, Onfido, etc.) before aggregation.

## 🛡️ Security Protocols
- **Zero-Knowledge**: Data is encrypted at the agent level; the backend only sees encrypted blobs.
- **Local-First**: AI inference happens locally via MCP server to avoid cloud data leaks.
- **Passkey Gated**: Final report generation requires a physical hardware handshake.

## 🚀 Deployment
Detailed in `deploy-mcp.sh`. Run on a GCP VM with Ollama installed.
