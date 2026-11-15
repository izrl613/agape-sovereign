# 🚀 Architect AI — Complete Deployment Guide

## Agape Sovereign Enclave 2026 | DIFF Intelligence Platform

This guide will walk you through deploying Architect AI on Firebase free tier with your existing credentials.

---

## ✅ Pre-Deployment Checklist

- [ ] Firebase project created: **agape-sovereign**
- [ ] Node.js 20+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Gemini API key obtained
- [ ] Admin emails configured (`idin@agape.nyc`, `agape@sovereign.nyc`)
- [ ] Domain configured (optional): `agape-sovereign.nyc`

---

## 🔑 Your Firebase Credentials

```
📊 Firebase Console: https://console.firebase.google.com/project/agape-sovereign

Project ID: agape-sovereign
Auth Domain: agape-sovereign.firebaseapp.com
Storage Bucket: agape-sovereign.firebasestorage.app
Messaging Sender ID: 956088455461
App ID: 1:956088455461:web:5d83545efc8961e4904acc
Measurement ID: G-6YG9BGTWDD
```

---

## 📦 Step 1: Clone & Install Dependencies

```bash
# Clone the repository
cd /Users/aarondavid/Documents/GitHub
git clone https://github.com/izrl613/agape-sovereign.git
cd firebase

# Install root dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

**Expected Output:**
```
✓ next@15.x.x
✓ react@19.x.x
✓ firebase@10.x.x
✓ firebase-admin@12.x.x
✓ firebase-functions@5.x.x
```

---

## 🔧 Step 2: Configure Environment Variables

### Create `.env.local`

```bash
# Copy template
cp .env.local.template .env.local

# Edit with your credentials
nano .env.local  # or use your preferred editor
```

### Fill in `.env.local`

```bash
# Firebase Configuration (Already provided)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agape-sovereign.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agape-sovereign
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agape-sovereign.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=956088455461
NEXT_PUBLIC_FIREBASE_APP_ID=1:956088455461:web:5d83545efc8961e4904acc
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6YG9BGTWDD

# Gemini API Key (Get from https://ai.google.dev)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=idin@agape.nyc,agape@sovereign.nyc

# Database Collections
NEXT_PUBLIC_FIRESTORE_COLLECTION_USERS=users
NEXT_PUBLIC_FIRESTORE_COLLECTION_DIFF_SCANS=diff_scans
NEXT_PUBLIC_FIRESTORE_COLLECTION_REPORTS=diff_reports
NEXT_PUBLIC_FIRESTORE_COLLECTION_AUDIT_LOG=audit_logs

# Storage Paths
NEXT_PUBLIC_STORAGE_PDF_PATH=diff_reports/pdfs
NEXT_PUBLIC_STORAGE_BACKUP_PATH=user_backups

# Security
NEXT_PUBLIC_PASSKEY_RP_ID=agape-sovereign.nyc
NEXT_PUBLIC_PASSKEY_RP_NAME=Architect AI - Agape Sovereign
NEXT_PUBLIC_PASSKEY_ORIGIN=https://agape-sovereign.nyc

# DIFF Configuration
NEXT_PUBLIC_DIFF_SCAN_TIMEOUT_MS=300000
NEXT_PUBLIC_DIFF_VECTORS_COUNT=16
NEXT_PUBLIC_REPORT_RETENTION_DAYS=730

# Development (set to false for production)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

---

## 🔐 Step 3: Initialize Firebase CLI

```bash
# Login to Firebase
firebase login

# Your browser will open for authentication
# Select your Google account with Firebase access

# Verify login
firebase projects:list

# Expected output:
# agape-sovereign (agape-sovereign)
```

### Select Project

```bash
firebase use agape-sovereign

# Expected output:
# Now using project agape-sovereign
```

---

## 🛡️ Step 4: Deploy Firestore Security Rules

Firestore rules ensure **zero-knowledge** architecture where users can only access their own data.

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Expected output:
# ✔ firestore.rules uploaded
# ✔ Firestore Rules have been successfully deployed
```

### Verify Rules

```bash
# Check deployed rules
firebase firestore:indexes

# You should see:
# Collection Indexes:
# - None (unless custom indexes needed)
```

---

## ☁️ Step 5: Deploy Cloud Functions

Cloud Functions handle DIFF scanning, PDF generation, and cleanup tasks.

```bash
# Navigate to functions directory
cd functions

# Deploy all functions
npm run deploy

# Or use firebase CLI directly:
firebase deploy --only functions

# Expected output:
# ✔ Function initiateDIFFScan deployed
# ✔ Function generateDIFFReport deployed
# ✔ Function cleanupOldReports deployed
# ✔ Function healthCheck deployed
```

### Verify Function Deployment

```bash
# List deployed functions
firebase functions:list

# Expected output:
# agape-sovereign (us-central1):
#   initiateDIFFScan HTTP Trigger
#   generateDIFFReport HTTP Trigger
#   cleanupOldReports PubSub Trigger
#   healthCheck HTTP Trigger
```

### Test Health Check

```bash
# Get function URL
firebase functions:describe healthCheck

# Call it (example):
curl https://us-central1-agape-sovereign.cloudfunctions.net/healthCheck

# Expected response:
# {
#   "status": "HEALTHY",
#   "timestamp": "2026-05-05T...",
#   "vectors": 16,
#   "functions": [...]
# }
```

---

## 🏗️ Step 6: Build Next.js Application

```bash
# Go back to root
cd ..

# Build for production
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Creating an optimized production build
# Route (pages) Size
# ○ /   42 KB
```

---

## 🚀 Step 7: Deploy to Firebase Hosting

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Expected output:
# ✔ hosting[agape-sovereign]: Release complete
# 
# Project Console: https://console.firebase.google.com/project/agape-sovereign
# Hosting URL: https://agape-sovereign.web.app
```

### Verify Deployment

```bash
# Open in browser
firebase open hosting:site

# Or manually visit:
# https://agape-sovereign.web.app

# Expected: Architect AI login screen with neon gradient border
```

---

## 🎯 Step 8: Complete Deployment

```bash
# Deploy everything at once (if not done individually)
firebase deploy

# Expected output:
# ✔ Deploy complete!
# 
# Project Console: https://console.firebase.google.com/project/agape-sovereign
# Hosting URL: https://agape-sovereign.web.app
```

---

## 📊 Step 9: Verify Everything is Working

### 1. Check Firebase Console

```
https://console.firebase.google.com/project/agape-sovereign
```

Go through each section:

- **Authentication** → Check OAuth providers (Google, Apple)
- **Firestore** → Verify collections initialized
- **Storage** → Check bucket accessible
- **Cloud Functions** → All 4 functions deployed
- **Hosting** → Latest release active

### 2. Test Authentication

1. Visit: https://agape-sovereign.web.app
2. Click "Continue with Google"
3. Select your account
4. Verify login successful
5. Check Firestore for new user document

### 3. Test DIFF Scan

1. Logged in, click "Initiate DIFF Scan"
2. Watch Cloud Functions process
3. Check `diff_scans` collection in Firestore
4. Verify SHA256 hash generated

### 4. Test Report Generation

1. After scan completes, click "Generate DIFF Report"
2. Check Cloud Functions logs: `firebase functions:log`
3. Verify PDF in Firebase Storage
4. Download report and verify content

### 5. Test Admin Portal

1. If logged in as `idin@agape.nyc`, click **⬡ ADMIN** button
2. See infrastructure stats
3. View Firebase services status
4. Check audit trail

---

## 🧪 Local Development (Optional)

### Run Firebase Emulator

```bash
# Start emulator suite
firebase emulators:start

# Expected output:
# ✔ All emulators started, it is now safe to connect your app.
# View Emulator UI at http://localhost:4000
```

### Run Next.js Dev Server (in another terminal)

```bash
# Set emulator flag
export NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# Start dev server
npm run dev

# Visit: http://localhost:3000
```

---

## 🔍 Monitoring & Troubleshooting

### Check Cloud Function Logs

```bash
# View recent logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --follow

# Filter by function
firebase functions:log --function=initiateDIFFScan
```

### Monitor Firestore Usage

```bash
# View Firestore stats
firebase firestore:indexes

# Check quotas (in Firebase Console):
# https://console.firebase.google.com/project/agape-sovereign/settings/usage
```

### Check Hosting Logs

```bash
# View hosting deployment logs
firebase hosting:channel:list

# View all deployments
firebase hosting:releases:list
```

### Common Issues & Fixes

#### ❌ "Cannot find module 'firebase-admin'"
```bash
cd functions
npm install
npm run deploy
```

#### ❌ "Quota exceeded"
- Check current usage: Firebase Console > Settings > Usage
- Free tier limits:
  - 50K Firestore reads/day
  - 20K Firestore writes/day
  - 5GB Storage
  - 2M Cloud Function invocations/month

#### ❌ "Permission denied" on Firestore
- Run: `firebase deploy --only firestore:rules`
- Verify rules deployed correctly

#### ❌ "Passkey not binding"
- Check browser console for WebAuthn errors
- Ensure HTTPS in production
- Test in Chrome/Safari/Edge (best support)

---

## 🔐 Post-Deployment Security Checklist

- [ ] Enable Firebase App Check (production only)
- [ ] Set up custom domain with SSL
- [ ] Configure Content Security Policy (CSP) headers
- [ ] Enable Firestore encryption at rest (default: on)
- [ ] Set up backup retention policy (default: 7 days)
- [ ] Monitor audit logs weekly
- [ ] Rotate API keys every 90 days
- [ ] Enable MFA for Firebase Console access

---

## 📈 Scaling Considerations

### Free Tier Limits
- **Firestore**: 50K reads, 20K writes daily
- **Cloud Functions**: 2M invocations monthly
- **Storage**: 5 GB total
- **Hosting**: Unlimited bandwidth

### Upgrade Path (if needed)
1. Upgrade to **Blaze Pay-as-You-Go** plan
2. Set spending limits ($50/month recommended)
3. Monitor usage dashboard
4. Cost breakdowns per service

### Optimization Tips
- Batch Firestore operations
- Use Cloud Function memcache
- Compress PDF reports
- Implement client-side filtering
- Cache user data with Service Workers

---

## 🎓 Next Steps

1. **Customize Branding**
   - Update favicon (`public/favicon.ico`)
   - Change theme colors (see `NEON` palette in code)
   - Update metadata in `layout.tsx`

2. **Integrate Real Data Sources**
   - Connect to breach databases (HaveIBeenPwned, etc.)
   - Add data broker API integrations
   - Implement social media scraping (API-compliant)

3. **Expand AI Capabilities**
   - Fine-tune Gemini prompts
   - Add custom training data
   - Implement context memory

4. **Add User Features**
   - Email notifications
   - Mobile app (React Native)
   - CLI tool for automation
   - API for third-party integrations

---

## 📞 Support & Resources

### Documentation
- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
- WebAuthn: https://www.w3.org/TR/webauthn-2/
- Gemini API: https://ai.google.dev/docs

### Monitoring
- Firebase Console: https://console.firebase.google.com
- Google Cloud Console: https://console.cloud.google.com
- Cloud Functions Logs: https://console.cloud.google.com/functions

### Contact
📧 **Email**: idin@agape.nyc  
🔗 **Website**: https://agape-sovereign.nyc

---

## ✅ Deployment Complete!

Your **Architect AI** instance is now live and ready to process real-time DIFF scans.

**Live URL**: https://agape-sovereign.web.app  
**Firebase Console**: https://console.firebase.google.com/project/agape-sovereign  
**Admin Portal**: Only for `idin@agape.nyc` & `agape@sovereign.nyc`  

---

**Version**: 1.0.0  
**Last Updated**: May 5, 2026  
**Status**: Production Ready ✅

**Architect AI — Reclaim Your Digital Sovereignty.**
