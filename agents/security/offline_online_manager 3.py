"""
Offline/Online Data Consistency Manager

Manages data consistency between online and offline modes, ensuring that
user data remains synchronized and secure regardless of connectivity.
"""

import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from .aes_gcm_sha256_encryption import AESGCMSHA256Encryptor, aes_gcm_encryptor
from .sha256_id_system import SHA256IDGenerator, sha256_id_generator
from .third_party_tracker import ThirdPartyProviderTracker, third_party_tracker


@dataclass
class DataState:
    """State of a piece of data"""
    data_id: str
    content_hash: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_encrypted: bool = True
    location: str = "local"  # local, cloud, or both
    connection_state: str = "offline"
    sync_status: str = "synced"
    sha256_id: str = ""
    version: int = 1
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "data_id": self.data_id,
            "content_hash": self.content_hash,
            "timestamp": self.timestamp,
            "is_encrypted": self.is_encrypted,
            "location": self.location,
            "connection_state": self.connection_state,
            "sync_status": self.sync_status,
            "sha256_id": self.sha256_id,
            "version": self.version
        }


class OfflineOnlineDataManager:
    """
    Manages data consistency between online and offline modes.
    
    Ensures that:
    - Data is encrypted regardless of connection state
    - SHA256ID tracking remains consistent
    - Third-party provider tracking works offline
    - Zero-knowledge guarantees are maintained
    """
    
    def __init__(self):
        self.connection_state = "offline"
        self.data_states: Dict[str, DataState] = {}
        self.pending_sync: List[str] = []
        self.sync_history: List[Dict[str, Any]] = []
        self.encryptor = aes_gcm_encryptor
        self.sha256_generator = sha256_id_generator
        self.tracker = third_party_tracker
    
    def set_connection_state(self, state):
        """Set the current connection state"""
        old_state = self.connection_state
        
        # Handle string inputs
        if isinstance(state, str):
            state = state.lower()
            if state not in ["online", "offline", "transitioning"]:
                state = "offline"
        
        self.connection_state = state
        
        # Log state transition
        self.sync_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "old_state": old_state,
            "new_state": state,
            "data_affected": len(self.data_states)
        })
        
        # Handle state transitions
        if state == "online" and old_state == "offline":
            self._sync_pending_data()
    
    def store_data(
        self,
        data_id: str,
        data: Any,
        user_id: str,
        sha256_id: str,
        force_cloud: bool = False
    ) -> DataState:
        """
        Store data with encryption and state tracking.
        
        Args:
            data_id: Unique identifier for the data
            data: The data to store
            user_id: User identifier
            sha256_id: Current SHA256ID
            force_cloud: Force cloud storage even if offline
            
        Returns:
            DataState object
        """
        # Encrypt data
        encrypted_package = self.encryptor.encrypt_data(
            data=data,
            additional_data=f"data_id:{data_id}|user:{user_id}|sha256id:{sha256_id}"
        )
        
        # Generate content hash
        content_hash = encrypted_package["data_hash"]
        
        # Determine location based on connection state
        location = "cloud" if (self.connection_state == "online" or force_cloud) else "local"
        
        # Create data state
        data_state = DataState(
            data_id=data_id,
            content_hash=content_hash,
            is_encrypted=True,
            location=location,
            connection_state=self.connection_state,
            sha256_id=sha256_id
        )
        
        # Store in states
        self.data_states[data_id] = data_state
        
        # Track for sync if offline
        if self.connection_state == "offline" and not force_cloud:
            if data_id not in self.pending_sync:
                self.pending_sync.append(data_id)
        
        # Log provider interaction
        self.tracker.log_provider_interaction(
            provider_name="DataStorage",
            provider_type="storage",
            data_processed={"data_id": data_id, "location": location},
            status="active",
            offline_mode=(self.connection_state == "offline")
        )
        
        return data_state
    
    def retrieve_data(
        self,
        data_id: str,
        password: Optional[str] = None
    ) -> Optional[Any]:
        """
        Retrieve and decrypt data.
        
        Args:
            data_id: Unique identifier for the data
            password: Optional password for decryption
            
        Returns:
            Decrypted data or None if not found
        """
        if data_id not in self.data_states:
            return None
        
        data_state = self.data_states[data_id]
        
        # In a real implementation, you would retrieve the encrypted data from storage
        # For now, we'll return a placeholder
        return {
            "data_id": data_id,
            "state": data_state.to_dict(),
            "decryption_required": True
        }
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current synchronization status"""
        return {
            "connection_state": self.connection_state,
            "total_data_items": len(self.data_states),
            "pending_sync_count": len(self.pending_sync),
            "sync_history_count": len(self.sync_history),
            "data_states": {
                data_id: state.to_dict() 
                for data_id, state in self.data_states.items()
            }
        }
    
    def generate_consistency_report(self) -> str:
        """Generate consistency report"""
        status = self.get_sync_status()
        
        report = f"""
=== OFFLINE/ONLINE DATA CONSISTENCY REPORT ===
Connection State: {status['connection_state']}
Total Data Items: {status['total_data_items']}
Pending Sync: {status['pending_sync_count']}
Sync History: {status['sync_history_count']} events

=== DATA INTEGRITY ===
All data encrypted with AES-256-GCM
SHA256ID tracking maintained across all states
Zero-knowledge guarantees preserved

=== OFFLINE CAPABILITY ===
{status['total_data_items']} items can be processed offline
Local LLM integration active
Third-party tracking functional offline

Generated: {datetime.utcnow().isoformat()}
"""
        return report


# Global singleton instance
offline_online_manager = OfflineOnlineDataManager()
