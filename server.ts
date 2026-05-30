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
import fs from "fs";
import os from "os";

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

let aiInstance: GoogleGenAI | null = null;
function getGoogleGenAI(apiKey: string): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const GEMINI_SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HATE_SPEECH" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_HARASSMENT" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT" as const,
    threshold: "BLOCK_LOW_AND_ABOVE" as const,
  },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RP_NAME = "Agape Sovereign";

interface IDEConfig {
  ai?: {
    provider?: string;
    baseUrl?: string;
    model?: string;
    contextlength?: number;
  };
}

function loadIDEConfig(): IDEConfig {
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
  const PORT = Number(process.env.PORT) || 3000;
  console.log(`BOOT: Configured port is ${PORT}`);

  app.use(express.json());
  app.use(cookieParser("sovereign-secret-key")); // Use a better secret in production

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Local AI Status probe (proxy for Ollama)
  app.get("/api/status", async (req, res) => {
    const ideConfig = loadIDEConfig();
    const baseUrl = ideConfig.ai?.baseUrl || "http://localhost:11434";
    const model = ideConfig.ai?.model || "gemma4:e4b";

    try {
      const response = await fetch(`${baseUrl}/v1/models`, {
        method: "GET",
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        let portNum = 11434;
        try {
          portNum = Number(new URL(baseUrl).port) || 80;
        } catch (_) {}

        return res.json({
          online: true,
          port: portNum,
          modelName: model,
          usage: "Unlimited Tokens",
          costModel: "Zero External Billing"
        });
      }
    } catch (e) {
      // Ollama is offline
    }
    res.json({
      online: false,
      port: 11434,
      modelName: model,
      usage: "Offline",
      costModel: "Standard Billing"
    });
  });

  // Local AI Chat Proxy (proxy to Ollama, fallback to Gemini Cloud)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, max_tokens } = req.body;
      const ideConfig = loadIDEConfig();
      const provider = ideConfig.ai?.provider || "ollama";
      const baseUrl = ideConfig.ai?.baseUrl || "http://localhost:11434";
      const model = ideConfig.ai?.model || "gemma4:e4b";
      
      // 1. Try local Ollama first
      if (provider === "ollama") {
        try {
          const lmRes = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: model,
              messages,
              max_tokens: max_tokens || -1,
              stream: false
            }),
            signal: AbortSignal.timeout(5000)
          });
          if (lmRes.ok) {
            const data = await lmRes.json();
            return res.json(data);
          }
        } catch (e) {
          console.log("[PROXY] Ollama offline or timed out, falling back to Cloud Gemini...");
        }
      }

      // 2. Fallback to Cloud Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      const ai = getGoogleGenAI(apiKey);
      
      // Extract system instructions and messages in Gemini format
      let systemInstruction = "";
      const contents: any[] = [];
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
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemInstruction || undefined,
          safetySettings: GEMINI_SAFETY_SETTINGS,
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

  // Architect AI Chat Endpoint
  app.post("/api/architect", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      // Using gemini-2.5-flash for maximum cost efficiency and speed.
      const ai = getGoogleGenAI(apiKey);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...history,
          message
        ],
        config: {
          systemInstruction: ARCHITECT_SYSTEM_PROMPT,
          safetySettings: GEMINI_SAFETY_SETTINGS,
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

      const ai = getGoogleGenAI(apiKey);
      
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
          safetySettings: GEMINI_SAFETY_SETTINGS,
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
        secure: true, 
        sameSite: 'lax',
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
        const { credential } = verification.registrationInfo;
        const credentialID = credential.id;
        const credentialPublicKey = Buffer.from(credential.publicKey).toString('base64url');
        const counter = credential.counter;
        
        const userUid = userId || body.user?.id;
        if (!userUid) throw new Error("No user ID found");

        await db.collection('users').doc(userUid).collection('passkeyCredentials').doc(credentialID).set({
          publicKey: credentialPublicKey,
          credentialID: credentialID,
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
        secure: true, 
        sameSite: 'lax',
        signed: true,
        maxAge: 60000 
      });
      
      res.cookie('auth-user-id', userId, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'lax',
        signed: true 
      });

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
        credential: {
          id: credData.credentialID,
          publicKey: Buffer.from(credData.publicKey, 'base64url'),
          counter: credData.counter,
          transports: credData.transports,
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
