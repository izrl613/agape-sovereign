# System Architecture: Sovereign Digital Identity

## Overview
The Sovereign Digital Identity system allows users to build a verified, encrypted digital identity composed of 16 "Identity Vectors". The system focuses on user sovereignty, utilizing Passkeys for authentication and a decentralized agent architecture for data handling.

## Component Diagram (Logical)

`User` $\to$ `Frontend (sovereign.nyc)` $\to$ `Module Agents (1-16)` $\to$ `Architect AI (Backend)` $\to$ `Verified PDF Report`

## Detailed Component Breakdown

### 1. Frontend (React/Next.js)
- **Passkey Integration**: Uses WebAuthn for registration and verification.
- **Module Interfaces**: 16 interactive modules with splash screens and multi-account support.
- **Live Data Submission**: Interactive forms that trigger Module Agents.

### 2. Module Agents (16 Independent Agents)
- **Data Collection**: Each agent is specialized for one identity vector.
- **Encryption**: Uses client-side or agent-side encryption (AES-256) before handoff.
- **Verification**: Calls third-party APIs (e.g., Plaid, Onfido) to verify submitted data.
- **Handoff**: Sends encrypted data and verification tokens to Architect AI.

### 3. Architect AI (Backend Core)
- **Data Aggregation**: Collects encrypted packets from the 16 agents.
- **Verification Synthesis**: Cross-references verification tokens to ensure identity consistency.
- **PDF Engine**: Generates the final Sovereign Identity Report.
- **Passkey Gate**: Only releases the final PDF after a successful Passkey verification.

### 4. Knowledge Layer (MCP Storage Server)
- **Offline Model**: Hosts `qwen3-vl:4b` for local, private inference.
- **Domain**: Expert in privacy, security, digital identity, and `sovereign.nyc` documentation.
- **Interface**: Accessible via MCP tool calls from the frontend.

## Data Flow: The Identity Journey

1. **Onboarding**: User registers a Passkey on `sovereign.nyc`.
2. **Vectorization**: 
    - User enters Module 1 (Email).
    - Splash screen explains the need.
    - User submits multiple emails.
    - `email-agent` verifies them via API $\to$ Encrypts $\to$ Handoff to Architect AI.
    - (Repeat for Modules 2-16).
3. **Aggregation**: Architect AI assembles the encrypted identity vectors.
4. **Finalization**: 
    - User is prompted to verify the report.
    - User provides Passkey.
    - Architect AI decrypts (or signs) and generates the PDF Report.
5. **Q&A**: User asks the Qwen3-VL model about the privacy implications of their report.
