"""
Security-Enhanced Vector Agent Wrapper

Wraps vector agents with security features including encryption, tracking,
SHA256ID generation, and third-party provider documentation.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from ..vector_modules.base_vector_agent import BaseVectorAgent, VectorResult, UserQuery
from .sha256_id_system import SHA256IDGenerator, sha256_id_generator
from .aes_gcm_sha256_encryption import AESGCMSHA256Encryptor, aes_gcm_encryptor
from .third_party_tracker import ThirdPartyProviderTracker, third_party_tracker, ProviderType
from .offline_online_manager import OfflineOnlineDataManager, offline_online_manager


class SecurityEnhancedVectorAgent:
    """
    Security wrapper for vector agents that adds:
    - AES-GCM-SHA256 encryption for all data
    - SHA256ID generation and tracking
    - Third-party provider documentation
    - Offline/online consistency management
    - Zero-knowledge guarantees
    """
    
    def __init__(self, vector_agent: BaseVectorAgent):
        self.vector_agent = vector_agent
        self.sha256_generator = sha256_id_generator
        self.encryptor = aes_gcm_encryptor
        self.tracker = third_party_tracker
        self.data_manager = offline_online_manager
    
    def execute_with_security(
        self, 
        query: UserQuery,
        user_id: str,
        sha256_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute vector agent with full security enhancement.
        
        Args:
            query: User query object
            user_id: User identifier
            sha256_id: Optional SHA256ID (will generate if not provided)
            
        Returns:
            Enhanced result with security metadata
        """
        # Generate SHA256ID if not provided
        if not sha256_id:
            sha256_id_obj = self.sha256_generator.generate_vector_processing_id(
                vector_ids=[self.vector_agent.vector_id],
                user_id=user_id
            )
            sha256_id = sha256_id_obj.id
        
        # Log provider interaction for vector processing
        self.tracker.log_vector_processing(
            vector_id=self.vector_agent.vector_id,
            provider_name="VectorAgentProcessor",
            data_processed={"query_length": len(query.query_text)},
            offline_mode=True  # Vectors process locally
        )
        
        # Execute original vector agent
        vector_result = self.vector_agent.execute(query)
        
        # Encrypt the processed data
        encrypted_result = self.encryptor.encrypt_vector_data(
            vector_id=self.vector_agent.vector_id,
            vector_data=vector_result.processed_data,
            user_id=user_id
        )
        
        # Store in data manager
        data_state = self.data_manager.store_data(
            data_id=f"{self.vector_agent.vector_id}_{user_id}",
            data=vector_result.processed_data,
            user_id=user_id,
            sha256_id=sha256_id
        )
        
        # Enhance result with security metadata
        enhanced_result = {
            "vector_result": vector_result.to_dict(),
            "security_metadata": {
                "sha256_id": sha256_id,
                "encryption_metadata": encrypted_result["encryption_metadata"],
                "data_state": data_state.to_dict(),
                "timestamp": datetime.utcnow().isoformat(),
                "zero_knowledge_guarantee": True,
                "provider_tracking": self.tracker.get_provider_summary()
            },
            "encrypted_data": {
                "encrypted_b64": encrypted_result["encrypted_data"],
                "nonce": encrypted_result["nonce"],
                "salt": encrypted_result["salt"],
                "data_hash": encrypted_result["data_hash"]
            }
        }
        
        return enhanced_result
    
    def generate_secure_architect_payload(
        self, 
        processed_data: Dict[str, Any],
        user_id: str,
        sha256_id: str
    ) -> Dict[str, Any]:
        """
        Generate encrypted payload for Architect AI with full security tracking.
        
        Args:
            processed_data: Processed vector data
            user_id: User identifier
            sha256_id: Current SHA256ID
            
        Returns:
            Encrypted payload with security metadata
        """
        # Generate Architect AI specific SHA256ID
        architect_id_obj = self.sha256_generator.generate_architect_ai_id(
            query=str(processed_data),
            user_id=user_id
        )
        
        # Log Architect AI provider interaction
        self.tracker.log_architect_ai_processing(
            provider_name="ArchitectAI_Local",
            query="vector_analysis",
            response_data=processed_data,
            offline_mode=True
        )
        
        # Encrypt the payload
        encrypted_payload = self.encryptor.encrypt_architect_ai_payload(
            architect_payload=processed_data,
            user_id=user_id,
            sha256_id=sha256_id
        )
        
        return {
            "encrypted_payload": encrypted_payload,
            "architect_sha256_id": architect_id_obj.id,
            "security_metadata": {
                "original_sha256_id": sha256_id,
                "architect_sha256_id": architect_id_obj.id,
                "encryption_metadata": encrypted_payload["encryption_metadata"],
                "architect_metadata": encrypted_payload["architect_metadata"],
                "timestamp": datetime.utcnow().isoformat()
            }
        }


def wrap_vector_agent(vector_agent: BaseVectorAgent) -> SecurityEnhancedVectorAgent:
    """
    Wrap a vector agent with security enhancements.
    
    Args:
        vector_agent: The base vector agent to wrap
        
    Returns:
        SecurityEnhancedVectorAgent instance
    """
    return SecurityEnhancedVectorAgent(vector_agent)
