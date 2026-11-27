"""
Vector Module Orchestrator

Coordinates the execution of all 16 identity vector agents and manages
the handoff to Architect AI MCP server.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from .base_vector_agent import (
    BaseVectorAgent, 
    VectorResult, 
    UserQuery, 
    VectorAgentRegistry,
    vector_registry
)
from . import register_all_agents


class VectorOrchestrator:
    """
    Orchestrates the execution of identity vector agents and coordinates
    with Architect AI MCP server for comprehensive identity analysis.
    """
    
    def __init__(self):
        self.registry = vector_registry
        self.register_agents()
        self.architect_mcp_client = None
        
    def register_agents(self):
        """Register all 16 vector agents"""
        count = register_all_agents()
        print(f"Registered {count} identity vector agents")
    
    def execute_vector(self, vector_id: str, query: UserQuery) -> Optional[VectorResult]:
        """Execute a single vector agent"""
        return self.registry.execute_vector(vector_id, query)
    
    def execute_all_vectors(self, query: UserQuery) -> Dict[str, VectorResult]:
        """Execute all 16 vector agents in parallel"""
        results = {}
        agents = self.registry.list_agents()
        
        for agent_info in agents:
            vector_id = agent_info["vector_id"]
            try:
                result = self.execute_vector(vector_id, query)
                if result:
                    results[vector_id] = result
            except Exception as e:
                print(f"Error executing {vector_id}: {e}")
                
        return results
    
    def execute_selected_vectors(self, vector_ids: List[str], query: UserQuery) -> Dict[str, VectorResult]:
        """Execute specific vector agents"""
        results = {}
        
        for vector_id in vector_ids:
            try:
                result = self.execute_vector(vector_id, query)
                if result:
                    results[vector_id] = result
            except Exception as e:
                print(f"Error executing {vector_id}: {e}")
                
        return results
    
    def generate_architect_payload(self, vector_results: Dict[str, VectorResult]) -> Dict[str, Any]:
        """
        Generate comprehensive payload for Architect AI MCP server
        from all vector results.
        """
        # Calculate aggregate risk metrics
        total_risk_score = sum(result.risk_score for result in vector_results.values())
        avg_risk_score = total_risk_score / len(vector_results) if vector_results else 0
        
        critical_vectors = [
            vid for vid, result in vector_results.items() 
            if result.status.value == "NUKED"
        ]
        monitored_vectors = [
            vid for vid, result in vector_results.items() 
            if result.status.value == "MONITORED"
        ]
        knoxed_vectors = [
            vid for vid, result in vector_results.items() 
            if result.status.value == "KNOXED"
        ]
        
        # Aggregate all findings
        all_findings = []
        for result in vector_results.values():
            all_findings.extend(result.findings)
        
        # Collect all architect payloads
        architect_payloads = {}
        for vid, result in vector_results.items():
            if result.architect_ai_payload:
                architect_payloads[vid] = result.architect_ai_payload
        
        # Generate sovereign score
        sovereign_score = self._calculate_sovereign_score(vector_results)
        
        return {
            "orchestration_metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "total_vectors_processed": len(vector_results),
                "processing_mode": "full_sovereign_analysis"
            },
            "aggregate_risk_analysis": {
                "total_risk_score": total_risk_score,
                "average_risk_score": round(avg_risk_score, 2),
                "risk_level": self._determine_overall_risk(avg_risk_score),
                "critical_vectors_count": len(critical_vectors),
                "monitored_vectors_count": len(monitored_vectors),
                "knoxed_vectors_count": len(knoxed_vectors)
            },
            "vector_status_summary": {
                "critical_vectors": critical_vectors,
                "monitored_vectors": monitored_vectors,
                "knoxed_vectors": knoxed_vectors
            },
            "sovereign_score": {
                "score": sovereign_score,
                "rating": self._get_sovereign_rating(sovereign_score),
                "calculation_method": "weighted_vector_analysis"
            },
            "comprehensive_findings": {
                "total_findings": len(all_findings),
                "critical_findings": [f for f in all_findings if "CRITICAL" in f.upper()],
                "all_findings": all_findings
            },
            "vector_specific_payloads": architect_payloads,
            "priority_recommendations": self._generate_priority_recommendations(vector_results),
            "requires_immediate_action": len(critical_vectors) > 0
        }
    
    def _calculate_sovereign_score(self, vector_results: Dict[str, VectorResult]) -> int:
        """Calculate sovereign score (0-100) based on vector results"""
        if not vector_results:
            return 50
        
        knoxed_count = sum(1 for r in vector_results.values() if r.status.value == "KNOXED")
        total_count = len(vector_results)
        
        # Base score from knoxed vectors
        base_score = (knoxed_count / total_count) * 100
        
        # Adjust for risk scores
        avg_risk = sum(r.risk_score for r in vector_results.values()) / total_count
        risk_penalty = avg_risk * 0.3
        
        sovereign_score = int(base_score - risk_penalty)
        return max(0, min(100, sovereign_score))
    
    def _get_sovereign_rating(self, score: int) -> str:
        """Get sovereign rating based on score"""
        if score >= 80:
            return "EXCELLENT"
        elif score >= 60:
            return "GOOD"
        elif score >= 40:
            return "FAIR"
        elif score >= 20:
            return "POOR"
        else:
            return "CRITICAL"
    
    def _determine_overall_risk(self, avg_risk_score: float) -> str:
        """Determine overall risk level"""
        if avg_risk_score >= 70:
            return "CRITICAL"
        elif avg_risk_score >= 50:
            return "HIGH"
        elif avg_risk_score >= 30:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_priority_recommendations(self, vector_results: Dict[str, VectorResult]) -> List[str]:
        """Generate priority recommendations based on vector results"""
        recommendations = []
        
        # Critical vectors need immediate attention
        critical_vectors = [
            (vid, result) for vid, result in vector_results.items() 
            if result.status.value == "NUKED"
        ]
        
        if critical_vectors:
            recommendations.append("IMMEDIATE: Address critical security vulnerabilities")
            for vid, result in critical_vectors:
                recommendations.append(f"URGENT: Review {result.vector_name} ({vid})")
        
        # Monitored vectors need attention
        monitored_vectors = [
            (vid, result) for vid, result in vector_results.items() 
            if result.status.value == "MONITORED"
        ]
        
        if monitored_vectors:
            recommendations.append("IMPORTANT: Review monitored vectors for ongoing risks")
        
        # General recommendations
        recommendations.extend([
            "Regularly update security configurations",
            "Enable two-factor authentication where available",
            "Review and update privacy settings"
        ])
        
        return recommendations
    
    def send_to_architect_ai(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send processed payload to Architect AI MCP server.
        
        In production, this would connect to the actual Architect AI MCP server.
        For now, we simulate the response.
        """
        # TODO: Integrate with actual Architect AI MCP server
        # import architect_mcp_client
        # return architect_mcp_client.process_identity_payload(payload)
        
        return {
            "status": "success",
            "architect_analysis": "Processed by Architect AI",
            "recommendations": payload["priority_recommendations"],
            "sovereign_action_plan": self._generate_action_plan(payload)
        }
    
    def _generate_action_plan(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Generate action plan based on Architect AI analysis"""
        return {
            "immediate_actions": [
                "Review critical vectors",
                "Implement security patches"
            ],
            "short_term_actions": [
                "Address monitored vectors",
                "Update security policies"
            ],
            "long_term_actions": [
                "Continuous monitoring",
                "Security training"
            ]
        }
    
    def run_full_analysis(self, query: UserQuery) -> Dict[str, Any]:
        """
        Run complete sovereign identity analysis:
        1. Execute all 16 vector agents
        2. Generate Architect AI payload
        3. Send to Architect AI
        4. Return comprehensive results
        """
        # Step 1: Execute all vectors
        vector_results = self.execute_all_vectors(query)
        
        # Step 2: Generate Architect AI payload
        architect_payload = self.generate_architect_payload(vector_results)
        
        # Step 3: Send to Architect AI
        architect_response = self.send_to_architect_ai(architect_payload)
        
        # Step 4: Return comprehensive results
        return {
            "vector_results": {vid: result.to_dict() for vid, result in vector_results.items()},
            "architect_payload": architect_payload,
            "architect_response": architect_response,
            "analysis_complete": True
        }


# Singleton instance
vector_orchestrator = VectorOrchestrator()