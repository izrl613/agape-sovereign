"""
V-14: Dark Web Monitoring Vector Agent

Enriches dark-web / exposure analysis with free third-party sources:
- crt.sh Certificate Transparency — surfaces domains/certs (and emails leaked
  into certificate SANs) linked to an identity, a common precursor to targeted
  dark-web credential dumps.
- Google Safe Browsing — flags URLs/domains already indexed as malware/phishing.
- AbuseIPDB — abuse-confidence score for IPs observed in underground context.

Identifiers are SHA256-hashed for the local audit trail; raw values are sent
only to the specific source that requires them (recorded per finding). All
network calls are gated behind AGAPE_LIVE_ENRICHMENT=1 (offline-first).
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
_IP_RE = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')


class DarkWebMonitoringVectorAgent(BaseVectorAgent):
    def __init__(self):
        super().__init__("V-14", "Dark Web Monitoring")

    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "critical",
            "description": "Continuous dark web / exposure monitoring via free CT, Safe Browsing, and IP-reputation sources",
            "data_types": ["domain", "url", "ip", "email"],
            "requires_auth": True,
            "processing_modes": ["scan", "monitor", "analyze"],
            "risk_factors": ["dark_web_leaks", "underground_markets", "ct_identity_leak", "malware_hosting"],
        }

    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        text = query.query_text or ""
        params = query.parameters or {}
        return {
            "query_text": text,
            "domains": list(set(params.get("domains", []) or _DOMAIN_RE.findall(text))),
            "urls": list(set(params.get("urls", []) or _URL_RE.findall(text))),
            "ips": list(set(params.get("ips", []) or _IP_RE.findall(text))),
            "parameters": params,
            "query_type": query.query_type,
        }

    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        enricher = _get_enricher()
        findings: List[str] = []
        enrichment: List[Dict[str, Any]] = []
        sources: set = set()
        critical = 0
        base_risk = 35
        exposures: List[Dict[str, Any]] = []

        def _consume(fs):
            nonlocal critical, base_risk
            for f in fs:
                enrichment.append(f.to_dict())
                sources.add(f.source)
                exposures.append({
                    "source": f.source,
                    "status": f.status,
                    "severity": f.severity,
                    "detail": f.detail,
                    "identifier_sha256": f.identifier_sha256,
                    "sent_to_source": f.sent_to_source,
                })
                if f.status == "NUKED":
                    critical += 1
                    base_risk = min(100, base_risk + 20)
                    findings.append(f"NUKED: {f.detail}")
                elif f.status == "MONITORED":
                    findings.append(f"MONITORED: {f.detail}")

        if enricher is not None:
            for d in parsed_data.get("domains", []) or []:
                _consume(enricher.enrich_domain(d))
            for u in parsed_data.get("urls", []) or []:
                _consume(enricher.enrich_url(u))
            for ip in parsed_data.get("ips", []) or []:
                _consume(enricher.enrich_ip(ip))
        else:
            findings.append("Free third-party enricher unavailable; dark-web enrichment skipped.")

        if not findings:
            findings.append("Dark web monitoring active; no exposure indicators parsed from query.")

        risk_level = "critical" if critical > 0 else ("high" if base_risk > 30 else "medium")

        return {
            "findings": findings,
            "risk_level": risk_level,
            "base_risk_score": base_risk,
            "critical_findings": critical,
            "confidence": 0.75 if enricher is not None else 0.5,
            "exposures": exposures,
            "enrichment_findings": enrichment,
            "sources_consulted": sorted(sources),
        }

    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "vector_type": "dark_web_monitoring",
            "vector_id": self.vector_id,
            "risk_level": processed_data["risk_level"],
            "exposure_count": len(processed_data.get("exposures", [])),
            "exposures": processed_data.get("exposures", []),
            "free_third_party_enrichment": {
                "sources_consulted": processed_data.get("sources_consulted", []),
                "findings": processed_data.get("enrichment_findings", []),
                "hashing": "SHA256 (identifier hashed for audit; raw value sent only to the requiring source)",
            },
            "requires_automated_response": processed_data["critical_findings"] > 0,
        }
