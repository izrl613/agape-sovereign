/**
 * Sovereign Automation Plugin
 *
 * Wraps the secure orchestrator as plugin tools. Scans run client-side; the
 * produced artifact is ciphertext-only. Remediation is planned here but never
 * executed without an authenticated transport.
 */

import type {
  PluginContext,
  PluginManifest,
  SovereignPlugin,
} from '../plugin-contract.ts';
import {
  SovereignScanOrchestrator,
  type ScanOptions,
} from '../../agents/secure/orchestrator.ts';
import {
  verifyReceipt,
  type VerificationReceipt,
} from '../../agents/secure/receipts.ts';
import { remediationActionFor } from '../../agents/secure/remediation.ts';
import type { ProbeFinding } from '../../agents/secure/probes.ts';

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`automation: "${key}" must be a non-empty string`);
  }
  return value;
}

export const automationPlugin: SovereignPlugin = {
  manifest: {
    id: 'automation',
    name: 'Sovereign Automation',
    version: '1.0.0',
    description:
      'Orchestrated 16-vector scans, receipt verification, and fail-closed remediation planning.',
    entry: './index.ts',
    capabilities: [
      'automation.runScan',
      'automation.verifyReceipt',
      'automation.remediationPlan',
      'automation.policy',
    ],
    security: {
      zeroKnowledge: true,
      handlesPii: true,
      requiresSecrets: true,
    },
  } satisfies PluginManifest,

  activate(context: PluginContext): void {
    context.registerTool('automation.runScan', async (args) => {
      const options: ScanOptions = {
        userId: requireString(args, 'userId'),
        passkeySecret: requireString(args, 'passkeySecret'),
        recoverySecret: requireString(args, 'recoverySecret'),
        email: typeof args.email === 'string' ? args.email : undefined,
        params:
          args.params && typeof args.params === 'object'
            ? (args.params as Record<string, Record<string, string>>)
            : undefined,
        enableRemediation: args.enableRemediation === true,
      };
      const orchestrator = new SovereignScanOrchestrator();
      return orchestrator.run(options);
    });

    context.registerTool('automation.verifyReceipt', async (args) => {
      const receipt = args.receipt as VerificationReceipt;
      if (!receipt || typeof receipt !== 'object') {
        throw new Error('automation.verifyReceipt: "receipt" must be an object');
      }
      return { valid: await verifyReceipt(receipt, args.body) };
    });

    context.registerTool('automation.remediationPlan', (args) => {
      const vectors = args.vectors;
      if (!Array.isArray(vectors)) {
        throw new Error('automation.remediationPlan: "vectors" must be an array');
      }
      const plan: Array<{
        moduleId: string;
        action: string;
        reason: string;
        willExecute: false;
      }> = [];
      for (const vector of vectors as Array<Record<string, unknown>>) {
        const moduleId = typeof vector.moduleId === 'string' ? vector.moduleId : '';
        const findings = Array.isArray(vector.findings)
          ? (vector.findings as ProbeFinding[])
          : [];
        if (!moduleId) continue;
        if (findings.some((finding) => finding?.status === 'NUKED')) {
          plan.push({
            moduleId,
            action: remediationActionFor(moduleId),
            reason: 'Confirmed NUKED finding(s) with a valid receipt.',
            willExecute: false,
          });
        }
      }
      return {
        plan,
        note: 'Planning only. Execution requires an authenticated RemediationTransport. Default is fail-closed.',
      };
    });

    context.registerTool('automation.policy', () => ({
      zeroKnowledge: true,
      fabricatedFindings: 'forbidden',
      unconfiguredVectors: 'reported as MONITORED',
      receipts: 'SHA-256 per vector, re-verified after envelope round-trip',
      remediation: 'fail-closed unless an authenticated transport is supplied',
      secrets: 'in-memory only; never persisted or logged',
      cipher: 'AES-256-GCM (fixed)',
      kdf: 'PBKDF2-SHA-256, 210k iteration floor',
    }));
  },
};

export default automationPlugin;
