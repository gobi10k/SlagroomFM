#!/usr/bin/env bash
# Run on the Mac to build frontends and rsync to the Potato over Tailscale.
# Usage: ./scripts/deploy.sh [potato-hostname]
set -euo pipefail

POTATO="${1:-raspberrypi}"
APP=/srv/app

echo "==> Building platform frontend"
(cd platform/frontend && npm ci && npm run build)

echo "==> Building radio UI"
(cd radio/ui && npm ci && npm run build)

echo "==> Rsyncing to $POTATO"
rsync -avz --delete \
  platform/frontend/dist/ \
  alec@$POTATO:$APP/platform/frontend/dist/

# radio/ui build goes to radio/scheduler/static — already there from build output
rsync -avz --delete \
  radio/scheduler/static/ \
  alec@$POTATO:$APP/radio/scheduler/static/

rsync -avz \
  radio/radio.liq \
  caddy/Caddyfile \
  radio/scheduler/ \
  platform/backend/ \
  systemd/ \
  alec@$POTATO:$APP/

echo "==> Restarting services on $POTATO"
ssh alec@$POTATO "sudo systemctl restart radio-scheduler platform-backend liquidsoap caddy"

echo "Done!"
