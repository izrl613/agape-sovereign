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

// pages/api/auth/login.ts
export async function POST(req: NextRequest) {
  try {
    const { provider } = await req.json();

    let authProvider;
    if (provider === "google") {
      authProvider = new GoogleAuthProvider();
      authProvider.addScope("email");
      authProvider.addScope("profile");
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // This would normally be handled client-side, but we return the provider info
    return NextResponse.json({
      success: true,
      provider,
      message: "Authentication initiated. Complete passkey binding.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    // Validate JWT token here in production
    const userId = token; // TODO: Replace with actual JWT validation
    
    if (!userId || userId.length > 128) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userSnap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    // Validate JWT token here in production
    const userId = token; // TODO: Replace with actual JWT validation
    
    if (!userId || userId.length > 128) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const updates = await req.json();

    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { ...updates, lastUpdated: new Date() }, { merge: true });

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// pages/api/diff/scan.ts
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call Cloud Function
    const initiateDIFFScan = httpsCallable(functions, "initiateDIFFScan");
    const result = await initiateDIFFScan({ vectors: 16 });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    // Validate JWT token here in production
    const userId = token; // TODO: Replace with actual JWT validation
    
    if (!userId || userId.length > 128) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get("scanId");

    if (!scanId || scanId.length > 128) {
      return NextResponse.json({ error: "Invalid scan ID" }, { status: 400 });
    }

    // Query Firestore for scan (owner-scoped subcollection path)
    const scanRef = doc(db, "users", userId, "diff_scans", scanId);
    const scanSnap = await getDoc(scanRef);

    if (!scanSnap.exists()) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json(scanSnap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// pages/api/report/generate.ts
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scanId } = await req.json();

    if (!scanId || scanId.length > 128) {
      return NextResponse.json({ error: "Invalid scan ID" }, { status: 400 });
    }

    // Call Cloud Function
    const generateDIFFReport = httpsCallable(functions, "generateDIFFReport");
    const result = await generateDIFFReport({ scanId });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    // Validate JWT token here in production
    const userId = token; // TODO: Replace with actual JWT validation
    
    if (!userId || userId.length > 128) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

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

    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// pages/api/ai/chat.ts
import { DEFAULT_MODEL, OLLAMA_BASE_URL, buildOllamaChatPayload } from "../../src/config/aiModel.js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, context } = await req.json();

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

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
