# Sovereign Automation Plugin

Wraps the secure orchestrator from `agents/secure/`.

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `automation.runScan` | `{ userId, passkeySecret, recoverySecret, email?, params?, enableRemediation? }` | Full `ScanRunResult` incl. ciphertext envelope + receipts |
| `automation.verifyReceipt` | `{ receipt, body }` | `{ valid }` |
| `automation.remediationPlan` | `{ vectors: [{ moduleId, findings }] }` | Plan with `willExecute: false` |
| `automation.policy` | — | Machine-readable security guarantees |

## Security model

- Scans run client-side; the emitted envelope is ciphertext-only.
- Every vector is bound to a SHA-256 receipt and re-verified after the
  envelope round-trip.
- Remediation planning never executes. Execution requires an authenticated
  `RemediationTransport`; the default is fail-closed (`BLOCKED`).
- Secrets are validated, used in memory, and never persisted.

## Example

```ts
const registry = new SovereignPluginRegistry();
await registry.activate(automationPlugin);

const result = await registry.callTool('automation.runScan', {
  userId: 'user-123',
  passkeySecret: 'a-strong-passkey-secret',
  recoverySecret: 'a-different-recovery-code',
});
```
