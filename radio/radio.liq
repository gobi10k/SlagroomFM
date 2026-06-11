#!/usr/bin/env liquidsoap
# SlagroomFM — Liquidsoap 2.x radio script
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
    password = "HARBOR_PASSWORD",
    max = 60.0
  )
)

# Drop silent live feed so fallback kicks in when DJ goes quiet
live = blank.strip(
  live,
  max_blank = 5.0,
  min_noise = 0.0,
  threshold = -50.0
)

# ── Scheduled requests ───────────────────────────────────────────────────────
# Calls the scheduler API: GET http://localhost:8002/radio/api/next
# Expects a plain-text or JSON {"uri": "/mnt/ssd/..."} response.
scheduler_request = request.dynamic(
  id = "scheduler",
  fun() -> begin
    let json = http.get("http://localhost:8002/radio/api/next")
    if json.status_code == 200 then
      let data = json.json()
      request.create(data["uri"])
    else
      request.create("/dev/null")
    end
  end
)

scheduled = mksafe(
  audio_to_stereo(
    request.player(scheduler_request)
  )
)

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
  transitions = [
    fun(a, b) -> sequence([fade.out(duration=2.0, a), fade.in(duration=1.0, b)]),
    fun(a, b) -> sequence([fade.out(duration=2.0, a), fade.in(duration=1.0, b)]),
    fun(_, b) -> b
  ],
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
  password = "ICECAST_SOURCE_PASSWORD",
  radio
)
