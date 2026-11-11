// @vitest-environment node
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { generateDEK } from '../frontend/services/sha256Vault';
import { runModuleAgent } from '../frontend/services/moduleAgents';

const OUT = '/private/var/folders/kr/w89ttzvd4pg4ms72yvlwc2s00000gn/T/opencode/app-receipt.json';

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
  writeFileSync(OUT, JSON.stringify({ receipt: meta, body }, null, 2));
});
