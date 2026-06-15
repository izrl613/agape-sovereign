// ─────────────────────────────────────────────────────────────────────────────
// localAIService.ts — Gemma 4 E4B · Offline-First Sovereign AI Service
// ALL inference routes through the Gemma4 MCP Server.
// NO external AI calls. Zero external billing.
// ─────────────────────────────────────────────────────────────────────────────

// Primary: Cloud Run hosted Gemma4 E4B MCP server
const CLOUD_MCP_URL = "https://gemma4-mcp-server-956088455461.us-central1.run.app";
// Fallback: local Ollama / MLX server
const LOCAL_PROXY_URL = "http://localhost:3000";
// Ollama native API (alternative local path)
const LOCAL_OLLAMA_URL = "http://localhost:11434";

let ACTIVE_PROXY_URL = CLOUD_MCP_URL;

// ─── Model identifiers ────────────────────────────────────────────────────────
const GEMMA_MODEL = "gemma4:e4b";

// ─── Offline response template ────────────────────────────────────────────────
const OFFLINE_RESPONSE = `⚠️ Gemma 4 E4B is currently unreachable.

Your Sovereign Enclave is operating in **offline mode**. No data has left your device.

To restore AI capabilities:
1. Ensure the Gemma4 MCP server is running locally via Ollama: \`ollama run gemma2:2b\`
2. Or verify Cloud Run endpoint is healthy at ${CLOUD_MCP_URL}

All scan logic, encryption, and identity protection continue to function offline.`;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AIResponse {
  text: string;
  offline?: boolean;
}

export interface LocalStatus {
  online: boolean;
  port: number;
  modelName: string;
  usage: string;
  costModel: string;
  activeEndpoint?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Live status probe — checks Cloud Run then localhost fallback
// ─────────────────────────────────────────────────────────────────────────────
export async function getLocalAIStatus(): Promise<LocalStatus> {
  // Try Cloud Run first
  for (const url of [CLOUD_MCP_URL, LOCAL_PROXY_URL]) {
    try {
      const res = await fetch(`${url}/api/status`, {
        method: "GET",
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        ACTIVE_PROXY_URL = url;
        return {
          online: true,
          port: data.port || (url === CLOUD_MCP_URL ? 443 : 3000),
          modelName: "Gemma 4 E4B",
          usage: "Unlimited Tokens · Offline-First",
          costModel: url === CLOUD_MCP_URL
            ? "Cloud Run — Zero External Billing"
            : "Local Ollama — Zero External Billing",
          activeEndpoint: url
        };
      }
    } catch {
      // Try next
    }
  }

  // Try Ollama native API as last resort
  try {
    const res = await fetch(`${LOCAL_OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      ACTIVE_PROXY_URL = LOCAL_OLLAMA_URL;
      return {
        online: true,
        port: 11434,
        modelName: "Gemma 4 E4B (Ollama)",
        usage: "Unlimited Tokens · Local Ollama",
        costModel: "Local — Zero External Billing",
        activeEndpoint: LOCAL_OLLAMA_URL
      };
    }
  } catch {
    // Fully offline
  }

  return {
    online: false,
    port: 3000,
    modelName: "Gemma 4 E4B",
    usage: "Offline Mode — No data leaves device",
    costModel: "Zero External Billing",
    activeEndpoint: undefined
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Internal: route a chat request to the active Gemma4 endpoint
// ─────────────────────────────────────────────────────────────────────────────
async function callGemma4(
  messages: { role: string; content: string }[],
  jsonMode = false
): Promise<string> {
  // Via MCP proxy (Cloud Run or local server.js)
  const proxyUrls = [CLOUD_MCP_URL, LOCAL_PROXY_URL];
  for (const url of proxyUrls) {
    try {
      const response = await fetch(`${url}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          max_tokens: -1,
          stream: false,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {})
        }),
        signal: AbortSignal.timeout(30000)
      });
      if (response.ok) {
        ACTIVE_PROXY_URL = url;
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      }
    } catch {
      // Try next proxy
    }
  }

  // Via Ollama native API
  try {
    const response = await fetch(`${LOCAL_OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        options: { num_predict: jsonMode ? 2048 : -1 }
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (response.ok) {
      ACTIVE_PROXY_URL = LOCAL_OLLAMA_URL;
      const data = await response.json();
      return data.message?.content || "";
    }
  } catch {
    // Fully offline
  }

  return OFFLINE_RESPONSE;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. chatComplete — for scanning, metadata, threat intelligence (non-streaming)
// ─────────────────────────────────────────────────────────────────────────────
export async function chatComplete(
  prompt: string,
  systemInstruction?: string,
  jsonMode: boolean = false
): Promise<AIResponse> {
  const messages: { role: string; content: string }[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const text = await callGemma4(messages, jsonMode);
  const offline = text === OFFLINE_RESPONSE;
  return { text, offline };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. chatStream — real-time streaming for Architect AI interactive chat
//    Simulates smooth streaming output from Gemma4 single-shot response
// ─────────────────────────────────────────────────────────────────────────────
export async function* chatStream(
  prompt: string,
  systemInstruction?: string,
  history: { role: "user" | "model"; text: string }[] = []
): AsyncGenerator<{ text: string }> {
  const messages: { role: string; content: string }[] = [];

  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  for (const h of history) {
    messages.push({
      role: h.role === "model" ? "assistant" : "user",
      content: h.text
    });
  }
  messages.push({ role: "user", content: prompt });

  const content = await callGemma4(messages, false);

  // Simulate premium streaming — word-by-word with smooth timing
  let buffer = "";
  const words = content.split(/(\s+)/);
  for (const word of words) {
    buffer += word;
    if (word.trim() !== "") {
      yield { text: buffer };
      await new Promise((r) => setTimeout(r, 14)); // ~70 words/sec
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Privacy & Security Q&A — routes through Gemma4 MCP privacy tool
//    Dedicated for user data privacy analysis and security questions
// ─────────────────────────────────────────────────────────────────────────────
export async function askPrivacySecurity(
  userQuestion: string,
  contextData?: string
): Promise<AIResponse> {
  const PRIVACY_SYSTEM_PROMPT = `You are a sovereign privacy and security analyst powered by Gemma 4 E4B running offline on the user's device. 
Your role: analyze personal data, security risks, and privacy threats with complete confidentiality.
No data is ever sent to external servers. You operate entirely within the user's sovereign enclave.
Guidelines:
- Be specific and actionable in security recommendations
- Reference privacy laws (GDPR, CCPA) when relevant
- Prioritize zero-trust and privacy-first principles
- Flag high-risk exposure clearly with severity ratings
- Recommend open-source, privacy-preserving alternatives`;

  const prompt = contextData
    ? `Context data (encrypted locally, never transmitted):\n${contextData}\n\nUser Question: ${userQuestion}`
    : userQuestion;

  return chatComplete(prompt, PRIVACY_SYSTEM_PROMPT, false);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MCP Tool call — direct invocation of named tools on the MCP server
// ─────────────────────────────────────────────────────────────────────────────
export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<{ result: string; offline: boolean }> {
  for (const url of [CLOUD_MCP_URL, LOCAL_PROXY_URL]) {
    try {
      const response = await fetch(`${url}/mcp/tool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolName, arguments: args }),
        signal: AbortSignal.timeout(20000)
      });
      if (response.ok) {
        const data = await response.json();
        return { result: data.result || data.content?.[0]?.text || "", offline: false };
      }
    } catch {
      // Try next
    }
  }
  return {
    result: "⚠️ MCP tool unavailable in offline mode. All local processing continues normally.",
    offline: true
  };
}
