import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export class BackendManager {
  private process: ChildProcess | null = null;
  private port: number;
  private ollamaUrl: string;
  private status: 'stopped' | 'starting' | 'running' | 'error' = 'stopped';
  private statusListeners: ((status: string) => void)[] = [];

  constructor(port: number, ollamaUrl: string) {
    this.port = port;
    this.ollamaUrl = ollamaUrl;
  }

  async start(): Promise<void> {
    if (this.status === 'running' || this.status === 'starting') {
      return;
    }

    this.status = 'starting';
    this.notifyStatusChange();

    return new Promise((resolve, reject) => {
      const backendPath = path.join(__dirname, '..', '..', '..', 'backend', 'dist', 'index.js');
      
      this.process = spawn('node', [backendPath], {
        env: {
          ...process.env,
          PORT: this.port.toString(),
          OLLAMA_HOST: this.ollamaUrl,
          NODE_ENV: 'production'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.process.stdout?.on('data', (data) => {
        console.log(`[Backend] ${data.toString().trim()}`);
        if (data.toString().includes('started on') || data.toString().includes('listening')) {
          this.status = 'running';
          this.notifyStatusChange();
          resolve();
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`);
      });

      this.process.on('error', (error) => {
        this.status = 'error';
        this.notifyStatusChange();
        reject(error);
      });

      this.process.on('exit', (code) => {
        this.status = 'stopped';
        this.process = null;
        this.notifyStatusChange();
        if (code !== 0) {
          console.error(`Backend exited with code ${code}`);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.status === 'starting') {
          this.status = 'error';
          this.notifyStatusChange();
          reject(new Error('Backend startup timeout'));
        }
      }, 10000);
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.status = 'stopped';
    this.notifyStatusChange();
  }

  getStatus(): string {
    return this.status;
  }

  getPort(): number {
    return this.port;
  }

  onStatusChange(listener: (status: string) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  private notifyStatusChange(): void {
    this.statusListeners.forEach(listener => listener(this.status));
  }
}