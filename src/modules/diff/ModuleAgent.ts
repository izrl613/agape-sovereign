import { BaseVector, VectorResult } from './BaseVector';
import { SovereignEncryption } from '../../lib/encryption';

export interface ModuleAgentState {
  sha256Id: string;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  state: 'NUKED' | 'KNOXED' | 'MONITORED';
}

export abstract class ModuleAgent extends BaseVector {
  private state: ModuleAgentState | null = null;

  /**
   * Computes the unique SHA256ID for the module as per the spec:
   * SHA-256(ModuleID + NormalizedUserInput + UserSalt)
   */
  async generateModuleId(userId: string, input: string, salt: string): Promise<string> {
    const msg = `${this.vectorId}:${input}:${salt}`;
    const msgUint8 = new TextEncoder().encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypts the module's user data using the Sovereign DEK.
   */
  async lockModuleData(data: string, dek: CryptoKey): Promise<void> {
    const { ciphertext, iv } = await SovereignEncryption.encryptPII(data, dek);
    const sha256Id = await this.generateModuleId('user_id', data, 'user_salt');
    
    this.state = {
      sha256Id,
      encryptedData: ciphertext,
      iv,
      state: 'KNOXED',
    };
  }

  async getState() {
    return this.state;
  }
}
