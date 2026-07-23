import {onRequest} from "firebase-functions/https";
import {logger} from "firebase-functions";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import express, {Request, Response} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

// Admin is initialized once in index.ts; guard against re-init
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();
const RP_NAME = "Agape Sovereign";
// Firebase Hosting and Cloudflare terminate TLS before invoking this function.
// Do not derive WebAuthn values from proxy headers: the browser must validate
// the public origin that it actually loaded.
const RP_ID = process.env.WEBAUTHN_RP_ID || "sovereign.nyc";
const EXPECTED_ORIGIN = process.env.WEBAUTHN_ORIGIN || "https://sovereign.nyc";
const COOKIE_SECRET =
  process.env.PASSKEY_COOKIE_SECRET || "sovereign-secret-key";

const authApp = express();
authApp.use(cors({origin: true, credentials: true}));
authApp.use(express.json());
authApp.use(cookieParser(COOKIE_SECRET));

/**
 * Resolves expectedOrigin and rpId dynamically for local and prod environments.
 * @param {Request} req Express request.
 * @return {{expectedOrigin: string, rpId: string}} Resolved WebAuthn config.
 */
function getWebAuthnConfig(req: Request): {
  expectedOrigin: string;
  rpId: string;
} {
  const originHeader = req.get("origin") || req.get("referer");
  let origin = EXPECTED_ORIGIN;
  let rpId = RP_ID;

  if (originHeader) {
    try {
      const url = new URL(originHeader);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        origin = url.origin;
        rpId = url.hostname;
      }
    } catch {
      // Keep default configuration
    }
  }

  return {expectedOrigin: origin, rpId};
}

/**
 * Sets the signed __session cookie with production-appropriate flags.
 * @param {Response} res Express response.
 * @param {object} sessionData Session data payload.
 */
function setSessionCookie(res: Response, sessionData: object): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("__session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: isProd,
    signed: true,
    maxAge: 60_000,
    sameSite: isProd ? "none" : "lax",
  });
}

// Router used at both / (direct URL) and /api/auth (Hosting rewrite)
const router = express.Router(); // eslint-disable-line new-cap

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
  if (!decoded.email || decoded.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("The passkey email must match the signed-in account.");
  }

  return {uid: decoded.uid, email: decoded.email};
}

// POST /register-options (also at /api/auth/register-options via rewrite)
router.post("/register-options", async (req: Request, res: Response) => {
  try {
    const {email} = req.body;
    if (!email) {
      res.status(400).json({error: "Missing user email"}); return;
    }

    const {uid: userId, email: userEmail} =
      await requireRegisteredUser(req, email);
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        email: userEmail, createdAt: FieldValue.serverTimestamp(),
      });
    }
    const credsSnap = await userRef.collection("passkeyCredentials").get();
    const excludeCredentials = credsSnap.docs.map((doc) => ({
      id: doc.id,
      type: "public-key" as const,
      transports: doc.data().transports,
    }));

    const {rpId} = getWebAuthnConfig(req);
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: rpId,
      userID: new TextEncoder().encode(userId),
      userName: userEmail,
      userDisplayName: userEmail,
      attestationType: "none",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      excludeCredentials: excludeCredentials as any,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    const sessionData = {
      registrationChallenge: options.challenge,
      authUserId: userId,
    };
    setSessionCookie(res, sessionData);
    res.json(options);
  } catch (error) {
    logger.error("Register Options Error:", error);
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
    const {body} = req;
    const sessionCookie = req.signedCookies["__session"];
    if (!sessionCookie) {
      res.status(400).json({error: "Challenge expired or missing"}); return;
    }
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch (e) {
      res.status(400).json({error: "Invalid session cookie format"});
      return;
    }
    const expectedChallenge = sessionData.registrationChallenge;
    const userId = sessionData.authUserId;
    if (!expectedChallenge || !userId) {
      res.status(400).json({error: "Challenge expired or missing"}); return;
    }

    const {expectedOrigin, rpId} = getWebAuthnConfig(req);
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpId,
    });

    if (verification.verified && verification.registrationInfo) {
      const {credential} = verification.registrationInfo;
      await db.collection("users").doc(userId).collection("passkeyCredentials")
        .doc(Buffer.from(credential.id).toString("base64url"))
        .set({
          publicKey: Buffer.from(credential.publicKey).toString("base64url"),
          credentialID: Buffer.from(credential.id).toString("base64url"),
          counter: credential.counter,
          transports: body.response?.transports || [],
          createdAt: FieldValue.serverTimestamp(),
        });
      const customToken = await auth.createCustomToken(userId);
      res.json({verified: true, token: customToken});
    } else {
      res.status(400).json({verified: false, error: "Verification failed"});
    }
  } catch (error) {
    logger.error("Verify Registration Error:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

// POST /login-options
router.post("/login-options", async (req: Request, res: Response) => {
  try {
    const {email} = req.body;
    if (!email) {
      res.status(400).json({error: "Missing email"}); return;
    }

    const userSnap = await db.collection("users")
      .where("email", "==", email).limit(1).get();
    if (userSnap.empty) {
      res.status(404).json({
        error: "No passkey registered for this email. Sign in with Google.",
      });
      return;
    }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;
    const credsSnap = await userDoc.ref.collection("passkeyCredentials").get();
    if (credsSnap.empty) {
      res.status(404).json({
        error: "No passkey registered for this email. Sign in with Google.",
      });
      return;
    }

    const allowCredentials = credsSnap.docs.map((doc) => ({
      id: doc.id,
      type: "public-key" as const,
      transports: doc.data().transports,
    }));

    const {rpId} = getWebAuthnConfig(req);
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allowCredentials: allowCredentials as any,
      userVerification: "preferred",
    });

    const sessionData = {
      authenticationChallenge: options.challenge,
      authUserId: userId,
    };
    setSessionCookie(res, sessionData);
    res.json(options);
  } catch (error) {
    logger.error("Login Options Error:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

// POST /verify-login
router.post("/verify-login", async (req: Request, res: Response) => {
  try {
    const {body} = req;
    const sessionCookie = req.signedCookies["__session"];
    if (!sessionCookie) {
      res.status(400).json({error: "Challenge expired or missing"}); return;
    }
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch (e) {
      res.status(400).json({error: "Invalid session cookie format"});
      return;
    }
    const expectedChallenge = sessionData.authenticationChallenge;
    const userId = sessionData.authUserId;
    if (!expectedChallenge || !userId) {
      res.status(400).json({error: "Challenge expired or missing"}); return;
    }

    const credentialId = body.id;
    const credDoc = await db.collection("users").doc(userId)
      .collection("passkeyCredentials").doc(credentialId).get();
    if (!credDoc.exists) {
      res.status(400).json({error: "Credential not found"}); return;
    }

    const credData = credDoc.data();
    if (!credData) {
      res.status(400).json({error: "Credential data empty"}); return;
    }
    const {expectedOrigin, rpId} = getWebAuthnConfig(req);
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpId,
      credential: {
        id: credData.credentialID,
        publicKey: Buffer.from(credData.publicKey, "base64url"),
        counter: credData.counter,
        transports: credData.transports,
      },
    });

    if (verification.verified) {
      await credDoc.ref.update({
        counter: verification.authenticationInfo.newCounter,
      });
      const customToken = await auth.createCustomToken(userId);
      res.json({verified: true, token: customToken});
    } else {
      res.status(400).json({verified: false, error: "Authentication failed"});
    }
  } catch (error) {
    logger.error("Verify Login Error:", error);
    res.status(500).json({error: "Internal Server Error"});
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
    serviceAccount:
      "firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com",
    secrets: ["PASSKEY_COOKIE_SECRET"],
  },
  authApp
);
