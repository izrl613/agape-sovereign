# Ollama Gemma 4 MCP Server

This is a local Model Context Protocol (MCP) server that exposes a tool (`generate_text_gemma4`) to allow other MCP clients to query your local Gemma 4 model via Ollama.

## Setup

1. Ensure you have Ollama installed and running.
2. Ensure you have the `gemma4` model pulled (`ollama run gemma4`).
3. Install dependencies for this MCP server:
   ```bash
   npm install
   ```

## Running the Server

MCP clients typically launch the server themselves via a standard IO stream. You can configure your MCP client (like Antigravity IDE, Claude Desktop, etc.) with the following command:

```bash
node /path/to/your/project/ollama-mcp-server/index.js
```

## Adding to Antigravity IDE

You can add this to your `.mcp.json` or Antigravity's MCP configuration settings like this:

```json
{
  "mcpServers": {
    "local-gemma4": {
      "command": "node",
      "args": [
        "/Users/aarondavid/Documents/agape-sovereign/agape-sovereign/ollama-mcp-server/index.js"
      ]
    }
  }
}
```
