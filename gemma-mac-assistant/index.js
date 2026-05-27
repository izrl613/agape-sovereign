import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Path to the main codebase
const CODEBASE_PATH = "/Users/aarondavid/Documents/agape-sovereign/agape-sovereign";

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

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "open_app",
        description: "Open/activate a specified macOS application from the list (Anti-Gravity IDE, Firebase Studio, Google Chrome, AGAPE SOVEREIGN).",
        inputSchema: {
          type: "object",
          properties: {
            appName: {
              type: "string",
              description: "The name of the application to open. Allowed: 'Antigravity IDE', 'Firebase Studio', 'Google Chrome', 'AGAPE SOVEREIGN'.",
              enum: ["Antigravity IDE", "Firebase Studio", "Google Chrome", "AGAPE SOVEREIGN"],
            },
          },
          required: ["appName"],
        },
      },
      {
        name: "open_url_in_chrome",
        description: "Opens a URL in Google Chrome (such as Firebase Console or local app).",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to open (e.g., 'https://console.firebase.google.com/' or 'http://localhost:3000').",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "run_command",
        description: "Execute a shell command inside the Agape Sovereign repository folder.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The terminal command to run (e.g. 'firebase deploy', 'npm run dev', 'npm run build').",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "take_screenshot",
        description: "Capture a screenshot of the Mac desktop to see the current state of apps.",
        inputSchema: {
          type: "object",
          properties: {
            outputPath: {
              type: "string",
              description: "Optional destination path for the screenshot. Defaults to '/tmp/mac_screenshot.png'.",
            },
          },
        },
      },
    ],
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "open_app") {
      const appName = args.appName;
      let cmd = "";

      if (appName === "Firebase Studio") {
        cmd = `open "/Users/aarondavid/Applications/Chrome Apps.localized/Firebase Studio.app"`;
      } else if (appName === "AGAPE SOVEREIGN") {
        cmd = `open "/Users/aarondavid/Applications/Chrome Apps.localized/AGAPE SOVEREIGN.app"`;
      } else if (appName === "Antigravity IDE") {
        cmd = `open "/Applications/Antigravity IDE.app"`;
      } else if (appName === "Google Chrome") {
        cmd = `open "/Applications/Google Chrome.app"`;
      } else {
        return {
          content: [{ type: "text", text: `Unknown application: ${appName}` }],
          isError: true,
        };
      }

      await execAsync(cmd);
      return {
        content: [{ type: "text", text: `Successfully opened ${appName}.` }],
      };
    }

    if (name === "open_url_in_chrome") {
      const url = args.url;
      const cmd = `open -a "Google Chrome" "${url}"`;
      await execAsync(cmd);
      return {
        content: [{ type: "text", text: `Successfully opened URL in Chrome: ${url}` }],
      };
    }

    if (name === "run_command") {
      const command = args.command;
      
      // Limit to codebase path and enforce shell-based run
      const { stdout, stderr } = await execAsync(command, { cwd: CODEBASE_PATH });
      
      return {
        content: [
          {
            type: "text",
            text: `Command output:\nSTDOUT:\n${stdout || "(no output)"}\n\nSTDERR:\n${stderr || "(no stderr)"}`,
          },
        ],
      };
    }

    if (name === "take_screenshot") {
      const outputPath = args.outputPath || "/tmp/mac_screenshot.png";
      await execAsync(`screencapture -x "${outputPath}"`);
      return {
        content: [{ type: "text", text: `Screenshot captured successfully to ${outputPath}` }],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error executing tool '${name}': ${error.message}` }],
      isError: true,
    };
  }
});

// Run server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Gemma Mac Assistant MCP Server running on stdio");
