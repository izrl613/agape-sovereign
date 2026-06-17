import os
import sys
import json
import logging
import asyncio
from typing import AsyncGenerator
import httpx
import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse, JSONResponse
from starlette.routing import Route

# Configure pretty terminal logging
logging.basicConfig(
    level=logging.INFO,
    format="\033[94m%(asctime)s\033[0m [\033[93mCODEX-PROXY\033[0m] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("codex-proxy")

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_LOCAL_MODEL = os.environ.get("OLLAMA_MODEL", "gemma4:e4b")
GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions"

async def get_models(request: Request) -> JSONResponse:
    """List available models in OpenAI format."""
    logger.info("Received GET /v1/models request")
    
    # Try to fetch models from Ollama to see what is locally available
    local_models = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if res.is_success:
                data = res.json()
                local_models = [m["name"] for m in data.get("models", [])]
    except Exception as e:
        logger.warning(f"Could not connect to Ollama to list models: {e}")

    # Build response list
    models_data = [
        {"id": "gemini-1.5-pro", "object": "model", "created": 1700000000, "owned_by": "google"},
        {"id": "gemini-1.5-flash", "object": "model", "created": 1700000000, "owned_by": "google"},
    ]
    
    for model_name in local_models:
        models_data.append({
            "id": model_name,
            "object": "model",
            "created": 1700000000,
            "owned_by": "ollama"
        })
        
    if DEFAULT_LOCAL_MODEL not in local_models:
        models_data.append({
            "id": DEFAULT_LOCAL_MODEL,
            "object": "model",
            "created": 1700000000,
            "owned_by": "ollama"
        })

    return JSONResponse({"object": "list", "data": models_data})


def prune_messages(messages: list, max_messages: int = 6) -> list:
    """
    Prunes the message history to prevent context overflow in local Ollama model.
    Preserves the system instruction (if any) and the last N messages.
    """
    if len(messages) <= max_messages:
        return messages

    pruned = []
    # Preserve system prompt if present
    if messages[0].get("role") == "system":
        pruned.append(messages[0])
        # Start slice after system prompt
        recent = messages[-(max_messages - 1):]
    else:
        recent = messages[-max_messages:]
        
    pruned.extend(recent)
    logger.info(f"Pruned message history from {len(messages)} to {len(pruned)} messages.")
    return pruned


async def fetch_ollama_fallback(payload: dict) -> AsyncGenerator[str, None]:
    """Queries local Ollama and streams response with a system notification prefix."""
    # Select available local model
    local_model = DEFAULT_LOCAL_MODEL
    
    # Prune history to be safe for local context limits
    pruned_messages = prune_messages(payload.get("messages", []))
    
    ollama_payload = {
        "model": local_model,
        "messages": pruned_messages,
        "temperature": payload.get("temperature", 0.2),
        "stream": payload.get("stream", False)
    }

    warning_prefix = (
        "⚠️ **[System Notification]**: Cloud Gemini API failed or encountered a context limit. "
        "The local Codex Agent has intercepted the turn and routed to local Ollama (`" + local_model + "`) "
        "to resume the session.\n\n"
    )
    
    ollama_openai_url = f"{OLLAMA_BASE_URL}/v1/chat/completions"
    logger.info(f"Routing to local Ollama endpoint: {ollama_openai_url} using model {local_model}")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            if not payload.get("stream", False):
                res = await client.post(ollama_openai_url, json=ollama_payload)
                if res.is_success:
                    res_data = res.json()
                    content = res_data["choices"][0]["message"]["content"]
                    res_data["choices"][0]["message"]["content"] = warning_prefix + content
                    yield json.dumps(res_data)
                else:
                    yield json.dumps({"error": f"Ollama returned error status: {res.status_code}"})
            else:
                # Send the warning prefix in the first chunk
                first_chunk = {
                    "choices": [{
                        "index": 0,
                        "delta": {"role": "assistant", "content": warning_prefix},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(first_chunk)}\n\n"
                
                async with client.stream("POST", ollama_openai_url, json=ollama_payload) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            yield line + "\n\n"
                        elif line.strip() == "data: [DONE]":
                            yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Failed to query local Ollama: {e}")
        yield json.dumps({"error": f"Failed to connect to local Ollama: {e}"})


async def chat_completions(request: Request) -> Response:
    """Proxies OpenAI chat completions. Intercepts errors and falls back to Ollama."""
    try:
        payload = await request.json()
    except Exception as e:
        return JSONResponse({"error": f"Invalid JSON payload: {e}"}, status_code=400)

    model = payload.get("model", "gemini-1.5-pro")
    stream = payload.get("stream", False)
    gemini_key = os.environ.get("GEMINI_API_KEY")

    logger.info(f"Request received for model: {model} (stream={stream})")

    # If it's a local model request or GEMINI_API_KEY is missing, route to Ollama fallback immediately
    if "gemini" not in model.lower() or not gemini_key:
        if not gemini_key:
            logger.info("GEMINI_API_KEY is not set. Falling back to local Ollama.")
        else:
            logger.info(f"Local model {model} requested. Routing to Ollama.")
            
        if stream:
            return StreamingResponse(
                fetch_ollama_fallback(payload),
                media_type="text/event-stream"
            )
        else:
            # Gather generator output for non-streaming response
            full_response = ""
            async for chunk in fetch_ollama_fallback(payload):
                try:
                    data = json.loads(chunk)
                    if "error" in data:
                        return JSONResponse(data, status_code=500)
                    full_response = data
                except json.JSONDecodeError:
                    pass
            return JSONResponse(full_response)

    # Route to Cloud Gemini OpenAI endpoint
    headers = {"Authorization": f"Bearer {gemini_key}"}
    logger.info(f"Forwarding chat request to Cloud Gemini API...")

    async def cloud_stream_generator() -> AsyncGenerator[str, None]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", GEMINI_OPENAI_URL, json=payload, headers=headers) as response:
                    if not response.is_success:
                        logger.warning(f"Cloud Gemini returned status code {response.status_code}. Intercepting for fallback.")
                        async for chunk in fetch_ollama_fallback(payload):
                            yield chunk
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            yield line + "\n\n"
                        elif line.strip() == "data: [DONE]":
                            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Connection to Cloud Gemini failed: {e}. Falling back to local Ollama.")
            async for chunk in fetch_ollama_fallback(payload):
                yield chunk

    if stream:
        return StreamingResponse(
            cloud_stream_generator(),
            media_type="text/event-stream"
        )
    else:
        # Non-streaming cloud request
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(GEMINI_OPENAI_URL, json=payload, headers=headers)
                if res.is_success:
                    return JSONResponse(res.json())
                else:
                    logger.warning(f"Cloud Gemini returned status {res.status_code}. Falling back to local Ollama.")
        except Exception as e:
            logger.error(f"Cloud Gemini request failed: {e}. Falling back to local Ollama.")

        # Fallback to local Ollama for non-streaming
        full_response = ""
        async for chunk in fetch_ollama_fallback(payload):
            try:
                data = json.loads(chunk)
                full_response = data
            except json.JSONDecodeError:
                pass
        return JSONResponse(full_response)


routes = [
    Route("/v1/models", get_models, methods=["GET"]),
    Route("/v1/chat/completions", chat_completions, methods=["POST"]),
]

app = Starlette(routes=routes)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8090))
    logger.info(f"Starting Codex Local Agent Proxy on port {port}...")
    logger.info("Ensure local Ollama is running at http://localhost:11434")
    uvicorn.run(app, host="0.0.0.0", port=port)
