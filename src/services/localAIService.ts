import { GoogleGenAI } from "@google/genai";

const PROXY_URL = "http://localhost:3000";
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
  try {
    const res = await fetch(`${PROXY_URL}/api/status`, {
      method: "GET",
      signal: AbortSignal.timeout(1000)
    });
    if (res.ok) {
      const data = await res.json();
      return {
        online: data.online,
        port: data.port,
        modelName: data.modelName || "Gemma-4-E4B-MLX",
        usage: data.usage || "Unlimited Tokens",
        costModel: data.costModel || "Zero External Billing"
      };
    }
  } catch (e) {
    // Ignore error, return offline
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

      const response = await fetch(`${PROXY_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
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
  const config: any = {};
  if (jsonMode) {
    config.responseMimeType = "application/json";
  }
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const response = await cloudClient.models.generateContent({
    model: jsonMode ? CLOUD_MODEL_FLASH : CLOUD_MODEL_PRO,
    contents: prompt,
    config
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
      const response = await fetch(`${PROXY_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        // Simulate premium speed typing streaming
        const words = content.split(" ");
        let currentText = "";
        for (let i = 0; i < words.length; i++) {
          currentText += (i === 0 ? "" : " ") + words[i];
          yield { text: currentText };
          await new Promise((r) => setTimeout(r, 12)); // smooth fast flow
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
