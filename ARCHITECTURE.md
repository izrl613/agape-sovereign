# Agape Sovereign Architecture

## Core Principles

1. **Privacy-First**: All data encrypted at rest and in transit
2. **Self-Sovereign**: User controls their identity and data
3. **Offline-First**: LLM operations work without internet
4. **Dual Auth**: Passkey WebAuthn + Google OAuth for maximum security

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agape Sovereign PWA                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Client     │  │   Server     │  │   LLM Engine │      │
│  │  (React)     │  │  (API)       │  │  (Gemma 4)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────┴─────────────────┴─────────────────┴────────┐     │
│  │              Authentication Layer                  │     │
│  │  ┌──────────────┐  ┌──────────────┐              │     │
│  │  │  WebAuthn    │  │  Google OAuth│              │     │
│  │  │  (Passkeys)  │  │  (OAuth2)    │              │     │
│  │  └──────────────┘  └──────────────┘              │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Encryption Layer                    │  │
│  │  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │  AES-256     │  │  SHA256ID    │                 │  │
│  │  │  (At Rest)   │  │  (Retention) │                 │  │
│  │  └──────────────┘  └──────────────┘                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Storage Layer                            │  │
│  │  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │   Firestore  │  │   Local DB   │                 │  │
│  │  │  (Cloud)     │  │  (IndexedDB) │                 │  │
│  │  └──────────────┘  └──────────────┘                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 16 Identity Vector Modules (IVM)

Each IVM represents a distinct aspect of user identity with its own gate agent:

1. **Identity Core** - Basic profile and metadata
2. **Biometric Vault** - Passkey/WebAuthn credentials
3. **Communication** - Contact and messaging preferences
4. **Financial** - Payment and transaction data
5. **Health** - Medical and wellness information
6. **Legal** - Documents and compliance data
7. **Professional** - Work history and credentials
8. **Social** - Network and relationship data
9. **Content** - User-generated content
10. **Preferences** - Settings and customization
11. **Security** - Authentication logs and alerts
12. **Location** - Geolocation and access history
13. **Device** - Hardware and software fingerprints
14. **Session** - Active session management
15. **Audit** - System audit trails
16. **Backup** - Recovery and export operations

### Gate Agent Pattern

```typescript
interface IVM {
  id: string;
  name: string;
  gateAgent: GateAgent;
  encryption: EncryptionConfig;
  retention: RetentionPolicy;
  
  gateAgent: {
    authenticate: (request: AuthRequest) => Promise<boolean>;
    authorize: (request: AuthRequest) => Promise<boolean>;
    audit: (action: AuditAction) => Promise<void>;
  };
}
```

## Encryption Strategy

### Dual Encryption Approach

```typescript
// Layer 1: SHA256ID for 26-month retention
const sha256id = async (data: string): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
};

// Layer 2: AES-256 for at-rest encryption
const aesEncrypt = async (data: string, key: CryptoKey): Promise<string> => {
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    plaintext
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};
```

## Offline LLM Integration

```typescript
// Local Gemma 4:12B via Ollama
const offlineLLM = {
  initialize: async () => {
    await fetch('/api/ollama/init');
  },
  chat: async (prompt: string, context?: Context) => {
    const response = await fetch('/api/ollama/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, context })
    });
    return response.json();
  }
};
```

## Export Options

### KNOX (Encrypted Archive)
```typescript
interface KNOXExport {
  format: 'encrypted-archive';
  encryption: 'AES-256';
  compression: 'zstd';
  passwordProtected: boolean;
  includes: string[];
}
```

### NUKE (Selective Deletion)
```typescript
interface NUKERequest {
  modules: string[]; // IVM IDs to delete
  permanent: boolean; // bypass 26-month retention
  confirm: boolean;
}
```

## Deployment Targets

### sovereign.nyc
```yaml
# Cloudflare Workers + KV Storage
env:
  NODE_ENV: production
  FIREBASE_API_KEY: ${FIREBASE_API_KEY}
  GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
```

### Firebase Hosting
```yaml
# Firebase functions + Firestore
runtime: nodejs18
env:
  NODE_ENV: production
```

### GCP App Hosting
```yaml
# GCP managed deployment
runtime: nodejs18
region: us-central1
```
