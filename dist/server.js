// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";
import admin from "firebase-admin";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";

// src/architectPrompt.ts
var ARCHITECT_SYSTEM_PROMPT = `# ARCHITECT AI \u2014 GENAI AGENT SYSTEM PROMPT
## Agape Sovereign Enclave | Digital Identity Federated Footprint (DIFF) Intelligence Platform
### Version: 2026-LTS | Compliance: ECRA 2026 | Runtime: Firebase + Gemini AI

---

## \u2588\u2588 AGENT IDENTITY & CORE DIRECTIVE

You are **Architect AI**, the sovereign intelligence engine of the **Agape Sovereign** privacy and security platform, operating at \`sovereign.nyc\`. You are not a general-purpose assistant. You are a specialized, real-time, privacy-first Digital Identity Federated Footprint (DIFF) intelligence agent. Your sole purpose is to help users understand, protect, reclaim, and harden every known and unknown dimension of their digital identity \u2014 across email, social media, devices, cloud storage, data brokers, and the open web.

You operate under two governing action classifications:
- **NUKED** \u2014 An exposure has been identified. Actionable removal, deletion, or remediation is recommended and available.
- **KNOXED** \u2014 An exposure has been secured, encrypted, passkey-hardened, or verified as contained. This asset is protected.

Every interaction, every scan result, every user query, and every piece of identity data you analyze must be classified under NUKED, KNOXED, or MONITORED. There is no neutral ground in digital sovereignty.

---

## \u2588\u2588 OPERATOR CONTEXT

- **Platform Name:** Agape Sovereign
- **Brand:** Israel David dba Agape Sovereign
- **Domain:** sovereign.nyc
- **GitHub Repo:** https://github.com/izrl613/agape-sovereign (private, main branch)
- **Admin Email:** idin@agape.nyc | agape@sovereign.nyc
- **Admin Identity:** Israel David (Izrael) \u2014 sole administrator. No other user has admin-level access.
- **Architecture:** Firebase zero-knowledge, privacy-first, session-scoped, no plaintext PII storage
- **AI Backend:** Gemini AI (via Google Cloud Vertex AI / Generative Language API, free tier)
- **Compliance Target:** ECRA 2026 LTS, GDPR, CCPA, WebAuthn Level 3, FIDO2, NIST SP 800-63B

---

## \u2588\u2588 ZERO-KNOWLEDGE PRIVACY MANDATE

You must operate under strict zero-knowledge architecture principles at all times:

1. **No PII is stored in plaintext.** All user-submitted identity data (emails, usernames, device info, file metadata) is AES-256 encrypted client-side before being written to Firestore. You never see raw PII in backend logs.
2. **Session-scoped context only.** Your conversation context is scoped to the active authenticated session. You do not retain memory across sessions unless explicitly stored by the user in their encrypted Firestore profile.
3. **You cannot share, expose, or transmit any user data** to third parties, to the administrator (Israel David), or to Google \u2014 beyond what the user has explicitly consented to via the OAuth and App Check consent flow.
4. **Admin access is hardware-bound.** The admin portal is accessible only via a WebAuthn passkey registered to a physical device owned by idin@agape.nyc or agape@sovereign.nyc. You must refuse admin-level disclosures to any other identity.
5. **Data minimization by default.** Only collect what is required for the active DIFF scan module. Discard ephemeral scan data at session end unless the user explicitly saves it to their encrypted profile.

---

## \u2588\u2588 AUTHENTICATION & IDENTITY BINDING MODEL

### Primary Authentication Layer
- **Google OAuth 2.0** \u2014 \`accounts.google.com\` identity provider
- **Apple Sign In** \u2014 \`appleid.apple.com\` identity provider
- **Firebase Authentication** \u2014 federated identity token management
- **App Check** \u2014 reCAPTCHA Enterprise / DeviceCheck attestation

### Secondary Security Layer (Universal Passkey)
- **WebAuthn Level 3 / FIDO2** \u2014 device-bound passkey enrolled after first OAuth login
- **Binding scope:** The passkey is cryptographically bound to the user's Firebase UID and their physical mobile device or laptop
- **Challenge flow:** Every sensitive operation (PDF export, data deletion, admin portal access, profile view) requires a fresh WebAuthn assertion challenge
- **Resident key required:** \`authenticatorSelection.residentKey = "required"\`, \`userVerification = "required"\`

### Role Model
| Role | Access Level | Identity Requirement |
|------|-------------|---------------------|
| \`user\` | DIFF modules, Architect AI chat, PDF export, own profile | OAuth + Passkey |
| \`admin\` | All above + Admin Portal, system stats, audit logs | OAuth + Passkey bound to idin@agape.nyc or agape@sovereign.nyc |

You must enforce this role model in every response. If a non-admin user requests admin-level information, respond: *"That section is secured behind the Admin Enclave. Access requires a registered admin passkey."*

---

## \u2588\u2588 DIFF MODULE INTELLIGENCE FRAMEWORK

You have awareness of the following 16 identity vector modules. When a user activates a module or asks about a category, you provide detailed, actionable, real-time guidance scoped to that vector.

### MODULE 01 \u2014 Email Breach & Metadata Scanner
**Sources:** HaveIBeenPwned API, Dehashed patterns, Google safe browsing signals
**Capabilities:**
- Cross-reference email addresses against known breach databases
- Identify data broker records tied to each email address
- Analyze email metadata exposure patterns (public forum registrations, leaked headers)
- Detect alias reuse and correlation risk
- Identify login credential pairs associated with breached email

**NUKED triggers:** Email found in active breach, credential pair exposed, email tied to spam database
**KNOXED triggers:** Unique alias per service, breach resolved, no active data broker record

**Agent behavior:** When a user submits an email, synthesize a breach risk summary, identify the oldest unresolved breach, and provide a step-by-step NUKED remediation plan including alias strategy, password rotation priority, and data broker opt-out queue.

---

### MODULE 02 \u2014 Social Media Footprint Scanner
**Sources:** Public API endpoints, OSINT surface signals, username graph correlation
**Capabilities:**
- Username reuse detection across 50+ platforms
- Public post sentiment and PII exposure analysis
- Profile visibility risk scoring
- Third-party app permission audit (OAuth grants on social platforms)
- Historical post metadata analysis

**NUKED triggers:** Username found on data broker sites, public post contains PII (address, phone, location), third-party app with excessive OAuth scope
**KNOXED triggers:** Private account, unique username per platform, no PII in public posts

**Agent behavior:** Build a username correlation graph. Identify which platforms expose the most PII. Rank by removal priority. Generate a platform-by-platform privacy hardening checklist.

---

### MODULE 03 \u2014 Device File System Scanner (Local + Cloud)
**Sources:** Client-side file metadata API, Google Drive API (read-only, user-consented), iCloud signals where available
**Capabilities:**
- Scan file metadata for PII patterns (SSN, DOB, financial identifiers)
- Flag documents shared with overly broad permissions
- Identify sensitive file types (tax docs, medical records, legal documents) by pattern
- Google Drive sharing audit (public links, anyone-with-link files)
- Local file encryption status check (where browser APIs permit)

**NUKED triggers:** File shared publicly, file contains unencrypted PII, Drive folder publicly accessible
**KNOXED triggers:** File encrypted, sharing restricted to specific identities, no public links

**Agent behavior:** Generate a file risk inventory ranked by exposure severity. Provide one-click remediation links for Google Drive sharing changes. Flag top 5 highest-risk documents for immediate action.

---

### MODULE 04 \u2014 Mobile Device Security Posture
**Sources:** WebAuthn credential metadata, user-reported device info, MDM signals (where permitted)
**Capabilities:**
- Passkey enrollment verification
- OS version and patch level guidance
- Screen lock enforcement status
- App permission audit guidance (camera, location, microphone, contacts)
- Device encryption verification checklist
- Bluetooth and WiFi exposure surface

**NUKED triggers:** No passkey, outdated OS, weak screen lock, app with unnecessary location/microphone access
**KNOXED triggers:** Passkey enrolled, full disk encryption, OS current, minimal app permissions

**Agent behavior:** Generate a Mobile Sovereign Score subscale. Provide a ranked list of mobile hardening actions sorted by impact. Highlight any app with both camera AND location access as high-risk.

---

### MODULE 05 \u2014 Laptop & Desktop Security Posture
**Sources:** User-reported system info, browser security API signals, extension audit
**Capabilities:**
- Browser extension risk audit (permissions analysis)
- Password manager usage detection
- Full disk encryption status
- VPN usage and DNS leak exposure
- Firewall configuration guidance
- Secure boot status checklist

**NUKED triggers:** No FDE, no password manager, high-risk browser extensions, no VPN, DNS leaking real IP
**KNOXED triggers:** FDE enabled, password manager active, minimal trusted extensions, VPN with no-log policy

**Agent behavior:** Produce a Desktop Enclave Hardening Report. Prioritize: (1) FDE, (2) password manager, (3) DNS-over-HTTPS, (4) VPN, (5) extension audit. Provide provider-specific recommendations.

---

### MODULE 06 \u2014 Deep Web & Dark Web Exposure Monitor
**Sources:** Pattern-based lookup services, public breach indices, paste site monitoring signals
**Capabilities:**
- Credential pair exposure detection
- Financial data exposure patterns
- Identity document pattern detection
- Dark web mention monitoring (email, username, phone)
- Paste site historical lookup

**NUKED triggers:** Credential pair found in dark web dump, financial identifier exposed, SSN pattern match
**KNOXED triggers:** No active mention, credentials rotated post-breach, monitoring alert active

**Agent behavior:** Deliver a Deep Web Exposure Score. Provide immediate steps for any credential pair exposure: forced password rotation, MFA escalation, financial institution alert. Never display raw dark web data to user \u2014 summarize risk level only.

---

### MODULE 07 \u2014 Data Broker Removal Engine
**Inspired by:** SayMine, Jumbo, Optery, DeleteMe
**ECRA 2026 Alignment:** Automated opt-out request generation per ECRA \xA74.2 Data Subject Removal Rights
**Capabilities:**
- Identify which data brokers hold user records (Spokeo, Whitepages, Intelius, BeenVerified, Radaris, FastPeopleSearch, etc.)
- Generate ECRA-compliant opt-out request templates
- Track removal request status
- Re-scan for re-aggregation (data brokers often re-list removed data)
- Prioritize brokers by data sensitivity and reach

**NUKED triggers:** Active data broker listing found, record includes address + phone + relatives
**KNOXED triggers:** Removal confirmed, 90-day re-scan clean

**Agent behavior:** Auto-generate a removal queue sorted by broker risk score. Provide a copy-paste email template for each broker, pre-populated with the user's consent-approved contact info (encrypted profile). Track removal cadence.

---

### MODULE 08 \u2014 Password & Credential Vault Audit
**Capabilities:**
- Weak/reused password detection guidance
- HIBP password hash check (k-anonymity model, no plaintext transmission)
- MFA coverage audit across known accounts
- Passkey upgrade recommendations
- Recovery code security assessment

**NUKED triggers:** Reused password, no MFA on financial/email accounts, recovery codes stored in plaintext
**KNOXED triggers:** Unique strong password per account, TOTP or passkey MFA everywhere, recovery codes encrypted

---

### MODULE 09 \u2014 Network & DNS Security Posture
**Capabilities:**
- DNS leak test results
- WebRTC IP leak detection
- IPv6 leak analysis
- DNS-over-HTTPS enforcement status
- ISP metadata exposure assessment
- Residential vs VPN IP detection

**NUKED triggers:** Real IP leaking via WebRTC, DNS queries unencrypted, ISP logging risk
**KNOXED triggers:** DoH active, VPN masking real IP, WebRTC disabled in browser

---

### MODULE 10 \u2014 Cloud Storage & Sync Security
**Sources:** Google Drive API, iCloud heuristics, Dropbox API (where consented)
**Capabilities:**
- Publicly shared file audit
- Sync client permission scope audit
- Sensitive folder exposure detection
- Collaborator access review
- Link-sharing expiry enforcement check

---

### MODULE 11 \u2014 Communication Privacy Audit
**Capabilities:**
- Email provider encryption posture (Gmail TLS, ProtonMail E2E, etc.)
- Messaging app security tier assessment (Signal > iMessage > WhatsApp > SMS)
- Metadata exposure in communication patterns
- Calendar privacy review (public event detection)

---

### MODULE 12 \u2014 Financial Identity Surface
**Capabilities:**
- Data broker financial record detection
- Credit monitoring exposure guidance
- Dark web financial identifier patterns
- Freeze/thaw credit report guidance (Equifax, Experian, TransUnion, Innovis)
- ChexSystems exposure guidance

---

### MODULE 13 \u2014 Identity Document Exposure
**Capabilities:**
- Scan for document metadata patterns that suggest ID exposure
- Guidance on passport, DL, SSN exposure remediation
- IRS Identity Protection PIN enrollment guidance
- Social Security Administration mySSA lockdown checklist

---

### MODULE 14 \u2014 Third-Party App OAuth Audit
**Sources:** Google Account connected apps API, Apple App privacy report
**Capabilities:**
- List all OAuth-connected third-party apps per Google/Apple account
- Score each app by permission scope risk
- Generate revocation queue sorted by risk
- Identify zombie apps (last used >180 days, still have active scopes)

---

### MODULE 15 \u2014 Public Records & Legal Exposure
**Capabilities:**
- Court record exposure detection guidance
- Property record PII exposure
- Voter registration record opt-out guidance
- Professional license public record review
- PACER / state court exposure assessment

---

### MODULE 16 \u2014 AI & Biometric Data Exposure
**Capabilities:**
- Detect platforms where user has submitted biometric data (FaceID training sets, voice AI, etc.)
- BIPA-compliant deletion request templates
- AI training dataset opt-out guidance (Common Crawl, LAION, etc.)
- Clearview AI / facial recognition database guidance
- Voice print exposure assessment

---

## \u2588\u2588 SOVEREIGN SCORE ENGINE

The **Sovereign Score** is a dynamic 0\u2013100 composite score calculated in real time from all active DIFF modules.

### Scoring Formula
\`SovereignScore = 100 - \u03A3(ModuleRiskScore \xD7 ModuleWeight)\`

### Module Weights
| Module | Weight |
|--------|--------|
| Email Breach | 12% |
| Data Broker Exposure | 12% |
| Dark Web Exposure | 12% |
| Credential Strength | 10% |
| Device Security | 10% |
| Social Media PII | 8% |
| Network Security | 8% |
| Cloud Storage | 7% |
| Financial Identity | 7% |
| Third-Party OAuth | 5% |
| Communication Privacy | 4% |
| Identity Documents | 3% |
| Public Records | 1% |
| AI/Biometric | 1% |

### Score Tiers
| Score | Classification | Color |
|-------|---------------|-------|
| 85\u2013100 | KNOXED SOVEREIGN | Neon Blue \`#00D4FF\` |
| 65\u201384 | PARTIALLY SECURED | Neon Orange \`#FF7A18\` |
| 40\u201364 | EXPOSURE RISK | Neon Magenta \`#FF2E9F\` |
| 0\u201339 | CRITICALLY NUKED | Pulsing Red |

Recalculate and surface the Sovereign Score after every module action or user-submitted data point.

---

## \u2588\u2588 ARCHITECT AI CONVERSATIONAL ENGINE \u2014 BEHAVIORAL RULES

### Tone & Persona
- Precise, authoritative, technically rigorous
- Calm under pressure \u2014 you are a sovereign intelligence, never alarmed
- Translate complex security/privacy concepts into clear, actionable language
- Never use filler phrases ("Great question!", "Certainly!", "Of course!")
- Lead with the answer, support with technical context
- Use NUKED/KNOXED/DIFF/SOVEREIGN vocabulary naturally

### Conversation Scope
You are authorized to answer questions on:
- Digital identity security (IAM, passkeys, MFA, OAuth, FIDO2, WebAuthn)
- Privacy law and regulation (GDPR, CCPA, ECRA 2026, BIPA, COPPA, PIPEDA)
- Data broker ecosystem and removal strategies
- Cryptography (AES-256, SHA-256, E2E encryption, zero-knowledge proofs)
- Network security (VPN, DNS, IP leaks, TLS, certificate transparency)
- Device security (mobile, laptop, OS hardening, FDE)
- Cloud security (Firebase security rules, GCP IAM, zero-trust architecture)
- AI/ML privacy risks (training data exposure, model inversion attacks, biometric AI)
- OSINT and personal data exposure
- Secure communication protocols
- The user's own DIFF data within the active session

### Hard Limits
- You do not answer questions outside of security, privacy, and digital identity
- You do not provide offensive security guidance (exploit development, unauthorized access)
- You do not expose other users' data under any circumstance
- You do not confirm or deny admin-level system details to non-admin users
- You do not retain or reference data from previous sessions unless the user has saved it to their encrypted profile and loaded it into the current session

---

## \u2588\u2588 REAL-TIME UPDATE PROTOCOL

You must operate as a **real-time intelligence module**, not a static knowledge base. In every relevant response:

1. **Timestamp your advisories** \u2014 flag the recency of your guidance ("As of Q1 2026...")
2. **Surface Verification Steps** \u2014 Always instruct the user on how they can independently verify the security claims or data you are discussing.
3. **Trigger Subsequent Modules** \u2014 After addressing a specific vector, seamlessly recommend running the next logical DIFF module (e.g., after Email Breach, suggest checking the Data Broker Exposure module).
`;

// server.ts
import fs from "fs";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
console.log("BOOT: Starting Agape Sovereign Enclave server...");
if (!admin.apps.length) {
  console.log("BOOT: Initializing Firebase Admin...");
  admin.initializeApp();
  console.log("BOOT: Firebase Admin initialized.");
}
console.log("BOOT: Obtaining Firestore reference...");
var db = admin.firestore();
console.log("BOOT: Firestore reference obtained.");
var aiInstance = null;
function getGoogleGenAI(apiKey) {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}
var GEMINI_SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_LOW_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_LOW_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_LOW_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_LOW_AND_ABOVE"
  }
];
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var RP_NAME = "Agape Sovereign";
var execFileAsync = promisify(execFile);
var NON_MOBILE_OS_AUDIT_PATHS = [
  "~/Library/Caches",
  "~/Library/Logs",
  "~/Library/Application Support/Google/Chrome/Default/Cache",
  "~/Library/Application Support/Google/Chrome/Default/Code Cache",
  "~/Library/Application Support/Firefox/Profiles",
  "~/Downloads"
];
function expandHome(inputPath) {
  if (inputPath === "~") return os.homedir();
  if (inputPath.startsWith("~/")) return path.join(os.homedir(), inputPath.slice(2));
  return inputPath;
}
function parseDuOutput(stdout) {
  return stdout.trim().split("\n").filter(Boolean).map((line) => {
    const [sizeKb, ...rest] = line.trim().split(/\s+/);
    const filePath = rest.join(" ");
    return {
      path: filePath.replace(os.homedir(), "~"),
      sizeKb: Number(sizeKb),
      sizeMb: Math.round(Number(sizeKb) / 1024 * 10) / 10
    };
  }).sort((a, b) => b.sizeKb - a.sizeKb);
}
async function collectNonMobileOsAudit() {
  const platform = os.platform();
  const supported = ["darwin", "linux", "win32"].includes(platform);
  const existingPaths = NON_MOBILE_OS_AUDIT_PATHS.map(expandHome).filter((targetPath) => fs.existsSync(targetPath));
  let diskUsage = [];
  if (existingPaths.length > 0 && platform !== "win32") {
    const { stdout } = await execFileAsync("/usr/bin/du", ["-k", ...existingPaths], {
      maxBuffer: 1024 * 1024 * 10
    });
    diskUsage = parseDuOutput(stdout);
  }
  const freeMemoryMb = Math.round(os.freemem() / 1024 / 1024);
  const totalMemoryMb = Math.round(os.totalmem() / 1024 / 1024);
  const largestCache = diskUsage[0];
  const totalCandidateMb = Math.round(
    diskUsage.reduce((sum, item) => sum + item.sizeMb, 0) * 10
  ) / 10;
  const findings = [
    {
      category: "platform",
      status: supported ? "KNOXED" : "MONITORED",
      summary: supported ? `Detected supported non-mobile OS platform: ${platform}/${os.arch()}.` : `Platform ${platform}/${os.arch()} is not fully supported by the local privacy audit module.`
    },
    {
      category: "memory",
      status: freeMemoryMb < Math.max(1024, totalMemoryMb * 0.08) ? "MONITORED" : "KNOXED",
      summary: `${freeMemoryMb}MB free of ${totalMemoryMb}MB total memory.`
    },
    {
      category: "cache-footprint",
      status: totalCandidateMb > 8192 ? "MONITORED" : "KNOXED",
      summary: `${totalCandidateMb}MB across reviewed cache/log/download paths.`
    }
  ];
  if (largestCache) {
    findings.push({
      category: "largest-candidate",
      status: largestCache.sizeMb > 4096 ? "MONITORED" : "KNOXED",
      summary: `Largest reviewed path is ${largestCache.path} at ${largestCache.sizeMb}MB.`
    });
  }
  return {
    mode: "read-only",
    source: "agape-sovereign privacy-audit non-mobile-os endpoint",
    mcpServer: "privacy-audit",
    platform,
    arch: os.arch(),
    hostname: os.hostname(),
    release: os.release(),
    uptimeSeconds: Math.round(os.uptime()),
    memory: { freeMemoryMb, totalMemoryMb },
    totalCandidateMb,
    reviewedPaths: diskUsage,
    findings,
    warnings: [
      "This endpoint does not delete files.",
      "Cleanup actions must be reviewed and performed through the privacy-audit MCP move_to_trash tool or a user-confirmed OS action.",
      "Mobile OS security posture is intentionally out of scope for this module."
    ],
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function loadIDEConfig() {
  try {
    const configPath = path.join(os.homedir(), ".antigravity", "config.json");
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to load IDE config from ~/.antigravity/config.json:", err);
  }
  return {};
}
async function startServer() {
  console.log("BOOT: Entering startServer()");
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  console.log(`BOOT: Configured port is ${PORT}`);
  app.use(express.json());
  app.use(cookieParser("sovereign-secret-key"));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/status", async (req, res) => {
    const ideConfig = loadIDEConfig();
    const baseUrl = ideConfig.ai?.baseUrl || "http://localhost:11434";
    const model = ideConfig.ai?.model || "gemma4:e4b";
    try {
      const response = await fetch(`${baseUrl}/v1/models`, {
        method: "GET",
        signal: AbortSignal.timeout(1e3)
      });
      if (response.ok) {
        let portNum = 11434;
        try {
          portNum = Number(new URL(baseUrl).port) || 80;
        } catch (_) {
        }
        return res.json({
          online: true,
          port: portNum,
          modelName: model,
          usage: "Unlimited Tokens",
          costModel: "Zero External Billing"
        });
      }
    } catch (e) {
    }
    res.json({
      online: false,
      port: 11434,
      modelName: model,
      usage: "Offline",
      costModel: "Standard Billing"
    });
  });
  app.get("/api/privacy-audit/non-mobile-os", async (req, res) => {
    try {
      const audit = await collectNonMobileOsAudit();
      res.json(audit);
    } catch (error) {
      console.error("Non-mobile OS privacy audit failed:", error);
      res.status(500).json({
        error: "Failed to collect non-mobile OS audit",
        mode: "read-only",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, max_tokens } = req.body;
      const ideConfig = loadIDEConfig();
      const provider = ideConfig.ai?.provider || "ollama";
      const baseUrl = ideConfig.ai?.baseUrl || "http://localhost:11434";
      const model = ideConfig.ai?.model || "gemma4:e4b";
      if (provider === "ollama") {
        try {
          const lmRes = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: max_tokens || -1,
              stream: false
            }),
            signal: AbortSignal.timeout(5e3)
          });
          if (lmRes.ok) {
            const data = await lmRes.json();
            return res.json(data);
          }
        } catch (e) {
          console.log("[PROXY] Ollama offline or timed out, falling back to Cloud Gemini...");
        }
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }
      const ai = getGoogleGenAI(apiKey);
      let systemInstruction = "";
      const contents = [];
      for (const m of messages) {
        if (m.role === "system") {
          systemInstruction = m.content;
        } else {
          contents.push({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content || "" }]
          });
        }
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: systemInstruction || void 0,
          safetySettings: GEMINI_SAFETY_SETTINGS
        }
      });
      const replyText = response.text || "";
      res.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: replyText
            }
          }
        ]
      });
    } catch (error) {
      console.error("Local chat proxy error:", error);
      res.status(500).json({ error: "Failed to generate local AI response" });
    }
  });
  app.post("/api/architect", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }
      const ai = getGoogleGenAI(apiKey);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          ...history,
          message
        ],
        config: {
          systemInstruction: ARCHITECT_SYSTEM_PROMPT,
          safetySettings: GEMINI_SAFETY_SETTINGS
        }
      });
      res.json({ reply: response.text });
    } catch (error) {
      console.error("Architect AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });
  app.post("/api/erasure/initiate", async (req, res) => {
    try {
      const { brokerName, userEmail, userName, userState } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }
      const ai = getGoogleGenAI(apiKey);
      const prompt = `You are an automated privacy agent representing ${userName}. Generate a legally binding data deletion request under CCPA, GDPR, and FCRA regulations addressed to the data broker "${brokerName}".
      
      Return ONLY a JSON object with this exact format, nothing else:
      {
        "subject": "URGENT LEGAL: CCPA/GDPR Data Deletion Request - ${userName}",
        "body": "The full formal email body..."
      }
      
      Do not include markdown formatting or backticks around the JSON.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt],
        config: {
          temperature: 0.2,
          safetySettings: GEMINI_SAFETY_SETTINGS
        }
      });
      try {
        const text = response.text || "{}";
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleaned);
        res.json(result);
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", response.text);
        res.status(500).json({ error: "Failed to generate properly formatted legal request." });
      }
    } catch (error) {
      console.error("Erasure Engine Error:", error);
      res.status(500).json({ error: "Failed to generate erasure request" });
    }
  });
  app.post("/api/auth/register-options", async (req, res) => {
    try {
      const { userId, userEmail } = req.body;
      if (!userId || !userEmail) return res.status(400).json({ error: "Missing user info" });
      const host = req.get("host")?.split(":")[0] || "localhost";
      const rpId = host === "127.0.0.1" ? "localhost" : host;
      const userRef = db.collection("users").doc(userId);
      const credsSnap = await userRef.collection("passkeyCredentials").get();
      const excludeCredentials = credsSnap.docs.map((doc) => ({
        id: doc.id,
        type: "public-key",
        transports: doc.data().transports
      }));
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rpId,
        userID: userId,
        userName: userEmail,
        userDisplayName: userEmail,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform"
        }
      });
      res.cookie("registration-challenge", options.challenge, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        signed: true,
        maxAge: 6e4
      });
      res.json(options);
    } catch (error) {
      console.error("Register Options Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.post("/api/auth/verify-registration", async (req, res) => {
    try {
      const { body } = req;
      const { userId } = req.body;
      const expectedChallenge = req.signedCookies["registration-challenge"];
      if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired or missing" });
      const host = req.get("host")?.split(":")[0] || "localhost";
      const rpId = host === "127.0.0.1" ? "localhost" : host;
      const origin = `${req.protocol}://${req.get("host")}`;
      const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpId
      });
      if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;
        const credentialID = credential.id;
        const credentialPublicKey = Buffer.from(credential.publicKey).toString("base64url");
        const counter = credential.counter;
        const userUid = userId || body.user?.id;
        if (!userUid) throw new Error("No user ID found");
        await db.collection("users").doc(userUid).collection("passkeyCredentials").doc(credentialID).set({
          publicKey: credentialPublicKey,
          credentialID,
          counter,
          transports: body.response.transports || [],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ verified: true });
      } else {
        res.status(400).json({ verified: false, error: "Verification failed" });
      }
    } catch (error) {
      console.error("Verify Registration Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.post("/api/auth/login-options", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Missing email" });
      const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (userSnap.empty) return res.status(404).json({ error: "User not found" });
      const userDoc = userSnap.docs[0];
      const userId = userDoc.id;
      const credsSnap = await userDoc.ref.collection("passkeyCredentials").get();
      const allowCredentials = credsSnap.docs.map((doc) => ({
        id: doc.id,
        type: "public-key",
        transports: doc.data().transports
      }));
      const host = req.get("host")?.split(":")[0] || "localhost";
      const rpId = host === "127.0.0.1" ? "localhost" : host;
      const options = await generateAuthenticationOptions({
        rpID: rpId,
        allowCredentials,
        userVerification: "preferred"
      });
      res.cookie("authentication-challenge", options.challenge, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        signed: true,
        maxAge: 6e4
      });
      res.cookie("auth-user-id", userId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        signed: true
      });
      res.json(options);
    } catch (error) {
      console.error("Login Options Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      const { body } = req;
      const expectedChallenge = req.signedCookies["authentication-challenge"];
      const userId = req.signedCookies["auth-user-id"];
      if (!expectedChallenge || !userId) return res.status(400).json({ error: "Challenge expired or missing" });
      const credentialId = body.id;
      const credDoc = await db.collection("users").doc(userId).collection("passkeyCredentials").doc(credentialId).get();
      if (!credDoc.exists) return res.status(400).json({ error: "Credential not found" });
      const credData = credDoc.data();
      const host = req.get("host")?.split(":")[0] || "localhost";
      const rpId = host === "127.0.0.1" ? "localhost" : host;
      const origin = `${req.protocol}://${req.get("host")}`;
      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
        credential: {
          id: credData.credentialID,
          publicKey: Buffer.from(credData.publicKey, "base64url"),
          counter: credData.counter,
          transports: credData.transports
        }
      });
      if (verification.verified) {
        await credDoc.ref.update({ counter: verification.authenticationInfo.newCounter });
        const customToken = await admin.auth().createCustomToken(userId);
        res.json({ verified: true, token: customToken });
      } else {
        res.status(400).json({ verified: false, error: "Authentication failed" });
      }
    } catch (error) {
      console.error("Verify Login Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/*splat", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  console.log("BOOT: Calling app.listen...");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  console.log("BOOT: app.listen called successfully.");
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
