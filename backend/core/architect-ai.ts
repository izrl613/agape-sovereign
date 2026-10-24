import fs from 'fs';
import crypto from 'crypto';
import { passkeyHandler } from '../auth/passkey-handler';
import { sovereignMCP } from '../../mcp-server/server';

export interface IdentityPacket {
  moduleId: string;
  encryptedData: string;
  verificationToken: string;
  timestamp: string;
}

export class ArchitectAI {
  private storage = new Map<string, Map<string, IdentityPacket>>();
  private readonly MIN_VECTORS = 16;

  async collectPacket(userId: string, packet: IdentityPacket) {
    if (!this.storage.has(userId)) {
      this.storage.set(userId, new Map());
    }
    this.storage.get(userId)!.set(packet.moduleId, packet);
  }

  /**
   * REAL synthesis: Calls the local LLM via MCP Server
   */
  async synthesizeIdentity(userId: string) {
    const userStore = this.storage.get(userId);
    if (!userStore || userStore.size < this.MIN_VECTORS) {
      throw new Error(`Incomplete identity: ${userStore?.size || 0}/${this.MIN_VECTORS} vectors collected.`);
    }

    const vectors = Array.from(userStore.entries()).map(([mod, packet]) => ({
      module: mod,
      token: packet.verificationToken,
      timestamp: packet.timestamp
    }));

    const result = await sovereignMCP.handleRequest({
      tool: 'synthesize_identity',
      args: { vectors: vectors }
    });

    if (result.error) throw new Error(`Synthesis failed: ${result.error}`);

    return {
      summary: result.response,
      timestamp: new Date().toISOString(),
      modelUsed: 'qwen3-vl:4b'
    };
  }

  async finalizeReport(userId: string, authPayload: any) {
    const isVerified = await passkeyHandler.handleVerifyAuthentication(userId, authPayload)
      .catch(() => false);

    if (!isVerified) {
      throw new Error('Critical Security Failure: Passkey verification required.');
    }

    const synthesis = await this.synthesizeIdentity(userId);

    const reportPath = `/Users/aarondavid/Documents/agape-sovereign/reports/sovereign_report_${userId}.pdf`;
    this.generatePdf(userId, synthesis, reportPath);

    return {
      success: true,
      reportPath,
      hash: crypto.createHash('sha256').update(reportPath).digest('hex')
    };
  }

  private generatePdf(userId: string, synthesis: any, path: string) {
    const content = `
      =========================================
      SOVEREIGN DIGITAL IDENTITY REPORT
      =========================================
      User ID: ${userId}
      Status: FULLY VERIFIED (16/16 VECTORS)

      Synthesis from Architect AI:
      ${synthesis.summary}

      Timestamp: ${synthesis.timestamp}
      Model: ${synthesis.modelUsed}
      =========================================
    `;
    if (!fs.existsSync('/Users/aarondavid/Documents/agape-sovereign/reports')) {
      fs.mkdirSync('/Users/aarondavid/Documents/agape-sovereign/reports', { recursive: true });
    }
    fs.writeFileSync(path, content);
  }
}

export const architectAI = new ArchitectAI();
