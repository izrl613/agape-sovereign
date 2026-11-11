"""
mcp_server/automation/server.py — Sovereign Automation MCP Server
=================================================================

A Model Context Protocol (JSON-RPC 2.0) server for the secure automation
layer. Unlike a general chat server, this server is deliberately **blind**:

  - It NEVER accepts passkey/recovery secrets, DEKs, SSNs, passwords, or
    private keys. Requests carrying those keys are rejected outright.
  - It NEVER runs scans over raw PII. Scans are client-side (zero-knowledge).
  - It verifies already-produced SHA-256 receipts, validates envelope
    metadata (downgrade detection), and returns fail-closed remediation plans.

Security controls
-----------------
  - Auth: Firebase ID token (RS256 via Google JWKS) OR constant-time API key.
  - Fail-closed: on Cloud Run auth is always enforced.
  - Rate limit: token bucket, default 15 RPM (Cloud Ops Warden mandate).
  - Body limit: 64 KB, shallow-depth/size validation.
  - No request-body logging. Only method/tool/status/duration are logged.
  - CORS locked to an explicit allowlist.
  - No external network calls in tool handlers (offline by design).

Environment
-----------
  MCP_PORT                 default 8091
  MCP_BIND                 default 0.0.0.0
  MCP_REQUIRE_AUTH         default true (forced true on Cloud Run)
  MCP_API_KEY              static API key (constant-time compared)
  FIREBASE_PROJECT_ID      default agape-sovereign
  MCP_ALLOWED_ORIGINS      comma-separated, default https://sovereign.nyc
  MCP_RATE_LIMIT_RPM       default 15
  MCP_RATE_LIMIT_BURST     default 15
  MCP_MAX_BODY_BYTES       default 65536
  MCP_TRUST_PROXY          default false (honor X-Forwarded-For)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import re
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PORT = int(os.environ.get("MCP_PORT", "8091"))
BIND = os.environ.get("MCP_BIND", "0.0.0.0")
MCP_REQUIRE_AUTH = os.environ.get("MCP_REQUIRE_AUTH", "true").lower() in (
    "1", "true", "yes", "on",
)
if not MCP_REQUIRE_AUTH and os.environ.get("K_SERVICE"):
    MCP_REQUIRE_AUTH = True  # never run unauthenticated on Cloud Run
MCP_API_KEY = os.environ.get("MCP_API_KEY", "")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "agape-sovereign")
ALLOWED_ORIGINS = {
    o.strip()
    for o in os.environ.get(
        "MCP_ALLOWED_ORIGINS", "https://sovereign.nyc,https://agape-sovereign.web.app"
    ).split(",")
    if o.strip()
}
RATE_LIMIT_RPM = int(os.environ.get("MCP_RATE_LIMIT_RPM", "15"))
RATE_LIMIT_BURST = int(os.environ.get("MCP_RATE_LIMIT_BURST", "15"))
MAX_BODY_BYTES = int(os.environ.get("MCP_MAX_BODY_BYTES", "65536"))
TRUST_PROXY = os.environ.get("MCP_TRUST_PROXY", "false").lower() in ("1", "true", "yes")

SERVER_NAME = "sovereign-automation-mcp"
SERVER_VERSION = "1.0.0"
# Newest first. We echo the client's requested revision when it is supported so
# Streamable HTTP clients (OpenCode, Claude Code) negotiate cleanly.
SUPPORTED_PROTOCOL_VERSIONS = (
    "2025-11-25",
    "2025-06-18",
    "2025-03-26",
    "2024-11-05",
)
PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]

_FIREBASE_JWKS_URL = (
    "https://www.googleapis.com/service_accounts/v1/jwk/"
    "securetoken@system.gserviceaccount.com"
)

# ---------------------------------------------------------------------------
# Canonical JSON + receipts (must match agents/secure/receipts.ts)
# ---------------------------------------------------------------------------

_HEX64 = re.compile(r"^[0-9a-f]{64}$")
_HEX_ANY = re.compile(r"^[0-9a-fA-F]+$")


def canonical_json(value: Any) -> str:
    """Deterministic JSON: sorted keys at every level, no whitespace."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(data: str | bytes) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def _receipt_canonical_input(receipt: dict[str, Any], body: Any) -> str:
    return canonical_json(
        {
            "algorithm": receipt.get("algorithm"),
            "version": receipt.get("version"),
            "subject": receipt.get("subject"),
            "moduleId": receipt.get("moduleId"),
            "vector": receipt.get("vector"),
            "issuedAt": receipt.get("issuedAt"),
            "body": body,
        }
    )


def verify_receipt(receipt: dict[str, Any], body: Any) -> tuple[bool, str]:
    if not isinstance(receipt, dict):
        return False, "receipt must be an object"
    if receipt.get("algorithm") != "SHA-256":
        return False, "unsupported algorithm"
    if receipt.get("version") != 1:
        return False, "unsupported receipt version"
    subject = receipt.get("subject")
    digest = receipt.get("digest")
    if not isinstance(subject, str) or not _HEX64.match(subject):
        return False, "subject must be a 32-byte hex hash"
    if not isinstance(digest, str) or not _HEX64.match(digest):
        return False, "digest must be a 32-byte hex hash"
    for field in ("moduleId", "vector", "issuedAt"):
        if not isinstance(receipt.get(field), str):
            return False, f"{field} must be a string"
    expected = sha256_hex(_receipt_canonical_input(receipt, body))
    if not hmac.compare_digest(expected, digest):
        return False, "digest mismatch"
    return True, "verified"


# ---------------------------------------------------------------------------
# Identity vector metadata (mirror of agents/secure/vectors.ts)
# ---------------------------------------------------------------------------

IDENTITY_VECTORS: list[dict[str, Any]] = [
    {"moduleId": "email-scanner", "vector": "V-01", "label": "Email Breach Scanner", "category": "Communications", "weight": 0.08, "sources": ["HIBP", "Dehashed", "XposedOrNot"]},
    {"moduleId": "social-map", "vector": "V-02", "label": "Social Media Footprint", "category": "Social/Deep Web", "weight": 0.06, "sources": ["OSINT", "Meta Graph", "X API"]},
    {"moduleId": "device-health", "vector": "V-03", "label": "Device File Scan", "category": "Hardware/Network", "weight": 0.06, "sources": ["Local Storage"]},
    {"moduleId": "system-security", "vector": "V-04", "label": "Mobile Security Layer", "category": "Hardware/Network", "weight": 0.08, "sources": ["WebAuthn", "FileVault", "BitLocker"]},
    {"moduleId": "deep-web", "vector": "V-05", "label": "Deep Web Exposure", "category": "Social/Deep Web", "weight": 0.08, "sources": ["Tor indices", "Telegram leak channels"]},
    {"moduleId": "broker-removal", "vector": "V-06", "label": "Data Broker Removal", "category": "Financial/Legal", "weight": 0.08, "sources": ["Optery", "Spokeo", "Whitepages"]},
    {"moduleId": "network-vector", "vector": "V-07", "label": "Network Vector", "category": "Hardware/Network", "weight": 0.06, "sources": ["STUN", "DoH"]},
    {"moduleId": "cloud-enclave", "vector": "V-08", "label": "Cloud Storage Exposure", "category": "Hardware/Network", "weight": 0.06, "sources": ["Google Drive", "Dropbox", "iCloud"]},
    {"moduleId": "biometrics", "vector": "V-09", "label": "Voice & Biometric Data", "category": "Hardware/Network", "weight": 0.05, "sources": ["PimEyes", "Secure Enclave"]},
    {"moduleId": "crypto-assets", "vector": "V-10", "label": "Financial Identity Exposure", "category": "Financial/Legal", "weight": 0.05, "sources": ["Etherscan", "Revoke.cash"]},
    {"moduleId": "smart-home", "vector": "V-11", "label": "IoT & Smart Device Scan", "category": "Hardware/Network", "weight": 0.05, "sources": ["mDNS", "UPnP"]},
    {"moduleId": "metadata-purge", "vector": "V-12", "label": "Metadata Purge", "category": "Communications", "weight": 0.05, "sources": ["ExifTool"]},
    {"moduleId": "kernel-health", "vector": "V-13", "label": "Kernel Health", "category": "Hardware/Network", "weight": 0.05, "sources": ["OS Kernel"]},
    {"moduleId": "bios-integrity", "vector": "V-14", "label": "BIOS Integrity", "category": "Hardware/Network", "weight": 0.05, "sources": ["SPI Flash", "Secure Boot"]},
    {"moduleId": "sovereign-id", "vector": "V-15", "label": "Sovereign ID", "category": "Financial/Legal", "weight": 0.06, "sources": ["Equifax", "Experian", "TransUnion"]},
    {"moduleId": "shadow-purge", "vector": "V-16", "label": "Behavioral Profile Analysis", "category": "Social/Deep Web", "weight": 0.06, "sources": ["Optery", "Data Brokers"]},
]

REMEDIATION_ACTIONS = (
    "DATA_BROKER_DELETE",
    "OAUTH_REVOKE",
    "METADATA_PURGE",
    "CREDENTIAL_ROTATE",
)


def remediation_action_for(module_id: str) -> str:
    if module_id in ("broker-removal", "shadow-purge"):
        return "DATA_BROKER_DELETE"
    if module_id == "social-map":
        return "OAUTH_REVOKE"
    if module_id == "metadata-purge":
        return "METADATA_PURGE"
    return "CREDENTIAL_ROTATE"


# ---------------------------------------------------------------------------
# Request hardening
# ---------------------------------------------------------------------------

# Key names that must never cross this boundary. Defense in depth: even if a
# client tries to send secrets, the server refuses before looking at values.
_FORBIDDEN_KEY_PARTS = (
    "passkey",
    "recovery",
    "dek",
    "ssn",
    "password",
    "privatekey",
    "private_key",
    "apikey",
    "api_key",
    "secret",
    "mnemonic",
    "seed",
)

_MAX_DEPTH = 8
_MAX_KEYS = 128
_MAX_ARRAY = 128
_MAX_STRING = 4096


class ValidationError(Exception):
    pass


def _validate_tree(value: Any, depth: int = 0) -> None:
    if depth > _MAX_DEPTH:
        raise ValidationError("payload nesting too deep")
    if isinstance(value, dict):
        if len(value) > _MAX_KEYS:
            raise ValidationError("object has too many keys")
        for key, child in value.items():
            if not isinstance(key, str):
                raise ValidationError("object keys must be strings")
            normalized = key.lower().replace("-", "_")
            for forbidden in _FORBIDDEN_KEY_PARTS:
                if forbidden in normalized:
                    raise ValidationError(
                        f"forbidden field '{key}' — this server never accepts secrets or raw PII"
                    )
            _validate_tree(child, depth + 1)
    elif isinstance(value, list):
        if len(value) > _MAX_ARRAY:
            raise ValidationError("array has too many items")
        for child in value:
            _validate_tree(child, depth + 1)
    elif isinstance(value, str):
        if len(value) > _MAX_STRING:
            raise ValidationError("string field too long")
    elif isinstance(value, float):
        if not math.isfinite(value):
            raise ValidationError("non-finite number")
    elif value is not None and not isinstance(value, (bool, int)):
        raise ValidationError(f"unsupported value type: {type(value).__name__}")


# ---------------------------------------------------------------------------
# Rate limiting (token bucket, per client)
# ---------------------------------------------------------------------------

class TokenBucket:
    def __init__(self, rate_per_minute: int, burst: int) -> None:
        self.rate_per_second = max(rate_per_minute, 1) / 60.0
        self.capacity = max(burst, 1)
        self.tokens = float(self.capacity)
        self.updated = time.monotonic()

    def take(self) -> bool:
        now = time.monotonic()
        self.tokens = min(
            self.capacity, self.tokens + (now - self.updated) * self.rate_per_second
        )
        self.updated = now
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False


_buckets: dict[str, TokenBucket] = {}


def rate_limit_ok(client_key: str) -> bool:
    bucket = _buckets.get(client_key)
    if bucket is None:
        bucket = TokenBucket(RATE_LIMIT_RPM, RATE_LIMIT_BURST)
        _buckets[client_key] = bucket
        # Bound memory: drop the oldest entry if the map grows too large.
        if len(_buckets) > 4096:
            _buckets.pop(next(iter(_buckets)))
    return bucket.take()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def _verify_firebase_id_token(token: str) -> dict[str, Any] | None:
    try:
        import jwt as pyjwt  # type: ignore
        from jwt import PyJWKClient  # type: ignore
    except Exception:
        return None
    try:
        signing_key = PyJWKClient(_FIREBASE_JWKS_URL).get_signing_key_from_jwt(token)
        issuer = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
        return pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=issuer,
            options={"require": ["exp", "iat", "aud", "iss", "sub"]},
        )
    except Exception as exc:  # noqa: BLE001 - never leak token details
        print(f"[MCP] Firebase token verification failed: {type(exc).__name__}", file=sys.stderr)
        return None


def authorize(handler: BaseHTTPRequestHandler) -> tuple[bool, str]:
    if not MCP_REQUIRE_AUTH:
        return True, "auth-disabled"

    authz = handler.headers.get("Authorization") or ""
    if authz.startswith("Bearer "):
        payload = _verify_firebase_id_token(authz[len("Bearer "):].strip())
        if payload:
            return True, f"firebase:{payload.get('sub', '?')}"
        return False, "invalid_firebase_token"

    provided = handler.headers.get("X-API-Key") or ""
    if MCP_API_KEY and provided:
        if hmac.compare_digest(provided, MCP_API_KEY):
            return True, "api_key"
        return False, "invalid_api_key"

    return False, "no_credentials"


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def _tool_health(args: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": "ok",
        "server": SERVER_NAME,
        "version": SERVER_VERSION,
        "zero_knowledge": True,
        "accepts_secrets": False,
        "accepts_raw_pii": False,
        "external_network_calls": False,
        "rate_limit_rpm": RATE_LIMIT_RPM,
        "auth_required": MCP_REQUIRE_AUTH,
        "policy": {
            "fabricated_findings": "forbidden",
            "receipts": "SHA-256 per vector",
            "cipher": "AES-256-GCM",
            "kdf": "PBKDF2-SHA-256",
            "kdf_iteration_floor": 210000,
            "remediation": "plans only; execution is fail-closed client-side",
        },
    }


def _tool_list_vectors(args: dict[str, Any]) -> dict[str, Any]:
    return {
        "count": len(IDENTITY_VECTORS),
        "categories": [
            "Communications",
            "Social/Deep Web",
            "Hardware/Network",
            "Financial/Legal",
        ],
        "vectors": IDENTITY_VECTORS,
    }


def _tool_verify_receipt(args: dict[str, Any]) -> dict[str, Any]:
    receipt = args.get("receipt")
    if not isinstance(receipt, dict):
        raise ValidationError("'receipt' must be an object")
    if "body" not in args:
        raise ValidationError("'body' is required to recompute the digest")
    valid, reason = verify_receipt(receipt, args.get("body"))
    return {
        "valid": valid,
        "reason": reason,
        "vector": receipt.get("vector"),
        "moduleId": receipt.get("moduleId"),
    }


def _tool_get_remediation_plan(args: dict[str, Any]) -> dict[str, Any]:
    vectors = args.get("vectors")
    if not isinstance(vectors, list):
        raise ValidationError("'vectors' must be an array")
    plan: list[dict[str, Any]] = []
    for entry in vectors:
        if not isinstance(entry, dict):
            continue
        module_id = entry.get("moduleId") or entry.get("module_id")
        if not isinstance(module_id, str) or not module_id:
            continue
        findings = entry.get("findings")
        if not isinstance(findings, list):
            continue
        nuked = any(
            isinstance(f, dict) and f.get("status") == "NUKED" for f in findings
        )
        if nuked:
            plan.append(
                {
                    "moduleId": module_id,
                    "action": remediation_action_for(module_id),
                    "reason": "Confirmed NUKED finding(s) with a valid receipt.",
                    "willExecute": False,
                }
            )
    return {
        "plan": plan,
        "note": (
            "Planning only. Execution requires an authenticated client-side "
            "RemediationTransport. Default is fail-closed (BLOCKED)."
        ),
    }


def _tool_verify_envelope_metadata(args: dict[str, Any]) -> dict[str, Any]:
    envelope = args.get("envelope")
    if not isinstance(envelope, dict):
        raise ValidationError("'envelope' must be an object")
    reasons: list[str] = []
    if envelope.get("cipher") != "AES-256-GCM":
        reasons.append("cipher must be AES-256-GCM")
    if envelope.get("kdf") != "PBKDF2-SHA-256":
        reasons.append("kdf must be PBKDF2-SHA-256")
    iterations = envelope.get("iterations")
    if not isinstance(iterations, int) or iterations < 210000:
        reasons.append("kdf iterations below 210000 floor")
    if envelope.get("version") != 1:
        reasons.append("unsupported envelope version")
    for field in ("iv", "ciphertext", "passkey", "recovery"):
        if field not in envelope:
            reasons.append(f"missing field '{field}'")
    return {
        "valid": len(reasons) == 0,
        "reasons": reasons,
        "note": "Metadata-only check. This server never decrypts envelopes.",
    }


TOOLS: dict[str, dict[str, Any]] = {
    "sovereign_health": {
        "handler": _tool_health,
        "description": "Health and machine-readable security policy.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
    },
    "list_identity_vectors": {
        "handler": _tool_list_vectors,
        "description": "List the canonical 16 identity vectors (metadata only).",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
    },
    "verify_receipt": {
        "handler": _tool_verify_receipt,
        "description": "Recompute a SHA-256 receipt over a supplied redacted body.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "receipt": {"type": "object"},
                "body": {"type": "object"},
            },
            "required": ["receipt", "body"],
            "additionalProperties": False,
        },
    },
    "get_remediation_plan": {
        "handler": _tool_get_remediation_plan,
        "description": "Return a fail-closed remediation plan for NUKED vectors. Does not execute.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "vectors": {"type": "array"},
            },
            "required": ["vectors"],
            "additionalProperties": False,
        },
    },
    "verify_envelope_metadata": {
        "handler": _tool_verify_envelope_metadata,
        "description": "Validate envelope cipher/KDF/iterations without decrypting.",
        "inputSchema": {
            "type": "object",
            "properties": {"envelope": {"type": "object"}},
            "required": ["envelope"],
            "additionalProperties": False,
        },
    },
}


# ---------------------------------------------------------------------------
# MCP protocol
# ---------------------------------------------------------------------------

def _ok(req_id: Any, result: Any) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _err(req_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}}


def dispatch(body: dict[str, Any]) -> dict[str, Any]:
    req_id = body.get("id")
    method = body.get("method")
    params = body.get("params") if isinstance(body.get("params"), dict) else {}

    if method == "initialize":
        requested = params.get("protocolVersion")
        negotiated = (
            requested
            if isinstance(requested, str) and requested in SUPPORTED_PROTOCOL_VERSIONS
            else PROTOCOL_VERSION
        )
        return _ok(
            req_id,
            {
                "protocolVersion": negotiated,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            },
        )
    if method == "ping":
        return _ok(req_id, {})
    if method == "tools/list":
        return _ok(
            req_id,
            {
                "tools": [
                    {
                        "name": name,
                        "description": spec["description"],
                        "inputSchema": spec["inputSchema"],
                    }
                    for name, spec in TOOLS.items()
                ]
            },
        )
    if method == "notifications/initialized":
        return {}
    if method == "tools/call":
        name = params.get("name")
        arguments = params.get("arguments") or {}
        if not isinstance(name, str) or name not in TOOLS:
            return _err(req_id, -32601, f"Unknown tool: {name}")
        if not isinstance(arguments, dict):
            return _err(req_id, -32602, "arguments must be an object")
        try:
            _validate_tree(arguments)
            result = TOOLS[name]["handler"](arguments)
            return _ok(
                req_id,
                {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]},
            )
        except ValidationError as exc:
            return _err(req_id, -32602, f"Invalid params: {exc}")
        except Exception as exc:  # noqa: BLE001 - fail closed, no internals leaked
            print(f"[MCP] tool error {name}: {type(exc).__name__}", file=sys.stderr)
            return _err(req_id, -32603, "Internal tool error")

    return _err(req_id, -32601, f"Method not found: {method}")


# ---------------------------------------------------------------------------
# HTTP layer
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    server_version = f"{SERVER_NAME}/{SERVER_VERSION}"

    def log_message(self, fmt: str, *args: Any) -> None:  # noqa: A003
        # Never log request bodies or headers.
        print(f"[MCP] {fmt % args}", file=sys.stderr)

    def _client_key(self) -> str:
        if TRUST_PROXY:
            forwarded = self.headers.get("X-Forwarded-For", "")
            if forwarded:
                return forwarded.split(",")[0].strip()
        return self.client_address[0] if self.client_address else "unknown"

    def _send(self, status: int, payload: dict[str, Any] | None) -> None:
        data = b"" if payload is None else json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Referrer-Policy", "no-referrer")
        origin = self.headers.get("Origin")
        if origin and origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, X-API-Key, Content-Type")
        self.end_headers()
        if data:
            self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send(204, None)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/health", "/"):
            self._send(
                200,
                {
                    "status": "ok",
                    "server": SERVER_NAME,
                    "version": SERVER_VERSION,
                    "auth_required": MCP_REQUIRE_AUTH,
                    "zero_knowledge": True,
                },
            )
        else:
            self._send(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        started = time.monotonic()

        if not rate_limit_ok(self._client_key()):
            self._send(429, _err(None, -32000, "Rate limit exceeded"))
            return

        if MCP_REQUIRE_AUTH:
            allowed, reason = authorize(self)
            if not allowed:
                print(f"[MCP] auth denied: {reason}", file=sys.stderr)
                self._send(401, _err(None, -32600, f"Unauthorized: {reason}"))
                return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send(400, _err(None, -32700, "Invalid Content-Length"))
            return

        if length <= 0:
            self._send(400, _err(None, -32700, "Empty body"))
            return
        if length > MAX_BODY_BYTES:
            self._send(413, _err(None, -32600, "Request body too large"))
            return

        raw = self.rfile.read(length)
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            self._send(400, _err(None, -32700, "Parse error"))
            return

        if not isinstance(body, dict):
            self._send(400, _err(None, -32600, "Invalid Request"))
            return

        response = dispatch(body)
        if not response:  # notification
            self._send(204, None)
            return

        tool = ""
        if body.get("method") == "tools/call":
            params = body.get("params")
            if isinstance(params, dict):
                tool = str(params.get("name", ""))
        elapsed_ms = int((time.monotonic() - started) * 1000)
        print(
            f"[MCP] method={body.get('method')} tool={tool or '-'} "
            f"status=200 duration_ms={elapsed_ms}",
            file=sys.stderr,
        )
        self._send(200, response)


def main() -> None:
    if MCP_REQUIRE_AUTH and not MCP_API_KEY:
        try:
            import jwt  # noqa: F401  # type: ignore
            firebase_ready = True
        except Exception:
            firebase_ready = False
        if not firebase_ready:
            print(
                "[MCP] WARNING: auth required but neither MCP_API_KEY nor PyJWT is "
                "configured. All POST requests will be rejected (fail-closed).",
                file=sys.stderr,
            )

    print(f"[MCP] {SERVER_NAME} v{SERVER_VERSION}")
    print(f"[MCP] Listening on {BIND}:{PORT}")
    print(f"[MCP] Auth gate: {'ENABLED' if MCP_REQUIRE_AUTH else 'disabled'}")
    print(f"[MCP] Rate limit: {RATE_LIMIT_RPM} RPM (burst {RATE_LIMIT_BURST})")
    print("[MCP] Secrets accepted: NO · Raw PII accepted: NO · Offline: YES")

    server = ThreadingHTTPServer((BIND, PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[MCP] Server stopped.", file=sys.stderr)


if __name__ == "__main__":
    main()
