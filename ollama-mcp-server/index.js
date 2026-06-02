import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

const server = new Server(
  {
    name: "ollama-mcp-server-online",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List the tools available
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_text_mlx",
        description: "Generate text using the local MLX server with GRMMA4:E4B model. Provide a prompt to get a response.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt or question to ask the model.",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

// Handle the tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "generate_text_mlx") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const prompt = request.params.arguments?.prompt;
  if (!prompt || typeof prompt !== "string") {
    throw new Error("A valid string prompt is required.");
  }

  try {
    // URL can be configured via environment variable if running online
    const mlxUrl = process.env.MLX_SERVER_URL || "http://localhost:8080/v1/chat/completions";
    const response = await fetch(mlxUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "GRMMA4:E4B",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`MLX API error! status: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "No response generated.";

    return {
      content: [
        {
          type: "text",
          text: reply,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error calling MLX API: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

const app = express();
app.use(cors());

let transport;

// ── REST API endpoints for Architect AI frontend ──────────────────────────

// Root endpoint for browser verification
app.get("/", (_req, res) => {
  res.send(`
    <html>
      <body style="background: #060D1F; color: #00D4FF; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <h2>🚀 Gemma 4 E4B MCP Server is ONLINE</h2>
          <p>Endpoints available:</p>
          <ul style="list-style-type: none; padding: 0; color: #94a3b8;">
            <li>GET /api/status</li>
            <li>POST /api/chat</li>
            <li>GET /sse</li>
            <li>POST /message</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Health / status probe — matches the interface localAIService expects
app.get("/api/status", (_req, res) => {
  res.json({
    online: true,
    port: PORT,
    modelName: "Gemma-4-E4B-MLX (Cloud Run)",
    usage: "Unlimited Tokens",
    costModel: "Zero External Billing"
  });
});

// Direct chat completion — OpenAI-compatible passthrough
// Architect AI's localAIService POSTs here with { messages, max_tokens, stream }
app.post("/api/chat", express.json(), async (req, res) => {
  try {
    const mlxUrl = process.env.MLX_SERVER_URL || "http://localhost:8080/v1/chat/completions";
    const { messages, max_tokens, stream } = req.body;

    const response = await fetch(mlxUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.MLX_MODEL_NAME || "GRMMA4:E4B",
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
      error: `MLX backend unreachable: ${error.message}`,
      choices: [{ message: { content: "⚠️ Gemma model backend is currently unreachable. Please verify MLX_SERVER_URL is configured correctly on Cloud Run." } }]
    });
  }
});

// ── MCP SSE Protocol endpoints ────────────────────────────────────────────

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
  console.log(`Gemma4 MCP Server running at http://localhost:${PORT}`);
  console.log(`  REST API:  /api/status, /api/chat`);
  console.log(`  MCP SSE:   /sse, /message`);
});
