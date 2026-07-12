# Authentication — Agape Sovereign AI PWA

## Sign in with Google
- Implemented via Firebase Auth (`loginWithGoogle` in `src/firebase.ts`)
- Triggers on LandingPage hero CTA and navbar button
- Post-login: redirects to `/dashboard` (not `/`)
- Google OAuth Client configured in Firebase project `agape-sovereign`
- Component: `src/components/LandingPage.tsx` (hero + nav buttons)
- Component: `src/components/Login.tsx` (dedicated login page)

## Passkey Login (WebAuthn)
- Implemented via `@simplewebauthn/browser`
- `loginWithPasskey(email)` in `AuthContext.tsx`
- `bindPasskey()` for post-login enrollment
- `PasskeyLoginModal.tsx` — glassmorphic modal UI
- `PasskeySetupFlow.tsx` — step-by-step enrollment flow
- `PasskeySetupPrompt.tsx` — auto-prompts after first Google login on capable devices

## Route Architecture
| Route | Protected | Component |
|-------|-----------|-----------|
| `/` | ❌ Public | `LandingPage.tsx` |
| `/login` | ❌ Public | `Login.tsx` |
| `/dashboard` | ✅ ProtectedRoute | `Layout.tsx` → `Dashboard.tsx` |
| `/dashboard/shield` | ✅ ProtectedRoute | `ShieldModule.tsx` |
| `/dashboard/architect` | ✅ ProtectedRoute | `ArchitectAI.tsx` |
| `/dashboard/admin` | 🔒 AdminRoute | `AdminPortal.tsx` |

## Landing Page (Public — No Auth Required)
- Route `/` renders `LandingPage.tsx` — always public, no auth check
- Shows: app name, purpose description, feature grid, Sign in with Google CTA, Passkey login CTA
- Satisfies Google OAuth branding verification (homepage not behind login)
- Footer links to `/privacy` and `/terms`

## AuthContext Methods
```ts
login()               // Google OAuth — redirects to /dashboard on success
loginWithPasskey(email) // WebAuthn authentication
bindPasskey()         // Register new passkey for current user
emergencyBypass()     // Admin emergency access
logout()              // Firebase signOut
setSetupComplete()    // Mark onboarding complete
updateProfile()       // Update user profile in Firestore
```

## Post-Login Flow
1. `onAuthStateChanged` fires → user doc created/read in Firestore
2. If `setupComplete === false` → `SplashEntry` onboarding shown
3. After onboarding → `setSetupComplete(true)` → redirect to `/dashboard`
4. `PasskeySetupPrompt` auto-shows on first Google login if WebAuthn is supported
