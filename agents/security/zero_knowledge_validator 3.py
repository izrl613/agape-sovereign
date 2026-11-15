"""
Zero-Knowledge Validation and Audit System

Provides comprehensive validation and audit capabilities to ensure
zero-knowledge data retention guarantees with complete transparency.
"""

import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from .sha256_id_system import SHA256IDGenerator, sha256_id_generator
from .aes_gcm_sha256_encryption import AESGCMSHA256Encryptor, aes_gcm_encryptor
from .third_party_tracker import ThirdPartyProviderTracker, third_party_tracker
from .mac_validation_center import MACValidationCenter, mac_validation_center
from .offline_online_manager import OfflineOnlineDataManager, offline_online_manager


@dataclass
class ValidationCheck:
    """Individual validation check result"""
    check_name: str
    status: str  # "passed", "failed", "warning"
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    details: str = ""
    severity: str = "medium"
    fix_recommendation: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "check_name": self.check_name,
            "status": self.status,
            "timestamp": self.timestamp,
            "details": self.details,
            "severity": self.severity,
            "fix_recommendation": self.fix_recommendation
        }


class ZeroKnowledgeValidationSystem:
    """
    Comprehensive validation system for zero-knowledge guarantees.
    
    Validates:
    - SHA256ID consistency across all components
    - MAC address validation and device authentication
    - AES-GCM-SHA256 encryption standards compliance
    - Third-party provider tracking completeness
    - Offline/online data consistency
    - Zero-knowledge data retention policies
    """
    
    def __init__(self):
        self.sha256_generator = sha256_id_generator
        self.encryptor = aes_gcm_encryptor
        self.tracker = third_party_tracker
        self.mac_validator = mac_validation_center
        self.data_manager = offline_online_manager
        self.validation_history: List[Dict[str, Any]] = []
        self.current_session_id: Optional[str] = None
    
    def run_comprehensive_validation(self, user_id: str) -> Dict[str, Any]:
        """
        Run comprehensive zero-knowledge validation.
        
        Args:
            user_id: User identifier
            
        Returns:
            Complete validation report
        """
        self.current_session_id = self.sha256_generator.generate_session_id(user_id).id
        
        validation_checks = []
        
        # Check 1: SHA256ID Generation and Consistency
        sha256_check = self._validate_sha256_system()
        validation_checks.append(sha256_check)
        
        # Check 2: MAC Address Validation
        mac_check = self._validate_mac_address(self.current_session_id)
        validation_checks.append(mac_check)
        
        # Check 3: Encryption Standards Compliance
        encryption_check = self._validate_encryption_standards()
        validation_checks.append(encryption_check)
        
        # Check 4: Third-Party Provider Tracking
        provider_check = self._validate_provider_tracking()
        validation_checks.append(provider_check)
        
        # Check 5: Offline/Online Data Consistency
        consistency_check = self._validate_data_consistency()
        validation_checks.append(consistency_check)
        
        # Check 6: Zero-Knowledge Data Retention
        retention_check = self._validate_zero_knowledge_retention()
        validation_checks.append(retention_check)
        
        # Calculate overall validation score
        passed_checks = sum(1 for check in validation_checks if check.status == "passed")
        total_checks = len(validation_checks)
        validation_score = (passed_checks / total_checks) * 100 if total_checks > 0 else 0
        
        # Determine overall status
        if validation_score == 100:
            overall_status = "fully_compliant"
        elif validation_score >= 80:
            overall_status = "mostly_compliant"
        elif validation_score >= 60:
            overall_status = "partially_compliant"
        else:
            overall_status = "non_compliant"
        
        validation_report = {
            "session_id": self.current_session_id,
            "user_id": user_id,
            "validation_timestamp": datetime.utcnow().isoformat(),
            "overall_status": overall_status,
            "validation_score": round(validation_score, 2),
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "failed_checks": total_checks - passed_checks,
            "validation_checks": [check.to_dict() for check in validation_checks],
            "zero_knowledge_guarantee": overall_status == "fully_compliant",
            "recommendations": self._generate_recommendations(validation_checks)
        }
        
        # Store in history
        self.validation_history.append(validation_report)
        
        return validation_report
    
    def _validate_sha256_system(self) -> ValidationCheck:
        """Validate SHA256ID generation and consistency"""
        try:
            # Test SHA256ID generation
            test_id = self.sha256_generator.generate_id("validation_test")
            
            # Verify SHA256 format
            if len(test_id.id) != 64:  # SHA256 produces 64 hex characters
                return ValidationCheck(
                    check_name="SHA256ID Generation",
                    status="failed",
                    details=f"Invalid SHA256ID length: {len(test_id.id)}",
                    severity="critical",
                    fix_recommendation="SHA256ID generation algorithm must produce 64-character hex strings"
                )
            
            # Verify ID consistency
            is_consistent = self.sha256_generator.validate_id_consistency(test_id.id)
            if not is_consistent:
                return ValidationCheck(
                    check_name="SHA256ID Consistency",
                    status="failed",
                    details="SHA256ID consistency check failed",
                    severity="critical",
                    fix_recommendation="Ensure SHA256ID generation and validation use same algorithm"
                )
            
            return ValidationCheck(
                check_name="SHA256ID System",
                status="passed",
                details="SHA256ID generation and consistency verified",
                severity="low"
            )
            
        except Exception as e:
            return ValidationCheck(
                check_name="SHA256ID System",
                status="failed",
                details=f"SHA256ID validation error: {str(e)}",
                severity="critical",
                fix_recommendation="Review SHA256ID generation implementation"
            )
    
    def _validate_mac_address(self, sha256_id: str) -> ValidationCheck:
        """Validate MAC address and device authentication"""
        try:
            is_validated, validation_result = self.mac_validator.validate_device(sha256_id)
            
            if not is_validated:
                return ValidationCheck(
                    check_name="MAC Address Validation",
                    status="failed",
                    details="Device validation failed",
                    severity="high",
                    fix_recommendation="Ensure MAC address can be retrieved and validation process completes"
                )
            
            # Check if validation chain is complete
            validation_steps = validation_result.get("validation_steps", [])
            if len(validation_steps) < 3:
                return ValidationCheck(
                    check_name="MAC Address Validation",
                    status="warning",
                    details=f"Incomplete validation chain: {len(validation_steps)} steps completed",
                    severity="medium",
                    fix_recommendation="Ensure all validation steps complete successfully"
                )
            
            return ValidationCheck(
                check_name="MAC Address Validation",
                status="passed",
                details=f"Device validated with {len(validation_steps)} validation steps",
                severity="low"
            )
            
        except Exception as e:
            return ValidationCheck(
                check_name="MAC Address Validation",
                status="failed",
                details=f"MAC validation error: {str(e)}",
                severity="high",
                fix_recommendation="Review MAC address validation implementation"
            )
    
    def _validate_encryption_standards(self) -> ValidationCheck:
        """Validate AES-GCM-SHA256 encryption standards"""
        try:
            # Test encryption/decryption
            test_data = {"test": "validation"}
            encrypted = self.encryptor.encrypt_data(test_data)
            
            # Verify encryption metadata
            if encrypted["encryption_metadata"]["algorithm"] != "AES-256-GCM":
                return ValidationCheck(
                    check_name="Encryption Standards",
                    status="failed",
                    details=f"Wrong encryption algorithm: {encrypted['encryption_metadata']['algorithm']}",
                    severity="critical",
                    fix_recommendation="Ensure AES-256-GCM is used for all encryption"
                )
            
            if encrypted["encryption_metadata"]["hash_algorithm"] != "SHA256":
                return ValidationCheck(
                    check_name="Encryption Standards",
                    status="failed",
                    details=f"Wrong hash algorithm: {encrypted['encryption_metadata']['hash_algorithm']}",
                    severity="critical",
                    fix_recommendation="Ensure SHA256 is used for all hashing operations"
                )
            
            # Test decryption
            decrypted, is_valid, message = self.encryptor.decrypt_data(encrypted)
            if not is_valid:
                return ValidationCheck(
                    check_name="Encryption Standards",
                    status="failed",
                    details=f"Decryption test failed: {message}",
                    severity="critical",
                    fix_recommendation="Review encryption/decryption implementation"
                )
            
            return ValidationCheck(
                check_name="Encryption Standards",
                status="passed",
                details="AES-256-GCM with SHA256 verified",
                severity="low"
            )
            
        except Exception as e:
            return ValidationCheck(
                check_name="Encryption Standards",
                status="failed",
                details=f"Encryption validation error: {str(e)}",
                severity="critical",
                fix_recommendation="Review encryption implementation"
            )
    
    def _validate_provider_tracking(self) -> ValidationCheck:
        """Validate third-party provider tracking"""
        try:
            provider_summary = self.tracker.get_provider_summary()
            
            # Check if tracking is active
            if provider_summary["total_interactions"] == 0:
                return ValidationCheck(
                    check_name="Provider Tracking",
                    status="warning",
                    details="No provider interactions recorded",
                    severity="medium",
                    fix_recommendation="Ensure provider tracking is initialized and logging interactions"
                )
            
            # Check zero-knowledge compliance
            if not provider_summary["zero_knowledge_compliance"]:
                return ValidationCheck(
                    check_name="Provider Tracking",
                    status="failed",
                    details="Some providers are not zero-knowledge compliant",
                    severity="high",
                    fix_recommendation="Ensure all data processing uses local/offline providers"
                )
            
            return ValidationCheck(
                check_name="Provider Tracking",
                status="passed",
                details=f"{provider_summary['total_interactions']} interactions tracked, zero-knowledge compliant",
                severity="low"
            )
            
        except Exception as e:
            return ValidationCheck(
                check_name="Provider Tracking",
                status="failed",
                details=f"Provider tracking validation error: {str(e)}",
                severity="high",
                fix_recommendation="Review provider tracking implementation"
            )
    
    def _validate_data_consistency(self) -> ValidationCheck:
        """Validate offline/online data consistency"""
        try:
            consistency_status = self.data_manager.get_sync_status()
            
            # Check if data manager is operational
            if consistency_status["total_data_items"] == 0:
                return ValidationCheck(
                    check_name="Data Consistency",
                    status="warning",
                    details="No data items tracked for consistency",
                    severity="low",
                    fix_recommendation="Data consistency manager will track items as they are processed"
                )
            
            # Check for pending sync items
            if consistency_status["pending_sync_count"] > 0:
                return ValidationCheck(
                    check_name="Data Consistency",
                    status="warning",
                    details=f"{consistency_status['pending_sync_count']} items pending sync",
                    severity="medium",
                    fix_recommendation="Ensure pending items sync when connection becomes available"
                )
            
            return ValidationCheck(
                check_name="Data Consistency",
                status="passed",
                details=f"{consistency_status['total_data_items']} items tracked, connection state: {consistency_status['connection_state']}",
                severity="low"
            )
            
        except Exception as e:
            return ValidationCheck(
                check_name="Data Consistency",
                status="failed",
                details=f"Data consistency validation error: {str(e)}",
                severity="medium",
                fix_recommendation="Review data consistency manager implementation"
            )
    
    def _validate_zero_knowledge_retention(self) -> ValidationCheck:
        """Validate zero-knowledge data retention policies"""
        try:
            # Check if all data is encrypted
            encryption_status = self.encryptor.get_encryption_status()
            
            if not encryption_status["zero_knowledge_enabled"]:
                return ValidationCheck(
                    check_name="Zero-Knowledge Retention",
                    status="failed",
                    details="Zero-knowledge mode not enabled in encryption system",
                    severity="critical",
                    fix_recommendation="Enable zero-knowledge mode in encryption system"
                )
            
            # Check perfect forward secrecy
            if not encryption_status["perfect_forward_secrecy"]:
                return ValidationCheck(
                    check_name="Zero-Knowledge Retention",
                    status="warning",
                    details="Perfect forward secrecy not guaranteed",
                    severity="medium",
                    fix_recommendation="Implement key rotation schedule for perfect forward secrecy"
                )
            
            return ValidationCheck(
                check_name="Zero-Knowledge Retention",
                status="passed",
                details="Zero-knowledge encryption with perfect forward secrecy verified",
                severity="low"
            )
            
        except Exception as e:
            return ValidationCheck(
                check_name="Zero-Knowledge Retention",
                status="failed",
                details=f"Zero-knowledge validation error: {str(e)}",
                severity="critical",
                fix_recommendation="Review zero-knowledge implementation"
            )
    
    def _generate_recommendations(self, validation_checks: List[ValidationCheck]) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []
        
        for check in validation_checks:
            if check.status == "failed":
                recommendations.append(f"CRITICAL: {check.fix_recommendation}")
            elif check.status == "warning":
                recommendations.append(f"IMPORTANT: {check.fix_recommendation}")
        
        if not recommendations:
            recommendations.append("All validation checks passed - system is fully zero-knowledge compliant")
        
        return recommendations
    
    def export_validation_report(self, user_id: str) -> Dict[str, Any]:
        """Export complete validation report"""
        report = self.run_comprehensive_validation(user_id)
        
        return {
            "validation_report": report,
            "sha256id_audit_trail": self.sha256_generator.export_id_audit_trail(),
            "mac_validation_audit": self.mac_validator.export_validation_audit_trail(),
            "provider_tracking_audit": self.tracker.get_detailed_audit_trail(),
            "data_consistency_status": self.data_manager.get_sync_status(),
            "encryption_status": self.encryptor.get_encryption_status(),
            "export_timestamp": datetime.utcnow().isoformat()
        }


# Global singleton instance
zero_knowledge_validator = ZeroKnowledgeValidationSystem()
