# AI Transparency Disclosure

**Standard**: EU AI Act 2026, NIST AI RMF  
**App**: sovereign.nyc — AI Digital Identity Sovereign Restoration  
**Last Updated**: 2026-07-11  

---

## What AI Is Used

Agape Sovereign uses AI in the following ways:

### 1. Sovereign Score
An AI-assisted scoring model that assesses the user’s digital identity exposure across monitored email addresses and data sources. The score is:
- **User-controlled**: users choose what data sources to include.
- **Transparent**: score components are shown in the report UI.
- **Non-binding**: the score is advisory only and does not make automated legal or financial decisions.

### 2. DIFF Scan Analysis
AI assists in classifying findings as:
- **NUKED** — data confirmed removed/suppressed.
- **KNOXED** — data secured/access-controlled.
- **MONITORED** — data being tracked for changes.

Classifications are surfaced to the user and can be manually overridden.

### 3. Gemma On-Device AI (optional)
Users may optionally enable on-device Gemma inference for local analysis. This runs fully on-device; no data leaves the device when this mode is active.

---

## What AI Does NOT Do

- AI does **not** make automated decisions affecting legal rights, credit, employment, or insurance.
- AI does **not** share user data with third-party AI training pipelines.
- AI does **not** retain conversation history beyond the session unless the user explicitly saves it.

---

## Human Oversight

All AI-assisted findings are reviewed by the user before any action is taken. No AI output results in automatic action on the user’s data.

---

## Contact

Questions about AI use: idin@agape.nyc
