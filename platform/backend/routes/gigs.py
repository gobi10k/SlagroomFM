from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional
import time

from ..database import get_conn
from ..auth_utils import get_current_user

router = APIRouter()


class GigIn(BaseModel):
    kind: str  # playing | looking
    title: str
    body: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    date: Optional[str] = None
    link: Optional[str] = None
    expires_at: Optional[int] = None


@router.get("")
def list_gigs(kind: str = "", city: str = "", limit: int = 50):
    now = int(time.time())
    clauses = ["(expires_at IS NULL OR expires_at > ?)"]
    params: list = [now]
    if kind:
        clauses.append("kind=?")
        params.append(kind)
    if city:
        clauses.append("city LIKE ?")
        params.append(f"%{city}%")
    where = " AND ".join(clauses)
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT g.*, u.display_name, u.artist_slug FROM gig_posts g JOIN users u ON u.id=g.user_id WHERE {where} ORDER BY g.created_at DESC LIMIT ?",
            (*params, limit),
        ).fetchall()
    return [dict(r) for r in rows]


@router.post("")
def create_gig(body: GigIn, request: Request):
    user = get_current_user(request)
    if body.kind not in ("playing", "looking"):
        raise HTTPException(400, "kind must be 'playing' or 'looking'")
    now = int(time.time())
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO gig_posts(user_id,kind,title,body,venue,city,date,link,expires_at) VALUES(?,?,?,?,?,?,?,?,?)",
            (user["id"], body.kind, body.title, body.body, body.venue, body.city, body.date, body.link, body.expires_at),
        )
        conn.commit()
    return {"id": cur.lastrowid}


@router.put("/{gig_id}")
def update_gig(gig_id: int, body: GigIn, request: Request):
    user = get_current_user(request)
    with get_conn() as conn:
        existing = conn.execute("SELECT user_id FROM gig_posts WHERE id=?", (gig_id,)).fetchone()
        if not existing:
            raise HTTPException(404)
        if existing["user_id"] != user["id"] and user["role"] != "admin":
            raise HTTPException(403)
        conn.execute(
            "UPDATE gig_posts SET kind=?,title=?,body=?,venue=?,city=?,date=?,link=?,expires_at=? WHERE id=?",
            (body.kind, body.title, body.body, body.venue, body.city, body.date, body.link, body.expires_at, gig_id),
        )
        conn.commit()
    return {"ok": True}


@router.delete("/{gig_id}")
def delete_gig(gig_id: int, request: Request):
    user = get_current_user(request)
    with get_conn() as conn:
        existing = conn.execute("SELECT user_id FROM gig_posts WHERE id=?", (gig_id,)).fetchone()
        if not existing:
            raise HTTPException(404)
        if existing["user_id"] != user["id"] and user["role"] != "admin":
            raise HTTPException(403)
        conn.execute("DELETE FROM gig_posts WHERE id=?", (gig_id,))
        conn.commit()
    return {"ok": True}
