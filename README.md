# Agape Sovereign Enclave 2026

The ultimate digital overseer for private, hardware-bound identity and automated data reclamation.

## Architecture
- **Frontend**: React 19 (ESM No-Build Mode)
- **Backend**: Node.js Express (SPA Routing)
- **Security**: Hardware L3 WebAuthn Handshakes, PQC Encryption
- **Deployment**: Google Cloud Run (Serverless)

## 💎 5 Diamond Deployment (Cloud Run)

This application is ready for secure deployment on Google Cloud Run. It provides a hardened `.run.app` endpoint without the need for a custom domain.

### Prerequisites
1. [Google Cloud Account](https://console.cloud.google.com/)
2. [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and authenticated.

### Automatic Deployment
Run the included deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Cloud Run Deploy
You can also deploy directly from the source:
```bash
gcloud run deploy agape-enclave \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars API_KEY=YOUR_GEMINI_API_KEY
```

## Local Hardened Execution
1. `npm install`
2. `export API_KEY=your_key`
3. `npm start`