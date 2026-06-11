from fastapi import APIRouter
import time

from ..database import get_conn

router = APIRouter(tags=["schedule"])


@router.get("/schedule")
def get_schedule(from_ts: int = 0, to_ts: int = 0):
    """Public schedule data for the UI."""
    now = int(time.time())
    if not from_ts:
        from_ts = now
    if not to_ts:
        to_ts = now + 7 * 86400
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM slots WHERE start_ts < ? AND end_ts > ? ORDER BY start_ts",
            (to_ts, from_ts),
        ).fetchall()
    return [dict(r) for r in rows]
