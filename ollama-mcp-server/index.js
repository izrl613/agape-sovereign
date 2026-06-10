import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

// ─────────────────────────────────────────────────────────────────────────────
// Gemma 4 E4B — Offline Privacy MCP Server
// Serves as the EXCLUSIVE AI backend for Agape Sovereign Enclave.
// No external APIs. All inference stays on-device or Cloud Run.
// ─────────────────────────────────────────────────────────────────────────────

const MLX_URL = process.env.MLX_SERVER_URL || "http://localhost:8080/v1/chat/completions";
const MODEL_NAME = process.env.MLX_MODEL_NAME || "gemma4:e4b";

const server = new Server(
  { name: "gemma4-e4b-sovereign-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

// ── Privacy-focused system prompt ──────────────────────────────────────────
const PRIVACY_SYSTEM_PROMPT = `You are a sovereign privacy and security analyst powered by Gemma 4 E4B.
You run entirely offline — no data is ever transmitted to external servers.
Your analysis covers: data breach risks, GDPR/CCPA compliance, identity exposure, 
threat modeling, zero-trust architecture, passkey security, and digital sovereignty.
Be specific, actionable, and reference privacy laws when relevant.
Flag high-risk items with severity: [CRITICAL] [HIGH] [MEDIUM] [LOW].
Always recommend open-source, privacy-preserving alternatives.`;

// ─────────────────────────────────────────────────────────────────────────────
// Tool definitions
// ─────────────────────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_text",
      description: "Generate text using Gemma 4 E4B offline model. General purpose inference.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "The prompt or question to send to the model." },
          system: { type: "string", description: "Optional system instruction." }
        },
        required: ["prompt"],
      },
    },
    {
      name: "query_security_privacy",
      description: "Parse user data and answer security/privacy questions using Gemma 4 E4B. All processing is offline — no data leaves the device. Ideal for GDPR analysis, breach assessment, threat modeling, and digital sovereignty audits.",
      inputSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The user's security or privacy question."
          },
          context_data: {
            type: "string",
            description: "Optional context: user data, scan results, or background information to analyze. Processed locally only."
          },
          severity_filter: {
            type: "string",
            enum: ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"],
            description: "Filter results by minimum severity level. Defaults to ALL."
          }
        },
        required: ["question"],
      },
    },
    {
      name: "analyze_data_exposure",
      description: "Analyze a dataset for privacy exposure risks. Returns structured findings with severity ratings and remediation steps.",
      inputSchema: {
        type: "object",
        properties: {
          data_description: {
            type: "string",
            description: "Description of the data or dataset to analyze for exposure risks."
          },
          data_categories: {
            type: "array",
            items: { type: "string" },
            description: "Categories of data present: e.g. ['email', 'location', 'biometric', 'financial']"
          }
        },
        required: ["data_description"],
      },
    },
  ],
}));

// ─────────────────────────────────────────────────────────────────────────────
// Tool execution handler
// ─────────────────────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const callMLX = async (messages) => {
    const response = await fetch(MLX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL_NAME, messages, stream: false }),
    });
    if (!response.ok) throw new Error(`MLX API error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  };

  try {
    if (name === "generate_text") {
      const messages = [];
      if (args.system) messages.push({ role: "system", content: args.system });
      messages.push({ role: "user", content: args.prompt });
      const reply = await callMLX(messages);
      return { content: [{ type: "text", text: reply }] };
    }

    if (name === "query_security_privacy") {
      const userContent = args.context_data
        ? `Context (local data — not transmitted):\n${args.context_data}\n\nQuestion: ${args.question}`
        : args.question;

      let systemPrompt = PRIVACY_SYSTEM_PROMPT;
      if (args.severity_filter && args.severity_filter !== "ALL") {
        systemPrompt += `\n\nOnly report findings at severity level [${args.severity_filter}] or higher.`;
      }

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ];
      const reply = await callMLX(messages);
      return { content: [{ type: "text", text: reply }] };
    }

    if (name === "analyze_data_exposure") {
      const categories = args.data_categories?.join(", ") || "unspecified";
      const prompt = `Perform a comprehensive privacy exposure analysis for the following data:

Description: ${args.data_description}
Data Categories Present: ${categories}

Provide:
1. Exposure Risk Score (0-100)
2. Identified risks by category with severity ratings
3. Regulatory compliance gaps (GDPR, CCPA, HIPAA if relevant)
4. Specific remediation steps for each risk
5. Recommended privacy-preserving alternatives

Format each finding as:
[SEVERITY] Finding: <description>
Risk: <explanation>
Action: <remediation step>`;

      const messages = [
        { role: "system", content: PRIVACY_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ];
      const reply = await callMLX(messages);
      return { content: [{ type: "text", text: reply }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `⚠️ Gemma 4 E4B offline — ${error.message}\n\nYour sovereign enclave continues protecting your data locally. No information has been transmitted externally.`
      }],
      isError: true,
    };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Express REST API + MCP SSE endpoints
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());

let transport;

// Status page
app.get("/", (_req, res) => {
  res.send(`
    <html>
      <head><title>Gemma 4 E4B — Sovereign MCP</title></head>
      <body style="background:#060D1F;color:#00D4FF;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;max-width:500px;">
          <div style="font-size:3rem;margin-bottom:16px;">🛡️</div>
          <h2 style="margin:0 0 8px;letter-spacing:0.1em;">GEMMA 4 E4B — OFFLINE MCP SERVER</h2>
          <p style="color:#FF2E9F;font-size:0.8rem;letter-spacing:0.2em;margin-bottom:24px;">AGAPE SOVEREIGN ENCLAVE · ZERO EXTERNAL BILLING</p>
          <div style="text-align:left;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:8px;padding:16px;">
            <p style="margin:0 0 8px;color:#7B9BB5;font-size:0.75rem;">AVAILABLE ENDPOINTS</p>
            <ul style="list-style:none;padding:0;margin:0;color:#E8F4FF;font-size:0.85rem;line-height:2;">
              <li>GET  /api/status</li>
              <li>POST /api/chat</li>
              <li>POST /mcp/tool</li>
              <li>GET  /sse</li>
              <li>POST /message</li>
            </ul>
          </div>
          <p style="color:#7B9BB5;font-size:0.7rem;margin-top:16px;">All data processed locally · No external API calls</p>
        </div>
      </body>
    </html>
  `);
});

// Health / status probe
app.get("/api/status", (_req, res) => {
  res.json({
    online: true,
    port: PORT,
    modelName: "Gemma 4 E4B (Offline MCP)",
    usage: "Unlimited Tokens · Sovereign Mode",
    costModel: "Zero External Billing",
    version: "2.0.0",
    tools: ["generate_text", "query_security_privacy", "analyze_data_exposure"]
  });
});

// OpenAI-compatible chat passthrough
app.post("/api/chat", express.json(), async (req, res) => {
  try {
    const { messages, max_tokens, stream } = req.body;
    const response = await fetch(MLX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages || [],
        max_tokens: max_tokens ?? -1,
        stream: stream ?? false,
      }),
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `MLX API error: ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({
      error: `Gemma4 backend unreachable: ${error.message}`,
      choices: [{
        message: {
          content: "⚠️ Gemma 4 E4B is offline. Your sovereign enclave continues operating. No data has left your device."
        }
      }]
    });
  }
});

// Direct MCP tool invocation via REST
app.post("/mcp/tool", express.json(), async (req, res) => {
  const { tool, arguments: args } = req.body;
  if (!tool || !args) {
    return res.status(400).json({ error: "Missing tool name or arguments" });
  }
  // Proxy through the MCP server handler by simulating the request
  try {
    const fakeRequest = { params: { name: tool, arguments: args } };
    const result = await server._requestHandlers?.get?.("tools/call")?.(fakeRequest);
    res.json({ result: result?.content?.[0]?.text || "No result" });
  } catch (err) {
    // Fallback: call MLX directly
    try {
      const messages = [
        { role: "system", content: PRIVACY_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(args) }
      ];
      const response = await fetch(MLX_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL_NAME, messages, stream: false }),
      });
      const data = await response.json();
      res.json({ result: data.choices?.[0]?.message?.content || "No result" });
    } catch (e) {
      res.status(502).json({ error: `Tool execution failed: ${e.message}`, offline: true });
    }
  }
});

// MCP SSE Protocol
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", express.json(), async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(500).send("Transport not initialized");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🛡️  Gemma 4 E4B Sovereign MCP Server → http://localhost:${PORT}`);
  console.log(`   Tools: generate_text, query_security_privacy, analyze_data_exposure`);
  console.log(`   REST:  /api/status  /api/chat  /mcp/tool`);
  console.log(`   MCP:   /sse  /message`);
  console.log(`   Model: ${MODEL_NAME} @ ${MLX_URL}`);
});
