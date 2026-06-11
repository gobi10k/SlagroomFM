#!/usr/bin/env bash
# Build both frontends and deploy static assets to the Pi over Tailscale.
# Source code deploys via git pull on the Pi.
# Usage: ./scripts/deploy.sh <pi-ip-or-hostname>
set -euo pipefail

PI="${1:?Usage: $0 <pi-ip-or-hostname>}"
APP=/srv/app

echo "==> Building platform frontend"
(cd platform/frontend && npm run build)

echo "==> Building radio UI"
(cd radio/ui && npm run build)

echo "==> Rsyncing built assets to $PI"
rsync -avz --delete \
  --exclude='node_modules' --exclude='.venv-*' --exclude='*.env' --exclude='._*' \
  platform/frontend/dist/ \
  alec@"$PI":$APP/platform/frontend/dist/

rsync -avz --delete \
  --exclude='node_modules' --exclude='.venv-*' --exclude='*.env' --exclude='._*' \
  radio/scheduler/static/ \
  alec@"$PI":$APP/radio/scheduler/static/

echo "==> Pulling latest code on $PI"
ssh alec@"$PI" "git -C $APP pull"

echo "==> Restarting services on $PI"
ssh alec@"$PI" "sudo systemctl restart platform-backend radio-scheduler"

echo ""
echo "Done! platform-backend and radio-scheduler restarted on $PI."
