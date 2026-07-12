# Authentication

← [Home](Home.md) · [Architecture](Architecture.md)

Agape Sovereign AI supports two authentication methods:

1. **Google Sign-In** via Firebase Auth (OAuth 2.0 / OIDC)
2. **WebAuthn Passkeys** via FIDO2 + Cloud Functions

Both methods issue a Firebase ID token that every downstream service validates.

---

## Google Sign-In

### Flow

```
User clicks "Sign in with Google"
  │
  ▼
Firebase Auth SDK initiates OAuth 2.0 Authorization Code flow
  │
  ▼
Google OAuth consent screen (verified — see OAuth Verification)
  │
  ▼
Firebase receives authorization code, exchanges for tokens
  │
  ▼
Firebase issues ID token (JWT, 1-hour TTL) + refresh token
  │
  ▼
App stores token in memory; refresh token in IndexedDB (encrypted)
  │
  ▼
All Firestore reads/writes and Cloud Function calls carry this JWT
```

### Firebase Auth Configuration

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}
```

### Scopes Requested

| Scope | Purpose |
|-------|---------|
| `openid` | OIDC identity |
| `email` | Display email in profile |
| `profile` | Display name and avatar |

No sensitive scopes (Drive, Gmail, Calendar, etc.) are requested.

---

## WebAuthn Passkeys

Passkeys provide phishing-resistant, biometric-based authentication using the FIDO2/WebAuthn standard. See [`docs/stage-1A1.md`](../stage-1A1.md) for the full architecture.

### Registration Flow

```
1. User (authenticated via Google) clicks "Add Passkey"
2. Client calls Cloud Function `registerPasskey` with Firebase ID token
3. Cloud Function generates PublicKeyCredentialCreationOptions
   - rpId: 'sovereign.nyc'
   - user.id: uid (base64url)
   - challenge: 32-byte random (stored in Firestore, 5-min TTL)
   - authenticatorSelection.userVerification: 'required'
4. Browser calls navigator.credentials.create(options)
5. Platform authenticator (Touch ID / Face ID / Windows Hello) creates credential
6. Client sends credential to Cloud Function `registerPasskey`
7. Cloud Function verifies attestation, stores credentialId + publicKey in Firestore
8. Client receives confirmation; passkey shown in user's device list
```

### Authentication Flow

```
1. User visits sovereign.nyc, clicks "Sign in with Passkey"
2. Client calls Cloud Function `authenticatePasskey` (unauthenticated)
3. Cloud Function returns PublicKeyCredentialRequestOptions
   - rpId: 'sovereign.nyc'
   - challenge: 32-byte random (stored in Firestore, 5-min TTL)
   - userVerification: 'required'
4. Browser calls navigator.credentials.get(options)
5. Platform authenticator verifies user presence + user verification
6. Client sends assertion to Cloud Function `authenticatePasskey`
7. Cloud Function verifies signature against stored public key
8. Cloud Function calls Firebase Admin SDK to create custom token
9. Client signs in with custom token via signInWithCustomToken()
10. Firebase issues standard ID token — app is authenticated
```

### Cloud Function — Key Snippet

```typescript
// functions/src/passkey/authenticate.ts (abbreviated)
export const authenticatePasskey = onRequest(async (req, res) => {
  const { credentialId, clientDataJSON, authenticatorData, signature } = req.body;

  // 1. Load stored credential from Firestore
  const credDoc = await db.collection('passkeys').doc(credentialId).get();
  const { publicKey, uid, challenge } = credDoc.data()!;

  // 2. Verify challenge freshness (5-min TTL)
  if (Date.now() - challenge.createdAt > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'challenge_expired' });
  }

  // 3. Verify FIDO2 assertion (using @simplewebauthn/server)
  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: challenge.value,
    expectedOrigin: 'https://sovereign.nyc',
    expectedRPID: 'sovereign.nyc',
    authenticator: { credentialPublicKey: publicKey, counter: credDoc.data()!.counter },
  });

  if (!verification.verified) return res.status(401).json({ error: 'verification_failed' });

  // 4. Issue Firebase custom token
  const customToken = await admin.auth().createCustomToken(uid);
  res.json({ customToken });
});
```

---

## Token Lifecycle

| Token | TTL | Storage | Refresh |
|-------|-----|---------|----------|
| Firebase ID token | 1 hour | Memory | Auto via SDK |
| Firebase refresh token | Until revoked | IndexedDB | SDK handles |
| FIDO2 challenge | 5 minutes | Firestore | New per ceremony |

---

## Security Considerations

- **CSRF**: WebAuthn is inherently CSRF-resistant (origin binding)
- **Phishing**: Passkeys are bound to `sovereign.nyc` — cannot be replayed on other origins
- **Account takeover**: Google Sign-In benefits from Google's suspicious-activity detection
- **Token leakage**: ID tokens are short-lived; refresh tokens are stored encrypted in IndexedDB
- **Revocation**: `admin.auth().revokeRefreshTokens(uid)` immediately invalidates all sessions

---

## Related Pages

- [Architecture](Architecture.md)
- [OAuth Verification](OAuth-Verification.md)
- [`docs/stage-1A1.md`](../stage-1A1.md)
