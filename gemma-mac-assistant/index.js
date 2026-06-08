import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:latest";
const DEFAULT_NUM_PREDICT = Number.parseInt(
  process.env.OLLAMA_NUM_PREDICT ?? "32768",
  10
);
const DEFAULT_CONTEXT = Number.parseInt(process.env.OLLAMA_NUM_CTX ?? "131072", 10);

const server = new Server(
  {
    name: "gemma-mac-assistant",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "ask_gemma",
      description:
        "Ask the local Gemma model running in Ollama on this Mac. Use this when the user asks for Gemma, local LLM, private offline reasoning, or very large local token budgets.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The full prompt to send to Gemma.",
          },
          system: {
            type: "string",
            description: "Optional system instruction for Gemma.",
          },
          model: {
            type: "string",
            description:
              "Optional Ollama model name. Defaults to gemma4:latest.",
          },
          num_predict: {
            type: "number",
            description:
              "Optional output token budget. Defaults high, but the model and hardware still impose finite limits.",
          },
          num_ctx: {
            type: "number",
            description:
              "Optional context window request. Defaults high, but Ollama/model support determines the real limit.",
          },
        },
        required: ["prompt"],
      },
    },
    {
      name: "gemma_status",
      description:
        "Check whether Ollama is reachable and list available local Gemma models.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "gemma_status") {
    return gemmaStatus();
  }

  if (request.params.name !== "ask_gemma") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments ?? {};
  if (typeof args.prompt !== "string" || args.prompt.trim() === "") {
    throw new Error("ask_gemma requires a non-empty prompt string.");
  }

  const messages = [];
  if (typeof args.system === "string" && args.system.trim() !== "") {
    messages.push({ role: "system", content: args.system });
  }
  messages.push({ role: "user", content: args.prompt });

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: typeof args.model === "string" ? args.model : DEFAULT_MODEL,
      messages,
      stream: false,
      options: {
        num_predict: Number.isFinite(args.num_predict)
          ? args.num_predict
          : DEFAULT_NUM_PREDICT,
        num_ctx: Number.isFinite(args.num_ctx) ? args.num_ctx : DEFAULT_CONTEXT,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      content: [
        {
          type: "text",
          text: `Ollama returned HTTP ${response.status}: ${errorText}`,
        },
      ],
      isError: true,
    };
  }

  const data = await response.json();
  return {
    content: [
      {
        type: "text",
        text: data.message?.content ?? "Gemma returned an empty response.",
      },
    ],
  };
});

async function gemmaStatus() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = (data.models ?? [])
      .map((model) => model.name)
      .filter((name) => name.toLowerCase().includes("gemma"))
      .sort();

    return {
      content: [
        {
          type: "text",
          text: [
            `Ollama is reachable at ${OLLAMA_URL}.`,
            `Default model: ${DEFAULT_MODEL}`,
            `Gemma models: ${models.length ? models.join(", ") : "none found"}`,
            "Token note: local usage has no hosted billing or monthly quota, but context and output are still finite and bounded by model + Mac memory.",
          ].join("\n"),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Ollama is not reachable at ${OLLAMA_URL}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

const transport = new StdioServerTransport();
await server.connect(transport);
