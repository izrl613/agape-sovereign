import { SovereignState } from '../../services/diffEngine';

export interface VectorResult {
  state: SovereignState;
  verified: boolean;
  details: string;
  timestamp: string;
}

export abstract class BaseVector {
  abstract vectorId: string;
  abstract name: string;

  /**
   * The core verification loop.
   */
  abstract verify(data: any): Promise<VectorResult>;

  /**
   * Ensures the vector maintains KNOXED status through recursive checks.
   */
  async runVerificationLoop(data: any): Promise<VectorResult> {
    const result = await this.verify(data);
    console.log(`[${this.name}] Loop Check: ${result.state}`);
    return result;
  }
}
