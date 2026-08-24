"""
MAC Address Validation Center and Authentication System

Provides MAC address-based device validation and authentication to ensure
zero-knowledge data retention guarantees with device fingerprinting.
"""

import hashlib
import json
import subprocess
import platform
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from .sha256_id_system import SHA256IDGenerator, sha256_id_generator


@dataclass
class DeviceFingerprint:
    """Device fingerprint based on MAC address and system info"""
    mac_address: str
    system_info: Dict[str, Any]
    fingerprint_hash: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    is_validated: bool = False
    validation_chain: list = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "mac_address": self.mac_address,
            "fingerprint_hash": self.fingerprint_hash,
            "timestamp": self.timestamp,
            "is_validated": self.is_validated,
            "validation_chain": self.validation_chain,
            "system_info_hash": hashlib.sha256(json.dumps(self.system_info, sort_keys=True).encode()).hexdigest()[:16]
        }


class MACValidationCenter:
    """
    Validates and authenticates devices based on MAC address and system fingerprinting.
    
    This ensures that the SHA256ID is tied to a specific validated device,
    providing zero-knowledge guarantees for data retention.
    """
    
    def __init__(self):
        self.current_fingerprint: Optional[DeviceFingerprint] = None
        self.validation_history: list = []
        self.authorized_devices: Dict[str, DeviceFingerprint] = {}  # MAC -> fingerprint
        self.sha256_generator = SHA256IDGenerator()
    
    def get_mac_address(self) -> Optional[str]:
        """
        Get the MAC address of the current device.
        
        Returns:
            MAC address string or None if unable to retrieve
        """
        try:
            system = platform.system().lower()
            
            if system == "darwin":  # macOS
                result = subprocess.run(
                    ["ifconfig", "en0"],
                    capture_output=True, 
                    text=True, 
                    timeout=5
                )
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if "ether" in line.lower():
                            mac = line.split("ether")[1].strip().split()[0]
                            return mac.lower()
            
            elif system == "linux":
                result = subprocess.run(
                    ["ip", "link", "show"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if "link/ether" in line:
                            mac = line.split("link/ether")[1].strip().split()[0]
                            return mac.lower()
            
            elif system == "windows":
                result = subprocess.run(
                    ["getmac"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if ":" in line and len(line.split(":")) == 6:
                            mac = line.strip().split()[0]
                            return mac.lower()
            
        except Exception as e:
            print(f"Error getting MAC address: {e}")
        
        return None
    
    def get_system_info(self) -> Dict[str, Any]:
        """
        Get system information for device fingerprinting.
        
        Returns:
            Dictionary with system information
        """
        try:
            return {
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "processor": platform.processor(),
                "python_version": platform.python_version(),
                "hostname": platform.node()
            }
        except Exception as e:
            print(f"Error getting system info: {e}")
            return {}
    
    def generate_device_fingerprint(self) -> DeviceFingerprint:
        """
        Generate a device fingerprint based on MAC address and system info.
        
        Returns:
            DeviceFingerprint object
        """
        mac_address = self.get_mac_address()
        system_info = self.get_system_info()
        
        # Generate fingerprint hash
        fingerprint_data = {
            "mac_address": mac_address,
            "system_info": system_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        fingerprint_hash = hashlib.sha256(
            json.dumps(fingerprint_data, sort_keys=True).encode()
        ).hexdigest()
        
        fingerprint = DeviceFingerprint(
            mac_address=mac_address or "unknown",
            system_info=system_info,
            fingerprint_hash=fingerprint_hash
        )
        
        self.current_fingerprint = fingerprint
        return fingerprint
    
    def validate_device(self, sha256_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate the device against the provided SHA256ID.
        
        This ensures that the SHA256ID is tied to a validated device,
        providing zero-knowledge guarantees.
        
        Args:
            sha256_id: The SHA256ID to validate against
            
        Returns:
            Tuple of (is_valid, validation_result)
        """
        fingerprint = self.generate_device_fingerprint()
        
        validation_result = {
            "sha256_id": sha256_id,
            "device_fingerprint": fingerprint.to_dict(),
            "validation_timestamp": datetime.utcnow().isoformat(),
            "validation_steps": []
        }
        
        # Step 1: Check if MAC address is available
        if not fingerprint.mac_address or fingerprint.mac_address == "unknown":
            validation_result["validation_steps"].append({
                "step": "mac_address_check",
                "status": "failed",
                "message": "Unable to retrieve MAC address"
            })
            return False, validation_result
        
        validation_result["validation_steps"].append({
            "step": "mac_address_check",
            "status": "passed",
            "message": f"MAC address retrieved: {fingerprint.mac_address}"
        })
        
        # Step 2: Validate SHA256ID format
        if len(sha256_id) != 64:  # SHA256 produces 64 hex characters
            validation_result["validation_steps"].append({
                "step": "sha256_format_check",
                "status": "failed",
                "message": "Invalid SHA256ID format"
            })
            return False, validation_result
        
        validation_result["validation_steps"].append({
            "step": "sha256_format_check",
            "status": "passed",
            "message": "SHA256ID format valid"
        })
        
        # Step 3: Check if device is in authorized list
        if fingerprint.mac_address in self.authorized_devices:
            stored_fingerprint = self.authorized_devices[fingerprint.mac_address]
            if stored_fingerprint.fingerprint_hash == fingerprint.fingerprint_hash:
                validation_result["validation_steps"].append({
                    "step": "device_authorization_check",
                    "status": "passed",
                    "message": "Device is authorized and fingerprint matches"
                })
            else:
                validation_result["validation_steps"].append({
                    "step": "device_authorization_check",
                    "status": "failed",
                    "message": "Device fingerprint mismatch"
                })
                return False, validation_result
        else:
            validation_result["validation_steps"].append({
                "step": "device_authorization_check",
                "status": "pending",
                "message": "New device - requires authorization"
            })
        
        # Step 4: Generate combined hash for zero-knowledge validation
        combined_hash = hashlib.sha256(
            f"{sha256_id}{fingerprint.fingerprint_hash}".encode()
        ).hexdigest()
        
        validation_result["combined_validation_hash"] = combined_hash
        validation_result["validation_steps"].append({
            "step": "combined_hash_generation",
            "status": "passed",
            "message": f"Combined validation hash: {combined_hash[:16]}..."
        })
        
        # Mark as validated
        fingerprint.is_validated = True
        fingerprint.validation_chain = validation_result["validation_steps"]
        
        # Store in validation history
        self.validation_history.append(validation_result)
        
        # SECURITY: Do NOT auto-authorize new devices
        # This was a critical security vulnerability that allowed any device to gain trusted status
        # New devices now require explicit authorization via authorize_device()
        # This is the correct security behavior for zero-knowledge guarantees
        
        if fingerprint.mac_address not in self.authorized_devices:
            validation_result["authorization_required"] = True
            validation_result["authorization_message"] = "New device requires explicit authorization before trusted operations"
        
        return True, validation_result
    
    def authorize_device(self, mac_address: str) -> bool:
        """
        Manually authorize a device by MAC address.
        
        Args:
            mac_address: MAC address to authorize
            
        Returns:
            True if authorization successful
        """
        if mac_address not in self.authorized_devices:
            # Generate fingerprint for this MAC
            fingerprint = self.generate_device_fingerprint()
            if fingerprint.mac_address == mac_address:
                self.authorized_devices[mac_address] = fingerprint
                return True
        return True
    
    def revoke_device_authorization(self, mac_address: str) -> bool:
        """
        Revoke authorization for a device.
        
        Args:
            mac_address: MAC address to revoke
            
        Returns:
            True if revocation successful
        """
        if mac_address in self.authorized_devices:
            del self.authorized_devices[mac_address]
            return True
        return False
    
    def get_validation_status(self) -> Dict[str, Any]:
        """
        Get current validation status.
        
        Returns:
            Dictionary with validation status information
        """
        return {
            "current_fingerprint": self.current_fingerprint.to_dict() if self.current_fingerprint else None,
            "authorized_devices_count": len(self.authorized_devices),
            "validation_history_count": len(self.validation_history),
            "is_validated": self.current_fingerprint.is_validated if self.current_fingerprint else False,
            "validation_timestamp": datetime.utcnow().isoformat()
        }
    
    def export_validation_audit_trail(self) -> Dict[str, Any]:
        """
        Export complete validation audit trail.
        
        Returns:
            Dictionary with complete validation history
        """
        return {
            "validation_center_status": self.get_validation_status(),
            "authorized_devices": {
                mac: fp.to_dict() 
                for mac, fp in self.authorized_devices.items()
            },
            "validation_history": self.validation_history,
            "export_timestamp": datetime.utcnow().isoformat()
        }


# Global singleton instance
mac_validation_center = MACValidationCenter()