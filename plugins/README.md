# Agape Sovereign Plugins

Three built-in plugins extend the secure automation layer. All are
zero-knowledge: plaintext PII never leaves the client, and the plugin registry
never persists tool arguments.

| Plugin | Namespace | Purpose |
|--------|-----------|---------|
| `zero-knowledge` | `zk.*` | AES-256-GCM envelope encrypt/decrypt |
| `identity-vectors` | `vectors.*` | Canonical 16-vector registry + scoring |
| `automation` | `automation.*` | Orchestrated scans, receipts, remediation planning |

## Contract

See `plugin-contract.ts`. Key rules enforced at activation:

- Manifest id must be lowercase `a-z0-9-`.
- Tool names must be namespaced (`domain.action`) and unique.
- A plugin declaring `handlesPii: true` **must** declare `zeroKnowledge: true`.
- There is no wildcard tool registration and no ability to override an existing
  tool — this prevents a later plugin from hijacking `zk.decrypt`.

## Load

```ts
import { SovereignPluginRegistry, loadBuiltInPlugins } from './plugins/index.ts';

const registry = await loadBuiltInPlugins(new SovereignPluginRegistry());
console.log(registry.listTools());
// [ 'automation.policy', 'automation.remediationPlan', ... 'zk.params' ]
```

## Validate the whole stack

```bash
node scripts/run-secure-scan.ts
```
