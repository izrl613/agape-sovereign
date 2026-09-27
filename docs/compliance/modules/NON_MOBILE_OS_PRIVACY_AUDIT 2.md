# Non-Mobile OS Privacy Audit

## Scope

The `non-mobile-os` DIFF module covers laptop and desktop operating systems:

- macOS
- Windows
- Linux

Mobile OS posture is intentionally out of scope and remains covered by the existing mobile security module.

## Execution Model

Agape Sovereign uses two coordinated layers:

- Antigravity/Continue can call the local `privacy-audit` MCP server directly.
- The PWA/backend exposes `/api/privacy-audit/non-mobile-os` as a read-only summary endpoint for module scans.

The module must not install background jobs, create LaunchAgents, bypass OS permissions, delete arbitrary files, or transmit local file contents.

## Read-Only MCP Tools

Use these tools before any cleanup proposal:

- `system_profile`
- `known_cleanup_locations`
- `estimate_cleanup_locations`
- `scan_home_usage`
- `cleanup_plan`

The mutating `move_to_trash` tool is allowed only after human review and explicit confirmation.

## Finding Semantics

- `KNOXED`: read-only audit completed with no high-footprint reviewed paths.
- `MONITORED`: reviewed paths or memory pressure need user review.
- `NUKED`: reserved for confirmed exposure states, not simple cache size.

## Evidence Contract

Findings should cite:

- OS platform and architecture
- reviewed path totals
- largest cache/log/download candidate
- timestamp
- whether the result came from the MCP bridge or backend summary endpoint
