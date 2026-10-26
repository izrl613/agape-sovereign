export class EncryptionAgent {
  agentId: string;
  vectorType: string;
  logger?: (msg: string) => void;

  constructor(agentId: string, vectorType: string, logger?: (msg: string) => void) {
    this.agentId = agentId;
    this.vectorType = vectorType;
    this.logger = logger;
  }

  log(msg: string) {
    if (this.logger) this.logger(msg);
  }

  protected async sha256Hex(payload: string): Promise<string> {
    const bytes = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async processAndEncrypt(data: unknown): Promise<string> {
    this.log(`[Agent ${this.agentId}] Sealing ${this.vectorType} payload via AES-256-GCM...`);
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const seal = await this.sha256Hex(
      Array.from(new Uint8Array(cipherBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
    return `SHA256:${seal}`;
  }
}
