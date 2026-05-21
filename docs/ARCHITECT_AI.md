# Architect AI — Agape Sovereign Enclave 2026

Comprehensive project documentation for the "Architect AI — Agape Sovereign Enclave" Digital Identity Federated Footprint (DIFF) Intelligence Platform.

**Repository:** https://github.com/izrl613/agape-sovereign

---

**Executive Summary**
- **Purpose:** Architect AI is a security-first, privacy-intelligence web application that maps, analyzes, and empowers users to remediate their Digital Identity Federated Footprint (DIFF).
- **Core Actions:** NUKED (removal/remediation required), KNOXED (secured/hardened), MONITORED (observed).
- **Primary Goal:** Provide a real-time, zero-knowledge DIFF intelligence console that lets users understand exposures and choose to NUKE or KNOX assets.

---

**Core Purpose**
- Give users complete visibility across email, social media, devices, cloud storage, data brokers, deep web exposures, and AI/biometric surfaces.
- Enable user-driven remediation (NUKED) or hardening (KNOXED) with step-by-step guidance and automated removal templates.
- Preserve user sovereignty with client-side encryption, device-bound WebAuthn passkeys, and minimal server-side plaintext processing.

---

**Application Flow**
1. User signs in with Google or Apple (federated OAuth) and enrolls a device-bound WebAuthn passkey.
2. A short splash flow collects the user's 16-module DIFF inputs (condensed onboarding). Each module entry generates a unique SHA-256 seal for that module instance.
3. Architect AI runs client-side scans (where applicable) and server-side orchestrations (Cloud Functions) only for permitted, consented data.
4. Findings are classified NUKED / KNOXED / MONITORED and stored encrypted in Firestore under /users/{uid}/diffModules.
5. Users interact with Architect AI (conversational Q&A) to get contextual remediation plans. Sensitive operations require a fresh WebAuthn assertion.
6. Users may generate a sealed Lighthouse-style PDF DIFF report (SHA-256 payload seal). The PDF is encrypted, stored in Firebase Storage, and accessible via time-limited signed URLs.

---

**Left Navigation Modules (DIFF Modules)**
The app exposes 16 identity-vector modules (condensed for left-nav grouping). Each module is a scan surface and remediation workflow.

1. Email Breach & Metadata Scanner — breach cross-reference, metadata leakage, alias strategy.
2. Social Media Footprint Scanner — username reuse, public PII, OAuth permissions audit.
3. Device File Scan (Local & Cloud) — file metadata PII detection, Google Drive audit.
4. Mobile Device Security Posture — passkey checks, OS patching, app permissions.
5. Laptop & Desktop Security Posture — FDE, password manager, extension audit, VPN/DNS checks.
6. Deep Web Exposure Monitoring — dark-web signals, paste sites, credential pair detection.
7. Data Broker Removal Engine — identify brokers, generate ECRA-compliant opt-out templates, track requests.
8. Password & Credential Vault Audit — HIBP k-anonymity checks, MFA coverage.
9. Network & DNS Security Posture — WebRTC/DNS leaks, DoH enforcement.
10. Cloud Storage & Sync Security — public links, collaborator audits.
11. Communication Privacy Audit — messaging and email encryption posture.
12. Financial Identity Surface — credit & financial exposure guidance.
13. Identity Document Exposure — document metadata, ID exposure remediation.
14. Third-Party App OAuth Audit — connected apps, zombie app revocation.
15. Public Records & Legal Exposure — court/property/voter records review.
16. AI & Biometric Data Exposure — biometric submission detection, dataset opt-outs.

Each left-nav module exposes a summary badge, severity metric, NUKED/KNOXED counts, and a detailed module view with findings and remediation actions.

---

**Architect AI Engine (Core Intelligence Module)**
- Conversational AI (Gemini / Vertex AI) bound to session-scoped context and the user's encrypted DIFF profile.
- Tasks: classify findings, generate step-by-step NUKED remediation, KNOXED hardening plans, generate removal templates, produce prioritized action queues, and recalculate Sovereign Score in real time.
- Behavioral rules: calm, precise, classified output (NUKED/KNOXED/MONITORED), transparency with ECRA 2026 rationale for decisions.

---

**NUKED vs KNOXED Framework**
- NUKED: active exposure requiring removal or immediate remediation. Examples: credential pairs in breach, public files with PII, data broker listing with address/phone.
- KNOXED: verified secure asset — encrypted, passkey-bound, or access-limited. Examples: file encrypted with user-controlled key, account migrated to passkeys and MFA enforced.
- MONITORED: actively observed surface with no immediate remediation required but periodic rescans.

Classification examples and actionable remediation steps are displayed within each module.

---

**Admin Portal**
- Accessible only to the registered admin identities: `idin@agape.nyc` and `agape@sovereign.nyc`.
- Admin auth requires federated login + a device-bound WebAuthn passkey registered to admin email.
- Purpose: operational visibility (WebAuthn logs, Cloud Function invocation metrics, Firestore usage, audit trails, usage analytics). No plaintext PII is exposed in the portal — only encrypted metadata, counters, and anonymized aggregates unless unsealed by the admin passkey and with explicit consent.

---

**PDF Export System (DIFF Lighthouse Report)**
- Generates a structured Lighthouse-style report JSON payload, sealed with a SHA-256 hash at generation time.
- Stored at `/reports/{uid}/{reportId}.pdf` in Firebase Storage; Firestore stores report metadata.
- Download access via time-limited signed URLs (default 15 minutes).
- PDF contents: reportId, user (encrypted), sovereignScore, module breakdown, nuked/knoxed/monitored items, remediation steps, audit trail, passkeySeal.

Example JSON report payload structure is included in the `firestore` section below.

---

**Technology Stack (Free-tier Firebase + GCP)**
- Frontend: React (Vite or Next.js), Tailwind optional, WebAuthn client integration, AES-256 client-side encryption utilities.
- Backend / Orchestration: Firebase Authentication (Google / Apple), Cloud Firestore, Firebase Cloud Functions (Node 20), Firebase Storage, Firebase Hosting, App Check.
- AI: Gemini (Vertex AI / Generative Language API) — context-bound sessions, safety settings, low temperature for deterministic guidance.
- Optional: Cloud Run for heavier jobs (free tier), Cloud Logging / Monitoring for admin insights.

All services chosen are compatible with Firebase and GCP free-tier usage patterns; cost guardrails and quota checks should be implemented before large-scale scans.

---

**Authentication & Security Architecture**
- Primary auth: Google OAuth 2.0 and Sign-In with Apple via Firebase Authentication.
- Secondary auth: WebAuthn (FIDO2) resident keys with `userVerification='required'` and `residentKey='required'` — device-bound universal passkeys for sensitive operations.
- App Check: reCAPTCHA Enterprise or DeviceCheck for attestation.
- Zero-knowledge design: client-side AES-256-GCM encryption of all PII prior to Firestore writes. Server only stores ciphertext and minimal searchable metadata (salted, non-identifying) where needed.
- At-rest: Firestore & Storage server-side encryption (GCP-managed) + user-level encryption for sensitive blob fields.
- Audit & logging: Cloud Logging stores operational logs; PII-free audit traces written to Firestore with passkey seals.

---

**Design System**
- Base background: Dark Navy — #0B1020 (or #060D1F as implemented in UI)
- Neon accent palette (thin pulsing gradient lines, button borders, application edge):
  - Magenta: RGB #FF2E9F
  - Electric Blue / Cyan: RGB #00D4FF
  - Burnt Orange: RGB #FF7A18
- Visual style: glassmorphism panels, pulsing thin gradient borders, soft neon glow, minimalist clear typography (no grey placeholder fonts), fast fluid transitions.
- Indicators: NUKED — Neon Magenta pulsing; KNOXED — Neon Blue stable; MONITORED — Neon Orange.
- UI tokens: use gradient border `linear-gradient(135deg, #FF2E9F, #00D4FF, #FF7A18)` for edges and `box-shadow` glows that cycle between these colors.

---

**Compliance Framework**
- Conceptually aligned with ECRA 2026 (ECRA / ERCA 2026 LTS), GDPR, and CCPA principles.
- Enforced behaviors: Right to Know, Right to Delete (ECRA §4.2 opt-out templates), Portability (DIFF PDF), Data Minimization, Consent Traceability, Cross-border transfer flagging.

---

**Sovereign Score**
- 0–100 composite calculated from weighted module risk scores:
  - Email Breach: 12% | Data Broker: 12% | Dark Web: 12% | Credential Strength: 10% | Device Security: 10% | Social Media PII: 8% | Network Security: 8% | Cloud Storage: 7% | Financial Identity: 7% | Third-Party OAuth: 5% | Communication Privacy: 4% | Identity Documents: 3% | Public Records: 1% | AI/Biometric: 1%
- Tiers:
  - 85–100: KNOXED SOVEREIGN (Neon Blue #00D4FF)
  - 65–84: PARTIALLY SECURED (Neon Orange #FF7A18)
  - 40–64: EXPOSURE RISK (Neon Magenta #FF2E9F)
  - 0–39: CRITICALLY NUKED (Pulsing Red)

Recalculate in real time after every module update or user action.

---

**Scalability**
- Stateless Cloud Functions for event-driven behavior (recalculate sovereign score, enqueue exports, schedule dark-web monitor scans).
- Offload heavy background jobs to Cloud Run with autoscaling; use cost guardrails and quotas for free-tier safety.

---

**Deployment Model (Firebase Studio Submission Summary)**
- Project: Architect AI — Agape Sovereign Enclave 2026
- Environment: Firebase free-tier / Google Cloud free-tier
- Core services to enable: Authentication (Google/Apple), Firestore, Cloud Functions, Storage, Hosting, App Check
- Primary objective: Real-time, AI-driven DIFF analysis while preserving zero-knowledge client encryption and passkey-based access control.

---

**Final Distilled Purpose Statement**
Architect AI is a privacy-intelligence console that maps, analyzes, and secures a user’s entire Digital Identity Federated Footprint (DIFF) using federated authentication, device-bound passkeys, client-side encryption, and Firebase-based infrastructure — empowering users to Nuke exposures and Knox their digital sovereignty.

---

**Developer Reference: Firestore Schema (recommended)**
Collections and document structure (high level):

/users/{uid}
- profile (ciphertext)
- sovereignScore: number
- lastScanTimestamp: timestamp
- passkeyCredentialId: string
- role: 'user' | 'admin'

/users/{uid}/diffModules/{moduleId}
- status: 'NUKED' | 'KNOXED' | 'MONITORED'
- findings: array (encrypted entries)
- lastUpdated: timestamp
- remediationQueue: array

/users/{uid}/reports/{reportId}
- storageRef: string
- generatedAt: timestamp
- passkeySeal: string
- sovereignScore: number

/adminPortal/{docId} (restricted read/write)

---

**Firestore Security Rules (template)**
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    function isAdmin() {
      return request.auth.token.role == 'admin';
    }
    function hasPasskey() {
      return request.auth.token.passkeyBound == true;
    }
    match /users/{uid}/{document=**} {
      allow read, write: if isAuthenticated() && isOwner(uid) && hasPasskey();
    }
    match /adminPortal/{document=**} {
      allow read, write: if isAuthenticated() && isAdmin() && hasPasskey();
    }
  }
}
```

**Firebase Storage Rules (reports)**
```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{uid}/{reportId} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // Cloud Function only
    }
  }
}
```

---

**Cloud Functions (scaffold recommendations)**
1. generateDiffReport — HTTP / Firestore trigger: reads encrypted user data (server sees ciphertext), verifies passkeyServerSeal, renders PDF, stores in Storage, writes metadata to /users/{uid}/reports.
2. sovereignScoreRecalculate — Firestore trigger on /users/{uid}/diffModules changes.
3. passkeyChallenge — generates WebAuthn challenges and verifies assertions server-side.
4. ecraOptOutGenerator — generates ECRA-compliant removal documents.
5. darkWebMonitor — scheduled task (Cloud Scheduler + Function) with rate limiting and free-tier safety.

Example function signature (Node 20):
```js
// generateDiffReport
exports.generateDiffReport = functions.region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    // verify auth & passkey claim
    // read reportRequest doc, assemble payload
    // call PDF renderer (puppeteer / headless chrome or HTML->PDF library)
    // store PDF in Storage and write metadata
  });
```

---

**PDF Report Payload Example**
```json
{
  "reportId": "DIFF-{UID}-{timestamp}-{SHA256_seal}",
  "reportVersion": "2026-LTS",
  "complianceFramework": "ECRA 2026 / GDPR / CCPA",
  "user": { "uid": "{Firebase_UID}", "displayName": "{encrypted}", "reportGeneratedAt": "{ISO8601}", "passkeySeal": "{WebAuthn_assertion_hash}" },
  "sovereignScore": { "total": 0, "tier": "NUKED | KNOXED | MONITORED", "breakdown": {} },
  "diffModules": [],
  "nukedItems": [],
  "knoxedItems": [],
  "recommendations": {},
  "auditTrail": { "scanInitiated": "{timestamp}", "passkeyChallengeVerified": true }
}
```

---

**Client-side encryption (recommendation)**
- Use WebCrypto AES-GCM (AES-256) for encrypting PII before sending to Firestore.
- Derive per-user encryption keys from a user passphrase / device-bound secret stored only on device, or use a user-specific key protected by WebAuthn derived secrets. Never store raw keys server-side.
- Use SHA-256 to generate module seals for displayed SHA-256 keys per module and include them in the PDF payload.

---

**Design Tokens (copyable)**
```css
:root {
  --bg: #060D1F; /* dark navy */
  --neon-magenta: #FF2E9F;
  --neon-cyan: #00D4FF;
  --neon-orange: #FF7A18;
  --gradient-border: linear-gradient(135deg,var(--neon-magenta),var(--neon-cyan),var(--neon-orange));
  --glass-bg: rgba(8,18,40,0.85);
  --text: #E8F4FF;
}
```

---

**Onboarding / 16-Module Splash Flow**
- After federated sign-in and passkey enrollment, show a condensed splash that walks the user through entering or authorizing data for each of the 16 modules.
- For each module entry: compute and display a module-specific SHA-256 key; this key will appear in the module UI and be included in the report seal.
- Store module inputs encrypted in `/users/{uid}/diffModules/{moduleId}`.

---

**Privacy & Data Governance Notes**
- No PII in plaintext on servers. All sensitive fields encrypted client-side.
- User-controlled exports: the DIFF PDF and any deletion/opt-out templates are generated only with explicit passkey confirmation.
- Admin portal restricted to two admin emails and passkey-bound devices; even admin views should avoid showing decrypted PII unless the user explicitly consents.

---

**Firebase Initialization Snippet**
Place in your app (client) for Firebase wiring (replace values with your project values):
```js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g",
  authDomain: "agape-sovereign.firebaseapp.com",
  databaseURL: "https://agape-sovereign-default-rtdb.firebaseio.com",
  projectId: "agape-sovereign",
  storageBucket: "agape-sovereign.firebasestorage.app",
  messagingSenderId: "956088455461",
  appId: "1:956088455461:web:5d83545efc8961e4904acc",
  measurementId: "G-6YG9BGTWDD"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

---

**Developer Setup & Deploy (free-tier)**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login & init project: `firebase login` then `firebase init` (enable Hosting, Firestore, Functions, Storage, App Check)
3. Locally test functions: `firebase emulators:start --only functions,firestore` for development.
4. Deploy: `firebase deploy --only hosting,functions,firestore,storage`

Notes: Configure App Check provider (reCAPTCHA Enterprise or DeviceCheck) and register the OAuth providers (Google, Apple) in Firebase Console.

---

**Next Steps (offered)**
- I can scaffold the Firestore rules and Cloud Functions templates in this repo.
- I can add a `docs/` UI component map and a `design-tokens.css` file with the neon gradient and theme.
- I can scaffold the client-side AES-GCM encryption helper and WebAuthn binding flow.

If you want me to proceed with code scaffolding, tell me which of the above you'd like first (rules, functions, UI components, or encryption helpers) and I'll implement it.
