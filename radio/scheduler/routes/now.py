from fastapi import APIRouter
import time
import httpx

from ..database import get_conn

router = APIRouter(tags=["now"])

ICECAST_STATUS_URL = "http://localhost:8000/status-json.xsl"


@router.get("/now")
async def get_now():
    """Current slot + Icecast status (listener count, live DJ flag)."""
    now = int(time.time())
    with get_conn() as conn:
        slot = conn.execute(
            "SELECT * FROM slots WHERE start_ts <= ? AND end_ts > ? ORDER BY start_ts DESC LIMIT 1",
            (now, now),
        ).fetchone()
        last_play = conn.execute(
            "SELECT * FROM play_log ORDER BY started_at DESC LIMIT 1"
        ).fetchone()

    icecast = {}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(ICECAST_STATUS_URL)
            icecast = resp.json()
    except Exception:
        pass

    # Extract listener count and source info from Icecast status
    listeners = 0
    sources = []
    try:
        icestats = icecast.get("icestats", {})
        src = icestats.get("source", [])
        if isinstance(src, dict):
            src = [src]
        sources = src
        for s in sources:
            listeners += int(s.get("listeners", 0))
    except Exception:
        pass

    # Detect live harbor: Icecast will show a source connected on a harbor-originated mount
    live_active = any(
        "live" in str(s.get("server_name", "")).lower() or
        str(s.get("stream_start", "")) != ""
        for s in sources
    )

    return {
        "now": int(now),
        "slot": dict(slot) if slot else None,
        "now_playing": dict(last_play) if last_play else None,
        "icecast": {
            "listeners": listeners,
            "live": live_active,
            "sources": sources,
        },
    }
