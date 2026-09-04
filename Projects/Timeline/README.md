# Projects/Timeline

This directory contains the **agentic workflow** that keeps the Agape Sovereign project timeline in sync between local state and GitHub.

## Files

| File | Purpose |
|------|---------|
| `TIMELINE.md` | Master project timeline — retroactive from Dec 20, 2025 |
| `sync_agent.py` | Python sync agent — creates milestones, issues, and links to GitHub Project #2 |
| `README.md` | This file |

The `.github/workflows/timeline-sync.yml` GitHub Actions workflow runs this agent daily at 06:00 UTC.

## Running manually

```bash
export GITHUB_TOKEN=ghp_...
python Projects/Timeline/sync_agent.py
```

## Project timeline anchor dates

| Phase | Period | Status |
|-------|--------|--------|
| Phase 0 — Genesis | Dec 20, 2025 | ✅ Complete |
| Phase 1 — Foundation | Jan 2026 | ✅ Complete |
| Phase 2 — Official Launch | **Feb 26, 2026** | ✅ Complete |
| Phase 3 — Repository & v1.0.0 | Apr 20, 2026 | ✅ Complete |
| Phase 4 — Identity Vectors v2.0 | Jul 2026 | 🔄 Active |

## GitHub Projects

- **Primary board:** [Agape Sovereign #2](https://github.com/users/izrl613/projects/2)
- **Sprint board:** [Project #3](https://github.com/users/izrl613/projects/3)

## Architecture note

All processing in `sync_agent.py` is local — no Vertex AI, no external LLM calls. Consistent with the Architect AI offline policy: Vertex AI is reserved exclusively for encrypted SHA-256 user data document processing and PDF rendering.
