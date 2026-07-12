# OAuth Verification

← [Home](Home.md) · [Authentication](Authentication.md)

This page documents the **Google OAuth consent screen verification** status and requirements for Agape Sovereign AI.

OAuth verification is required because the app uses Google Sign-In (Firebase Auth) and requests user profile data. Without verification, users see an "unverified app" warning.

---

## Verification Status

| Item | Status | Detail |
|------|--------|--------|
| OAuth consent screen | Submitted for verification | Pending Google review |
| App domain | Verified | `sovereign.nyc` |
| Privacy Policy URL | Live | https://sovereign.nyc/privacy |
| Terms of Service URL | Live | https://sovereign.nyc/terms |
| App logo | Uploaded | `/agape-logo-oauth.png` (120×120 px, PNG) |
| Authorized domains | Configured | `sovereign.nyc`, `agape-sovereign.web.app` |

---

## Required Assets

### Privacy Policy

**URL:** https://sovereign.nyc/privacy

The Privacy Policy must cover:
- What data is collected (email, profile, identity vectors)
- How data is used (identity risk analysis, Shield Platform remediations)
- Data retention and deletion policies
- Third-party data sharing (Shield Platform partners: Polymer, Unosecur, Nymiz, PrivacyProctor, Prisma AIRS)
- User rights (GDPR: access, rectification, erasure, portability; CCPA: know, delete, opt-out)
- Contact information: privacy@agape.nyc

### Terms of Service

**URL:** https://sovereign.nyc/terms

The Terms of Service must cover:
- Acceptable use of the platform
- Subscription terms (if applicable)
- Limitation of liability
- Dispute resolution
- Termination conditions

### App Logo

**Path:** `/agape-logo-oauth.png` (served from Firebase Hosting at `https://sovereign.nyc/agape-logo-oauth.png`)

Google OAuth requirements for the logo:
- Format: PNG with transparent background
- Size: 120×120 px minimum, 1 MB maximum
- No text in the logo (Google's policy)
- Must accurately represent the application

---

## OAuth Consent Screen Configuration

### Scopes Requested

| Scope | Sensitivity | Justification |
|-------|-------------|---------------|
| `openid` | Non-sensitive | Required for OIDC identity |
| `email` | Non-sensitive | Display user email in profile |
| `profile` | Non-sensitive | Display name and avatar |

All scopes are non-sensitive (no sensitive or restricted scopes). This means the app only needs domain verification, not a full security assessment.

### Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com) → **Authentication** → **Sign-in method** → **Google**
2. Ensure the Google provider is enabled
3. The OAuth consent screen is configured at: [Google Cloud Console → APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)

### GCP Project Configuration

```
Project: agape-sovereign
Project Number: (from GCP console)
OAuth Client ID: (from GCP console → Credentials)
Authorized JavaScript origins:
  - https://sovereign.nyc
  - https://agape-sovereign.web.app
  - http://localhost:5173 (dev only)
Authorized redirect URIs:
  - https://sovereign.nyc/__/auth/handler
  - https://agape-sovereign.web.app/__/auth/handler
```

---

## Verification Checklist

Before submitting or re-submitting for verification:

- [ ] Privacy Policy is live at https://sovereign.nyc/privacy
- [ ] Terms of Service is live at https://sovereign.nyc/terms
- [ ] Logo is live at https://sovereign.nyc/agape-logo-oauth.png (120×120 PNG)
- [ ] `sovereign.nyc` is verified in Google Search Console
- [ ] All authorized domains are added in OAuth consent screen
- [ ] Only required scopes are listed (no over-requesting)
- [ ] App description clearly explains the use of Google user data
- [ ] Contact email is set to `idin@agape.nyc`
- [ ] Developer contact email is set in GCP project

---

## Handling the Unverified App Warning

Until verification is complete, users who sign in via Google will see:

> **This app isn't verified**
> This app hasn't been verified by Google yet. Only proceed if you know and trust the developer.

Users can still proceed by clicking **Advanced → Go to sovereign.nyc (unsafe)**.

To minimize friction during the verification period:
- Passkey authentication is available as an alternative and does not trigger this warning
- Internal/beta users can be added as **Test Users** in the OAuth consent screen, bypassing the warning

### Adding Test Users

1. GCP Console → APIs & Services → OAuth consent screen
2. Scroll to **Test users** section
3. Add email addresses that should bypass the warning
4. Up to 100 test users allowed per app

---

## Google OAuth Verification — Submission Steps

1. Complete all checklist items above
2. GCP Console → APIs & Services → OAuth consent screen → **Submit for verification**
3. Fill out the verification form:
   - Explain why each scope is needed
   - Provide demo video or written walkthrough showing how user data is used
   - Confirm that the app complies with Google's OAuth policies
4. Google review typically takes **3–5 business days** for non-sensitive scope apps
5. You will receive an email confirmation at the developer contact address

---

## Related Pages

- [Authentication](Authentication.md)
- [Deployment](Deployment.md)
- [Home](Home.md)
