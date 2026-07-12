# Shield Platform

← [Home](Home.md) · [Identity Modules](Identity-Modules.md)

The **Agape Sovereign Shield Platform** is a five-pillar remediation and protection stack that acts on findings from the [Identity Modules](Identity-Modules.md). Each pillar is a specialized capability integrated into the Sovereign AI workflow.

---

## Five Pillars Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    Shield Platform                             │
├──────────────┬──────────────┬───────────┬──────────┬──────────┤
│   Polymer    │  Unosecur    │   Nymiz   │ Privacy  │  Prisma  │
│    (DLP)     │  (Identity)  │  (Anon)   │ Proctor  │  AIRS    │
│              │              │           │ (Monitor)│ (AI Sec) │
└──────────────┴──────────────┴───────────┴──────────┴──────────┘
```

| Pillar | Capability | Primary Use Case |
|--------|------------|------------------|
| [Polymer](#1-polymer--dlp) | Data Loss Prevention | Stop PII from leaving controlled boundaries |
| [Unosecur](#2-unosecur--identity-security) | Identity Security | Unify and harden identity posture |
| [Nymiz](#3-nymiz--anonymization) | Data Anonymization | Anonymize and pseudonymize user data |
| [PrivacyProctor](#4-privacyproctor--monitoring) | Privacy Monitoring | Continuous compliance and privacy monitoring |
| [Prisma AIRS](#5-prisma-airs--ai-security) | AI Security | Secure AI pipelines from prompt injection and data leakage |

---

## 1. Polymer — DLP

**Capability:** Data Loss Prevention

Polymer integrates as a middleware layer that inspects outbound data flows for PII, PHI, and sensitive credential patterns before they leave the Sovereign platform.

### Key Functions

- **Content Inspection:** Scan Firestore writes and Cloud Function responses for unintended PII exposure
- **Policy Enforcement:** Block or redact SSNs, credit card numbers, and biometric identifiers in transit
- **Audit Trail:** Log DLP policy violations to Cloud Logging for compliance reporting
- **Data Classification:** Auto-classify user data by sensitivity tier (public / internal / confidential / restricted)

### Integration Point

```typescript
// Polymer DLP middleware in Cloud Functions
import { PolymerDLP } from '@polymer-hq/sdk';

const dlp = new PolymerDLP({ apiKey: process.env.POLYMER_API_KEY });

export const exportUserData = onRequest(async (req, res) => {
  const userData = await gatherUserData(req.auth.uid);
  // Inspect before returning — redact any PII that shouldn't be in export
  const inspected = await dlp.inspect(userData, { redact: true });
  res.json(inspected);
});
```

### Triggers from Identity Modules

- **Documents Module** — Critical score triggers Polymer scan of all recent data exports
- **Financial Module** — Payment card pattern detection in stored notes/messages

---

## 2. Unosecur — Identity Security

**Capability:** Unified Identity Security Posture Management

Unosecur provides cross-platform identity consolidation, privileged access analysis, and identity threat detection across all connected accounts.

### Key Functions

- **Identity Graph:** Build a unified graph of all connected accounts, OAuth grants, and SSO relationships
- **Privilege Analysis:** Detect over-privileged accounts and shadow admin access
- **Identity Threat Detection:** Identify impossible travel, credential sharing, and brute-force patterns
- **Remediation Workflows:** Automated de-provisioning of dormant accounts and excess permissions

### Integration Point

```typescript
// Unosecur identity risk assessment
import { UnosecurClient } from '@unosecur/sdk';

const client = new UnosecurClient({ apiKey: process.env.UNOSECUR_API_KEY });

// Called by the OAuth Identity Module
export async function assessOAuthRisk(uid: string, oauthGrants: OAuthGrant[]) {
  const assessment = await client.assessIdentityRisk({
    userId: uid,
    grants: oauthGrants,
    context: { platform: 'sovereign.nyc' },
  });
  return assessment.riskScore; // feeds into Identity Sovereignty Index
}
```

### Triggers from Identity Modules

- **OAuth Module** — Over-privileged grants trigger Unosecur review
- **Social Module** — Detected impersonation escalates to Unosecur identity graph update
- **Cloud Module** — Misconfigured cloud IAM triggers privilege remediation workflow

---

## 3. Nymiz — Anonymization

**Capability:** Data Anonymization and Pseudonymization

Nymiz replaces real PII with synthetic pseudonyms or anonymized equivalents for analytics, testing, and data sharing workflows — ensuring compliance with GDPR Article 4 and CCPA minimization requirements.

### Key Functions

- **Field-Level Pseudonymization:** Replace names, emails, phone numbers with consistent pseudonyms
- **Tokenization:** Generate reversible tokens for fields requiring re-identification
- **Synthetic Data Generation:** Produce realistic synthetic user profiles for testing
- **De-identification Audit:** Verify that exported datasets meet k-anonymity thresholds

### Integration Point

```typescript
// Nymiz anonymization before analytics pipeline
import { Nymiz } from '@nymiz/sdk';

const nymiz = new Nymiz({ apiKey: process.env.NYMIZ_API_KEY });

export async function pushToAnalytics(userEvent: UserEvent) {
  const anonymized = await nymiz.anonymize(userEvent, {
    fields: ['email', 'name', 'ipAddress', 'deviceId'],
    method: 'pseudonymize',
    consistent: true, // same input → same pseudonym per session
  });
  await analyticsClient.track(anonymized);
}
```

### Triggers from Identity Modules

- **Behavioral Module** — All behavioral telemetry is routed through Nymiz before storage
- **BrowserTracker Module** — Tracker-exposed data is pseudonymized before analysis

---

## 4. PrivacyProctor — Monitoring

**Capability:** Continuous Privacy and Compliance Monitoring

PrivacyProctor acts as an always-on compliance watchdog, monitoring data flows, consent records, and policy adherence across the platform in real time.

### Key Functions

- **Consent Management:** Track granular user consent for each data processing activity
- **Data Flow Mapping:** Auto-discover and map PII flows across Firebase services
- **Compliance Alerts:** Surface GDPR/CCPA violations in the admin dashboard
- **Audit Log Integrity:** Sign and timestamp audit logs for non-repudiation

### Integration Point

```typescript
// PrivacyProctor consent check before data processing
import { PrivacyProctor } from '@privacyproctor/sdk';

const pp = new PrivacyProctor({ apiKey: process.env.PRIVACY_PROCTOR_API_KEY });

export async function processIdentityVector(uid: string, vector: string, data: unknown) {
  // Check that user has given consent for this vector's data processing
  const consent = await pp.checkConsent(uid, `identity_vector:${vector}`);
  if (!consent.granted) {
    throw new Error(`Consent not granted for vector: ${vector}`);
  }
  // ... proceed with processing
}
```

### Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Consent Coverage | % of users with active consent records |
| Data Flow Violations | Unauthorized PII flows detected (last 30 days) |
| Erasure SLA | Avg. time to complete erasure requests (target: ≤30 days) |
| Audit Log Integrity | Hash chain verification status |

---

## 5. Prisma AIRS — AI Security

**Capability:** AI Security — Prompt Injection Defense and AI Pipeline Protection

Prisma AIRS (AI Runtime Security) secures the Sovereign AI pipeline against prompt injection attacks, model exfiltration attempts, and sensitive data leakage through AI-generated outputs.

### Key Functions

- **Prompt Injection Detection:** Classify incoming prompts for injection/jailbreak patterns
- **Output Scanning:** Scan AI-generated text for PII, credentials, and policy violations before delivery
- **Model Access Control:** Enforce per-user rate limits and scope restrictions on AI capabilities
- **Adversarial Monitoring:** Detect and log adversarial probe sequences

### Integration Point

```typescript
// Prisma AIRS wrapping the AI analysis pipeline
import { PrismaAIRS } from '@paloaltonetworks/prisma-airs';

const airs = new PrismaAIRS({ apiKey: process.env.PRISMA_AIRS_API_KEY });

export async function runAIIdentityAnalysis(uid: string, prompt: string) {
  // 1. Check prompt for injection
  const inputScan = await airs.scanInput(prompt, { userId: uid });
  if (inputScan.blocked) {
    throw new Error(`Prompt blocked: ${inputScan.reason}`);
  }

  // 2. Run AI model
  const output = await aiModel.generate(prompt);

  // 3. Scan output for PII / policy violations
  const outputScan = await airs.scanOutput(output, { userId: uid });
  return outputScan.sanitized;
}
```

### Threat Categories Monitored

| Threat | Description |
|--------|-------------|
| Prompt Injection | Malicious instructions hidden in user input |
| Jailbreak | Attempts to bypass AI safety guidelines |
| Data Exfiltration | AI prompted to return other users' data |
| Model Inversion | Probing to extract training data |
| Denial of Service | Excessively long or recursive prompts |

---

## Shield Event Flow

```
Identity Module scores Critical (76–100)
          │
          ▼
Firestore write to /users/{uid}/shield_events
          │
          ▼
Cloud Function `runShieldRemediation` triggered (Pub/Sub)
          │
          ├─► Polymer: DLP scan of recent exports
          ├─► Unosecur: Identity graph update + privilege review
          ├─► Nymiz: Re-anonymize affected data flows
          ├─► PrivacyProctor: Consent audit + compliance alert
          └─► Prisma AIRS: AI pipeline audit for affected user
          │
          ▼
Remediation actions written back to Firestore
          │
          ▼
User notified via push notification (PWA)
```

---

## Related Pages

- [Identity Modules](Identity-Modules.md)
- [Architecture](Architecture.md)
- [Deployment](Deployment.md)
- [Home](Home.md)
