# ðï¸ Architect AI â Integration & Development Guide

## Complete Technical Reference for Developers

This guide explains how all components work together and how to extend Architect AI with custom features.

---

## ð Architecture Overview

```
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â                     ARCHITECT AI STACK                      â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ¤
â                                                             â
â  ââââââââââââââââââââ         ââââââââââââââââââââ        â
â  â   Firebase Auth  âââââââââââ¤  Next.js + React â        â
â  â  (OAuth + WebAuthn)       â  (Client-Side UI)â        â
â  ââââââââââ¬ââââââââââ         ââââââââââ¬ââââââââââ        â
â           â                            â                   â
â  ââââââââââ¼âââââââââââââââââââââââââââââââââââââââââââ    â
â  â        Firebase Hosting (CDN + HTTPS)            â    â
â  âââââââââââââââââââââââââââââââââââââââââââââââââââ    â
â                                                          â
â  ââââââââââââââââââââ    ââââââââââââââââââââ          â
â  â  Cloud Firestore ââââââ¤  Cloud Functions â          â
â  â (DIFF Data, User â    â (DIFF Scanning,  â          â
â  â  Profiles)       â    â PDF Generation)  â          â
â  ââââââââââ¬ââââââââââ    ââââââââââââââââââââ          â
â           â                                             â
â  ââââââââââ¼ââââââââââââââââââââââââââââââââââââââââââ   â
â  â    Firebase Storage (PDF Reports, Backups)      â   â
â  âââââââââââââââââââââââââââââââââââââââââââââââââââââ   â
â                                                          â
â  ââââââââââââââââââââââââââââââââââââââââââââââââââââ   â
â  â  Gemini API (AI Chat Engine)                    â   â
â  â  - Real-time Q&A                               â   â
â  â  - Context-bound sessions                      â   â
â  â  - Rate-limited guardrails                     â   â
â  ââââââââââââââââââââââââââââââââââââââââââââââââââââ   â
â                                                         â
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
```

---

## ð Data Flow Architecture

### Authentication Flow
```
User
  â
[Google/Apple OAuth]
  â
Firebase Auth (ID Token + Refresh Token)
  â
WebAuthn Passkey Registration (device-bound)
  â
Create User Document in Firestore
  â
Session Token (short-lived)
  â
Access Application
```

### DIFF Scan Flow
```
User initiates scan
  â
POST /api/diff/scan
  â
Cloud Function: initiateDIFFScan()
  â
Create Firestore doc: diff_scans/{scanId}
  â
Process 16 Identity Vectors in parallel:
  ââ Email Breach Scanner
  ââ Social Media Footprint
  ââ Device File Scan
  ââ ...
  ââ Behavioral Profile Analysis
  â
Generate Findings for each vector
  â
Calculate Sovereign Score (0-100)
  â
Generate SHA256 digest
  â
Store in Firestore:
  ââ /diff_scans/{scanId}
     ââ vectorResults/{vectorId}
     ââ findings/{findingId}
  â
Notify Frontend (real-time update)
```

### PDF Report Generation Flow
```
User clicks "Generate DIFF Report"
  â
POST /api/report/generate { scanId }
  â
Cloud Function: generateDIFFReport()
  â
Fetch Firestore scan data
  â
Generate PDF buffer:
  ââ Header + Sovereign Score
  ââ Vector breakdown table
  ââ Finding details
  ââ Recommendations
  ââ SHA256 digest footer
  â
Upload to Firebase Storage:
  ââ /diff_reports/pdfs/{userId}/{reportId}.pdf
  â
Generate Signed URL (7-day expiry)
  â
Store metadata in Firestore:
  ââ /diff_reports/{reportId}
     ââ downloadUrl
     ââ sha256Digest
     ââ expiresAt (2 years)
  â
Return download link to user
```

### AI Chat Flow
```
User: "What are my top 3 exposures?"
  â
POST /api/ai/chat
  {
    messages: [{ role: "user", content: "..." }],
    context: { scanData, sovereignScore }
  }
  â
Call Gemini API with system prompt
  ââ System Context:
     - You are Architect AI
     - DIFF context: 16 vectors
     - ECRA 2026 guidelines
     - Current scan data
  â
Process user message + context
  â
Stream response token-by-token
  â
Return formatted response:
  ââ Markdown with emojis
     Inline code formatting
     Hyperlinks where relevant
  â
Display in chat UI
```

---

## ð API Reference

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

## ð Authentication Implementation

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

## ð Firestore Data Model

### User Document
```
/users/{userId}
âââ uid: string
âââ email: string
âââ displayName: string
âââ provider: "google" | "apple"
âââ createdAt: Timestamp
âââ sovereignScore: number (0-100)
âââ lastDIFFScan: Timestamp
âââ monitoredEmails: string[]
âââ Subcollections:
    âââ /passkeyCredentials/{credentialId}
    â   âââ publicKey: string
    â   âââ transports: string[]
    â   âââ createdAt: Timestamp
    âââ /monitoredEmails/{emailDoc}
        âââ email: string
        âââ status: "active" | "paused"
        âââ addedAt: Timestamp
```

### DIFF Scan Document
```
/diff_scans/{scanId}
âââ userId: string
âââ email: string
âââ scanId: string
âââ timestamp: Timestamp
âââ status: "IN_PROGRESS" | "COMPLETED" | "FAILED"
âââ vectorResults: {
â   email: { /* VectorResult */ },
â   social: { /* VectorResult */ },
â   // ... 14 more
â }
âââ sovereignScore: number
âââ totalNuked: number
âââ totalKnoxed: number
âââ totalMonitored: number
âââ sha256Hash: string
âââ completedAt: Timestamp
âââ Subcollections:
    âââ /vectorResults/{vectorId}
    â   âââ vectorId: string
    â   âââ vectorName: string
    â   âââ severity: number
    â   âââ nukedCount: number
    â   âââ knoxedCount: number
    â   âââ findings: Finding[]
    â   âââ timestamp: Timestamp
    âââ /findings/{findingId}
        âââ id: string
        âââ type: "NUKED" | "KNOXED" | "MONITORED"
        âââ label: string
        âââ detail: string
        âââ source: string
        âââ actionRequired: boolean
        âââ actionTaken: string
```

### Report Document
```
/diff_reports/{reportId}
âââ userId: string
âââ reportId: string
âââ scanId: string
âââ createdAt: Timestamp
âââ sovereignScore: number
âââ totalNuked: number
âââ totalKnoxed: number
âââ pdfStoragePath: string
âââ sha256Digest: string
âââ downloadUrl: string (signed, 7-day expiry)
âââ expiresAt: Timestamp (2 years from creation)
```

### Audit Log Document
```
/audit_logs/{logId}
âââ action: string (e.g., "DIFF_SCAN_INITIATED")
âââ userId: string
âââ timestamp: Timestamp (server)
âââ details: {
â   scanId?: string,
â   email?: string,
â   sovereignScore?: number,
â   error?: string,
â   ipAddress?: string
â }
```

---

## ð¨ Frontend Component Structure

### Main App Shell
```
ArchitectAIApp
âââ GlobalStyle (CSS-in-JS)
âââ AuthScreen (if not logged in)
â   âââ Landing
â   âââ OAuth providers (Google/Apple)
â   âââ Passkey registration
â   âââ Loading states
âââ MainApp (if logged in)
    âââ TopHeader
    â   âââ Live indicator
    â   âââ Time display
    â   âââ Admin button (conditional)
    â   âââ Profile button
    âââ LeftNav
    â   âââ Logo
    â   âââ Stats (NUKED/KNOXED counts)
    â   âââ Main sections (Dashboard, AI, Reports)
    â   âââ DIFF Module list (16 items)
    âââ MainContent
    â   âââ DashboardView
    â   â   âââ KPI cards
    â   â   âââ 16-Module grid
    â   âââ ModuleDetailView
    â   â   âââ Module header
    â   â   âââ Score display
    â   â   âââ Findings list
    â   â   âââ Action buttons
    â   âââ ArchitectAIView (Chat)
    â   â   âââ Message history
    â   â   âââ Suggested queries
    â   â   âââ Input field
    â   âââ ReportView
    â       âââ Report preview
    â       âââ Vector breakdown
    â       âââ Generate button
    âââ AdminPortal (conditional)
    â   âââ Infrastructure stats
    â   âââ Firebase services status
    â   âââ Audit trail
    âââ ProfilePanel (conditional)
        âââ User info
        âââ Monitored emails
        âââ Account settings
```

---

## ð Custom Extensions

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
  { id: "newvector", icon: "â", label: "New Vector Name", vector: "V-17", ... }
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

## ð§ª Testing & Debugging

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

## ð Security Best Practices

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

## ð Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub Issues**: https://github.com/izrl613/agape-sovereign
- **Email Support**: idin@agape.nyc

---

**Architect AI â Complete Technical Guide**

**Last Updated**: May 5, 2026
