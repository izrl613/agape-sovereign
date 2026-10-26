/* eslint-disable require-jsdoc, new-cap, max-len */
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {initializeApp, getApps} from "firebase-admin/app";
import {getAppCheck} from "firebase-admin/app-check";
import {getAuth} from "firebase-admin/auth";
import express, {Request, Response} from "express";
import cors from "cors";
import {rateLimit} from "express-rate-limit";
import helmet from "helmet";

if (!getApps().length) {
  initializeApp();
}

const appCheck = getAppCheck();
const auth = getAuth();

interface ModuleSummaryInput {
  id?: string;
  name?: string;
  status?: string;
  riskScore?: number;
  verifiedBy?: string[];
  findingsCount?: number;
  headline?: string;
  sha256Seal?: string;
}

const architectApp = express();

architectApp.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      "https://sovereign.nyc",
      "https://www.sovereign.nyc",
      "https://agape-sovereign.web.app",
      "https://agape-sovereign.firebaseapp.com",
      "http://localhost:5173",
      "http://localhost:5000",
      "http://127.0.0.1:5173",
    ];
    if (allowed.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));
architectApp.use(express.json({limit: "256kb"}));

architectApp.use(helmet({
  contentSecurityPolicy: false,
  hsts: {maxAge: 31536000, includeSubDomains: true, preload: true},
  referrerPolicy: {policy: "strict-origin-when-cross-origin"},
  frameguard: {action: "deny"},
  noSniff: true,
}));

const architectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {error: "Too many requests, please try again later"},
  standardHeaders: true,
  legacyHeaders: false,
});

architectApp.use(architectLimiter);

architectApp.use(async (req: Request, res: Response, next: express.NextFunction) => {
  if (process.env.RECAPTCHA_ENABLED !== "true") return next();
  const appCheckToken = req.header("X-Firebase-AppCheck");
  if (!appCheckToken) {
    res.status(401).json({error: "Missing App Check token"});
    return;
  }
  try {
    await appCheck.verifyToken(appCheckToken);
    next();
  } catch {
    res.status(401).json({error: "Invalid App Check token"});
  }
});

async function requireAuth(req: Request): Promise<{uid: string; email: string}> {
  const authHeader = req.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Authentication required");
  }
  const token = authHeader.slice("Bearer ".length);
  const decoded = await auth.verifyIdToken(token);
  return {uid: decoded.uid, email: decoded.email || ""};
}

function synthesizeServerGuidance(
  message: string,
  sha256Id: string,
  summaries: ModuleSummaryInput[]
): string {
  const q = message.toLowerCase();
  const scanned = summaries.filter((m) => m.status && m.status !== "IDLE");
  const highRisk = scanned.filter((m) => (m.riskScore ?? 0) >= 60 || m.status === "EXPOSED");
  const verifiedApis = Array.from(
    new Set(scanned.flatMap((m) => Array.isArray(m.verifiedBy) ? m.verifiedBy : []))
  );

  const lines: string[] = [
    "### Architect AI — Zero-Knowledge Enclave Assessment",
    `- **Active SHA256 ID Binding:** \`${sha256Id ? sha256Id.slice(0, 16) + "..." + sha256Id.slice(-8) : "ENCLAVE-BOUND"}\``,
    `- **Verified Vector Telemetry:** ${scanned.length}/16 Identity Vector Modules evaluated (${highRisk.length} elevated-risk vectors).`,
  ];

  if (verifiedApis.length > 0) {
    lines.push(`- **Third-Party Zero-Cost Verifiers Consulted:** ${verifiedApis.join(", ")}`);
  }

  if (q.includes("zero-knowledge") || q.includes("sha256") || q.includes("encrypt") || q.includes("leak")) {
    lines.push(
      "",
      "**Zero-Knowledge & SHA256 ID Protection Architecture:**",
      "1. Every input entered into any of the 16 Identity Vector Modules is intercepted client-side by its dedicated Module Agent before persistence.",
      "2. Your session **SHA256 ID** derives a 256-bit `AES-256-GCM` key via `PBKDF2-SHA256` (100,000 iterations) inside the browser Web Crypto API.",
      "3. Raw secrets never touch Firestore or Cloud Storage; credential checks use 5-hex-prefix SHA-1 k-anonymity (`Add-Padding: true`) and local EXIF/MAC hashing."
    );
  } else if (q.includes("google") || q.includes("pdf") || q.includes("26") || q.includes("drive") || q.includes("dual")) {
    lines.push(
      "",
      "**Dual Security Protection & 26-Month Audit Retention:**",
      "1. Binding **Passkey (FIDO2/WebAuthn)** with **Sign-In With Google** establishes Dual Security Protection across hardware enclave possession and federated OAuth 2.0.",
      "2. Your 26-month Identity Audit PDF is cryptographically sealed with a SHA-256 digest and can be exported directly to your Federated Google Account Drive (`drive.file` least-privilege scope —Agape Sovereign cannot read any other Drive files)."
    );
  } else if (highRisk.length > 0) {
    lines.push("", "**Priority Remediation Directives from Verified Module Scans:**");
    for (const item of highRisk.slice(0, 5)) {
      lines.push(
        `- **${item.id || "IVM"} (${item.name || "Vector"})** — Risk ${item.riskScore ?? 0}/100: ${item.headline || "Elevated exposure detected; apply enclave hardening immediately."}`
      );
    }
  } else {
    lines.push(
      "",
      "**Sovereign Posture Guidance:**",
      "- Execute verification sweeps across any unscanned Identity Vector Modules (`V-01` through `V-16`) so Architect AI can correlate DNSSEC, DMARC, HIBP k-anonymity, CT log, OSV CVE, and RDAP signals.",
      "- Ask about any specific module (`V-01`..`V-16`), DNS/email hardening, passkey binding, broker opt-out rights (CPRA / GDPR Art. 17), or your 26-month audit seal."
    );
  }

  return lines.join("\n");
}

const architectRouter = express.Router();

architectRouter.get("/", (_req: Request, res: Response) => {
  res.json({status: "ok", service: "architectApi", zeroKnowledge: true});
});

architectRouter.post("/", architectLimiter, async (req: Request, res: Response) => {
  try {
    const {message, sha256Id, moduleSummaries} = req.body as {
      message?: string;
      sha256Id?: string;
      moduleSummaries?: ModuleSummaryInput[];
    };
    if (!message || typeof message !== "string") {
      res.status(400).json({error: "Missing message"});
      return;
    }

    const {uid} = await requireAuth(req);
    const summaries = Array.isArray(moduleSummaries) ? moduleSummaries.slice(0, 16) : [];
    const reply = synthesizeServerGuidance(
      message.slice(0, 4000),
      typeof sha256Id === "string" ? sha256Id : "",
      summaries
    );

    res.json({reply, uid, zeroKnowledge: true});
  } catch (error) {
    logger.error("Architect AI Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    if (message === "Authentication required") {
      res.status(401).json({error: message});
    } else {
      res.status(500).json({error: "Internal Server Error"});
    }
  }
});

architectApp.use("/", architectRouter);
architectApp.use("/api/architect", architectRouter);

export const architectApi = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    invoker: "public",
    serviceAccount: "firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com",
  },
  architectApp
);
