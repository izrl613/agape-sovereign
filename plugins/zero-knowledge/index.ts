/**
 * Zero-Knowledge Envelope Plugin
 *
 * Exposes the hardened envelope primitives as plugin tools. Secrets are used
 * in-memory only and are never persisted by the registry.
 */

import type {
  PluginContext,
  PluginManifest,
  SovereignPlugin,
} from '../plugin-contract.ts';
import {
  createEnvelope,
  openEnvelope,
  ENVELOPE_PARAMS,
  type EncryptedEnvelope,
} from '../../agents/secure/envelope.ts';

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`zk: "${key}" must be a non-empty string`);
  }
  return value;
}

export const zeroKnowledgePlugin: SovereignPlugin = {
  manifest: {
    id: 'zero-knowledge',
    name: 'Zero-Knowledge Envelope',
    version: '1.0.0',
    description:
      'AES-256-GCM envelope encryption with passkey + recovery dual-wrap. Plaintext never leaves the client.',
    entry: './index.ts',
    capabilities: ['zk.encrypt', 'zk.decrypt', 'zk.params'],
    security: {
      zeroKnowledge: true,
      handlesPii: true,
      requiresSecrets: true,
    },
  } satisfies PluginManifest,

  activate(context: PluginContext): void {
    context.registerTool('zk.params', () => ({
      cipher: ENVELOPE_PARAMS.cipher,
      kdf: ENVELOPE_PARAMS.kdf,
      iterations: ENVELOPE_PARAMS.iterations,
      minSecretLength: ENVELOPE_PARAMS.minSecretLength,
    }));

    context.registerTool('zk.encrypt', async (args) => {
      const passkeySecret = requireString(args, 'passkeySecret');
      const recoverySecret = requireString(args, 'recoverySecret');
      const payload = args.payload;
      return createEnvelope(payload, passkeySecret, recoverySecret);
    });

    context.registerTool('zk.decrypt', async (args) => {
      const secret = requireString(args, 'secret');
      const envelope = args.envelope as EncryptedEnvelope;
      if (!envelope || typeof envelope !== 'object') {
        throw new Error('zk: "envelope" must be an object');
      }
      const path = args.path === 'recovery' ? 'recovery' : 'passkey';
      return openEnvelope(envelope, secret, path);
    });
  },
};

export default zeroKnowledgePlugin;
