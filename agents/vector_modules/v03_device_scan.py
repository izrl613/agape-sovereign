"""
V-03: Device File Scan Vector Agent

Processes local device file analysis, document scanning, and local data exposure
before Architect AI processing.
"""

import os
import re
import hashlib
from typing import Dict, Any, List
from datetime import datetime
from .base_vector_agent import BaseVectorAgent, UserQuery


class DeviceFileScanVectorAgent(BaseVectorAgent):
    """V-03 Device File Scan - Processes local file security vectors"""
    
    def __init__(self):
        super().__init__("V-03", "Device File Scan")
    
    def get_vector_config(self) -> Dict[str, Any]:
        return {
            "priority": "high",
            "description": "Scans local device files for sensitive data exposure and document security",
            "data_types": ["file_paths", "file_types", "document_content"],
            "scan_modes": ["quick", "deep", "custom"],
            "risk_factors": ["sensitive_documents", "data_leakage", "unencrypted_files"]
        }
    
    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        """Parse file paths and scan parameters from user query"""
        parsed = {
            "file_paths": [],
            "file_types": [],
            "scan_mode": query.parameters.get("scan_mode", "quick"),
            "directories": [],
            "parameters": query.parameters
        }
        
        # Extract file paths from query
        path_pattern = r'[\s/~]?([/\w\-.]+/[\w\-.]+)'
        paths = re.findall(path_pattern, query.query_text)
        parsed["file_paths"] = paths
        
        # Extract file extensions
        ext_pattern = r'\.(\w{3,4})\b'
        extensions = re.findall(ext_pattern, query.query_text)
        parsed["file_types"] = list(set(extensions))
        
        # Check for directory specifications
        if "directories" in query.parameters:
            parsed["directories"] = query.parameters["directories"]
        
        return parsed
    
    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process file scan data for sensitive content analysis"""
        processed = {
            "findings": [],
            "risk_level": "low",
            "base_risk_score": 0,
            "critical_findings": 0,
            "confidence": 0.75,
            "scanned_files": [],
            "sensitive_files": [],
            "security_recommendations": []
        }
        
        # Simulate file scanning (in production, implement actual file system scanning)
        for file_path in parsed_data["file_paths"][:10]:  # Limit for demo
            file_risk = self._assess_file_risk(file_path, parsed_data["file_types"])
            
            processed["scanned_files"].append({
                "path": file_path,
                "risk_level": file_risk["risk_level"],
                "file_type": file_risk["file_type"],
                "size_estimate": file_risk["size_estimate"]
            })
            
            if file_risk["risk_level"] == "high":
                processed["sensitive_files"].append(file_path)
                processed["critical_findings"] += 1
                processed["base_risk_score"] += 20
            elif file_risk["risk_level"] == "medium":
                processed["base_risk_score"] += 10
        
        # Calculate overall risk
        if processed["critical_findings"] > 2:
            processed["risk_level"] = "critical"
        elif processed["base_risk_score"] > 40:
            processed["risk_level"] = "high"
        elif processed["base_risk_score"] > 20:
            processed["risk_level"] = "medium"
        
        processed["security_recommendations"] = self._generate_security_recommendations(
            processed["sensitive_files"]
        )
        
        return processed
    
    def _assess_file_risk(self, file_path: str, file_types: List[str]) -> Dict[str, Any]:
        """Assess risk level for a specific file"""
        sensitive_extensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"]
        high_risk_keywords = ["password", "secret", "key", "token", "credential", "ssn"]
        
        file_ext = os.path.splitext(file_path)[1].lower()
        is_sensitive_type = file_ext in sensitive_extensions
        
        risk_level = "low"
        if is_sensitive_type:
            risk_level = "medium"
            if any(keyword in file_path.lower() for keyword in high_risk_keywords):
                risk_level = "high"
        
        return {
            "risk_level": risk_level,
            "file_type": file_ext,
            "size_estimate": "unknown"  # In production, get actual file size
        }
    
    def _generate_security_recommendations(self, sensitive_files: List[str]) -> List[str]:
        """Generate file security recommendations"""
        return [
            "Encrypt sensitive files with strong encryption",
            "Implement file access controls and permissions",
            "Regularly audit file system for unauthorized changes",
            "Use secure deletion methods for sensitive data",
            "Maintain backups of important files in secure locations"
        ]
    
    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured payload for Architect AI"""
        return {
            "vector_type": "device_file_scan",
            "vector_id": self.vector_id,
            "analysis_summary": {
                "total_files_scanned": len(processed_data["scanned_files"]),
                "sensitive_files_found": len(processed_data["sensitive_files"]),
                "risk_level": processed_data["risk_level"]
            },
            "detailed_findings": {
                "scanned_files": processed_data["scanned_files"],
                "sensitive_files": processed_data["sensitive_files"]
            },
            "security_recommendations": processed_data["security_recommendations"],
            "priority_for_architect": "high" if processed_data["risk_level"] == "critical" else "standard"
        }