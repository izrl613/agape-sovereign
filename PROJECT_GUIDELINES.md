# Project Guidelines: Agape Sovereign Enclave 2026

These guidelines are non-negotiable. All agents and contributors must adhere to these mandates to ensure the platform's sovereign status.

## 🗝️ Zero-Knowledge Mandate
The platform is a zero-knowledge environment. The server is a "dumb" storage layer for encrypted blobs.
- **Encryption Standard:** AES-256-GCM using the native browser WebCrypto API (SubtleCrypto).
- **Key Management:** 
    - Data Encryption Key (DEK) is generated client-side.
    - DEK is wrapped by a key derived from the WebAuthn Passkey.
    - DEK is also wrapped by the plaintext Recovery Code.
- **Constraint:** No unencrypted PII shall ever leave the user's browser memory.

## 🌈 Zero-Grey Mandate
The visual language is high-contrast and neon. Grey is forbidden.
- **Primary Canvas:** Deep Sovereign Dark Blue (#0B1020).
- **Secondary Surfaces:** #111830.
- **Text/Labels:** Ice White (#F8FAFC) or 90% opacity Electric Cyan (#00D4FF).
- **Signature Triad (Neon Gradients):**
    - Neon Magenta: #FF2E9F
    - Electric Blue: #00D4FF
    - Burnt Neon Orange: #FF7A18
- **Visual Indicator:** 
    - 🔥 NUKED: Pulsing Magenta (#FF2E9F) & Burnt Orange (#FF7A18).
    - 🛡️ KNOXED: Steady Electric Blue (#00D4FF) neon shield glow.

## ☁️ Firebase Free-Tier Constraints
To maintain 100% free-tier operation, the following limits are absolute:
- **Rate Limit:** 15 Requests Per Minute (RPM).
- **Daily Limit:** 1,000 Requests Per Day (RPD).
- **Firestore:** 50k reads / 20k writes per day.
- **Security:** Firebase App Check is mandatory for all API requests to prevent quota draining.

## ✅ Verification Pipeline
Verification is the only truth.
- **The Final Gate:** Every major feature must be verified by `verification-test.ts`.
- **Integrity Hash:** Every module input must generate a SHA-256 fingerprint: `SHA-256(ModuleID + NormalizedUserInput + UserSalt)`.
- **Failure State:** Any failure in the ZK-proof or a mismatch in the integrity hash must trigger an immediate system halt for that module.
