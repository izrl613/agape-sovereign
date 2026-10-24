#!/bin/bash

# Sovereign MCP Server Deployment Script
# This script prepares and starts the local MCP server on a GCP VM.

echo "🚀 Starting Sovereign MCP Server Deployment..."

# 1. Install dependencies (assuming Ubuntu/Debian)
echo "📦 Installing dependencies..."
sudo apt-get update
sudo apt-get install -y nodejs npm curl

# 2. Install Ollama (for the local LLM)
echo "🧠 Installing Ollama for local LLM inference..."
curl -fsSL https://ollama.com/install.sh | sh

# 3. Pull the required model
echo "📥 Pulling qwen3-vl:4b model..."
ollama pull qwen3-vl:4b

# 4. Setup project directory
mkdir -p ~/sovereign-mcp
cp -r /Users/aarondavid/agape-sovereign/mcp-server/* ~/sovereign-mcp/

# 5. Initialize Node project
cd ~/sovereign-mcp
npm init -y
npm install typescript ts-node @types/node node-fetch

# 6. Create a systemd service to keep the MCP server running
echo "⚙️ Creating systemd service..."
sudo bash -c 'cat <<EOF > /etc/systemd/system/sovereign-mcp.service
[Unit]
Description=Sovereign MCP Server
After=network.target ollama.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/sovereign-mcp
ExecStart=/usr/bin/npx ts-node server.ts
Restart=always

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable sovereign-mcp
sudo systemctl start sovereign-mcp

echo "✅ Deployment Complete! Sovereign MCP Server is running as a background service."
echo "🔗 Local Endpoint: http://localhost:11434"
echo "🧠 Model: qwen3-vl:4b"
