import os
import subprocess
import time
import re
import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from ..database import get_conn
from ..auth_utils import get_current_user

router = APIRouter()

MUSIC_ROOT = os.environ.get("MUSIC_ROOT", "/mnt/ssd/music")
MAX_FILE_BYTES = 300 * 1024 * 1024  # 300 MB
QUOTA_BYTES    = 2 * 1024 * 1024 * 1024  # 2 GB per user
ALLOWED_EXTS   = {".mp3", ".flac", ".wav", ".opus"}

ND_URL  = os.environ.get("NAVIDROME_URL", "http://localhost:4533")
ND_USER = os.environ.get("NAVIDROME_USER", "svc_platform")
ND_PASS = os.environ.get("NAVIDROME_PASS", "changeme")


def _safe_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9-]", "-", name.lower())[:60].strip("-")


def _check_disk_space(required: int):
    stat = os.statvfs(MUSIC_ROOT)
    free = stat.f_bavail * stat.f_frsize
    if free < required + 500 * 1024 * 1024:
        raise HTTPException(507, "Not enough disk space")


def _user_quota_used(user_id: int) -> int:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT file_path FROM uploads WHERE user_id=?", (user_id,)
        ).fetchall()
    total = 0
    for row in rows:
        try:
            total += os.path.getsize(row["file_path"])
        except OSError:
            pass
    return total


def _validate_with_ffprobe(path: str) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise HTTPException(400, "File rejected: not a valid audio file")
    import json
    return json.loads(result.stdout)


def _trigger_navidrome_scan():
    import hashlib, secrets
    salt = secrets.token_hex(8)
    token = hashlib.md5((ND_PASS + salt).encode()).hexdigest()
    params = {"u": ND_USER, "t": token, "s": salt, "v": "1.16.1", "c": "slagroomfm", "f": "json"}
    try:
        httpx.get(f"{ND_URL}/rest/startScan", params=params, timeout=5)
    except Exception:
        pass


@router.post("")
async def upload_track(
    request: Request,
    title: str = Form(...),
    file: UploadFile = File(...),
):
    user = get_current_user(request)
    if user["role"] not in ("artist", "admin"):
        raise HTTPException(403, "Only artists can upload")
    if not user.get("artist_slug"):
        raise HTTPException(400, "Set an artist_slug on your profile first")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, f"Allowed formats: {', '.join(ALLOWED_EXTS)}")

    data = await file.read()
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, "File too large (max 300 MB)")

    _check_disk_space(len(data))
    if _user_quota_used(user["id"]) + len(data) > QUOTA_BYTES:
        raise HTTPException(413, "Upload quota exceeded (2 GB)")

    artist_dir = os.path.join(MUSIC_ROOT, "artists", user["artist_slug"])
    os.makedirs(artist_dir, exist_ok=True)

    safe_title = _safe_slug(title)
    dest = os.path.join(artist_dir, f"{safe_title}{ext}")
    # Avoid clobbering existing files
    if os.path.exists(dest):
        dest = os.path.join(artist_dir, f"{safe_title}-{int(time.time())}{ext}")

    with open(dest, "wb") as f:
        f.write(data)

    # Validate with ffprobe (rejects invalid files after writing, then clean up)
    try:
        _validate_with_ffprobe(dest)
    except HTTPException:
        os.unlink(dest)
        raise

    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO uploads(user_id,file_path,title,status) VALUES(?,?,?,?)",
            (user["id"], dest, title, "pending"),
        )
        conn.commit()
        upload_id = cur.lastrowid

    _trigger_navidrome_scan()
    return {"id": upload_id, "file_path": dest, "status": "pending"}


@router.get("")
def list_uploads(request: Request):
    user = get_current_user(request)
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM uploads WHERE user_id=? ORDER BY created_at DESC",
            (user["id"],),
        ).fetchall()
    return [dict(r) for r in rows]
