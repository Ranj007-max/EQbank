#!/usr/bin/env bash
git fetch origin
git checkout jules-dev
git pull origin jules-dev
echo "[sync.sh] Repo synced to latest jules-dev"
