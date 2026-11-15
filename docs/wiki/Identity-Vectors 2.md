# Identity Vectors — Canonical 16-Vector Framework

> Agape Sovereign V2 — All vectors are real, live, production-grade. No mock data.

## Overview

The Agape Sovereign protocol enforces identity privacy through 16 canonical vectors,
each representing a distinct attack surface in the modern digital identity landscape.

```
SOVEREIGN IDENTITY SHIELD — 16-VECTOR MATRIX
V-01  Email Breach     V-09  Browser Tracker
V-02  Social Footprint V-10  Financial Surface
V-03  Device Scan      V-11  Medical PHI
V-04  Mobile Security  V-12  Voice/Biometric
V-05  Deep Web         V-13  IoT/Smart Device
V-06  Data Broker      V-14  Cloud Storage
V-07  Password Vault   V-15  Dark Web
V-08  Location/EXIF    V-16  Behavioral Profile
```

---

## Vector Specifications

### V-01 Email Breach Scanner
- Technology: HIBP Range API + XposedOrNot API
- Method: Zero-knowledge SHA-256 prefix query; email never transmitted in full
- Output: Breach count, source names, exposure date

### V-02 Social Media Footprint
- Technology: GitHub API, username enumeration heuristics
- Method: Public handle correlation, repo count, follower graph

### V-03 Device File Scan
- Technology: navigator.hardwareConcurrency, navigator.deviceMemory
- Method: Hardware entropy fingerprint, memory profile analysis

### V-04 Mobile Security Layer
- Technology: WebAuthn API (navigator.credentials.get)
- Method: Passkey enrollment status, hardware authenticator probe
- Output: Biometric enclave status, FIDO2 compliance rating

### V-05 Deep Web Exposure
- Technology: Pastebin pattern monitoring, paste signature heuristics
- Method: Unindexed content hash matching

### V-06 Data Broker Removal
- Technology: CCPA/GDPR removal request automation
- Brokers: Acxiom, LexisNexis, Whitepages, Radaris, Spokeo, BeenVerified

### V-07 Password Vault Analysis
- Technology: HIBP Pwned Passwords Range API (SHA-1 k-anonymity)
- Method: First 5 chars of SHA-1 sent; suffix matched locally
- Note: Password NEVER leaves the device

### V-08 Location Data Footprint
- Technology: navigator.geolocation, EXIF GPS metadata parser
- Method: Permission state audit, GPS field extraction from uploaded media

### V-09 Browser & Cookie Tracker
- Technology: Canvas 2D API, WebGL UNMASKED_RENDERER_WEBGL, Web Audio API
- Method: Rendering hash, GPU fingerprint, AudioContext oscillator entropy

### V-10 Financial Identity Exposure
- Technology: Luhn algorithm, credit bureau opt-out guidance
- Method: Card number checksum validation

### V-11 Medical Data Footprint
- Technology: HIPAA PHI safeguards, healthcare portal SSO audit
- Method: PHI exposure analysis

### V-12 Voice & Biometric Data
- Technology: Web Audio API (getUserMedia, AudioContext, AnalyserNode)
- Method: Acoustic frequency spectrum, sample entropy analysis

### V-13 IoT & Smart Device Scan
- Technology: WebRTC STUN (Google/Cloudflare), RTCPeerConnection
- Method: LAN IP leak detection (192.168.x.x, 10.x.x.x, 172.16.x.x)

### V-14 Cloud Storage Exposure
- Technology: S3, Google Drive, iCloud permission audit heuristics
- Method: Bucket permission policy analysis

### V-15 Dark Web Monitoring
- Technology: Darknet credential index surveillance
- Method: Compromised identifier stream, Tor feed pattern matching

### V-16 Behavioral Profile Analysis
- Technology: Tracking pixel detection, demographic persona analysis
- Method: Algorithmic profile obfuscation, tracker neutralization

---

## Finding Status Reference

| Status    | Symbol | Meaning |
|-----------|--------|---------|
| NUKED     | Fire   | Data removed from source; exposure eliminated |
| KNOXED    | Shield | Data locked behind zero-knowledge encryption |
| MONITORED | Eye    | Exposure detected; active surveillance enabled |

---

## Implementation Files

| File | Role |
|------|------|
| src/services/scanService.ts | All 16 vector logic, finding CRUD |
| src/components/SplashEntry.tsx | Interactive 16-step onboarding |
| src/components/Dashboard.tsx | Live DIFF Scan trigger + findings display |
| src/components/DiffModules.tsx | Per-module deep scan UI |
| src/utils/crypto.ts | Zero-knowledge encryption primitives |
