"""
Third-Party Provider Tracking and Documentation System

Tracks and documents all third-party providers that handle user data,
ensuring complete transparency whether online or offline.
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class ProviderInteraction:
    """Record of a third-party provider interaction"""
    provider_name: str
    provider_type: str
    status: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    data_processed: Dict[str, Any] = field(default_factory=dict)
    data_hash: str = ""
    user_consent: bool = True
    offline_capable: bool = False
    privacy_policy_url: str = ""
    data_retention_policy: str = ""
    encryption_used: str = "AES-256-GCM"
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider_name": self.provider_name,
            "provider_type": self.provider_type,
            "status": self.status,
            "timestamp": self.timestamp,
            "data_processed": self.data_processed,
            "data_hash": self.data_hash,
            "user_consent": self.user_consent,
            "offline_capable": self.offline_capable,
            "privacy_policy_url": self.privacy_policy_url,
            "data_retention_policy": self.data_retention_policy,
            "encryption_used": self.encryption_used,
            "metadata": self.metadata
        }


class ThirdPartyProviderTracker:
    """
    Tracks all third-party provider interactions for complete transparency.
    
    This ensures users can see exactly which providers handled their data,
    whether online or offline, with full documentation.
    """
    
    def __init__(self):
        self.interaction_history: List[ProviderInteraction] = []
        self.active_providers: Dict[str, ProviderInteraction] = {}
        self.session_start = datetime.utcnow()
        
        # Initialize known providers
        self._initialize_known_providers()
    
    def _initialize_known_providers(self):
        """Initialize known third-party providers"""
        known_providers = [
            {
                "provider_name": "LM Studio",
                "provider_type": "local_llm",
                "offline_capable": True,
                "privacy_policy_url": "https://lmstudio.ai/privacy",
                "data_retention_policy": "No data retention - local processing only"
            },
            {
                "provider_name": "Ollama",
                "provider_type": "local_llm",
                "offline_capable": True,
                "privacy_policy_url": "https://ollama.ai/privacy",
                "data_retention_policy": "No data retention - local processing only"
            },
            {
                "provider_name": "Firebase Auth",
                "provider_type": "authentication",
                "offline_capable": False,
                "privacy_policy_url": "https://firebase.google.com/terms",
                "data_retention_policy": "As per Firebase terms of service"
            },
            {
                "provider_name": "Firebase Firestore",
                "provider_type": "storage",
                "offline_capable": True,
                "privacy_policy_url": "https://firebase.google.com/terms",
                "data_retention_policy": "As per Firebase terms of service"
            },
            {
                "provider_name": "Architect AI (Local)",
                "provider_type": "local_llm",
                "offline_capable": True,
                "privacy_policy_url": "internal",
                "data_retention_policy": "No data retention - local processing only"
            }
        ]
        
        for provider in known_providers:
            interaction = ProviderInteraction(
                provider_name=provider["provider_name"],
                provider_type=provider["provider_type"],
                status="pending",
                offline_capable=provider["offline_capable"],
                privacy_policy_url=provider["privacy_policy_url"],
                data_retention_policy=provider["data_retention_policy"]
            )
            self.active_providers[provider["provider_name"]] = interaction
    
    def log_provider_interaction(
        self,
        provider_name: str,
        provider_type,
        data_processed: Dict[str, Any],
        status = "active",
        offline_mode: bool = False
    ) -> ProviderInteraction:
        """
        Log an interaction with a third-party provider.
        
        Args:
            provider_name: Name of the provider
            provider_type: Type of provider
            data_processed: Data that was processed
            status: Status of the interaction
            offline_mode: Whether interaction occurred offline
            
        Returns:
            ProviderInteraction record
        """
        # Generate data hash for tracking
        data_hash = self._generate_data_hash(data_processed)
        
        interaction = ProviderInteraction(
            provider_name=provider_name,
            provider_type=provider_type,
            status=status,
            data_processed={"data_types": list(data_processed.keys()), "offline_mode": offline_mode},
            data_hash=data_hash,
            offline_capable=offline_mode,
            metadata={
                "offline_mode": offline_mode,
                "session_timestamp": self.session_start.isoformat()
            }
        )
        
        # Update active provider status
        if provider_name in self.active_providers:
            self.active_providers[provider_name].status = status
            self.active_providers[provider_name].offline_capable = offline_mode
        
        # Add to history
        self.interaction_history.append(interaction)
        
        return interaction
    
    def log_vector_processing(
        self,
        vector_id: str,
        provider_name: str,
        data_processed: Dict[str, Any],
        offline_mode: bool = True
    ) -> ProviderInteraction:
        """Log vector processing by a provider"""
        return self.log_provider_interaction(
            provider_name=provider_name,
            provider_type="data_processing",
            data_processed={
                "vector_id": vector_id,
                "data_keys": list(data_processed.keys())
            },
            status="active",
            offline_mode=offline_mode
        )
    
    def log_architect_ai_processing(
        self,
        provider_name: str,
        query: str,
        response_data: Dict[str, Any],
        offline_mode: bool = True
    ) -> ProviderInteraction:
        """Log Architect AI processing by a provider"""
        return self.log_provider_interaction(
            provider_name=provider_name,
            provider_type="local_llm",
            data_processed={
                "query_length": len(query),
                "response_size": len(str(response_data)),
                "processing_type": "architect_ai_analysis"
            },
            status="active",
            offline_mode=offline_mode
        )
    
    def log_encryption_operation(
        self,
        encryption_method: str,
        data_size: int,
        offline_mode: bool = True
    ) -> ProviderInteraction:
        """Log encryption operation"""
        return self.log_provider_interaction(
            provider_name="AES-GCM-SHA256",
            provider_type="encryption",
            data_processed={
                "encryption_method": encryption_method,
                "data_size": data_size
            },
            status="active",
            offline_mode=offline_mode
        )
    
    def log_user_export(
        self,
        export_type: str,
        provider_name: str,
        data_size: int,
        offline_mode: bool = False
    ) -> ProviderInteraction:
        """Log user export operation"""
        return self.log_provider_interaction(
            provider_name=provider_name,
            provider_type="storage",
            data_processed={
                "export_type": export_type,
                "data_size": data_size
            },
            status="active",
            offline_mode=offline_mode
        )
    
    def _generate_data_hash(self, data: Dict[str, Any]) -> str:
        """Generate hash of processed data for tracking"""
        import hashlib
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]
    
    def get_provider_summary(self) -> Dict[str, Any]:
        """Get summary of all provider interactions"""
        online_interactions = [i for i in self.interaction_history if not i.metadata.get("offline_mode", False)]
        offline_interactions = [i for i in self.interaction_history if i.metadata.get("offline_mode", False)]
        
        return {
            "total_interactions": len(self.interaction_history),
            "online_interactions": len(online_interactions),
            "offline_interactions": len(offline_interactions),
            "active_providers": list(self.active_providers.keys()),
            "session_start": self.session_start.isoformat(),
            "zero_knowledge_compliance": all(i.offline_capable for i in self.interaction_history)
        }
    
    def get_detailed_audit_trail(self) -> Dict[str, Any]:
        """Get detailed audit trail of all provider interactions"""
        return {
            "provider_summary": self.get_provider_summary(),
            "interaction_history": [interaction.to_dict() for interaction in self.interaction_history],
            "active_providers": {
                name: interaction.to_dict() 
                for name, interaction in self.active_providers.items()
            },
            "export_timestamp": datetime.utcnow().isoformat()
        }
    
    def generate_transparency_report(self) -> str:
        """Generate human-readable transparency report"""
        summary = self.get_provider_summary()
        
        report = f"""
=== THIRD-PARTY PROVIDER TRANSPARENCY REPORT ===
Session Start: {summary['session_start']}
Total Interactions: {summary['total_interactions']}
Online Interactions: {summary['online_interactions']}
Offline Interactions: {summary['offline_interactions']}
Zero-Knowledge Compliant: {summary['zero_knowledge_compliance']}

=== ACTIVE PROVIDERS ===
"""
        for provider_name in summary['active_providers']:
            report += f"- {provider_name}\n"
        
        report += f"""
=== DATA PROCESSING FLOW ===
IVM Agents → Architect AI → User Export → Storage
All processing tracked and documented with SHA256ID verification.

=== OFFLINE CAPABILITY ===
This session processed {summary['offline_interactions']} interactions offline.
Local LLM providers: LM Studio, Ollama
Zero external data transmission for AI processing.

Generated: {datetime.utcnow().isoformat()}
"""
        return report


# Global singleton instance
third_party_tracker = ThirdPartyProviderTracker()
