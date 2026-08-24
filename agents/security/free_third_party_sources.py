"""
Free Third-Party Source Enrichment — SHA256-first, offline-first

Integrates genuinely FREE third-party sources that add detail to a Digital
Identity Federated Footprint (DIFF) analysis. Every identifier is canonicalised
and SHA256-hashed before it leaves the device wherever the source supports a
hashed/prefix lookup (k-anonymity). Sources that inherently require the raw
value are flagged in `sent_to_source` so the audit trail stays honest.

Design principles
-----------------
1. **Offline-first.** No network call happens unless `AGAPE_LIVE_ENRICHMENT=1`
   is set. In offline mode each method returns a structured "would-query"
   finding with a SHA256 evidence hash, so the vector pipeline stays
   deterministic and never blocks on the network (mirrors the PWA offline-first
   architecture in OPERATION FRAMEWORK).
2. **SHA256 everywhere.** Local evidence/audit hashes are SHA256. Gravatar's
   profile API is queried by `SHA256(email)`. Breach-style feeds use a
   k-anonymity prefix (`sha256_prefix` / `sha1_prefix` for HIBP-compat).
3. **Stdlib only.** Uses `urllib` (no `requests` dependency), matching
   `mcp_server/server.py` conventions.
4. **Graceful degradation.** Every network call is wrapped; any failure yields
   a MONITORED/info finding, never an exception that breaks a vector.
5. **Zero new paid APIs.** Only free / free-tier sources are wired. Keyed
   free-tier sources (Google Safe Browsing, AbuseIPDB) are optional and skip
   cleanly when their env key is absent.

Sources (all free)
------------------
- Gravatar            — profile by SHA256(email). No key.
- crt.sh              — Certificate Transparency (domain -> issued certs / SANs
                        exposing identity<->domain linkage). No key.
- Cloudflare DoH      — DNS (A/AAAA/MX/TXT -> SPF/DKIM/DMARC posture). No key.
- Google Safe Browsing— URL/domain malware + phishing threat. Free key (optional).
- AbuseIPDB           — IP abuse confidence. Free tier 1000/day (optional key).
- Disify              — disposable/alias/temporary email detection. No key.
- Mastodon            — federated social profile lookup by @user@instance. No key.
- Data Broker Opt-Out — embedded curated registry of broker opt-out URLs. Offline.

Env knobs
---------
- AGAPE_LIVE_ENRICHMENT=1        enable live network calls (default off)
- AGAPE_ENRICH_TIMEOUT=<sec>     per-request timeout (default 8)
- GOOGLE_SAFE_BROWSING_KEY=<key> enable Google Safe Browsing
- ABUSEIPDB_KEY=<key>            enable AbuseIPDB
- AGAPE_BREACH_FEED=<url_tmpl>   any free k-anonymity breach feed; URL must
                                 contain `{prefix}`. When unset, breach lookup
                                 is skipped (HIBP now requires a paid key, so it
                                 is intentionally NOT wired by default).
"""

import hashlib
import json
import os
import ssl
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_LIVE = os.environ.get("AGAPE_LIVE_ENRICHMENT", "").lower() in ("1", "true", "yes", "on")
_DEFAULT_TIMEOUT = int(os.environ.get("AGAPE_ENRICH_TIMEOUT", "8"))
_GSB_KEY = os.environ.get("GOOGLE_SAFE_BROWSING_KEY", "")
_ABUSEIPDB_KEY = os.environ.get("ABUSEIPDB_KEY", "")
_BREACH_FEED = os.environ.get("AGAPE_BREACH_FEED", "")  # e.g. "https://feed.example/range/{prefix}"

FREE_SOURCES_REGISTRY: List[Dict[str, Any]] = [
    {"name": "gravatar", "kind": "email", "needs_key": False, "hashing": "sha256(email)", "free": True},
    {"name": "disify", "kind": "email", "needs_key": False, "hashing": "raw(email)", "free": True},
    {"name": "cloudflare_doh", "kind": "domain", "needs_key": False, "hashing": "raw(domain)", "free": True},
    {"name": "crt_sh", "kind": "domain", "needs_key": False, "hashing": "raw(domain)", "free": True},
    {"name": "google_safe_browsing", "kind": "url|domain", "needs_key": True, "hashing": "raw(url)", "free": True},
    {"name": "abuseipdb", "kind": "ip", "needs_key": True, "hashing": "raw(ip)", "free": True},
    {"name": "mastodon", "kind": "username", "needs_key": False, "hashing": "raw(user@instance)", "free": True},
    {"name": "data_broker_opt_out", "kind": "text", "needs_key": False, "hashing": "sha256(query)", "free": True},
    {"name": "breach_k_anon", "kind": "email", "needs_key": False, "hashing": "sha256_prefix(5)", "free": True,
     "note": "Generic k-anonymity prefix protocol; plug any free feed via AGAPE_BREACH_FEED."},
]


# ---------------------------------------------------------------------------
# SHA256 / k-anonymity helpers
# ---------------------------------------------------------------------------

def sha256_hex(value: str) -> str:
    """Full SHA256 hex digest of a UTF-8 string."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sha256_prefix(value: str, n: int = 5) -> str:
    """k-anonymity prefix of SHA256(value). Default 5 hex chars (~1M anonymity
    set, matching the HIBP range-search convention but using SHA256)."""
    return sha256_hex(value)[:n]


def sha1_prefix(value: str, n: int = 5) -> str:
    """SHA1 prefix for HIBP-compat feeds that still use SHA1 range search."""
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:n]


def canonical_email(email: str) -> str:
    return (email or "").strip().lower()


# ---------------------------------------------------------------------------
# Finding model
# ---------------------------------------------------------------------------

@dataclass
class EnrichmentFinding:
    """Normalized finding produced by every free-source lookup."""
    source: str
    identifier_kind: str  # email | domain | url | ip | username | text
    identifier_sha256: str
    status: str  # NUKED | KNOXED | MONITORED
    severity: str  # critical | high | medium | low | info
    detail: str
    sent_to_source: str  # what left the device, e.g. "sha256(email)" / "domain" / "sha256_prefix(5)" / "none"
    fetched_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    raw: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "identifier_kind": self.identifier_kind,
            "identifier_sha256": self.identifier_sha256,
            "status": self.status,
            "severity": self.severity,
            "detail": self.detail,
            "sent_to_source": self.sent_to_source,
            "fetched_at": self.fetched_at,
            "raw": self.raw,
        }


# ---------------------------------------------------------------------------
# HTTP helpers (stdlib only)
# ---------------------------------------------------------------------------

def _ssl_context() -> ssl.SSLContext:
    """Build a verifying SSL context. Prefers the `certifi` CA bundle when
    available (common in production via cryptography/urllib3 deps), else falls
    back to the system default trust store. Verification is NEVER disabled."""
    ctx = ssl.create_default_context()
    try:
        import certifi  # type: ignore
        ctx.load_verify_locations(cafile=certifi.where())
    except Exception:
        pass  # fall back to system roots
    return ctx


_SSL_CTX = _ssl_context()


def _http_get_json(url: str, headers: Optional[Dict[str, str]] = None,
                   timeout: int = _DEFAULT_TIMEOUT) -> Tuple[Optional[Any], Optional[str]]:
    try:
        req = urllib.request.Request(url, headers=headers or {}, method="GET")
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
            body = resp.read().decode("utf-8", "replace")
            try:
                return json.loads(body), None
            except json.JSONDecodeError:
                return None, f"non-json response ({len(body)} bytes)"
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:  # noqa: BLE001 - intentional broad guard for enrichment
        return None, f"{type(e).__name__}: {e}"


def _http_post_json(url: str, payload: Dict[str, Any],
                    headers: Optional[Dict[str, str]] = None,
                    timeout: int = _DEFAULT_TIMEOUT) -> Tuple[Optional[Any], Optional[str]]:
    try:
        data = json.dumps(payload).encode("utf-8")
        hdrs = {"Content-Type": "application/json"}
        if headers:
            hdrs.update(headers)
        req = urllib.request.Request(url, data=data, headers=hdrs, method="POST")
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
            body = resp.read().decode("utf-8", "replace")
            try:
                return json.loads(body), None
            except json.JSONDecodeError:
                return None, "non-json response"
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:  # noqa: BLE001
        return None, f"{type(e).__name__}: {e}"


# ---------------------------------------------------------------------------
# Embedded data-broker opt-out registry (offline, free, public info)
# ---------------------------------------------------------------------------

# Curated from public opt-out directories (Privacy Rights Clearinghouse,
# yaelwrites/Big-Ass-Data-Broker-Opt-Out-List). Kept compact and offline so the
# V-06 data-broker vector and the generateecraoptout service can resolve
# rectification endpoints without any network dependency.
DATA_BROKER_REGISTRY: List[Dict[str, str]] = [
    {"name": "Spokeo", "url": "https://www.spokeo.com/optout", "category": "people_search"},
    {"name": "Whitepages", "url": "https://www.whitepages.com/suppression_requests", "category": "people_search"},
    {"name": "BeenVerified", "url": "https://www.beenverified.com/app/optout/search", "category": "people_search"},
    {"name": "Intelius", "url": "https://www.intelius.com/opt-out/", "category": "people_search"},
    {"name": "PeopleFinder", "url": "https://www.peoplefinder.com/opt-out", "category": "people_search"},
    {"name": "Radaris", "url": "https://radaris.com/optout", "category": "people_search"},
    {"name": "US Search", "url": "https://www.ussearch.com/opt-out", "category": "people_search"},
    {"name": "MyLife", "url": "https://www.mylife.com/public-record-remove/", "category": "people_search"},
    {"name": "PeopleSmart", "url": "https://www.peoplesmart.com/opt-out", "category": "people_search"},
    {"name": "Instant Checkmate", "url": "https://www.instantcheckmate.com/opt-out/", "category": "background_checks"},
    {"name": "TruthFinder", "url": "https://www.truthfinder.com/opt-out/", "category": "background_checks"},
    {"name": "CheckPeople", "url": "https://www.checkpeople.com/opt-out", "category": "background_checks"},
    {"name": "Brokerss Traces", "url": "https://www.brokerstraces.com/opt-out", "category": "background_checks"},
    {"name": "VitalChek", "url": "https://www.vitalchek.com/opt-out", "category": "vital_records"},
    {"name": "FamilyTreeNow", "url": "https://www.familytreenow.com/opt-out", "category": "people_search"},
    {"name": "FastPeopleSearch", "url": "https://www.fastpeoplesearch.com/opt-out", "category": "people_search"},
    {"name": "FreePeopleSearch", "url": "https://www.freepeoplesearch.com/opt-out", "category": "people_search"},
    {"name": "Addresses.com", "url": "https://www.addresses.com/opt-out", "category": "people_search"},
    {"name": "NeighborReport", "url": "https://www.neighborreport.com/opt-out", "category": "people_search"},
    {"name": "OpenPublicRecords", "url": "https://www.openpublicrecords.com/opt-out", "category": "public_records"},
    {"name": "PeopleByName", "url": "https://www.peoplebyname.com/opt-out", "category": "people_search"},
    {"name": "SearchQuarry", "url": "https://www.searchquarry.com/opt-out", "category": "background_checks"},
    {"name": "InfoTracer", "url": "https://www.infortracer.com/opt-out", "category": "background_checks"},
    {"name": "IDTrue", "url": "https://www.idtrue.com/opt-out", "category": "background_checks"},
    {"name": "USPhonebook", "url": "https://www.usphonebook.com/opt-out", "category": "people_search"},
    {"name": "PDJResearch", "url": "https://www.pdjresearch.com/opt-out", "category": "background_checks"},
    {"name": "IDIQ", "url": "https://www.idiq.com/opt-out", "category": "background_checks"},
    {"name": "PublicDataCorp", "url": "https://www.publicdatacorp.com/opt-out", "category": "public_records"},
    {"name": "LexisNexis", "url": "https://www.lexisnexis.com/privacy/for-consumers/opt-out", "category": "data_aggregator"},
    {"name": "Acxiom", "url": "https://www.acxiom.com/about-us/privacy/opt-out/", "category": "data_aggregator"},
    {"name": "Oracle Data Cloud", "url": "https://www.oracle.com/legal/privacy/marketing-cloud-opt-out/", "category": "data_aggregator"},
    {"name": "Experian", "url": "https://www.experian.com/help/optout.html", "category": "data_aggregator"},
    {"name": "Equifax", "url": "https://www.equifax.com/personal/privacy/opt-out/", "category": "data_aggregator"},
    {"name": "TransUnion", "url": "https://www.transunion.com/privacy/opt-out", "category": "data_aggregator"},
]


# ---------------------------------------------------------------------------
# Enricher
# ---------------------------------------------------------------------------

class FreeThirdPartyEnricher:
    """Coordinates free third-party lookups with SHA256 privacy hygiene."""

    def __init__(self, live: bool = _LIVE):
        self.live = live
        self.registry = FREE_SOURCES_REGISTRY

    # -- public API --------------------------------------------------------

    def enrich_email(self, email: str) -> List[EnrichmentFinding]:
        """Email footprint: Gravatar (SHA256), Disify disposable check, domain
        MX/TXT posture via DoH, and k-anonymity breach lookup if a feed is set."""
        email = canonical_email(email)
        if not email or "@" not in email:
            return []
        evid = sha256_hex(email)
        out: List[EnrichmentFinding] = []

        out.append(self._gravatar(email, evid))
        out.append(self._disify(email, evid))
        out.append(self._breach_k_anon(email, evid))

        domain = email.split("@", 1)[1]
        out.extend(self._doh_email_posture(domain, evid))
        return [f for f in out if f is not None]

    def enrich_domain(self, domain: str) -> List[EnrichmentFinding]:
        """Domain footprint: DNS posture (A/MX/TXT SPF/DKIM/DMARC), Safe Browsing
        threat check (if keyed), and Certificate Transparency via crt.sh."""
        domain = (domain or "").strip().lower()
        if not domain:
            return []
        evid = sha256_hex(domain)
        out: List[EnrichmentFinding] = []
        out.extend(self._doh_domain_posture(domain, evid))
        out.append(self._safe_browsing(domain, evid, kind="domain"))
        out.append(self._crt_sh(domain, evid))
        return [f for f in out if f is not None]

    def enrich_url(self, url: str) -> List[EnrichmentFinding]:
        """URL footprint: Safe Browsing threat check (if keyed)."""
        url = (url or "").strip()
        if not url:
            return []
        evid = sha256_hex(url)
        out: List[EnrichmentFinding] = []
        out.append(self._safe_browsing(url, evid, kind="url"))
        return [f for f in out if f is not None]

    def enrich_ip(self, ip: str) -> List[EnrichmentFinding]:
        """IP footprint: AbuseIPDB abuse-confidence score (free tier, keyed)."""
        ip = (ip or "").strip()
        if not ip:
            return []
        evid = sha256_hex(ip)
        return [f for f in [self._abuseipdb(ip, evid)] if f is not None]

    def enrich_username(self, handle: str) -> List[EnrichmentFinding]:
        """Username footprint: Mastodon federated profile lookup for
        @user@instance handles; otherwise a SHA256 evidence stub."""
        handle = (handle or "").strip()
        if not handle:
            return []
        evid = sha256_hex(handle)
        return [f for f in [self._mastodon(handle, evid)] if f is not None]

    def data_broker_opt_out(self, query: str) -> List[EnrichmentFinding]:
        """Offline registry match against the embedded data-broker opt-out list.
        Supports GDPR Art.16/17/21 + CCPA + ECRA 2026 rectification/erasure."""
        query = (query or "").strip().lower()
        if not query:
            return []
        evid = sha256_hex(query)
        matches = [b for b in DATA_BROKER_REGISTRY
                   if query in b["name"].lower() or query in b.get("category", "").lower()]
        if not matches:
            return [EnrichmentFinding(
                source="data_broker_opt_out", identifier_kind="text",
                identifier_sha256=evid, status="KNOXED", severity="info",
                detail=f"No broker matched '{query}' in the embedded registry ({len(DATA_BROKER_REGISTRY)} brokers indexed).",
                sent_to_source="none",
                raw={"registry_size": len(DATA_BROKER_REGISTRY)})]
        findings = []
        for b in matches:
            findings.append(EnrichmentFinding(
                source="data_broker_opt_out", identifier_kind="text",
                identifier_sha256=evid, status="NUKED", severity="high",
                detail=f"Broker '{b['name']}' ({b['category']}) lists personal data. Submit a rectification/erasure request at {b['url']}.",
                sent_to_source="none",
                raw={"broker": b["name"], "category": b["category"], "opt_out_url": b["url"]}))
        return findings

    def enrich_all(self, identifiers: Dict[str, Any]) -> List[EnrichmentFinding]:
        """Dispatch a mixed bag of identifiers. Keys: emails, domains, urls, ips,
        usernames, broker_query."""
        out: List[EnrichmentFinding] = []
        for e in identifiers.get("emails", []) or []:
            out.extend(self.enrich_email(e))
        for d in identifiers.get("domains", []) or []:
            out.extend(self.enrich_domain(d))
        for u in identifiers.get("urls", []) or []:
            out.extend(self.enrich_url(u))
        for ip in identifiers.get("ips", []) or []:
            out.extend(self.enrich_ip(ip))
        for un in identifiers.get("usernames", []) or []:
            out.extend(self.enrich_username(un))
        if identifiers.get("broker_query"):
            out.extend(self.data_broker_opt_out(identifiers["broker_query"]))
        return out

    # -- source implementations -------------------------------------------

    def _gravatar(self, email: str, evid: str) -> EnrichmentFinding:
        h = sha256_hex(email)
        url = f"https://www.gravatar.com/{h}.json"
        if not self.live:
            return EnrichmentFinding(
                source="gravatar", identifier_kind="email", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail=f"Offline: would query Gravatar profile by SHA256(email) prefix {h[:12]}…",
                sent_to_source=f"sha256(email)={h}",
                raw={"url": url, "hash": h})
        data, err = _http_get_json(url)
        if err:
            return EnrichmentFinding(
                source="gravatar", identifier_kind="email", identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"Gravatar: no public profile or lookup failed ({err}).",
                sent_to_source=f"sha256(email)={h}", raw={"error": err})
        entry = (data or {}).get("entry", [{}])[0] if isinstance(data, dict) else {}
        linked = [a.get("shortname") for a in (entry.get("accounts") or []) if a.get("shortname")]
        if entry.get("displayName") or linked:
            return EnrichmentFinding(
                source="gravatar", identifier_kind="email", identifier_sha256=evid,
                status="NUKED", severity="high",
                detail=f"Gravatar public profile exposes displayName='{entry.get('displayName')}' and {len(linked)} linked account(s): {linked}.",
                sent_to_source=f"sha256(email)={h}",
                raw={"display_name": entry.get("displayName"), "linked_accounts": linked,
                     "thumbnail_url": entry.get("thumbnailUrl")})
        return EnrichmentFinding(
            source="gravatar", identifier_kind="email", identifier_sha256=evid,
            status="KNOXED", severity="info",
            detail="Gravatar: profile endpoint returned no public identity fields.",
            sent_to_source=f"sha256(email)={h}", raw={})

    def _disify(self, email: str, evid: str) -> EnrichmentFinding:
        url = f"https://www.disify.com/api/email/{urllib.parse.quote(email)}"
        if not self.live:
            return EnrichmentFinding(
                source="disify", identifier_kind="email", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail="Offline: would query Disify for disposable/alias/temporary email classification.",
                sent_to_source="raw(email)", raw={"url": url})
        data, err = _http_get_json(url)
        if err or not isinstance(data, dict):
            return EnrichmentFinding(
                source="disify", identifier_kind="email", identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"Disify: lookup failed ({err}).", sent_to_source="raw(email)",
                raw={"error": err})
        disposable = bool(data.get("disposable"))
        alias = bool(data.get("alias"))
        if disposable or alias:
            return EnrichmentFinding(
                source="disify", identifier_kind="email", identifier_sha256=evid,
                status="NUKED", severity="medium",
                detail=f"Disify: email uses a disposable/temporary provider (disposable={disposable}, alias={alias}) — high churn / abuse-vector risk.",
                sent_to_source="raw(email)",
                raw={"disposable": disposable, "alias": alias, "format": data.get("format")})
        return EnrichmentFinding(
            source="disify", identifier_kind="email", identifier_sha256=evid,
            status="KNOXED", severity="info",
            detail="Disify: email is on a legitimate, non-disposable provider.",
            sent_to_source="raw(email)",
            raw={"disposable": False, "alias": False, "format": data.get("format")})

    def _breach_k_anon(self, email: str, evid: str) -> EnrichmentFinding:
        prefix = sha256_prefix(email, 5)
        if not _BREACH_FEED:
            return EnrichmentFinding(
                source="breach_k_anon", identifier_kind="email", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail="Breach k-anonymity feed not configured (set AGAPE_BREACH_FEED with a free prefix-search feed). Only the 5-hex SHA256 prefix would leave the device.",
                sent_to_source=f"sha256_prefix(5)={prefix}", raw={"prefix": prefix})
        url = _BREACH_FEED.replace("{prefix}", prefix)
        if not self.live:
            return EnrichmentFinding(
                source="breach_k_anon", identifier_kind="email", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail=f"Offline: would range-search breach feed with SHA256 prefix {prefix}.",
                sent_to_source=f"sha256_prefix(5)={prefix}", raw={"url": url, "prefix": prefix})
        data, err = _http_get_json(url)
        if err:
            return EnrichmentFinding(
                source="breach_k_anon", identifier_kind="email", identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"Breach feed lookup failed ({err}).", sent_to_source=f"sha256_prefix(5)={prefix}",
                raw={"error": err})
        full = sha256_hex(email)
        # A k-anon feed returns all hashes sharing the prefix; we locally match the full hash.
        candidates = data if isinstance(data, list) else (data or {}).get("hashes", [])
        hit = any(isinstance(c, str) and c.lower() == full for c in candidates) or \
            any(isinstance(c, dict) and (c.get("hash") or c.get("sha256") or "").lower() == full for c in candidates)
        if hit:
            return EnrichmentFinding(
                source="breach_k_anon", identifier_kind="email", identifier_sha256=evid,
                status="NUKED", severity="critical",
                detail="Breach feed: full SHA256(email) matched a leaked credential record. Rotate passwords immediately.",
                sent_to_source=f"sha256_prefix(5)={prefix}", raw={"matched": True})
        return EnrichmentFinding(
            source="breach_k_anon", identifier_kind="email", identifier_sha256=evid,
            status="KNOXED", severity="info",
            detail="Breach feed: no leaked record matched the full SHA256(email).",
            sent_to_source=f"sha256_prefix(5)={prefix}", raw={"matched": False})

    def _doh_query(self, domain: str, rtype: str) -> Tuple[Optional[List[str]], Optional[str]]:
        url = f"https://cloudflare-dns.com/dns-query?name={urllib.parse.quote(domain)}&type={rtype}"
        data, err = _http_get_json(url, headers={"Accept": "application/dns-json"})
        if err or not isinstance(data, dict):
            return None, err
        if data.get("Status") != 0:
            return None, f"dns_status={data.get('Status')}"
        ans = [a.get("data", "") for a in (data.get("Answer") or [])]
        return ans, None

    def _doh_email_posture(self, domain: str, evid: str) -> List[EnrichmentFinding]:
        # Reuses domain posture but scopes detail to email-infra relevance.
        return self._doh_domain_posture(domain, evid, email_scope=True)

    def _doh_domain_posture(self, domain: str, evid: str, email_scope: bool = False) -> List[EnrichmentFinding]:
        if not self.live:
            return [EnrichmentFinding(
                source="cloudflare_doh", identifier_kind="domain", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail=("Offline: would query Cloudflare DoH for MX/TXT(A/AAAA) to "
                        f"assess email-infra posture of {domain}.") if email_scope else
                       (f"Offline: would query Cloudflare DoH for A/MX/TXT on {domain}."),
                sent_to_source=f"domain={domain}", raw={"domain": domain})]
        out: List[EnrichmentFinding] = []
        a_records, _ = self._doh_query(domain, "A")
        mx_records, _ = self._doh_query(domain, "MX")
        txt_records, _ = self._doh_query(domain, "TXT")
        txt_blob = " ".join(txt_records or []).lower()
        has_spf = "spf1" in txt_blob
        has_dmarc = False
        dmarc_records, _ = self._doh_query(f"_dmarc.{domain}", "TXT")
        if dmarc_records and any("dmarc" in r.lower() for r in dmarc_records):
            has_dmarc = True
        dkim_present = "dkim" in txt_blob
        issues = []
        if not has_spf:
            issues.append("no SPF")
        if not has_dmarc:
            issues.append("no DMARC")
        if not dkim_present:
            issues.append("no DKIM advertised")
        if email_scope:
            severity = "high" if (mx_records and issues) else ("medium" if issues else "info")
            status = "NUKED" if (mx_records and issues) else ("MONITORED" if issues else "KNOXED")
            detail = (f"Email infra for {domain}: MX={len(mx_records or [])} SPF={has_spf} "
                      f"DMARC={has_dmarc} DKIM-advert={dkim_present}. Issues: {issues or 'none'}.")
        else:
            severity = "medium" if issues else "info"
            status = "MONITORED" if issues else "KNOXED"
            detail = (f"DNS posture for {domain}: A={len(a_records or [])} MX={len(mx_records or [])} "
                      f"SPF={has_spf} DMARC={has_dmarc}. Issues: {issues or 'none'}.")
        out.append(EnrichmentFinding(
            source="cloudflare_doh", identifier_kind="domain", identifier_sha256=evid,
            status=status, severity=severity, detail=detail, sent_to_source=f"domain={domain}",
            raw={"a": a_records, "mx": mx_records, "txt": txt_records, "spf": has_spf,
                 "dmarc": has_dmarc, "dkim_advertised": dkim_present}))
        return out

    def _safe_browsing(self, value: str, evid: str, kind: str = "url") -> EnrichmentFinding:
        if not _GSB_KEY:
            return EnrichmentFinding(
                source="google_safe_browsing", identifier_kind=kind, identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail="Google Safe Browsing skipped (set GOOGLE_SAFE_BROWSING_KEY to enable the free tier).",
                sent_to_source="none", raw={"configured": False})
        # Safe Browsing expects a URL; coerce bare domains.
        url_value = value if value.startswith("http") else f"http://{value}/"
        api = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={_GSB_KEY}"
        payload = {
            "client": {"clientId": "agape-sovereign", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE",
                                "POTENTIALLY_HARMFUL_APPLICATION"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url_value}],
            },
        }
        if not self.live:
            return EnrichmentFinding(
                source="google_safe_browsing", identifier_kind=kind, identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail="Offline: would query Google Safe Browsing v4 threatMatches:find.",
                sent_to_source=f"raw({kind})={value}", raw={"api": api})
        data, err = _http_post_json(api, payload)
        if err:
            return EnrichmentFinding(
                source="google_safe_browsing", identifier_kind=kind, identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"Safe Browsing lookup failed ({err}).", sent_to_source=f"raw({kind})={value}",
                raw={"error": err})
        matches = (data or {}).get("matches", []) if isinstance(data, dict) else []
        if matches:
            types = sorted({m.get("threatType") for m in matches if m.get("threatType")})
            return EnrichmentFinding(
                source="google_safe_browsing", identifier_kind=kind, identifier_sha256=evid,
                status="NUKED", severity="critical",
                detail=f"Safe Browsing flags {value} as {', '.join(types)}.",
                sent_to_source=f"raw({kind})={value}", raw={"matches": matches, "threat_types": types})
        return EnrichmentFinding(
            source="google_safe_browsing", identifier_kind=kind, identifier_sha256=evid,
            status="KNOXED", severity="info",
            detail=f"Safe Browsing: no threat found for {value}.",
            sent_to_source=f"raw({kind})={value}", raw={"matches": []})

    def _crt_sh(self, domain: str, evid: str) -> EnrichmentFinding:
        url = f"https://crt.sh/?q={urllib.parse.quote('%.' + domain)}&output=json"
        if not self.live:
            return EnrichmentFinding(
                source="crt_sh", identifier_kind="domain", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail=f"Offline: would query crt.sh Certificate Transparency for {domain} (exposes subdomains / identity<->domain linkage).",
                sent_to_source=f"domain={domain}", raw={"url": url})
        data, err = _http_get_json(url, timeout=_DEFAULT_TIMEOUT * 2)
        if err:
            return EnrichmentFinding(
                source="crt_sh", identifier_kind="domain", identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"crt.sh lookup failed ({err}).", sent_to_source=f"domain={domain}",
                raw={"error": err})
        rows = data if isinstance(data, list) else []
        sans = set()
        for row in rows[:200]:
            nv = (row.get("name_value") or "").replace(" ", "")
            for san in nv.split(","):
                san = san.strip().lower()
                if san and "@" in san:
                    sans.add(san)  # email-in-SAN = identity leakage
                elif san:
                    sans.add(san)
        emails = sorted({s for s in sans if "@" in s})
        subdomains = sorted({s for s in sans if "@" not in s})[:20]
        if emails:
            return EnrichmentFinding(
                source="crt_sh", identifier_kind="domain", identifier_sha256=evid,
                status="NUKED", severity="high",
                detail=(f"crt.sh: {len(rows)} CT log entries for {domain}; {len(emails)} email(s) "
                        f"embedded in certificate SANs (identity leakage): {emails}."),
                sent_to_source=f"domain={domain}",
                raw={"entry_count": len(rows), "emails_in_sans": emails, "sample_subdomains": subdomains})
        return EnrichmentFinding(
            source="crt_sh", identifier_kind="domain", identifier_sha256=evid,
            status="MONITORED" if rows else "KNOXED", severity="medium" if rows else "info",
            detail=(f"crt.sh: {len(rows)} CT log entries for {domain}; no emails in SANs; "
                    f"sample subdomains: {subdomains}.") if rows else
                   f"crt.sh: no Certificate Transparency entries found for {domain}.",
            sent_to_source=f"domain={domain}",
            raw={"entry_count": len(rows), "sample_subdomains": subdomains})

    def _abuseipdb(self, ip: str, evid: str) -> EnrichmentFinding:
        if not _ABUSEIPDB_KEY:
            return EnrichmentFinding(
                source="abuseipdb", identifier_kind="ip", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail="AbuseIPDB skipped (set ABUSEIPDB_KEY to enable the free 1000/day tier).",
                sent_to_source="none", raw={"configured": False})
        url = (f"https://api.abuseipdb.com/api/v2/check?ipAddress={urllib.parse.quote(ip)}"
               f"&maxAgeInDays=90&verbose")
        if not self.live:
            return EnrichmentFinding(
                source="abuseipdb", identifier_kind="ip", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail="Offline: would query AbuseIPDB v2 check for abuse confidence score.",
                sent_to_source=f"raw(ip)={ip}", raw={"url": url})
        data, err = _http_get_json(url, headers={"Key": _ABUSEIPDB_KEY, "Accept": "application/json"})
        if err or not isinstance(data, dict):
            return EnrichmentFinding(
                source="abuseipdb", identifier_kind="ip", identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"AbuseIPDB lookup failed ({err}).", sent_to_source=f"raw(ip)={ip}",
                raw={"error": err})
        d = data.get("data", {}) or {}
        score = int(d.get("abuseConfidenceScore") or 0)
        if score >= 75:
            return EnrichmentFinding(
                source="abuseipdb", identifier_kind="ip", identifier_sha256=evid,
                status="NUKED", severity="critical",
                detail=f"AbuseIPDB: {ip} has abuse confidence {score}/100 ({d.get('usageType')}, {d.get('countryCode')}).",
                sent_to_source=f"raw(ip)={ip}", raw=d)
        if score >= 25:
            return EnrichmentFinding(
                source="abuseipdb", identifier_kind="ip", identifier_sha256=evid,
                status="MONITORED", severity="medium",
                detail=f"AbuseIPDB: {ip} has abuse confidence {score}/100.",
                sent_to_source=f"raw(ip)={ip}", raw=d)
        return EnrichmentFinding(
            source="abuseipdb", identifier_kind="ip", identifier_sha256=evid,
            status="KNOXED", severity="info",
            detail=f"AbuseIPDB: {ip} clean (confidence {score}/100).",
            sent_to_source=f"raw(ip)={ip}", raw=d)

    def _mastodon(self, handle: str, evid: str) -> EnrichmentFinding:
        handle = handle.lstrip("@")
        if "@" not in handle:
            return EnrichmentFinding(
                source="mastodon", identifier_kind="username", identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"Mastodon: '{handle}' is not an @user@instance handle; skipping federated lookup.",
                sent_to_source="none", raw={"handle": handle})
        user, instance = handle.rsplit("@", 1)
        url = f"https://{instance}/api/v1/accounts/lookup?acct={urllib.parse.quote(user)}"
        if not self.live:
            return EnrichmentFinding(
                source="mastodon", identifier_kind="username", identifier_sha256=evid,
                status="MONITORED", severity="info",
                detail=f"Offline: would resolve Mastodon @{user}@{instance} profile via the federated API.",
                sent_to_source=f"raw(user@instance)={handle}", raw={"url": url})
        data, err = _http_get_json(url)
        if err or not isinstance(data, dict):
            return EnrichmentFinding(
                source="mastodon", identifier_kind="username", identifier_sha256=evid,
                status="KNOXED", severity="info",
                detail=f"Mastodon: @{user}@{instance} not found ({err}).",
                sent_to_source=f"raw(user@instance)={handle}", raw={"error": err})
        followers = int(data.get("followers_count") or 0)
        return EnrichmentFinding(
            source="mastodon", identifier_kind="username", identifier_sha256=evid,
            status="NUKED" if data.get("discoverable") else "MONITORED",
            severity="medium" if data.get("discoverable") else "info",
            detail=(f"Mastodon @{user}@{instance}: public profile, "
                    f"followers={followers}, discoverable={data.get('discoverable')}."),
            sent_to_source=f"raw(user@instance)={handle}",
            raw={"display_name": data.get("display_name"), "followers": followers,
                 "discoverable": data.get("discoverable"), "url": data.get("url")})


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

free_third_party_enricher = FreeThirdPartyEnricher()


# ---------------------------------------------------------------------------
# Offline self-test (no network)
# ---------------------------------------------------------------------------

def run_tests() -> Dict[str, Any]:
    """Deterministic offline validation of hashing, registry, finding model, and
    the data-broker registry. No network calls are made."""
    results: Dict[str, Any] = {"checks": [], "ok": True}

    def check(name: str, cond: bool, detail: str) -> None:
        results["checks"].append({"name": name, "ok": bool(cond), "detail": detail})
        if not cond:
            results["ok"] = False

    # 1. SHA256 helpers
    h = sha256_hex("test@example.com")
    check("sha256_hex_length", len(h) == 64, f"len={len(h)}")
    check("sha256_hex_known_vector",
          sha256_hex("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
          "NIST FIPS-180 vector for 'abc'")
    check("sha256_prefix_5", sha256_prefix("test@example.com") == h[:5], "prefix matches digest head")
    check("sha1_prefix_5", len(sha1_prefix("x")) == 5, "sha1 prefix length")

    # 2. Registry integrity
    names = [s["name"] for s in FREE_SOURCES_REGISTRY]
    check("registry_unique_names", len(names) == len(set(names)), f"{len(names)} unique sources")
    check("registry_all_free", all(s.get("free") for s in FREE_SOURCES_REGISTRY), "no paid sources")
    expected = {"gravatar", "disify", "cloudflare_doh", "crt_sh",
                "google_safe_browsing", "abuseipdb", "mastodon",
                "data_broker_opt_out", "breach_k_anon"}
    check("registry_sources_present", expected.issubset(set(names)),
          f"present={sorted(expected & set(names))}")

    # 3. Offline email enrichment (no network, live=False default)
    en = FreeThirdPartyEnricher(live=False)
    findings = en.enrich_email("Test@Example.com ")
    check("email_offline_returns_findings", len(findings) >= 3,
          f"got {len(findings)} findings")
    check("email_canonicalised", all(f.identifier_sha256 == sha256_hex("test@example.com")
                                     for f in findings), "canonicalisation consistent")
    check("email_gravatar_uses_sha256",
          any(f.source == "gravatar" and f.sent_to_source.startswith("sha256(email)=")
              for f in findings), "Gravatar sends SHA256(email)")
    check("email_breach_uses_prefix",
          any(f.source == "breach_k_anon" and f.sent_to_source.startswith("sha256_prefix(5)=")
              for f in findings), "breach uses k-anon prefix")

    # 4. Data-broker registry match
    broker_hits = en.data_broker_opt_out("Spokeo")
    check("broker_match_found", len(broker_hits) == 1 and broker_hits[0].status == "NUKED",
          broker_hits[0].detail if broker_hits else "no hits")
    check("broker_offline_no_network",
          all(f.sent_to_source == "none" for f in broker_hits), "registry is fully offline")
    miss = en.data_broker_opt_out("zzznope")
    check("broker_miss_is_knoxed", len(miss) == 1 and miss[0].status == "KNOXED",
          miss[0].detail if miss else "no miss finding")

    # 5. Domain / URL / IP / username offline stubs
    df = en.enrich_domain("example.com")
    check("domain_offline_findings", len(df) >= 2, f"got {len(df)}")
    uf = en.enrich_url("https://example.com/")
    check("url_offline_finding", len(uf) == 1, f"got {len(uf)}")
    ipf = en.enrich_ip("1.1.1.1")
    check("ip_offline_finding", len(ipf) == 1, f"got {len(ipf)}")
    mn = en.enrich_username("@gargron@mastodon.social")
    check("mastodon_offline_finding", len(mn) == 1 and mn[0].source == "mastodon", "mastodon stub")

    # 6. Finding serialization
    check("finding_to_dict_roundtrip",
          all(set(f.to_dict()) >= {"source", "status", "severity", "identifier_sha256",
                                   "sent_to_source"} for f in findings),
          "all required fields present")

    return results


if __name__ == "__main__":
    import pprint
    pprint.pprint(run_tests())
