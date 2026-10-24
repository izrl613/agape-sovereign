#!/bin/bash

# Sovereign MCP Server Deployment Script
# Target: GCP VM / Firebase Instance
# Purpose: Setup and run the Qwen3-VL:4B Knowledge Layer

set -e

echo "--- Starting Sovereign MCP Server Setup ---"

# 1. Update System
echo "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker (if not present)
if ! command -v docker &> /dev/null
then
    echo "Installing Docker..."
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce
fi

# 3. Install Ollama (for Qwen3-VL:4B)
if ! command -v ollama &> /dev/null
then
    echo "Installing Ollama for local LLM inference..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# 4. Pull the Model
echo "Pulling qwen3-vl:4b..."
ollama pull qwen3-vl:4b

# 5. Build and Run MCP Server
echo "Building MCP Server container..."
sudo docker build -t sovereign-mcp .
sudo docker run -d -p 3000:3000 --name sovereign-mcp-server --network host sovereign-mcp

echo "--- Deployment Complete ---"
echo "MCP Server is now running on port 3000."
echo "Model qwen3-vl:4b is loaded via Ollama."
