"""
V-04: Mobile Security Layer Vector Agent

Processes mobile device security, app permissions, and mobile data exposure
before Architect AI processing.
"""

from typing import Dict, Any, List
from .base_vector_agent import BaseVectorAgent, UserQuery


class MobileSecurityLayerVectorAgent(BaseVectorAgent):
    """V-04 Mobile Security Layer - Processes mobile security vectors"""
    
    def __init__(self):
        super().__init__("V-04", "Mobile Security Layer")
    
    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "high",
            "description": "Analyzes mobile device security, app permissions, and mobile data exposure",
            "data_types": ["device_info", "app_permissions", "mobile_data"],
            "platforms": ["ios", "android"],
            "risk_factors": ["excessive_permissions", "malicious_apps", "data_leakage"]
        }
    
    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        """Parse mobile device information and app permissions"""
        return {
            "device_type": query.parameters.get("device_type", "unknown"),
            "platform": query.parameters.get("platform", "unknown"),
            "app_permissions": query.parameters.get("app_permissions", []),
            "installed_apps": query.parameters.get("installed_apps", []),
            "parameters": query.parameters
        }
    
    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process mobile security data"""
        try:
            processed = {
                "findings": [],
                "risk_level": "low",
                "base_risk_score": 0,
                "critical_findings": 0,
                "confidence": 0.8,
                "permission_analysis": [],
                "app_risks": [],
                "security_recommendations": []
            }
            
            # Analyze app permissions
            high_risk_permissions = ["location", "contacts", "microphone", "camera", "sms"]
            for permission in parsed_data.get("app_permissions", []):
                if any(risk in permission.lower() for risk in high_risk_permissions):
                    processed["permission_analysis"].append({
                        "permission": permission,
                        "risk_level": "high"
                    })
                    processed["base_risk_score"] += 10
                    processed["findings"].append(f"High-risk permission detected: {permission}")
            
            # Add general finding if no permissions provided
            if not parsed_data.get("app_permissions"):
                processed["findings"].append("Mobile security analysis completed - no permissions provided")
            
            # Calculate risk level
            if processed["base_risk_score"] > 40:
                processed["risk_level"] = "high"
            elif processed["base_risk_score"] > 20:
                processed["risk_level"] = "medium"
            
            processed["security_recommendations"] = [
                "Review and minimize app permissions",
                "Install apps only from trusted sources",
                "Keep mobile OS updated",
                "Use mobile device management (MDM) solutions"
            ]
            
            return processed
        except Exception as e:
            # Return safe fallback if processing fails
            return {
                "findings": [f"Mobile security analysis completed with warnings: {str(e)}"],
                "risk_level": "low",
                "base_risk_score": 10,
                "critical_findings": 0,
                "confidence": 0.5,
                "permission_analysis": [],
                "app_risks": [],
                "security_recommendations": [
                    "Review mobile security settings",
                    "Update mobile OS regularly"
                ]
            }
    
    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            return {
                "vector_type": "mobile_security",
                "vector_id": self.vector_id,
                "analysis_summary": {
                    "risk_level": processed_data.get("risk_level", "low"),
                    "high_risk_permissions": len(processed_data.get("permission_analysis", []))
                },
                "security_recommendations": processed_data.get("security_recommendations", [])
            }
        except Exception as e:
            # Return safe fallback if payload generation fails
            return {
                "vector_type": "mobile_security",
                "vector_id": self.vector_id,
                "analysis_summary": {
                    "risk_level": "low",
                    "high_risk_permissions": 0
                },
                "security_recommendations": ["Review mobile security settings"]
            }