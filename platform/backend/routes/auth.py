from fastapi import APIRouter, HTTPException, Request, Response, Depends
from pydantic import BaseModel, EmailStr
import re
import time

from ..database import get_conn
from ..auth_utils import hash_password, verify_password, create_session, get_current_user

router = APIRouter()

SLUG_RE = re.compile(r"^[a-z0-9-]{2,40}$")


class RegisterIn(BaseModel):
    email: str
    password: str
    display_name: str
    artist_slug: str | None = None
    role: str = "listener"


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(body: RegisterIn, response: Response):
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if body.artist_slug and not SLUG_RE.match(body.artist_slug):
        raise HTTPException(400, "artist_slug must be 2-40 lowercase letters/digits/hyphens")
    if body.role not in ("admin", "artist", "listener"):
        raise HTTPException(400, "Invalid role")

    pw_hash = hash_password(body.password)
    with get_conn() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users(email,password_hash,display_name,artist_slug,role) VALUES(?,?,?,?,?)",
                (body.email, pw_hash, body.display_name, body.artist_slug, body.role),
            )
            conn.commit()
            user_id = cur.lastrowid
        except Exception:
            raise HTTPException(409, "Email or artist slug already registered")

    session_id = create_session(user_id)
    response.set_cookie("session", session_id, httponly=True, samesite="lax", max_age=30*24*3600)
    return {"id": user_id, "display_name": body.display_name, "role": body.role}


@router.post("/login")
def login(body: LoginIn, response: Response):
    with get_conn() as conn:
        user = conn.execute("SELECT * FROM users WHERE email=?", (body.email,)).fetchone()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    session_id = create_session(user["id"])
    response.set_cookie("session", session_id, httponly=True, samesite="lax", max_age=30*24*3600)
    return {"id": user["id"], "display_name": user["display_name"], "role": user["role"], "artist_slug": user["artist_slug"]}


@router.post("/logout")
def logout(request: Request, response: Response):
    session_id = request.cookies.get("session")
    if session_id:
        with get_conn() as conn:
            conn.execute("DELETE FROM sessions WHERE id=?", (session_id,))
            conn.commit()
    response.delete_cookie("session")
    return {"ok": True}


@router.get("/me")
def me(request: Request):
    user = get_current_user(request)
    return {k: v for k, v in user.items() if k != "password_hash"}


@router.put("/me")
def update_me(request: Request, body: dict):
    user = get_current_user(request)
    allowed = {"display_name", "bio", "links_json", "avatar_path"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(400, "Nothing to update")
    set_clause = ", ".join(f"{k}=?" for k in updates)
    with get_conn() as conn:
        conn.execute(
            f"UPDATE users SET {set_clause} WHERE id=?",
            (*updates.values(), user["id"]),
        )
        conn.commit()
    return {"ok": True}
