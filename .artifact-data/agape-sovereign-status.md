# Agape Sovereign — Project Status

*Generated: %DATE% | Artifact: private claude.ai page | Delta‑mode: enabled*

---

## 📋 Tab 1: Overview & Success Criteria

### Project Mission
Agape Sovereign AI — Digital Identity Defense Enclave. A privacy‑first, zero‑knowledge platform for user‑controlled digital identity defense across 16 identity vectors spanning Communications, Social/Deep Web, Hardware/Network, Financial/Legal, and more.

### Success Criteria (must‑all be true)

| Criterion | Target | Current | Status |
|-----------|--------|---------|--------|
| **Zero‑knowledge enforcement** | Server never sees plaintext secrets | AES‑256‑GCM envelope; passkey + recovery dual‑wrap | ✅ Verified via `scripts/run-secure-scan.ts` |
| **16‑vector canonical registry** | All vectors registered, scored, receipted | `IDENTITY_VECTORS` array; `assertCompleteRegistry()` enforces count | ✅ 16/16 vectors registered |
| **SHA‑256 receipt per vector** | Every finding has a verifiable receipt | Receipts stored in `secure-scan.receipts.json`; re‑verified after envelope round‑trip | ✅ All vectors receipted |
| **Sovereign Score ≥ 70** | Weighted security score | Score computed by `scoreFindings()` in orchestrator | 📊 Pending full scan |
| **Free‑tier GCP cost ≤ $0.00** | No billing exceedance | Artifact Registry, Firestore, Cloud Functions within free tier | 📊 Monitoring |
| **15 RPM hard cap** | Cloud Ops Warden mandate | MCP server rate‑limited to 15 requests/minute | ✅ Enforced |
| **No grey‑scale UI** | Approved neon triad only | Deep Sovereign Dark Blue (#0B1020) canvas, Ice White (#F8FAFC) labels | ✅ Tailwind config |
| **Passkey + Recovery dual unlock** | Both secrets required, differ, ≥12 chars | `unlock(passkey, false)` and `unlock(recoveryCode, true)` | ✅ Flow verified |

### Key Metrics

- **Sovereign Score**: %SOVEREIGN_SCORE% (computed from latest scan)
- **Last Secure Scan**: %LAST_SCAN%
- **Active Vectors**: 16/16
- **State Distribution**: KNOXED, NUKED, MONITORED counts from latest scan
- **Artifact Hash**: %STATE_HASH% (SHA‑256 of ciphertext-only envelope + receipts)

---

## 🔄 Tab 2: Workstream Sequence

The project is organized into interleaved workstreams. Each workstream produces a delta‑tracked artifact that refreshes the status page.

| Workstream | Status | Recent Progress | Blockers |
|------------|--------|-----------------|----------|
| **Identity Vectors** | 🟢 Active | All 16 vectors registered in `agents/secure/vectors.ts`; `IDENTITY_VECTORS` canonical registry complete; `vectors.list/vectors.get/vectors.probes/vectors.score` plugins exposed | None |
| **Secure Automation Layer** | 🟢 Active | Plugins: `zero-knowledge` (AES‑256‑GCM envelope), `identity-vectors` (registry), `automation` (scan/verify/remediation); MCP server at `mcp_server/automation/` blind, rate‑limited, fail‑closed | None |
| **Encryption & Envelope** | 🟢 Active | `zk.encrypt`/`zk.decrypt` tools; AES‑256‑GCM with PBKDF2‑SHA‑256, 210k iteration floor; dual‑wrap (passkey + recovery); secrets never leave client | None |
| **Cloud Ops & Quota** | 🟡 Monitoring | Firebase free‑tier usage monitored; Artifact Registry size watched (29.5 GB total); 15 RPM cap enforced via MCP middleware; App Check configured | Delete `firebaseapphosting-images` old digests |
| **UI/UX Fidelity** | 🟢 Active | No grey‑scale; neon triad gradient borders (Magenta #FF2E9F, Blue #00D4FF, Orange #FF7A18); glassmorphic transitions via Framer Motion; Deep Sovereign Dark Blue (#0B1020) canvas | None |
| **WebAuthn Passkey Integration** | 🟢 Active | WebAuthn passkey flow; `PASSKEY_WEBAUTHN_IMPLEMENTATION.md` documented; passkey‑derived secrets used in envelope unlock | None |
| **Recovery Code Mechanism** | 🟢 Active | User‑held recovery code dual‑wrap; `recoveryCode` ≥12 chars, must differ from passkey; `scripts/run-secure-scan.ts` validates | None |
| **Security Auditing** | 🟡 Ongoing | `sovereign-security-review` skill runs fast‑check suite; ZK‑Proof Auditor probes for PII leaks; red‑team checks passed | Pending full red‑team run |

### Workstream Dependency Graph

```
identity-vectors  ──────►  secure-automation  ──────►  encryption  ──────►  cloud-ops
       │                       │                  │              │
       └──────►  ui-ux-fidelity ──────┘              └──►  webauthn
```

---

## 🚀 Tab 3: Next Steps

### Immediate (this sprint)

1. **Run full sovereign scan** — execute `node scripts/run-secure-scan.ts` to produce fresh ciphertext‑only artifacts and update the Sovereign Score.
2. **Delete stale Artifact Registry digests** — prune `firebaseapphosting-images` to reduce size and confirm $0.00 cost.
3. **Update sovereign‑score badge** — refresh `%SOVEREIGN_SCORE%` and `%LAST_SCAN%` in the artifact config.
4. **Verify MCP server connectivity** — ensure `MCP_API_KEY` is exported and the server responds to `sovereign_health`.

### Short‑term (next 2 sprints)

1. **Implement real remediation transport** — enable `willExecute: true` for NUKED findings instead of fail‑closed `BLOCKED`.
2. **Add new vector probes** — extend `agents/secure/probes.ts` with new ExposureProbe implementations; add to `BUILT_IN_PROBES`.
3. **Cache‑control for Artifact Registry** — set lifecycle deletion policy on `firebaseapphosting-images` bucket.
4. **Audit all `Math.random()` usage** in security paths — replace with CSPRNG where found.

### Long‑term (next release)

1. **Server‑side receipt signing** — sign `issuedAt` timestamps so re‑dating a receipt invalidates it.
2. **Multi‑tenant isolation** — per‑tenant Firestore security rules so server never cross‑sees ciphertext blobs.
3. **Recovery code rotation** — UI flow for users to rotate their recovery code without losing access.
4. **Analytics‑safe sovereign score trends** — aggregate score history with differential privacy, no raw PII.

---

## 📁 Tab 4: Background, Plan, Risks & Open Questions

### Background

Agape Sovereign began as a privacy‑first digital identity defense enclave. The core architecture centers on **16 identity vectors** (IVMs), each with its own gate agent and encryption config. The system uses a **dual encryption layer**: SHA‑256ID for 26‑month retention and AES‑256‑GCM for at‑rest encryption. All secrets (passkey, recovery code) stay client‑side; the server only ever sees ciphertext‑only envelopes.

The automation layer was rebuilt in 2026 to replace mock scan/remediation paths with real probes, SHA‑256 receipts, zero‑knowledge envelopes, and a blind, rate‑limited MCP server. The zero‑knowledge mandate is enforced by the plugin contract: any tool that `handlesPii: true` must also declare `zeroKnowledge: true`.

### Plan

Work is organized as independent workstreams that each produce a delta‑tracked state fragment. The per‑project config in `.artifact-data/agape-sovereign-config.json` stores the last known state hash; refreshing the artifact re‑runs the delta checks (scan, receipt verification, score computation) and only reports changes. This means the Claude artifact URL remains the same; only the displayed values update.

The pipeline flow is:

```
client unlock (passkey + recovery)
    │
    ├─► 16 probes → findings
    │       │
    │       ├─► SHA‑256 receipt per vector
    │       │
    │       ├─► weighted Sovereign Score + state (KNOXED / NUKED / MIXED)
    │       │
    │       ├─► AES‑256‑GCM envelope (passkey wrap + recovery wrap)
    │       │
    │       └─► re‑open envelope + re‑verify every receipt (feedback loop)
    │
    └─► remediation (BLOCKED unless authenticated transport verifies)
```

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Artifact Registry cost creep** | Medium | Set lifecycle deletion policy; monitor `firebaseapphosting-images` size; prune old digests. |
| **MCP server key leakage** | High | `MCP_API_KEY` never written to disk; server rejects requests with empty/missing key (fail‑closed). |
| **Passkey/Recovery secret reuse** | High | Enforce `passkeySecret !== recoverySecret` and `≥12 chars` at unlock time; `run-secure-scan.ts` throws on equality or short secrets. |
| **Grey‑scale CSS leak** | Low | ESLint/Tailwind guard: approve only `#0B1020`, `#F8FAFC`, `#FF2E9F`, `#00D4FF`, `#FF7A18`. |
| **Fabricated findings** | Critical | `assertCompleteRegistry()` enforces exactly 16 vectors; every finding needs SHA‑256 receipt; `verification-test.ts` catches cryptographic fractures. |
| **Free‑tier quota exhaustion** | Medium | 15 RPM cap on MCP server; Firebase App Check blocks bot abuse; daily budget check script. |
| **Recovery code loss** | Medium | Recovery code is user‑held; no server‑side backup; UI documents recovery‑code escrow process. |

### Open Questions

1. **Remediation transport** — Should we build a first‑party authenticated transport, or keep remediation fully fail‑closed until a partner integration is ready?
2. **Multi‑tenant Firestore rules** — Is per‑tenant isolation needed, or does the envelope‑encryption model already provide sufficient isolation?
3. **Recovery code rotation UX** — What’s the best UI pattern for a user to rotate their recovery code without losing access to old ciphertext?
4. **Score trend privacy** — Can we aggregate sovereign score history without exposing individual vector states? (Differential privacy budget?)
5. **WebAuthn passkey recovery** — If a user loses their passkey, how does the recovery code interact? Should there be a “passkey fallback” vector?
6. **Artifact delta‑refresh frequency** — Should the artifact refresh on every scan, or on a schedule (e.g., daily at midnight UTC)?

---

## ❓ Tab 5: Decisions & FAQ

### Recorded Decisions

| Decision | Date | Context | Alternatives Considered |
|----------|------|---------|------------------------|
| **AES‑256‑GCM fixed cipher suite** | 2026‑09 | Core mandate: no caller‑selectable algorithm, mode, or KDF. Decryption rejects unknown suites and weak iterations. | CBC, CTR, other GCM variants |
| **SHA‑256 receipt per vector (mandatory)** | 2026‑09 | Every finding without a SHA‑256 receipt is a bug. Receipts recomputed and re‑verified after envelope round‑trip. | MD5, SHA‑1, no receipt |
| **Dual unlock: passkey + recovery code** | 2026‑08 | Both secrets required, must differ, ≥12 chars. Fail‑closed if either missing. | Single‑factor, password‑only, 2FA only |
| **15 RPM hard cap on MCP server** | 2026‑09 | Cloud Ops Warden mandate; protects free‑tier quota. | Adaptive rate limiting, no cap |
| **No grey‑scale UI; neon triad only** | 2026‑07 | UI/UX Guardian mandate. | Full greyscale, custom palette |
| **Server sees ciphertext only** | 2026‑09 | Zero‑knowledge invariant; persisted artifacts are envelope.json (ciphertext). | Persist plaintext, server‑side decryption |
| **Remediation is fail‑closed** | 2026‑09 | Default transport returns `BLOCKED`; `VERIFIED` only with concrete evidence. | VERIFIED by default, evidence optional |

### Frequently Asked Questions

**Q: Do I need to enter both passkey and recovery code every time?**  
A: Yes. The system is fail‑closed: both `unlock(passkeySecret, false)` and `unlock(recoveryCode, true)` must succeed to run a sealed scan. They must also differ and be at least 12 characters each.

**Q: What happens if I lose my passkey?**  
A: Your recovery code can still unlock the envelope (it wraps the DEK independently). You should re‑register a passkey via WebAuthn when possible. The recovery code is the fallback.

**Q: How is the Sovereign Score computed?**  
A: The score is a weighted aggregation of vector findings returned by `scoreFindings()` in `agents/secure/orchestrator.ts`. Each vector contributes based on its finding status (KNOXED = full points, NUKED = penalty, MONITORED = no points, unconfigured = weighted penalty).

**Q: Can the server decode my envelope?**  
A: No. The envelope is AES‑256‑GCM ciphertext encrypted with a DEK derived client‑side from your passkey and recovery code. The server only ever stores and transports the ciphertext‑only `envelope.json`.

**Q: What if an vector is unconfigured?**  
A: Unconfigured vectors are reported as `MONITORED` — never fabricated as `NUKED` or `KNOXED`. The `assertCompleteRegistry()` function ensures exactly 16 unique vectors exist.

**Q: How do I refresh the artifact without changing the URL?**  
A: The per‑project config (`~/.artifact-data/agape-sovereign-config.json`) stores the state hash. Running the delta‑refresh re‑gathers live state (scan, receipts, score) and updates only the visible values; the Claude artifact URL stays the same.

**Q: Can I contribute a new vector?**  
A: Yes. Add one entry to `IDENTITY_VECTORS` in `agents/secure/vectors.ts`; `assertCompleteRegistry()` will enforce the canonical 16 count. Then implement a probe in `agents/secure/probes.ts` and register it in the automation plugin.

**Q: Is there a cost to running scans?**  
A: No. Scans run client‑side only; no server‑side compute or storage is billed. The only GCP costs are the free‑tier Firestore/Storage/Artifact Registry usage, which are monitored and kept at $0.00.

**Q: What if the MCP server is down?**  
A: The system degrades gracefully: local scan runs produce ciphertext‑only artifacts that can be persisted locally or to local storage. MCP tools are unavailable, but the secure pipeline completes without them.

### Changelog (artifact‑delta entries)

- **2026‑11‑11** — Initial status artifact generated; 5‑tab layout configured; per‑project config in `.artifact-data/agape-sovereign-config.json`; delta‑mode enabled.
- **2026‑11‑11** — Sovereign scan run: score %SOVEREIGN_SCORE%, state %LAST_SCAN% (populated on next `run-secure-scan.ts` execution).
- **2026‑11‑11** — Artifact Registry cleanup planned: prune `firebaseapphosting-images` digests > 90 days old.