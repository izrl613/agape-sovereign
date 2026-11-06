# Architect AI — Firestore Schema

## Conventions

- Root user namespace: `users/{uid}`; `uid` must equal Firebase Authentication UID.
- Document IDs are opaque IDs (Firestore auto IDs or UUIDs), never email addresses.
- Store timestamps as Firestore `Timestamp`; store normalized enums in uppercase.
- Store only metadata and minimized evidence. Do not persist full mailbox contents, passwords, OAuth refresh tokens, or unrestricted device files.
- Fields marked **server-owned** are written only by trusted Cloud Functions/Admin SDK.
- Every collection requires a retention/deletion policy.

## Collection layout

```text
users/{uid}
  profile/private
  preferences/default
  sources/{sourceId}
  devices/{deviceId}
  scans/{scanId}
  findings/{findingId}
  remediation/{remediationId}
  conversations/{conversationId}
    messages/{messageId}
  reports/{reportId}
  auditEvents/{eventId}
  notificationSettings/default

system/health
system/featureFlags/{flagId}
adminMetrics/{metricId}
```

## Documents

### `users/{uid}` — account root

| Field | Type | Ownership |
|---|---|---|
| createdAt, updatedAt | Timestamp | server |
| accountStatus | `ACTIVE` / `DELETION_PENDING` / `DISABLED` | server |
| schemaVersion | number | server |

Avoid duplicating authentication email or provider tokens here.

### `users/{uid}/profile/private`

| Field | Type | Notes |
|---|---|---|
| displayName | string | Optional display label |
| locale, timezone | string | Presentation preferences |
| createdAt, updatedAt | Timestamp | server timestamps |
| consentVersion | string | Version of accepted disclosure |
| consentUpdatedAt | Timestamp | Consent record time |

### `users/{uid}/preferences/default`

Theme, report format, notification preferences, scan cadence, and AI personalization settings. No security authority is derived from client-editable preferences.

### `users/{uid}/sources/{sourceId}`

| Field | Type | Notes |
|---|---|---|
| provider | string | e.g. GOOGLE, APPLE, USER_UPLOAD |
| category | string | EMAIL, SOCIAL, CLOUD_DRIVE, DEVICE |
| displayLabel | string | Non-secret label |
| status | string | CONNECTED, PAUSED, REVOKED, ERROR |
| grantedScopes | string[] | Exact approved scopes |
| connectedAt, lastVerifiedAt | Timestamp | |
| lastScanAt | Timestamp | nullable |
| tokenReference | string | **Server-only reference**, never token value |
| createdAt, updatedAt | Timestamp | server |

OAuth secrets belong in Secret Manager or a dedicated server-only credential store, not in Firestore documents readable by the client.

### `users/{uid}/devices/{deviceId}`

Device nickname, platform, app version, passkey enrollment metadata, lastSeenAt, and user-approved posture checks. Never collect device secrets. Passkey public-key credentials and challenge state should be handled by the existing trusted WebAuthn service, not made client-readable.

### `users/{uid}/scans/{scanId}`

| Field | Type | Notes |
|---|---|---|
| sourceId | string | source document ID |
| category | string | source category |
| status | string | QUEUED, RUNNING, COMPLETE, PARTIAL, FAILED, CANCELLED |
| requestedAt, startedAt, completedAt | Timestamp | server |
| coverage | map | scanned/available/unsupported counts |
| findingCount | number | server |
| errorCode | string | sanitized code only |
| scannerVersion | string | reproducibility |
| requestedBy | string | uid |
| idempotencyKey | string | server-validated |

### `users/{uid}/findings/{findingId}`

| Field | Type | Notes |
|---|---|---|
| scanId, sourceId | string | provenance |
| category | string | BREACH, PUBLIC_PROFILE, DATA_BROKER, FILE_METADATA, DEVICE_POSTURE, CREDENTIAL_HYGIENE |
| title, summary | string | sanitized, bounded |
| severity | string | INFO, LOW, MEDIUM, HIGH, CRITICAL |
| confidence | number | 0–1 |
| status | string | state model in README |
| evidence | map | minimal reference, source URL/domain, observedAt, hash; avoid raw secrets |
| recommendedActions | array | structured, non-executable guidance |
| detectedAt, updatedAt | Timestamp | |
| verifiedAt | Timestamp | nullable |
| verificationMethod | string | API_CONFIRMATION, MANUAL_ATTESTATION, CONTROL_CHECK |
| scoring | map | version and weighted components |

Client may read findings and submit a narrowly validated user status/feedback action only if the implementation supports it. Server owns evidence, severity, confidence, verification, and score fields.

### `users/{uid}/remediation/{remediationId}`

Finding ID, action type, requested state, provider, status, confirmation timestamp, verification evidence reference, and actor UID. Server controls state transitions and provider calls. Require explicit user confirmation before external removal or account changes.

### `users/{uid}/conversations/{conversationId}` and `messages/{messageId}`

Conversation metadata: createdAt, updatedAt, title, contextScope. Message: role, redacted content, createdAt, model ID, safety metadata, and referenced finding IDs. Never include access tokens or raw secret values. Server validates role and rate limits; model output is untrusted text, not an executable instruction.

### `users/{uid}/reports/{reportId}`

Status, createdAt, completedAt, storagePath, contentType, sizeBytes, snapshotAt, schemaVersion, scoringVersion, and coverage summary. Storage path must be exactly under the owning user's directory. Server writes report metadata and file.

### `users/{uid}/auditEvents/{eventId}`

Append-only server records: eventType, actorUid, resourceType, resourceId, occurredAt, outcome, requestId, and sanitized metadata. No sensitive payloads.

### `adminMetrics/{metricId}` and `system/health`

Aggregated operational metrics only. Restrict reads to a server-issued `admin: true` custom claim. Never expose user-level content or raw scan evidence through admin dashboards.

## Index suggestions

Create composite indexes only when query patterns require them. Likely candidates:
- scans: `status ASC, requestedAt DESC`
- findings: `status ASC, severity DESC, detectedAt DESC`
- findings: `sourceId ASC, detectedAt DESC`
- reports: `createdAt DESC`
- auditEvents: `occurredAt DESC`

## Query patterns

Always query within `users/{uid}` for user-owned data. Do not build cross-user collection-group queries for user content. Admin analytics should consume separately aggregated, minimized metrics.

## Example finding

```json
{
  "scanId": "scan_opaque",
  "sourceId": "source_opaque",
  "category": "PUBLIC_PROFILE",
  "title": "Public profile exposes contact details",
  "summary": "A public profile page appears to expose a contact field.",
  "severity": "MEDIUM",
  "confidence": 0.92,
  "status": "ACTION_REQUIRED",
  "evidence": {
    "sourceDomain": "example.invalid",
    "observedAt": "Firestore Timestamp",
    "evidenceHash": "sha256:...",
    "redacted": true
  },
  "recommendedActions": [
    { "type": "REVIEW_PRIVACY_SETTINGS", "requiresConfirmation": false }
  ],
  "scoring": { "algorithmVersion": "1.0", "contribution": 8 }
}
```
