# Deployment

## Firebase Hosting

The PWA is deployed to Firebase Hosting at `https://sovereign.nyc`.

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

## Environment Variables

Required `.env.local` keys:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_CLIENT_ID=
GOOGLE_APPLICATION_CREDENTIALS=   # path to service account JSON
```

## Firebase Services Used

| Service | Purpose |
|---|---|
| Firebase Auth | Google OAuth + session management |
| Firestore | All module data + scan results |
| Firebase Hosting | Static PWA serving at sovereign.nyc |
| Firebase Admin | Server-side auth verification |
| BigQuery | Advanced analytics (optional) |

## CI/CD

Manual deploy via Firebase CLI. Recommended future setup:
1. GitHub Actions on push to `main`
2. Run `npm run build`
3. Run `firebase deploy --only hosting`

## Security

- Branch protection on `main` — require Compliance Gate
- Firebase App Check enabled for Cloud Functions
- Secret scanning enabled on the GitHub repo
- Passkey ceremony runs server-side via Express API (not client-exposed)
