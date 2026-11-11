/**
 * @deprecated Legacy DIFF engine retained for backward compatibility.
 *
 * `checkExposure()` in this file is a mock (non-cryptographic randomness) and
 * must not be used for real scans. Use `src/services/secureAutomationService.ts`
 * (backed by `agents/secure/`) for the secure, receipt-bearing pipeline.
 */
import { RemediationDispatcher, RemediationAction } from './remediationService';

export enum SovereignState {
  NUKED = 'NUKED',
  KNOXED = 'KNOXED',
}

export interface VectorState {
  vectorId: string;
  state: SovereignState;
  lastVerified: string;
  remediationId?: string;
}

export class DIFFEngine {
  private remediation = new RemediationDispatcher();

  /**
   * Evaluates a data point and assigns a sovereign state.
   */
  async evaluateVector(vectorId: string, data: any): Promise<VectorState> {
    const isExposed = await this.checkExposure(vectorId, data);

    if (isExposed) {
      // Trigger NUKED state and dispatch remediation
      const rem = await this.remediation.dispatchRemediation(
        vectorId, 
        RemediationAction.DATA_BROKER_DELETE, 
        data
      );
      
      return {
        vectorId,
        state: SovereignState.NUKED,
        lastVerified: new Date().toISOString(),
        remediationId: rem.id,
      };
    }

    return {
      vectorId,
      state: SovereignState.KNOXED,
      lastVerified: new Date().toISOString(),
    };
  }

  private async checkExposure(vectorId: string, data: any): Promise<boolean> {
    // Simulated exposure check
    return Math.random() > 0.7; 
  }
}
