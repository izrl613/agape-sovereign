# Sovereign Automation Layer

A secure, verifiable automation layer for the Agape Sovereign Enclave 2026.
It replaces mock scan/remediation paths with real probes, cryptographic
receipts, zero-knowledge envelopes, fail-closed remediation, a plugin system,
and a blind MCP server.

> **Core promise:** the server sees ciphertext only, unconfigured vectors are
> reported honestly as `MONITORED`, and no finding is ever fabricated.

---

## What was added

| Area | Path | Purpose |
|------|------|---------|
| Agents | `agents/secure/` | Orchestrator, probes, receipts, envelope, remediation |
| Skill | `skills/agape-sovereign-automation/SKILL.md` | Run/extend the automation |
| Skill | `skills/sovereign-security-review/SKILL.md` | Red-team checklist |
| Plugins | `plugins/zero-knowledge/` | `zk.encrypt` / `zk.decrypt` |
| Plugins | `plugins/identity-vectors/` | `vectors.list` / `vectors.get` / `vectors.score` |
| Plugins | `plugins/automation/` | `automation.runScan` / receipts / remediation plan |
| MCP server | `mcp_server/automation/` | Blind, rate-limited, fail-closed automation server |
| App adapter | `src/services/secureAutomationService.ts` | Non-breaking UI bridge |
| Runner | `scripts/run-secure-scan.ts` | End-to-end verification + artifacts |
| Runner | `scripts/verify-plugins.ts` | Plugin contract verification |

### Fixes applied

- `src/lib/encryption.ts` — removed a stray `}` that broke the class, and froze
  the cryptographic surface with `Object.freeze(SovereignEncryption)`.
- `verification-test.ts` — removed a stray `EOF` token that caused a syntax error.

---

## Pipeline

```
user input (client)
   │
   ├─► probe (real, deterministic; else MONITORED)
   │
   ├─► findings ──► SHA-256 receipt per vector
   │
   ├─► weighted Sovereign Score + state (KNOXED / NUKED / MIXED)
   │
   ├─► AES-256-GCM envelope (passkey wrap + recovery wrap)
   │
   ├─► re-open envelope + re-verify every receipt (feedback loop)
   │
   └─► remediation (BLOCKED unless an authenticated transport verifies)
```

## Security invariants

1. **Fixed cipher suite.** AES-256-GCM + PBKDF2-SHA-256 with a 210,000
   iteration floor. Decryption rejects unknown suites and weak iterations.
2. **Mandatory receipts.** Every vector carries a SHA-256 receipt, re-verified
   after the envelope round-trip.
3. **No fabricated findings.** Vectors without a probe are `MONITORED`.
4. **CSPRNG everywhere.** No `Math.random()` for ids, salts, IVs, or keys.
5. **Fail-closed remediation.** The default transport returns `BLOCKED`.
6. **Zero-knowledge server.** Persisted artifacts are ciphertext only; the MCP
   server rejects secret/PII field names before inspecting values.
7. **Dual unlock.** Passkey and recovery secrets must differ and be ≥ 12 chars.

## Run it

```bash
# Secure 16-vector scan + tamper/downgrade proofs
node scripts/run-secure-scan.ts

# Plugin registry + contract enforcement
node scripts/verify-plugins.ts

# Live-gate receipt attestation + vault compatibility (frontend)
npm run test:security
```

Artifacts (ciphertext only, no secrets):

```
workspace_outputs/secure-scan.envelope.json
workspace_outputs/secure-scan.receipts.json
```

## Use it from the app

```ts
import { runSecureSovereignScan } from './src/services/secureAutomationService';

const summary = await runSecureSovereignScan({
  userId: firebaseUser.uid,
  email: firebaseUser.email ?? undefined,
  passkeySecret,        // derived client-side from a passkey gesture
  recoverySecret,       // user-held recovery code
  params: { 'device-health': { fileText: selectedFileText } },
  enableRemediation: true,
});

summary.sovereignScore;   // 0–100
summary.legacyStates;     // Map<moduleId, 'KNOXED' | 'NUKED'>
summary.receipts;         // Map<moduleId, sha256>
summary.result.envelope;  // ciphertext-only, safe to persist
```

> `passkeySecret` and `recoverySecret` must never cross a network boundary.
> Persist `summary.result.envelope`; never persist the secrets.

### Through the app context (migrated)

`src/context/SovereignContext.tsx` now drives the secure engine. Secrets are
kept in refs only — never in React state, never logged. A sealed scan is
fail-closed: it requires both an unlocked passkey **and** a distinct recovery
code.

```tsx
import { useSovereign } from './context/SovereignContext';

const { login, unlock, runScan, canRunSealedScan, receipts, lastScan } = useSovereign();

await login('google');

// Both secrets are required to seal the run (they must differ, ≥12 chars).
await unlock(passkeySecret, false);   // passkey gesture
await unlock(recoveryCode, true);     // user-held recovery code

if (canRunSealedScan) {
  const scan = await runScan({
    params: { 'device-health': { fileText: selectedFileText } },
  });
  console.log(scan.state, scan.sovereignScore); // KNOXED | NUKED | MIXED
}
```

`runScan` maps the canonical 16 vectors back to the UI's `KNOXED`/`NUKED`
states with `strict = true`, so a `MONITORED` (unconfigured) vector is never
displayed as secure.

## Use the plugins

```ts
import { SovereignPluginRegistry, loadBuiltInPlugins } from './plugins/index.ts';

const registry = await loadBuiltInPlugins(new SovereignPluginRegistry());
await registry.callTool('vectors.list');
await registry.callTool('automation.runScan', {
  userId, passkeySecret, recoverySecret,
});
```

## Run the MCP server

```bash
cd mcp_server/automation
MCP_API_KEY="$(openssl rand -hex 32)" python3 server.py
```

Tools: `sovereign_health`, `list_identity_vectors`, `verify_receipt`,
`get_remediation_plan`, `verify_envelope_metadata`.

The server:
- accepts no passkey/recovery/DEK/SSN/password/private-key fields,
- verifies receipts with cross-language canonical JSON,
- rejects weak envelope metadata,
- rate-limits to 15 RPM by default (Cloud Ops Warden mandate),
- is offline (no external network calls in handlers).

### Client registration

The server is registered as `sovereign-automation` in two project configs:

- `opencode.json` — OpenCode (`mcp.servers`, remote, `oauth: false`)
- `.mcp.json` — Claude Code / Cursor (`mcpServers`, HTTP)

Both read the key from the `MCP_API_KEY` environment variable; no secret is
written to a config file. Start the server first, then export the same key in
the environment where your client runs:

```bash
cd mcp_server/automation
export MCP_API_KEY="$(openssl rand -hex 32)"
MCP_API_KEY="$MCP_API_KEY" python3 server.py
```

Verify the connection:

```bash
opencode mcp list          # OpenCode
# Claude Code: /mcp          (or `claude mcp list`)
```

If `MCP_API_KEY` is unset in the client environment, the header resolves to an
empty value and the server rejects every request (fail-closed). That is
expected.

## Scheduling (optional)

To automate scans on a schedule, invoke the **client** securely — do not move
secrets server-side. A Firebase scheduled function can notify the client
(e.g. a Firestore flag) to run `runSecureSovereignScan` on next unlock. If a
server-side schedule is unavoidable, it may only orchestrate *metadata*
operations (reminders, receipt re-verification) via the MCP server.

## Extending

- **New probe:** implement `ExposureProbe` in `agents/secure/probes.ts`, add to
  `BUILT_IN_PROBES`. Return real results or `MONITORED`; never fabricate.
- **New vector:** add an entry to `IDENTITY_VECTORS`; `assertCompleteRegistry()`
  enforces exactly 16 unique vectors.
- **Real remediation:** implement `RemediationTransport`. Return
  `verified: true` only with concrete evidence.

## Known legacy paths

`src/services/diffEngine.ts` and `src/services/remediationService.ts` are marked
`@deprecated`. They remain only for older screens and use mock randomness. New
work should use `agents/secure/` via `secureAutomationService.ts`.
