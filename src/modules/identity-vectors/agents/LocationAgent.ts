import { EncryptionAgent } from '../EncryptionAgent';

export class LocationAgent extends EncryptionAgent {
  constructor() {
    super('agent_loc_alpha', 'Location');
  }

  async processAndEncrypt(data: unknown): Promise<string> {
    const entropy = crypto.getRandomValues(new Uint32Array(2));
    const sealed = await super.processAndEncrypt({
      payload: data,
      csprngSalt: `${entropy[0].toString(16)}-${entropy[1].toString(16)}`,
    });
    return `GEO_${sealed}`;
  }
}
