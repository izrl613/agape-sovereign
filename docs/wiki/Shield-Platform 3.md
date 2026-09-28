# Shield Platform (V-17)

The Shield Platform is the unified 5-pillar security command center, accessible at `/dashboard/shield`. It fuses five industry-leading privacy paradigms into a single real-time dashboard.

## The 5 Pillars

### 1. DLP Shield (Polymer)
Adaptive data loss prevention and insider-risk management.
- 8 configurable policy rules (pattern matching, severity tiers)
- Actions: REDACT, BLOCK, ALERT, REPLACE
- Live violation counter + event log
- Firestore collection: `dlp_policies`, `dlp_violations`

### 2. Identity Guard (Unosecur)
Human and non-human identity discovery and privilege management.
- Discovers over-privileged roles and API keys
- Risk scoring with privilege bars
- One-tap remediation with Firestore write-back
- Tracks: human identities, service accounts, OAuth tokens

### 3. PII Anonymizer (Nymiz)
AI-driven PII detection and anonymization.
- Detects: Name, Email, DOB, Phone, SSN, IP address
- Modes: Masking (`***`), Tokenization (UUID), Substitution (synthetic), Pseudonymization
- Powered by Google GenAI + local regex NER
- Scan results stored in `pii_scan_results`

### 4. Privacy Monitor (PrivacyProctor)
Real-time privacy monitoring across APP / WEB / API surfaces.
- Live alert feed with severity (CRITICAL / HIGH / MEDIUM / INFO)
- Master toggle to pause/resume monitoring
- Alert types: data leak, tracker detected, API overshare, cookie violation
- Stored in `privacy_mon_events`

### 5. AI Armor (Prisma AIRS)
Cloud-native AI security against misuse and data exfiltration.
- 7 protection capabilities (prompt injection shield, exfil guard, misuse detector, model firewall, data sanitizer, audit trail, anomaly detector)
- Event log types: INJECTION, EXFIL, MISUSE, BLOCK
- Real-time toggle per capability
- Stored in `ai_threats`

## Navigation

The Shield panel uses an internal tab system:
```
overview | dlp | identity | pii | monitor | airs
```

## Service Files

| Service | File | Pillar |
|---|---|---|
| dlpService | `src/services/dlpService.ts` | Polymer |
| piiService | `src/services/piiService.ts` | Nymiz |
| identityRiskService | `src/services/identityRiskService.ts` | Unosecur |
