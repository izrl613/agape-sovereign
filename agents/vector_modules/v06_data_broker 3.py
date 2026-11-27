"""
V-06: Data Broker Removal Vector Agent

Resolves free, offline data-broker opt-out endpoints from the embedded registry
(agents/security/free_third_party_sources.DATA_BROKER_REGISTRY) so a user can
submit GDPR Art.16/17/21, CCPA, and ECRA 2026 rectification/erasure requests
without any network dependency. Identifier queries are SHA256-hashed for the
audit trail; the registry lookup itself sends nothing off-device.
"""
import hashlib
from typing import Dict, Any, List
from .base_vector_agent import BaseVectorAgent, UserQuery


def _get_enricher():
    try:
        from agents.security.free_third_party_sources import free_third_party_enricher, DATA_BROKER_REGISTRY
        return free_third_party_enricher, DATA_BROKER_REGISTRY
    except Exception:
        return None, []


class DataBrokerRemovalVectorAgent(BaseVectorAgent):
    def __init__(self):
        super().__init__("V-06", "Data Broker Removal")

    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "high",
            "description": "Resolves free data-broker opt-out endpoints for rectification/erasure (GDPR/CCPA/ECRA 2026)",
            "data_types": ["name", "email", "broker_keyword", "category"],
            "requires_auth": True,
            "processing_modes": ["scan", "erase", "monitor"],
            "risk_factors": ["data_broker_listings", "people_search_exposure", "background_check_exposure"],
        }

    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        text = (query.query_text or "").strip()
        params = query.parameters or {}
        broker_query = params.get("broker_query") or params.get("name") or params.get("broker") or text
        return {
            "query_text": text,
            "broker_query": broker_query,
            "parameters": params,
            "query_type": query.query_type,
        }

    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        enricher, registry = _get_enricher()
        findings: List[str] = []
        enrichment: List[Dict[str, Any]] = []
        opt_out_targets: List[Dict[str, Any]] = []
        critical = 0
        base_risk = 25

        broker_query = (parsed_data.get("broker_query") or "").strip()
        if enricher is not None and broker_query:
            for f in enricher.data_broker_opt_out(broker_query):
                enrichment.append(f.to_dict())
                if f.status == "NUKED":
                    critical += 1
                    base_risk = min(100, base_risk + 15)
                    raw = f.raw or {}
                    opt_out_targets.append({
                        "broker": raw.get("broker"),
                        "category": raw.get("category"),
                        "opt_out_url": raw.get("opt_out_url"),
                    })
                    findings.append(f"NUKED: {f.detail}")
                else:
                    findings.append(f"KNOXED: {f.detail}")
        elif registry:
            findings.append("No broker query supplied; registry available for category sweeps.")
        else:
            findings.append("Data broker registry unavailable; skipping opt-out resolution.")

        risk_level = "critical" if critical > 0 else ("high" if base_risk > 30 else "medium")

        return {
            "findings": findings or ["Data broker removal status checked"],
            "risk_level": risk_level,
            "base_risk_score": base_risk,
            "critical_findings": critical,
            "confidence": 0.8 if enricher is not None else 0.6,
            "opt_out_targets": opt_out_targets,
            "registry_size": len(registry),
            "enrichment_findings": enrichment,
            "sources_consulted": ["data_broker_opt_out"] if enricher is not None else [],
            "broker_query_sha256": hashlib.sha256(broker_query.encode()).hexdigest() if broker_query else None,
        }

    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "vector_type": "data_broker_removal",
            "vector_id": self.vector_id,
            "risk_level": processed_data["risk_level"],
            "opt_out_targets": processed_data.get("opt_out_targets", []),
            "registry_size": processed_data.get("registry_size", 0),
            "free_third_party_enrichment": {
                "sources_consulted": processed_data.get("sources_consulted", []),
                "findings": processed_data.get("enrichment_findings", []),
                "hashing": "SHA256 (query hashed for audit; registry lookup is fully offline)",
            },
            "requires_automated_response": processed_data["critical_findings"] > 0,
        }
