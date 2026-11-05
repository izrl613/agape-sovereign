import { architectClient } from '../lib/ArchitectMCPClient';

// ─────────────────────────────────────────────────────────────────────────────
// Sovereign AI Service — Nano-MCP Route
// All AI processing is now routed through the localized Nano-MCP Web Worker.
// ─────────────────────────────────────────────────────────────────────────────

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

export async function getLocalAIStatus(): Promise<LocalStatus> {
  try {
    const client = architectClient();
    await client.connect();
    const status = await client.healthCheck();

    return {
      online: !status.error,
      port: 0, // Local Worker
      modelName: status.text || "Nano-MCP Local",
      usage: "Unlimited Tokens · Client-Side Worker",
      costModel: "Local — Zero External Billing",
      activeEndpoint: "web-worker://mcp-server"
    };
  } catch {
    return {
      online: false,
      port: 0,
      modelName: "Offline",
      usage: "Offline Mode",
      costModel: "Zero External Billing",
    };
  }
}

export async function chatComplete(
  prompt: string,
  systemInstruction?: string,
  jsonMode: boolean = false,
  history: { role: string; content: string }[] = []
): Promise<AIResponse> {
  const client = architectClient();
  const result = await client.ask(prompt, systemInstruction);
  return { text: result.text, offline: !!result.error };
}

export async function* chatStream(
  prompt: string,
  systemInstruction?: string,
  history: { role: "user" | "model"; text: string }[] = []
): AsyncGenerator<{ text: string }> {
  const client = architectClient();
  const result = await client.ask(prompt, systemInstruction);
  const content = result.text;

  let buffer = "";
  const words = content.split(/(\s+)/);
  for (const word of words) {
    buffer += word;
    if (word.trim() !== "") {
      yield { text: buffer };
      await new Promise((r) => setTimeout(r, 14));
    }
  }
}

export async function askPrivacySecurity(
  userQuestion: string,
  contextData?: string
): Promise<AIResponse> {
  const client = architectClient();
  const result = await client.ask(userQuestion, contextData);
  return { text: result.text, offline: !!result.error };
}

export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<{ result: string; offline: boolean }> {
  const client = architectClient();
  try {
    // Map the internal tool calls to the client's specific methods
    // Since callTool is private in the client, we use a generic 'ask' for this implementation.
    const result = await client.ask(`Execute tool ${toolName} with args ${JSON.stringify(args)}`);
    return { result: result.text, offline: false };
  } catch {
    return { result: "⚠️ MCP tool unavailable.", offline: true };
  }
}
