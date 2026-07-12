# Deployment

← [Home](Home.md) · [Architecture](Architecture.md)

Agape Sovereign AI is deployed on **Firebase Hosting** backed by **Google Cloud Platform**, with a fully automated CI/CD pipeline via GitHub Actions.

---

## Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Production | https://sovereign.nyc | `main` | Live user traffic |
| Firebase Default | https://agape-sovereign.web.app | `main` | Firebase-assigned URL |
| Preview | Auto-generated per PR | Feature branch | PR review |

---

## Prerequisites

### Local Development

```bash
# Node.js 20 LTS required
nvm install 20 && nvm use 20

# Install dependencies
npm install

# Install Firebase CLI
npm install -g firebase-tools

# Authenticate
firebase login

# Set active project
firebase use agape-sovereign
```

### Environment Variables

Create `.env.local` (never commit this file):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=agape-sovereign.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=agape-sovereign
VITE_FIREBASE_STORAGE_BUCKET=agape-sovereign.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

All secrets for Cloud Functions are stored in **GCP Secret Manager**:

```bash
# Create a secret
gcloud secrets create POLYMER_API_KEY --data-file=./polymer-key.txt

# Grant Cloud Functions access
gcloud secrets add-iam-policy-binding POLYMER_API_KEY \
  --member="serviceAccount:agape-sovereign@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Local Development

```bash
# Start Vite dev server (hot reload)
npm run dev
# → http://localhost:5173

# Start Firebase emulators (Auth, Firestore, Functions, Hosting)
firebase emulators:start
# → http://localhost:5000 (Hosting)
# → http://localhost:4000 (Emulator UI)

# Run with emulators connected
VITE_USE_EMULATORS=true npm run dev
```

### Emulator Configuration (`firebase.json`)

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

---

## Build

```bash
# TypeScript type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Production build
npm run build
# Output: dist/

# Build Cloud Functions
cd functions && npm run build
```

---

## Deployment

### Manual Deployment

```bash
# Deploy everything (hosting + functions + Firestore rules)
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules + indexes
firebase deploy --only firestore
```

### GitHub Actions CI/CD

All merges to `main` trigger the full pipeline:

```yaml
# .github/workflows/deploy.yml (abbreviated)
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  sast:
    uses: ./.github/workflows/sast.yml      # Semgrep / CodeQL

  secret-scan:
    uses: ./.github/workflows/secrets.yml   # TruffleHog / Gitleaks

  compliance:
    uses: ./.github/workflows/compliance.yml # Custom compliance gate

  build-and-test:
    needs: [sast, secret-scan, compliance]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: agape-sovereign
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | GCP service account JSON (base64) |
| `POLYMER_API_KEY` | Polymer DLP API key |
| `UNOSECUR_API_KEY` | Unosecur identity API key |
| `NYMIZ_API_KEY` | Nymiz anonymization API key |
| `PRIVACY_PROCTOR_API_KEY` | PrivacyProctor monitoring key |
| `PRISMA_AIRS_API_KEY` | Prisma AIRS AI security key |

---

## Firebase Hosting Configuration

```json
// firebase.json (hosting section)
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" }
        ]
      }
    ]
  }
}
```

### Custom Domain (`sovereign.nyc`)

The custom domain is configured in Firebase Hosting console:
1. Go to Firebase Console → Hosting → Add custom domain
2. Add `sovereign.nyc` and follow DNS verification steps
3. Firebase provisions a managed TLS certificate automatically
4. DNS: `A` records pointing to Firebase Hosting IPs (provided in console)

---

## Monitoring & Observability

| Tool | Purpose |
|------|---------|
| Firebase Performance Monitoring | Core Web Vitals, custom traces |
| Firebase Crashlytics | Unhandled exception reporting |
| Cloud Logging | Cloud Function structured logs |
| GCP Cloud Monitoring | Uptime checks, alerting |
| Firebase Analytics | User journey funnels |

---

## Rollback

```bash
# List recent deploys
firebase hosting:releases:list

# Roll back to a previous release
firebase hosting:rollback

# Roll back to a specific release version
firebase hosting:rollback --version <VERSION_ID>
```

---

## Related Pages

- [Architecture](Architecture.md)
- [OAuth Verification](OAuth-Verification.md)
- [Home](Home.md)
