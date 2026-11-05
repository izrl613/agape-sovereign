import { SovereignState, VectorStatus } from '../modules/diff/DiffEngine';

/**
 * Sovereign Score Engine
 * Dynamically computes the project's security percentage based on weighted vector states.
 */

export class SovereignScore {
  private static readonly WEIGHTS: Record<string, number> = {
    'comm_1': 0.20, // Email Breach Scanner
    'comm_4': 0.20, // Universal Passkey Registry
    // Distribute remaining 60% across the other 14 vectors (~4.28% each)
  };

  static calculateScore(statuses: Record<string, VectorStatus>): number {
    let weightedKnoxed = 0;
    let totalWeight = 0;

    Object.entries(statuses).forEach(([vectorId, status]) => {
      const weight = this.WEIGHTS[vectorId] || 0.60 / 14;
      
      if (status.state === 'KNOXED') {
        weightedKnoxed += weight;
      }
      totalWeight += weight;
    });

    if (totalWeight === 0) return 0;
    return Math.round((weightedKnoxed / totalWeight) * 100);
  }
}
