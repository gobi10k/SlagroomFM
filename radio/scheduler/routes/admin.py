"""
Admin auth helpers + skip endpoint.
"""
from fastapi import APIRouter, HTTPException, Request
import socket
import os

router = APIRouter(tags=["admin"])

ADMIN_TOKEN = os.environ.get("RADIO_ADMIN_TOKEN", "changeme")
LIQUIDSOAP_TELNET_HOST = "127.0.0.1"
LIQUIDSOAP_TELNET_PORT = 1234


def require_admin(request: Request):
    token = request.headers.get("X-Admin-Token") or request.cookies.get("admin_token")
    if token != ADMIN_TOKEN:
        raise HTTPException(401, "Unauthorized")


def _telnet_cmd(cmd: str) -> str:
    with socket.create_connection((LIQUIDSOAP_TELNET_HOST, LIQUIDSOAP_TELNET_PORT), timeout=3) as s:
        s.sendall((cmd + "\n").encode())
        return s.recv(4096).decode()


@router.post("/skip")
def skip_track(request: Request):
    require_admin(request)
    try:
        resp = _telnet_cmd("scheduler.skip")
        return {"ok": True, "response": resp.strip()}
    except Exception as e:
        raise HTTPException(500, f"Liquidsoap telnet error: {e}")


@router.get("/harbor-status")
def harbor_status(request: Request):
    require_admin(request)
    try:
        resp = _telnet_cmd("live.is_up")
        return {"live": resp.strip() == "true"}
    except Exception as e:
        return {"live": False, "error": str(e)}
