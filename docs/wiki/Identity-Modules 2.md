# Identity Modules

← [Home](Home.md) · [Architecture](Architecture.md)

Agape Sovereign AI analyzes your digital identity across **16 core identity vectors** plus several extended vectors. Each module scans a specific domain, produces a risk score (0–100), and feeds actionable remediations into the [Shield Platform](Shield-Platform.md).

---

## Module Summary

| # | Module | Domain | Risk Focus |
|---|--------|--------|------------|
| 1 | Email | Communication | Breach exposure, spam registrations |
| 2 | Social | Online presence | Account hijacking, impersonation |
| 3 | Device | Hardware | Device fingerprinting, unauthorized access |
| 4 | System | OS & software | Vulnerability exposure, patch level |
| 5 | Laptop | Endpoint | Local data exposure, disk encryption |
| 6 | DeepWeb | Dark/deep web | Leaked PII, credential dumps |
| 7 | DataBroker | Data aggregators | People-search profiles, opt-out status |
| 8 | Password | Credentials | Reuse, strength, breach correlation |
| 9 | Network | Connectivity | IP reputation, VPN/proxy status |
| 10 | Cloud | Cloud accounts | Misconfigured permissions, exposed storage |
| 11 | Communication | Messaging/VoIP | Number exposure, SIM swap risk |
| 12 | Financial | Banking/fintech | Account exposure, fraud indicators |
| 13 | Documents | Identity docs | Passport/DL/SSN exposure signals |
| 14 | OAuth | App permissions | Over-privileged third-party app access |
| 15 | Legal | Court/public records | Public record exposure |
| 16 | Biometric | Biometric data | Biometric database inclusion signals |

### Extended Vectors

| Module | Domain |
|--------|--------|
| Location | Geolocation & check-in exposure |
| BrowserTracker | Cookie, fingerprint, and tracker profiling |
| Medical | Health record and insurance exposure |
| IoT | Smart home device exposure |
| DarkWeb | Darknet marketplace mentions |
| Behavioral | Behavioral analytics and profiling |
| Erasure | Right-to-erasure request tracking |

---

## Module Details

### 1. Email Module

**Purpose:** Determine how widely your email address has been exposed.

- Cross-references Have I Been Pwned (HIBP) API for breach records
- Checks email presence on paste sites and spam lists
- Scores alias hygiene (single email vs. many registrations)

**Remediations:** Create email aliases, enable breach alerts, rotate compromised addresses.

---

### 2. Social Module

**Purpose:** Map your social media footprint and detect impersonation.

- Enumerates connected social accounts (via OAuth tokens, read-only)
- Detects lookalike accounts using username variants
- Scores privacy settings completeness

**Remediations:** Lock down privacy settings, report impersonator accounts, enable login alerts.

---

### 3. Device Module

**Purpose:** Assess hardware-level identity exposure.

- Collects device fingerprint signals (User-Agent, screen, fonts — with user consent)
- Correlates against known fingerprinting databases
- Identifies shared/public devices in login history

**Remediations:** Enable device-bound passkeys, review trusted devices, enable biometric lock.

---

### 4. System Module

**Purpose:** Evaluate OS and software vulnerability exposure.

- Checks OS version and patch level against CVE feeds
- Identifies end-of-life software
- Scores update cadence

**Remediations:** Enable automatic updates, remove EOL software, apply critical patches.

---

### 5. Laptop Module

**Purpose:** Endpoint data protection assessment.

- Verifies disk encryption status (FileVault / BitLocker signals)
- Checks screen lock timeout configuration
- Reviews browser saved-password exposure

**Remediations:** Enable full-disk encryption, set screen lock to ≤5 min, migrate to password manager.

---

### 6. DeepWeb Module

**Purpose:** Monitor deep and dark web for your PII.

- Aggregates signals from breach databases and paste aggregators
- Monitors for SSN, DL, and financial account number patterns
- Tracks forum mentions of your email/username

**Remediations:** Place credit freeze, file identity theft report, enable fraud alerts.

---

### 7. DataBroker Module

**Purpose:** Track and remediate data broker profiles.

- Queries known data broker sites (Spokeo, Whitepages, BeenVerified, etc.)
- Generates opt-out request queue
- Tracks opt-out confirmation status

**Remediations:** Submit opt-out requests (automated via Shield Erasure pillar), monitor re-aggregation.

---

### 8. Password Module

**Purpose:** Credential hygiene and breach correlation.

- Checks passwords against HIBP Pwned Passwords (k-anonymity — no plaintext transmitted)
- Scores password strength and reuse across services
- Detects credential stuffing risk

**Remediations:** Rotate breached passwords, enable MFA, migrate to password manager.

---

### 9. Network Module

**Purpose:** Network-level identity and reputation.

- Checks IP reputation (residential vs. datacenter, abuse history)
- Assesses VPN/Tor usage for privacy vs. risk tradeoffs
- Detects open Wi-Fi usage patterns

**Remediations:** Use trusted VPN, avoid public Wi-Fi for sensitive tasks, review DNS privacy.

---

### 10. Cloud Module

**Purpose:** Cloud account security posture.

- Reviews connected cloud storage permissions (Google Drive, Dropbox, etc.)
- Identifies publicly exposed files or misconfigured sharing
- Checks MFA status on cloud accounts

**Remediations:** Revoke over-privileged apps, set files to private, enable cloud account MFA.

---

### 11. Communication Module

**Purpose:** Phone number and messaging security.

- Assesses SIM swap risk (carrier lock status)
- Checks phone number exposure in breach databases
- Reviews messaging app encryption settings

**Remediations:** Enable carrier SIM lock, switch to end-to-end encrypted messaging, use VoIP number for public registrations.

---

### 12. Financial Module

**Purpose:** Financial account and fraud exposure.

- Monitors for financial account credentials in breach dumps
- Checks credit report inquiry anomalies (via user-provided data)
- Assesses payment card exposure signals

**Remediations:** Place credit freeze, enable transaction alerts, use virtual card numbers.

---

### 13. Documents Module

**Purpose:** Government ID and document exposure.

- Signals for passport, driver's license, and SSN exposure in breach data
- Monitors document scanning app data leaks
- Tracks KYC submission exposure

**Remediations:** File FTC identity theft report, contact SSA, request new document numbers where applicable.

---

### 14. OAuth Module

**Purpose:** Third-party app permission hygiene.

- Enumerates OAuth grants across Google, GitHub, Facebook, etc.
- Flags over-privileged apps (requesting more scopes than needed)
- Identifies dormant apps that retain access

**Remediations:** Revoke unused app permissions, review scope requirements, prefer apps with minimal scope.

---

### 15. Legal Module

**Purpose:** Public record and legal exposure.

- Aggregates public court record signals
- Checks voter registration and property record exposure
- Monitors for unauthorized use of name in legal filings

**Remediations:** Submit record sealing requests where eligible, opt out of public record aggregators.

---

### 16. Biometric Module

**Purpose:** Biometric data inclusion and consent.

- Signals for facial recognition database inclusion (clearinghouse APIs)
- Tracks biometric data breach events (BIPA-covered entities)
- Reviews app biometric permission grants

**Remediations:** Submit biometric deletion requests (BIPA/GDPR), revoke biometric app permissions.

---

## Extended Modules

### Location
Monitors geolocation check-ins, location history sharing, and real-time location data in social profiles. Remediations: disable precise location, opt out of location history.

### BrowserTracker
Inventories active tracking cookies, supercookies, canvas fingerprints, and third-party trackers. Remediations: deploy tracker blocking, enable fingerprint protection.

### Medical
Detects health record and insurance data exposure via breach signals and health app data leaks. Remediations: review HIPAA breach notifications, audit connected health apps.

### IoT
Maps smart home devices and checks for exposed management interfaces. Remediations: update firmware, disable UPnP, segment IoT network.

### DarkWeb
Crawls darknet marketplace listings for credential and PII sale events tied to your identity. Remediations: immediate credential rotation, fraud alerts.

### Behavioral
Detects behavioral analytics profiles built from your browsing/app usage patterns. Remediations: opt out of behavioral ad targeting, use privacy-preserving browser.

### Erasure
Tracks the status of all right-to-erasure requests submitted to data brokers and covered businesses. Provides a unified dashboard of pending, confirmed, and failed requests.

---

## Scoring Model

Each module outputs a **Risk Score (0–100)**:

| Score Range | Level | Action |
|-------------|-------|--------|
| 0–25 | Low | Monitor |
| 26–50 | Medium | Review remediations |
| 51–75 | High | Immediate action recommended |
| 76–100 | Critical | Urgent — Shield auto-remediation triggered |

Scores are aggregated into an **Identity Sovereignty Index (ISI)** — a single 0–100 score representing overall digital identity health.

---

## Related Pages

- [Shield Platform](Shield-Platform.md) — remediation pillars
- [Architecture](Architecture.md)
- [Home](Home.md)
