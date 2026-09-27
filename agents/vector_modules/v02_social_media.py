"""
V-02: Social Media Footprint Vector Agent

Processes social media handles, profiles, and digital footprint analysis
before Architect AI processing.
"""

import re
import hashlib
from typing import Dict, Any, List
from datetime import datetime
from .base_vector_agent import BaseVectorAgent, UserQuery


def _get_enricher():
    """Lazy load the free third-party enricher (Mastodon federated lookup +
    Gravatar SHA256(email) profile). Returns None if unavailable."""
    try:
        from agents.security.free_third_party_sources import free_third_party_enricher
        return free_third_party_enricher
    except Exception:
        return None


_MASTODON_RE = re.compile(r'@([A-Za-z0-9_]+)@((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,})', re.IGNORECASE)


class SocialMediaFootprintVectorAgent(BaseVectorAgent):
    """V-02 Social Media Footprint - Processes social media security vectors"""
    
    def __init__(self):
        super().__init__("V-02", "Social Media Footprint")
    
    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "high",
            "description": "Analyzes social media presence, profile exposure, and digital footprint",
            "data_types": ["social_handles", "usernames", "profile_urls"],
            "platforms": ["twitter", "facebook", "instagram", "linkedin", "tiktok", "reddit"],
            "risk_factors": ["profile_exposure", "personal_data_leakage", "account_compromise"]
        }
    
    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        """Parse social media handles and usernames from user query"""
        parsed = {
            "handles": [],
            "usernames": [],
            "platforms": [],
            "mastodon_handles": [],
            "parameters": query.parameters
        }

        # Common social media patterns
        patterns = {
            "twitter": r'@(\w{1,15})',
            "instagram": r'instagram\.com/(\w+)',
            "facebook": r'facebook\.com/([\w.]+)',
            "linkedin": r'linkedin\.com/in/([\w-]+)',
            "tiktok": r'tiktok\.com/@(\w+)',
            "reddit": r'reddit\.com/user/(\w+)'
        }

        for platform, pattern in patterns.items():
            matches = re.findall(pattern, query.query_text, re.IGNORECASE)
            for match in matches:
                parsed["handles"].append({
                    "platform": platform,
                    "handle": match,
                    "full_handle": f"@{match}" if platform == "twitter" else match
                })
                if platform not in parsed["platforms"]:
                    parsed["platforms"].append(platform)

        # Mastodon / federated handles: @user@instance (free, no-key enrichment)
        for user, instance in _MASTODON_RE.findall(query.query_text or ""):
            full = f"@{user}@{instance}"
            if full not in parsed["mastodon_handles"]:
                parsed["mastodon_handles"].append(full)
            if "mastodon" not in parsed["platforms"]:
                parsed["platforms"].append("mastodon")

        # Extract standalone usernames
        username_pattern = r'\b(?<!@)(\w{3,20})\b'
        usernames = re.findall(username_pattern, query.query_text)
        parsed["usernames"] = list(set(usernames))

        return parsed
    
    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process social media data for exposure analysis"""
        processed = {
            "findings": [],
            "risk_level": "low",
            "base_risk_score": 0,
            "critical_findings": 0,
            "confidence": 0.85,
            "profile_analysis": [],
            "exposure_risks": [],
            "privacy_recommendations": [],
            "enrichment_findings": [],
            "sources_consulted": []
        }

        enricher = _get_enricher()
        sources_seen: set = set()

        # Free federated enrichment for Mastodon @user@instance handles
        if enricher is not None:
            for handle in parsed_data.get("mastodon_handles", []) or []:
                for f in enricher.enrich_username(handle):
                    processed["enrichment_findings"].append(f.to_dict())
                    sources_seen.add(f.source)
                    if f.status == "NUKED":
                        processed["critical_findings"] += 1
                        processed["base_risk_score"] += 12
                        processed["exposure_risks"].append(f"Public Mastodon profile exposed: {handle}")
                        processed["findings"].append(f"NUKED: {f.detail}")
                    elif f.status == "MONITORED":
                        processed["findings"].append(f"MONITORED: {f.detail}")

        if not parsed_data["handles"] and not parsed_data.get("mastodon_handles"):
            processed["findings"].append("No social media handles detected")
            processed["sources_consulted"] = sorted(sources_seen)
            return processed
        
        # Analyze each social media handle
        for handle_data in parsed_data["handles"]:
            platform = handle_data["platform"]
            handle = handle_data["handle"]
            
            profile_risk = self._assess_profile_risk(platform, handle)
            
            processed["profile_analysis"].append({
                "platform": platform,
                "handle": handle,
                "privacy_score": profile_risk["privacy_score"],
                "exposure_level": profile_risk["exposure_level"],
                "data_exposed": profile_risk["exposed_data"]
            })
            
            if profile_risk["exposure_level"] == "high":
                processed["exposure_risks"].append(
                    f"High exposure on {platform}: {handle}"
                )
                processed["critical_findings"] += 1
                processed["base_risk_score"] += 15
            elif profile_risk["exposure_level"] == "medium":
                processed["base_risk_score"] += 8
        
        # Check for username reuse across platforms
        if len(parsed_data["usernames"]) > 0:
            reuse_risk = self._check_username_reuse(parsed_data["usernames"])
            if reuse_risk["high_reuse"]:
                processed["findings"].append("Username reuse detected across platforms")
                processed["base_risk_score"] += 10
        
        # Calculate overall risk
        if processed["critical_findings"] > 2:
            processed["risk_level"] = "critical"
        elif processed["base_risk_score"] > 30:
            processed["risk_level"] = "high"
        elif processed["base_risk_score"] > 15:
            processed["risk_level"] = "medium"
        
        processed["privacy_recommendations"] = self._generate_privacy_recommendations(
            processed["profile_analysis"]
        )

        processed["sources_consulted"] = sorted(sources_seen)
        return processed
    
    def _assess_profile_risk(self, platform: str, handle: str) -> Dict[str, Any]:
        """Assess risk level for social media profile"""
        # In production, integrate with social media APIs for actual analysis
        
        platform_risk_levels = {
            "facebook": {"privacy_score": 60, "exposure_level": "medium"},
            "twitter": {"privacy_score": 40, "exposure_level": "high"},
            "instagram": {"privacy_score": 50, "exposure_level": "medium"},
            "linkedin": {"privacy_score": 70, "exposure_level": "low"},
            "tiktok": {"privacy_score": 30, "exposure_level": "high"},
            "reddit": {"privacy_score": 45, "exposure_level": "medium"}
        }
        
        default_risk = {"privacy_score": 50, "exposure_level": "medium"}
        risk = platform_risk_levels.get(platform.lower(), default_risk)
        
        exposed_data_map = {
            "high": ["full_name", "location", "birth_date", "photos", "connections"],
            "medium": ["username", "profile_picture", "bio"],
            "low": ["username", "limited_profile"]
        }
        
        return {
            "privacy_score": risk["privacy_score"],
            "exposure_level": risk["exposure_level"],
            "exposed_data": exposed_data_map.get(risk["exposure_level"], [])
        }
    
    def _check_username_reuse(self, usernames: List[str]) -> Dict[str, Any]:
        """Check for username reuse across platforms"""
        # Simulate username reuse detection
        return {
            "high_reuse": len(usernames) > 3,
            "unique_usernames": len(set(usernames)),
            "total_mentions": len(usernames)
        }
    
    def _generate_privacy_recommendations(self, profile_analysis: List[Dict]) -> List[str]:
        """Generate privacy recommendations"""
        return [
            "Review privacy settings on all social media platforms",
            "Enable two-factor authentication on social accounts",
            "Limit personal information in public profiles",
            "Regularly audit connected apps and permissions",
            "Consider using platform-specific usernames to reduce cross-platform tracking"
        ]
    
    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured payload for Architect AI"""
        return {
            "vector_type": "social_media_footprint",
            "vector_id": self.vector_id,
            "analysis_summary": {
                "total_profiles_analyzed": len(processed_data["profile_analysis"]),
                "high_exposure_count": processed_data["critical_findings"],
                "risk_level": processed_data["risk_level"]
            },
            "detailed_findings": {
                "profile_analysis": processed_data["profile_analysis"],
                "exposure_risks": processed_data["exposure_risks"]
            },
            "free_third_party_enrichment": {
                "sources_consulted": processed_data.get("sources_consulted", []),
                "finding_count": len(processed_data.get("enrichment_findings", [])),
                "findings": processed_data.get("enrichment_findings", []),
                "hashing": "SHA256 (handle hashed for audit; Mastodon lookup sends user@instance to the named instance only)",
            },
            "privacy_recommendations": processed_data["privacy_recommendations"],
            "priority_for_architect": "high" if processed_data["risk_level"] == "critical" else "standard"
        }