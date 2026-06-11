#!/usr/bin/env bash
# Run once on the Le Potato to set up the SlagroomFM environment.
# Must be run as root (or with sudo).
set -euo pipefail

APP=/srv/app
SSD=/mnt/ssd

echo "==> Creating directories"
mkdir -p $SSD/{music/artists,music/gigs,radio/{fallback,shows},db}
mkdir -p $APP
mkdir -p /etc/slagroomfm
chown -R alec:alec $SSD $APP

echo "==> Cloning repo"
[ -d $APP/.git ] || git clone https://github.com/gobi10k/slagroomfm $APP

echo "==> Python venvs"
python3 -m venv $APP/.venv-radio
$APP/.venv-radio/bin/pip install -q -r $APP/radio/scheduler/requirements.txt

python3 -m venv $APP/.venv-platform
$APP/.venv-platform/bin/pip install -q -r $APP/platform/backend/requirements.txt

echo "==> Systemd units"
cp $APP/systemd/*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable radio-scheduler platform-backend liquidsoap
systemctl restart radio-scheduler platform-backend liquidsoap

echo "==> Caddy"
apt-get install -y caddy
cp $APP/caddy/Caddyfile /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy

echo "Done. Edit /etc/slagroomfm/{radio,platform}.env then restart services."
