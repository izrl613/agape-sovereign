# ⚡ Architect AI — Quick Start (5 Minutes)

## Get Up & Running Fast

### Prerequisites
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Agape Sovereign Firebase project already created

---

## 🚀 Quick Deployment (Copy & Paste)

### 1. Clone & Install
```bash
cd /Users/aarondavid/Documents/GitHub/firebase
npm install
cd functions && npm install && cd ..
```

### 2. Login to Firebase
```bash
firebase login
firebase use agape-sovereign
```

### 3. Create `.env.local`
```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAKooAY5zYjxsCrcSAXjm--a77GQ2E4u9g
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agape-sovereign.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agape-sovereign
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agape-sovereign.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=956088455461
NEXT_PUBLIC_FIREBASE_APP_ID=1:956088455461:web:5d83545efc8961e4904acc
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6YG9BGTWDD

NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
NEXT_PUBLIC_ADMIN_EMAILS=idin@agape.nyc,agape@sovereign.nyc
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
EOF
```

### 4. Deploy Everything
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Build & deploy Next.js
npm run build
firebase deploy --only hosting
```

### 5. Done! 🎉
```
Live URL: https://agape-sovereign.web.app
Admin Panel: https://agape-sovereign.web.app (if logged in as admin)
```

---

## 🧪 Local Development (5 min)

```bash
# Terminal 1: Start Firebase Emulator
firebase emulators:start

# Terminal 2: Start Next.js
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev

# Visit: http://localhost:3000
```

---

## 📊 Verify Deployment

```bash
# Check all services deployed
firebase deploy --only firestore:rules,functions,hosting

# View functions
firebase functions:list

# Open console
firebase open console

# Open hosting
firebase open hosting:site
```

---

## 🔑 First Steps

1. Visit **https://agape-sovereign.web.app**
2. Click **"Continue with Google"**
3. Bind your **universal passkey**
4. Create your **user profile**
5. Start your first **DIFF scan**
6. Generate your first **PDF report**

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `lib/firebase.ts` | Firebase initialization |
| `functions/index.js` | Cloud Functions (DIFF scanning, PDF) |
| `firestore.rules` | Security rules (user isolation) |
| `storage.rules` | Storage access controls |
| `src/components/architect-ai-app.tsx` | Main React component |
| `.env.local` | Configuration (never commit!) |

---

## 🆘 Troubleshooting

### "Module not found: firebase"
```bash
npm install firebase firebase-admin
```

### "Quota exceeded"
- Free tier limit: 50K Firestore reads/day
- Check: `firebase firestore:indexes`

### "Authentication failed"
- Verify `.env.local` has correct Firebase credentials
- Check OAuth consent screen in Firebase Console

### "Passkey not working"
- Ensure HTTPS in production
- Test in Chrome/Safari/Edge (best support)
- Check browser console for WebAuthn errors

---

## 📞 Need Help?

- 📧 Email: idin@agape.nyc
- 🔗 Docs: See `ARCHITECT_AI_README.md`
- 🏗️ Integration: See `INTEGRATION_GUIDE.md`
- 🚀 Deployment: See `DEPLOYMENT_GUIDE.md`

---

**Architect AI — Reclaim Your Digital Sovereignty**

**Status**: ✅ Production Ready
