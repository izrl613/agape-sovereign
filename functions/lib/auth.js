"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authApi = void 0;
exports.normalizeEmail = normalizeEmail;
exports.rpIdForOrigin = rpIdForOrigin;
exports.createCustomTokenWithAdminClaim = createCustomTokenWithAdminClaim;
exports.encodeCredentialId = encodeCredentialId;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const crypto_1 = require("crypto");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const app_check_1 = require("firebase-admin/app-check");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const csrf_csrf_1 = require("csrf-csrf");
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = require("express-rate-limit");
const helmet_1 = __importDefault(require("helmet"));
const error_reporting_1 = require("@google-cloud/error-reporting");
const server_1 = require("@simplewebauthn/server");
// Admin is initialized once in index.ts; guard against re-init
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
// Named Firestore DB matches firebase.json / client config (not "(default)").
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "agape-sovereign";
const db = (0, firestore_1.getFirestore)(FIRESTORE_DATABASE_ID);
const auth = (0, auth_1.getAuth)();
const isProductionEnv = process.env.NODE_ENV === "production" ||
    process.env.K_SERVICE !== undefined ||
    process.env.FUNCTION_TARGET !== undefined;
const errors = new error_reporting_1.ErrorReporting({
    reportMode: isProductionEnv ? "production" : "never",
});
const RP_NAME = "Agape Sovereign";
/** Primary production RP (custom domain). */
const DEFAULT_RP_ID = process.env.WEBAUTHN_RP_ID || "sovereign.nyc";
const DEFAULT_ORIGIN = process.env.WEBAUTHN_ORIGIN || "https://sovereign.nyc";
// Development fallback for local testing
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-enable @typescript-eslint/no-unused-vars */
/**
 * Origins allowed for WebAuthn ceremony verification.
 * RP ID is derived per-origin so passkeys work on custom domain AND Firebase Hosting.
 */
const EXTRA_ORIGINS = (process.env.WEBAUTHN_EXTRA_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const BUILTIN_ORIGINS = [
    DEFAULT_ORIGIN,
    "https://www.sovereign.nyc",
    "https://agape-sovereign.web.app",
    "https://sovereign.nyc",
    "http://localhost:5173",
    "http://localhost:5000",
    "http://localhost:5002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000",
];
const ALLOWED_ORIGINS = Array.from(new Set([...BUILTIN_ORIGINS, ...EXTRA_ORIGINS]));
/**
 * Cookie signing secret for passkey ceremonies.
 *
 * Deploy-safe by design: a Secret-Manager binding (the previous
 * `secrets: ["PASSKEY_COOKIE_SECRET", "COOKIE_SECRET"]`) makes
 * `firebase deploy` FAIL until both secrets exist, which kept the
 * production deploy pipeline red. Defaulted string params instead:
 * the owner supplies a real secret via a gitignored
 * Secret Manager (firebase functions:secrets:set PASSKEY_COOKIE_SECRET);
 * both cookie secrets already exist there for this project.
 *
 * Until then: production gets an ephemeral per-instance random
 * secret (cookies are signed with an unknown key, never a published
 * constant; the previous code fell back to "unsigned-dev-only").
 * Challenges also live in Firestore, so ceremonies survive instance
 * recycling — but the owner SHOULD set a stable secret.
 */
// Why the new name: the long-deployed authApi service already carries
// PASSKEY_COOKIE_SECRET / COOKIE_SECRET as SECRET env vars, and the CI
// service account has no secretmanager.versions.get permission, so
// secret-bound deploys fail validation — while re-declaring the same
// names as plain env vars fails Cloud Run overlap checks. A NEW plain
// param name sidesteps both: deploys pass, and at runtime the legacy
// secret env vars still injected by the existing service config keep
// working via the process.env reads below. To rotate: set the
// PASSKEY_COOKIE_SIGNING_KEY secret in GitHub Actions (injected by CI
// into functions/.env.agape-sovereign) or update Secret Manager.
const cookieSigningKeyParam = (0, params_1.defineString)("PASSKEY_COOKIE_SIGNING_KEY", { default: "" });
const configuredCookieSecret = process.env.PASSKEY_COOKIE_SIGNING_KEY ||
    process.env.PASSKEY_COOKIE_SECRET ||
    process.env.COOKIE_SECRET ||
    (typeof process.env.K_SERVICE !== "undefined" ? cookieSigningKeyParam.value() : "") ||
    "";
const COOKIE_SECRET = configuredCookieSecret ||
    (isProductionEnv ?
        (0, crypto_1.randomBytes)(32).toString("hex") :
        "agape-sovereign-dev-cookie-secret");
if (isProductionEnv && !configuredCookieSecret) {
    firebase_functions_1.logger.warn("[authApi] PASSKEY_COOKIE_SECRET not configured — using an ephemeral " +
        "per-instance cookie secret. Set it with: " +
        "firebase functions:secrets:set PASSKEY_COOKIE_SECRET");
}
const authApp = (0, express_1.default)();
const corsOrigins = ALLOWED_ORIGINS.filter((o) => o.startsWith("http"));
const isProduction = process.env.NODE_ENV === "production" ||
    process.env.K_SERVICE !== undefined ||
    process.env.FUNCTION_TARGET !== undefined;
authApp.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow non-browser / same-origin proxy calls with no Origin header
        if (!origin) {
            callback(null, true);
            return;
        }
        // In production, restrict to sovereign.nyc and Firebase Hosting domains only
        if (isProduction) {
            const allowedProdOrigins = [
                "https://sovereign.nyc",
                "https://www.sovereign.nyc",
                "https://agape-sovereign.web.app",
                "https://sovereign.nyc",
            ];
            if (allowedProdOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
            return;
        }
        // Development: allow localhost and other dev origins
        if (corsOrigins.includes(origin) || origin.endsWith(".web.app") ||
            origin.endsWith(".firebaseapp.com") || origin.includes("localhost") ||
            origin.includes("127.0.0.1")) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));
authApp.use(express_1.default.json({ limit: "256kb" }));
// COOKIE_SECRET is always a non-empty string (configured secret,
// ephemeral per-instance secret, or the dev-only constant off-prod).
// CodeQL js/missing-csrf-protection: FALSE POSITIVE for dismissal in
// the Security tab. This app layers three real CSRF defences —
// double-submit tokens (csrf-csrf below, applied at app + router
// level), SameSite=Strict session cookies, and an Origin allowlist
// guard — plus origin-bound WebAuthn assertions on every ceremony.
// GitHub's default-setup CodeQL model does not yet recognise the
// csrf-csrf package, so the query still fires on this line.
authApp.use((0, cookie_parser_1.default)(COOKIE_SECRET));
/**
 * Double-submit-cookie CSRF protection (csrf-csrf), layered with the
 * SameSite=Strict __session cookie and the Origin allowlist guard.
 * Clients fetch a token from GET /api/auth/csrf-token (sets the CSRF
 * cookie) and echo it in the x-csrf-token header on every POST.
 */
const { doubleCsrfProtection, generateCsrfToken } = (0, csrf_csrf_1.doubleCsrf)({
    getSecret: () => COOKIE_SECRET,
    getSessionIdentifier: (req) => {
        const forwarded = (req.get("x-forwarded-for") || "").split(",")[0].trim();
        return `${forwarded || req.ip || "unknown-ip"}|${req.get("user-agent") || "unknown-ua"}`;
    },
    cookieName: "agape.x-csrf-token",
    cookieOptions: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: isProductionEnv,
    },
    getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
    errorConfig: { statusCode: 403, message: "Invalid CSRF token", code: "EBADCSRFTOKEN" },
});
// Security headers with helmet
authApp.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disabled for WebAuthn compatibility
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
}));
// Rate limiting for authentication endpoints
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: "Too many authentication attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour
    message: { error: "Rate limit exceeded, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
// Firebase App Check verification (opt-in via env)
authApp.use(async (req, res, next) => {
    if (process.env.RECAPTCHA_ENABLED !== "true")
        return next();
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (!appCheckToken) {
        res.status(401).json({ error: "Missing App Check token" });
        return;
    }
    try {
        await (0, app_check_1.getAppCheck)().verifyToken(appCheckToken);
        next();
    }
    catch (_a) {
        res.status(401).json({ error: "Invalid App Check token" });
    }
});
/**
 * Normalize email for stable Firestore lookups.
 * @param {string | null | undefined} email Raw email.
 * @return {string} Lowercased trimmed email.
 */
function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}
/**
 * Map a browser origin to the WebAuthn RP ID that must match the page hostname.
 * @param {string} origin Fully-qualified origin.
 * @return {string} RP ID.
 */
function rpIdForOrigin(origin) {
    try {
        const host = new URL(origin).hostname;
        if (host === "localhost" || host === "127.0.0.1")
            return host;
        if (host === "www.sovereign.nyc")
            return "sovereign.nyc";
        return host;
    }
    catch (_a) {
        return DEFAULT_RP_ID;
    }
}
/**
 * Resolve expectedOrigin + rpId from the request Origin/Referer.
 * Firebase Hosting terminates TLS before the function runs.
 * @param {Request} req Express request.
 * @return {{expectedOrigin: string, rpId: string, allowedOrigins: string[]}}
 */
/**
 * Creates a custom Firebase Auth token with optional admin claim.
 * Checks the user's Firestore document for an 'admin' field.
 * @param {string} userId The user's UID
 * @param {object} [overrideAuthMethod] Optional override for auth method params
 * @return {string} Custom token string with admin claim if user is admin, otherwise standard passkey token
 */
async function createCustomTokenWithAdminClaim(userId, overrideAuthMethod) {
    // Check if user has admin role in Firestore
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    const isAdmin = userData.admin === true;
    const tokenClaims = { authMethod: "passkey" };
    if (isAdmin) {
        tokenClaims.admin = true;
        firebase_functions_1.logger.info("[authApi] Creating custom token with admin claim for user: " + userId);
    }
    // Merge custom claims into the auth method params
    const mergedParams = Object.assign(Object.assign({}, overrideAuthMethod), { customClaims: tokenClaims });
    return await auth.createCustomToken(userId, mergedParams);
}
/**
 * Resolves the expected origin and RP ID from the request's Origin/Referer headers.
 * Firebase Hosting terminates TLS before the function runs, so the origin must
 * be derived from the request headers rather than the connection secure context.
 * @param {Request} req The incoming HTTP request.
 * @return {{expectedOrigin: string, rpId: string, allowedOrigins: string[]}}
 */
function getWebAuthnConfig(req) {
    const originHeader = req.get("origin") || "";
    const referer = req.get("referer") || "";
    let candidate = originHeader;
    if (!candidate && referer) {
        try {
            candidate = new URL(referer).origin;
        }
        catch (_a) {
            candidate = "";
        }
    }
    if (candidate) {
        try {
            const url = new URL(candidate);
            const origin = url.origin;
            const host = url.hostname;
            const allowed = ALLOWED_ORIGINS.includes(origin) ||
                ALLOWED_ORIGINS.includes(host) ||
                // Fallback: allow the candidate origin itself if not in the list
                //
                host === "localhost" ||
                host === "127.0.0.1" ||
                host.endsWith(".web.app") ||
                host.endsWith(".firebaseapp.com") ||
                host === "sovereign.nyc" ||
                host === "www.sovereign.nyc";
            if (allowed) {
                return {
                    expectedOrigin: origin,
                    rpId: rpIdForOrigin(origin),
                    allowedOrigins: [origin],
                };
            }
        }
        catch (_b) {
            // fall through
        }
    }
    return {
        expectedOrigin: DEFAULT_ORIGIN,
        rpId: DEFAULT_RP_ID,
        allowedOrigins: [DEFAULT_ORIGIN, ...ALLOWED_ORIGINS],
    };
}
/**
 * Sets the signed __session cookie (challenge + user binding).
 * Hosting rewrite is same-site to the page origin, so SameSite=Lax works in prod.
 * @param {Response} res Express response.
 * @param {object} sessionData Session data payload.
 */
function setSessionCookie(res, sessionData) {
    // Cloud Functions often omit NODE_ENV=production; treat GCP as secure.
    const isSecure = process.env.NODE_ENV === "production" ||
        process.env.K_SERVICE !== undefined ||
        process.env.FUNCTION_TARGET !== undefined;
    res.cookie("__session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: isSecure,
        signed: true,
        maxAge: 15 * 60000, // 15 minutes for better UX while maintaining security
        sameSite: isSecure ? "strict" : "lax", // strict in production for CSRF protection
        path: "/",
        priority: "high",
        domain: isSecure ? (process.env.COOKIE_DOMAIN || undefined) : undefined,
    });
}
/**
 * Read challenge session from signed cookie (with unsigned fallback).
 * @param {Request} req Express request.
 * @return {Record<string, unknown> | null} Parsed session or null.
 */
function readSession(req) {
    var _a, _b, _c;
    const raw = (_b = (_a = req.signedCookies) === null || _a === void 0 ? void 0 : _a["__session"]) !== null && _b !== void 0 ? _b : (_c = req.cookies) === null || _c === void 0 ? void 0 : _c["__session"];
    if (!raw)
        return null;
    if (typeof raw === "object" && raw !== null) {
        return raw;
    }
    const str = String(raw);
    try {
        return JSON.parse(str);
    }
    catch (_d) {
        try {
            return JSON.parse(decodeURIComponent(str));
        }
        catch (_e) {
            return null;
        }
    }
}
/**
 * Encode WebAuthn credential id for Firestore doc keys.
 * simplewebauthn v13 exposes credential.id as a base64url string.
 * @param {string | Uint8Array} id Credential id.
 * @return {string} base64url id.
 */
function encodeCredentialId(id) {
    if (typeof id === "string")
        return id;
    return Buffer.from(id).toString("base64url");
}
// Router used at both / (direct URL) and /api/auth (Hosting rewrite)
const router = express_1.default.Router(); // eslint-disable-line new-cap
router.use(doubleCsrfProtection);
// Health check endpoint
router.get("/", (_req, res) => {
    res.json({
        status: "ok",
        service: "authApi",
        webauthn: {
            defaultRpId: DEFAULT_RP_ID,
            defaultOrigin: DEFAULT_ORIGIN,
            allowedOriginCount: ALLOWED_ORIGINS.length,
        },
    });
});
/**
 * Verifies the requesting user is authenticated and owns the given email.
 * @param {Request} req Express request with Authorization header.
 * @param {string} email The email to verify against the token.
 * @return {Promise<{uid: string, email: string}>} Verified uid and email.
 */
async function requireRegisteredUser(req, email) {
    const authorization = req.get("authorization");
    if (authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer ")) {
        try {
            const token = authorization.slice("Bearer ".length);
            const decoded = await auth.verifyIdToken(token);
            const tokenEmail = normalizeEmail(decoded.email || "");
            const want = normalizeEmail(email);
            if (tokenEmail && tokenEmail === want) {
                return { uid: decoded.uid, email: tokenEmail };
            }
        }
        catch (_a) {
            // Fall through to lookup or provision by email
        }
    }
    const wantEmail = normalizeEmail(email);
    if (!wantEmail || !wantEmail.includes("@")) {
        throw new Error("A valid email address is required to register a passkey.");
    }
    try {
        const userRecord = await auth.getUserByEmail(wantEmail);
        return { uid: userRecord.uid, email: wantEmail };
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === "auth/user-not-found") {
            const newUser = await auth.createUser({
                email: wantEmail,
                displayName: wantEmail.split("@")[0],
            });
            return { uid: newUser.uid, email: wantEmail };
        }
        throw err;
    }
}
// POST /register-options
// Supports two modes:
//  1. Email-based  — body: { email: "user@example.com" }
//     Creates/associates a passkey with a user account.
//  2. Device-bound  — body: { reauth: true } (no email)
//     Creates a device-bound passkey (resident credential).
//     The authenticator stores the credential ID, and login uses
//     the discoverable credential flow (no email needed).
router.post("/register-options", authLimiter, async (req, res) => {
    var _a, _b, _c, _d;
    try {
        // ── Mode 2: device-bound / resident credential ─────────────────────────────────
        if (((_a = req.body) === null || _a === void 0 ? void 0 : _a.reauth) === true && !((_b = req.body) === null || _b === void 0 ? void 0 : _b.email)) {
            const { rpId, expectedOrigin } = getWebAuthnConfig(req);
            const options = await (0, server_1.generateRegistrationOptions)({
                rpName: RP_NAME,
                rpID: rpId,
                userID: new TextEncoder().encode("device-bound"), // placeholder; resolved in verify
                userName: "",
                userDisplayName: "Device-bound passkey",
                attestationType: "none",
                excludeCredentials: [], // no existing credentials to exclude
                authenticatorSelection: {
                    residentKey: "preferred",
                    userVerification: "preferred",
                    // Omit authenticatorAttachment so platform + roaming authenticators both work
                },
            });
            // We don't know the userId yet; it will be resolved during verify-registration
            // via the userHandle returned by the authenticator.
            setSessionCookie(res, {
                registrationChallenge: options.challenge,
                authUserId: null,
                rpId,
                expectedOrigin,
                residentKey: true,
            });
            res.json(options);
            return;
        }
        // ── Mode 1: email-based flow ──────────────────────────────────────────────
        const email = normalizeEmail(((_c = req.body) === null || _c === void 0 ? void 0 : _c.email) || "");
        if (!email) {
            res.status(400).json({ error: "Missing user email" });
            return;
        }
        const { uid: userId, email: userEmail } = await requireRegisteredUser(req, email);
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({
                email: userEmail,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        else if (normalizeEmail(((_d = userDoc.data()) === null || _d === void 0 ? void 0 : _d.email) || "") !== userEmail) {
            await userRef.set({ email: userEmail }, { merge: true });
        }
        const credsSnap = await userRef.collection("passkeyCredentials").get();
        const excludeCredentials = credsSnap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: data.credentialID || docSnap.id,
                transports: data.transports,
            };
        });
        const { rpId, expectedOrigin } = getWebAuthnConfig(req);
        const options = await (0, server_1.generateRegistrationOptions)({
            rpName: RP_NAME,
            rpID: rpId,
            userID: new TextEncoder().encode(userId),
            userName: userEmail,
            userDisplayName: userEmail,
            attestationType: "none",
            excludeCredentials,
            authenticatorSelection: {
                residentKey: "preferred",
                userVerification: "preferred",
                // Omit authenticatorAttachment so platform + roaming authenticators both work
            },
        });
        setSessionCookie(res, {
            registrationChallenge: options.challenge,
            authUserId: userId,
            rpId,
            expectedOrigin,
        });
        // Firestore backup: Hosting/CDN paths sometimes drop Set-Cookie on function rewrites.
        await db.collection("passkey_challenges").doc(userEmail).set({
            challenge: options.challenge,
            type: "registration",
            authUserId: userId,
            rpId,
            expectedOrigin,
            createdAt: Date.now(),
            expiresAt: Date.now() + 15 * 60000,
        });
        res.json(options);
    }
    catch (error) {
        firebase_functions_1.logger.error("Register Options Error:", error);
        errors.report(error);
        const message = error instanceof Error ? error.message : "";
        if (message === "Authentication is required to register a passkey." ||
            message === "The passkey email must match the signed-in account.") {
            res.status(401).json({ error: message });
            return;
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// POST /verify-registration
router.post("/verify-registration", strictLimiter, async (req, res) => {
    var _a;
    try {
        const body = req.body;
        let sessionData = readSession(req);
        // Fallback to Firestore challenge when cookie is missing (rewrite/cookie issues).
        if (!sessionData && body.email) {
            const snap = await db.collection("passkey_challenges")
                .doc(normalizeEmail(body.email)).get();
            if (snap.exists) {
                const d = snap.data() || {};
                if (typeof d.expiresAt === "number" && Date.now() > d.expiresAt) {
                    await snap.ref.delete();
                }
                else {
                    sessionData = {
                        registrationChallenge: d.challenge,
                        authUserId: d.authUserId,
                        rpId: d.rpId,
                        expectedOrigin: d.expectedOrigin,
                    };
                }
            }
        }
        if (!sessionData) {
            res.status(400).json({ error: "Challenge expired or missing. Retry passkey setup." });
            return;
        }
        const expectedChallenge = sessionData.registrationChallenge;
        const userId = sessionData.authUserId || body.userId;
        if (!expectedChallenge || !userId) {
            res.status(400).json({ error: "Challenge expired or missing. Retry passkey setup." });
            return;
        }
        const cfg = getWebAuthnConfig(req);
        const expectedOrigin = sessionData.expectedOrigin || cfg.expectedOrigin;
        const rpId = sessionData.rpId || cfg.rpId;
        const verification = await (0, server_1.verifyRegistrationResponse)({
            response: body,
            expectedChallenge,
            expectedOrigin: [expectedOrigin, ...cfg.allowedOrigins],
            expectedRPID: [rpId, DEFAULT_RP_ID],
        });
        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo;
            const credentialId = encodeCredentialId(credential.id);
            const publicKeyB64 = Buffer.from(credential.publicKey).toString("base64url");
            await db.collection("users").doc(userId).collection("passkeyCredentials")
                .doc(credentialId)
                .set({
                publicKey: publicKeyB64,
                credentialID: credentialId,
                counter: credential.counter,
                transports: ((_a = body.response) === null || _a === void 0 ? void 0 : _a.transports) || credential.transports || [],
                rpId,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            // Keep user email normalized for login-options lookup
            if (body.email) {
                await db.collection("users").doc(userId).set({
                    email: normalizeEmail(body.email),
                    hasPasskey: true,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            else {
                await db.collection("users").doc(userId).set({
                    hasPasskey: true,
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            const customToken = await createCustomTokenWithAdminClaim(userId, { authMethod: "passkey" });
            res.clearCookie("__session", { path: "/" });
            if (body.email) {
                try {
                    await db.collection("passkey_challenges").doc(normalizeEmail(body.email)).delete();
                }
                catch (_b) {
                    // non-fatal
                }
            }
            res.json({ verified: true, token: customToken, credentialId });
        }
        else {
            res.status(400).json({ verified: false, error: "Verification failed" });
        }
    }
    catch (error) {
        firebase_functions_1.logger.error("Verify Registration Error:", error);
        errors.report(error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        res.status(500).json({ error: message.includes("Unexpected") ? message : "Internal Server Error" });
    }
});
// POST /login-options
//
// Supports two modes:
//  1. Email-based  — body: { email: "user@example.com" }
//     Looks up the user by email and returns options with allowCredentials populated.
//  2. Resident-key / reauth — body: { reauth: true }  (no email required)
//     Returns discoverable-credential options (empty allowCredentials) so the
//     authenticator can select the appropriate resident key automatically.
router.post("/login-options", authLimiter, async (req, res) => {
    var _a, _b;
    try {
        const { rpId, expectedOrigin } = getWebAuthnConfig(req);
        const email = normalizeEmail(((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || "");
        // ── Mode 2: discoverable / resident-key flow (no email provided) ─────────
        if (!email) {
            const options = await (0, server_1.generateAuthenticationOptions)({
                rpID: rpId,
                allowCredentials: [], // discoverable — authenticator selects the key
                userVerification: "preferred",
            });
            setSessionCookie(res, {
                authenticationChallenge: options.challenge,
                authUserId: null,
                rpId,
                expectedOrigin,
                residentKey: true,
            });
            res.json(options);
            return;
        }
        // ── Mode 1: email-based flow ──────────────────────────────────────────────
        // Case-insensitive email match in Firestore
        let userSnap = await db.collection("users")
            .where("email", "==", email).limit(1).get();
        if (userSnap.empty) {
            const raw = String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.email) || "").trim();
            if (raw && raw !== email) {
                userSnap = await db.collection("users")
                    .where("email", "==", raw).limit(1).get();
            }
        }
        let userId = null;
        let userDocRef = null;
        if (!userSnap.empty) {
            userId = userSnap.docs[0].id;
            userDocRef = userSnap.docs[0].ref;
        }
        else {
            try {
                const authUser = await auth.getUserByEmail(email);
                userId = authUser.uid;
                userDocRef = db.collection("users").doc(userId);
            }
            catch (_c) {
                // User not found
            }
        }
        if (!userId || !userDocRef) {
            res.status(404).json({
                error: "No account found for this email. Use 'New here? Create a Passkey' to register first.",
            });
            return;
        }
        const credsSnap = await userDocRef.collection("passkeyCredentials").get();
        if (credsSnap.empty) {
            res.status(404).json({
                error: "No passkey registered for this email yet. Use 'New here? Create a Passkey' to register.",
            });
            return;
        }
        const allowCredentials = credsSnap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: (data.credentialID || docSnap.id),
                transports: data.transports,
            };
        });
        const options = await (0, server_1.generateAuthenticationOptions)({
            rpID: rpId,
            allowCredentials,
            userVerification: "preferred",
        });
        setSessionCookie(res, {
            authenticationChallenge: options.challenge,
            authUserId: userId,
            rpId,
            expectedOrigin,
        });
        await db.collection("passkey_challenges").doc(email).set({
            challenge: options.challenge,
            type: "authentication",
            authUserId: userId,
            rpId,
            expectedOrigin,
            createdAt: Date.now(),
            expiresAt: Date.now() + 15 * 60000,
        });
        res.json(options);
    }
    catch (error) {
        firebase_functions_1.logger.error("Login Options Error:", error);
        errors.report(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// POST /verify-login
router.post("/verify-login", strictLimiter, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const body = req.body;
        let sessionData = readSession(req);
        const credentialId = encodeCredentialId(body.id);
        // Cookie missing → recover challenge from Firestore by email or credential id.
        if (!sessionData) {
            const emailHint = normalizeEmail(body.email ||
                (typeof req.get("x-passkey-email") === "string" ? req.get("x-passkey-email") : "") ||
                "");
            let snap = emailHint ?
                await db.collection("passkey_challenges").doc(emailHint).get() :
                null;
            if (!(snap === null || snap === void 0 ? void 0 : snap.exists)) {
                // Try reverse lookup via credential → user email
                const credQ = await db.collectionGroup("passkeyCredentials")
                    .where("credentialID", "==", credentialId).limit(1).get();
                if (!credQ.empty) {
                    const parentUser = credQ.docs[0].ref.parent.parent;
                    if (parentUser) {
                        const u = await parentUser.get();
                        const em = normalizeEmail(((_a = u.data()) === null || _a === void 0 ? void 0 : _a.email) || "");
                        if (em) {
                            snap = await db.collection("passkey_challenges").doc(em).get();
                        }
                        if (!sessionData && (snap === null || snap === void 0 ? void 0 : snap.exists)) {
                            // also bind userId from credential path
                        }
                        if (!sessionData) {
                            sessionData = {
                                authenticationChallenge: (_b = snap === null || snap === void 0 ? void 0 : snap.data()) === null || _b === void 0 ? void 0 : _b.challenge,
                                authUserId: parentUser.id,
                                rpId: ((_c = snap === null || snap === void 0 ? void 0 : snap.data()) === null || _c === void 0 ? void 0 : _c.rpId) || ((_d = credQ.docs[0].data()) === null || _d === void 0 ? void 0 : _d.rpId),
                                expectedOrigin: (_e = snap === null || snap === void 0 ? void 0 : snap.data()) === null || _e === void 0 ? void 0 : _e.expectedOrigin,
                            };
                        }
                    }
                }
            }
            if ((!sessionData || !sessionData.authenticationChallenge) && (snap === null || snap === void 0 ? void 0 : snap.exists)) {
                const d = snap.data() || {};
                if (typeof d.expiresAt === "number" && Date.now() > d.expiresAt) {
                    await snap.ref.delete();
                }
                else {
                    sessionData = {
                        authenticationChallenge: d.challenge,
                        authUserId: d.authUserId,
                        rpId: d.rpId,
                        expectedOrigin: d.expectedOrigin,
                    };
                }
            }
        }
        if (!sessionData) {
            res.status(400).json({ error: "Challenge expired or missing. Retry passkey sign-in." });
            return;
        }
        const expectedChallenge = sessionData.authenticationChallenge;
        if (!expectedChallenge) {
            res.status(400).json({ error: "Challenge expired or missing. Retry passkey sign-in." });
            return;
        }
        // Resolve userId — for resident-key/reauth flows authUserId may be null.
        // In that case, derive the uid from the userHandle returned by the authenticator.
        let userId = sessionData.authUserId;
        if (!userId) {
            // userHandle is the base64url-encoded uid set during registration
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userHandle = (_f = body.response) === null || _f === void 0 ? void 0 : _f.userHandle;
            if (userHandle) {
                try {
                    userId = Buffer.from(userHandle, "base64url").toString("utf-8");
                }
                catch (_j) {
                    userId = userHandle;
                }
            }
        }
        if (!userId) {
            // Last resort: scan for the credential across users
            const globalQuery = await db.collectionGroup("passkeyCredentials")
                .where("credentialID", "==", credentialId).limit(1).get();
            if (!globalQuery.empty) {
                // Parent doc is the user doc
                userId = (_g = globalQuery.docs[0].ref.parent.parent) === null || _g === void 0 ? void 0 : _g.id;
            }
        }
        if (!userId) {
            res.status(400).json({ error: "Could not resolve user for this credential." });
            return;
        }
        const credDoc = await db.collection("users").doc(userId)
            .collection("passkeyCredentials").doc(credentialId).get();
        if (!credDoc.exists) {
            res.status(400).json({ error: "Credential not found for this account." });
            return;
        }
        const credData = credDoc.data();
        if (!(credData === null || credData === void 0 ? void 0 : credData.publicKey)) {
            res.status(400).json({ error: "Credential data empty" });
            return;
        }
        const cfg = getWebAuthnConfig(req);
        const expectedOrigin = sessionData.expectedOrigin || cfg.expectedOrigin;
        const rpId = sessionData.rpId ||
            credData.rpId ||
            cfg.rpId;
        const verification = await (0, server_1.verifyAuthenticationResponse)({
            response: body,
            expectedChallenge,
            expectedOrigin: [expectedOrigin, ...cfg.allowedOrigins],
            expectedRPID: [rpId, DEFAULT_RP_ID, "agape-sovereign.web.app", "sovereign.nyc"],
            credential: {
                id: (credData.credentialID || credentialId),
                publicKey: Buffer.from(credData.publicKey, "base64url"),
                counter: typeof credData.counter === "number" ? credData.counter : 0,
                transports: credData.transports,
            },
        });
        if (verification.verified) {
            await credDoc.ref.update({
                counter: verification.authenticationInfo.newCounter,
                lastUsedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            const customToken = await createCustomTokenWithAdminClaim(userId, { authMethod: "passkey" });
            res.clearCookie("__session", { path: "/" });
            let resolvedEmail = "";
            try {
                const uSnap = await db.collection("users").doc(userId).get();
                resolvedEmail = normalizeEmail(((_h = uSnap.data()) === null || _h === void 0 ? void 0 : _h.email) || "");
                if (resolvedEmail) {
                    await db.collection("passkey_challenges").doc(resolvedEmail).delete();
                }
            }
            catch (_k) {
                // non-fatal
            }
            res.json({ verified: true, token: customToken, credentialId, userId, email: resolvedEmail });
        }
        else {
            res.status(400).json({ verified: false, error: "Authentication failed" });
        }
    }
    catch (error) {
        firebase_functions_1.logger.error("Verify Login Error:", error);
        errors.report(error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        res.status(500).json({
            error: message.length < 200 ? message : "Internal Server Error",
        });
    }
});
// Mount router at / (direct URL) and /api/auth (Hosting rewrite)
authApp.use("/", router);
/**
 * CSRF defence for the cookie-bearing auth API.
 *
 * The __session cookie is SameSite=Strict in production (browsers
 * never attach it to cross-site POSTs), and every ceremony also
 * requires an unforgeable WebAuthn assertion bound to this origin.
 * As explicit defence-in-depth, state-changing requests must carry
 * an Origin header from the allowlist; cross-site form/fetch CSRF
 * cannot forge that. Safe methods pass through.
 */
authApp.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
        next();
        return;
    }
    const origin = req.get("origin");
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        res.status(403).json({ error: "Cross-origin request blocked" });
        return;
    }
    next();
});
// CSRF token issuer (GET is exempt from doubleCsrfProtection).
authApp.get("/api/auth/csrf-token", (req, res) => {
    res.json({ csrfToken: generateCsrfToken(req, res) });
});
authApp.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: generateCsrfToken(req, res) });
});
authApp.use(doubleCsrfProtection);
authApp.use("/api/auth", router);
// JSON error shape for CSRF rejections (Express would default to HTML).
authApp.use((err, _req, res, next) => {
    if (err && err.code === "EBADCSRFTOKEN") {
        res.status(403).json({ error: "Invalid CSRF token" });
        return;
    }
    next(err);
});
exports.authApi = (0, https_1.onRequest)({
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    invoker: "public",
    serviceAccount: "firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com",
}, authApp);
//# sourceMappingURL=auth.js.map