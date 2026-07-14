import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import cookieParser from "cookie-parser";
import { ARCHITECT_SYSTEM_PROMPT } from "./src/architectPrompt.ts";
import { GoogleAuth } from "google-auth-library";
import rateLimit from "express-rate-limit";
import { WebSocketServer, WebSocket } from "ws";

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



// --- Google Auth / Proxy Setup ---
const GOOGLE_CLOUD_LOCATION = process?.env?.GOOGLE_CLOUD_LOCATION;
const GOOGLE_CLOUD_PROJECT = process?.env?.GOOGLE_CLOUD_PROJECT;
const PROXY_HEADER = process?.env?.PROXY_HEADER;

const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true, 
    legacyHeaders: false, 
    message: {
      error: 'Too many requests',
      message: 'You have exceed the request limit, please try again later.'
    },
});

const API_CLIENT_MAP = [
 {
    name: "VertexGenAi:generateContent",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:generateContent",
    getApiEndpoint: (context: any, params: any) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:generateContent`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "VertexGenAi:predict",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:predict",
    getApiEndpoint: (context: any, params: any) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:predict`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "VertexGenAi:streamGenerateContent",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:streamGenerateContent",
    getApiEndpoint: (context: any, params: any) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:streamGenerateContent`;
    },
    isStreaming: true,
    transformFn: (response: any) => {
        let normalizedResponse = response.trim();
        while (normalizedResponse.startsWith(',') || normalizedResponse.startsWith('[')) {
          normalizedResponse = normalizedResponse.substring(1).trim();
        }
        while (normalizedResponse.endsWith(',') || normalizedResponse.endsWith(']')) {
          normalizedResponse = normalizedResponse.substring(0, normalizedResponse.length - 1).trim();
        }

        if (!normalizedResponse.length) {
          return {result: null, inProgress: false};
        }

        if (!normalizedResponse.endsWith('}')) {
          return {result: normalizedResponse, inProgress: true};
        }

        try {
          const parsedResponse = JSON.parse(`${normalizedResponse}`);
          const transformedResponse = `data: ${JSON.stringify(parsedResponse)}\n\n`;
          return {result: transformedResponse, inProgress: false};
        } catch (error) {
          throw new Error(`Failed to parse response: ${error}.`);
        }
    },
  },
 {
    name: "ReasoningEngine:query",
    patternForProxy: "https://{{endpoint_location}}-aiplatform.googleapis.com/{{version}}/projects/{{project_id}}/locations/{{location_id}}/reasoningEngines/{{engine_id}}:query",
    getApiEndpoint: (context: any, params: any) => {
      return `https://${params['endpoint_location']}-aiplatform.clients6.google.com/v1beta1/projects/${params['project_id']}/locations/${params['location_id']}/reasoningEngines/${params['engine_id']}:query`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "ReasoningEngine:streamQuery",
    patternForProxy: "https://{{endpoint_location}}-aiplatform.googleapis.com/{{version}}/projects/{{project_id}}/locations/{{location_id}}/reasoningEngines/{{engine_id}}:streamQuery",
    getApiEndpoint: (context: any, params: any) => {
      return `https://${params['endpoint_location']}-aiplatform.clients6.google.com/v1beta1/projects/${params['project_id']}/locations/${params['location_id']}/reasoningEngines/${params['engine_id']}:streamQuery`;
    },
    isStreaming: true,
    transformFn: null,
  },
].map((client) => ({ ...client, patternInfo: parsePattern(client.patternForProxy) }));

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePattern(pattern: string) {
  const paramRegex = /\{\{(.*?)\}\}/g;
  const params: string[] = [];
  const parts: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = paramRegex.exec(pattern)) !== null) {
    params.push(match[1]);
    const literalPart = pattern.substring(lastIndex, match.index);
    parts.push(escapeRegex(literalPart));
    parts.push(`(?<${match[1]}>[^/]+)`);
    lastIndex = paramRegex.lastIndex;
  }
  parts.push(escapeRegex(pattern.substring(lastIndex)));
  const regexString = parts.join('');

  return {regex: new RegExp(`^${regexString}$`), params};
}

function extractParams(patternInfo: any, url: string) {
  const match = url.match(patternInfo.regex);
  if (!match) return null;
  const params: Record<string, string> = {};
  patternInfo.params.forEach((paramName: string, index: number) => {
    params[paramName] = match[index + 1];
  });
  return params;
}

async function getAccessToken(res?: express.Response) {
  try {
    const authClient = await auth.getClient();
    const token = await authClient.getAccessToken();
    return token.token;
  } catch (error: any) {
    console.error('[Node Proxy] Authentication error:', error);
    if (!res) return null;
    if (error.code === 'ERR_GCLOUD_NOT_LOGGED_IN' || (error.message && error.message.includes('Could not load the default credentials'))) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'Google Cloud Application Default Credentials not found or invalid. Please run "gcloud auth application-default login" and try again.',
      });
    } else {
      res.status(500).json({ error: `Authentication failed: ${error.message}` });
    }
    return null;
  }
}

function getRequestHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'X-Goog-User-Project': GOOGLE_CLOUD_PROJECT || "",
    'Content-Type': 'application/json',
  };
}
// --- End Google Auth / Proxy Setup ---

async function startServer() {
  console.log("BOOT: Entering startServer()");
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;
  console.log(`BOOT: Configured port is ${PORT}`);

  app.set('trust proxy', 1);
  app.use(express.json({limit: process?.env?.API_PAYLOAD_MAX_SIZE || "7mb"}));
  app.use(cookieParser("sovereign-secret-key")); 

  app.use('/api-proxy', proxyLimiter);

  // Proxy Endpoint
  app.post('/api-proxy', async (req: any, res) => {
    if (PROXY_HEADER && req.headers['x-app-proxy'] !== PROXY_HEADER) {
      return res.status(403).send('Forbidden: Request must originate from the Vertex App shim.');
    }
  
    const { originalUrl, method, headers, body } = req.body;
    if (!originalUrl) return res.status(400).send('Bad Request: originalUrl is required.');
  
    const apiClient = API_CLIENT_MAP.find(p => {
      req.extractedParams = extractParams(p.patternInfo, originalUrl);
      return req.extractedParams !== null;
    });
  
    if (!apiClient) {
      console.error(`[Node Proxy] No API client handler found for URL: ${originalUrl}`);
      return res.status(404).json({ error: `No proxy handler found for URL: ${originalUrl}` });
    }
  
    const extractedParams = req.extractedParams;
    try {
      const accessToken = await getAccessToken(res);
      if (!accessToken) return;
  
      const context = {projectId: GOOGLE_CLOUD_PROJECT, region: GOOGLE_CLOUD_LOCATION};
      const apiUrl = apiClient.getApiEndpoint(context, extractedParams);
  
      const apiHeaders = getRequestHeaders(accessToken);
      const apiFetchOptions = {
        method: method || 'POST',
        headers: {...apiHeaders, ...headers},
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      };
  
      const apiResponse = await fetch(apiUrl, apiFetchOptions);
  
      if (apiClient.isStreaming) {
        res.writeHead(apiResponse.status, {
          'Content-Type': 'text/event-stream',
          'Transfer-Encoding': 'chunked',
          'Connection': 'keep-alive',
        });
        res.flushHeaders();
  
        if (!apiResponse.body) return res.end(JSON.stringify({ error: 'Streaming response body is null' }));
  
        const decoder = new TextDecoder();
        let deltaChunk = '';
        (apiResponse.body as any).on('data', (encodedChunk: Buffer) => {
          if (res.writableEnded) return;
          try {
            if (!apiClient.transformFn) {
              res.write(encodedChunk);
            } else {
              const decodedChunk = decoder.decode(encodedChunk, { stream: true });
              deltaChunk += decodedChunk;
              const {result, inProgress} = apiClient.transformFn(deltaChunk);
              if (result && !inProgress) {
                deltaChunk = '';
                res.write(new TextEncoder().encode(result));
              }
            }
          } catch (error) {
            console.error(error);
          }
        });
        (apiResponse.body as any).on('end', () => res.end());
        (apiResponse.body as any).on('error', (e: Error) => {
          if (!res.writableEnded) res.end(JSON.stringify({ proxyError: 'Stream error', details: e.message }));
        });
      } else {
        const data = await apiResponse.json();
        res.status(apiResponse.status).json(data);
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || error });
    }
  });


  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/architect", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma4:e4b",
          stream: false,
          messages: [
            { role: "system", content: ARCHITECT_SYSTEM_PROMPT },
            ...history.map((h: any) => ({
              role: h.role === "user" ? "user" : "assistant",
              content: h.parts?.[0]?.text || h.content || ""
            })),
            { role: "user", content: message.parts?.[0]?.text || message.content || "" }
          ]
        })
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
      
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma4:e4b",
          stream: false,
          format: "json",
          messages: [
            { role: "system", content: "You are an automated privacy agent. Output must be a valid JSON object matching the requested schema. Do not output markdown backticks." },
            { role: "user", content: prompt }
          ],
          options: {
            temperature: 0.2
          }
        })
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

  // RP config — set WEBAUTHN_RP_ID to your production domain (e.g. sovereign.nyc)
  const RP_NAME = process.env.WEBAUTHN_RP_NAME || "Agape Sovereign";
  const RP_ID   = process.env.WEBAUTHN_RP_ID   || "localhost";
  const EXPECTED_ORIGIN = process.env.WEBAUTHN_ORIGIN || `http://localhost:${Number(process.env.PORT) || 5000}`;

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

  const server = app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));

  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname === '/ws-proxy') {
      let targetUrl = url.searchParams.get('target');
      if (!targetUrl) return socket.destroy();
      if (targetUrl === 'wss://aiplatform.googleapis.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent') {
        const location = GOOGLE_CLOUD_LOCATION === 'global' ? 'us-central1' : GOOGLE_CLOUD_LOCATION;
        targetUrl = `wss://${location}-aiplatform.googleapis.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
      } else {
        return socket.destroy();
      }
      let accessToken;
      try {
        accessToken = await getAccessToken();
        if (!accessToken) throw new Error('No token');
      } catch (err) { return socket.destroy(); }
      let upstreamWs: WebSocket;
      try {
        upstreamWs = new WebSocket(targetUrl, { headers: getRequestHeaders(accessToken) });
      } catch (e) { return socket.destroy(); }
      const initialErrorHandler = (error: any) => {
        upstreamWs.removeEventListener('open', onUpstreamOpen);
        if (socket.writable) { socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n'); socket.destroy(); }
      };
      upstreamWs.once('error', initialErrorHandler);
      const onUpstreamOpen = () => {
        upstreamWs.removeListener('error', initialErrorHandler);
        wss.handleUpgrade(request, socket, head, (ws) => {
          upstreamWs.on('message', (data, isBinary) => { if (ws.readyState === WebSocket.OPEN && data !== undefined && data !== null) ws.send(data, { binary: isBinary }); });
          ws.on('message', (data, isBinary) => {
            try {
              let dataJson = JSON.parse(data.toString());
              if (dataJson['setup']) dataJson['setup']['model'] = `projects/${GOOGLE_CLOUD_PROJECT}/locations/${GOOGLE_CLOUD_LOCATION}/${dataJson['setup']['model']}`;
              if (upstreamWs.readyState === WebSocket.OPEN) upstreamWs.send(JSON.stringify(dataJson), { binary: false });
            } catch (error) { ws.close(1011, 'Failed to parse message'); }
          });
          upstreamWs.on('error', (error) => ws.close(1011, error.message));
          upstreamWs.on('close', (code, reason) => { if (ws.readyState === WebSocket.OPEN) ws.close(code, reason); });
          ws.on('error', (error) => upstreamWs.close(1011, error.message));
          ws.on('close', (code, reason) => { if (upstreamWs.readyState === WebSocket.OPEN) upstreamWs.close(1000, reason); });
          wss.emit('connection', ws, request);
        });
      };
      upstreamWs.once('open', onUpstreamOpen);
    } else {
      socket.destroy();
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
