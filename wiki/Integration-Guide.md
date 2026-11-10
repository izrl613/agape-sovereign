# 🏗️ Architect AI — Integration & Development Guide

## Complete Technical Reference for Developers

This guide explains how all components work together and how to extend Architect AI with custom features.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCHITECT AI STACK                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   Firebase Auth  │◄────────┤  Next.js + React │        │
│  │  (OAuth + WebAuthn)       │  (Client-Side UI)│        │
│  └────────┬─────────┘         └────────┬─────────┘        │
│           │                            │                   │
│  ┌────────▼──────────────────────────────────────────┐    │
│  │        Firebase Hosting (CDN + HTTPS)            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  Cloud Firestore │◄───┤  Cloud Functions │          │
│  │ (DIFF Data, User │    │ (DIFF Scanning,  │          │
│  │  Profiles)       │    │ PDF Generation)  │          │
│  └────────┬─────────┘    └──────────────────┘          │
│           │                                             │
│  ┌────────▼─────────────────────────────────────────┐   │
│  │    Firebase Storage (PDF Reports, Backups)      │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Gemini API (AI Chat Engine)                    │   │
│  │  - Real-time Q&A                               │   │
│  │  - Context-bound sessions                      │   │
│  │  - Rate-limited guardrails                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Architecture

### Authentication Flow
```
User
  ↓
[Google/Apple OAuth]
  ↓
Firebase Auth (ID Token + Refresh Token)
  ↓
WebAuthn Passkey Registration (device-bound)
  ↓
Create User Document in Firestore
  ↓
Session Token (short-lived)
  ↓
Access Application
```

### DIFF Scan Flow
```
User initiates scan
  ↓
POST /api/diff/scan
  ↓
Cloud Function: initiateDIFFScan()
  ↓
Create Firestore doc: diff_scans/{scanId}
  ↓
Process 16 Identity Vectors in parallel:
  ├─ Email Breach Scanner
  ├─ Social Media Footprint
  ├─ Device File Scan
  ├─ ...
  └─ Behavioral Profile Analysis
  ↓
Generate Findings for each vector
  ↓
Calculate Sovereign Score (0-100)
  ↓
Generate SHA256 digest
  ↓
Store in Firestore:
  └─ /diff_scans/{scanId}
     ├─ vectorResults/{vectorId}
     └─ findings/{findingId}
  ↓
Notify Frontend (real-time update)
```

### PDF Report Generation Flow
```
User clicks "Generate DIFF Report"
  ↓
POST /api/report/generate { scanId }
  ↓
Cloud Function: generateDIFFReport()
  ↓
Fetch Firestore scan data
  ↓
Generate PDF buffer:
  ├─ Header + Sovereign Score
  ├─ Vector breakdown table
  ├─ Finding details
  ├─ Recommendations
  └─ SHA256 digest footer
  ↓
Upload to Firebase Storage:
  └─ /diff_reports/pdfs/{userId}/{reportId}.pdf
  ↓
Generate Signed URL (7-day expiry)
  ↓
Store metadata in Firestore:
  └─ /diff_reports/{reportId}
     ├─ downloadUrl
     ├─ sha256Digest
     └─ expiresAt (2 years)
  ↓
Return download link to user
```

### AI Chat Flow
```
User: "What are my top 3 exposures?"
  ↓
POST /api/ai/chat
  {
    messages: [{ role: "user", content: "..." }],
    context: { scanData, sovereignScore }
  }
  ↓
Call Gemini API with system prompt
  └─ System Context:
     - You are Architect AI
     - DIFF context: 16 vectors
     - ECRA 2026 guidelines
     - Current scan data
  ↓
Process user message + context
  ↓
Stream response token-by-token
  ↓
Return formatted response:
  └─ Markdown with emojis
     Inline code formatting
     Hyperlinks where relevant
  ↓
Display in chat UI
```

---

## 🔌 API Reference

### Authentication Endpoints

#### `POST /api/auth/login`
```typescript
Request:
{
  provider: "google" | "apple"
}

Response:
{
  success: true,
  provider: "google",
  message: "Authentication initiated. Complete passkey binding."
}
```

#### `POST /api/auth/logout`
```typescript
Response:
{
  success: true,
  message: "User logged out successfully"
}
```

---

### User Profile Endpoints

#### `GET /api/user/profile`
```typescript
Headers:
{
  Authorization: "Bearer {ID_TOKEN}"
}

Response:
{
  uid: "user_123",
  email: "user@example.com",
  displayName: "John Sovereign",
  provider: "google",
  createdAt: 1714867200000,
  sovereignScore: 71,
  monitoredEmails: ["email@example.com"],
  lastDIFFScan: 1714953600000
}
```

#### `PUT /api/user/profile`
```typescript
Request:
{
  displayName: "Updated Name",
  monitoredEmails: ["new@email.com"],
  preferences: { theme: "dark", ... }
}

Response:
{
  success: true,
  message: "Profile updated",
  data: { /* updated profile */ }
}
```

#### `DELETE /api/user/profile`
```typescript
Response:
{
  success: true,
  message: "Account and all associated data deleted"
}
```

---

### DIFF Scan Endpoints

#### `POST /api/diff/scan`
Initiate a 16-vector DIFF scan.

```typescript
Headers:
{
  Authorization: "Bearer {ID_TOKEN}",
  Content-Type: "application/json"
}

Request:
{
  vectors?: ["email", "social", ...], // Optional: scan specific vectors
  priority?: "high" | "normal"         // Optional: processing priority
}

Response:
{
  success: true,
  scanId: "scan_1714953601234_xyz789",
  message: "DIFF scan initiated. Processing 16 identity vectors...",
  estimatedTime: 45000 // milliseconds
}
```

#### `GET /api/diff/scan?scanId={scanId}`
Get scan results and findings.

```typescript
Response:
{
  userId: "user_123",
  scanId: "scan_...",
  timestamp: 1714953600000,
  status: "COMPLETED",
  vectorResults: {
    email: {
      vectorId: "V-01",
      vectorName: "Email Breach Scanner",
      severity: 72,
      nukedCount: 3,
      knoxedCount: 12,
      monitoredCount: 2,
      findings: [ /* array of findings */ ]
    },
    // ... 15 more vectors
  },
  sovereignScore: 71,
  totalNuked: 59,
  totalKnoxed: 207,
  totalMonitored: 18,
  sha256Hash: "abc123def456..."
}
```

#### `GET /api/diff/scan/list`
Get user's previous DIFF scans.

```typescript
Query Parameters:
?limit=10&offset=0

Response:
[
  {
    scanId: "scan_...",
    timestamp: 1714953600000,
    sovereignScore: 71,
    status: "COMPLETED",
    totalNuked: 59,
    totalKnoxed: 207
  },
  // ... more scans
]
```

---

### Report Generation Endpoints

#### `POST /api/report/generate`
Generate Lighthouse-style DIFF report PDF.

```typescript
Request:
{
  scanId: "scan_1714953601234_xyz789",
  format?: "pdf", // default
  includeRecommendations?: true
}

Response:
{
  success: true,
  reportId: "report_1714953700000_abc123",
  downloadUrl: "https://storage.googleapis.com/.../report_123.pdf?token=xyz",
  sha256Digest: "hash_of_report_content",
  expiresAt: 1730793600000,
  message: "PDF report generated successfully."
}
```

#### `GET /api/report/list?limit=10`
Get user's generated reports.

```typescript
Response:
[
  {
    reportId: "report_...",
    scanId: "scan_...",
    createdAt: 1714953700000,
    sovereignScore: 71,
    totalNuked: 59,
    downloadUrl: "https://...",
    sha256Digest: "hash...",
    expiresAt: 1730793600000
  },
  // ... more reports
]
```

#### `DELETE /api/report/{reportId}`
Delete a generated report.

```typescript
Response:
{
  success: true,
  message: "Report deleted successfully"
}
```

---

### AI Chat Endpoints

#### `POST /api/ai/chat`
Chat with Architect AI intelligence engine.

```typescript
Request:
{
  messages: [
    { role: "user", content: "What's my biggest security risk?" },
    { role: "assistant", content: "..." }
  ],
  context?: {
    scanId: "scan_...",
    vectorIds: ["V-01", "V-02"],
    sovereignScore: 71
  },
  model?: "gemini-pro", // default
  temperature?: 0.7,
  maxTokens?: 1000
}

Response:
{
  success: true,
  response: "Based on your current scan, your **Financial Identity Exposure** (V-10) shows the highest risk with 87% severity. This indicates potential banking credential exposure.",
  tokens: {
    input: 234,
    output: 456
  }
}
```

---

## 🔐 Authentication Implementation

### Client-Side (React)

```typescript
// lib/firebase.ts - Already configured
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Listen to auth state
export const useAuthState = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        provider: /* ... */
      } : null);
    });
    
    return () => unsubscribe();
  }, []);
  
  return user;
};
```

### Server-Side (Cloud Functions)

```typescript
// Functions authenticate using Firebase Admin SDK
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// User ID from request.auth.uid
export const initiateDIFFScan = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  const userId = context.auth.uid;
  // ... rest of function
});
```

---

## 📊 Firestore Data Model

### User Document
```
/users/{userId}
├── uid: string
├── email: string
├── displayName: string
├── provider: "google" | "apple"
├── createdAt: Timestamp
├── sovereignScore: number (0-100)
├── lastDIFFScan: Timestamp
├── monitoredEmails: string[]
└── Subcollections:
    ├── /passkeyCredentials/{credentialId}
    │   ├── publicKey: string
    │   ├── transports: string[]
    │   └── createdAt: Timestamp
    └── /monitoredEmails/{emailDoc}
        ├── email: string
        ├── status: "active" | "paused"
        └── addedAt: Timestamp
```

### DIFF Scan Document
```
/diff_scans/{scanId}
├── userId: string
├── email: string
├── scanId: string
├── timestamp: Timestamp
├── status: "IN_PROGRESS" | "COMPLETED" | "FAILED"
├── vectorResults: {
│   email: { /* VectorResult */ },
│   social: { /* VectorResult */ },
│   // ... 14 more
│ }
├── sovereignScore: number
├── totalNuked: number
├── totalKnoxed: number
├── totalMonitored: number
├── sha256Hash: string
├── completedAt: Timestamp
└── Subcollections:
    ├── /vectorResults/{vectorId}
    │   ├── vectorId: string
    │   ├── vectorName: string
    │   ├── severity: number
    │   ├── nukedCount: number
    │   ├── knoxedCount: number
    │   ├── findings: Finding[]
    │   └── timestamp: Timestamp
    └── /findings/{findingId}
        ├── id: string
        ├── type: "NUKED" | "KNOXED" | "MONITORED"
        ├── label: string
        ├── detail: string
        ├── source: string
        ├── actionRequired: boolean
        └── actionTaken: string
```

### Report Document
```
/diff_reports/{reportId}
├── userId: string
├── reportId: string
├── scanId: string
├── createdAt: Timestamp
├── sovereignScore: number
├── totalNuked: number
├── totalKnoxed: number
├── pdfStoragePath: string
├── sha256Digest: string
├── downloadUrl: string (signed, 7-day expiry)
└── expiresAt: Timestamp (2 years from creation)
```

### Audit Log Document
```
/audit_logs/{logId}
├── action: string (e.g., "DIFF_SCAN_INITIATED")
├── userId: string
├── timestamp: Timestamp (server)
├── details: {
│   scanId?: string,
│   email?: string,
│   sovereignScore?: number,
│   error?: string,
│   ipAddress?: string
│ }
```

---

## 🎨 Frontend Component Structure

### Main App Shell
```
ArchitectAIApp
├── GlobalStyle (CSS-in-JS)
├── AuthScreen (if not logged in)
│   ├── Landing
│   ├── OAuth providers (Google/Apple)
│   ├── Passkey registration
│   └── Loading states
└── MainApp (if logged in)
    ├── TopHeader
    │   ├── Live indicator
    │   ├── Time display
    │   ├── Admin button (conditional)
    │   └── Profile button
    ├── LeftNav
    │   ├── Logo
    │   ├── Stats (NUKED/KNOXED counts)
    │   ├── Main sections (Dashboard, AI, Reports)
    │   └── DIFF Module list (16 items)
    ├── MainContent
    │   ├── DashboardView
    │   │   ├── KPI cards
    │   │   └── 16-Module grid
    │   ├── ModuleDetailView
    │   │   ├── Module header
    │   │   ├── Score display
    │   │   ├── Findings list
    │   │   └── Action buttons
    │   ├── ArchitectAIView (Chat)
    │   │   ├── Message history
    │   │   ├── Suggested queries
    │   │   └── Input field
    │   └── ReportView
    │       ├── Report preview
    │       ├── Vector breakdown
    │       └── Generate button
    ├── AdminPortal (conditional)
    │   ├── Infrastructure stats
    │   ├── Firebase services status
    │   └── Audit trail
    └── ProfilePanel (conditional)
        ├── User info
        ├── Monitored emails
        └── Account settings
```

---

## 🚀 Custom Extensions

### Adding a New DIFF Vector

1. **Update Vector Definition** (`functions/index.js`):
```typescript
const DIFF_VECTORS = [
  // ... existing vectors
  { id: "newvector", name: "New Vector Name", vector: "V-17" }
];
```

2. **Create Vector Generator** (`functions/index.js`):
```typescript
function generateNewVectorResult(vector) {
  return {
    vectorId: vector.vector,
    vectorName: vector.name,
    severity: 65, // 0-100
    nukedCount: 5,
    knoxedCount: 15,
    monitoredCount: 3,
    findings: generateFindings("newvector", 5, 15, 3),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
}
```

3. **Update Frontend** (React):
```typescript
const DIFF_MODULES = [
  // ... existing modules
  { id: "newvector", icon: "⊕", label: "New Vector Name", vector: "V-17", ... }
];
```

### Custom AI Prompts

Update the system prompt in `pages/api/ai/chat.ts`:

```typescript
const systemPrompt = `You are Architect AI...

Additional custom knowledge:
- Your organization's security guidelines
- Custom threat models
- Industry-specific compliance
`;
```

### Adding WebAuthn UI

```typescript
// Use webauthn-browser library
import * as webauthnBrowser from "@webauthn/browser";

async function registerPasskey(user) {
  const credential = await webauthnBrowser.create({
    challenge: new Uint8Array(32),
    rp: {
      name: "Architect AI",
      id: "agape-sovereign.nyc"
    },
    user: {
      id: new TextEncoder().encode(user.uid),
      name: user.email,
      displayName: user.displayName
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 } // RS256
    ]
  });
  
  // Save to Firestore
  await savePasskeyCredential(user.uid, credential);
}
```

---

## 🧪 Testing & Debugging

### Unit Tests (Jest)
```typescript
// tests/diff-scan.test.ts
import { initiateDIFFScan } from "../functions/index";

describe("DIFF Scan", () => {
  test("should generate valid sovereign score", async () => {
    const result = await initiateDIFFScan({}, mockContext);
    expect(result.sovereignScore).toBeGreaterThanOrEqual(0);
    expect(result.sovereignScore).toBeLessThanOrEqual(100);
  });
});
```

### Firebase Emulator
```bash
# Start emulator
firebase emulators:start

# Run with emulator
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev

# Access UI: http://localhost:4000
```

### Console Logging
```typescript
// In Cloud Functions
console.log("Scan initiated for user:", userId);
console.error("Error:", error.message);

// View logs
firebase functions:log --follow
```

---

## 🔒 Security Best Practices

1. **Never commit secrets** to Git
2. **Use environment variables** for all credentials
3. **Enable App Check** in production
4. **Validate all user input** on server-side
5. **Use HTTPS only** in production
6. **Rotate API keys** quarterly
7. **Monitor audit logs** for suspicious activity
8. **Set spending limits** on GCP/Firebase
9. **Use strong CSP headers**
10. **Enable MFA** for Firebase Console

---

## 📞 Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub Issues**: https://github.com/izrl613/agape-sovereign
- **Email Support**: idin@agape.nyc

---

**Architect AI — Complete Technical Guide**

**Last Updated**: May 5, 2026
