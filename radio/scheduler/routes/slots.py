from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import time

from ..database import get_conn
from .admin import require_admin

router = APIRouter(tags=["slots"])


class SlotIn(BaseModel):
    title: str
    kind: str  # file | folder | live_placeholder
    path: Optional[str] = None
    start_ts: int
    end_ts: int
    rrule: Optional[str] = None
    color: str = "#4f46e5"
    notes: Optional[str] = None


@router.get("/slots")
def list_slots(from_ts: int = 0, to_ts: int = 0):
    now = int(time.time())
    if not from_ts:
        from_ts = now - 86400
    if not to_ts:
        to_ts = now + 7 * 86400
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM slots WHERE start_ts < ? AND end_ts > ? ORDER BY start_ts",
            (to_ts, from_ts),
        ).fetchall()
    return [dict(r) for r in rows]


@router.post("/slots", dependencies=[Depends(require_admin)])
def create_slot(slot: SlotIn):
    if slot.kind not in ("file", "folder", "live_placeholder"):
        raise HTTPException(400, "Invalid kind")
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO slots(title,kind,path,start_ts,end_ts,rrule,color,notes) VALUES(?,?,?,?,?,?,?,?)",
            (slot.title, slot.kind, slot.path, slot.start_ts, slot.end_ts, slot.rrule, slot.color, slot.notes),
        )
        conn.commit()
    return {"id": cur.lastrowid}


@router.put("/slots/{slot_id}", dependencies=[Depends(require_admin)])
def update_slot(slot_id: int, slot: SlotIn):
    with get_conn() as conn:
        conn.execute(
            "UPDATE slots SET title=?,kind=?,path=?,start_ts=?,end_ts=?,rrule=?,color=?,notes=? WHERE id=?",
            (slot.title, slot.kind, slot.path, slot.start_ts, slot.end_ts, slot.rrule, slot.color, slot.notes, slot_id),
        )
        conn.commit()
    return {"ok": True}


@router.delete("/slots/{slot_id}", dependencies=[Depends(require_admin)])
def delete_slot(slot_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM slots WHERE id=?", (slot_id,))
        conn.commit()
    return {"ok": True}
