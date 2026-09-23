#!/bin/bash
# Reconcile agape-sovereign local project repo and git against Github repo remote at izrl613/agape-sovereign on main branch

cd /Users/aarondavid/Documents/agape-sovereign || exit 1

echo "=== Starting Git Reconciliation at $(date) ==="

# Ensure we are on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Not on main branch (current: $CURRENT_BRANCH). Switching to main..."
  git checkout main
fi

# Fetch latest changes
git fetch origin main

# Check if there are local uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Local uncommitted changes detected. Stashing local changes..."
  git stash -m "Auto-reconciliation stash"
  HAS_STASH=true
else
  HAS_STASH=false
fi

# Rebase local main on origin/main
echo "Rebasing main on origin/main..."
if ! git rebase origin/main; then
  echo "ERROR: Rebase failed! Conflicts may exist. Aborting rebase..."
  git rebase --abort
  if [ "$HAS_STASH" = true ]; then
    git stash pop
  fi
  exit 1
fi

# Push main to origin
echo "Pushing changes to origin main..."
if ! git push origin main; then
  echo "ERROR: Push failed!"
  exit 1
fi

# Restore stash if needed
if [ "$HAS_STASH" = true ]; then
  echo "Restoring stashed local changes..."
  git stash pop
fi

echo "=== Git Reconciliation Completed Successfully ==="
