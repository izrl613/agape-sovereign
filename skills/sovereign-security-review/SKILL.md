---
name: sovereign-security-review
description: "Audit the Agape Sovereign codebase against its zero-knowledge, AES-256-GCM, cryptographic-receipt, and fail-closed mandates. Use before merging changes that touch encryption, scans, auth, remediation, or exports."
license: MIT
compatibility: Works in any repo checkout; uses ripgrep.
metadata:
  author: agape-sovereign
  version: "1.0"
---

# Sovereign Security Review

A focused red-team checklist for the Agape Sovereign Enclave. The goal is to
prove the system is secure by trying to break it.

## Mandates under test

| Mandate | Invariant |
|---------|-----------|
| Sovereign Architect | DEK never exposed; AES-256-GCM envelope; passkey + recovery independent |
| DIFF Vector Specialist | All 16 vectors; `Scan → Verify → Classify → Encrypt`; SHA-256 receipt per vector |
| UI/UX Guardian | No grey-scale; approved neon triad only |
| Cloud Ops Warden | 15 RPM cap; App Check; $0 free tier |
| ZK-Proof Auditor | Server sees ciphertext only; no PII leaks |

## Fast checks

```bash
# 1. No weak ciphers or unauthenticated modes
rg -n "aes-256-cbc|createCipheriv|AES-CBC|des|md5" --glob '!node_modules'

# 2. No non-cryptographic randomness in security paths
rg -n "Math\.random" agents src backend functions mcp_server --glob '!node_modules'

# 3. No hard-coded secrets / default keys
rg -n "default-secret|super-secret|changeme|SOVEREIGN_PEPPER|secret-key" --glob '!node_modules'

# 4. No fabricated findings
rg -n "Math\.random\(\) >|simulat|mock finding|fake" agents src --glob '!node_modules'

# 5. Encrypt/decrypt round-trip + tamper checks
node scripts/run-secure-scan.ts
```

## What "secure" means here

1. **Cipher suite is fixed.** Callers cannot pass an algorithm, mode, or KDF.
   Decryption rejects unknown suites and iterations below the floor.
2. **Receipts are mandatory.** A finding without a SHA-256 receipt is a bug.
   Receipts are recomputed and re-verified after the envelope round-trip.
3. **Secrets fail closed.** Missing/short/equal passkey+recovery secrets throw;
   they are never defaulted.
4. **Remediation is evidence-based.** `VERIFIED` requires transport evidence;
   the default transport returns `BLOCKED`.
5. **Unconfigured vectors are honest.** They report `MONITORED`, never a
   simulated `NUKED`/`KNOXED`.
6. **Server is blind.** Persisted artifacts are ciphertext only; MCP tools
   reject keys named `passkey`, `recovery`, `dek`, `ssn`, etc.

## Red-team prompts

- Can I downgrade the cipher by editing a persisted envelope?
- Can I re-date a receipt without invalidating it? (issuedAt must be signed)
- Can I make a probe return a `NUKED` finding with no real input?
- Can a later plugin override `zk.decrypt`? (duplicate tool names must throw)
- Does the server ever receive `passkeySecret` or `recoverySecret`?
- Does remediation ever report `VERIFIED` without evidence?
- Do logs contain a raw UID, email, SSN, or key material?

## Verdict format

For each finding: `severity (Critical/High/Medium/Low)`, `file:line`,
`why it is exploitable`, and `fix applied`. If nothing is exploitable, say so
plainly and list the checks you ran.
