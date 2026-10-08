"""
Architect AI MCP Server Integration

Integrates the Vector Module Orchestrator with the Architect AI MCP server
for comprehensive identity analysis using local AI models.
"""

import asyncio
import json
from typing import Dict, Any, Optional
from datetime import datetime
from .vector_orchestrator import VectorOrchestrator, vector_orchestrator
from .base_vector_agent import UserQuery


class ArchitectMCPIntegration:
    """
    Integration layer between Vector Module Orchestrator and Architect AI MCP server.
    
    This class handles the communication between the 16 identity vector agents
    and the Architect AI MCP server running on localhost:3001.
    """
    
    def __init__(self, mcp_endpoint: str = "http://localhost:3001"):
        self.mcp_endpoint = mcp_endpoint
        self.orchestrator = vector_orchestrator
        self.session_id = None
        
    async def establish_session(self) -> bool:
        """Establish SSE session with Architect AI MCP server"""
        try:
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.mcp_endpoint}/sse",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        # Extract session ID from the connection
                        # The MCP server will send an "endpoint" event with the session ID
                        self.session_id = "established"  # Placeholder
                        return True
        except Exception as e:
            print(f"Failed to establish MCP session: {e}")
            return False
        
        return False
    
    async def send_vector_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send processed vector payload to Architect AI MCP server
        
        Args:
            payload: The generated payload from vector orchestrator
            
        Returns:
            Response from Architect AI
        """
        try:
            import aiohttp
            
            if not self.session_id:
                await self.establish_session()
            
            async with aiohttp.ClientSession() as session:
                # Call the Architect AI tool with vector analysis
                mcp_request = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "tools/call",
                    "params": {
                        "name": "architect_ai_analysis",
                        "arguments": {
                            "vector_payload": payload,
                            "question": "Analyze this sovereign identity vector data and provide recommendations"
                        }
                    }
                }
                
                async with session.post(
                    f"{self.mcp_endpoint}/message",
                    json=mcp_request,
                    timeout=aiohttp.ClientTimeout(total=120)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return self._parse_mcp_response(result)
                    else:
                        error_text = await response.text()
                        return {
                            "status": "error",
                            "error": f"MCP server error: {response.status}",
                            "details": error_text
                        }
                        
        except Exception as e:
            return {
                "status": "error",
                "error": f"Failed to send payload to MCP server: {str(e)}"
            }
    
    def _parse_mcp_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse MCP server response"""
        if "result" in response:
            content = response["result"].get("content", [])
            text_content = "\n".join([
                item.get("text", "") for item in content 
                if item.get("type") == "text"
            ])
            
            return {
                "status": "success",
                "analysis": text_content,
                "raw_response": response
            }
        elif "error" in response:
            return {
                "status": "error",
                "error": response["error"].get("message", "Unknown MCP error"),
                "code": response["error"].get("code")
            }
        else:
            return {
                "status": "error",
                "error": "Invalid MCP response format"
            }
    
    async def run_complete_analysis(
        self, 
        user_query: str,
        user_id: str = "anonymous",
        query_type: str = "scan",
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run complete sovereign identity analysis:
        1. Parse user query
        2. Execute all 16 vector agents
        3. Generate Architect AI payload
        4. Send to Architect AI MCP server
        5. Return comprehensive results
        
        Args:
            user_query: The user's query text
            user_id: User identifier
            query_type: Type of query (scan, analyze, erase, monitor)
            parameters: Additional parameters for vector processing
            
        Returns:
            Complete analysis results from vectors and Architect AI
        """
        # Step 1: Create user query object
        query = UserQuery(
            user_id=user_id,
            query_text=user_query,
            query_type=query_type,
            parameters=parameters or {}
        )
        
        # Step 2: Run vector analysis
        print(f"Running vector analysis for user: {user_id}")
        vector_results = self.orchestrator.execute_all_vectors(query)
        
        # Step 3: Generate Architect AI payload
        print("Generating Architect AI payload...")
        architect_payload = self.orchestrator.generate_architect_payload(vector_results)
        
        # Step 4: Send to Architect AI MCP server
        print("Sending payload to Architect AI MCP server...")
        architect_response = await self.send_vector_payload(architect_payload)
        
        # Step 5: Return comprehensive results
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "query_type": query_type,
            "vector_analysis": {
                "total_vectors_processed": len(vector_results),
                "vector_results": {
                    vid: result.to_dict() 
                    for vid, result in vector_results.items()
                }
            },
            "architect_ai_payload": architect_payload,
            "architect_ai_response": architect_response,
            "sovereign_score": architect_payload.get("sovereign_score", {}),
            "priority_recommendations": architect_payload.get("priority_recommendations", []),
            "analysis_complete": True
        }
    
    async def run_selected_vector_analysis(
        self,
        vector_ids: list,
        user_query: str,
        user_id: str = "anonymous",
        query_type: str = "scan",
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run analysis for specific vector agents only
        
        Args:
            vector_ids: List of vector IDs to execute (e.g., ["V-01", "V-02"])
            user_query: The user's query text
            user_id: User identifier
            query_type: Type of query
            parameters: Additional parameters
            
        Returns:
            Analysis results for selected vectors
        """
        query = UserQuery(
            user_id=user_id,
            query_text=user_query,
            query_type=query_type,
            parameters=parameters or {}
        )
        
        # Execute selected vectors
        vector_results = self.orchestrator.execute_selected_vectors(vector_ids, query)
        
        # Generate payload (partial analysis)
        architect_payload = self.orchestrator.generate_architect_payload(vector_results)
        
        # Send to Architect AI
        architect_response = await self.send_vector_payload(architect_payload)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "selected_vectors": vector_ids,
            "vector_analysis": {
                "total_vectors_processed": len(vector_results),
                "vector_results": {
                    vid: result.to_dict() 
                    for vid, result in vector_results.items()
                }
            },
            "architect_ai_response": architect_response,
            "analysis_complete": True
        }


# Singleton instance
architect_mcp_integration = ArchitectMCPIntegration()


async def test_integration():
    """Test the integration with Architect AI MCP server"""
    integration = ArchitectMCPIntegration()
    
    # Test query
    test_query = "Analyze my email security and social media footprint"
    
    try:
        results = await integration.run_complete_analysis(
            user_query=test_query,
            user_id="test_user",
            query_type="scan"
        )
        
        print("Integration test completed successfully!")
        print(f"Sovereign Score: {results['sovereign_score']}")
        print(f"Vectors Processed: {results['vector_analysis']['total_vectors_processed']}")
        
        return results
    except Exception as e:
        print(f"Integration test failed: {e}")
        return None


if __name__ == "__main__":
    # Run integration test
    asyncio.run(test_integration())