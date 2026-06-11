from fastapi import APIRouter, HTTPException
import time

from ..database import get_conn

router = APIRouter()


def _profile_response(conn, user):
    uploads = conn.execute(
        "SELECT id,title,file_path,status,navidrome_song_id,created_at FROM uploads WHERE user_id=? ORDER BY created_at DESC",
        (user["id"],),
    ).fetchall()
    now = int(time.time())
    gigs = conn.execute(
        "SELECT * FROM gig_posts WHERE user_id=? AND (expires_at IS NULL OR expires_at>?) ORDER BY created_at DESC",
        (user["id"], now),
    ).fetchall()
    return {
        "profile": user,
        "uploads": [dict(u) for u in uploads],
        "gigs": [dict(g) for g in gigs],
    }


@router.get("/by-name/{name}")
def get_profile_by_name(name: str):
    with get_conn() as conn:
        user = conn.execute(
            "SELECT id,display_name,artist_slug,bio,links_json,avatar_path,role,created_at FROM users WHERE LOWER(display_name)=LOWER(?)",
            (name,),
        ).fetchone()
        if not user:
            raise HTTPException(404, "Artist not found")
        return _profile_response(conn, dict(user))


@router.get("/{artist_slug}")
def get_profile(artist_slug: str):
    with get_conn() as conn:
        user = conn.execute(
            "SELECT id,display_name,artist_slug,bio,links_json,avatar_path,role,created_at FROM users WHERE artist_slug=?",
            (artist_slug,),
        ).fetchone()
        if not user:
            raise HTTPException(404, "Artist not found")
        return _profile_response(conn, dict(user))
