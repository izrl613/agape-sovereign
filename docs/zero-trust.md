# Firebase Authentication Deployment Guide

## Overview
This repository uses **Firebase Authentication** as the primary authentication mechanism. Users authenticate via Firebase Auth (Google, Email/Password, Anonymous, etc.) and can optionally bind WebAuthn passkeys for passwordless, phishing-resistant authentication. 

## Prerequisites
- A Firebase project with **Authentication** enabled.
- Firebase project configured with desired auth providers (Google, Email/Password, etc.).
- Firestore database configured with proper security rules.
- Firebase Admin SDK credentials for backend operations.

## Deployment Steps
1. **Configure Firebase Authentication**
   - Enable desired authentication providers in Firebase Console.
   - Configure email/password settings if using email auth.
   - Set up Google Auth provider if using Google sign-in.
   - Configure domain authorization for your app domains.

2. **Deploy Backend**
   - Deploy the Node server (`server.ts`) to your hosting environment (Cloud Run, Vercel, etc.).
   - Ensure Firebase Admin SDK credentials are properly configured.
   - The server exposes routes prefixed with `/api/auth/*` for passkey operations.

3. **Configure Environment Variables**
   ```bash
   # .env
   API_BACKEND_PORT=5000
   API_BACKEND_HOST=0.0.0.0
   FIREBASE_PROJECT_ID=your-firebase-project
   FIREBASE_CLIENT_ID=your-firebase-client-id
   WEBAUTHN_RP_ID=your-domain.com
   WEBAUTHN_ORIGIN=https://your-domain.com
   NODE_ENV=production
   ```

4. **Front‑end Integration**
   - The UI components for passkey authentication are located in the frontend.
   - Firebase Auth SDK handles primary authentication.
   - Passkey registration and authentication use the `/api/auth/*` endpoints.
   - After successful passkey registration, credentials are stored under `users/{uid}/passkeyCredentials` in Firestore.

5. **Firestore Security Rules**
   - Security rules in `firestore.rules` ensure proper access control.
   - Rules use `request.auth.uid` from Firebase Auth tokens.
   - Passkey credentials are protected with owner-based access control.

6. **Testing**
   - Access the app through your deployed domain.
   - Test primary authentication (Google, Email/Password, etc.).
   - Test passkey registration and authentication flows.
   - Verify credentials appear under `users/{uid}/passkeyCredentials` in Firestore.

## Environment Configuration
- **Development**: Uses `localhost` for WebAuthn RP ID and origin
- **Production**: Uses your actual domain for WebAuthn RP ID and origin
- **Firebase**: Handles all authentication state and token management

## Security Notes
- Firebase Auth tokens are verified on the backend using Admin SDK.
- Passkey credentials are stored encrypted in Firestore.
- All authentication operations require valid Firebase Auth tokens.
- Device validation and MAC address validation provide additional security layers.

---

**Enjoy a password‑less, phishing‑resistant experience powered by Passkeys and Firebase Authentication!**