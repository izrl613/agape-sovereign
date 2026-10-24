import crypto from 'crypto';

export abstract class BaseAgent {
  protected abstract moduleId: string;
  protected abstract verificationApiUrl: string;

  /**
   * Primary entry point for data submission.
   */
  async processAndHandoff(userId: string, data: any[]) {
    console.log(`[${this.moduleId}] Processing data for user ${userId}`);

    // 1. Verify each account
    const verifiedData = await Promise.all(
      data.map(async (item) => {
        const isVerified = await this.verify(item);
        return { ...item, verified: isVerified, timestamp: new Date().toISOString() };
      })
    );

    // 2. Encrypt the aggregated data
    const encryptedPacket = this.encrypt(verifiedData);

    // 3. Handoff to Architect AI
    await this.handoffToArchitectAI(userId, encryptedPacket);

    return { success: true, status: 'Handoff complete' };
  }

  protected async verify(item: any): Promise<boolean> {
    console.log(`[${this.moduleId}] Verifying item via ${this.verificationApiUrl}...`);
    // Actual verification logic should be implemented in the inheriting class
    return false;
  }

  protected encrypt(data: any): string {
    const secret = process.env.AGENT_ENCRYPTION_KEY || 'default-secret-key-32-chars-long!!';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret), iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  private async handoffToArchitectAI(userId: string, packet: string) {
    console.log(`[${this.moduleId}] Sending encrypted packet to Architect AI for user ${userId}`);
    return { success: true };
  }
}
