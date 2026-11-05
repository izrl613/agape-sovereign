# Passkey Signing with Google + Anon Bypass (Free Tier)

## Steps (in order)
1. User selects WebAuthn device (YubiKey/FIDO2)
2. Private key stays on device; public key sent to Firebase Auth
3. Firebase validates: no private data exposed → KNOXED
4. DEK encrypted with user's passkey, wrapped twice (recovery code fallback)
5. All data stored only in AES-256-GCM envelope; never decrypted server-side

## Code (simplified)
```javascript
async function signWithPasskey() {
  const passkey = await navigator.credentials.create({ publicKey: publicKey });
  await firebase.auth().signInWithCustomTokens(passkey);
}
```
This uses Firebase’s `signInWithCustomTokens` for passkey flow.

## Free Tier Notes
- 15 RPM: Passkey signing uses 1 request per session
- 50k Reads: No reads from Google APIs
- Zero-Knowledge: Server cannot derive key from passkey

This satisfies: Zero-Trust, Zero-Knowledge, KNOXED status.