"""
V-05: Deep Web Exposure Vector Agent

Enriches deep-web / credential-exposure analysis with free third-party sources:
- crt.sh Certificate Transparency — domains/certs (and emails leaked into
  certificate SANs) linked to an identity.
- Breach k-anonymity feed — SHA256 5-hex prefix search (configure via
  AGAPE_BREACH_FEED); only the prefix leaves the device.
- Cloudflare DoH — domain DNS posture; Google Safe Browsing — URL/domain
  threat flagging (free key optional); AbuseIPDB — IP abuse score (free tier).

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


_EMAIL_RE = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
_DOMAIN_RE = re.compile(r'\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b', re.IGNORECASE)
_IP_RE = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')


class DeepWebExposureVectorAgent(BaseVectorAgent):
    def __init__(self):
        super().__init__("V-05", "Deep Web Exposure")

    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "critical",
            "description": "Deep web / credential exposure monitoring via free CT, breach k-anon, DoH, Safe Browsing, and IP-reputation sources",
            "data_types": ["email", "domain", "url", "ip"],
            "requires_auth": True,
            "processing_modes": ["scan", "monitor", "analyze"],
            "risk_factors": ["data_leaks", "credential_exposure", "ct_identity_leak", "malware_hosting"],
        }

    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        text = query.query_text or ""
        params = query.parameters or {}
        # Strip emails out of domain list to avoid double-counting
        emails = set(params.get("emails", []) or _EMAIL_RE.findall(text))
        domains = set(params.get("domains", []) or _DOMAIN_RE.findall(text))
        domains = {d for d in domains if "@" not in d}
        return {
            "query_text": text,
            "emails": list(emails),
            "domains": list(domains),
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
        base_risk = 30
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
                    base_risk = min(100, base_risk + 22)
                    findings.append(f"NUKED: {f.detail}")
                elif f.status == "MONITORED":
                    findings.append(f"MONITORED: {f.detail}")

        if enricher is not None:
            for email in parsed_data.get("emails", []) or []:
                _consume(enricher.enrich_email(email))
            for domain in parsed_data.get("domains", []) or []:
                _consume(enricher.enrich_domain(domain))
            for ip in parsed_data.get("ips", []) or []:
                _consume(enricher.enrich_ip(ip))
        else:
            findings.append("Free third-party enricher unavailable; deep-web enrichment skipped.")

        if not findings:
            findings.append("Deep web monitoring active; no exposure indicators parsed from query.")

        risk_level = "critical" if critical > 0 else ("high" if base_risk > 30 else "medium")

        return {
            "findings": findings,
            "risk_level": risk_level,
            "base_risk_score": base_risk,
            "critical_findings": critical,
            "confidence": 0.78 if enricher is not None else 0.55,
            "exposures": exposures,
            "enrichment_findings": enrichment,
            "sources_consulted": sorted(sources),
        }

    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "vector_type": "deep_web_exposure",
            "vector_id": self.vector_id,
            "risk_level": processed_data["risk_level"],
            "exposure_count": len(processed_data.get("exposures", [])),
            "exposures": processed_data.get("exposures", []),
            "free_third_party_enrichment": {
                "sources_consulted": processed_data.get("sources_consulted", []),
                "findings": processed_data.get("enrichment_findings", []),
                "hashing": "SHA256 (Gravatar full hash; breach feed k-anonymity 5-hex prefix; raw value sent only to requiring source)",
            },
            "requires_automated_response": processed_data["critical_findings"] > 0,
        }
