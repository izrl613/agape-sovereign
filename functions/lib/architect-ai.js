"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.architectApi = void 0;
/* eslint-disable require-jsdoc, new-cap, max-len */
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
/**
 * Architect AI runs on the Gemini free tier (zero marginal cost).
 * Owner setup (one time): put GEMINI_API_KEY=<free AI Studio key> in a
 * gitignored functions/.env.agape-sovereign file and redeploy, OR set
 * it in the Firebase console (Functions > architectApi > env vars).
 * A defaulted string param (not defineSecret) is used on purpose: a
 * secret binding makes `firebase deploy` FAIL until the secret exists,
 * which would block production deploys. Until a key is provided this
 * endpoint returns 501 ARCHITECT_AI_NOT_CONFIGURED and the web app
 * answers with its labelled on-device knowledge engine.
 * Canned/fake AI replies are banned.
 *
 * Model Selection:
 * - Free tier: gemini-2.5-flash-lite (mandatory - older models return HTTP 404)
 * - Trial Credit ($1000): can configure GEMINI_MODEL to use advanced models
 * - Set GEMINI_MODEL env var to override: gemini-1.5-flash, gemini-1.5-pro, etc.
 */
const geminiApiKey = (0, params_1.defineString)("GEMINI_API_KEY", { default: "" });
// Model configurable via GEMINI_MODEL env var — default to mandated free-tier model
const GEMINI_MODEL = (0, params_1.defineString)("GEMINI_MODEL", { default: "gemini-2.5-flash-lite" });
const app_1 = require("firebase-admin/app");
const app_check_1 = require("firebase-admin/app-check");
const auth_1 = require("firebase-admin/auth");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = require("express-rate-limit");
const helmet_1 = __importDefault(require("helmet"));
// Admin init
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const appCheck = (0, app_check_1.getAppCheck)();
const auth = (0, auth_1.getAuth)();
const architectApp = (0, express_1.default)();
architectApp.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowed = [
            "https://sovereign.nyc",
            "https://agape-sovereign.web.app",
            "https://sovereign.nyc",
            "http://localhost:5173",
            "http://localhost:5000",
        ];
        if (allowed.includes(origin))
            return callback(null, true);
        callback(null, false);
    },
    credentials: true,
}));
architectApp.use(express_1.default.json({ limit: "256kb" }));
// Helmet security headers
architectApp.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
}));
// Rate limiting — strict 15 RPM for 100% Free-Tier GCP compliance
// https://firebase.google.com/docs/functions/limits#default_quotas
// 1,000 RPD / 15 RPM / 250k TPM free tier hard caps
const architectLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000, // 60-second window
    max: 15, // absolute 15 RPM free-tier cap
    message: { error: "Rate limit exceeded — 15 RPM free-tier cap. Batching active. Please wait 60s." },
    standardHeaders: true,
    legacyHeaders: false,
});
architectApp.use(architectLimiter);
// App Check — MANDATORY for 100% Free-Tier GCP protection.
// Without App Check, bots can bypass client and exhaust the 15 RPM free-tier
// limit instantly, taking the platform offline. reCAPTCHA Enterprise must be
// enabled in the Google Cloud Console and the Site Key placed in .env.
if (process.env.RECAPTCHA_ENABLED !== "true") {
    console.error("[architectApi] CRITICAL: RECAPTCHA_ENABLED is not set to 'true'. " +
        "Bot abuse will exhaust the 15 RPM free-tier quota. " +
        "Set RECAPTCHA_ENABLED=true in functions/.env and redeploy.");
}
// Always verify — no fallback to unprotected mode
architectApp.use(async (req, res, next) => {
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (!appCheckToken) {
        res.status(401).json({ error: "App Check required — bot protection active" });
        return;
    }
    try {
        await appCheck.verifyToken(appCheckToken);
        next();
    }
    catch (_a) {
        res.status(401).json({ error: "Invalid App Check token" });
    }
});
// Auth verification
async function requireAuth(req) {
    const authHeader = req.get("authorization");
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
        throw new Error("Authentication required");
    }
    const token = authHeader.slice("Bearer ".length);
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || "" };
}
// POST /api/architect
const architectRouter = express_1.default.Router();
architectRouter.post("/", architectLimiter, async (req, res) => {
    var _a, _b, _c, _d;
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
            ? history.slice(-10).map((m) => `${m.role}: ${m.content}`).join("\n")
            : "";
        const apiKey = geminiApiKey.value();
        if (!apiKey) {
            res.status(501).json({
                error: "ARCHITECT_AI_NOT_CONFIGURED",
                detail: "Set the GEMINI_API_KEY secret (Gemini free tier) to enable cloud Architect AI.",
            });
            return;
        }
        const receipts = Array.isArray(req.body.receipts) ? req.body.receipts.slice(0, 64) : [];
        const receiptLines = receipts.length
            ? receipts.map((r) => `- ${r.module}: ${r.status} via ${r.source} (sealed ${r.sealedAt}, SHA-256 ${r.sha256Id}...)`).join("\n")
            : "No sealed module receipts yet.";
        const systemPrompt = [
            "You are Architect AI, the privacy and security assistant inside",
            "Agape Sovereign AI, a zero-knowledge digital-identity protection app.",
            "Rules you must follow:",
            "1. Only reason over the sealed receipt ledger provided below.",
            "   Never invent findings, scores, breach data, or scan results.",
            "2. Plaintext identity data is encrypted on the user device;",
            "   you never receive it and must never ask for passwords, document",
            "   numbers, seed phrases, or other secrets.",
            "3. Verification sources are free keyless APIs where they honestly",
            "   exist; otherwise receipts say SELF_ATTESTED. Respect that nuance.",
            "4. Be practical: give concrete next actions tied to receipts,",
            "   especially any MATCH_FOUND (confirmed third-party exposure).",
            "5. Answer general privacy/security questions accurately and plainly.",
            "",
            "USER SEALED LEDGER (hashes + verification outcomes only):",
            receiptLines,
            context ? `\nRECENT CONVERSATION:\n${context}` : "",
        ].join("\n");
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts: [{ text: String(message).slice(0, 4000) }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            }),
        });
        if (!geminiRes.ok) {
            firebase_functions_1.logger.error("Gemini request failed", { status: geminiRes.status });
            res.status(502).json({ error: "ARCHITECT_AI_UPSTREAM_ERROR" });
            return;
        }
        const geminiJson = (await geminiRes.json());
        const reply = ((_d = (_c = (_b = (_a = geminiJson === null || geminiJson === void 0 ? void 0 : geminiJson.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.map((p) => p.text || "").join("")) || "";
        if (!reply) {
            res.status(502).json({ error: "ARCHITECT_AI_EMPTY_RESPONSE" });
            return;
        }
        res.json({ reply, uid, model: GEMINI_MODEL });
    }
    catch (error) {
        firebase_functions_1.logger.error("Architect AI Error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        if (message === "Authentication required") {
            res.status(401).json({ error: message });
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});
architectApp.use("/api/architect", architectRouter);
exports.architectApi = (0, https_1.onRequest)({
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    invoker: "public",
    // GEMINI_API_KEY arrives via the defaulted param above; no secret binding.
    serviceAccount: "firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com",
}, architectApp);
//# sourceMappingURL=architect-ai.js.map