# SlagroomFM

Community radio + music platform running on a Le Potato (AML-S905X-CC, Debian 12 ARM64).

## Architecture

```
Tailscale Funnel :443
        │
      Caddy
   ┌───┴────────────────────────┐
   │  /          Platform SPA   │  static files
   │  /api/*     Platform API   │  FastAPI :8001
   │  /radio/*   Radio UI+API   │  FastAPI :8002
   │  /stream    Icecast proxy  │  :8000/teststream
   │  /nd/*      Navidrome      │  :4533
   │  /files/*   FileBrowser    │  :8080 (admin auth)
   └────────────────────────────┘
        │
   Liquidsoap → Icecast
   (harbor takeover → scheduled → fallback rotation)
```

## First-time setup on the Potato

```bash
# 1. Mount SSD by UUID, add to /etc/fstab as /mnt/ssd

# 2. Run setup script (as root)
sudo bash /srv/app/scripts/setup.sh

# 3. Copy and fill in env files
sudo cp /srv/app/scripts/radio.env.example    /etc/slagroomfm/radio.env
sudo cp /srv/app/scripts/platform.env.example /etc/slagroomfm/platform.env
# Edit both files: set real tokens/passwords

# 4. Update Caddyfile basic-auth hash for FileBrowser
caddy hash-password   # then paste hash into caddy/Caddyfile

# 5. Update radio.liq passwords (HARBOR_PASSWORD, ICECAST_SOURCE_PASSWORD)

# 6. Create Navidrome service account (svc_platform) in Navidrome UI
#    then set credentials in /etc/slagroomfm/platform.env

# 7. Restart everything
sudo systemctl restart caddy radio-scheduler platform-backend liquidsoap
```

## Deploy (from Mac)

```bash
./scripts/deploy.sh raspberrypi
```

## Services

| Service | Port | Unit |
|---------|------|------|
| Platform backend | 8001 | `platform-backend.service` |
| Radio scheduler  | 8002 | `radio-scheduler.service`  |
| Liquidsoap       | —    | `liquidsoap.service`       |
| Caddy            | 443  | `caddy` (system package)   |

## Live DJ takeover

Connect BUTT/Mixxx/OBS to `raspberrypi:8005` (Tailscale) with the harbor password set in `radio.liq`.  
Disconnect automatically falls back to scheduled → rotation.

## Repo layout

```
caddy/         Caddyfile
radio/
  radio.liq    Liquidsoap script
  scheduler/   FastAPI scheduler (Track A backend)
  ui/          Radio UI (Vite + React → builds to scheduler/static)
platform/
  backend/     FastAPI platform API (Track B)
  frontend/    Platform SPA (Vite + React)
scripts/       Setup, deploy, backup + env examples
systemd/       systemd unit files
```
