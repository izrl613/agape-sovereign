# Gatekeeper Service Documentation

## Overview
The Gatekeeper Service is the validation layer for all 16 identity vector modules in the Agape Sovereign Enclave 2026. It ensures all user-entered data passes rigorous checks before being processed by vector agents or Architect AI.

## Core Concepts

### Data Providers
Supported data source providers:
- `manual-entry` - User manually enters data
- `google-oauth` - Google OAuth authenticated data
- `apple-id` - Apple ID authenticated data
- `webauthn-passkey` - WebAuthn device-bound passkeys
- `api-integration` - External API integrated data
- `csv-import` - CSV batch import data

### Gate Decision
Each module's data goes through gatekeeper validation that checks:
1. **Minimum field count** - Module requires at least N fields
2. **Maximum field count** - Module limits to N fields maximum
3. **Required provider** - Specific provider must be selected for the module
4. **Field validity** - Each field passes schema validation

If all checks pass, the gate **approves** and data can be encrypted and handed off to Architect AI. If any check fails, the gate **blocks** entry with a specific reason.

## API

### `gatekeeper.gateData(moduleId, formData, provider)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `moduleId` | `string` | The IVM module ID (e.g., 'email-scanner', 'social-map') |
| `formData` | `Record<string, string>` | Key-value pairs of user-entered data |
| `provider` | `DataProvider` | The data source provider |

**Returns:** `GateDecision` object with:
- `allowed: boolean` - Whether data passed validation
- `reason?: string` - Human-readable rejection reason (if blocked)
- `validatedFields: string[]` - Fields that passed validation
- `encryptedPayload?: string` - AES-256 encrypted data (if allowed)
- `sha256Hash?: string` - SHA-256 hash of validated data (if allowed)

### `gatekeeper.generateGateStatusReport(decisions)`

Returns summary statistics for multiple gate decisions:
- `totalModules: number`
- `allowed: number`
- `blocked: number`
- `providerBreakdown: Record<DataProvider, number>`
- `needsAttention: GateDecision[]`

## Module Configurations

Each of the 16 identity vector modules has specific gate config:

| Module | Min Fields | Max Fields | Required Providers |
|--------|-----------|-----------|-------------------|
| email-scanner | 1 | 4 | manual-entry |
| social-map | 1 | 4 | manual-entry, api-integration |
| device-health | 1 | 4 | webauthn-passkey |
| system-security | 1 | 4 | webauthn-passkey |
| deep-web | 1 | 3 | api-integration |
| broker-removal | 1 | 5 | manual-entry |
| network-vector | 1 | 4 | api-integration |
| cloud-enclave | 1 | 4 | api-integration |
| biometrics | 1 | 3 | webauthn-passkey |
| crypto-assets | 1 | 4 | manual-entry |
| smart-home | 1 | 3 | api-integration |
| metadata-purge | 1 | 2 | manual-entry |
| kernel-health | 1 | 3 | manual-entry |
| bios-integrity | 1 | 3 | manual-entry |
| sovereign-id | 2 | 3 | webauthn-passkey, manual-entry |
| shadow-purge | 1 | 2 | manual-entry |

## Field Validation Rules

Each module has specific field validation:

### email-scanner
- `primaryEmail`: min 5, max 254 chars, email format required
- `backupAliases`: min 5, max 254 chars, email format required
- `compromisedPasswords`: min 8, max 128 chars, password strength required
- `forwardingRules`: min 3, max 128 chars

### biometrics
- `webauthnCredID`: must start with 'cred-' prefix
- `faceIdHash`: must be exactly 40 characters (SHA-256)
- `secureEnclaveID`: min 5, max 64 chars

### crypto-assets
- `evmAddress`: must be 42 characters (0x + 40 hex)
- `btcAddress`: must be 26-66 characters
- `solAddress`: must be 44 characters
- `seedPhraseHash`: must be exactly 40 characters (SHA-256)

### sovereign-id
- `decentralizedID`: min 10, max 256 chars
- `passportIDHash`: must be exactly 40 characters (SHA-256)
- `ssnHashSeal`: must be exactly 40 characters (SHA-256)

## Security Model

### Data Flow
1. User enters data in RichVectorInputForm or EnhancedModuleSplashScreen
2. Gatekeeper validates formData against module schema
3. If approved: SHA-256 hash generated + AES-256-GCM encrypted
4. If blocked: User sees rejection reason, must fix inputs
5. Only approved, encrypted data proceeds to Architect AI

### Encryption
- Uses `SovereignEncryption` class with AES-256-GCM
- Key derived from: `gatekeeper-{moduleId}-{provider}`
- Data never in plaintext after gatekeeper validation
- SHA-256 hash provides integrity verification

### Offline-First
- All validation occurs client-side
- No external API calls required for gatekeeper
- Works completely offline
- Provider selection enables/disables different field sets

## Integration Points

### Frontend Components
- `RichVectorInputForm` - Uses gatekeeper before `onSaveAndHandoff` callback
- `ModuleSplashScreen` - Gate validation on auto-dismiss, passes result to callback
- `EnhancedModuleSplashScreen` - Full interactive gatekeeper integration

### Backend API
The existing `/api/process-identity-vectors` endpoint should be updated to:
1. Accept gate decision status from client
2. Verify sha256Hash matches received data
3. Only process approved modules
4. Reject modules that failed gatekeeper validation

### Example Backend Integration
```typescript
// Pseudo-code for API route update
app.post('/api/process-identity-vectors', async (req, res) => {
  const { sha256Id, vectors, gateDecision } = req.body;
  
  // Verify gate approval
  if (!gateDecision?.allowed) {
    return res.status(400).json({
      status: 'FAILED',
      error: 'Gatekeeper validation failed: ' + gateDecision.reason
    });
  }
  
  // Verify SHA-256 integrity
  if (vectors.sha256Hash !== sha256Id) {
    return res.status(400).json({
      status: 'FAILED',
      error: 'SHA-256 integrity mismatch'
    });
  }
  
  // Proceed with normal processing...
});
```

## Provider-Specific Rules

### webauthn-passkey
- `webauthnCredID`: must match `/^cred-.+/` pattern
- `faceIdHash`: exactly 40 characters
- `secureEnclaveID`: min 5, max 64 characters

### google-oauth
- `socialHandles`: must start with `@`
- Other fields: standard length validation

### api-integration
- `breachQueryTerms`: min 3 characters
- `darknetHandles`: min 1, max 32 characters
- Standard length validation for other fields

## Error Handling

### Common Rejection Reasons
- `"Minimum N fields required, got M"` - Not enough data entered
- `"Maximum N fields allowed, got M"` - Too much data entered
- `"Provider X not configured for this module"` - Wrong provider selected
- `"Invalid email format"` - Email field format incorrect
- `"Password must be at least 8 characters"` - Password strength insufficient
- `"Expected a 40-character SHA-256 hash"` - Hash format incorrect
- `"Invalid WebAuthn credential ID format"` - WebAuthn ID format wrong

## Best Practices

1. **Always check `gateDecision.allowed`** before proceeding to Architect AI handoff
2. **Display rejection reason** to user when gate blocks entry
3. **Use appropriate provider** for each module type
4. **Minimum field requirements** must be met for each module
5. **SHA-256 hashes** provide data integrity verification
6. **Encrypted payloads** prevent plaintext data exposure
7. **Gate status reporting** helps identify which modules need user attention

## Migration Notes

### From Previous System
- Previous system had no data validation gate
- New system enforces minimum/field counts and provider requirements
- All existing data must pass gatekeeper validation on next scan
- SHA-256 hashes provide backward compatibility with existing hashes

### Breaking Changes
- Forms will now gate-validate before submission
- Handoff to Architect AI blocked until gate approves
- Provider selection affects which fields are available
- Existing unvalidated data will be blocked until user re-enters/re-validates