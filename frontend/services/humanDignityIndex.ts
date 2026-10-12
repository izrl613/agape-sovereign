// Human Dignity Index Calculator — Agape Sovereign Engine
// Computes a 0–100 score measuring privacy preservation and rights enforcement.
// Based on: GDPR Article 16 (Right to Rectification), UDHR Article 12,
// and the Third-Party Data Rectification Protocol (2026-08-01).

/** Human Dignity Index score tiers */
export type HDITier = 
  | 'REJECTED'        // 0-40
  | 'BRONZE'          // 41-60
  | 'SILVER'          // 61-75
  | 'GOLD'            // 76-89
  | 'SOVEREIGN_RECTIFIED_GOLD'; // 90-100

/** HDI improvement sources */
export type HDISource = 
  | 'PRIVACY_PRESERVATION'   // +15 - client-side encryption & zero-knowledge
  | 'RECTIFICATION_RIGHT'    // +15 - GDPR Article 16 exercise
  | 'THIRD_PARTY_ATTESTATION' // +5  - Independent validator signing
  | 'MINIMAL_CONSENT'        // +5  - Minimal data collection protocol
  | 'DEFAULT';               // +0  - Base score

/** Base HDI calculation weights */
const HDI_WEIGHTS: Record<HDISource, number> = {
  [HDISource.PRIVACY_PRESERVATION]: 15,
  [HDISource.RECTIFICATION_RIGHT]: 15,
  [HDISource.THIRD_PARTY_ATTESTATION]: 5,
  [HDISource.MINIMAL_CONSENT]: 5,
  [HDISource.DEFAULT]: 0,
};

/** Calculate the Human Dignity Index score from contributing sources */
export function calculateHDI(sources: HDISource[]): { score: number; tier: HDITier; delta: number } {
  let baseScore = 0;
  const sourcesMet: HDISource[] = [];

  for (const source of sources) {
    const weight = HDI_WEIGHTS[source];
    if (weight > 0) {
      baseScore += weight;
      sourcesMet.push(source);
    }
  }

  // Determine tier
  let tier: HDITier;
  if (baseScore >= 90) {
    tier = 'SOVEREIGN_RECTIFIED_GOLD';
  } else if (baseScore >= 76) {
    tier = 'GOLD';
  } else if (baseScore >= 61) {
    tier = 'SILVER';
  } else if (baseScore >= 41) {
    tier = 'BRONZE';
  } else {
    tier = 'REJECTED';
  }

  // Delta is improvement from default (0), but we also compute a realistic delta
  // from a baseline of 50 (typical without special protections)
  const delta = baseScore - 50;

  return { score: Math.max(0, Math.min(100, baseScore)), tier, delta };
}

/** HDI contribution summary for display */
export interface HDIContribution {
  source: HDISource;
  label: string;
  points: number;
}

/** Generate human-readable HDI contribution breakdown */
export function getHDIContributions(sources: HDISource[]): HDIContribution[] {
  const seen = new Set<HDISource>();
  return sources
    .filter(s => !seen.has(s) && seen.add(s))
    .map(source => ({
      source,
      label: source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      points: HDI_WEIGHTS[source],
    }));
}

/** Export HDI status as structured object for API/serialization */
export interface HDIStatus {
  score: number;
  tier: HDITier;
  sources: HDISource[];
  contributions: HDIContribution[];
  timestamp: string;
  sovereignSessionId?: string;
  sha256Id?: string;
}

/** Default HDI status - base level without any special protections */
export const defaultHDI: HDIStatus = {
  score: 50,
  tier: 'BRONZE',
  sources: [HDISource.DEFAULT],
  contributions: [{ source: HDISource.DEFAULT, label: 'Default', points: 0 }],
  timestamp: new Date().toISOString(),
};

/** Improve an existing HDI status with new sources */
export function improveHDI(
  current: HDIStatus,
  newSources: HDISource[]
): HDIStatus {
  const allSources = [...new Set([...current.sources, ...newSources])];
  const { score, tier, delta } = calculateHDI(allSources);
  const contributions = getHDIContributions(allSources);

  return {
    ...current,
    score,
    tier,
    sources: allSources,
    contributions,
    timestamp: new Date().toISOString(),
  };
}

export type { HDITier, HDISource, HDIContribution, HDIStatus };