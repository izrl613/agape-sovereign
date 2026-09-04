"""
SHA256ID Generation and Management System

Provides unique SHA256 identifiers for all user sessions, documents, and transactions
to ensure complete transparency and zero-knowledge data retention guarantees.
"""

import hashlib
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
import platform
import subprocess


@dataclass
class SHA256ID:
    """SHA256-based unique identifier with metadata"""
    id: str
    algorithm: str = "SHA256"
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    purpose: str = "identity_verification"
    context: Dict[str, Any] = field(default_factory=dict)
    version: str = "1.0"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "algorithm": self.algorithm,
            "timestamp": self.timestamp,
            "purpose": self.purpose,
            "context": self.context,
            "version": self.version
        }
    
    def to_footer_display(self) -> str:
        """Format for display in footer (centered)"""
        return f"SHA256ID: {self.id[:16]}... | {self.timestamp[:10]}"


class SHA256IDGenerator:
    """
    Generates and manages SHA256-based unique identifiers for transparency.
    
    Each identifier includes:
    - SHA256 hash of session + timestamp + context
    - Metadata for audit trail
    - Version control for compatibility
    """
    
    def __init__(self):
        self.current_id: Optional[SHA256ID] = None
        self.id_history: list = []
        self.session_start = datetime.utcnow()
    
    def generate_id(
        self, 
        purpose: str = "identity_verification",
        context: Optional[Dict[str, Any]] = None
    ) -> SHA256ID:
        """
        Generate a new SHA256ID with given purpose and context.
        
        Args:
            purpose: The purpose of this ID (e.g., "user_session", "document_generation")
            context: Additional context metadata
            
        Returns:
            SHA256ID object with unique identifier
        """
        timestamp = datetime.utcnow().isoformat()
        session_uuid = str(uuid.uuid4())
        
        # Create hash input: purpose + timestamp + session_uuid + context
        hash_input = f"{purpose}|{timestamp}|{session_uuid}"
        if context:
            hash_input += f"|{json.dumps(context, sort_keys=True)}"
        
        # Generate SHA256 hash
        sha256_hash = hashlib.sha256(hash_input.encode()).hexdigest()
        
        # Create SHA256ID object
        sha256_id = SHA256ID(
            id=sha256_hash,
            purpose=purpose,
            context=context or {},
            timestamp=timestamp
        )
        
        # Store in history
        self.id_history.append(sha256_id.to_dict())
        self.current_id = sha256_id
        
        return sha256_id
    
    def get_current_id(self) -> Optional[SHA256ID]:
        """Get the current active SHA256ID"""
        return self.current_id
    
    def generate_session_id(self, user_id: str) -> SHA256ID:
        """Generate a session-specific SHA256ID"""
        return self.generate_id(
            purpose="user_session",
            context={
                "user_id": user_id,
                "session_start": self.session_start.isoformat()
            }
        )
    
    def generate_document_id(self, document_type: str, user_id: str) -> SHA256ID:
        """Generate a document-specific SHA256ID"""
        return self.generate_id(
            purpose="document_generation",
            context={
                "document_type": document_type,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def generate_vector_processing_id(self, vector_ids: list, user_id: str) -> SHA256ID:
        """Generate a vector processing-specific SHA256ID"""
        return self.generate_id(
            purpose="vector_processing",
            context={
                "vector_ids": vector_ids,
                "user_id": user_id,
                "total_vectors": len(vector_ids)
            }
        )
    
    def generate_architect_ai_id(self, query: str, user_id: str) -> SHA256ID:
        """Generate an Architect AI processing-specific SHA256ID"""
        return self.generate_id(
            purpose="architect_ai_processing",
            context={
                "query_hash": hashlib.sha256(query.encode()).hexdigest()[:16],
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def validate_id_consistency(self, expected_id: str) -> bool:
        """
        Validate that the current ID matches expected ID for consistency.
        
        This ensures that IDs haven't been tampered with during processing.
        """
        if not self.current_id:
            return False
        return self.current_id.id == expected_id
    
    def get_id_chain(self) -> list:
        """Get the complete chain of IDs generated in this session"""
        return self.id_history
    
    def export_id_audit_trail(self) -> Dict[str, Any]:
        """Export complete audit trail of all IDs"""
        return {
            "session_start": self.session_start.isoformat(),
            "total_ids_generated": len(self.id_history),
            "id_chain": self.id_history,
            "current_id": self.current_id.to_dict() if self.current_id else None,
            "export_timestamp": datetime.utcnow().isoformat()
        }


# Global singleton instance
sha256_id_generator = SHA256IDGenerator()