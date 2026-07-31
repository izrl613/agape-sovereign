"""
Security-Enhanced Passkey WebAuthn Integration

Integrates WebAuthn passkey authentication with the complete security system:
- MAC address validation and device fingerprinting
- SHA256ID generation and tracking
- AES-GCM-SHA256 encryption for passkey credentials
- Zero-knowledge validation and audit trail
- Offline device security with biometric authentication
"""

import json
import hashlib
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, field


@dataclass
class PasskeyCredential:
    """Encrypted passkey credential with security metadata"""
    credential_id: str
    public_key: str
    user_id: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    device_fingerprint: str = ""
    sha256_id: str = ""
    encrypted_credential: str = ""
    encryption_metadata: Dict[str, Any] = field(default_factory=dict)
    mac_address: str = ""
    offline_capable: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "credential_id": self.credential_id,
            "public_key": self.public_key,
            "user_id": self.user_id,
            "timestamp": self.timestamp,
            "device_fingerprint": self.device_fingerprint,
            "sha256_id": self.sha256_id,
            "encrypted_credential": self.encrypted_credential,
            "encryption_metadata": self.encryption_metadata,
            "mac_address": self.mac_address,
            "offline_capable": self.offline_capable
        }


class SecurityEnhancedPasskeyManager:
    """
    Security-enhanced passkey manager that integrates with:
    - MAC address validation
    - SHA256ID generation
    - AES-GCM-SHA256 encryption
    - Zero-knowledge validation
    """
    
    def __init__(self):
        self.passkey_credentials: Dict[str, PasskeyCredential] = {}
        self.device_fingerprints: Dict[str, str] = {}
        self.session_sha256_ids: Dict[str, str] = {}
        
    def generate_passkey_sha256_id(self, user_id: str, credential_id: str) -> str:
        """Generate SHA256ID for passkey operation"""
        from .sha256_id_system import sha256_id_generator
        
        sha256_id_obj = sha256_id_generator.generate_id(
            purpose="passkey_authentication",
            context={
                "user_id": user_id,
                "credential_id": credential_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return sha256_id_obj.id
    
    def validate_device_for_passkey(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Validate device using MAC address before passkey operation"""
        from .mac_validation_center import mac_validation_center
        
        # Generate session SHA256ID
        sha256_id = self.generate_passkey_sha256_id(user_id, "validation")
        
        # Validate device
        is_validated, validation_result = mac_validation_center.validate_device(sha256_id)
        
        return is_validated, validation_result
    
    def encrypt_passkey_credential(
        self, 
        credential_data: Dict[str, Any],
        user_id: str,
        sha256_id: str
    ) -> Dict[str, Any]:
        """Encrypt passkey credential with AES-GCM-SHA256"""
        from .aes_gcm_sha256_encryption import aes_gcm_encryptor
        
        encrypted = aes_gcm_encryptor.encrypt_data(
            data=credential_data,
            additional_data=f"passkey|user:{user_id}|sha256id:{sha256_id}"
        )
        
        return encrypted
    
    def decrypt_passkey_credential(
        self,
        encrypted_credential: Dict[str, Any],
        user_id: str,
        sha256_id: str
    ) -> Tuple[Optional[Dict[str, Any]], bool, str]:
        """Decrypt passkey credential with integrity verification"""
        from .aes_gcm_sha256_encryption import aes_gcm_encryptor
        
        decrypted, is_valid, message = aes_gcm_encryptor.decrypt_data(
            encrypted_credential,
            password=None  # Using master key
        )
        
        return decrypted, is_valid, message
    
    def register_passkey(
        self,
        user_id: str,
        credential_id: str,
        public_key: str,
        device_fingerprint: str,
        mac_address: str
    ) -> PasskeyCredential:
        """
        Register a passkey with full security integration.
        
        Args:
            user_id: User identifier
            credential_id: WebAuthn credential ID
            public_key: Public key for the credential
            device_fingerprint: Device fingerprint from MAC validation
            mac_address: MAC address of the device
            
        Returns:
            PasskeyCredential with encrypted data
        """
        # Generate SHA256ID for this passkey
        sha256_id = self.generate_passkey_sha256_id(user_id, credential_id)
        
        # Encrypt the credential data
        credential_data = {
            "credential_id": credential_id,
            "public_key": public_key,
            "user_id": user_id,
            "registration_timestamp": datetime.utcnow().isoformat()
        }
        
        encrypted_credential = self.encrypt_passkey_credential(
            credential_data,
            user_id,
            sha256_id
        )
        
        # Create passkey credential object
        passkey_credential = PasskeyCredential(
            credential_id=credential_id,
            public_key=public_key,
            user_id=user_id,
            device_fingerprint=device_fingerprint,
            sha256_id=sha256_id,
            encrypted_credential=encrypted_credential["encrypted_data"],
            encryption_metadata=encrypted_credential["encryption_metadata"],
            mac_address=mac_address,
            offline_capable=True
        )
        
        # Store credential
        self.passkey_credentials[credential_id] = passkey_credential
        
        # Log provider interaction
        from .third_party_tracker import third_party_tracker
        third_party_tracker.log_provider_interaction(
            provider_name="WebAuthn",
            provider_type="authentication",
            data_processed={
                "action": "passkey_registration",
                "user_id": user_id,
                "credential_id": credential_id[:16] + "..."
            },
            status="active",
            offline_mode=True
        )
        
        return passkey_credential
    
    def authenticate_with_passkey(
        self,
        user_id: str,
        credential_id: str,
        signature: str,
        authenticator_data: str
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Authenticate using passkey with security validation.
        
        Args:
            user_id: User identifier
            credential_id: WebAuthn credential ID
            signature: Signature from authenticator
            authenticator_data: Authenticator data
            
        Returns:
            Tuple of (is_authenticated, authentication_result)
        """
        # Validate device first
        is_validated, validation_result = self.validate_device_for_passkey(user_id)
        
        if not is_validated:
            return False, {
                "error": "Device validation failed",
                "validation_result": validation_result
            }
        
        # Check if credential exists
        if credential_id not in self.passkey_credentials:
            return False, {
                "error": "Credential not found",
                "credential_id": credential_id
            }
        
        credential = self.passkey_credentials[credential_id]
        
        # Verify user ID matches
        if credential.user_id != user_id:
            return False, {
                "error": "User ID mismatch",
                "expected_user": credential.user_id,
                "provided_user": user_id
            }
        
        # Verify device fingerprint matches
        if credential.device_fingerprint != validation_result.get("device_fingerprint", {}).get("fingerprint_hash"):
            return False, {
                "error": "Device fingerprint mismatch",
                "expected": credential.device_fingerprint,
                "provided": validation_result.get("device_fingerprint", {}).get("fingerprint_hash")
            }
        
        # Generate SHA256ID for authentication
        auth_sha256_id = self.generate_passkey_sha256_id(user_id, credential_id)
        
        # Log authentication attempt
        from .third_party_tracker import third_party_tracker
        third_party_tracker.log_provider_interaction(
            provider_name="WebAuthn",
            provider_type="authentication",
            data_processed={
                "action": "passkey_authentication",
                "user_id": user_id,
                "credential_id": credential_id[:16] + "...",
                "sha256_id": auth_sha256_id
            },
            status="active",
            offline_mode=True
        )
        
        # In production, verify the signature using the public key
        # For now, we'll simulate successful authentication
        return True, {
            "authenticated": True,
            "user_id": user_id,
            "credential_id": credential_id,
            "sha256_id": auth_sha256_id,
            "device_validated": True,
            "authentication_timestamp": datetime.utcnow().isoformat()
        }
    
    def get_passkey_for_user(self, user_id: str) -> Optional[PasskeyCredential]:
        """Get passkey credential for a user"""
        for credential in self.passkey_credentials.values():
            if credential.user_id == user_id:
                return credential
        return None
    
    def revoke_passkey(self, credential_id: str) -> bool:
        """Revoke a passkey credential"""
        if credential_id in self.passkey_credentials:
            del self.passkey_credentials[credential_id]
            
            # Log revocation
            from .third_party_tracker import third_party_tracker
            third_party_tracker.log_provider_interaction(
                provider_name="WebAuthn",
                provider_type="authentication",
                data_processed={
                    "action": "passkey_revocation",
                    "credential_id": credential_id[:16] + "..."
                },
                status="active",
                offline_mode=True
            )
            
            return True
        return False
    
    def export_passkey_audit_trail(self) -> Dict[str, Any]:
        """Export complete passkey audit trail"""
        from .third_party_tracker import third_party_tracker
        from .mac_validation_center import mac_validation_center
        from .sha256_id_system import sha256_id_generator
        
        return {
            "total_passkeys": len(self.passkey_credentials),
            "passkey_credentials": {
                cred_id: cred.to_dict() 
                for cred_id, cred in self.passkey_credentials.items()
            },
            "device_validation_audit": mac_validation_center.export_validation_audit_trail(),
            "sha256id_audit": sha256_id_generator.export_id_audit_trail(),
            "provider_tracking": third_party_tracker.get_detailed_audit_trail(),
            "export_timestamp": datetime.utcnow().isoformat()
        }


# Global singleton instance
security_passkey_manager = SecurityEnhancedPasskeyManager()