# Identity Vectors Plugin

Exposes the canonical 16-vector DIFF registry and probe discovery.

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `vectors.list` | — | All 16 `VectorDef` entries |
| `vectors.get` | `{ key }` | A single vector by label (`V-01`) or module id (`email-scanner`) |
| `vectors.probes` | — | Registered probe ids and descriptions |
| `vectors.score` | `{ findings }` | Weighted 0–100 finding score |

## Integrity

`vectors.list` calls `assertCompleteRegistry()` first. If the registry drifts
from exactly 16 unique vectors across all four DIFF categories, the tool throws
rather than returning a partial scan surface.
