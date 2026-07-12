# Identity Vectors (V-01 — V-16)

Agape Sovereign maps a user's digital footprint across **16 discrete identity vectors**. Each vector has a dedicated module, route, scan engine, and Firestore collection.

## Vector Table

| Vector | ID | Module | Route | Pillar |
|---|---|---|---|---|
| Email Breach Scanner | V-01 | EmailModule | `/dashboard/email` | Polymer (DLP) |
| Social Media Footprint | V-02 | SocialModule | `/dashboard/social` | Unosecur (Identity) |
| Device File Scan | V-03 | DeviceModule | `/dashboard/device` | Nymiz (PII) |
| Mobile Security Layer | V-04 | SystemModule | `/dashboard/system` | Unosecur (Identity) |
| Deep Web Exposure | V-05 | DeepWebModule | `/dashboard/deepweb` | PrivacyProctor (Monitor) |
| Data Broker Removal | V-06 | DataBrokerModule | `/dashboard/databroker` | Polymer (DLP) |
| Password Vault Analysis | V-07 | PasswordModule | `/dashboard/password` | Nymiz (PII) |
| Location Data Footprint | V-08 | LocationModule | `/dashboard/location` | Unosecur (Identity) |
| Browser & Cookie Tracker | V-09 | BrowserTrackerModule | `/dashboard/browser` | Polymer (DLP) |
| Medical Data Footprint | V-10 | MedicalModule | `/dashboard/medical` | Nymiz (PII) |
| Voice & Biometric Data | V-11 | BiometricModule | `/dashboard/biometric` | Nymiz (PII) |
| IoT & Smart Device Scan | V-12 | IoTModule | `/dashboard/iot` | Unosecur (Identity) |
| Cloud Storage Exposure | V-13 | CloudModule | `/dashboard/cloud` | Prisma AIRS (AI) |
| Dark Web Monitoring | V-14 | DarkWebModule | `/dashboard/darkweb` | PrivacyProctor (Monitor) |
| Behavioral Profile Analysis | V-15 | BehavioralModule | `/dashboard/behavioral` | Prisma AIRS (AI) |
| Sovereign Erasure Engine | V-16 | ErasureModule | `/dashboard/erasure` | All Pillars |

## Module Component API

All 16 modules are exported from `src/components/DiffModules.tsx` as factory components with uniform props.

Each module renders:
- **Header** — vector ID badge + pillar label + technique tags
- **Scan Panel** — trigger scan, live status indicator
- **Results Grid** — findings with severity badges (CRITICAL / HIGH / MEDIUM / LOW)
- **Export Button** — generates PDF report via `pdfService`

## Status States

| State | Meaning |
|---|---|
| 🔴 NUKED | Exposure confirmed and data fully removed |
| 🟡 KNOXED | Exposure locked/isolated, not fully removed |
| 🟢 MONITORED | Under active watch, no current exposure |
| ⚪ UNSCANNED | Not yet analyzed |
