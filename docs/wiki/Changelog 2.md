# Changelog — Agape Sovereign V2

> All notable changes to this project are documented in this file.
> Format follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [V2.1.0] — 2026-09-24 · Live 16-Vector Architecture

### Added
- 16 Canonical Identity Vectors fully implemented in scanService.ts
  - V-01 Email Breach Scanner (HIBP + XposedOrNot k-anonymity)
  - V-02 Social Media Footprint (GitHub, username enumeration)
  - V-03 Device File Scan (hardware profiling, entropy analysis)
  - V-04 Mobile Security Layer (WebAuthn/Passkey biometric status)
  - V-05 Deep Web Exposure (pastebin signature monitoring)
  - V-06 Data Broker Removal (CCPA/GDPR opt-out automation)
  - V-07 Password Vault Analysis (SHA-1 k-anonymity, HIBP range API)
  - V-08 Location Data Footprint (Geolocation API, EXIF GPS scrubbing)
  - V-09 Browser & Cookie Tracker (Canvas2D hash, WebGL renderer, AudioContext entropy)
  - V-10 Financial Identity Exposure (Luhn checksum, credit freeze guidance)
  - V-11 Medical Data Footprint (HIPAA PHI safeguards)
  - V-12 Voice & Biometric Data (Web Audio API acoustic entropy)
  - V-13 IoT & Smart Device Scan (WebRTC LAN IP leak detection)
  - V-14 Cloud Storage Exposure (S3/Drive/iCloud permission audit)
  - V-15 Dark Web Monitoring (Tor feed, credential surveillance)
  - V-16 Behavioral Profile Analysis (tracking pixel neutralization)
- SplashEntry.tsx: SHA-256 live hash + Shannon entropy per keystroke
- Dashboard.tsx: Live DIFF Scan trigger, real-time Firestore onSnapshot
- Security fixes: npm audit fix applied -- 0 vulnerabilities
- Firebase SDK v6+ import paths corrected
- Git identity configured: agape@sovereign.nyc
- Default local AI model: nemotron-3-nano:4b-bf16 via Ollama

### Fixed
- Firebase Functions import path errors (SDK 6.0.0+ breaking change)
- Rebase conflict in scanService.ts preserved V2 implementation
- node_modules install restored; 0 vulnerabilities after audit fix

---

## [V2.0.0] — 2026-09-22 · Canonical Architecture Foundation

### Added
- Zero-knowledge encryption pipeline (encryptClientSide, generateSHA256)
- Dual-backend local AI (LMStudio port 1234, Ollama port 11434 fallback)
- WebAuthn/Passkey dual authentication
- Zero-Trust Firestore security rules
- ScanContext global findings state
- EncryptedFooter tamper-evident SHA-256 seal
- Sovereign Score computation
- DiffModule generic 16-vector wrapper
- Complete neon glassmorphism UI (Orbitron, Rajdhani, Share Tech Mono)

---

## [V1.0.0] — 2026-09 · Initial PWA Foundation

- Firebase Hosting + Functions scaffold
- React + Vite + TypeScript
- Firebase Auth (Google Sign-In)
- Basic Firestore integration
