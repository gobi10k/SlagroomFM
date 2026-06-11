#!/usr/bin/env bash
# Nightly SQLite backup — run on the Mac via cron or launchd.
# Usage: ./scripts/backup.sh [potato-hostname]
set -euo pipefail

POTATO="${1:-raspberrypi}"
DEST=~/slagroomfm-backups/$(date +%Y-%m-%d)
mkdir -p "$DEST"

echo "==> Pulling databases from $POTATO"
rsync -avz alec@$POTATO:/mnt/ssd/db/ "$DEST/"

echo "==> Backup at $DEST"
