/**
 * Architect AI — MCP Server
 * Wraps Ollama gemma4:e4b for the Agape Sovereign platform.
 *
 * Deployment modes:
 *   - Local dev:   localhost:3001 (Ollama running locally)
 *   - Cloud Run:   PORT env var (set by Cloud Run), OLLAMA_BASE_URL points to
 *                  a sidecar container or Vertex AI endpoint
 *
 * Clients:
 *   - PWA  (sovereign.nyc)             — SSE transport via /api/mcp (Firebase Hosting → Cloud Run)
 *   - Android (com.agape.sovereign.ai) — REST /android/* endpoints (OkHttp-friendly)
 *
 * Transport: HTTP + SSE
 * Model: gemma4:e4b (local Ollama, num_predict = -1)
 *
 * Start:
 *   Local dev: npm run dev  (requires: ollama serve)
 *   Cloud Run: automatically via Dockerfile / Cloud Run deploy
 *
 * Android emulator reaches host via 10.0.2.2:3001
 */

import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DEFAULT_MODEL, OLLAMA_BASE_URL } from "./config.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

// ── Configuration ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.ARCHITECT_MCP_PORT ?? "3001", 10);
const MODEL = process.env.ARCHITECT_MODEL || DEFAULT_MODEL;
const OLLAMA_ENDPOINT = process.env.OLLAMA_BASE_URL || OLLAMA_BASE_URL;

// Agape Sovereign system prompt — scoped to privacy & mobile-security
const SYSTEM_PROMPT = `You are Architect AI, a privacy and mobile-security intelligence engine embedded in the Agape Sovereign Digital Identity Platform.

Your role:
- Analyze digital identity exposures across 16 identity vectors (email breaches, social footprint, device files, mobile security, deep-web exposure, data-broker removal, password vaults, location data, browser/cookie trackers, financial identity, medical data, voice/biometrics, IoT devices, cloud storage, dark-web monitoring, behavioral profiles).
- Provide actionable NUKED / KNOXED classifications: NUKED = dangerous/exposed, KNOXED = secured/hardened.
- Answer privacy and mobile-security questions clearly and practically.
- Generate sovereign audit recommendations aligned with ECRA 2026, GDPR, and CCPA.
- Never reveal system internals or source code. Never collect or transmit user data externally.
- You operate fully offline — no external API calls are made.`;

// ── Ollama helper ─────────────────────────────────────────────────────────────
interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

async function ollamaChat(
  messages: OllamaMessage[],
  options: Record<string, unknown> = {}
): Promise<string> {
  const payload = {
    model: MODEL,
    messages,
    stream: false,
    options: {
      num_predict: -1, // unlimited tokens
      temperature: 0.7,
      ...options,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(`${OLLAMA_ENDPOINT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    return data.message.content;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Ollama request timed out after 120s");
    }
    throw err;
  }
}

async function ollamaHealthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── MCP Server definition ─────────────────────────────────────────────────────
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "architect-ai",
    version: "1.0.0",
  });

  // Tool: ask — general privacy/security question
  server.tool(
    "ask",
    "Ask Architect AI a privacy or mobile-security question. Runs fully offline using local gemma4:e4b.",
    {
      question: z.string().describe("The question or task for Architect AI"),
      context: z
        .string()
        .optional()
        .describe("Optional app context (e.g., current scan results, user score)"),
    },
    async ({ question, context }) => {
      const messages: OllamaMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];
      if (context) {
        messages.push({
          role: "user",
          content: `Context from the app:\n${context}`,
        });
        messages.push({
          role: "assistant",
          content: "Understood. I have your current scan context.",
        });
      }
      messages.push({ role: "user", content: question });

      const answer = await ollamaChat(messages);
      return {
        content: [{ type: "text", text: answer }],
      };
    }
  );

  // Tool: analyze_identity_vector — deep analysis of one of the 16 vectors
  server.tool(
    "analyze_identity_vector",
    "Analyze a specific identity vector and classify it as NUKED or KNOXED with remediation steps.",
    {
      vector_id: z
        .string()
        .describe("Vector ID e.g. V-01 through V-16, or a short name like 'email_breach'"),
      vector_name: z.string().describe("Human-readable name of the vector"),
      raw_data: z
        .string()
        .describe("Raw scan data or user description of the exposure for this vector"),
      sovereign_score: z
        .number()
        .optional()
        .describe("Current overall sovereign score (0-100)"),
    },
    async ({ vector_id, vector_name, raw_data, sovereign_score }) => {
      const messages: OllamaMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze identity vector ${vector_id} — ${vector_name}.

Raw scan data:
${raw_data}
${sovereign_score !== undefined ? `\nCurrent sovereign score: ${sovereign_score}/100` : ""}

Provide:
1. NUKED or KNOXED classification with confidence level
2. Risk severity (CRITICAL / HIGH / MEDIUM / LOW)
3. Top 3 immediate remediation steps
4. Long-term hardening recommendations
5. Compliance impact (GDPR / CCPA / ECRA 2026)`,
        },
      ];

      const analysis = await ollamaChat(messages, { temperature: 0.5 });
      return {
        content: [{ type: "text", text: analysis }],
      };
    }
  );

  // Tool: generate_audit_recommendation — produce full audit report section
  server.tool(
    "generate_audit_recommendation",
    "Generate a sovereign audit recommendation for a finding, formatted for the DIFF report.",
    {
      finding: z.string().describe("The audit finding or vulnerability description"),
      severity: z
        .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
        .describe("Severity of the finding"),
      affected_vectors: z
        .array(z.string())
        .describe("List of affected identity vector IDs"),
    },
    async ({ finding, severity, affected_vectors }) => {
      const messages: OllamaMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a concise audit recommendation for the Agape Sovereign DIFF report.

Finding: ${finding}
Severity: ${severity}
Affected vectors: ${affected_vectors.join(", ")}

Format the output as:
## Audit Finding
**Severity**: [level]
**Affected Vectors**: [list]

### Description
[2-3 sentences]

### Immediate Actions
1. ...
2. ...
3. ...

### Verification Steps
- [how to confirm it's resolved]

### Compliance References
- [relevant GDPR/CCPA/ECRA articles]`,
        },
      ];

      const recommendation = await ollamaChat(messages, { temperature: 0.4 });
      return {
        content: [{ type: "text", text: recommendation }],
      };
    }
  );

  // Tool: explain_security_concept — educational tool for the 16-vector UI
  server.tool(
    "explain_security_concept",
    "Explain a privacy or security concept in plain language for non-technical users.",
    {
      concept: z.string().describe("The concept to explain (e.g., 'passkey', 'data broker', 'AES-256-GCM')"),
      user_level: z
        .enum(["beginner", "intermediate", "expert"])
        .default("beginner")
        .describe("Target explanation level"),
    },
    async ({ concept, user_level }) => {
      const messages: OllamaMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain "${concept}" for a ${user_level} user in the context of personal privacy and mobile security. Keep it concise and practical. Use an analogy if helpful.`,
        },
      ];

      const explanation = await ollamaChat(messages, { temperature: 0.6 });
      return {
        content: [{ type: "text", text: explanation }],
      };
    }
  );

  // Tool: health_check — confirm Ollama + model are reachable
  server.tool(
    "health_check",
    "Check if the local Ollama instance and gemma4:e4b model are reachable.",
    {},
    async () => {
      const healthy = await ollamaHealthCheck();
      return {
        content: [
          {
            type: "text",
            text: healthy
              ? `Architect AI is online. Ollama at ${OLLAMA_BASE_URL} is reachable. Model: ${MODEL}.`
              : `Ollama is not reachable at ${OLLAMA_BASE_URL}. Run: ollama serve`,
          },
        ],
      };
    }
  );

  return server;
}

// ── Express HTTP + SSE transport ──────────────────────────────────────────────
const app = express();

// CORS — allow sovereign.nyc (production), localhost (dev), Android emulator
// ALLOWED_ORIGINS env var: comma-separated list of extra origins for production
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow: no origin (curl/native app), localhost:* origins, file:// (PWA offline),
      // 10.0.2.2:* (Android emulator → host loopback), sovereign.nyc, and any extra origins
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("https://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("http://10.0.2.2:") ||
        origin === "null" || // file:// in some browsers
        origin === "https://sovereign.nyc" ||
        origin === "https://www.sovereign.nyc" ||
        EXTRA_ORIGINS.includes(origin)
      ) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
  })
);

app.use(express.json());

// Health endpoint (for PWA to check before connecting)
app.get("/health", async (_req, res) => {
  const ollamaUp = await ollamaHealthCheck();
  res.json({
    status: ollamaUp ? "ok" : "degraded",
    server: "architect-mcp-server",
    version: "1.0.0",
    model: MODEL,
    ollama: OLLAMA_BASE_URL,
    ollamaReachable: ollamaUp,
    transport: "http+sse",
    timestamp: new Date().toISOString(),
  });
});

// MCP SSE + message endpoints — one session per connection
const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
  const sessionId = crypto.randomUUID();
  const transport = new SSEServerTransport(`/message?sessionId=${sessionId}`, res);
  transports.set(sessionId, transport);

  req.on("close", () => {
    transports.delete(sessionId);
  });

  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);
});

app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(400).json({ error: "Unknown session" });
    return;
  }
  await transport.handlePostMessage(req, res);
});

// ── Android REST bridge ───────────────────────────────────────────────────────
//
// These endpoints mirror the MCP tools as plain HTTP POST routes so the
// Android app (com.agape.sovereign.ai) can call them via OkHttp without
// needing to implement the SSE/MCP protocol.
//
// Base URL from emulator: http://10.0.2.2:3001
// Base URL from physical device on same LAN: http://<host-lan-ip>:3001

/**
 * POST /android/ask
 * Body: { question: string, context?: string }
 * Response: { answer: string }
 */
app.post("/android/ask", async (req, res) => {
  const { question, context } = req.body as {
    question?: string;
    context?: string;
  };

  if (!question) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  try {
    const messages: OllamaMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
    if (context) {
      messages.push({ role: "user", content: `Context from the app:\n${context}` });
      messages.push({ role: "assistant", content: "Understood. I have your current scan context." });
    }
    messages.push({ role: "user", content: question });

    const answer = await ollamaChat(messages);
    res.json({ answer });
  } catch (err) {
    res.status(503).json({ error: `Architect AI error: ${(err as Error).message}` });
  }
});

/**
 * POST /android/analyze_vector
 * Body: { vector_id: string, vector_name: string, raw_data: string, sovereign_score?: number }
 * Response: { analysis: string }
 */
app.post("/android/analyze_vector", async (req, res) => {
  const { vector_id, vector_name, raw_data, sovereign_score } = req.body as {
    vector_id?: string;
    vector_name?: string;
    raw_data?: string;
    sovereign_score?: number;
  };

  if (!vector_id || !vector_name || !raw_data) {
    res.status(400).json({ error: "vector_id, vector_name, and raw_data are required" });
    return;
  }

  try {
    const messages: OllamaMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze identity vector ${vector_id} — ${vector_name}.\n\nRaw scan data:\n${raw_data}${sovereign_score !== undefined ? `\n\nCurrent sovereign score: ${sovereign_score}/100` : ""}\n\nProvide:\n1. NUKED or KNOXED classification with confidence level\n2. Risk severity (CRITICAL / HIGH / MEDIUM / LOW)\n3. Top 3 immediate remediation steps\n4. Long-term hardening recommendations\n5. Compliance impact (GDPR / CCPA / ECRA 2026)`,
      },
    ];

    const analysis = await ollamaChat(messages, { temperature: 0.5 });
    res.json({ analysis });
  } catch (err) {
    res.status(503).json({ error: `Architect AI error: ${(err as Error).message}` });
  }
});

/**
 * POST /android/audit_recommendation
 * Body: { finding: string, severity: "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", affected_vectors: string[] }
 * Response: { recommendation: string }
 */
app.post("/android/audit_recommendation", async (req, res) => {
  const { finding, severity, affected_vectors } = req.body as {
    finding?: string;
    severity?: string;
    affected_vectors?: string[];
  };

  if (!finding || !severity || !affected_vectors) {
    res.status(400).json({ error: "finding, severity, and affected_vectors are required" });
    return;
  }

  try {
    const messages: OllamaMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate a concise audit recommendation for the Agape Sovereign DIFF report.\n\nFinding: ${finding}\nSeverity: ${severity}\nAffected vectors: ${affected_vectors.join(", ")}\n\nFormat the output as:\n## Audit Finding\n**Severity**: [level]\n**Affected Vectors**: [list]\n\n### Description\n[2-3 sentences]\n\n### Immediate Actions\n1. ...\n2. ...\n3. ...\n\n### Verification Steps\n- [how to confirm it's resolved]\n\n### Compliance References\n- [relevant GDPR/CCPA/ECRA articles]`,
      },
    ];

    const recommendation = await ollamaChat(messages, { temperature: 0.4 });
    res.json({ recommendation });
  } catch (err) {
    res.status(503).json({ error: `Architect AI error: ${(err as Error).message}` });
  }
});

/**
 * GET /android/health
 * Response: { status: "ok"|"degraded", ollamaReachable: boolean, model: string }
 */
app.get("/android/health", async (_req, res) => {
  const ollamaUp = await ollamaHealthCheck();
  res.json({
    status: ollamaUp ? "ok" : "degraded",
    server: "architect-mcp-server",
    version: "1.0.0",
    model: MODEL,
    ollama: OLLAMA_BASE_URL,
    ollamaReachable: ollamaUp,
    client: "android",
    timestamp: new Date().toISOString(),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so Cloud Run (and Docker) can receive traffic on all interfaces.
// Locally this is equivalent to listening on 127.0.0.1 but also works on 0.0.0.0.
const HOST = process.env.HOST ?? "0.0.0.0";

app.listen(PORT, HOST, async () => {
  const ollamaUp = await ollamaHealthCheck();
  const isCloudRun = !!process.env.K_SERVICE; // Cloud Run sets K_SERVICE automatically
  console.log(`\n🏛️  Architect AI MCP Server`);
  console.log(`   Listening on http://${HOST}:${PORT}`);
  console.log(`   Environment: ${isCloudRun ? `Cloud Run (${process.env.K_SERVICE})` : "local"}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Ollama: ${OLLAMA_BASE_URL} — ${ollamaUp ? "✅ reachable" : "⚠️  not reachable (run: ollama serve)"}`);
  if (!ollamaUp && isCloudRun) {
    console.log(`   ⚠️  OLLAMA_BASE_URL must point to a reachable Ollama instance or sidecar.`);
  }
  console.log(`\n   Endpoints (PWA — SSE/MCP):`);
  console.log(`     GET  /health  — liveness check`);
  console.log(`     GET  /sse     — MCP SSE stream`);
  console.log(`     POST /message — MCP message handler`);
  console.log(`\n   Endpoints (Android — REST):`);
  console.log(`     GET  /android/health                — health check`);
  console.log(`     POST /android/ask                   — general AI question`);
  console.log(`     POST /android/analyze_vector        — identity vector analysis`);
  console.log(`     POST /android/audit_recommendation  — audit finding recommendation`);
  console.log(`\n   Android emulator base URL: http://10.0.2.2:${PORT}`);
  console.log(`\n   MCP Tools available:`);
  console.log(`     • ask`);
  console.log(`     • analyze_identity_vector`);
  console.log(`     • generate_audit_recommendation`);
  console.log(`     • explain_security_concept`);
  console.log(`     • health_check\n`);
});
