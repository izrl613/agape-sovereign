---
name: agape-sovereign-automation
description: "Run and extend the Agape Sovereign secure 16-vector automation: orchestrated scans, SHA-256 receipts, zero-knowledge envelopes, fail-closed remediation, plugins, and the automation MCP server."
license: MIT
compatibility: Requires Node 18+ (Node 26 recommended) for the TS engine; Python 3.10+ for the MCP server.
metadata:
  author: agape-sovereign
  version: "1.0"
---

# Agape Sovereign Automation

Automate the DIFF pipeline without ever compromising zero-knowledge.

## When to use

- Running a full 16-vector scan and producing a sealed, verifiable artifact.
- Adding a new vector probe or a remediation transport.
- Wiring the automation into a schedule, an agent, or an MCP client.
- Verifying that a scan artifact was not tampered with.

## The secure pipeline

```
user input ──► probes ──► findings ──► SHA-256 receipt / vector
                                              │
                                              ▼
                         weighted Sovereign Score + state
                                              │
                                              ▼
                     AES-256-GCM envelope (passkey + recovery)
                                              │
                                              ▼
                    re-open envelope + re-verify receipts
                                              │
                                              ▼
              remediation (BLOCKED unless a transport is configured)
```

## Run it

```bash
# Full end-to-end verification (writes ciphertext-only artifacts)
node scripts/run-secure-scan.ts
```

Artifacts land in `workspace_outputs/`:

- `secure-scan.envelope.json` — ciphertext-only, safe for an untrusted server.
- `secure-scan.receipts.json` — per-vector SHA-256 receipts, no secrets.

## Programmatic use

```ts
import { SovereignScanOrchestrator } from './agents/secure/index.ts';

const result = await new SovereignScanOrchestrator().run({
  userId: 'firebase-uid',
  email: 'user@example.com',
  passkeySecret: process.env.ZK_PASSKEY_SECRET!,
  recoverySecret: process.env.ZK_RECOVERY_SECRET!,
  params: { 'device-health': { fileText: localFileText } },
  enableRemediation: true,
});

console.log(result.subject, result.state, result.sovereignScore);
```

### App context (migrated)

`src/context/SovereignContext.tsx` now runs the secure engine. Secrets live in
refs only, and `runScan` is fail-closed: it needs both `unlock(passkey, false)`
and `unlock(recoveryCode, true)`. `canRunSealedScan` tells the UI when it is
safe to run.

## Plugins

```ts
import { SovereignPluginRegistry, loadBuiltInPlugins } from './plugins/index.ts';

const registry = await loadBuiltInPlugins(new SovereignPluginRegistry());
const vectors = await registry.callTool('vectors.list');
const scan = await registry.callTool('automation.runScan', {
  userId: 'user-123',
  passkeySecret: 'strong-passkey-secret',
  recoverySecret: 'different-recovery-code',
});
```

## MCP server

```bash
cd mcp_server/automation
MCP_API_KEY="$(openssl rand -hex 32)" python3 server.py
```

Tools exposed: `sovereign_health`, `list_identity_vectors`, `verify_receipt`,
`get_remediation_plan`, `verify_envelope_metadata`. The server refuses secrets
and raw PII by design.

Registered as `sovereign-automation` in `opencode.json` and `.mcp.json`
(`X-API-Key: {env:MCP_API_KEY}`). Export `MCP_API_KEY` where the client runs
and start the server first.

## Hard rules (do not violate)

1. **No fabricated findings.** Unconfigured vectors are `MONITORED`.
2. **Every vector has a SHA-256 receipt**, re-verified after the envelope
   round-trip.
3. **AES-256-GCM only.** No caller-selectable cipher, no `-cbc` fallback.
4. **No `Math.random()`** for IDs, salts, IVs, or keys.
5. **Remediation is fail-closed.** `BLOCKED` unless a transport verifies.
6. **Secrets never touch disk, logs, or the server.**

## Extending

- New probe: implement `ExposureProbe` in `agents/secure/probes.ts` and add it
  to `BUILT_IN_PROBES`.
- New vector: add one entry to `IDENTITY_VECTORS`; `assertCompleteRegistry()`
  enforces the canonical count.
- Real remediation: implement `RemediationTransport` and pass it via
  `remediationTransport`. Only return `verified: true` with concrete evidence.
