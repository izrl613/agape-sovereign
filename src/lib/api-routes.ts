// ============================================================
// ARCHITECT AI — NEXT.JS API ROUTES
// Agape Sovereign Enclave 2026
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { verifyIdToken } from "firebase/auth";
import { z } from "zod";

// Security headers middleware
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;");
  return response;
}

// Input validation schemas
const providerSchema = z.enum(['google', 'apple']);
const userIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_\-]+$/);
const scanIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_\-]+$/);
const userUpdateSchema = z.object({
  displayName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  sovereignScore: z.number().min(0).max(100).optional(),
}).strict();
const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10000),
  })).min(1).max(50),
  context: z.record(z.any()).optional(),
}).strict();

// pages/api/auth/login.ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider } = providerSchema.parse(body);

    let authProvider;
    if (provider === "google") {
      authProvider = new GoogleAuthProvider();
      authProvider.addScope("email");
      authProvider.addScope("profile");
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // This would normally be handled client-side, but we return the provider info
    const response = NextResponse.json({
      success: true,
      provider,
      message: "Authentication initiated. Complete passkey binding.",
    });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

// pages/api/user/profile.ts

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyIdToken(auth, token);
    const userId = userIdSchema.parse(decodedToken.uid);

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const response = NextResponse.json(userSnap.data());
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyIdToken(auth, token);
    const userId = userIdSchema.parse(decodedToken.uid);

    const body = await req.json();
    const updates = userUpdateSchema.parse(body);

    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { ...updates, lastUpdated: new Date() }, { merge: true });

    const response = NextResponse.json({ success: true, message: "Profile updated" });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

// pages/api/diff/scan.ts
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call Cloud Function with proper authentication
    const initiateDIFFScan = httpsCallable(functions, "initiateDIFFScan");
    const result = await initiateDIFFScan({ vectors: 16 });

    const response = NextResponse.json(result);
    return addSecurityHeaders(response);
  } catch (error) {
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyIdToken(auth, token);
    const userId = userIdSchema.parse(decodedToken.uid);

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get("scanId");
    if (!scanId) {
      return NextResponse.json({ error: "Scan ID required" }, { status: 400 });
    }
    const validatedScanId = scanIdSchema.parse(scanId);

    // Query Firestore for scan
    const scanRef = doc(db, "diff_scans", validatedScanId);
    const scanSnap = await getDoc(scanRef);

    if (!scanSnap.exists() || scanSnap.data().userId !== userId) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const response = NextResponse.json(scanSnap.data());
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

// pages/api/report/generate.ts
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scanId } = scanIdSchema.parse(body);

    // Call Cloud Function
    const generateDIFFReport = httpsCallable(functions, "generateDIFFReport");
    const result = await generateDIFFReport({ scanId });

    const response = NextResponse.json(result);
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json({ error: "Invalid scan ID format" }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

// pages/api/report/list.ts
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyIdToken(auth, token);
    const userId = userIdSchema.parse(decodedToken.uid);

    // Query Firestore for user's reports
    const reportsQuery = query(
      collection(db, "diff_reports"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const querySnap = await getDocs(reportsQuery);
    const reports = querySnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const response = NextResponse.json(reports);
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

// pages/api/ai/chat.ts
import { DEFAULT_MODEL, OLLAMA_BASE_URL, buildOllamaChatPayload } from "../config/aiModel.js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, context } = aiChatSchema.parse(body);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildOllamaChatPayload({
        stream: false,
        messages: [
          {
            role: "system",
            content: `You are Architect AI, the core intelligence engine of the Agape Sovereign Enclave 2026 — a cutting-edge Digital Identity Federated Footprint (DIFF) security and privacy platform.
Your persona: Calm, precise, futuristic, deeply knowledgeable about security and privacy.
Your purpose: Help users understand, reclaim, and fortify their digital identity across 16 identity vectors.
Core concepts: NUKED (exposures identified for removal), KNOXED (assets secured), DIFF (Digital Identity Federated Footprint).
Always be actionable and empowering. Reference ECRA 2026, GDPR, CCPA where relevant.`
          },
          ...messages.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          }))
        ],
        options: {
          temperature: 0.7
        }
      })),
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP error ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || "Unable to process request.";

    const response = NextResponse.json({ success: true, response: aiResponse });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json({ error: "Invalid chat request format", details: error.errors }, { status: 400 });
      return addSecurityHeaders(errorResponse);
    }
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}
