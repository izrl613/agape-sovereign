const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export interface ChatRequest {
  message: string;
  model: string;
  systemPrompt?: string;
  stream?: boolean;
}

export interface ChatResponse {
  text: string;
  finishReason?: string;
  usage?: {
    totalTokens?: number;
  };
}

export interface HealthResponse {
  status: string;
  ollama: boolean;
  models: string[];
}

export interface ModelInfo {
  name: string;
  type?: string;
  available: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  async health(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
    return res.json();
  }

  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
      signal,
    });
    if (!res.ok) throw new Error(`Chat stream failed: ${res.statusText}`);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.text) {
              fullText += parsed.text;
              onChunk(parsed.text);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    return { text: fullText };
  }

  async listModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${this.baseUrl}/api/models`);
    if (!res.ok) throw new Error(`Failed to list models: ${res.statusText}`);
    const data = await res.json();
    return data.models || [];
  }

  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model }),
    });
    if (!res.ok) throw new Error(`Embedding failed: ${res.statusText}`);
    const data = await res.json();
    return data.embedding;
  }

  async generate(request: { prompt: string; model?: string; system?: string }): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Generate failed: ${res.statusText}`);
    return res.json();
  }
}

export const api = new ApiService();
