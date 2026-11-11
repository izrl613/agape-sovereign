/**
 * Identity Vector Registry Plugin
 *
 * Exposes the canonical vector table and probe discovery. It performs no
 * scanning itself and handles no PII — it is pure metadata + scoring.
 */

import type {
  PluginContext,
  PluginManifest,
  SovereignPlugin,
} from '../plugin-contract.ts';
import {
  IDENTITY_VECTORS,
  findVector,
  assertCompleteRegistry,
} from '../../agents/secure/vectors.ts';
import { listProbes, type ProbeFinding } from '../../agents/secure/probes.ts';
import { scoreFindings } from '../../agents/secure/orchestrator.ts';

export const identityVectorsPlugin: SovereignPlugin = {
  manifest: {
    id: 'identity-vectors',
    name: 'Identity Vector Registry',
    version: '1.0.0',
    description:
      'Canonical 16-vector registry, probe discovery, and finding scoring.',
    entry: './index.ts',
    capabilities: ['vectors.list', 'vectors.get', 'vectors.probes', 'vectors.score'],
    security: {
      zeroKnowledge: true,
      handlesPii: false,
      requiresSecrets: false,
    },
  } satisfies PluginManifest,

  activate(context: PluginContext): void {
    context.registerTool('vectors.list', () => {
      assertCompleteRegistry();
      return IDENTITY_VECTORS;
    });

    context.registerTool('vectors.get', (args) => {
      const key = args.key;
      if (typeof key !== 'string' || key.length === 0) {
        throw new Error('vectors.get: "key" must be a vector label or module id');
      }
      const vector = findVector(key);
      if (!vector) throw new Error(`vectors.get: unknown vector "${key}"`);
      return vector;
    });

    context.registerTool('vectors.probes', () =>
      listProbes().map((probe) => ({
        id: probe.id,
        moduleId: probe.moduleId,
        description: probe.description,
      })),
    );

    context.registerTool('vectors.score', (args) => {
      const findings = args.findings;
      if (!Array.isArray(findings)) {
        throw new Error('vectors.score: "findings" must be an array');
      }
      return { score: scoreFindings(findings as ProbeFinding[]) };
    });
  },
};

export default identityVectorsPlugin;
