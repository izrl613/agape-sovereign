# Privacy Audit MCP

A local MCP server for safe, review-first disk cleanup work on macOS.

The server exposes read-only audit tools by default. The only mutating tool,
`move_to_trash`, is restricted to known cache/log/download locations inside the
current user's home folder and requires `confirm=true`.

## Tools

- `system_profile`: basic non-secret system information.
- `known_cleanup_locations`: cache/log/download paths the server knows about.
- `estimate_cleanup_locations`: read-only size estimates for cleanup targets.
- `scan_home_usage`: read-only disk usage scan inside the current user's home.
- `cleanup_plan`: human-reviewable cleanup candidates.
- `move_to_trash`: move reviewed allowlisted paths to `~/.Trash`.

## Run

```bash
cd privacy-audit-mcp
npm install
npm start
```

## Codex MCP Config Example

Add this server to your MCP client config:

```json
{
  "mcpServers": {
    "privacy-audit": {
      "command": "node",
      "args": [
        "/Users/aarondavid/Documents/agape-sovereign/agape-sovereign/privacy-audit-mcp/src/index.js"
      ]
    }
  }
}
```

## Safety Notes

This server intentionally does not install a LaunchAgent, run in the background,
download account data, or delete arbitrary filesystem paths.

Start with `cleanup_plan`, review the paths, then use `move_to_trash` only for
specific paths you actually want to remove.
