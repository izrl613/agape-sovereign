import { EncryptionAgent } from '../EncryptionAgent';

export class BiometricAgent extends EncryptionAgent {
  constructor() {
    super('agent_bio_sigma', 'Biometric');
  }

  async processAndEncrypt(data: unknown): Promise<string> {
    const sealed = await super.processAndEncrypt(data);
    return `BIO_${sealed}`;
  }
}
