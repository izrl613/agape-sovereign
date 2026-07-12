# Authentication

Agape Sovereign uses a dual-factor auth system: **Google OAuth 2.0** as the primary identity provider and **WebAuthn Passkeys** as the second factor / passwordless alternative.

## Google OAuth

- Project: `AGAPE SOVEREIGN` on Google Cloud Console
- App homepage: `https://sovereign.nyc` (OAuth branding-compliant)
- Scopes: `email`, `profile`, `openid`
- Redirect URI: Firebase Auth redirect handler

## Passkey / WebAuthn

- Library: `@simplewebauthn/browser` (client) + `@simplewebauthn/server` (server)
- Level: WebAuthn Level 2
- Flow: register passkey on first login → use passkey for subsequent auth
- Stored: credential ID + public key in Firestore under `users/{uid}/passkeys`

## Auth Flow

```
/login
  → Google OAuth popup → Firebase Auth session
  → Check: passkey registered?
    → Yes: prompt passkey assertion → verify server-side → proceed
    → No: PasskeySetupPrompt → register new credential
  → Redirect to /dashboard
```

## Protected Routes

| Wrapper | Used for |
|---|---|
| `<ProtectedRoute>` | All `/dashboard/*` routes |
| `<AdminRoute>` | `/dashboard/admin` only |

## Google OAuth Verification Status

The app homepage at `sovereign.nyc` satisfies all three Google branding requirements:
1. ✅ Homepage accessible without login
2. ✅ Homepage describes the app's purpose
3. ✅ App name matches OAuth consent screen
