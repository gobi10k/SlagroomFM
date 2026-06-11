#!/usr/bin/env liquidsoap
# SlagroomFM — Liquidsoap 2.4 radio script
# Priority chain: live harbor → scheduled requests → fallback rotation

log.level := 3

# ── Telnet server (localhost only) ──────────────────────────────────────────
settings.server.telnet.set(true)
settings.server.telnet.bind_addr.set("127.0.0.1")
settings.server.telnet.port.set(1234)

# ── Harbor (live takeover) ───────────────────────────────────────────────────
# Remote DJs connect to raspberrypi:8005 over the tailnet (never public).
live = audio_to_stereo(
  input.harbor(
    "live",
    port = 8005,
    password = "hackme",
    max = 60.0
  )
)

# Drop silent live feed so fallback kicks in when DJ goes quiet
live = blank.strip(
  live,
  max_blank = 45.0,
  min_noise = 0.0,
  threshold = -70.0
)

# ── Scheduled requests ───────────────────────────────────────────────────────
# Calls the scheduler API: GET http://localhost:8002/radio/api/next
# Expects JSON: {"uri": "/mnt/ssd/..."}. Returns null when nothing is
# scheduled, which makes this source unavailable so the chain falls
# through to the rotation playlist.
scheduler_request = request.dynamic(
  id = "scheduler",
  retry_delay = 5.0,
  fun() -> begin
    resp = http.get("http://localhost:8002/radio/api/next")
    if resp.status_code == 200 then
      try
        let json.parse ( {uri} : {uri: string} ) = resp
        if uri == "" then null else request.create(uri) end
      catch _ do
        log.severe(label="scheduler", "Could not parse scheduler response: #{resp}")
        null
      end
    else
      null
    end
  end
)

# NOTE: no mksafe here — if the scheduler has nothing, this source must
# become unavailable so `rotation` can take over. (mksafe would pin the
# chain to silence instead.)
scheduled = audio_to_stereo(scheduler_request)

# ── Fallback rotation ────────────────────────────────────────────────────────
rotation = audio_to_stereo(
  playlist(
    id = "rotation",
    mode = "randomize",
    reload_mode = "watch",
    "/mnt/ssd/radio/fallback"
  )
)
rotation = mksafe(rotation)

# ── Priority fallback chain ──────────────────────────────────────────────────
# track_sensitive=false → takeover / fall-back is immediate (not track-boundary).
radio = fallback(
  track_sensitive = false,
  [live, scheduled, rotation]
)

# ── Icecast output ───────────────────────────────────────────────────────────
output.icecast(
  %mp3(bitrate = 192),
  host    = "localhost",
  port    = 8000,
  mount   = "teststream",
  name    = "SlagroomFM",
  description = "Community Radio",
  password = "hackme",
  radio
)
