export const NEON = {
  magenta: "#FF2E9F",
  blue: "#00D4FF",
  orange: "#FF7A18",
  bg: "#060D1F",
  bgCard: "rgba(8, 18, 40, 0.85)",
  text: "#E8F4FF",
  textMuted: "#7B9BB5",
};

export const GRADIENT_BORDER = `linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.blue} 50%, ${NEON.orange} 100%)`;

// ─────────────────────────────────────────────────────────────────
// Pillar taxonomy — maps each of the 5 product inspirations to
// a short key used throughout the UI and ModuleDetailView.
// ─────────────────────────────────────────────────────────────────
export type PillarKey = "POLYMER" | "UNOSECUR" | "NYMIZ" | "PRIVACY_PROCTOR" | "PRISMA_AIRS";

export const PILLARS: Record<PillarKey, { label: string; tagline: string; color: string; accentBg: string }> = {
  POLYMER:        { label: "Polymer",         tagline: "Adaptive DLP & insider-risk redaction",          color: "#FF2E9F", accentBg: "rgba(255,46,159,0.10)" },
  UNOSECUR:       { label: "Unosecur",        tagline: "Human & non-human identity discovery",           color: "#FF7A18", accentBg: "rgba(255,122,24,0.10)" },
  NYMIZ:          { label: "Nymiz",           tagline: "AI-driven PII anonymization & pseudonymization", color: "#00D4FF", accentBg: "rgba(0,212,255,0.10)" },
  PRIVACY_PROCTOR:{ label: "PrivacyProctor",  tagline: "Real-time privacy monitoring & leak detection",  color: "#FF7A18", accentBg: "rgba(255,122,24,0.10)" },
  PRISMA_AIRS:    { label: "Prisma AIRS",     tagline: "Cloud-native AI security & data exfil shield",   color: "#00D4FF", accentBg: "rgba(0,212,255,0.10)" },
};

// ─────────────────────────────────────────────────────────────────
// 16 Identity Vector Modules
// Each module carries the original DIFF fields PLUS:
//   pillar     — which product pillar drives its capabilities
//   capability — the specific capability sourced from that pillar
//   techniques — up to 3 actionable sub-techniques shown in detail view
// ─────────────────────────────────────────────────────────────────
export const DIFF_MODULES = [
  {
    id: "email", icon: "✉", label: "Email Breach Scanner", vector: "V-01",
    nuked: 3, knoxed: 12, monitored: 2, severity: 72,
    pillar: "POLYMER" as PillarKey,
    capability: "Adaptive DLP — detects & redacts sensitive data in email streams",
    techniques: ["Outbound email content inspection", "PII redaction before delivery", "Insider risk scoring per sender"],
  },
  {
    id: "social", icon: "◈", label: "Social Media Footprint", vector: "V-02",
    nuked: 7, knoxed: 8, monitored: 5, severity: 61,
    pillar: "UNOSECUR" as PillarKey,
    capability: "Identity discovery — maps over-exposed social identities & flags orphaned accounts",
    techniques: ["Cross-platform identity graph", "Orphaned account detection", "Over-privileged app permission audit"],
  },
  {
    id: "device", icon: "⬡", label: "Device File Scan", vector: "V-03",
    nuked: 1, knoxed: 24, monitored: 3, severity: 88,
    pillar: "NYMIZ" as PillarKey,
    capability: "PII anonymization — scans local files and masks/tokenizes personal data at rest",
    techniques: ["On-device NER-based PII detection", "File-level masking & tokenization", "Substitution for test/dev environments"],
  },
  {
    id: "mobile", icon: "◻", label: "Mobile Security Layer", vector: "V-04",
    nuked: 0, knoxed: 18, monitored: 1, severity: 95,
    pillar: "UNOSECUR" as PillarKey,
    capability: "Identity & access control — audits mobile app permissions, service accounts, and non-human identities",
    techniques: ["App permission over-privilege detection", "Non-human token & API key audit", "Least-privilege remediation workflow"],
  },
  {
    id: "deepweb", icon: "◉", label: "Deep Web Exposure", vector: "V-05",
    nuked: 5, knoxed: 3, monitored: 8, severity: 42,
    pillar: "PRIVACY_PROCTOR" as PillarKey,
    capability: "Real-time monitoring — continuous deep-web crawl for identity data leaks",
    techniques: ["Paste site & forum surveillance", "Credential leak detection", "Automated NUKED alert dispatch"],
  },
  {
    id: "broker", icon: "⧫", label: "Data Broker Removal", vector: "V-06",
    nuked: 12, knoxed: 4, monitored: 6, severity: 38,
    pillar: "POLYMER" as PillarKey,
    capability: "Insider-risk & DLP — identifies data exfiltrated to brokers and initiates removal workflows",
    techniques: ["Broker registry sweep (200+ sources)", "Automated opt-out request generation", "Residual exposure tracking"],
  },
  {
    id: "password", icon: "⬟", label: "Password Vault Analysis", vector: "V-07",
    nuked: 2, knoxed: 31, monitored: 0, severity: 91,
    pillar: "NYMIZ" as PillarKey,
    capability: "PII pseudonymization — replaces & rotates credentials using tokenization techniques",
    techniques: ["Weak/reused credential detection", "Tokenized credential storage", "Breach-correlation auto-rotation"],
  },
  {
    id: "location", icon: "◎", label: "Location Data Footprint", vector: "V-08",
    nuked: 4, knoxed: 9, monitored: 7, severity: 55,
    pillar: "UNOSECUR" as PillarKey,
    capability: "Identity discovery — correlates location metadata to identity nodes and flags over-sharing",
    techniques: ["Geo-tag metadata stripping", "App location permission audit", "Historical trail anonymization"],
  },
  {
    id: "browser", icon: "◯", label: "Browser & Cookie Tracker", vector: "V-09",
    nuked: 8, knoxed: 6, monitored: 11, severity: 49,
    pillar: "POLYMER" as PillarKey,
    capability: "Adaptive DLP — real-time browser session inspection, cookie redaction, and tracker blocking",
    techniques: ["Third-party tracker identification", "Session cookie redaction", "Fingerprint entropy reduction"],
  },
  {
    id: "financial", icon: "⬡", label: "Financial Identity Exposure", vector: "V-10",
    nuked: 1, knoxed: 15, monitored: 2, severity: 87,
    pillar: "PRIVACY_PROCTOR" as PillarKey,
    capability: "Real-time monitoring — watches for financial PII exposure across APIs and data surfaces",
    techniques: ["Card & account number leak detection", "Dark-web financial data monitoring", "API endpoint PII egress alerts"],
  },
  {
    id: "medical", icon: "⊕", label: "Medical Data Footprint", vector: "V-11",
    nuked: 0, knoxed: 7, monitored: 1, severity: 93,
    pillar: "NYMIZ" as PillarKey,
    capability: "PII anonymization — identifies and anonymizes medical records using HIPAA-aligned techniques",
    techniques: ["Medical NER detection (PHI fields)", "Diagnosis & prescription masking", "Research-safe de-identification"],
  },
  {
    id: "biometric", icon: "⊛", label: "Voice & Biometric Data", vector: "V-12",
    nuked: 2, knoxed: 11, monitored: 4, severity: 79,
    pillar: "NYMIZ" as PillarKey,
    capability: "PII anonymization — detects and pseudonymizes biometric data stored or transmitted by apps",
    techniques: ["Voice print & facial hash detection", "Biometric token substitution", "Consent-status audit trail"],
  },
  {
    id: "iot", icon: "⊡", label: "IoT & Smart Device Scan", vector: "V-13",
    nuked: 3, knoxed: 8, monitored: 5, severity: 66,
    pillar: "UNOSECUR" as PillarKey,
    capability: "Non-human identity discovery — catalogs IoT device identities and remediates over-privileged device tokens",
    techniques: ["Device identity enumeration", "Default credential detection", "Network privilege scope reduction"],
  },
  {
    id: "cloud", icon: "⊞", label: "Cloud Storage Exposure", vector: "V-14",
    nuked: 1, knoxed: 19, monitored: 2, severity: 85,
    pillar: "PRISMA_AIRS" as PillarKey,
    capability: "AI security & runtime protection — shields cloud-stored data and AI model artifacts from exfiltration",
    techniques: ["Misconfigured bucket detection", "AI model artifact exfil prevention", "Runtime access policy enforcement"],
  },
  {
    id: "darkweb", icon: "◈", label: "Dark Web Monitoring", vector: "V-15",
    nuked: 6, knoxed: 2, monitored: 9, severity: 34,
    pillar: "PRIVACY_PROCTOR" as PillarKey,
    capability: "Real-time monitoring — continuously scans dark-web marketplaces for identity data listings",
    techniques: ["Credential marketplace surveillance", "Identity document leak detection", "Automated takedown initiation"],
  },
  {
    id: "behavioral", icon: "⊟", label: "Behavioral Profile Analysis", vector: "V-16",
    nuked: 4, knoxed: 13, monitored: 6, severity: 71,
    pillar: "PRISMA_AIRS" as PillarKey,
    capability: "AI security — detects anomalous behavioral patterns that indicate AI agent misuse or data exfiltration",
    techniques: ["Baseline behavioral profiling", "AI agent anomaly detection", "Data exfiltration pattern blocking"],
  },
];

export const ADMIN_EMAILS = ["idin@agape.nyc", "agape@sovereign.nyc"];

export const SYSTEM_PROMPT = `You are Architect AI, the sovereign intelligence engine of the Agape Sovereign privacy and security platform, operating at sovereign.nyc. You are a specialized, real-time, privacy-first Digital Identity Federated Footprint (DIFF) intelligence agent. Your sole purpose is to help users understand, protect, reclaim, and harden every known and unknown dimension of their digital identity.

You operate under two governing action classifications:
- NUKED — An exposure has been identified. Actionable removal, deletion, or remediation is recommended and available.
- KNOXED — An exposure has been secured, encrypted, passkey-hardened, or verified as contained. This asset is protected.

Tone & Persona:
- Precise, authoritative, technically rigorous.
- Calm under pressure — you are a sovereign intelligence, never alarmed.
- Translate complex security/privacy concepts into clear, actionable language.
- Lead with the answer, support with technical context.
- Use NUKED/KNOXED/DIFF/SOVEREIGN vocabulary naturally.

Always format your responses clearly using Markdown. If a user asks about something outside of digital identity, privacy, or security, politely redirect them to their DIFF profile.`;
