"""
Base Vector Agent Interface for Identity Vector Modules

This module defines the abstract base class and interface for all 16 identity vector agents.
Each vector agent is responsible for parsing user queries, processing user-entered data,
and preparing structured data for Architect AI processing.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
import json


class VectorStatus(Enum):
    """Status of vector processing"""
    PENDING = "pending"
    PROCESSING = "processing"
    KNOXED = "KNOXED"  # Secured
    NUKED = "NUKED"    # Critical exposure found
    MONITORED = "MONITORED"  # Ongoing monitoring required
    ERROR = "error"


class VectorPriority(Enum):
    """Priority level for vector processing"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class VectorResult:
    """Standardized result structure for all vector agents"""
    vector_id: str
    vector_name: str
    status: VectorStatus
    priority: VectorPriority
    processed_data: Dict[str, Any] = field(default_factory=dict)
    findings: List[str] = field(default_factory=list)
    risk_score: int = 0  # 0-100
    confidence: float = 0.0  # 0.0-1.0
    processing_time_ms: int = 0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)
    architect_ai_payload: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "vector_id": self.vector_id,
            "vector_name": self.vector_name,
            "status": self.status.value,
            "priority": self.priority.value,
            "processed_data": self.processed_data,
            "findings": self.findings,
            "risk_score": self.risk_score,
            "confidence": self.confidence,
            "processing_time_ms": self.processing_time_ms,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
            "architect_ai_payload": self.architect_ai_payload
        }


@dataclass
class UserQuery:
    """Structured user query for vector processing"""
    user_id: str
    query_text: str
    query_type: str  # "scan", "analyze", "erase", "monitor"
    parameters: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class BaseVectorAgent(ABC):
    """
    Abstract base class for all Identity Vector Agents.
    
    Each vector agent must implement:
    - parse_query(): Parse and validate user input
    - process_data(): Process the parsed data
    - generate_architect_payload(): Prepare data for Architect AI
    - get_vector_config(): Return vector-specific configuration
    """
    
    def __init__(self, vector_id: str, vector_name: str):
        self.vector_id = vector_id
        self.vector_name = vector_name
        self.config = self.get_vector_config()
        
    @abstractmethod
    def get_vector_config(self) -> Dict[str, Any]:
        """Return vector-specific configuration"""
        pass
    
    @abstractmethod
    def parse_query(self, query: UserQuery) -> Dict[str, Any]:
        """
        Parse and validate user query for this vector.
        
        Args:
            query: UserQuery object containing user input
            
        Returns:
            Parsed and validated data dictionary
        """
        pass
    
    @abstractmethod
    def process_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the parsed data for this vector.
        
        Args:
            parsed_data: Output from parse_query()
            
        Returns:
            Processed data dictionary with findings and analysis
        """
        pass
    
    @abstractmethod
    def generate_architect_payload(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate payload for Architect AI MCP server.
        
        Args:
            processed_data: Output from process_data()
            
        Returns:
            Structured payload for Architect AI processing
        """
        pass
    
    def execute(self, query: UserQuery) -> VectorResult:
        """
        Execute the complete vector processing pipeline.
        
        Args:
            query: UserQuery object
            
        Returns:
            VectorResult with complete processing results
        """
        import time
        start_time = time.time()
        
        try:
            # Step 1: Parse query
            parsed_data = self.parse_query(query)
            
            # Step 2: Process data
            processed_data = self.process_data(parsed_data)
            
            # Step 3: Generate Architect AI payload
            architect_payload = self.generate_architect_payload(processed_data)
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            # Determine status based on findings
            status = self._determine_status(processed_data)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(processed_data)
            
            return VectorResult(
                vector_id=self.vector_id,
                vector_name=self.vector_name,
                status=status,
                priority=VectorPriority(self.config.get("priority", "medium")),
                processed_data=processed_data,
                findings=processed_data.get("findings", []),
                risk_score=risk_score,
                confidence=processed_data.get("confidence", 0.8),
                processing_time_ms=processing_time,
                metadata=self.config,
                architect_ai_payload=architect_payload
            )
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            return VectorResult(
                vector_id=self.vector_id,
                vector_name=self.vector_name,
                status=VectorStatus.ERROR,
                priority=VectorPriority.HIGH,
                findings=[f"Processing error: {str(e)}"],
                risk_score=100,  # Max risk on error
                confidence=0.0,
                processing_time_ms=processing_time,
                metadata={"error": str(e), "error_type": type(e).__name__}
            )
    
    def _determine_status(self, processed_data: Dict[str, Any]) -> VectorStatus:
        """Determine vector status based on processed data"""
        risk_level = processed_data.get("risk_level", "low").lower()
        
        if risk_level == "critical":
            return VectorStatus.NUKED
        elif risk_level == "high":
            return VectorStatus.MONITORED
        elif risk_level == "medium":
            return VectorStatus.MONITORED
        else:
            return VectorStatus.KNOXED
    
    def _calculate_risk_score(self, processed_data: Dict[str, Any]) -> int:
        """Calculate risk score (0-100) based on processed data"""
        base_score = processed_data.get("base_risk_score", 0)
        findings_count = len(processed_data.get("findings", []))
        critical_findings = processed_data.get("critical_findings", 0)
        
        # Calculate score: base + findings weight + critical findings weight
        score = base_score + (findings_count * 5) + (critical_findings * 20)
        return min(100, max(0, score))


class VectorAgentRegistry:
    """Registry for all vector agents"""
    
    def __init__(self):
        self._agents: Dict[str, BaseVectorAgent] = {}
    
    def register(self, agent: BaseVectorAgent):
        """Register a vector agent"""
        self._agents[agent.vector_id] = agent
    
    def get_agent(self, vector_id: str) -> Optional[BaseVectorAgent]:
        """Get a vector agent by ID"""
        return self._agents.get(vector_id)
    
    def list_agents(self) -> List[Dict[str, str]]:
        """List all registered agents"""
        return [
            {
                "vector_id": agent.vector_id,
                "vector_name": agent.vector_name,
                "priority": agent.config.get("priority", "medium")
            }
            for agent in self._agents.values()
        ]
    
    def execute_vector(self, vector_id: str, query: UserQuery) -> Optional[VectorResult]:
        """Execute a specific vector agent"""
        agent = self.get_agent(vector_id)
        if agent:
            return agent.execute(query)
        return None


# Global registry instance
vector_registry = VectorAgentRegistry()