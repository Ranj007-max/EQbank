#!/usr/bin/env bash

# Fetch latest changes from remote
git fetch origin

# Switch to jules-dev branch
git checkout jules-dev

# Reset local branch to match remote exactly (avoids conflicts)
git reset --hard origin/jules-dev

# Show latest commit for verification
echo "[sync.sh] Repo synced to latest jules-dev"
git log -1 --oneline
