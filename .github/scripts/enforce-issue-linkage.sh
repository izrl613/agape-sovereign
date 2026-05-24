#!/usr/bin/env bash
set -euo pipefail

pr_body="${PR_BODY:-}"

normalized="$(printf '%s' "$pr_body" | tr '\n' ' ' | tr -s ' ')"

issue_id_regex='#[0-9]+'
if [[ ! "$normalized" =~ $issue_id_regex ]]; then
  echo "::error file=PR body::CRITICAL COMPLIANCE FAILURE. PR must reference an approved Issue ID (e.g., Fixes #123) to proceed."
  exit 1
fi

