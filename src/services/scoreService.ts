/**
 * Sovereign Score Engine
 * Computes the real-time percentage of digital sovereignty.
 */

import { SovereignState } from './diffEngine';

export interface VectorWeight {
  weight: number;
  state: SovereignState;
}

export class SovereignScoreService {
  // Weighting factors as per spec: Hardware Passkey (+20%), Zero breaches (+20%), etc.
  private static readonly WEIGHTS: Record<string, number> = {
    'comm_passkeys': 0.20,
    'comm_email': 0.20,
    'hard_local': 0.10,
    'hard_network': 0.10,
    'fin_identity': 0.10,
    'social_brokers': 0.10,
    'social_deepweb': 0.10,
    'fin_legal': 0.10,
  };

  static calculateScore(vectorStates: Map<string, SovereignState>): number {
    let totalWeight = 0;
    let knoxedWeight = 0;

    vectorStates.forEach((state, vectorId) => {
      const weight = this.WEIGHTS[vectorId] || 0.05; // Default weight
      totalWeight += weight;
      if (state === SovereignState.KNOXED) {
        knoxedWeight += weight;
      }
    });

    return Math.round((knoxedWeight / totalWeight) * 100);
  }
}
