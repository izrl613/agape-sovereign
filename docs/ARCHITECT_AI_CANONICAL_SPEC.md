# Architect AI — Agape Sovereign Enclave 2026

## Canonical project specification

**Architect AI** is a security-first privacy-intelligence application that gives people visibility and control over their **Digital Identity Federated Footprint (DIFF)**. It maps, analyzes, and helps secure a user's digital presence across email, social accounts, devices, files, and cloud-linked identity surfaces.

The product is a personal digital-sovereignty console. Its two primary outcome states are:

- **NUKED** — an exposure was found and an actionable removal, deletion, or remediation is recommended.
- **KNOXED** — a surface is secured, encrypted, hardened, or verified as protected.

Architect AI updates a user's posture in real time, supports federated sign-in and universal passkeys, provides AI-guided security assistance, and produces a clear Lighthouse-style DIFF report. The intended delivery constraint is a full front end and back end using Firebase and Google ecosystem services within their available free-tier allowances.

## Product objectives

Architect AI enables a user to:

- Understand the scope of their DIFF.
- Scan selected devices and cloud-linked identity surfaces.
- Identify breaches, public exposure, weak controls, and privacy risks.
- Receive actionable remediation and privacy guidance.
- Monitor security posture over time.
- Decide whether a finding should be NUKED, KNOXED, or MONITORED.
- Export an understandable privacy and security audit report.

## Unified identity and application flow

1. The user signs in with a Google Account or Apple ID.
2. The application registers a universal WebAuthn passkey associated with the user's approved mobile and/or desktop device.
3. Architect AI initializes a DIFF scan after the user selects and authorizes applicable identity vectors.
4. The system analyzes the selected vectors and records findings in the user profile.
5. Findings are classified as **NUKED**, **KNOXED**, or **MONITORED**.
6. Protected application data is stored in Firebase according to least-privilege and user-scoped security rules.
7. The user reviews the dashboard, asks Architect AI for assistance, follows remediation actions, and generates a DIFF report.

## DIFF navigation modules

The left navigation is organized around the surfaces that make up a user's federated footprint.

### Email breach and metadata scanner

- Check authorized breach and exposure sources.
- Analyze email-associated metadata patterns.
- Flag suspected data-broker leaks and exposure patterns.
- Present remediation steps in user-friendly language.

### Social media footprint scanner

- Review public posts and accounts only through permitted APIs, authorized user data, or lawful user-directed analysis.
- Detect username reuse and public exposure patterns.
- Map data-broker and reputation vulnerabilities.

### Device file scan: local and cloud

- Analyze files the user explicitly selects or authorizes.
- Detect sensitive-data patterns and exposed metadata.
- Flag sensitive documents for review.
- Support Google Drive as an optional authorized cloud source.

### Mobile and laptop security

- Show passkey and multi-factor authentication status.
- Provide an operating-system security posture checklist.
- Verify or record device-encryption status where platform capabilities permit.
- Identify hardening opportunities.

### Deep-web exposure monitoring

- Perform pattern-based lookups against permitted public and authorized data sources.
- Surface publicly indexed exposure indicators.
- Create user-visible exposure alerts.

### Data-broker removal engine

Inspired by the user experience of SayMine, Jumbo, and Optery, this module supplies guided removal workflows and request templates. It must not imply automatic removal where a provider requires manual identity verification or a user action.

## Architect AI intelligence engine

Architect AI is the central conversational and analysis module. It provides:

- Gemini-powered, context-aware security and privacy Q&A.
- Session-scoped access to the user's authorized DIFF data.
- Real-time analysis, risk scoring, and prioritized action plans.
- Clear explanations of breaches, exposures, and hardening options.
- Guidance for choosing whether to Nuke or Knox a finding.

Example questions include: “Where am I most vulnerable?”, “Should I Nuke or Knox this?”, and “What does this breach mean?”

## NUKED, KNOXED, and MONITORED classification

### NUKED

Use NUKED for findings such as:

- Data-broker removal or deletion request needed.
- Publicly exposed information found.
- Confirmed or relevant breach involvement.
- A weak security configuration that needs correction.

### KNOXED

Use KNOXED when a finding or surface is:

- Encrypted.
- Protected by a passkey.
- Hardened through an approved configuration.
- Verified as contained or otherwise protected.

### MONITORED

Use MONITORED for a known item that needs periodic reassessment but does not currently warrant a removal action or a verified-protected designation.

Every DIFF module contributes findings to this shared framework.

## Dashboard and Sovereign Score

The main dashboard presents a prominent **Sovereign Score (0–100%)**, the DIFF summary, exposure status, and prioritized next actions. The score is calculated dynamically from factors including:

- Breach count and severity.
- Exposure density.
- Multi-factor and passkey adoption.
- Data-broker footprint.
- Device encryption status.
- Completion and verification of remediation actions.

## Administration portal

The admin portal is a technical visibility area that remains private to authorized users. Access requires federated authentication and a passkey bound to the user's profile. It presents security and privacy operations without exposing raw infrastructure complexity, including:

- WebAuthn and authentication activity logs.
- Application and Cloud Run status where used.
- Firebase usage and capacity statistics.
- Database integrity indicators.
- Audit trails and verification history.

## DIFF PDF export

Architect AI produces a readable, Lighthouse-style **DIFF Report**. The report includes:

- Sovereign Score.
- Exposure breakdown.
- NUKED, KNOXED, and MONITORED findings.
- Recommendations and remediation status.
- Timestamped verification information.
- A cloud audit identifier.

The intended implementation generates the PDF through Firebase-compatible server-side processing, stores it in Firebase Storage under user-scoped access controls, and makes it securely downloadable by the report owner.

## Technology architecture and free-tier constraint

### Front end

- React or Next.js.
- Firebase Hosting.
- Tailwind CSS with a custom dark-neon design system.
- Browser WebAuthn APIs.

### Firebase and backend services

- Firebase Authentication.
- Cloud Firestore.
- Firebase Storage.
- Firebase App Check.
- Firestore and Storage Security Rules.
- Firebase Analytics configured with privacy-conscious collection and consent behavior.
- Firebase Cloud Functions and/or Google Cloud Run only where their available no-cost quotas and the selected Firebase plan support the necessary usage.

### AI and identity integrations

- Gemini API, constrained to its currently available free-tier quota or an explicit user-approved billing plan.
- Google Identity Services.
- Sign in with Apple where the platform, developer account, and applicable program requirements permit.

### Free-tier operating principle

The application is designed to remain within free allowances through strict usage budgets, client-side processing where safe, sampling or queued scans, report limits, and visible quota status. No service may be represented as universally free: capabilities that require a paid Firebase plan, external breach-data license, Apple developer account, or exceeded Gemini/Google Cloud quota must be gated, clearly disclosed, or replaced with an approved no-cost alternative.

## Authentication, privacy, and security model

- Federated OAuth sign-in through Google and Apple where enabled.
- WebAuthn passkeys for device-bound authentication and reauthentication.
- Role-based, user-scoped Firestore and Storage rules.
- Firebase App Check enforcement for supported clients.
- Encryption in transit and platform-managed encryption at rest; application-level encryption for especially sensitive fields when the product threat model requires it.
- Session-scoped, least-privilege AI context.
- No plaintext storage of secrets or sensitive source data unless explicitly required, consented to, and protected by the defined data-retention policy.
- Explicit consent before accessing email, social, device, file, or cloud data; only authorized, lawful data sources may be scanned.
- Clear data minimization, retention, export, and deletion controls.

## Compliance and governance posture

Architect AI uses the stated 2026 ERCA/ECRA privacy standard as a conceptual product framework and is designed around GDPR principles, CCPA alignment, privacy by design, data minimization, and transparent user control. Any claims of legal compliance require jurisdiction-specific review before release.

## Design system

The visual direction is a calm, high-clarity, futuristic **Sovereign / Enclave** experience inspired by privacy products such as Firefox Monitor, SayMine, Jumbo, Optery, and Google privacy tooling.

- Background: deep dark blue, `#0B1020`.
- Accent colors: neon magenta `#FF2E9F`, electric blue `#00D4FF`, and burnt orange `#FF7A18`.
- Components: glassmorphism panels, soft neon gradients and glows, minimalist typography, and accessible high-contrast status indicators.
- Tone: calm, secure, modern, and legible—not alarmist.

## Scalability and modularity

The application is organized as modular DIFF surfaces with a shared classification, scoring, audit, and AI-context layer. It should use stateless service endpoints where applicable, maintain an expandable AI context model, and remain ready for future microservice separation without requiring it in the initial free-tier deployment.

## Firebase Studio delivery summary

**Project name:** Architect AI – Agape Sovereign Enclave 2026  
**Primary objective:** Deliver a real-time, AI-guided digital identity sovereignty console that helps users map their DIFF, Nuke exposures, and Knox protected surfaces.  
**Core Firebase services:** Authentication, Firestore, Hosting, Storage, App Check, Security Rules, and quota-compatible server-side/reporting services.  
**Deployment constraint:** Start on free-tier eligible services and keep all metered integrations behind explicit usage limits and disclosure.

## Purpose statement

Architect AI is a privacy-intelligence console that maps, analyzes, and helps secure a user's digital identity footprint through federated authentication, passkey security, real-time AI guidance, and Firebase-based infrastructure—empowering users to Nuke exposures and Knox their digital sovereignty.
