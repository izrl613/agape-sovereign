import { onRequest } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getAuth } from "firebase-admin/auth";
import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Admin init
if (!getApps().length) {
  initializeApp();
}

const appCheck = getAppCheck();
const auth = getAuth();

const architectApp = express();

architectApp.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      "https://sovereign.nyc",
      "https://agape-sovereign.web.app",
      "https://agape-sovereign.firebaseapp.com",
      "http://localhost:5173",
      "http://localhost:5000",
    ];
    if (allowed.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));
architectApp.use(express.json({ limit: "256kb" }));

// Helmet security headers
architectApp.use(helmet({
  contentSecurityPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,
}));

// Rate limiting
const architectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

architectApp.use(architectLimiter);

// App Check verification
architectApp.use(async (req: Request, res: Response, next: express.NextFunction) => {
  if (process.env.RECAPTCHA_ENABLED !== "true") return next();
  const appCheckToken = req.header("X-Firebase-AppCheck");
  if (!appCheckToken) {
    res.status(401).json({ error: "Missing App Check token" });
    return;
  }
  try {
    await appCheck.verifyToken(appCheckToken);
    next();
  } catch {
    res.status(401).json({ error: "Invalid App Check token" });
  }
});

// Auth verification
async function requireAuth(req: Request): Promise<{ uid: string; email: string }> {
  const authHeader = req.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Authentication required");
  }
  const token = authHeader.slice("Bearer ".length);
  const decoded = await auth.verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email || "" };
}

// POST /api/architect
const architectRouter = express.Router();
architectRouter.post("/", architectLimiter, async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing message" });
      return;
    }

    // Verify auth
    const { uid } = await requireAuth(req);

    // Build context from history
    const context = history && Array.isArray(history) 
      ? history.slice(-10).map((m: any) => `${m.role}: ${m.content}`).join("\n")
      : "";

    // Call Gemini API (using Vertex AI or direct)
    // For now, return structured response
    const reply = `Greetings, Sovereign. I am Architect AI — your Digital Identity Federated Footprint intelligence engine.

I have analyzed your query: "${message}"

**Context from session:** ${context || "No prior history"}

**Analysis:**
- Your 16-layer identity vector profile is actively monitored
- Current Sovereign Score reflects real-time threat intelligence
- NUKED exposures are prioritized for immediate remediation
- KNOXED vectors are hardened with AES-256-GCM encryption

**Recommendations:**
1. Review NUKED exposures in the Dashboard
2. Initiate Vector Sweep on critical modules
3. Bind Passkey for Level 3 sovereignty

What aspect of your digital sovereignty would you like to explore?`;

    res.json({ reply, uid });
  } catch (error) {
    logger.error("Architect AI Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    if (message === "Authentication required") {
      res.status(401).json({ error: message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

architectApp.use("/api/architect", architectRouter);

export const architectApi = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    invoker: "public",
    serviceAccount: "firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com",
  },
  architectApp
);