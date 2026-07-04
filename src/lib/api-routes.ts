// ============================================================
// ARCHITECT AI — NEXT.JS API ROUTES
// Agape Sovereign Enclave 2026
// ============================================================

// pages/api/auth/login.ts
import { NextRequest, NextResponse } from "next/server";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const { provider } = await req.json();

    let authProvider;
    if (provider === "google") {
      authProvider = new GoogleAuthProvider();
      authProvider.addScope("email");
      authProvider.addScope("profile");
    } else if (provider === "apple") {
      authProvider = new OAuthProvider("apple.com");
      authProvider.addScope("email");
      authProvider.addScope("name");
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
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authHeader.split(" ")[1];
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
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authHeader.split(" ")[1];
    const updates = await req.json();

    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { ...updates, lastUpdated: new Date() }, { merge: true });

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// pages/api/diff/scan.ts
import { NextRequest, NextResponse } from "next/server";
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
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
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authHeader.split(" ")[1];
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get("scanId");

    // Query Firestore for scan
    const scanRef = doc(db, "diff_scans", scanId || "");
    const scanSnap = await getDoc(scanRef);

    if (!scanSnap.exists() || scanSnap.data().userId !== userId) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json(scanSnap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// pages/api/report/generate.ts
import { NextRequest, NextResponse } from "next/server";
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scanId } = await req.json();

    // Call Cloud Function
    const generateDIFFReport = httpsCallable(functions, "generateDIFFReport");
    const result = await generateDIFFReport({ scanId });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// pages/api/report/list.ts
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authHeader.split(" ")[1];

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
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, context } = await req.json();

    // Call Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: messages.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        systemInstruction: {
          parts: [
            {
              text: `You are Architect AI, the core intelligence engine of the Agape Sovereign Enclave 2026 — a cutting-edge Digital Identity Federated Footprint (DIFF) security and privacy platform.

Your persona: Calm, precise, futuristic, deeply knowledgeable about security and privacy.

Your purpose: Help users understand, reclaim, and fortify their digital identity across 16 identity vectors.

Core concepts: NUKED (exposures identified for removal), KNOXED (assets secured), DIFF (Digital Identity Federated Footprint).

Always be actionable and empowering. Reference ECRA 2026, GDPR, CCPA where relevant.`,
            },
          ],
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to process request.";

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
