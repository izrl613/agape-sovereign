"""
V-01: Email Breach Scanner Vector Agent

Processes email addresses and domains for breach detection, dark web exposure,
and data leak monitoring before Architect AI analysis.
"""

import re
import hashlib
from typing import Dict, Any, List
from datetime import datetime
from .base_vector_agent import BaseVectorAgent, UserQuery, VectorStatus


class EmailBreachVectorAgent(BaseVectorAgent):
    """V-01 Email Breach Scanner - Processes email security vectors"""
    
    def __init__(self):
        super().__init__("V-01", "Email Breach Scanner")
    
    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "critical",
            "description": "Scans email addresses for data breaches, dark web exposure, and security risks",
            "data_types": ["email", "domain", "email_pattern"],
            "requires_auth": True,
            "processing_modes": ["scan", "monitor", "analyze"],
            "risk_factors": ["breached_accounts", "password_reuse", "domain_reputation"]
        }
    
    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        """Parse email addresses and parameters from user query"""
        parsed = {
            "emails": [],
            "domains": [],
            "parameters": query.parameters,
            "query_type": query.query_type
        }
        
        # Extract email addresses from query text
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails_found = re.findall(email_pattern, query.query_text, re.IGNORECASE)
        parsed["emails"] = list(set(emails_found))  # Remove duplicates
        
        # Extract domains from emails
        for email in parsed["emails"]:
            domain = email.split('@')[1] if '@' in email else None
            if domain and domain not in parsed["domains"]:
                parsed["domains"].append(domain)
        
        # Add any explicitly provided domains
        if "domains" in query.parameters:
            parsed["domains"].extend(query.parameters["domains"])
        
        # Validate email format
        parsed["valid_emails"] = [self._validate_email(email) for email in parsed["emails"]]
        parsed["valid_emails"] = [e for e in parsed["valid_emails"] if e is not None]
        
        return parsed
    
    def _validate_email(self, email: str) -> str:
        """Validate email format and return normalized version"""
        email = email.strip().lower()
        if re.match(r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$', email):
            return email
        return None
    
    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process email data for breach detection and risk analysis"""
        processed = {
            "findings": [],
            "risk_level": "low",
            "base_risk_score": 0,
            "critical_findings": 0,
            "confidence": 0.9,
            "breached_accounts": [],
            "domain_reputation": {},
            "security_recommendations": []
        }
        
        if not parsed_data["valid_emails"]:
            processed["findings"].append("No valid email addresses provided")
            return processed
        
        # Process each email
        for email in parsed_data["valid_emails"]:
            email_hash = hashlib.sha256(email.encode()).hexdigest()[:16]
            domain = email.split('@')[1]
            
            # Simulate breach detection (in production, integrate with breach APIs)
            breach_risk = self._assess_breach_risk(email, domain)
            
            if breach_risk["breached"]:
                processed["breached_accounts"].append({
                    "email": email,
                    "email_hash": email_hash,
                    "breach_sources": breach_risk["sources"],
                    "breach_date": breach_risk["date"],
                    "exposed_data": breach_risk["exposed_data"]
                })
                processed["critical_findings"] += 1
                processed["findings"].append(f"CRITICAL: Email {email} found in data breaches")
            
            # Domain reputation check
            domain_rep = self._check_domain_reputation(domain)
            processed["domain_reputation"][domain] = domain_rep
            
            if domain_rep["suspicious"]:
                processed["findings"].append(f"WARN: Domain {domain} has poor reputation")
                processed["base_risk_score"] += 20
        
        # Calculate overall risk level
        if processed["critical_findings"] > 0:
            processed["risk_level"] = "critical"
            processed["base_risk_score"] += 50
        elif processed["base_risk_score"] > 30:
            processed["risk_level"] = "high"
        elif processed["base_risk_score"] > 10:
            processed["risk_level"] = "medium"
        
        # Generate security recommendations
        processed["security_recommendations"] = self._generate_recommendations(
            parsed_data["valid_emails"], 
            processed["breached_accounts"]
        )
        
        return processed
    
    def _assess_breach_risk(self, email: str, domain: str) -> Dict[str, Any]:
        """Assess breach risk for email (simulated - integrate with real APIs in production)"""
        # In production, integrate with: Have I Been Pwned, Breach Directory, etc.
        # This is a simulation for demonstration
        
        email_hash = hashlib.md5(email.encode()).hexdigest()
        
        # Simulated breach detection based on email patterns
        common_breached_domains = ["gmail.com", "yahoo.com", "hotmail.com", "aol.com"]
        recently_breached = ["linkedin.com", "adobe.com", "dropbox.com"]
        
        risk_assessment = {
            "breached": False,
            "sources": [],
            "date": None,
            "exposed_data": []
        }
        
        # Simulate breach detection logic
        if domain in common_breached_domains and len(email) > 15:
            risk_assessment["breached"] = True
            risk_assessment["sources"] = ["LinkedIn Breach 2016", "Adobe Breach 2013"]
            risk_assessment["date"] = "2016-05-17"
            risk_assessment["exposed_data"] = ["email", "hashed_password"]
        
        return risk_assessment
    
    def _check_domain_reputation(self, domain: str) -> Dict[str, Any]:
        """Check domain reputation (simulated)"""
        # In production, integrate with: Google Safe Browsing, VirusTotal, etc.
        
        suspicious_tlds = [".xyz", ".top", ".zip", ".mov", ".tk"]
        suspicious = any(domain.endswith(tld) for tld in suspicious_tlds)
        
        return {
            "domain": domain,
            "reputation_score": 20 if suspicious else 80,
            "suspicious": suspicious,
            "categories": ["email"] if not suspicious else ["suspicious", "email"],
            "last_checked": datetime.utcnow().isoformat()
        }
    
    def _generate_recommendations(self, emails: List[str], breached_accounts: List[Dict]) -> List[str]:
        """Generate security recommendations based on findings"""
        recommendations = [
            "Enable two-factor authentication on all email accounts",
            "Use unique passwords for each email account",
            "Monitor email accounts for unauthorized access"
        ]
        
        if breached_accounts:
            recommendations.extend([
                "Change passwords immediately for breached accounts",
                "Check for forwarded email rules (sign of compromise)",
                "Review account recovery settings"
            ])
        
        return recommendations
    
    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured payload for Architect AI"""
        return {
            "vector_type": "email_breach",
            "vector_id": self.vector_id,
            "analysis_summary": {
                "total_emails_analyzed": len(processed_data.get("breached_accounts", [])),
                "breached_count": processed_data["critical_findings"],
                "risk_level": processed_data["risk_level"],
                "domain_reputation_summary": processed_data["domain_reputation"]
            },
            "detailed_findings": {
                "breached_accounts": processed_data["breached_accounts"],
                "suspicious_domains": [
                    d for d, rep in processed_data["domain_reputation"].items() 
                    if rep["suspicious"]
                ]
            },
            "security_recommendations": processed_data["security_recommendations"],
            "priority_for_architect": "immediate" if processed_data["risk_level"] == "critical" else "standard",
            "requires_automated_response": processed_data["critical_findings"] > 0
        }