# Identity Vector Specifications (Revised)

This document defines the 16 identity vectors. Each vector is processed by a Third Party Agent that verifies data via the specified APIs before handing off encrypted packets to Architect AI.

## Global Flow
`User Submission` $\to$ `Third Party Agent` $\to$ `Verification API` $\to$ `Encrypted Handoff` $\to$ `Architect AI`

---

## 1. Communication (Email)
- **Verification APIs**: SendGrid, Mailgun, Google OAuth2, Microsoft Graph.
- **Data**: Email, Provider, Status.

## 2. Social Identity
- **Verification APIs**: X (Twitter) API, LinkedIn API, Meta Graph API (FB/IG), TikTok API.
- **Data**: Platform, Handle, URL.

## 3. Privacy Reclaim
- **Verification APIs**: Plaid, Yodlee, Salt Edge, Tink.
- **Data**: Institution, Account Type, Request Status.

## 4. Government/Legal Identity
- **Verification APIs**: Onfido, Jumio, Persona, ID.me.
- **Data**: ID Type, ID Number, Issuing Country.

## 5. Professional Identity
- **Verification APIs**: Credly, LinkedIn, Accredible, Indeed API.
- **Data**: Job Title, Company, Certification ID.

## 6. Health Identity
- **Verification APIs**: Epic, Cerner, Apple HealthKit, FHIR Standard.
- **Data**: Provider, Record Type, Insurance Policy.

## 7. Educational Identity
- **Verification APIs**: National Student Clearinghouse, Parchment, Digitary.
- **Data**: Institution, Degree, Year.

## 8. Network Identity
- **Verification APIs**: MaxMind, IP-API, Cloudflare Intelligence, WhoisXML.
- **Data**: IP, MAC, Device UUID.

## 9. Cryptographic Identity
- **Verification APIs**: Alchemy, Infura, Etherscan, Solscan, The Graph.
- **Data**: Wallet Address, ENS, Public Key.

## 10. Biometric Identity
- **Verification APIs**: Worldcoin (Orb), Local Secure Enclave (Apple/Android), FaceTec.
- **Data**: Biometric Type, Template Hash.

## 11. Reputation Identity
- **Verification APIs**: Trustpilot, Yelp, Airbnb API, Uber API, Google Reviews.
- **Data**: Platform, Trust Score, Review Count.

## 12. Subscription Identity
- **Verification APIs**: Stripe, PayPal, Recurly, Chargebee.
- **Data**: Service, Tier, Billing ID.

## 13. Location Identity
- **Verification APIs**: Google Maps, USPS, Mapbox, Here API.
- **Data**: Address, Citizenship, residency history.

## 14. Interests/Behavioral Identity
- **Verification APIs**: Google My Activity, Meta Ad Preferences, Amazon Purchase History.
- **Data**: Category, Platform, Preference Level.

## 15. Membership Identity
- **Verification APIs**: IEEE, ACM, National Registries, Org-specific OAuth.
- **Data**: Organization, Role, Member ID.

## 16. Privacy Permissions
- **Verification APIs**: Sovereign Internal Ledger, Hyperledger Fabric.
- **Data**: Entity, Access Level, Expiry.
