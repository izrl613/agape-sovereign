"""
V-09: Browser & Cookie Tracker Vector Agent

Enriches browser/cookie tracking analysis with free third-party sources:
- Google Safe Browsing — flags visited URLs / cookie domains already indexed
  as malware/phishing/unwanted software (free key optional).
- Cloudflare DoH — domain DNS posture for tracker domains.
- crt.sh Certificate Transparency — surfaces identity<->domain linkage for
  tracker/domains the user has interacted with.

Identifiers are SHA256-hashed for the local audit trail; raw values are sent
only to the specific source that requires them (per-finding sent_to_source).
Network calls are gated behind AGAPE_LIVE_ENRICHMENT=1 (offline-first).
"""
import re
from typing import Dict, Any, List
from .base_vector_agent import BaseVectorAgent, UserQuery


def _get_enricher():
    try:
        from agents.security.free_third_party_sources import free_third_party_enricher
        return free_third_party_enricher
    except Exception:
        return None


_URL_RE = re.compile(r'https?://[^\s<>"]+', re.IGNORECASE)
_DOMAIN_RE = re.compile(r'\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b', re.IGNORECASE)


class BrowserCookieTrackerVectorAgent(BaseVectorAgent):
    def __init__(self):
        super().__init__("V-09", "Browser & Cookie Tracker")

    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "medium",
            "description": "Analyzes browser cookies and tracking domains via free Safe Browsing, DoH, and CT sources",
            "data_types": ["url", "domain", "cookie_domain"],
            "requires_auth": True,
            "processing_modes": ["scan", "analyze", "monitor"],
            "risk_factors": ["tracking_cookies", "browser_fingerprinting", "malware_hosting", "third_party_trackers"],
        }

    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        text = query.query_text or ""
        params = query.parameters or {}
        urls = list(set(params.get("urls", []) or _URL_RE.findall(text)))
        domains = list(set(params.get("domains", []) or params.get("cookie_domains", []) or
                           _DOMAIN_RE.findall(text)))
        domains = [d for d in domains if "@" not in d]
        return {
            "query_text": text,
            "urls": urls,
            "domains": domains,
            "parameters": params,
            "query_type": query.query_type,
        }

    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        enricher = _get_enricher()
        findings: List[str] = []
        enrichment: List[Dict[str, Any]] = []
        sources: set = set()
        critical = 0
        base_risk = 25
        tracker_domains: List[Dict[str, Any]] = []

        def _consume(fs, kind):
            nonlocal critical, base_risk
            for f in fs:
                enrichment.append(f.to_dict())
                sources.add(f.source)
                if f.status in ("NUKED", "MONITORED"):
                    tracker_domains.append({
                        "source": f.source,
                        "status": f.status,
                        "severity": f.severity,
                        "detail": f.detail,
                        "identifier_kind": f.identifier_kind,
                        "identifier_sha256": f.identifier_sha256,
                        "sent_to_source": f.sent_to_source,
                    })
                if f.status == "NUKED":
                    critical += 1
                    base_risk = min(100, base_risk + 18)
                    findings.append(f"NUKED: {f.detail}")
                elif f.status == "MONITORED":
                    base_risk = min(100, base_risk + 5)
                    findings.append(f"MONITORED: {f.detail}")

        if enricher is not None:
            for url in parsed_data.get("urls", []) or []:
                _consume(enricher.enrich_url(url), "url")
            for domain in parsed_data.get("domains", []) or []:
                _consume(enricher.enrich_domain(domain), "domain")
        else:
            findings.append("Free third-party enricher unavailable; browser/tracker enrichment skipped.")

        if not findings:
            findings.append("Browser tracking analysis completed; no tracker indicators parsed from query.")

        risk_level = "critical" if critical > 0 else ("high" if base_risk > 30 else "medium")

        return {
            "findings": findings,
            "risk_level": risk_level,
            "base_risk_score": base_risk,
            "critical_findings": critical,
            "confidence": 0.76 if enricher is not None else 0.6,
            "tracker_domains": tracker_domains,
            "enrichment_findings": enrichment,
            "sources_consulted": sorted(sources),
        }

    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "vector_type": "browser_tracking",
            "vector_id": self.vector_id,
            "risk_level": processed_data["risk_level"],
            "tracker_domain_count": len(processed_data.get("tracker_domains", [])),
            "tracker_domains": processed_data.get("tracker_domains", []),
            "free_third_party_enrichment": {
                "sources_consulted": processed_data.get("sources_consulted", []),
                "findings": processed_data.get("enrichment_findings", []),
                "hashing": "SHA256 (url/domain hashed for audit; raw value sent only to the requiring source)",
            },
            "requires_automated_response": processed_data["critical_findings"] > 0,
        }
