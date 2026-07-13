/**
 * Architect AI — MCP Client for the Agape Sovereign PWA
 *
 * Connects to the local architect-mcp-server (http://127.0.0.1:3001)
 * via HTTP/SSE transport. Works fully offline as long as Ollama is running.
 *
 * Usage:
 *   const client = ArchitectMCPClient.getInstance();
 *   const answer = await client.ask("Is my email on any breach lists?");
 */

const MCP_BASE_URL = "http://127.0.0.1:3001";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type UserLevel = "beginner" | "intermediate" | "expert";

export interface HealthStatus {
  status: "ok" | "degraded" | "offline";
  model: string;
  ollamaReachable: boolean;
  timestamp: string;
}

export interface MCPTextResult {
  text: string;
  error?: string;
}

// ── JSON-RPC helpers ──────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
  error?: { code: number; message: string; data?: unknown };
}

// ── Client class ──────────────────────────────────────────────────────────────

export class ArchitectMCPClient {
  private static instance: ArchitectMCPClient | null = null;

  private sessionId: string | null = null;
  private eventSource: EventSource | null = null;
  private pendingRequests = new Map<
    number,
    { resolve: (v: string) => void; reject: (e: Error) => void }
  >();
  private requestCounter = 0;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): ArchitectMCPClient {
    if (!ArchitectMCPClient.instance) {
      ArchitectMCPClient.instance = new ArchitectMCPClient();
    }
    return ArchitectMCPClient.instance;
  }

  // ── Connection ──────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._connect();
    return this.initializationPromise;
  }

  private async _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const es = new EventSource(`${MCP_BASE_URL}/sse`);
      this.eventSource = es;

      es.addEventListener("message", (evt) => {
        try {
          const rpc = JSON.parse(evt.data) as JsonRpcResponse;
          const pending = this.pendingRequests.get(rpc.id);
          if (!pending) return;
          this.pendingRequests.delete(rpc.id);

          if (rpc.error) {
            pending.reject(new Error(rpc.error.message));
          } else if (rpc.result?.isError) {
            const text = rpc.result.content.map((c) => c.text).join("\n");
            pending.reject(new Error(text));
          } else {
            const text =
              rpc.result?.content
                .filter((c) => c.type === "text")
                .map((c) => c.text)
                .join("\n") ?? "";
            pending.resolve(text);
          }
        } catch {
          // non-JSON server-sent events (e.g., ping lines) — ignore
        }
      });

      // The SSE endpoint echoes back a sessionId as the first event
      es.addEventListener("open", async () => {
        // Extract sessionId from the SSE URL the server used when setting up the transport
        // The server sets the POST path as /message?sessionId=<uuid>
        // We detect it from the endpoint event the MCP SDK emits
      });

      es.addEventListener("endpoint", (evt: MessageEvent) => {
        // MCP SDK SSEServerTransport emits an "endpoint" event with the POST URL
        const postPath: string = evt.data;
        const url = new URL(postPath, MCP_BASE_URL);
        this.sessionId = url.searchParams.get("sessionId");
        this.initialized = true;
        resolve();
      });

      es.onerror = () => {
        if (!this.initialized) {
          reject(
            new Error(
              "Architect AI MCP server is not reachable. Run: ollama serve && cd architect-mcp-server && npm run dev"
            )
          );
        }
      };

      // Timeout after 5 s
      setTimeout(() => {
        if (!this.initialized) {
          es.close();
          reject(new Error("Architect AI MCP server connection timed out after 5 s."));
        }
      }, 5000);
    });
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.sessionId = null;
    this.initialized = false;
    this.initializationPromise = null;
    ArchitectMCPClient.instance = null;
  }

  // ── RPC core ──────────────────────────────────────────────────────────────

  private async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    await this.connect();

    if (!this.sessionId) {
      throw new Error("No MCP session established.");
    }

    const id = ++this.requestCounter;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: args },
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Timeout per tool call
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Tool "${name}" timed out after 120 s`));
      }, 120_000);

      fetch(`${MCP_BASE_URL}/message?sessionId=${this.sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }).catch((err) => {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      });

      const origResolve = resolve;
      const origReject = reject;
      this.pendingRequests.set(id, {
        resolve: (v) => { clearTimeout(timer); origResolve(v); },
        reject: (e) => { clearTimeout(timer); origReject(e); },
      });
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Check if the MCP server is reachable without establishing an SSE session */
  static async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch(`${MCP_BASE_URL}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as HealthStatus;
    } catch {
      return {
        status: "offline",
        model: "gemma4:e2b",
        ollamaReachable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /** General privacy/security question */
  async ask(question: string, context?: string): Promise<MCPTextResult> {
    try {
      const args: Record<string, unknown> = { question };
      if (context) args.context = context;
      const text = await this.callTool("ask", args);
      return { text };
    } catch (e) {
      return { text: "", error: (e as Error).message };
    }
  }

  /** Analyze a specific identity vector */
  async analyzeVector(params: {
    vectorId: string;
    vectorName: string;
    rawData: string;
    sovereignScore?: number;
  }): Promise<MCPTextResult> {
    try {
      const text = await this.callTool("analyze_identity_vector", {
        vector_id: params.vectorId,
        vector_name: params.vectorName,
        raw_data: params.rawData,
        ...(params.sovereignScore !== undefined
          ? { sovereign_score: params.sovereignScore }
          : {}),
      });
      return { text };
    } catch (e) {
      return { text: "", error: (e as Error).message };
    }
  }

  /** Generate a DIFF report audit recommendation */
  async generateAuditRecommendation(params: {
    finding: string;
    severity: Severity;
    affectedVectors: string[];
  }): Promise<MCPTextResult> {
    try {
      const text = await this.callTool("generate_audit_recommendation", {
        finding: params.finding,
        severity: params.severity,
        affected_vectors: params.affectedVectors,
      });
      return { text };
    } catch (e) {
      return { text: "", error: (e as Error).message };
    }
  }

  /** Explain a security concept for non-technical users */
  async explainConcept(
    concept: string,
    level: UserLevel = "beginner"
  ): Promise<MCPTextResult> {
    try {
      const text = await this.callTool("explain_security_concept", {
        concept,
        user_level: level,
      });
      return { text };
    } catch (e) {
      return { text: "", error: (e as Error).message };
    }
  }

  /** Ping the model — confirm end-to-end path is working */
  async healthCheck(): Promise<MCPTextResult> {
    try {
      const text = await this.callTool("health_check", {});
      return { text };
    } catch (e) {
      return { text: "", error: (e as Error).message };
    }
  }
}

// ── React hook (convenience) ──────────────────────────────────────────────────

export const architectClient = ArchitectMCPClient.getInstance;
