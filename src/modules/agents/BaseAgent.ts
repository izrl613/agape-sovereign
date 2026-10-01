/**
 * ============================================================
 * ARCHITECT AI — Base Identity Agent
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Abstract base class implementing shared logic for all 16 agents:
 *  - Firestore persistence of findings
 *  - AI-powered report generation via localAIService
 *  - Score calculation from findings
 *  - Timing / progress tracking
 *
 * Subclasses override `scan()` with module-specific logic.
 */

import {
  AgentConfig,
  AgentFinding,
  AgentResult,
  FindingStatus,
  IIdentityAgent,
  ScanProgressCallback,
} from './types';

import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { chatComplete } from '../../services/localAIService';

export abstract class BaseAgent implements IIdentityAgent {
  readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    // Override in subclass if agent needs warm-up (e.g. API key validation)
  }

  async shutdown(): Promise<void> {
    // Override in subclass if agent needs cleanup
  }

  // ── Main execution entry point ─────────────────────────────────────────────

  async execute(
    userId: string,
    email: string,
    params?: Record<string, string>,
    onProgress?: ScanProgressCallback
  ): Promise<AgentResult> {
    const start = performance.now();

    // Delegate to the module-specific scan implementation
    const findings = await this.scan(userId, email, params, onProgress);

    const scanDuration = Math.round(performance.now() - start);
    const counts = this.countByStatus(findings);
    const score = this.calculateScore(findings);

    const result: AgentResult = {
      moduleId: this.config.moduleId,
      vector: this.config.vector,
      findings,
      score,
      scanDuration,
      timestamp: new Date(),
      counts,
    };

    // Persist findings to Firestore
    await this.persistFindings(userId, result);

    return result;
  }

  // ── Abstract: subclasses implement this ────────────────────────────────────

  /**
   * Module-specific scan logic.
   * Must return an array of AgentFinding objects.
   */
  protected abstract scan(
    userId: string,
    email: string,
    params?: Record<string, string>,
    onProgress?: ScanProgressCallback
  ): Promise<AgentFinding[]>;

  // ── AI Report Generation ───────────────────────────────────────────────────

  async generateReport(findings: AgentFinding[]): Promise<string> {
    if (findings.length === 0) {
      return `## ${this.config.label}\n\nNo findings detected. Module status: **CLEAR**.`;
    }

    const nuked = findings.filter(f => f.status === 'NUKED');
    const knoxed = findings.filter(f => f.status === 'KNOXED');
    const monitored = findings.filter(f => f.status === 'MONITORED');

    const prompt = `You are the Architect AI — a sovereign identity security analyst.
Generate a concise security report for the "${this.config.label}" module (${this.config.vector}).

Module description: ${this.config.description}

Findings summary:
- NUKED (active exposures): ${nuked.length}
- KNOXED (secured): ${knoxed.length}  
- MONITORED (under observation): ${monitored.length}

Critical findings (NUKED):
${nuked.map(f => `• ${f.label}: ${f.detail}`).join('\n') || 'None'}

Secured findings (KNOXED):
${knoxed.map(f => `• ${f.label}: ${f.detail}`).join('\n') || 'None'}

Monitored findings:
${monitored.map(f => `• ${f.label}: ${f.detail}`).join('\n') || 'None'}

Generate a 3-paragraph report:
1. Executive summary with risk level
2. Critical findings requiring immediate action
3. Recommended remediation steps

Use professional security analyst tone. Be specific and actionable.`;

    try {
      const report = await chatComplete(prompt);
      return report;
    } catch (err) {
      console.warn(`[${this.config.moduleId}] AI report generation failed, using fallback`, err);
      return this.fallbackReport(findings);
    }
  }

  // ── Score Calculation ──────────────────────────────────────────────────────

  /**
   * Calculate a 0–100 score from findings.
   * Higher = more secure.
   * Formula: (knoxed_points) / (total_points) * 100
   */
  protected calculateScore(findings: AgentFinding[]): number {
    if (findings.length === 0) return 100;

    const counts = this.countByStatus(findings);
    const totalPoints = findings.length * 10;
    const earnedPoints = counts.knoxed * 10 + counts.monitored * 5;

    return Math.round(Math.min(100, Math.max(0, (earnedPoints / totalPoints) * 100)));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  protected countByStatus(findings: AgentFinding[]): {
    nuked: number;
    knoxed: number;
    monitored: number;
  } {
    return {
      nuked: findings.filter(f => f.status === 'NUKED').length,
      knoxed: findings.filter(f => f.status === 'KNOXED').length,
      monitored: findings.filter(f => f.status === 'MONITORED').length,
    };
  }

  /**
   * Persist scan findings to Firestore `diff_scans` collection.
   * Compatible with existing ScanContext snapshot listener.
   */
  protected async persistFindings(userId: string, result: AgentResult): Promise<void> {
    const ref = collection(db, 'diff_scans');

    for (const finding of result.findings) {
      try {
        await addDoc(ref, {
          userId,
          module: result.moduleId,
          finding: finding.label,
          details: finding.detail,
          status: finding.status,
          severity: finding.severity,
          remediation: finding.remediation || '',
          source: finding.source || this.config.label,
          vector: result.vector,
          score: result.score,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error(`[${this.config.moduleId}] Failed to persist finding:`, err);
      }
    }
  }

  /**
   * Fallback report when AI inference is unavailable.
   */
  private fallbackReport(findings: AgentFinding[]): string {
    const counts = this.countByStatus(findings);
    const score = this.calculateScore(findings);
    const sevColor = score > 80 ? '🟢' : score > 60 ? '🟡' : '🔴';

    let report = `## ${this.config.label} (${this.config.vector})\n\n`;
    report += `**Sovereign Score:** ${sevColor} ${score}/100\n\n`;
    report += `| Status | Count |\n|--------|-------|\n`;
    report += `| 🔴 NUKED | ${counts.nuked} |\n`;
    report += `| 🟢 KNOXED | ${counts.knoxed} |\n`;
    report += `| 🟡 MONITORED | ${counts.monitored} |\n\n`;

    if (counts.nuked > 0) {
      report += `### Critical Exposures\n\n`;
      findings
        .filter(f => f.status === 'NUKED')
        .forEach(f => {
          report += `- **${f.label}**: ${f.detail}\n`;
          if (f.remediation) report += `  - *Remediation:* ${f.remediation}\n`;
        });
    }

    return report;
  }

  /**
   * Helper to create a standardized finding object.
   */
  protected createFinding(
    status: FindingStatus,
    label: string,
    detail: string,
    severity: number,
    options?: {
      remediation?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    }
  ): AgentFinding {
    return {
      status,
      label,
      detail,
      severity: Math.min(100, Math.max(0, severity)),
      remediation: options?.remediation,
      source: options?.source,
      metadata: options?.metadata,
    };
  }
}
