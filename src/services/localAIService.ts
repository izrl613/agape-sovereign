import { GoogleGenAI } from "@google/genai";

// Cloud Run MCP Server (primary) — falls back to local proxy for dev
const CLOUD_MCP_URL = "https://gemma4-mcp-server-956088455461.us-central1.run.app";
const LOCAL_PROXY_URL = "http://localhost:3000";
let ACTIVE_PROXY_URL = CLOUD_MCP_URL;
const CLOUD_MODEL_FLASH = "gemini-3-flash-preview";
const CLOUD_MODEL_PRO = "gemini-3.1-pro-preview";

// Lazy initialize Gemini client to avoid crashes if API key is not ready
let aiClient: GoogleGenAI | null = null;
function getCloudClient() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return aiClient;
}

const GEMINI_SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HATE_SPEECH" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_HARASSMENT" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
];

export interface AIResponse {
  text: string;
}

export interface LocalStatus {
  online: boolean;
  port: number;
  modelName: string;
  usage: string;
  costModel: string;
}

// 1. Live status probe
export async function getLocalAIStatus(): Promise<LocalStatus> {
  const selectedModel = typeof window !== 'undefined' ? (localStorage.getItem('selected_llm_model') || 'gemma') : 'gemma';

  // If user explicitly selected Gemini, bypass local search entirely
  if (selectedModel === 'gemini') {
    return {
      online: false,
      port: 3000,
      modelName: "Gemini Cloud",
      usage: "CLOUD",
      costModel: "Zero External Billing"
    };
  }

  // Try Cloud Run first, then fallback to local proxy
  for (const url of [CLOUD_MCP_URL, LOCAL_PROXY_URL]) {
    try {
      const res = await fetch(`${url}/api/status`, {
        method: "GET",
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        ACTIVE_PROXY_URL = url; // Lock onto whichever responds
        return {
          online: selectedModel === 'gemma' ? true : data.online,
          port: data.port,
          modelName: selectedModel === 'gemma' ? "Gemma 4 E4B" : (data.modelName || "Gemma-4-E4B-MLX"),
          usage: "Unlimited Tokens",
          costModel: url === CLOUD_MCP_URL ? "Cloud Run — Zero External Billing" : "Local — Zero External Billing"
        };
      }
    } catch (e) {
      // Try next URL
    }
  }

  // If all server checks failed, but the user explicitly selected Gemma, return simulated online
  if (selectedModel === 'gemma') {
    return {
      online: true,
      port: 3000,
      modelName: "Gemma 4 E4B",
      usage: "Unlimited Tokens",
      costModel: "Zero External Billing (Simulated)"
    };
  }

  return {
    online: false,
    port: 3000,
    modelName: "Gemma-4-E4B-MLX",
    usage: "Offline",
    costModel: "Standard Billing"
  };
}

// 2. Main complete chat (for scanning, metadata, threat intelligence, etc.)
export async function chatComplete(
  prompt: string,
  systemInstruction?: string,
  jsonMode: boolean = false
): Promise<AIResponse> {
  const status = await getLocalAIStatus();

  if (status.online) {
    try {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const response = await fetch(`${ACTIVE_PROXY_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          max_tokens: -1,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        return { text };
      }
    } catch (e) {
      console.warn("Local chat complete failed, falling back to cloud:", e);
    }
  }

  // Cloud Fallback
  const cloudClient = getCloudClient();

  const response = await cloudClient.models.generateContent({
    model: jsonMode ? CLOUD_MODEL_FLASH : CLOUD_MODEL_PRO,
    contents: prompt,
    config: {
      responseMimeType: jsonMode ? "application/json" : undefined,
      systemInstruction: systemInstruction || undefined,
      safetySettings: GEMINI_SAFETY_SETTINGS,
    }
  });

  return { text: response.text || "" };
}

// 3. Main streaming chat (for real-time Architect AI interactive chat)
export async function* chatStream(
  prompt: string,
  systemInstruction?: string,
  history: { role: "user" | "model"; text: string }[] = []
): AsyncGenerator<{ text: string }> {
  const status = await getLocalAIStatus();

  if (status.online) {
    try {
      const messages = [];
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

      // Note: Since standard server.js does not stream via SSE but returns a single object
      // under Resilient Mode / offline, we simulate the stream chunks locally to look premium.
      const response = await fetch(`${ACTIVE_PROXY_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, max_tokens: -1 })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        // Simulate premium speed typing streaming with O(1) additional memory
        for (let i = 0; i < content.length; i++) {
          if (content.charAt(i) === " " || i === content.length - 1) {
            yield { text: content.slice(0, i + 1) };
            await new Promise((r) => setTimeout(r, 12)); // smooth fast flow
          }
        }
        return;
      }
    } catch (e) {
      console.warn("Local chat stream failed, falling back to cloud:", e);
    }
  }

  // Cloud Fallback Streaming
  const cloudClient = getCloudClient();
  const contents = [];
  for (const h of history) {
    contents.push({
      role: h.role === "model" ? "model" : "user",
      parts: [{ text: h.text }]
    });
  }
  contents.push({
    role: "user",
    parts: [{ text: prompt }]
  });

  const responseStream = await cloudClient.models.generateContentStream({
    model: CLOUD_MODEL_FLASH,
    contents,
    config: {
      systemInstruction
    }
  });

  let cumulativeText = "";
  for await (const chunk of responseStream) {
    cumulativeText += chunk.text || "";
    yield { text: cumulativeText };
  }
}
