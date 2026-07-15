import { onRequest } from "firebase-functions/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

// Admin is initialized once in index.ts; guard against re-init
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const RP_NAME = "Agape Sovereign";
// Firebase Hosting and Cloudflare terminate TLS before invoking this function.
// Do not derive WebAuthn values from proxy headers: the browser must validate
// the public origin that it actually loaded.
const RP_ID = process.env.WEBAUTHN_RP_ID || "sovereign.nyc";
const EXPECTED_ORIGIN = process.env.WEBAUTHN_ORIGIN || "https://sovereign.nyc";
const COOKIE_SECRET = process.env.PASSKEY_COOKIE_SECRET || "sovereign-secret-key";

const authApp = express();
authApp.use(express.json());
authApp.use(cookieParser(COOKIE_SECRET));

// Router used at both /  (direct Cloud Functions URL) and /api/auth (Firebase Hosting rewrite)
const router = express.Router();

async function requireRegisteredUser(req: Request, email: string): Promise<{ uid: string; email: string }> {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication is required to register a passkey.");
  }

  const decoded = await admin.auth().verifyIdToken(authorization.slice("Bearer ".length));
  if (!decoded.email || decoded.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("The passkey email must match the signed-in account.");
  }

  return { uid: decoded.uid, email: decoded.email };
}

// POST /register-options  (also served at /api/auth/register-options via Hosting rewrite)
router.post("/register-options", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Missing user email" }); return; }

    const { uid: userId, email: userEmail } = await requireRegisteredUser(req, email);
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({ email: userEmail, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    const credsSnap = await userRef.collection("passkeyCredentials").get();
    const excludeCredentials = credsSnap.docs.map((doc) => ({
      id: doc.id, type: "public-key" as const, transports: doc.data().transports,
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(userId),
      userName: userEmail,
      userDisplayName: userEmail,
      attestationType: "none",
      excludeCredentials: excludeCredentials as any,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    res.cookie("registration-challenge", options.challenge, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", signed: true, maxAge: 60_000,
    });
    res.cookie("auth-user-id", userId, { httpOnly: true, signed: true, maxAge: 60_000 });
    res.json(options);
  } catch (error) {
    logger.error("Register Options Error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "Authentication is required to register a passkey." || message === "The passkey email must match the signed-in account.") {
      res.status(401).json({ error: message });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /verify-registration
router.post("/verify-registration", async (req: Request, res: Response) => {
  try {
    const { body } = req;
    const expectedChallenge = req.signedCookies["registration-challenge"];
    const userId = req.signedCookies["auth-user-id"];
    if (!expectedChallenge || !userId) { res.status(400).json({ error: "Challenge expired or missing" }); return; }

    const verification = await verifyRegistrationResponse({
      response: body, expectedChallenge, expectedOrigin: EXPECTED_ORIGIN, expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      await db.collection("users").doc(userId).collection("passkeyCredentials")
        .doc(Buffer.from(credential.id).toString("base64url"))
        .set({
          publicKey: Buffer.from(credential.publicKey).toString("base64url"),
          credentialID: Buffer.from(credential.id).toString("base64url"),
          counter: credential.counter,
          transports: body.response?.transports || [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      const customToken = await admin.auth().createCustomToken(userId);
      res.json({ verified: true, token: customToken });
    } else {
      res.status(400).json({ verified: false, error: "Verification failed" });
    }
  } catch (error) {
    logger.error("Verify Registration Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /login-options
router.post("/login-options", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Missing email" }); return; }

    const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
    if (userSnap.empty) { res.status(404).json({ error: "User not found" }); return; }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;
    const credsSnap = await userDoc.ref.collection("passkeyCredentials").get();
    if (credsSnap.empty) { res.status(404).json({ error: "No passkeys registered for this account" }); return; }

    const allowCredentials = credsSnap.docs.map((doc) => ({
      id: doc.id, type: "public-key" as const, transports: doc.data().transports,
    }));

    const options = await generateAuthenticationOptions({
      rpID: RP_ID, allowCredentials: allowCredentials as any, userVerification: "preferred",
    });

    res.cookie("authentication-challenge", options.challenge, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", signed: true, maxAge: 60_000,
    });
    res.cookie("auth-user-id", userId, { httpOnly: true, signed: true, maxAge: 60_000 });
    res.json(options);
  } catch (error) {
    logger.error("Login Options Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /verify-login
router.post("/verify-login", async (req: Request, res: Response) => {
  try {
    const { body } = req;
    const expectedChallenge = req.signedCookies["authentication-challenge"];
    const userId = req.signedCookies["auth-user-id"];
    if (!expectedChallenge || !userId) { res.status(400).json({ error: "Challenge expired or missing" }); return; }

    const credentialId = body.id;
    const credDoc = await db.collection("users").doc(userId).collection("passkeyCredentials").doc(credentialId).get();
    if (!credDoc.exists) { res.status(400).json({ error: "Credential not found" }); return; }

    const credData = credDoc.data()!;
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credData.credentialID,
        publicKey: Buffer.from(credData.publicKey, "base64url"),
        counter: credData.counter,
        transports: credData.transports,
      },
    });

    if (verification.verified) {
      await credDoc.ref.update({ counter: verification.authenticationInfo.newCounter });
      const customToken = await admin.auth().createCustomToken(userId);
      res.json({ verified: true, token: customToken });
    } else {
      res.status(400).json({ verified: false, error: "Authentication failed" });
    }
  } catch (error) {
    logger.error("Verify Login Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Mount router at root (direct function URL) and at /api/auth (Firebase Hosting rewrite prefix)
authApp.use("/", router);
authApp.use("/api/auth", router);

export const authApi = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
    serviceAccount: "firebase-adminsdk-fbsvc@agape-sovereign.iam.gserviceaccount.com",
    secrets: ["PASSKEY_COOKIE_SECRET"],
  },
  authApp
);
