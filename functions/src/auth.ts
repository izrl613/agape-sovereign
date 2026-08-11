import {onRequest} from "firebase-functions/https";
import {logger} from "firebase-functions";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import {getAppCheck} from "firebase-admin/app-check";
import express, {Request, Response} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import {ErrorReporting} from "@google-cloud/error-reporting";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

// Admin is initialized once in index.ts; guard against re-init
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();
const errors = new ErrorReporting({reportMode: "always"});
const RP_NAME = "Agape Sovereign";

/** Primary production RP (custom domain). */
const DEFAULT_RP_ID = process.env.WEBAUTHN_RP_ID || "sovereign.nyc";
const DEFAULT_ORIGIN = process.env.WEBAUTHN_ORIGIN || "https://sovereign.nyc";

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
  "https://agape-sovereign.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:5000",
  "http://localhost:5002",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5000",
];

const ALLOWED_ORIGINS = Array.from(new Set([...BUILTIN_ORIGINS, ...EXTRA_ORIGINS]));

const COOKIE_SECRET = process.env.PASSKEY_COOKIE_SECRET ||
  process.env.COOKIE_SECRET ||
  "sovereign-secret-key";

const authApp = express();

const corsOrigins = ALLOWED_ORIGINS.filter((o) => o.startsWith("http"));
authApp.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser / same-origin proxy calls with no Origin header
    if (!origin) {
      callback(null, true);
      return;
    }
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
authApp.use(express.json({limit: "256kb"}));
authApp.use(cookieParser(COOKIE_SECRET));

// Firebase App Check verification (opt-in via env)
authApp.use(async (req: Request, res: Response, next: express.NextFunction) => {
  if (process.env.RECAPTCHA_ENABLED !== "true") return next();
  const appCheckToken = req.header("X-Firebase-AppCheck");
  if (!appCheckToken) {
    res.status(401).json({error: "Missing App Check token"});
    return;
  }
  try {
    await getAppCheck().verifyToken(appCheckToken);
    next();
  } catch {
    res.status(401).json({error: "Invalid App Check token"});
  }
});

/**
 * Normalize email for stable Firestore lookups.
 * @param {string} email Raw email.
 * @return {string} Lowercased trimmed email.
 */
function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

/**
 * Map a browser origin to the WebAuthn RP ID that must match the page hostname.
 * @param {string} origin Fully-qualified origin.
 * @return {string} RP ID.
 */
function rpIdForOrigin(origin: string): string {
  try {
    const host = new URL(origin).hostname;
    if (host === "localhost" || host === "127.0.0.1") return host;
    if (host === "www.sovereign.nyc") return "sovereign.nyc";
    return host;
  } catch {
    return DEFAULT_RP_ID;
  }
}

/**
 * Resolve expectedOrigin + rpId from the request Origin/Referer.
 * Firebase Hosting and Cloudflare terminate TLS before the function runs.
 * @param {Request} req Express request.
 * @return {{expectedOrigin: string, rpId: string, allowedOrigins: string[]}}
 */
function getWebAuthnConfig(req: Request): {
  expectedOrigin: string;
  rpId: string;
  allowedOrigins: string[];
} {
  const originHeader = req.get("origin") || "";
  const referer = req.get("referer") || "";
  let candidate = originHeader;

  if (!candidate && referer) {
    try {
      candidate = new URL(referer).origin;
    } catch {
      candidate = "";
    }
  }

  if (candidate) {
    try {
      const url = new URL(candidate);
      const origin = url.origin;
      const host = url.hostname;
      const allowed =
        ALLOWED_ORIGINS.includes(origin) ||
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
    } catch {
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
function setSessionCookie(res: Response, sessionData: object): void {
  // Cloud Functions often omit NODE_ENV=production; treat GCP as secure.
  const isSecure = process.env.NODE_ENV === "production" ||
    process.env.K_SERVICE !== undefined ||
    process.env.FUNCTION_TARGET !== undefined;

  res.cookie("__session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: isSecure,
    signed: true,
    maxAge: 5 * 60_000,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Read challenge session from signed cookie (with unsigned fallback).
 * @param {Request} req Express request.
 * @return {Record<string, unknown> | null} Parsed session or null.
 */
function readSession(req: Request): Record<string, unknown> | null {
  const raw = req.signedCookies?.["__session"] ?? req.cookies?.["__session"];
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null) {
    return raw as Record<string, unknown>;
  }
  const str = String(raw);
  try {
    return JSON.parse(str) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(str)) as Record<string, unknown>;
    } catch {
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
function encodeCredentialId(id: string | Uint8Array): string {
  if (typeof id === "string") return id;
  return Buffer.from(id).toString("base64url");
}

// Router used at both / (direct URL) and /api/auth (Hosting rewrite)
const router = express.Router(); // eslint-disable-line new-cap

// Health check endpoint
router.get("/", (_req: Request, res: Response) => {
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
async function requireRegisteredUser(
  req: Request, email: string
): Promise<{uid: string; email: string}> {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication is required to register a passkey.");
  }

  const token = authorization.slice("Bearer ".length);
  const decoded = await auth.verifyIdToken(token);
  const tokenEmail = normalizeEmail(decoded.email || "");
  const want = normalizeEmail(email);
  if (!tokenEmail || tokenEmail !== want) {
    throw new Error("The passkey email must match the signed-in account.");
  }

  return {uid: decoded.uid, email: tokenEmail};
}

// POST /register-options
router.post("/register-options", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email || "");
    if (!email) {
      res.status(400).json({error: "Missing user email"});
      return;
    }

    let userId: string;
    let userEmail: string;

    // Check if request carries a Firebase Auth ID token (post-login binding)
    const authorization = req.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      const user = await requireRegisteredUser(req, email);
      userId = user.uid;
      userEmail = user.email;
    } else {
      // Direct registration on login page: resolve existing user by email or generate a new deterministic user ID
      const usersSnap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!usersSnap.empty) {
        userId = usersSnap.docs[0].id;
        userEmail = email;
      } else {
        // Create new user record placeholder
        const newDocRef = db.collection("users").doc();
        userId = newDocRef.id;
        userEmail = email;
        await newDocRef.set({
          email: userEmail,
          createdAt: FieldValue.serverTimestamp(),
          authType: "passkey",
          hasPasskey: false,
        });
      }
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        email: userEmail,
        createdAt: FieldValue.serverTimestamp(),
        authType: "passkey",
      });
    }

    const credsSnap = await userRef.collection("passkeyCredentials").get();
    const excludeCredentials = credsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: data.credentialID || docSnap.id,
        transports: data.transports as AuthenticatorTransportFuture[] | undefined,
      };
    });

    const {rpId} = getWebAuthnConfig(req);
    const options = await generateRegistrationOptions({
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
      },
    });

    setSessionCookie(res, {
      registrationChallenge: options.challenge,
      authUserId: userId,
      rpId,
      expectedOrigin: getWebAuthnConfig(req).expectedOrigin,
    });
    res.json(options);
  } catch (error) {
    logger.error("Register Options Error:", error);
    errors.report(error as Error);
    const message = error instanceof Error ? error.message : "";
    if (
      message === "Authentication is required to register a passkey." ||
      message === "The passkey email must match the signed-in account."
    ) {
      res.status(401).json({error: message});
      return;
    }
    res.status(500).json({error: "Internal Server Error"});
  }
});

// POST /verify-registration
router.post("/verify-registration", async (req: Request, res: Response) => {
  try {
    const body = req.body as RegistrationResponseJSON & {
      userId?: string;
      email?: string;
    };
    const sessionData = readSession(req);
    if (!sessionData) {
      res.status(400).json({error: "Challenge expired or missing. Retry passkey setup."});
      return;
    }

    const expectedChallenge = sessionData.registrationChallenge as string | undefined;
    const userId = (sessionData.authUserId as string | undefined) || body.userId;
    if (!expectedChallenge || !userId) {
      res.status(400).json({error: "Challenge expired or missing. Retry passkey setup."});
      return;
    }

    const cfg = getWebAuthnConfig(req);
    const expectedOrigin = (sessionData.expectedOrigin as string) || cfg.expectedOrigin;
    const rpId = (sessionData.rpId as string) || cfg.rpId;

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: [expectedOrigin, ...cfg.allowedOrigins],
      expectedRPID: [rpId, DEFAULT_RP_ID],
    });

    if (verification.verified && verification.registrationInfo) {
      const {credential} = verification.registrationInfo;
      const credentialId = encodeCredentialId(credential.id);
      const publicKeyB64 = Buffer.from(credential.publicKey).toString("base64url");

      await db.collection("users").doc(userId).collection("passkeyCredentials")
        .doc(credentialId)
        .set({
          publicKey: publicKeyB64,
          credentialID: credentialId,
          counter: credential.counter,
          transports: body.response?.transports || credential.transports || [],
          rpId,
          createdAt: FieldValue.serverTimestamp(),
        }, {merge: true});

      // Keep user email normalized for login-options lookup
      if (body.email) {
        await db.collection("users").doc(userId).set({
          email: normalizeEmail(body.email),
          hasPasskey: true,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } else {
        await db.collection("users").doc(userId).set({
          hasPasskey: true,
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      }

      const customToken = await auth.createCustomToken(userId, {authMethod: "passkey"});
      res.clearCookie("__session", {path: "/"});
      res.json({verified: true, token: customToken, credentialId});
    } else {
      res.status(400).json({verified: false, error: "Verification failed"});
    }
  } catch (error) {
    logger.error("Verify Registration Error:", error);
    errors.report(error as Error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({error: message.includes("Unexpected") ? message : "Internal Server Error"});
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
router.post("/login-options", async (req: Request, res: Response) => {
  try {
    const {rpId, expectedOrigin} = getWebAuthnConfig(req);

    // ── Mode 2: resident-key / reauth flow ───────────────────────────────────
    if (req.body?.reauth === true && !req.body?.email) {
      const options = await generateAuthenticationOptions({
        rpID: rpId,
        allowCredentials: [], // discoverable — authenticator selects the key
        userVerification: "required",
      });

      // We don't know the userId yet; it will be resolved during verify-login
      // via the userHandle returned by the authenticator.
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
    const email = normalizeEmail(req.body?.email || "");
    if (!email) {
      res.status(400).json({error: "Missing email"});
      return;
    }

    // Case-insensitive email match (stored emails may be mixed-case)
    let userSnap = await db.collection("users")
      .where("email", "==", email).limit(1).get();

    if (userSnap.empty) {
      // Fallback: try original casing from body
      const raw = String(req.body?.email || "").trim();
      if (raw && raw !== email) {
        userSnap = await db.collection("users")
          .where("email", "==", raw).limit(1).get();
      }
    }

    if (userSnap.empty) {
      res.status(404).json({
        error: "No account found for this email. Sign in with Google first, then bind a passkey.",
      });
      return;
    }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;
    const credsSnap = await userDoc.ref.collection("passkeyCredentials").get();
    if (credsSnap.empty) {
      res.status(404).json({
        error: "No passkey registered for this email. Sign in with Google, then set up a passkey.",
      });
      return;
    }

    const allowCredentials = credsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: (data.credentialID || docSnap.id) as string,
        transports: data.transports as AuthenticatorTransportFuture[] | undefined,
      };
    });

    const options = await generateAuthenticationOptions({
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
    res.json(options);
  } catch (error) {
    logger.error("Login Options Error:", error);
    errors.report(error as Error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

// POST /verify-login
router.post("/verify-login", async (req: Request, res: Response) => {
  try {
    const body = req.body as AuthenticationResponseJSON;
    const sessionData = readSession(req);
    if (!sessionData) {
      res.status(400).json({error: "Challenge expired or missing. Retry passkey sign-in."});
      return;
    }

    const expectedChallenge = sessionData.authenticationChallenge as string | undefined;
    if (!expectedChallenge) {
      res.status(400).json({error: "Challenge expired or missing. Retry passkey sign-in."});
      return;
    }

    const credentialId = encodeCredentialId(body.id);

    // Resolve userId — for resident-key/reauth flows authUserId may be null.
    // In that case, derive the uid from the userHandle returned by the authenticator.
    let userId = sessionData.authUserId as string | undefined | null;
    if (!userId) {
      // userHandle is the base64url-encoded uid set during registration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userHandle = (body.response as any)?.userHandle;
      if (userHandle) {
        try {
          userId = Buffer.from(userHandle, "base64url").toString("utf-8");
        } catch {
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
        userId = globalQuery.docs[0].ref.parent.parent?.id;
      }
    }
    if (!userId) {
      res.status(400).json({error: "Could not resolve user for this credential."});
      return;
    }
    const credDoc = await db.collection("users").doc(userId)
      .collection("passkeyCredentials").doc(credentialId).get();
    if (!credDoc.exists) {
      res.status(400).json({error: "Credential not found for this account."});
      return;
    }

    const credData = credDoc.data();
    if (!credData?.publicKey) {
      res.status(400).json({error: "Credential data empty"});
      return;
    }

    const cfg = getWebAuthnConfig(req);
    const expectedOrigin = (sessionData.expectedOrigin as string) || cfg.expectedOrigin;
    const rpId = (sessionData.rpId as string) ||
      (credData.rpId as string) ||
      cfg.rpId;

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: [expectedOrigin, ...cfg.allowedOrigins],
      expectedRPID: [rpId, DEFAULT_RP_ID, "agape-sovereign.web.app", "agape-sovereign.firebaseapp.com"],
      credential: {
        id: (credData.credentialID || credentialId) as string,
        publicKey: Buffer.from(credData.publicKey, "base64url"),
        counter: typeof credData.counter === "number" ? credData.counter : 0,
        transports: credData.transports,
      },
    });

    if (verification.verified) {
      await credDoc.ref.update({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: FieldValue.serverTimestamp(),
      });
      const customToken = await auth.createCustomToken(userId, {authMethod: "passkey"});
      res.clearCookie("__session", {path: "/"});
      res.json({verified: true, token: customToken, credentialId});
    } else {
      res.status(400).json({verified: false, error: "Authentication failed"});
    }
  } catch (error) {
    logger.error("Verify Login Error:", error);
    errors.report(error as Error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({
      error: message.length < 200 ? message : "Internal Server Error",
    });
  }
});

// Mount router at / (direct URL) and /api/auth (Hosting rewrite)
authApp.use("/", router);
authApp.use("/api/auth", router);

export const authApi = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    invoker: "public",
    serviceAccount:
      "firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com",
    secrets: ["PASSKEY_COOKIE_SECRET"],
  },
  authApp
);
