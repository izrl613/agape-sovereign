// @vitest-environment node
import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { generateDEK } from '../frontend/services/sha256Vault';
import { runModuleAgent } from '../frontend/services/moduleAgents';

const OUT = join(__dirname, '..', 'workspace_outputs', 'app-receipt.json');

it('emits an app receipt for MCP interop', async () => {
  const dek = await generateDEK();
  const { receipt } = await runModuleAgent(
    'health',
    { provider: 'Acme Health', policyId: 'HP-123456', emergencyContact: '+1 555 0100' },
    'interop-uid',
    'a'.repeat(64),
    dek,
  );
  const { body, ...meta } = receipt.attestation!;
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ receipt: meta, body }, null, 2));
});
