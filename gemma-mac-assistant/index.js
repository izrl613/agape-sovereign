/**
 * ============================================================
 * GEMMA-4-E4B MAC ASSISTANT — MCP SERVER v2.0
 * ============================================================
 * Fuses Gemma-4-E4B-MLX (LM Studio) with:
 *   • Antigravity (AI coding environment)
 *   • Antigravity IDE (/Applications/Antigravity IDE.app)
 *   • Architect AI / Agape Sovereign codebase
 *   • Firebase Studio, Firebase Console, Google Chrome
 *
 * Exposed via MCP stdio to LM Studio so any model can call
 * these tools directly during chat.
 * ============================================================
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// ── Core paths ───────────────────────────────────────────────
const AGAPE_ROOT      = "/Users/aarondavid/Documents/agape-sovereign/agape-sovereign";
const GEMMA_ASST_DIR  = "/Users/aarondavid/Documents/agape-sovereign/gemma-mac-assistant";
const LM_STUDIO_DIR   = "/Users/aarondavid/.lmstudio";
const LM_API_BASE     = "http://localhost:1234/v1";   // LM Studio OpenAI-compat API
const GEMMA_MODEL_ID  = "google/gemma-4-e4b";         // pinned model ID in LM Studio

// ── Known application paths ──────────────────────────────────
const APP_PATHS = {
  "Antigravity IDE": "/Applications/Antigravity IDE.app",
  "Antigravity":     "/Applications/Antigravity.app",
  "Google Chrome":   "/Applications/Google Chrome.app",
  "LM Studio":       "/Applications/LM Studio.app",
  "Firebase Studio": "/Users/aarondavid/Applications/Chrome Apps.localized/Firebase Studio.app",
  "AGAPE SOVEREIGN": "/Users/aarondavid/Applications/Chrome Apps.localized/AGAPE SOVEREIGN.app",
};

// ── Firebase Console URL ─────────────────────────────────────
const FIREBASE_CONSOLE_URL    = "https://console.firebase.google.com/";
const FIREBASE_STUDIO_URL     = "https://studio.firebase.google.com/";
const AGAPE_LOCAL_DEV_URL     = "http://localhost:3000";
const AGAPE_BACKEND_URL       = "http://localhost:3001";

// ── Architect AI system-prompt excerpt (loaded at init) ──────
let architectAIContext = "";
try {
  const agentPy = fs.readFileSync(path.join(AGAPE_ROOT, "architect_agent.py"), "utf-8");
  // Extract the instruction block (everything between the triple-quoted strings)
  const match = agentPy.match(/instruction='''([\s\S]*?)'''/);
  if (match) architectAIContext = match[1].slice(0, 4000); // keep first 4000 chars
} catch (_) { /* agent file not readable — continue */ }

// ─────────────────────────────────────────────────────────────
// MCP SERVER
// ─────────────────────────────────────────────────────────────
const server = new Server(
  { name: "gemma-mac-assistant", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

// ─────────────────────────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [

    // ── 1. Open Application ────────────────────────────────
    {
      name: "open_app",
      description:
        "Launch or focus a macOS application. Supports: Antigravity IDE, Antigravity, Google Chrome, LM Studio, Firebase Studio, AGAPE SOVEREIGN.",
      inputSchema: {
        type: "object",
        properties: {
          appName: {
            type: "string",
            description: "App to open.",
            enum: Object.keys(APP_PATHS),
          },
        },
        required: ["appName"],
      },
    },

    // ── 2. Open URL in Chrome ─────────────────────────────
    {
      name: "open_url_in_chrome",
      description:
        "Open any URL in Google Chrome. Use for Firebase Console, Firebase Studio, local dev servers, or any web resource.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: `URL to open. Shortcuts: 'firebase-console' → ${FIREBASE_CONSOLE_URL}, 'firebase-studio' → ${FIREBASE_STUDIO_URL}, 'local' → ${AGAPE_LOCAL_DEV_URL}`,
          },
        },
        required: ["url"],
      },
    },

    // ── 3. Run Shell Command ──────────────────────────────
    {
      name: "run_command",
      description:
        "Run a shell command inside the Agape Sovereign codebase directory. Output (stdout + stderr) is returned. Use for: npm run dev, firebase deploy, git commands, etc.",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to execute." },
          cwd: {
            type: "string",
            description: `Optional working directory. Defaults to ${AGAPE_ROOT}.`,
          },
          timeout: {
            type: "number",
            description: "Timeout in milliseconds (default: 30000, max: 120000).",
          },
        },
        required: ["command"],
      },
    },

    // ── 4. Read File ──────────────────────────────────────
    {
      name: "read_file",
      description:
        "Read the contents of any file on the filesystem. Useful for inspecting source code, configs, or generated outputs.",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Absolute path to the file." },
          startLine: { type: "number", description: "Optional: 1-indexed start line." },
          endLine:   { type: "number", description: "Optional: 1-indexed end line." },
        },
        required: ["filePath"],
      },
    },

    // ── 5. Write File ─────────────────────────────────────
    {
      name: "write_file",
      description:
        "Write content to a file (creates parent directories if needed). Use this to generate code, configs, or reports.",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Absolute path to write." },
          content:  { type: "string", description: "Content to write." },
          append:   { type: "boolean", description: "If true, append instead of overwrite." },
        },
        required: ["filePath", "content"],
      },
    },

    // ── 6. Take Screenshot ────────────────────────────────
    {
      name: "take_screenshot",
      description:
        "Capture a PNG screenshot of the Mac desktop so you can visually verify app states or UI.",
      inputSchema: {
        type: "object",
        properties: {
          outputPath: {
            type: "string",
            description: "Save path. Defaults to /tmp/mac_screenshot.png",
          },
        },
      },
    },

    // ── 7. Query Gemma via LM Studio API ──────────────────
    {
      name: "ask_gemma",
      description:
        "Send a prompt directly to Gemma-4-E4B-MLX running in LM Studio and return its response. Ideal for AI-assisted code review, analysis, or generation using the local LLM.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt / question to ask Gemma-4-E4B-MLX.",
          },
          systemPrompt: {
            type: "string",
            description: "Optional system prompt override.",
          },
          temperature: {
            type: "number",
            description: "Sampling temperature (0.0–1.0, default 0.7).",
          },
        },
        required: ["prompt"],
      },
    },

    // ── 8. Get Architect AI Context ───────────────────────
    {
      name: "get_architect_ai_context",
      description:
        "Return the Architect AI system prompt and DIFF module definitions from Agape Sovereign. Use this to understand Architect AI's identity before working on the codebase.",
      inputSchema: { type: "object", properties: {} },
    },

    // ── 9. List Directory ─────────────────────────────────
    {
      name: "list_directory",
      description: "List files and subdirectories in a given path.",
      inputSchema: {
        type: "object",
        properties: {
          dirPath: { type: "string", description: "Absolute path to list." },
          depth:   { type: "number", description: "Max depth (1–3, default 1)." },
        },
        required: ["dirPath"],
      },
    },

    // ── 10. Notify with macOS Alert ───────────────────────
    {
      name: "notify",
      description:
        "Show a macOS system notification / alert to the user. Useful for signaling task completion, errors, or updates.",
      inputSchema: {
        type: "object",
        properties: {
          title:   { type: "string", description: "Notification title." },
          message: { type: "string", description: "Notification body." },
          sound:   { type: "boolean", description: "Play a sound (default: true)." },
        },
        required: ["title", "message"],
      },
    },

    // ── 11. Check LM Studio / Gemma Status ────────────────
    {
      name: "check_lm_studio_status",
      description:
        "Check if LM Studio's local API server is running and which models are loaded. Confirms Gemma-4-E4B availability.",
      inputSchema: { type: "object", properties: {} },
    },

  ],
}));

// ─────────────────────────────────────────────────────────────
// TOOL CALL HANDLERS
// ─────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {

    // ── 1. open_app ────────────────────────────────────────
    if (name === "open_app") {
      const appPath = APP_PATHS[args.appName];
      if (!appPath) {
        return err(`Unknown app: ${args.appName}. Available: ${Object.keys(APP_PATHS).join(", ")}`);
      }
      await execAsync(`open "${appPath}"`);
      return ok(`✅ Opened: ${args.appName}`);
    }

    // ── 2. open_url_in_chrome ─────────────────────────────
    if (name === "open_url_in_chrome") {
      let url = args.url;
      if (url === "firebase-console") url = FIREBASE_CONSOLE_URL;
      else if (url === "firebase-studio") url = FIREBASE_STUDIO_URL;
      else if (url === "local") url = AGAPE_LOCAL_DEV_URL;
      else if (url === "backend") url = AGAPE_BACKEND_URL;

      await execAsync(`open -a "Google Chrome" "${url}"`);
      return ok(`✅ Opened in Chrome: ${url}`);
    }

    // ── 3. run_command ────────────────────────────────────
    if (name === "run_command") {
      const cwd     = args.cwd || AGAPE_ROOT;
      const timeout = Math.min(args.timeout || 30000, 120000);
      const { stdout, stderr } = await execAsync(args.command, { cwd, timeout });
      return ok(
        `Command: ${args.command}\nCWD: ${cwd}\n\n--- STDOUT ---\n${stdout || "(empty)"}\n--- STDERR ---\n${stderr || "(empty)"}`
      );
    }

    // ── 4. read_file ──────────────────────────────────────
    if (name === "read_file") {
      const raw = fs.readFileSync(args.filePath, "utf-8");
      let lines = raw.split("\n");
      if (args.startLine !== undefined && args.endLine !== undefined) {
        lines = lines.slice(args.startLine - 1, args.endLine);
      } else if (args.startLine !== undefined) {
        lines = lines.slice(args.startLine - 1);
      }
      const content = lines.join("\n");
      return ok(`File: ${args.filePath}\nLines: ${lines.length}\n\n${content}`);
    }

    // ── 5. write_file ─────────────────────────────────────
    if (name === "write_file") {
      const dir = path.dirname(args.filePath);
      fs.mkdirSync(dir, { recursive: true });
      if (args.append) {
        fs.appendFileSync(args.filePath, args.content, "utf-8");
        return ok(`✅ Appended to: ${args.filePath}`);
      }
      fs.writeFileSync(args.filePath, args.content, "utf-8");
      return ok(`✅ Written to: ${args.filePath} (${args.content.length} chars)`);
    }

    // ── 6. take_screenshot ────────────────────────────────
    if (name === "take_screenshot") {
      const outPath = args.outputPath || "/tmp/mac_screenshot.png";
      await execAsync(`screencapture -x "${outPath}"`);
      return ok(`✅ Screenshot saved: ${outPath}`);
    }

    // ── 7. ask_gemma ──────────────────────────────────────
    if (name === "ask_gemma") {
      const sysPrompt = args.systemPrompt ||
        `You are Gemma-4-E4B-MLX, a powerful local AI assistant running inside LM Studio on an M5 MacBook Air. You are fused with the Antigravity IDE and the Agape Sovereign platform. Help the user with code, analysis, and tasks with precision and depth.`;

      const body = JSON.stringify({
        model: GEMMA_MODEL_ID,
        messages: [
          { role: "system",    content: sysPrompt },
          { role: "user",      content: args.prompt },
        ],
        temperature: args.temperature ?? 0.7,
        stream: false,
      });

      // Dynamic import so we can use native fetch (Node 18+)
      const res = await fetch(`${LM_API_BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const errText = await res.text();
        return err(`LM Studio API error ${res.status}: ${errText}\n\n💡 Make sure LM Studio is open and the local server is running on port 1234.`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "(empty response)";
      const tokens = data.usage ? `[Tokens: ${data.usage.total_tokens}]` : "";
      return ok(`🧠 Gemma-4-E4B Response ${tokens}:\n\n${reply}`);
    }

    // ── 8. get_architect_ai_context ───────────────────────
    if (name === "get_architect_ai_context") {
      if (!architectAIContext) {
        return ok("Architect AI context not loaded (architect_agent.py not found). Ensure the agape-sovereign codebase is present.");
      }
      return ok(
        `🏛️ ARCHITECT AI — AGAPE SOVEREIGN CONTEXT\n\nThis is the live system instruction from architect_agent.py:\n\n${architectAIContext}`
      );
    }

    // ── 9. list_directory ─────────────────────────────────
    if (name === "list_directory") {
      const depth = Math.min(Math.max(args.depth || 1, 1), 3);
      const { stdout } = await execAsync(
        `find "${args.dirPath}" -maxdepth ${depth} | head -200`,
        { timeout: 10000 }
      );
      return ok(`📁 ${args.dirPath} (depth ${depth}):\n${stdout}`);
    }

    // ── 10. notify ────────────────────────────────────────
    if (name === "notify") {
      const sound = args.sound !== false;
      const script = `display notification "${args.message.replace(/"/g, "'")}" with title "${args.title.replace(/"/g, "'")}"${sound ? " sound name \"Glass\"" : ""}`;
      await execAsync(`osascript -e '${script}'`);
      return ok(`🔔 Notification sent: "${args.title}"`);
    }

    // ── 11. check_lm_studio_status ────────────────────────
    if (name === "check_lm_studio_status") {
      try {
        const res  = await fetch(`${LM_API_BASE}/models`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) {
          return ok(`⚠️ LM Studio server responded with status ${res.status}. Server is running but returned an error.`);
        }
        const data = await res.json();
        const models = (data.data || []).map(m => `  • ${m.id}`).join("\n");
        const hasGemma = (data.data || []).some(m => m.id.includes("gemma-4-e4b") || m.id.includes("gemma-4"));
        return ok(
          `✅ LM Studio Local Server: ONLINE (${LM_API_BASE})\n\nLoaded Models:\n${models || "  (none loaded)"}\n\n${hasGemma ? "✅ Gemma-4-E4B: ACTIVE" : "⚠️ Gemma-4-E4B: NOT loaded — load it in LM Studio first."}`
        );
      } catch (e) {
        return ok(
          `❌ LM Studio local server is NOT reachable at ${LM_API_BASE}\n\nTo fix:\n1. Open LM Studio\n2. Go to the "Local Server" tab\n3. Click "Start Server"\n4. Load the Gemma-4-E4B model`
        );
      }
    }

    return err(`Unknown tool: ${name}`);

  } catch (error) {
    return err(`Tool '${name}' failed: ${error.message}`);
  }
});

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function ok(text) {
  return { content: [{ type: "text", text: String(text) }] };
}
function err(text) {
  return { content: [{ type: "text", text: String(text) }], isError: true };
}

// ─────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `[gemma-mac-assistant v2.0] MCP Server running — fused with Gemma-4-E4B-MLX via ${LM_API_BASE}`
);
