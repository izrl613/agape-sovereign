export interface Model {
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
}

export interface PullProgress {
  status: string;
  completed?: number;
  total?: number;
}

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async listModels(): Promise<Model[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.statusText}`);
    }
    const data = await response.json() as { models?: Model[] };
    return data.models || [];
  }

  async pullModel(name: string, onProgress?: (progress: number) => void): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: true })
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status === 'downloading' && data.total && data.completed) {
              const progress = Math.round((data.completed / data.total) * 100);
              onProgress?.(progress);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  async deleteModel(name: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete model: ${response.statusText}`);
    }
  }

  async generate(model: string, prompt: string, system?: string, stream?: boolean): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, system, stream: false })
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    return data.response;
  }

  async chat(model: string, messages: Array<{ role: string; content: string }>, stream?: boolean): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false })
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    const data = await response.json() as { message: { content: string } };
    return data.message.content;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      if (response.ok) {
        const data = await response.json() as { version?: string };
        return data.version || 'unknown';
      }
    } catch {
      // Ignore
    }
    return 'unknown';
  }
}