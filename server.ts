import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as admin from "firebase-admin";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { ARCHITECT_SYSTEM_PROMPT } from "./src/architectPrompt.ts";
import { GoogleAuth } from "google-auth-library";
import rateLimit from "express-rate-limit";
import { WebSocketServer, WebSocket } from "ws";

console.log("BOOT: Starting Agape Sovereign Enclave server...");
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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...history, message],
        config: { systemInstruction: ARCHITECT_SYSTEM_PROMPT }
      });
      res.json({ reply: response.text });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.post("/api/erasure/initiate", async (req, res) => {
    try {
      const { brokerName, userEmail, userName, userState } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
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
        config: { temperature: 0.2 }
      });
      try {
        const text = response.text || "{}";
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleaned);
        res.json(result);
      } catch (parseError) {
        res.status(500).json({ error: "Failed to generate properly formatted legal request." });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to generate erasure request" });
    }
  });

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
