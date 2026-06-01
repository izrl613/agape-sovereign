import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "ollama-mcp-server",
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
    // Assuming MLX server is running on localhost:8080 with OpenAI-compatible API
    const response = await fetch("http://localhost:8080/v1/chat/completions", {
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

// Start the server with standard IO transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ollama MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
