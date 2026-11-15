# Stage 1A1 — Passkey Setup and Authentication

**Date:** 2026-05-25  
**Project:** Agape Sovereign Enclave  
**Component:** Firebase Cloud Functions — WebAuthn/FIDO2 Passkey Flow  
**Cost:** $0 (Firebase free tier + Firebase Custom Tokens, no Identity Platform upgrade)

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Browser     │────▶│  Cloud Functions  │────▶│   Firestore   │
│  (architect- │     │  (us-east1)       │     │               │
│   ai.jsx /   │     │                   │     │  users/{uid}/ │
│   AuthContext│     │  registerPasskey  │     │  passkeyCreat-│
│   .tsx)      │     │  Options          │     │  entials/{id} │
│              │     │  verifyPasskeyReg │     │               │
│  startRegist-│     │  istration        │     │  sessions/{id}│
│  ration()    │     │  loginPasskeyOpti │     │  /loginChallen│
│  startAuthen-│     │  ons              │     │  ge/current   │
│  tication()  │     │  verifyPasskeyLogi│     │               │
│              │     │  n                │     │  users/{uid}/ │
└─────────────┘     └──────────────────┘     │  passkeyChall- │
       │                                      │  enge/current  │
       ▼                                      └──────────────┘
┌─────────────┐
│  Firebase    │
│  Auth        │
│              │
│  Custom Token│
│  (on success)│
└─────────────┘
```

## Cloud Functions (4 endpoints)

### 1. `registerPasskeyOptions` — `onCall` (authenticated)
- Called when an authenticated user wants to bind a passkey
- Generates WebAuthn registration options via `@simplewebauthn/server`
- Stores challenge in Firestore `users/{uid}/passkeyChallenge/current`
- Excludes already-registered credentials from the browser prompt

### 2. `verifyPasskeyRegistration` — `onCall` (authenticated)
- Verifies browser attestation against stored challenge
- Stores credential in `users/{uid}/passkeyCredentials/{credentialID}`
- Fields stored: `publicKey` (base64url), `credentialID`, `counter`, `transports`
- Marks `users/{uid}.passkeyBound = true`
- Audit log: `audit_logs` collection

### 3. `loginPasskeyOptions` — `onRequest` (unauthenticated)
- Accepts `{ email }`; looks up user by email in Firestore
- Returns authentication options + `tempUserId` for the client to pass back
- Stores challenge in `sessions/{userId}/loginChallenge/current`

### 4. `verifyPasskeyLogin` — `onRequest` (unauthenticated)
- Verifies assertion response against stored challenge + stored credential
- On success: updates credential counter, creates Firebase Custom Token via `admin.auth().createCustomToken()`
- Returns `{ verified: true, token: "<custom-token>" }`
- Client signs in with `signInWithCustomToken(auth, token)`

## Security

- **Challenge storage:** Firestore documents with `createdAt` timestamp — no cookies needed
- **Custom tokens:** Free tier Firebase Auth feature (no Identity Platform required)
- **Registration only from authenticated sessions:** `onCall` with `request.auth` check
- **Attestation type:** `"none"` — no privacy-invasive hardware attestation
- **Credential storage:** Public key stored as base64url; private key never leaves user's device
- **Replay protection:** Credential counter tracked and verified

## Files Changed

| File | Change |
|------|--------|
| `functions/package.json` | Added `@simplewebauthn/server@^13.3.0` |
| `functions/tsconfig.json` | `module` changed from `"commonjs"` to `"nodenext"` (required by NodeNext resolution) |
| `functions/src/architect-ai.ts` | Added 4 WebAuthn Cloud Functions (165+ lines) |
| `functions/src/index.ts` | Removed unused imports; added `export * from "./architect-ai"` |
| `functions/src/genkit-sample.ts` | Removed unused `hasClaim` import |
| `architect-ai.jsx` | Registration flow uses `httpsCallable(functions, ...)` instead of `fetch("/api/auth/...")` |
| `src/AuthContext.tsx` | Registration uses `httpsCallable`; login fetches Cloud Function URLs directly |

## Deployment

```bash
cd functions
npm install
npm run build
firebase deploy --only functions:registerPasskeyOptions,functions:verifyPasskeyRegistration,functions:loginPasskeyOptions,functions:verifyPasskeyLogin
```

## Dependencies

- `@simplewebauthn/server@^13.3.0` (functions)
- `firebase-functions@^7.0.0` (functions)
- `@simplewebauthn/browser` (client — already installed)
- `firebase/functions` — `httpsCallable` (client — already in SDK)

## Verification

1. Run locally: `firebase emulators:start --only functions,firestore,auth`
2. Test registration: log in with Google → click "Bind Passkey" → verify in Firestore `users/{uid}/passkeyCredentials`
3. Test login: sign out → enter email → click "Login with Passkey" → check `customToken` returned
4. Deploy: `firebase deploy --only functions`
