export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  metadata?: {
    finishReason?: string;
    tokens?: number;
    duration?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  systemPrompt?: string;
}

export interface GenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  options?: GenerateRequest['options'];
}

export interface EmbeddingRequest {
  model: string;
  prompt: string | string[];
}

export interface EmbeddingResponse {
  embedding: number[];
}

export interface ModelListResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
      parent_model: string;
      format: string;
      family: string;
      families: string[];
      parameter_size: string;
      quantization_level: string;
    };
  }>;
}

export interface ModelInfoResponse {
  license: string;
  modelfile: string;
  parameters: string;
  template: string;
  details: ModelListResponse['models'][0]['details'];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const OLLAMA_BASE = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

class ApiService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Generate failed: ${response.statusText}`);
    return response.json();
  }

  async *generateStream(request: GenerateRequest): AsyncGenerator<GenerateResponse> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
    });
    if (!response.ok) throw new Error(`Generate stream failed: ${response.statusText}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No reader available');

    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim()) {
            yield JSON.parse(line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async chat(request: ChatRequest): Promise<GenerateResponse> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Chat failed: ${response.statusText}`);
    return response.json();
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<GenerateResponse> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
    });
    if (!response.ok) throw new Error(`Chat stream failed: ${response.statusText}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No reader available');

    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim()) {
            yield JSON.parse(line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<ModelListResponse> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/tags`);
    if (!response.ok) throw new Error(`List models failed: ${response.statusText}`);
    return response.json();
  }

  async showModel(name: string): Promise<ModelInfoResponse> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`Show model failed: ${response.statusText}`);
    return response.json();
  }

  async pullModel(name: string, onProgress?: (progress: number) => void): Promise<void> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: true }),
    });
    if (!response.ok) throw new Error(`Pull model failed: ${response.statusText}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No reader available');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status === 'downloading' && data.total && data.completed) {
              onProgress?.(Math.round((data.completed / data.total) * 100));
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async deleteModel(name: string): Promise<void> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`Delete model failed: ${response.statusText}`);
  }

  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Embedding failed: ${response.statusText}`);
    return response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/tags`, {}, 5000);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
    try {
      const response = await this.fetchWithTimeout(`${OLLAMA_BASE}/api/version`, {}, 5000);
      if (!response.ok) return 'unknown';
      const data = await response.json();
      return data.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

export const api = new ApiService();