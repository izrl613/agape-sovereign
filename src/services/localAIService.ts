// ─────────────────────────────────────────────────────────────────────────────
// localAIService.ts — Sovereign AI Service
// Supports dual backends:
//   1. LMStudio (OpenAI-compatible API, port 1234) — primary
//      Model: qwen3.5-9b-sushi-coder-rl-mlx (when running)
//   2. Ollama (native API, port 11434) — fallback
//      Model: gemma4:e4b / qwen2.5-coder:7b (always-on)
//
// Detection order: LMStudio → Ollama → Offline
// NO external AI calls. Zero external billing.
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_MODEL, OLLAMA_BASE_URL } from '../config/aiModel.js';

// ─── Endpoint configuration ───────────────────────────────────────────────────
const LOCAL_OLLAMA_URL = OLLAMA_BASE_URL;
const LOCAL_LMSTUDIO_URL = 'http://localhost:1234';
// Preferred LMStudio model (qwen3.5 sushi coder variant running in LMStudio)
const LMSTUDIO_MODEL = 'qwen3.5-9b-sushi-coder-rl-mlx';
// Ollama fallback model
const OLLAMA_MODEL = DEFAULT_MODEL;

// Active backend state — updated by probeBackend()
type BackendType = 'lmstudio' | 'ollama' | 'offline';
let ACTIVE_BACKEND: BackendType = 'offline';
let ACTIVE_PROXY_URL = LOCAL_OLLAMA_URL;
let ACTIVE_MODEL = OLLAMA_MODEL;

// Keep for legacy compat
const GEMMA_MODEL = DEFAULT_MODEL;

// ─── Offline response template ────────────────────────────────────────────────
const OFFLINE_RESPONSE = `⚠️ Local AI is currently unreachable.

Your Sovereign Enclave is operating in **offline mode**. No data has left your device.

To restore AI capabilities:
- **LMStudio**: Launch LMStudio, load model \`${LMSTUDIO_MODEL}\`, and start the server on port 1234.
- **Ollama**: Ensure Ollama is running at ${LOCAL_OLLAMA_URL} with \`ollama run ${OLLAMA_MODEL}\`

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
// 1. Backend probe — LMStudio first, then Ollama
// ─────────────────────────────────────────────────────────────────────────────

/** Probe LMStudio OpenAI-compatible endpoint on port 1234 */
async function probeLMStudio(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_LMSTUDIO_URL}/v1/models`, {
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      const data = await res.json();
      // LMStudio returns { data: [ { id: "model-name", ... } ] }
      const models: string[] = (data?.data ?? []).map((m: { id: string }) => m.id);
      ACTIVE_BACKEND = 'lmstudio';
      ACTIVE_PROXY_URL = LOCAL_LMSTUDIO_URL;
      // Use qwen3.5 if loaded, else whatever LMStudio has loaded
      ACTIVE_MODEL = models.find(m => m.toLowerCase().includes('qwen3.5') || m.toLowerCase().includes('qwen3_5'))
        ?? models[0]
        ?? LMSTUDIO_MODEL;
      return true;
    }
  } catch {
    // LMStudio not running
  }
  return false;
}

/** Probe Ollama native endpoint on port 11434 */
async function probeOllama(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      ACTIVE_BACKEND = 'ollama';
      ACTIVE_PROXY_URL = LOCAL_OLLAMA_URL;
      ACTIVE_MODEL = OLLAMA_MODEL;
      return true;
    }
  } catch {
    // Ollama not running
  }
  return false;
}

export async function getLocalAIStatus(): Promise<LocalStatus> {
  // Try LMStudio first (user's primary model)
  const lmStudioOnline = await probeLMStudio();
  if (lmStudioOnline) {
    return {
      online: true,
      port: 1234,
      modelName: `${ACTIVE_MODEL} (LMStudio)`,
      usage: "Unlimited Tokens · LM Studio",
      costModel: "Local — Zero External Billing",
      activeEndpoint: LOCAL_LMSTUDIO_URL
    };
  }

  // Fallback to Ollama
  const ollamaOnline = await probeOllama();
  if (ollamaOnline) {
    return {
      online: true,
      port: 11434,
      modelName: `${ACTIVE_MODEL} (Ollama)`,
      usage: "Unlimited Tokens · Local Ollama",
      costModel: "Local — Zero External Billing",
      activeEndpoint: LOCAL_OLLAMA_URL
    };
  }

  ACTIVE_BACKEND = 'offline';
  return {
    online: false,
    port: 11434,
    modelName: OLLAMA_MODEL,
    usage: "Offline Mode — No data leaves device",
    costModel: "Zero External Billing",
    activeEndpoint: undefined
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Internal: route a chat request to the active backend
//    LMStudio uses OpenAI-compatible API (/v1/chat/completions)
//    Ollama uses native API (/api/chat)
// ─────────────────────────────────────────────────────────────────────────────
async function callLocalAI(
  messages: { role: string; content: string }[],
  jsonMode = false
): Promise<string> {
  // Ensure backend is probed
  if (ACTIVE_BACKEND === 'offline') {
    await getLocalAIStatus();
  }

  // LMStudio path: OpenAI-compatible /v1/chat/completions
  if (ACTIVE_BACKEND === 'lmstudio') {
    try {
      const body: Record<string, unknown> = {
        model: ACTIVE_MODEL,
        messages,
        stream: false,
        max_tokens: jsonMode ? 2048 : -1,
        temperature: 0.7,
      };
      if (jsonMode) {
        body.response_format = { type: 'json_object' };
      }
      const response = await fetch(`${LOCAL_LMSTUDIO_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000)
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "";
      }
    } catch {
      // LMStudio may have gone offline; fall through to Ollama
      ACTIVE_BACKEND = 'offline';
    }
  }

  // Ollama path: native /api/chat
  if (ACTIVE_BACKEND === 'ollama' || ACTIVE_BACKEND === 'offline') {
    // Re-probe Ollama if we just fell through
    if (ACTIVE_BACKEND === 'offline') {
      await probeOllama();
    }
    if (ACTIVE_BACKEND === 'ollama') {
      try {
        const response = await fetch(`${LOCAL_OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ACTIVE_MODEL,
            messages,
            stream: false,
            format: jsonMode ? 'json' : undefined,
            options: { num_predict: jsonMode ? 2048 : -1 }
          }),
          signal: AbortSignal.timeout(120000)
        });
        if (response.ok) {
          const data = await response.json();
          return data.message?.content ?? "";
        }
      } catch {
        ACTIVE_BACKEND = 'offline';
      }
    }
  }

  return OFFLINE_RESPONSE;
}

// Legacy alias kept for any internal callers
async function callGemma4(
  messages: { role: string; content: string }[],
  jsonMode = false
): Promise<string> {
  return callLocalAI(messages, jsonMode);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. chatComplete — for scanning, metadata, threat intelligence (non-streaming)
// ─────────────────────────────────────────────────────────────────────────────
export async function chatComplete(
  prompt: string,
  systemInstruction?: string,
  jsonMode: boolean = false,
  history: { role: string; content: string }[] = []
): Promise<AIResponse> {
  const messages: { role: string; content: string }[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
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
  for (const url of ["http://127.0.0.1:3001"]) {
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
