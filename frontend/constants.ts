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

export const DIFF_MODULES = [
  { id: "email", icon: "✉", label: "Email Breach Scanner", vector: "V-01", nuked: 3, knoxed: 12, monitored: 2, severity: 72 },
  { id: "social", icon: "◈", label: "Social Media Footprint", vector: "V-02", nuked: 7, knoxed: 8, monitored: 5, severity: 61 },
  { id: "device", icon: "⬡", label: "Device File Scan", vector: "V-03", nuked: 1, knoxed: 24, monitored: 3, severity: 88 },
  { id: "mobile", icon: "◻", label: "Mobile Security Layer", vector: "V-04", nuked: 0, knoxed: 18, monitored: 1, severity: 95 },
  { id: "deepweb", icon: "◉", label: "Deep Web Exposure", vector: "V-05", nuked: 5, knoxed: 3, monitored: 8, severity: 42 },
  { id: "broker", icon: "⧫", label: "Data Broker Removal", vector: "V-06", nuked: 12, knoxed: 4, monitored: 6, severity: 38 },
  { id: "password", icon: "⬟", label: "Password Vault Analysis", vector: "V-07", nuked: 2, knoxed: 31, monitored: 0, severity: 91 },
  { id: "location", icon: "◎", label: "Location Data Footprint", vector: "V-08", nuked: 4, knoxed: 9, monitored: 7, severity: 55 },
  { id: "browser", icon: "◯", label: "Browser & Cookie Tracker", vector: "V-09", nuked: 8, knoxed: 6, monitored: 11, severity: 49 },
  { id: "financial", icon: "⬡", label: "Financial Identity Exposure", vector: "V-10", nuked: 1, knoxed: 15, monitored: 2, severity: 87 },
  { id: "medical", icon: "⊕", label: "Medical Data Footprint", vector: "V-11", nuked: 0, knoxed: 7, monitored: 1, severity: 93 },
  { id: "biometric", icon: "⊛", label: "Voice & Biometric Data", vector: "V-12", nuked: 2, knoxed: 11, monitored: 4, severity: 79 },
  { id: "iot", icon: "⊡", label: "IoT & Smart Device Scan", vector: "V-13", nuked: 3, knoxed: 8, monitored: 5, severity: 66 },
  { id: "cloud", icon: "⊞", label: "Cloud Storage Exposure", vector: "V-14", nuked: 1, knoxed: 19, monitored: 2, severity: 85 },
  { id: "darkweb", icon: "◈", label: "Dark Web Monitoring", vector: "V-15", nuked: 6, knoxed: 2, monitored: 9, severity: 34 },
  { id: "behavioral", icon: "⊟", label: "Behavioral Profile Analysis", vector: "V-16", nuked: 4, knoxed: 13, monitored: 6, severity: 71 },
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
