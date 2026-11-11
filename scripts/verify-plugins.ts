/**
 * Verify the built-in plugin registry and its security guarantees.
 * Run with: node scripts/verify-plugins.ts
 */

import {
  SovereignPluginRegistry,
  PluginContractError,
  loadBuiltInPlugins,
  type SovereignPlugin,
} from '../plugins/index.ts';
import { toHex, randomBytes } from '../agents/secure/index.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function main(): Promise<void> {
  console.log('============================================================');
  console.log('  AGAPE SOVEREIGN — PLUGIN REGISTRY VERIFICATION');
  console.log('============================================================\n');

  const registry = await loadBuiltInPlugins(new SovereignPluginRegistry());
  const tools = registry.listTools();

  console.log('[1/5] Built-in plugins activated');
  console.log('      plugins:', registry.listPlugins().map((p) => p.id).join(', '));
  console.log('      tools:  ', tools.join(', '));
  assert(tools.includes('zk.encrypt'), 'zk.encrypt must be registered');
  assert(tools.includes('vectors.list'), 'vectors.list must be registered');
  assert(tools.includes('automation.runScan'), 'automation.runScan must be registered');

  console.log('\n[2/5] Vector registry');
  const listed = (await registry.callTool('vectors.list')) as unknown[];
  assert(Array.isArray(listed) && listed.length === 16, 'vectors.list must return 16');
  console.log('      ✓ 16 canonical vectors');

  console.log('\n[3/5] Envelope parameters are fixed');
  const params = (await registry.callTool('zk.params')) as Record<string, unknown>;
  assert(params.cipher === 'AES-256-GCM', 'cipher must be fixed to AES-256-GCM');
  assert(params.kdf === 'PBKDF2-SHA-256', 'kdf must be fixed');
  console.log('      ✓', params.cipher, '/', params.kdf, '/', params.iterations, 'iterations');

  console.log('\n[4/5] Full scan via plugin');
  const passkeySecret = toHex(randomBytes(32));
  const recoverySecret = toHex(randomBytes(32));
  const scan = (await registry.callTool('automation.runScan', {
    userId: 'plugin-verify-user',
    passkeySecret,
    recoverySecret,
  })) as {
    vectors: unknown[];
    verification: { receiptsValid: boolean; checked: number };
    envelope: { cipher: string };
  };
  assert(scan.vectors.length === 16, 'plugin scan must return 16 vectors');
  assert(scan.verification.receiptsValid, 'plugin scan receipts must verify');
  assert(scan.verification.checked === 16, 'plugin scan must check 16 receipts');
  assert(scan.envelope.cipher === 'AES-256-GCM', 'envelope must be AES-256-GCM');
  console.log('      ✓ 16 vectors, 16 receipts, sealed envelope');

  console.log('\n[5/5] Contract enforcement');
  let duplicateRejected = false;
  try {
    registry.registerTool('zk.encrypt', () => 'hijacked');
  } catch (err) {
    duplicateRejected = err instanceof PluginContractError;
  }
  assert(duplicateRejected, 'duplicate tool registration must throw');

  const unsafePlugin: SovereignPlugin = {
    manifest: {
      id: 'unsafe-plugin',
      name: 'Unsafe',
      version: '1.0.0',
      description: 'handles PII without zero-knowledge',
      capabilities: ['unsafe.do'],
      entry: './index.ts',
      security: { zeroKnowledge: false, handlesPii: true, requiresSecrets: false },
    },
    activate() {},
  };
  let unsafeRejected = false;
  try {
    await registry.activate(unsafePlugin);
  } catch (err) {
    unsafeRejected = err instanceof PluginContractError;
  }
  assert(unsafeRejected, 'PII plugin without zero-knowledge must be rejected');
  console.log('      ✓ duplicate tool names rejected');
  console.log('      ✓ non-zero-knowledge PII plugins rejected');

  console.log('\n============================================================');
  console.log('  ✅ PLUGIN REGISTRY VERIFIED');
  console.log('============================================================');
}

main().catch((err) => {
  console.error('\n❌ PLUGIN VERIFICATION FAILED');
  console.error(err);
  process.exitCode = 1;
});
