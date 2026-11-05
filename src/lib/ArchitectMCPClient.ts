/**
 * Architect MCP Client
 * Bridge between the UI thread and the Nano-MCP Web Worker.
 */

export class ArchitectMCPClient {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL('../workers/mcp-server.worker.ts', import.meta.url));
  }

  private async sendRequest(type: 'TOKENIZE' | 'HASH' | 'AI_QUERY', payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        const response = event.data;
        if (response.status === 'success') {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      };

      this.worker.addEventListener('message', handler, { once: true });
      this.worker.postMessage({ type, payload });
    });
  }

  async computeHash(moduleId: string, input: string, salt: string): Promise<string> {
    return this.sendRequest('HASH', { moduleId, input, salt });
  }

  async tokenize(data: any): Promise<any> {
    return this.sendRequest('TOKENIZE', { data });
  }

  async askAI(prompt: string, context: any): Promise<any> {
    return this.sendRequest('AI_QUERY', { prompt, context });
  }

  terminate() {
    this.worker.terminate();
  }
}

export const mcpClient = new ArchitectMCPClient();
