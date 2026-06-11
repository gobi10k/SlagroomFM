"""
Called by Liquidsoap's request.dynamic to get the next file to play.
Returns JSON: {"uri": "/absolute/path/to/file.mp3"}
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import os
import random
import time

from ..database import get_conn

router = APIRouter(tags=["player"])

FALLBACK_DIR = "/mnt/ssd/radio/fallback"
_folder_state: dict = {}  # slot_id -> {"files": [...], "index": n}


def _pick_from_folder(slot_id: int, folder: str) -> str | None:
    state = _folder_state.get(slot_id)
    files = [
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if f.lower().endswith((".mp3", ".flac", ".ogg", ".opus", ".wav"))
    ] if os.path.isdir(folder) else []

    if not files:
        return None

    if not state or state["files"] != sorted(files):
        random.shuffle(files)
        _folder_state[slot_id] = {"files": files, "index": 0}
        state = _folder_state[slot_id]

    idx = state["index"] % len(state["files"])
    path = state["files"][idx]
    state["index"] = idx + 1
    return path


@router.get("/next")
def next_track():
    now = int(time.time())
    with get_conn() as conn:
        slot = conn.execute(
            "SELECT * FROM slots WHERE kind != 'live_placeholder' AND start_ts <= ? AND end_ts > ? ORDER BY start_ts DESC LIMIT 1",
            (now, now),
        ).fetchone()

        if not slot:
            # Nothing scheduled → let Liquidsoap fall through to rotation
            return JSONResponse(status_code=204, content=None)

        slot = dict(slot)
        path = None

        if slot["kind"] == "file":
            path = slot["path"]
        elif slot["kind"] == "folder":
            path = _pick_from_folder(slot["id"], slot["path"])

        if not path or not os.path.isfile(path):
            return JSONResponse(status_code=204, content=None)

        conn.execute(
            "INSERT INTO play_log(slot_id, file, started_at) VALUES(?,?,?)",
            (slot["id"], path, now),
        )
        conn.commit()

    return {"uri": path}
