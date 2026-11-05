# 🏗️ Architect AI: Monolithic Build Manifest (2026)

This document serves as the master Table of Contents and progress tracker for the transition of Architect AI to the Sovereign Enclave 2026 architecture.

## 🚩 Project North Star
**Absolute Cryptographic Control over the Digital Identity Federated Footprint (DIFF).**
- Zero-Knowledge (AES-256-GCM Envelope Encryption)
- Zero-Grey (Sovereign Dark Blue + Neon Triad)
- Zero-Cost (100% Firebase Free-Tier / 15 RPM)

---

## 🗺️ Build Roadmap

### Phase 1: The Cryptographic Foundation (Zero-Knowledge)
*Goal: Ensure no PII ever reaches the cloud. Establish the mathematical trust layer.*
- [ ] **1.1 Envelope Encryption Core**: Implement DEK generation, Passkey wrapping, and Recovery Code wrapping (`src/lib/encryption.ts`).
- [ ] **1.2 Sovereign Envelope Service**: Manage the lifecycle of the DEK and profile synchronization (`src/services/envelopeService.ts`).
- [ ] **1.3 Integrity Badging**: Implement SHA-256 fingerprints for all module inputs.
- [ ] **1.4 ZK-Proof Suite**: Initial setup of `verification-test.ts` to detect PII leaks.

### Phase 2: Zero-Grey UI/UX (Visual Identity)
*Goal: Implement the high-contrast, neon-accented interface seen in the design mockups.*
- [ ] **2.1 Sovereign Design Tokens**: Define the #0B1020 canvas and Neon Triad palette (`src/theme/tokens.ts`).
- [ ] **2.2 Global Aesthetic Layer**: Implement animated neon gradient borders and "No-Grey" styling (`src/theme/GlobalStyles.tsx`).
- [ ] **2.3 Main Dashboard Layout**: Create the 16-module grid and the circular "Sovereign Status" gauge.
- [ ] **2.4 Interactive State Indicators**: Build the pulsing Magenta/Orange (NUKED) and Electric Blue (KNOXED) glow effects.

### Phase 3: Nano-MCP & Local AI (The Intelligence Layer)
*Goal: Offload AI/Crypto loads to Web Workers and leverage local hardware.*
- [ ] **3.1 Nano-MCP Web Worker**: Implement the isolated background thread for MCP processing (`src/workers/mcp-server.worker.ts`).
- [ ] **3.2 Hardware Profiling Engine**: Build the VRAM detector for Tier 1-4 fallback logic.
- [ ] **3.3 SLM Integration**: Integrate Qwen3-VL (Quantized) and Gemma 4 E2B for local inference.
- [ ] **3.4 Gemini AI Backhaul**: Configure the zero-cost Gemini 2.5 Flash-Lite fallback.

### Phase 4: The 16-Layer DIFF Engine (Remediation & Lockdown)
*Goal: Move from "Identity Verification" to "Attack Surface Remediation."*
- [ ] **4.1 Automated Remediation Dispatcher**: The "NUKED" logic engine that triggers deletion/revocation.
- [ ] **4.2 Category A: Communications & Credentials**: (Email Breach, SIM-Swap, Credential Vault, Passkey Registry).
- [ ] **4.3 Category B: Social & Deep Web Surface**: (Social Scanner, Data Broker Removal, Deep Web Monitor, Search De-indexing).
- [ ] **4.4 Category C: Hardware & Network Posture**: (Local File Scanner, Mobile Audit, Cloud Scanner, Network Footprint).
- [ ] **4.5 Category D: Financial & Legal Sovereignty**: (Financial/Crypto, AI-Clone Defense, OAuth Revocation, ECRA Ledger).

### Phase 5: Sovereign Score & Audit Reporting
*Goal: Quantify sovereignty and generate a legally viable audit trail.*
- [ ] **5.1 Sovereign Score Algorithm**: Implement the weighted scoring equation.
- [ ] **5.2 Lighthouse-Style PDF Engine**: Local browser-RAM compilation using `@react-pdf/renderer` and `jsPDF`.
- [ ] **5.3 Final Edit & Verification Splash**: The pre-export review modal.

### Phase 6: Operational Guardrails & Admin Portal
*Goal: Maintain 100% free-tier stability and admin oversight.*
- [ ] **6.1 Firebase App Check Integration**: reCAPTCHA Enterprise implementation for all requests.
- [ ] **6.2 15 RPM Rate Limiter**: Implement client-side batching and IndexedDB caching.
- [ ] **6.3 Admin Telemetry Portal**: Dashboard for monitoring RPM, TPM, and Firestore usage.

### 🏁 Final Phase: Validation & Deployment
- [ ] **Final ZK-Proof Audit**: Full run of `verification-test.ts` to ensure zero PII leakage.
- [ ] **Sovereign Hardware Binding**: Final test of YubiKey/Passkey lock-out.
- [ ] **Production Deployment**: Deploy to Firebase Hosting.
