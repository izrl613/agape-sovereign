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
import { ARCHITECT_SYSTEM_PROMPT } from "./src/architectPrompt";

console.log("BOOT: Starting Agape Sovereign Enclave server...");
// Initialize Firebase Admin
if (!admin.apps.length) {
  console.log("BOOT: Initializing Firebase Admin...");
  admin.initializeApp();
  console.log("BOOT: Firebase Admin initialized.");
}
console.log("BOOT: Obtaining Firestore reference...");
const db = admin.firestore();
console.log("BOOT: Firestore reference obtained.");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RP_NAME = "Agape Sovereign";

async function startServer() {
  console.log("BOOT: Entering startServer()");
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  console.log(`BOOT: Configured port is ${PORT}`);

  app.use(express.json());
  app.use(cookieParser("sovereign-secret-key")); // Use a better secret in production

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Architect AI Chat Endpoint
  app.post("/api/architect", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      // Using gemini-2.5-flash for maximum cost efficiency and speed.
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...history,
          message
        ],
        config: {
          systemInstruction: ARCHITECT_SYSTEM_PROMPT,
        }
      });

      res.json({ reply: response.text });
    } catch (error) {
      console.error("Architect AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // Sovereign Erasure Engine Endpoint
  app.post("/api/erasure/initiate", async (req, res) => {
    try {
      const { brokerName, userEmail, userName, userState } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an automated privacy agent representing ${userName}. Generate a legally binding data deletion request under CCPA, GDPR, and FCRA regulations addressed to the data broker "${brokerName}".
      
      Return ONLY a JSON object with this exact format, nothing else:
      {
        "subject": "URGENT LEGAL: CCPA/GDPR Data Deletion Request - ${userName}",
        "body": "The full formal email body..."
      }
      
      Do not include markdown formatting or backticks around the JSON.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [prompt],
        config: {
          temperature: 0.2,
        }
      });

      try {
        const text = response.text || "{}";
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
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

  // WebAuthn Registration Options
  app.post("/api/auth/register-options", async (req, res) => {
    try {
      const { userId, userEmail } = req.body;
      if (!userId || !userEmail) return res.status(400).json({ error: "Missing user info" });

      const host = req.get('host')?.split(':')[0] || 'localhost';
      const rpId = host === '127.0.0.1' ? 'localhost' : host;

      // Get existing credentials to exclude them
      const userRef = db.collection('users').doc(userId);
      const credsSnap = await userRef.collection('passkeyCredentials').get();
      const excludeCredentials = credsSnap.docs.map(doc => ({
        id: doc.id,
        type: 'public-key' as const,
        transports: doc.data().transports,
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rpId,
        userID: userId,
        userName: userEmail,
        userDisplayName: userEmail,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
      });

      // Store challenge in signed cookie
      res.cookie('registration-challenge', options.challenge, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        signed: true,
        maxAge: 60000 
      });

      res.json(options);
    } catch (error) {
      console.error("Register Options Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // WebAuthn Verification
  app.post("/api/auth/verify-registration", async (req, res) => {
    try {
      const { body } = req;
      const { userId } = req.body; 
      const expectedChallenge = req.signedCookies['registration-challenge'];

      if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired or missing" });

      const host = req.get('host')?.split(':')[0] || 'localhost';
      const rpId = host === '127.0.0.1' ? 'localhost' : host;
      const origin = `${req.protocol}://${req.get('host')}`;

      const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
        
        const userUid = userId || body.user?.id;
        if (!userUid) throw new Error("No user ID found");

        await db.collection('users').doc(userUid).collection('passkeyCredentials').doc(Buffer.from(credentialID).toString('base64url')).set({
          publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
          credentialID: Buffer.from(credentialID).toString('base64url'),
          counter,
          transports: body.response.transports || [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
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

  // WebAuthn Login Options
  app.post("/api/auth/login-options", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Missing email" });

      // Find user by email
      const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
      if (userSnap.empty) return res.status(404).json({ error: "User not found" });
      
      const userDoc = userSnap.docs[0];
      const userId = userDoc.id;

      // Get credentials
      const credsSnap = await userDoc.ref.collection('passkeyCredentials').get();
      const allowCredentials = credsSnap.docs.map(doc => ({
        id: doc.id,
        type: 'public-key' as const,
        transports: doc.data().transports,
      }));

      const host = req.get('host')?.split(':')[0] || 'localhost';
      const rpId = host === '127.0.0.1' ? 'localhost' : host;

      const options = await generateAuthenticationOptions({
        rpID: rpId,
        allowCredentials,
        userVerification: 'preferred',
      });

      res.cookie('authentication-challenge', options.challenge, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        signed: true,
        maxAge: 60000 
      });
      
      res.cookie('auth-user-id', userId, { httpOnly: true, signed: true });

      res.json(options);
    } catch (error) {
      console.error("Login Options Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // WebAuthn Login Verification
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      const { body } = req;
      const expectedChallenge = req.signedCookies['authentication-challenge'];
      const userId = req.signedCookies['auth-user-id'];

      if (!expectedChallenge || !userId) return res.status(400).json({ error: "Challenge expired or missing" });

      const credentialId = body.id;
      const credDoc = await db.collection('users').doc(userId).collection('passkeyCredentials').doc(credentialId).get();
      
      if (!credDoc.exists) return res.status(400).json({ error: "Credential not found" });
      const credData = credDoc.data()!;

      const host = req.get('host')?.split(':')[0] || 'localhost';
      const rpId = host === '127.0.0.1' ? 'localhost' : host;
      const origin = `${req.protocol}://${req.get('host')}`;

      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
        authenticator: {
          credentialID: Buffer.from(credData.credentialID, 'base64url'),
          credentialPublicKey: Buffer.from(credData.publicKey, 'base64url'),
          counter: credData.counter,
        },
      });

      if (verification.verified) {
        // Update counter
        await credDoc.ref.update({ counter: verification.authenticationInfo.newCounter });

        // Generate Firebase Custom Token
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Fallback to index.html for SPA routing
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
