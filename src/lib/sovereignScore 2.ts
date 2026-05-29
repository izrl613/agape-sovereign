/**
 * ============================================================
 * ARCHITECT AI — Sovereign Score Engine
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Dynamic 0-100 privacy posture calculation
 * Based on 16 DIFF module vectors with weighted scoring
 */

export interface ModuleScore {
  moduleId: string;
  moduleName: string;
  severity: number; // 0-100
  nukedCount: number;
  knoxedCount: number;
  monitoredCount: number;
  weight: number; // Percentage: 0-100
}

export interface SovereignScoreResult {
  totalScore: number; // 0-100
  tier: 'KNOXED_SOVEREIGN' | 'PARTIALLY_SECURED' | 'EXPOSURE_RISK' | 'CRITICALLY_NUKED';
  tierColor: string;
  moduleScores: ModuleScore[];
  breakdown: {
    [moduleId: string]: number;
  };
  criticalModules: string[];
  recommendations: string[];
  lastUpdated: number;
}

// ─── Module Weight Configuration ─────────────────────────────
export const MODULE_WEIGHTS: { [key: string]: number } = {
  'email-breach': 0.12, // 12%
  'data-broker': 0.12, // 12%
  'dark-web': 0.12, // 12%
  'credential-strength': 0.1, // 10%
  'device-security': 0.1, // 10%
  'social-media': 0.08, // 8%
  'network-security': 0.08, // 8%
  'cloud-storage': 0.07, // 7%
  'financial-identity': 0.07, // 7%
  'oauth-audit': 0.05, // 5%
  'communication-privacy': 0.04, // 4%
  'identity-documents': 0.03, // 3%
  'public-records': 0.01, // 1%
  'ai-biometric': 0.01, // 1%
};

// ─── Score Tier Configuration ───────────────────────────────
export const SCORE_TIERS = [
  { min: 85, max: 100, tier: 'KNOXED_SOVEREIGN', color: '#00D4FF' }, // Neon Cyan
  { min: 65, max: 84, tier: 'PARTIALLY_SECURED', color: '#FF7A18' }, // Neon Orange
  { min: 40, max: 64, tier: 'EXPOSURE_RISK', color: '#FF2E9F' }, // Neon Magenta
  { min: 0, max: 39, tier: 'CRITICALLY_NUKED', color: '#FF0000' }, // Red
];

/**
 * Calculate module risk score (inverse of security posture)
 */
const calculateModuleRisk = (module: ModuleScore): number => {
  const totalFindings = module.nukedCount + module.monitoredCount + module.knoxedCount;

  if (totalFindings === 0) {
    return 0; // No findings = no risk
  }

  // Weight: NUKED items heavily, MONITORED items moderately, KNOXED items lightly
  const nukedWeight = module.nukedCount * 0.9;
  const monitoredWeight = module.monitoredCount * 0.5;
  const knoxedWeight = module.knoxedCount * 0.1;

  const weightedRisk = (nukedWeight + monitoredWeight + knoxedWeight) / totalFindings;

  // Normalize to 0-100
  return Math.round(weightedRisk * 100);
};

/**
 * Calculate Sovereign Score from module data
 */
export const calculateSovereignScore = (modules: ModuleScore[]): SovereignScoreResult => {
  let totalWeightedRisk = 0;
  const breakdown: { [key: string]: number } = {};
  const criticalModules: string[] = [];

  // Calculate weighted risk for each module
  modules.forEach((module) => {
    const moduleRisk = calculateModuleRisk(module);
    const weight = MODULE_WEIGHTS[module.moduleId] || 0.05; // Default 5% if not specified

    const contribution = moduleRisk * weight;
    totalWeightedRisk += contribution;

    breakdown[module.moduleId] = moduleRisk;

    // Flag modules with high risk (>70%)
    if (moduleRisk > 70) {
      criticalModules.push(module.moduleName);
    }
  });

  // Sovereign Score = 100 - (weighted risk sum)
  const sovereignScore = Math.max(0, Math.min(100, 100 - Math.round(totalWeightedRisk)));

  // Determine tier
  const tierConfig = SCORE_TIERS.find(
    (t) => sovereignScore >= t.min && sovereignScore <= t.max
  );

  const tier = (tierConfig?.tier || 'EXPOSURE_RISK') as
    | 'KNOXED_SOVEREIGN'
    | 'PARTIALLY_SECURED'
    | 'EXPOSURE_RISK'
    | 'CRITICALLY_NUKED';
  const tierColor = tierConfig?.color || '#FF2E9F';

  // Generate recommendations
  const recommendations = generateRecommendations(modules, sovereignScore);

  return {
    totalScore: sovereignScore,
    tier,
    tierColor,
    moduleScores: modules,
    breakdown,
    criticalModules,
    recommendations,
    lastUpdated: Date.now(),
  };
};

/**
 * Generate actionable recommendations based on score and modules
 */
const generateRecommendations = (modules: ModuleScore[], score: number): string[] => {
  const recommendations: string[] = [];

  if (score < 40) {
    recommendations.push(
      '🔥 CRITICAL: Immediate action required on multiple NUKED exposures'
    );
  }

  // Check for high-risk modules
  const highRiskModules = modules.filter((m) => calculateModuleRisk(m) > 70);

  if (highRiskModules.length > 0) {
    highRiskModules.slice(0, 3).forEach((module) => {
      if (module.nukedCount > 5) {
        recommendations.push(`Initiate data broker removal process for ${module.moduleName}`);
      }
      if (module.monitoredCount > 0) {
        recommendations.push(
          `Review and secure ${module.monitoredCount} monitored items in ${module.moduleName}`
        );
      }
    });
  }

  // Email breach recommendations
  const emailModule = modules.find((m) => m.moduleId === 'email-breach');
  if (emailModule && emailModule.nukedCount > 0) {
    recommendations.push(
      `Rotate passwords for ${emailModule.nukedCount} breached email accounts`
    );
  }

  // Data broker recommendations
  const brokerModule = modules.find((m) => m.moduleId === 'data-broker');
  if (brokerModule && brokerModule.nukedCount > 3) {
    recommendations.push('File ECRA 2026 compliant data subject removal requests');
  }

  // Device security recommendations
  const deviceModule = modules.find((m) => m.moduleId === 'device-security');
  if (deviceModule && calculateModuleRisk(deviceModule) > 50) {
    recommendations.push('Enable full disk encryption and update OS to latest version');
  }

  // Network security recommendations
  const networkModule = modules.find((m) => m.moduleId === 'network-security');
  if (networkModule && networkModule.monitoredCount > 0) {
    recommendations.push('Enable DNS-over-HTTPS and deploy zero-trust VPN');
  }

  // Dark web recommendations
  const darkWebModule = modules.find((m) => m.moduleId === 'dark-web');
  if (darkWebModule && darkWebModule.nukedCount > 0) {
    recommendations.push('Activate identity protection PIN with Social Security Administration');
  }

  // Positive affirmations for high scores
  if (score >= 85) {
    recommendations.push('✓ Your digital sovereignty is KNOXED. Maintain current security posture.');
  } else if (score >= 65) {
    recommendations.push('➜ Incrementally improve vectors with low scores (< 60%) for optimal security.');
  }

  return recommendations.slice(0, 6); // Top 6 recommendations
};

/**
 * Update a single module's score and recalculate total
 */
export const updateModuleAndRecalculate = (
  modules: ModuleScore[],
  updatedModule: ModuleScore
): SovereignScoreResult => {
  const updatedModules = modules.map((m) =>
    m.moduleId === updatedModule.moduleId ? updatedModule : m
  );

  return calculateSovereignScore(updatedModules);
};

/**
 * Get score change delta for UI notification
 */
export const calculateScoreDelta = (
  previousScore: number,
  newScore: number
): {
  delta: number;
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
} => {
  const delta = newScore - previousScore;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
  const percentage = (delta / previousScore) * 100;

  return {
    delta: Math.abs(delta),
    direction,
    percentage,
  };
};

/**
 * Calculate projected score if a module is fully secured
 */
export const projectScoreIfFixed = (
  modules: ModuleScore[],
  targetModuleId: string
): number => {
  const projectedModules = modules.map((m) => {
    if (m.moduleId === targetModuleId) {
      // Assume all nuked items become knoxed
      return {
        ...m,
        nukedCount: 0,
        knoxedCount: m.knoxedCount + m.nukedCount,
        monitoredCount: 0,
      };
    }
    return m;
  });

  const result = calculateSovereignScore(projectedModules);
  return result.totalScore;
};

/**
 * Export score data for PDF report
 */
export const exportScoreForReport = (score: SovereignScoreResult) => {
  return {
    sovereignScore: score.totalScore,
    tier: score.tier,
    tierColor: score.tierColor,
    breakdown: score.breakdown,
    criticalModules: score.criticalModules,
    recommendations: score.recommendations,
    reportedAt: new Date(score.lastUpdated).toISOString(),
  };
};
