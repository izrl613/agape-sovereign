#!/usr/bin/env python3
"""
Agape Sovereign — Timeline Sync Agent
======================================
Syncs the local agape-sovereign project timeline to GitHub:
  - Creates/updates GitHub milestones for each phase
  - Creates retroactive timeline issues tagged with `roadmap` label
  - Adds issues to GitHub Projects V2 #2 (Agape Sovereign)
  - Updates TIMELINE.md with latest events

Usage:
    python Projects/Timeline/sync_agent.py

Requires:
    GITHUB_TOKEN env var (or GH_TOKEN)
    pip install PyGithub requests

Design principles:
  - Idempotent: safe to re-run; skips already-created items
  - Offline-first: reads from local TIMELINE.md as source of truth
  - No Vertex AI: all processing is local (adheres to Architect AI offline policy)
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone
from typing import Optional

try:
    import requests
except ImportError:
    print("[ERROR] Missing dependency: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
REPO_OWNER = "izrl613"
REPO_NAME = "agape-sovereign"
PROJECT_V2_NUMBER = 2          # GitHub Projects V2 #2 — "Agape Sovereign"
PROJECT_V2_NODE_ID = "PVT_kwHODuOYYs4BN0RD"
TIMELINE_FILE = os.path.join(os.path.dirname(__file__), "TIMELINE.md")

API = "https://api.github.com"
GRAPHQL = "https://api.github.com/graphql"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("timeline-sync")

# ---------------------------------------------------------------------------
# Timeline definition — single source of truth
# Milestones and their representative issues.
# Dates are intentionally in the past (retroactive).
# ---------------------------------------------------------------------------

MILESTONES = [
    {
        "title": "Phase 0 — Project Genesis",
        "description": "Project inception: concept, GCP setup, domain registration. Dec 20, 2025.",
        "due_on": "2025-12-31T00:00:00Z",
        "state": "closed",
        "issues": [
            {
                "title": "[TIMELINE] Phase 0 — Project Genesis (Dec 20, 2025)",
                "body": (
                    "## Agape Sovereign — Project Genesis\n\n"
                    "**Start date:** December 20, 2025\n\n"
                    "### Events\n"
                    "- Dec 15, 2025: GitHub account `izrl613` created\n"
                    "- Dec 20, 2025: **Agape Sovereign project officially begins**\n"
                    "- Dec 2025: GCP project `agape-sovereign` initialized under `idin@agape.nyc`\n"
                    "- Dec 2025: Domain `sovereign.nyc` registered\n"
                    "- Dec 2025: Cloudflare Zero Trust configuration started\n\n"
                    "### Context\n"
                    "First principles: a federated AI digital identity platform where the "
                    "individual owns and controls their sovereign data profile.\n\n"
                    "_Retroactively created by Timeline Sync Agent on 2026-07-20_"
                ),
                "labels": ["roadmap", "documentation"],
                "state": "closed",
            }
        ],
    },
    {
        "title": "Phase 1 — Foundation & GitHub Infrastructure",
        "description": "GitHub Projects, GCP infrastructure, Vertex AI credit. Jan 2026.",
        "due_on": "2026-01-31T00:00:00Z",
        "state": "closed",
        "issues": [
            {
                "title": "[TIMELINE] Phase 1 — Foundation & GitHub Infrastructure (Jan 2026)",
                "body": (
                    "## Foundation & GitHub Infrastructure\n\n"
                    "**Period:** January 2026\n\n"
                    "### Events\n"
                    "- Jan 25, 2026: GitHub Projects V2 #1 created — \"Agape Sovereign\"\n"
                    "- Jan 29, 2026: GitHub Projects V2 #2 created — \"Agape Sovereign\" (primary board)\n"
                    "- Jan 2026: GCP Vertex AI $1,000 credit secured (expires 2027-01-26)\n"
                    "- Jan 2026: Agent Builder `agape-docs-store` provisioned\n"
                    "- Jan 2026: Firebase project linked to GCP `agape-sovereign`\n\n"
                    "_Retroactively created by Timeline Sync Agent on 2026-07-20_"
                ),
                "labels": ["roadmap", "gcp"],
                "state": "closed",
            }
        ],
    },
    {
        "title": "Phase 2 — Official Launch",
        "description": "sovereign.nyc live. Feb 26, 2026 official launch date.",
        "due_on": "2026-02-28T00:00:00Z",
        "state": "closed",
        "issues": [
            {
                "title": "[TIMELINE] Phase 2 — Official Launch (Feb 26, 2026)",
                "body": (
                    "## Official Launch\n\n"
                    "**Launch date:** February 26, 2026\n\n"
                    "### Events\n"
                    "- Feb 20, 2026: GitHub Projects V2 #3 created (sprint board)\n"
                    "- **Feb 26, 2026: OFFICIAL LAUNCH — Agape Sovereign goes live**\n"
                    "- Feb 26, 2026: `sovereign.nyc` live via Firebase Hosting\n"
                    "- Feb 26, 2026: Google OAuth consent screen activated\n\n"
                    "_Retroactively created by Timeline Sync Agent on 2026-07-20_"
                ),
                "labels": ["roadmap", "stage-1"],
                "state": "closed",
            }
        ],
    },
    {
        "title": "Phase 3 — Repository & v1.0.0",
        "description": "GitHub repo created, v1.0.0 PWA with React 19 + Firebase. Apr 20, 2026.",
        "due_on": "2026-04-30T00:00:00Z",
        "state": "closed",
        "issues": [
            {
                "title": "[TIMELINE] Phase 3 — Repository Creation & v1.0.0 (Apr 20, 2026)",
                "body": (
                    "## Repository Creation & v1.0.0\n\n"
                    "**Date:** April 20, 2026\n\n"
                    "### Events\n"
                    "- Apr 20, 2026: `izrl613/agape-sovereign` GitHub repo created\n"
                    "- Apr 20, 2026: **v1.0.0** — React 19, Vite, Firebase PWA\n"
                    "- Apr 20, 2026: AEGIS dark theme live\n"
                    "- Apr 20, 2026: Architect AI integration\n"
                    "- May 1, 2026: Android + Apple repos created\n"
                    "- May 24, 2026: `izrl613/architect-ai` repo created\n\n"
                    "_Retroactively created by Timeline Sync Agent on 2026-07-20_"
                ),
                "labels": ["roadmap", "stage-2"],
                "state": "closed",
            }
        ],
    },
    {
        "title": "Phase 4 — v2.0 Identity Vectors & Shield Platform",
        "description": "16 Identity Vector modules (V-01-V-16) + Shield V-17. v2.0.0 Jul 12, 2026.",
        "due_on": "2026-07-31T00:00:00Z",
        "state": "open",
        "issues": [
            {
                "title": "[TIMELINE] Phase 4 — v2.0 Identity Vectors (Jul 12, 2026)",
                "body": (
                    "## v2.0 Identity Vectors & Shield Platform\n\n"
                    "**Period:** May–July 2026 (active)\n\n"
                    "### Events\n"
                    "- v2.0.0 (Jul 12, 2026): 16 Identity Vector modules + Shield Platform (V-17)\n"
                    "- Shield pillars: DLP Shield, Identity Guard, PII Anonymizer, Privacy Monitor, AI Armor\n"
                    "- Passkey login (WebAuthn Level 2)\n"
                    "- v2.1.0 (Jul 12, 2026): PWA Manifest, GitHub Wiki, README overhaul\n"
                    "- Jul 19, 2026: GCP near-zero cost observability stack\n"
                    "- Jul 19, 2026: Projects/Timeline sync agent deployed\n\n"
                    "_Created by Timeline Sync Agent on 2026-07-20_"
                ),
                "labels": ["roadmap", "stage-3"],
                "state": "open",
            }
        ],
    },
]

# ---------------------------------------------------------------------------
# GitHub API helpers
# ---------------------------------------------------------------------------

def headers() -> dict:
    if not GITHUB_TOKEN:
        raise RuntimeError(
            "GITHUB_TOKEN or GH_TOKEN environment variable is required."
        )
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def rest(method: str, path: str, **kwargs):
    url = f"{API}{path}"
    resp = requests.request(method, url, headers=headers(), **kwargs)
    if not resp.ok:
        log.error("REST %s %s -> %d: %s", method, path, resp.status_code, resp.text[:300])
    resp.raise_for_status()
    return resp.json() if resp.content else {}


def graphql(query: str, variables: Optional[dict] = None) -> dict:
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = requests.post(GRAPHQL, headers=headers(), json=payload)
    resp.raise_for_status()
    data = resp.json()
    if "errors" in data:
        log.error("GraphQL errors: %s", data["errors"])
    return data.get("data", {})


# ---------------------------------------------------------------------------
# Milestone management
# ---------------------------------------------------------------------------

def get_existing_milestones() -> dict:
    """Return {title: milestone_dict} for all existing milestones."""
    milestones = rest("GET", f"/repos/{REPO_OWNER}/{REPO_NAME}/milestones",
                      params={"state": "all", "per_page": 100})
    return {m["title"]: m for m in milestones}


def ensure_milestone(ms_def: dict, existing: dict) -> int:
    """Create milestone if not already present; return milestone number."""
    title = ms_def["title"]
    if title in existing:
        log.info("Milestone exists: %s (#%d)", title, existing[title]["number"])
        return existing[title]["number"]

    payload = {
        "title": title,
        "description": ms_def["description"],
        "due_on": ms_def["due_on"],
        "state": ms_def.get("state", "open"),
    }
    created = rest("POST", f"/repos/{REPO_OWNER}/{REPO_NAME}/milestones", json=payload)
    log.info("Created milestone: %s (#%d)", title, created["number"])
    return created["number"]


# ---------------------------------------------------------------------------
# Issue management
# ---------------------------------------------------------------------------

def get_existing_timeline_issues() -> set:
    """Return set of existing [TIMELINE] issue titles."""
    issues = rest("GET", f"/repos/{REPO_OWNER}/{REPO_NAME}/issues",
                  params={"state": "all", "labels": "roadmap", "per_page": 100})
    return {i["title"] for i in issues if "pull_request" not in i}


def ensure_issue(issue_def: dict, milestone_number: int, existing_titles: set) -> Optional[int]:
    """Create issue if not already present; return issue number."""
    title = issue_def["title"]
    if title in existing_titles:
        log.info("Issue exists: %s", title)
        return None

    payload = {
        "title": title,
        "body": issue_def["body"],
        "labels": issue_def.get("labels", []),
        "milestone": milestone_number,
        "assignees": [REPO_OWNER],
    }
    created = rest("POST", f"/repos/{REPO_OWNER}/{REPO_NAME}/issues", json=payload)
    issue_number = created["number"]
    log.info("Created issue #%d: %s", issue_number, title)

    # Close past-phase issues
    if issue_def.get("state") == "closed":
        rest("PATCH", f"/repos/{REPO_OWNER}/{REPO_NAME}/issues/{issue_number}",
             json={"state": "closed", "state_reason": "completed"})
        log.info("Closed issue #%d (completed phase)", issue_number)

    return issue_number


# ---------------------------------------------------------------------------
# GitHub Projects V2 — add item
# ---------------------------------------------------------------------------

def add_issue_to_project(issue_node_id: str) -> None:
    """Add an issue (by node_id) to Projects V2 #2."""
    mutation = """
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }
    """
    result = graphql(mutation, {
        "projectId": PROJECT_V2_NODE_ID,
        "contentId": issue_node_id,
    })
    item_id = result.get("addProjectV2ItemById", {}).get("item", {}).get("id")
    if item_id:
        log.info("Added to project: item_id=%s", item_id)
    else:
        log.warning("Could not add to project (may already exist): %s", result)


def get_issue_node_id(issue_number: int) -> Optional[str]:
    """Fetch the GraphQL node_id for an issue."""
    query = """
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) { id }
      }
    }
    """
    result = graphql(query, {
        "owner": REPO_OWNER,
        "repo": REPO_NAME,
        "number": issue_number,
    })
    return result.get("repository", {}).get("issue", {}).get("id")


# ---------------------------------------------------------------------------
# Main sync loop
# ---------------------------------------------------------------------------

def sync() -> None:
    log.info("=== Agape Sovereign Timeline Sync Agent ===")
    log.info("Repo: %s/%s", REPO_OWNER, REPO_NAME)
    log.info("Target project: V2 #%d (%s)", PROJECT_V2_NUMBER, PROJECT_V2_NODE_ID)

    existing_milestones = get_existing_milestones()
    existing_issues = get_existing_timeline_issues()

    for ms_def in MILESTONES:
        log.info("--- Processing: %s", ms_def["title"])
        ms_number = ensure_milestone(ms_def, existing_milestones)

        for issue_def in ms_def.get("issues", []):
            issue_number = ensure_issue(issue_def, ms_number, existing_issues)
            if issue_number:
                node_id = get_issue_node_id(issue_number)
                if node_id:
                    add_issue_to_project(node_id)

    log.info("=== Sync complete ===")
    # Update last-sync timestamp in TIMELINE.md
    timeline_path = TIMELINE_FILE
    if os.path.exists(timeline_path):
        with open(timeline_path, "r") as f:
            content = f.read()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        updated = content.replace(
            "*Last updated by sync agent:",
            f"*Last updated by sync agent: {today} — ",
        )
        # Simpler: always rewrite the last line
        lines = content.rstrip().split("\n")
        ts_line = f"*Last updated by sync agent: {today}*"
        if lines and lines[-1].startswith("*Last updated"):
            lines[-1] = ts_line
            with open(timeline_path, "w") as f:
                f.write("\n".join(lines) + "\n")
            log.info("Updated timestamp in TIMELINE.md")


if __name__ == "__main__":
    sync()
