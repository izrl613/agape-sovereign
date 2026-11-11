# Sovereign Automation MCP Server

A deliberately **blind** MCP server for the secure automation layer.

It does **not** run scans over raw data. It:

1. Serves canonical metadata for the 16 identity vectors.
2. Recomputes SHA-256 receipts over redacted finding bodies.
3. Validates envelope metadata (cipher/KDF/iterations) for downgrade attacks.
4. Returns fail-closed remediation plans (`willExecute: false`).

> Plaintext identity data and key material must never be sent here. The server
> rejects any payload containing `passkey`, `recovery`, `dek`, `ssn`,
> `password`, `private_key`, `api_key`, `secret`, `mnemonic`, or `seed`.

## Run

```bash
cd mcp_server/automation
python3 -m pip install -r requirements.txt   # optional (PyJWT only)
MCP_API_KEY="$(openssl rand -hex 32)" python3 server.py
```

Local development without auth:

```bash
MCP_REQUIRE_AUTH=false python3 server.py
```

## Tools

| Tool | Purpose |
|------|---------|
| `sovereign_health` | Health + machine-readable security policy |
| `list_identity_vectors` | Canonical 16-vector metadata |
| `verify_receipt` | Recompute SHA-256 over `{ receipt, body }` |
| `get_remediation_plan` | Fail-closed plan for NUKED vectors |
| `verify_envelope_metadata` | Reject weak cipher/KDF/iterations |

## Example

```bash
curl -s http://127.0.0.1:8091/health | jq

curl -s http://127.0.0.1:8091/ \
  -H "X-API-Key: $MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_identity_vectors","arguments":{}}}' | jq
```

Verify a receipt produced by `node scripts/run-secure-scan.ts`:

```bash
curl -s http://127.0.0.1:8091/ \
  -H "X-API-Key: $MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -d @request.json | jq
```

where `request.json` is:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "verify_receipt",
    "arguments": { "receipt": { "...": "..." }, "body": { "...": "..." } }
  }
}
```

The `body` must be the exact redacted finding body used to create the receipt.

## Security controls

- **Fail-closed auth**: Firebase ID token (RS256 via Google JWKS) or
  constant-time `X-API-Key`. Enforced on Cloud Run even if disabled.
- **Rate limit**: 15 RPM token bucket per client (Cloud Ops Warden mandate).
- **Body limit**: 64 KB, shallow nesting, bounded arrays and strings.
- **PII guard**: forbidden key names rejected before value inspection.
- **No body logging**: only method/tool/status/duration.
- **CORS**: explicit allowlist; no wildcard.
- **Offline**: tool handlers make no external network calls.

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `MCP_PORT` | `8091` | Listen port |
| `MCP_BIND` | `0.0.0.0` | Bind address |
| `MCP_REQUIRE_AUTH` | `true` | Force auth (always true on Cloud Run) |
| `MCP_API_KEY` | — | Static key, constant-time compared |
| `FIREBASE_PROJECT_ID` | `agape-sovereign` | JWT audience/issuer |
| `MCP_ALLOWED_ORIGINS` | `https://sovereign.nyc,...` | CORS allowlist |
| `MCP_RATE_LIMIT_RPM` | `15` | Sustained rate |
| `MCP_RATE_LIMIT_BURST` | `15` | Burst capacity |
| `MCP_MAX_BODY_BYTES` | `65536` | Request size cap |
| `MCP_TRUST_PROXY` | `false` | Honor `X-Forwarded-For` |
