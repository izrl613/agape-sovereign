# Agent System

> *Multi-agent orchestration, MCP server, and AI workflow automation*

agape.sovereign includes a sophisticated multi-agent system powered by the **Model Context Protocol (MCP)** and **Google Genkit**, enabling AI agents to orchestrate privacy scans, data pipeline operations, and report generation.

---

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Agent Orchestrator** | `agents/` | Multi-agent coordination |
| **Architect MCP Server** | `architect-mcp-server/` | MCP interface for Architect AI |
| **Core MCP Server** | `mcp_server/` | General-purpose MCP server |
| **Agent Skills** | `.agents/skills/` | Reusable agent skill library |
| **Agent Launcher** | `launch_agents.py` | Start agent processes |
| **Queue Agent** | `queue_agent.py` | Task queue management |
| **Orchestrator Runner** | `run_orchestrator.py` | Main orchestration loop |

---

## Agent Skills Library

The `.agents/skills/` directory contains a comprehensive library of Firebase-focused AI agent skills:

| Skill Category | Skills |
|---------------|--------|
| **Genkit** | `developing-genkit-dart`, `developing-genkit-go`, `developing-genkit-js`, `developing-genkit-python` |
| **Firebase** | `firebase-basics`, `firebase-auth-basics`, `firebase-ai-logic-basics`, `firebase-app-hosting-basics` |

Each skill includes a `SKILL.md` (usage guide) and `references/` (API documentation).

---

## MCP Server

The MCP (Model Context Protocol) server enables AI agents to interact with agape.sovereign services via standardized tool calls.

### Starting the MCP Server

```bash
# Core MCP server
cd mcp_server
python -m uvicorn main:app --host 0.0.0.0 --port 8080

# Architect MCP server
cd architect-mcp-server
npm start
```

### Available MCP Tools

The Architect MCP server exposes tools for:
- Initiating DIFF scans
- Querying scan results
- Generating PDF reports
- Managing user identity vectors
- Querying the audit log

---

## Multi-Agent Pipeline

```
User Request
     │
     ▼
┌─────────────────┐
│  Orchestrator   │  run_orchestrator.py
│  (coordinates)  │
└────────┬────────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌────────┐  ┌────────────┐
│ Queue  │  │  Architect  │
│ Agent  │  │  MCP Agent  │
└────────┘  └────────────┘
    │               │
    ▼               ▼
Task Queue    DIFF Scan Engine
    │               │
    └───────┬───────┘
            ▼
      Cloud Functions
      (Firebase backend)
```

---

## Firebase Agent Context

The agent system is deeply integrated with Firebase via the `.agents/AGENTS.md` context file, which provides:

- **Project Structure** — Firebase config, Firestore rules, Functions layout
- **Common Commands** — Deploy, emulate, debug
- **Emulator Setup** — Local development with Firebase Emulator Suite
  - Emulator UI: http://localhost:4000
  - Functions: http://localhost:5001
  - Firestore: http://localhost:8080
  - Hosting: http://localhost:5000

---

## Running Agents

```bash
# Launch all agents
python launch_agents.py

# Run the orchestrator
python run_orchestrator.py

# Run the data pipeline
python run_pipeline.py

# Queue-based agent
python queue_agent.py

# Execute the operation framework
python execute_operation_framework.py
```

---

## Sovereign Data Pipeline

The sovereign data pipeline (`run_pipeline.py`, `scripts/`) handles:
- Identity vector data ingestion
- Cross-source correlation
- Exposure classification (NUKED/KNOXED)
- Audit log population

See the [Sovereign Data Pipeline](../blob/main/Sovereign%20Data%20Pipeline%20Defined%20-%202026-07-15%2021.46.md) document for the full technical specification.

---

*See [[Architecture]] for the full system overview.*
