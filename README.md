# Sovereign Digital Identity System

A Zero-Knowledge Identity Sovereign platform allowing users to build, verify, and control their digital identity across 16 specialized vectors.

## 🚀 Project Structure
- `/frontend`: React/Next.js frontend with Interactive Identity Vector Modules and Passkey Auth.
- `/backend`: Core logic for Architect AI and Verification Services.
- `/agents`: 16 Specialized Third Party Agents for encrypted data handoff.
- `/mcp-server`: Offline Knowledge Layer using `qwen3-vl:4b`.
- `/deploy`: Deployment scripts for GCP VM and Docker.

## 🔐 Security Architecture
- **Zero-Knowledge**: Data is encrypted at the agent level before reaching the backend.
- **Passkey-Gated**: Final reports are only released upon hardware-backed WebAuthn verification.
- **SHA256 Proof**: Every page features a real-time cryptographic heartbeat (ZK-PROOF) to verify session isolation.
- **Local-First**: Architect AI runs via a local MCP server to prevent cloud data leaks.

## 🧠 DAVIDIAN CORTEX
The standalone personal knowledge app for Israel David lives in [`davidian-cortex/`](davidian-cortex/README.md). Run it with `cd davidian-cortex && npm install && npm run dev`, or build the macOS app on a Mac with `npm run build:mac`.

## 🛠️ Quick Start
1. **Deploy MCP Server**: 
   ```bash
   cd deploy && bash deploy.sh
   ```
2. **Install Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   ```
3. **Verify System**:
   ```bash
   npx ts-node verification-test.ts
   ```
