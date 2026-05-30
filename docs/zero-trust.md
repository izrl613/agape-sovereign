# Zero‑Trust Deployment Guide

## Overview
This repository is designed to run behind **Cloudflare Zero Trust** (formerly Cloudflare Access).  Users authenticate via Cloudflare Access, which issues a signed JWT that we validate in our `cloudflareAccess` middleware.  After the JWT is verified we map the `sub` claim to a stable UID and use it for Passkey registration and authentication.

## Prerequisites
- A Cloudflare account with **Zero Trust** enabled.
- A domain (`aitnyc.cloudflareaccess.com`) added to Cloudflare Zero Trust.
- An **Application** in Cloudflare Access pointing at the deployed **Vercel/Node** backend (or Cloudflare Pages).
- **Allowed groups** configured for the users that may access the app.
- The **Service Token** generated for your application (used only for internal service‑to‑service calls – not required for user flow).

## Deployment Steps
1. **Configure Cloudflare Access**
   - Create an Application with the URL `https://aitnyc.cloudflareaccess.com/*`.
   - Set the **Policy** to *Require Identity* and select the allowed groups.
   - Enable **JWT** token issuance – ensure the token includes `sub` and `email` claims.

2. **Deploy Backend**
   - Deploy the Node server (`backend/server.js`) to a Cloudflare Workers + Pages environment or any host reachable from the Cloudflare Application.
   - The server must expose the routes prefixed with `/passkey/*` – they are already protected by `cloudflareAccessMiddleware`.

3. **Configure Environment Variables**
   ```bash
   # .env (or Cloudflare Workers KV) 
   API_BACKEND_PORT=5000
   API_BACKEND_HOST=0.0.0.0
   GOOGLE_CLOUD_PROJECT=your-gcp-project
   GOOGLE_CLOUD_LOCATION=us-central1
   PROXY_HEADER=your-secret-header
   CF_JWT_PUBLIC_KEY=<<PEM‑encoded Cloudflare JWT public key>>
   ```
   The `cloudflareAccess` middleware loads the public key from the env variable and validates incoming JWTs.

4. **Front‑end Integration**
   - The UI components `PasskeyLoginModal` and `PasskeySetupFlow` are located under `src/components/auth/`.
   - Import and render `PasskeyLoginModal` from anywhere you handle login (e.g., `AuthModal`).
   - After a successful Passkey registration the UI calls the `/passkey/register` endpoint, which stores the credential under `users/{uid}/passkeys` in Firestore.

5. **Firestore Security Rules**
   - The rule `match /passkeys/{credentialId}` (see `firestore.rules`) ensures only the UID that owns the credential can read/write/delete it.
   - No additional changes needed – the rules already reference the `sub` claim from the JWT via `request.auth.uid`.

6. **Testing**
   - Access the app through the Cloudflare Access URL. You should be prompted to log in with your identity provider.
   - Open the Passkey setup flow – the browser will request biometric or PIN verification.
   - Verify that a document appears under `users/{uid}/passkeys` in Firestore.

## Optional Cloudflare Worker Proxy
If you host the front‑end on **Cloudflare Pages** you may need a small Worker to forward the JWT header to the Node backend:
```js
addEventListener('fetch', event => {
  const { request } = event;
  const cfJwt = request.headers.get('CF-Access-Jwt-Assertion');
  const url = new URL(request.url);
  url.hostname = 'api.your-backend.com'; // your Node backend host

  const newReq = new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  // Pass the JWT to the backend for verification
  newReq.headers.set('X-CF-JWT-Assertion', cfJwt);
  event.respondWith(fetch(newReq));
});
```
Deploy this worker and bind it to the same domain as your Pages site.

---

**Enjoy a password‑less, phishing‑resistant experience powered by Passkeys and Cloudflare Zero Trust!**
