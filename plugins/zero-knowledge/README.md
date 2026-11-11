# Zero-Knowledge Plugin

Wraps the hardened envelope primitives from `agents/secure/envelope.ts`.

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `zk.params` | — | Fixed cipher/KDF/iteration parameters |
| `zk.encrypt` | `{ payload, passkeySecret, recoverySecret }` | `EncryptedEnvelope` (ciphertext only) |
| `zk.decrypt` | `{ envelope, secret, path? }` | Original payload |

## Security

- AES-256-GCM only. Algorithm cannot be selected by the caller.
- PBKDF2-SHA-256 with a 210,000 iteration floor; downgrades are rejected.
- Passkey and recovery secrets must differ and be at least 12 characters.
- The DEK never leaves the module in plaintext; raw key bytes are zeroed.
- Secrets are never persisted or logged by the plugin registry.

## Why this plugin exists

The audit mandate requires that plaintext PII never reaches the server. This
plugin makes the secure path the *only* path: callers get an opaque envelope,
not a choice of ciphers.
