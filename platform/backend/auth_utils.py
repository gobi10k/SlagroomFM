import hashlib
import hmac
import os
import secrets
import time
from fastapi import Cookie, HTTPException, Request

from .database import get_conn

SESSION_TTL = 30 * 24 * 3600  # 30 days


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
    return f"{salt}:{h.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, hex_hash = stored.split(":", 1)
        h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
        return hmac.compare_digest(h.hex(), hex_hash)
    except Exception:
        return False


def create_session(user_id: int) -> str:
    session_id = secrets.token_urlsafe(32)
    expires = int(time.time()) + SESSION_TTL
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO sessions(id, user_id, expires_at) VALUES(?,?,?)",
            (session_id, user_id, expires),
        )
        conn.commit()
    return session_id


def get_current_user(request: Request):
    session_id = request.cookies.get("session")
    if not session_id:
        raise HTTPException(401, "Not authenticated")
    now = int(time.time())
    with get_conn() as conn:
        row = conn.execute(
            "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>?",
            (session_id, now),
        ).fetchone()
    if not row:
        raise HTTPException(401, "Session expired or invalid")
    return dict(row)


def require_admin(request: Request):
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(403, "Admin only")
    return user
