#!/usr/bin/env bash
set -euo pipefail

base_sha="${BASE_SHA:-}"
head_sha="${HEAD_SHA:-}"

if [[ -z "$base_sha" || -z "$head_sha" ]]; then
  echo "::warning file=resource_audit::Resource impact validator skipped (missing BASE_SHA/HEAD_SHA)."
  exit 0
fi

diff_text="$(git diff --unified=0 "$base_sha" "$head_sha" || true)"

# Heuristic checks only. This should guide reviewers, not block merges.
if printf '%s' "$diff_text" | rg -n "db\\.collection\\(['\"]users['\"]\\)\\.get\\(\\)" >/dev/null 2>&1; then
  echo "::warning file=resource_audit::Potential high read operation detected (Firestore users collection). Confirm pagination, caching, and index strategy."
fi

if printf '%s' "$diff_text" | rg -n "getDocs\\(collection\\([^\\)]*['\"]users['\"][^\\)]*\\)\\)" >/dev/null 2>&1; then
  echo "::warning file=resource_audit::Potential unbounded Firestore read detected (users collection). Confirm query constraints and pagination."
fi

