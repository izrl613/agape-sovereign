import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import cookieParser from "cookie-parser";
import { ARCHITECT_SYSTEM_PROMPT } from "./src/architectPrompt.ts";
import { DEFAULT_MODEL, OLLAMA_BASE_URL, buildOllamaChatPayload } from "./src/config/aiModel.js";

console.log("BOOT: Starting Agape Sovereign Enclave server...");
if (!getApps().length) {
  console.log("BOOT: Initializing Firebase Admin...");
  initializeApp();
  console.log("BOOT: Firebase Admin initialized.");
}
console.log("BOOT: Obtaining Firestore reference...");
const db = getFirestore();
console.log("BOOT: Firestore reference obtained.");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function startServer() {
  console.log("BOOT: Entering startServer()");
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;
  console.log(`BOOT: Configured port is ${PORT}`);

  app.set('trust proxy', 1);
  app.use(express.json({limit: process?.env?.API_PAYLOAD_MAX_SIZE || "7mb"}));
  app.use(cookieParser("sovereign-secret-key")); 

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/architect", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOllamaChatPayload({
          stream: false,
          messages: [
            { role: "system", content: ARCHITECT_SYSTEM_PROMPT },
            ...history.map((h: any) => ({
              role: h.role === "user" ? "user" : "assistant",
              content: h.parts?.[0]?.text || h.content || ""
            })),
            { role: "user", content: message.parts?.[0]?.text || message.content || "" }
          ]
        }))
      });
      if (!response.ok) throw new Error(`Ollama HTTP error ${response.status}`);
      const data = await response.json();
      res.json({ reply: data.message?.content || "" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.post("/api/erasure/initiate", async (req, res) => {
    try {
      const { brokerName, userEmail, userName, userState } = req.body;
      const prompt = `You are an automated privacy agent representing ${userName}. Generate a legally binding data deletion request under CCPA, GDPR, and FCRA regulations addressed to the data broker "${brokerName}".
      Return ONLY a JSON object with this exact format, nothing else:
      {
        "subject": "URGENT LEGAL: CCPA/GDPR Data Deletion Request - ${userName}",
        "body": "The full formal email body..."
      }`;
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOllamaChatPayload({
          stream: false,
          format: "json",
          messages: [
            { role: "system", content: "You are an automated privacy agent. Output must be a valid JSON object matching the requested schema. Do not output markdown backticks." },
            { role: "user", content: prompt }
          ],
          options: {
            temperature: 0.2
          }
        }))
      });

      if (!response.ok) throw new Error(`Ollama HTTP error ${response.status}`);
      const data = await response.json();
      const text = data.message?.content || "{}";

      try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleaned);
        res.json(result);
      } catch (parseError) {
        res.status(500).json({ error: "Failed to parse AI JSON response", text });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate erasure request" });
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // WebAuthn / Passkey routes
  // Supports both platform authenticators (Touch ID / Face ID) and
  // cross-platform hardware keys (YubiKey, etc.)
  // ─────────────────────────────────────────────────────────────────
  const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
  } = await import("@simplewebauthn/server");

  const { getAuth: getAdminAuth } = await import("firebase-admin/auth");

  const RP_NAME = process.env.WEBAUTHN_RP_NAME || "Agape Sovereign";
  const RP_ID   = process.env.WEBAUTHN_RP_ID   || (process.env.NODE_ENV === "production" ? "sovereign.nyc" : "localhost");
  const EXPECTED_ORIGIN = process.env.WEBAUTHN_ORIGIN || (process.env.NODE_ENV === "production" ? "https://sovereign.nyc" : `http://localhost:${Number(process.env.PORT) || 5000}`);

  // ── POST /api/auth/register-options ──────────────────────────────
  // Called when a logged-in user wants to bind a new passkey (hardware or platform).
  // Also used during registration-at-login if no account exists yet.
  app.post("/api/auth/register-options", async (req, res) => {
    try {
      const { userId, userEmail, email } = req.body;
      const resolvedEmail = userEmail || email;
      if (!resolvedEmail) return res.status(400).json({ error: "email is required" });

      // Look up existing credentials for this user so we can exclude them
      const existingSnap = await db.collection("passkey_credentials")
        .where("email", "==", resolvedEmail)
        .get();
      const excludeCredentials = existingSnap.docs.map((d) => ({
        id: d.data().credentialID,
        type: "public-key" as const,
        transports: d.data().transports || [],
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: new TextEncoder().encode(userId || resolvedEmail),
        userName: resolvedEmail,
        userDisplayName: resolvedEmail,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          // Allow both platform (Face ID / Touch ID) and cross-platform (YubiKey)
          // Front-end can override by setting authenticatorAttachment on the options
          residentKey: "preferred",
          userVerification: "preferred",
        },
        supportedAlgorithmIDs: [-7, -257], // ES256, RS256
      });

      // Cache challenge in Firestore (5-min TTL)
      await db.collection("passkey_challenges").doc(resolvedEmail).set({
        challenge: options.challenge,
        type: "registration",
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      res.json(options);
    } catch (err: any) {
      console.error("[WebAuthn] register-options error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/auth/verify-registration ───────────────────────────
  // Verifies the attestation response from the browser, stores credential.
  app.post("/api/auth/verify-registration", async (req, res) => {
    try {
      const { email, userId, ...attestationResponse } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });

      // Fetch and validate challenge
      const challengeRef = db.collection("passkey_challenges").doc(email);
      const challengeDoc = await challengeRef.get();
      if (!challengeDoc.exists) return res.status(400).json({ error: "No pending challenge for this email" });
      const { challenge, expiresAt } = challengeDoc.data()!;
      if (Date.now() > expiresAt) {
        await challengeRef.delete();
        return res.status(400).json({ error: "Challenge expired. Please try again." });
      }

      const verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: challenge,
        expectedOrigin: EXPECTED_ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: false,
      });

      await challengeRef.delete();

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ verified: false, error: "Verification failed" });
      }

      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Persist credential
      const credentialID = Buffer.from(credential.id).toString("base64url");
      await db.collection("passkey_credentials").doc(credentialID).set({
        credentialID,
        credentialPublicKey: Buffer.from(credential.publicKey).toString("base64"),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: attestationResponse.response?.transports || [],
        email,
        userId: userId || email,
        createdAt: Date.now(),
      });

      // Mint a Firebase custom token so the client can sign in
      const firebaseToken = await getAdminAuth().createCustomToken(userId || email, {
        passkey: true,
        email,
      });

      res.json({ verified: true, token: firebaseToken });
    } catch (err: any) {
      console.error("[WebAuthn] verify-registration error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/auth/login-options ─────────────────────────────────
  // Returns an assertion challenge for an existing passkey login.
  app.post("/api/auth/login-options", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });

      // Look up credentials for this user
      const credsSnap = await db.collection("passkey_credentials")
        .where("email", "==", email)
        .get();

      if (credsSnap.empty) {
        return res.status(404).json({ error: "No passkey registered for this email" });
      }

      const allowCredentials = credsSnap.docs.map((d) => ({
        id: d.data().credentialID,
        type: "public-key" as const,
        transports: d.data().transports || [],
      }));

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials,
        userVerification: "preferred",
      });

      // Cache challenge
      await db.collection("passkey_challenges").doc(email).set({
        challenge: options.challenge,
        type: "authentication",
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      res.json(options);
    } catch (err: any) {
      console.error("[WebAuthn] login-options error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/auth/verify-login ──────────────────────────────────
  // Verifies assertion response and mints a Firebase custom token.
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      const assertionResponse = req.body;
      const rawCredentialID = assertionResponse.id || assertionResponse.rawId;

      // Look up the stored credential
      const credentialID = Buffer.from(
        typeof rawCredentialID === "string" ? Buffer.from(rawCredentialID, "base64url") : rawCredentialID
      ).toString("base64url");

      const credRef = db.collection("passkey_credentials").doc(credentialID);
      const credDoc = await credRef.get();
      if (!credDoc.exists) {
        return res.status(404).json({ error: "Credential not found" });
      }
      const storedCred = credDoc.data()!;

      // Fetch challenge
      const challengeRef = db.collection("passkey_challenges").doc(storedCred.email);
      const challengeDoc = await challengeRef.get();
      if (!challengeDoc.exists) return res.status(400).json({ error: "No pending challenge" });
      const { challenge, expiresAt } = challengeDoc.data()!;
      if (Date.now() > expiresAt) {
        await challengeRef.delete();
        return res.status(400).json({ error: "Challenge expired. Please try again." });
      }

      const verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: challenge,
        expectedOrigin: EXPECTED_ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: storedCred.credentialID,
          publicKey: Buffer.from(storedCred.credentialPublicKey, "base64"),
          counter: storedCred.counter,
          transports: storedCred.transports,
        },
        requireUserVerification: false,
      });

      await challengeRef.delete();

      if (!verification.verified) {
        return res.status(400).json({ verified: false, error: "Authentication failed" });
      }

      // Update counter to prevent replay attacks
      await credRef.update({ counter: verification.authenticationInfo.newCounter });

      // Mint Firebase custom token
      const firebaseToken = await getAdminAuth().createCustomToken(storedCred.userId || storedCred.email, {
        passkey: true,
        email: storedCred.email,
      });

      res.json({ verified: true, token: firebaseToken });
    } catch (err: any) {
      console.error("[WebAuthn] verify-login error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  // ─────────────────────────────────────────────────────────────────

  // Vite is run separately in dev mode via concurrently
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/*splat", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
