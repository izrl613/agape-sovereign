# Owner Setup — Zero-Cost Production (idin@agape.nyc)

The code is deploy-ready. These one-time console steps are the only
things that cannot be done from the repository. Everything below is on
free tiers; the app is designed to run at zero marginal cost.

## 1. Firebase Authentication providers (required for real logins)

Firebase Console → project **agape-sovereign** → Authentication → Sign-in method:

- Enable **Google** (Method 2, federated). This is also what powers
  "Save the 26-month audit PDF to my Google Drive" (`drive.file` scope).
- Enable **Anonymous** (real guest sessions).
- Authentication → Settings → **Authorized domains**: ensure
  `sovereign.nyc`, `agape-sovereign.web.app`,
  `agape-sovereign.firebaseapp.com` are listed (plus `localhost` for dev).

Passkey (Method 1) uses the Cloud Functions auth API (`/api/auth/*`),
already implemented in `functions/src/auth.ts`. No console toggle
needed; it works once Functions are deployed.

> If a provider is not enabled, the login screen now says so honestly
> instead of faking a session.

## 2. Architect AI cloud model (optional, free tier)

Architect AI answers on-device (labelled "LOCAL KB") until a Gemini key
exists. To enable the cloud model at zero cost:

1. Create a free key at Google AI Studio (aistudio.google.com).
2. Put `GEMINI_API_KEY=<key>` in `functions/.env.agape-sovereign` (gitignored — never commit it). A Secret-Manager binding is deliberately NOT used because it blocks `firebase deploy` until the secret exists.
3. Redeploy functions (step 3). Answers are then labelled "GEMINI".

Only receipt hashes + verification outcomes are ever sent to the model.

## 3. Deploy

```bash
npm ci                       # root (workspaces: frontend, backend)
npm --prefix functions ci
npm run build                # builds frontend/
npx firebase-tools deploy --only hosting,functions,firestore --project agape-sovereign
```

Or merge the PR to `main`: `.github/workflows/deploy.yml` and
`firebase-hosting-merge.yml` deploy automatically using the
`FIREBASE_SERVICE_ACCOUNT_AGAPE_SOVEREIGN` repo secret.

## 4. How the 16 modules are verified (no simulated data)

| Module | Verification (free, keyless) |
|---|---|
| Communication | XposedOrNot breach corpus · Cloudflare DoH MX · HIBP passwords (k-anonymity) |
| Social | GitHub REST API (GitHub handles); others SELF_ATTESTED |
| Privacy Reclaim | Real CCPA/GDPR erasure letter generated on-device |
| Legal | On-device format check; document number never leaves the device |
| Network | ipwho.is IP intelligence |
| Cryptographic | mempool.space (BTC) · public ETH JSON-RPC (llamarpc) |
| Biometric | Real WebAuthn platform-authenticator capability check |
| Location | OpenStreetMap Nominatim geocode (country/type only stored) |
| Permissions | On-device consent-expiry computation |
| Professional / Health / Educational / Reputation / Subscription / Behavioral / Membership | No free keyless verification exists → receipts honestly state SELF_ATTESTED |

Every entry is SHA-256 hashed (its lit-up SHA-256 ID) and AES-256-GCM
encrypted on-device before storage; Firestore only holds ciphertext
under `users/{uid}/receipts`.
