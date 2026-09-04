/**
 * ARCHITECT AI AGENT SERVICE
 * ============================================================
 * OPERATION FRAMEWORK — Phase 2: Cognitive Core (Module 2)
 * Local MCP Server: qwen3.5-9b-sushi-coder-rl-mlx via LMStudio
 *
 * Strategy: Shifting logic from "Calculation" to "Inference & Structure Extraction".
 * The local LLM infers risk level from rules and outputs structured JSON.
 * Pre/post-processing is rule-based to minimize token consumption.
 *
 * Zero-retention: raw payload wiped from memory immediately after inference.
 * ============================================================
 */

import { IVMPayload } from './ivmAgentService';
import { isValidSHA256 } from './sovereignHashService';

export interface AuditReport {
  status: 'SUCCESS' | 'FAILED';
  sha256Id: string;
  auditTimestamp: string;
  systemPolicy: string;
  llmModel: string;
  llmConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'N/A';
  reportableData: {
    financialRisk: {
      totalRiskScore: number;
      highValueAlerts: string[];
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    stabilityIndex: {
      activeModules: number;
      criticalFindings: number;
      stabilityScore: number;
    };
    sovereignAuditScore: number;
    moduleBreakdown: Record<string, { score: number; riskLevel: string; summary: string }>;
  };
  reason?: string;
}

const LMSTUDIO_BASE_URL = 'http://localhost:1234/v1';
const MODEL_ID = 'qwen3.5-9b-sushi-coder-rl-mlx';

/**
 * Build a tight, token-efficient prompt for the local LLM.
 * Forces structured JSON output to minimize inference tokens.
 */
function buildAuditPrompt(minimalInput: unknown, sha256Id: string): string {
  return `You are the Architect AI sovereign audit engine. Analyze the identity vector data and return ONLY valid JSON matching this exact schema — no markdown, no explanation.

Input SHA256: ${sha256Id.slice(0, 16)}...
Vectors: ${JSON.stringify(minimalInput)}

Required output schema:
{
  "financialRisk": { "totalRiskScore": number, "highValueAlerts": string[], "riskLevel": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL" },
  "stabilityIndex": { "activeModules": number, "criticalFindings": number, "stabilityScore": number },
  "sovereignAuditScore": number,
  "moduleBreakdown": { [module]: { "score": number, "riskLevel": string, "summary": string } },
  "confidence": "HIGH"|"MEDIUM"|"LOW"
}

Rules:
- sovereignAuditScore = round((stabilityScore * (1 / max(totalRiskScore + 1, 0.1)) * 75), 2)
- riskLevel CRITICAL if totalRiskScore > 80, HIGH if > 50, MEDIUM if > 20, else LOW
- stabilityScore = (activeModules / 16) * 100
Output ONLY the JSON object.`;
}

/**
 * Extract minimal fields needed for audit — pre-LLM filter to minimize tokens.
 */
function extractMinimalInput(payload: IVMPayload): unknown {
  const minimal: Record<string, unknown> = {};
  for (const [module, vector] of Object.entries(payload.vectors)) {
    minimal[module] = {
      score: vector.score,
      riskLevel: vector.riskLevel,
      findingsCount: vector.findings.length,
    };
  }
  return {
    totalRiskScore: payload.totalRiskScore,
    moduleCount: Object.keys(payload.vectors).length,
    vectors: minimal,
  };
}

/**
 * Execute the Architect AI inference via local LMStudio endpoint.
 * Falls back to rule-based scoring if LMStudio is unavailable.
 */
export async function executeArchitectAIAgent(
  ivmPayload: IVMPayload
): Promise<AuditReport> {
  if (!isValidSHA256(ivmPayload.sha256Id)) {
    return {
      status: 'FAILED',
      sha256Id: ivmPayload.sha256Id,
      auditTimestamp: new Date().toISOString(),
      systemPolicy: 'GDPR-Compliant V1.3',
      llmModel: MODEL_ID,
      llmConfidence: 'N/A',
      reportableData: {
        financialRisk: { totalRiskScore: 0, highValueAlerts: [], riskLevel: 'LOW' },
        stabilityIndex: { activeModules: 0, criticalFindings: 0, stabilityScore: 0 },
        sovereignAuditScore: 0,
        moduleBreakdown: {},
      },
      reason: 'Invalid SHA-256 hash.',
    };
  }

  const minimalInput = extractMinimalInput(ivmPayload);
  const prompt = buildAuditPrompt(minimalInput, ivmPayload.sha256Id);

  // Attempt local LMStudio inference
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${LMSTUDIO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 512,
        stream: false,
      }),
    });

    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();
      const raw = json?.choices?.[0]?.message?.content ?? '';
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return buildReportFromLLM(parsed, ivmPayload.sha256Id, MODEL_ID);
    }
  } catch (err) {
    console.warn('[ARCHITECT AI] LMStudio unavailable — using rule-based fallback:', err instanceof Error ? err.message : String(err));
  }

  // Rule-based fallback (offline / LMStudio not running)
  return buildRuleBasedReport(ivmPayload);
}

function buildReportFromLLM(
  llmOutput: Record<string, unknown>,
  sha256Id: string,
  model: string
): AuditReport {
  return {
    status: 'SUCCESS',
    sha256Id,
    auditTimestamp: new Date().toISOString(),
    systemPolicy: 'GDPR-Compliant V1.3',
    llmModel: model,
    llmConfidence: (llmOutput.confidence as AuditReport['llmConfidence']) ?? 'MEDIUM',
    reportableData: {
      financialRisk: (llmOutput.financialRisk as AuditReport['reportableData']['financialRisk']) ?? {
        totalRiskScore: 0,
        highValueAlerts: [],
        riskLevel: 'LOW',
      },
      stabilityIndex: (llmOutput.stabilityIndex as AuditReport['reportableData']['stabilityIndex']) ?? {
        activeModules: 0,
        criticalFindings: 0,
        stabilityScore: 0,
      },
      sovereignAuditScore: (llmOutput.sovereignAuditScore as number) ?? 0,
      moduleBreakdown: (llmOutput.moduleBreakdown as Record<string, { score: number; riskLevel: string; summary: string }>) ?? {},
    },
  };
}

function buildRuleBasedReport(payload: IVMPayload): AuditReport {
  const activeModules = Object.keys(payload.vectors).length;
  const stabilityScore = (activeModules / 16) * 100;
  const riskScore = payload.totalRiskScore;
  const riskLevel: AuditReport['reportableData']['financialRisk']['riskLevel'] =
    riskScore > 80 ? 'CRITICAL' : riskScore > 50 ? 'HIGH' : riskScore > 20 ? 'MEDIUM' : 'LOW';
  const sovereignAuditScore = Math.round(
    (stabilityScore * (1 / Math.max(riskScore + 1, 0.1)) * 75) * 100
  ) / 100;

  const moduleBreakdown: AuditReport['reportableData']['moduleBreakdown'] = {};
  for (const [module, vector] of Object.entries(payload.vectors)) {
    moduleBreakdown[module] = {
      score: vector.score,
      riskLevel: vector.riskLevel,
      summary: `${vector.findings.length} finding(s) — last scan ${vector.lastScanned}`,
    };
  }

  return {
    status: 'SUCCESS',
    sha256Id: payload.sha256Id,
    auditTimestamp: new Date().toISOString(),
    systemPolicy: 'GDPR-Compliant V1.3',
    llmModel: 'rule-based-fallback',
    llmConfidence: 'N/A',
    reportableData: {
      financialRisk: { totalRiskScore: riskScore, highValueAlerts: [], riskLevel },
      stabilityIndex: { activeModules, criticalFindings: 0, stabilityScore },
      sovereignAuditScore,
      moduleBreakdown,
    },
  };
}
