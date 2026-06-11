"""
Navidrome/Subsonic proxy — translates platform API calls to Subsonic API calls
using the service account. Users never touch Navidrome directly.
"""
import asyncio
import os
import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse

router = APIRouter()

ND_URL    = os.environ.get("NAVIDROME_URL", "http://localhost:4533")
ND_USER   = os.environ.get("NAVIDROME_USER", "svc_platform")
ND_PASS   = os.environ.get("NAVIDROME_PASS", "changeme")
ND_CLIENT = "slagroomfm"
ND_VER    = "1.16.1"


def _subsonic_params(extra: dict = {}) -> dict:
    import hashlib, secrets
    salt = secrets.token_hex(8)
    token = hashlib.md5((ND_PASS + salt).encode()).hexdigest()
    return {
        "u": ND_USER,
        "t": token,
        "s": salt,
        "v": ND_VER,
        "c": ND_CLIENT,
        "f": "json",
        **extra,
    }


async def _subsonic(endpoint: str, params: dict = {}) -> dict:
    url = f"{ND_URL}/rest/{endpoint}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=_subsonic_params(params))
        resp.raise_for_status()
        data = resp.json()
    inner = data.get("subsonic-response", {})
    if inner.get("status") != "ok":
        raise HTTPException(502, f"Navidrome error: {inner.get('error', {})}")
    return inner


@router.get("/search")
async def search(q: str, limit: int = 20):
    data = await _subsonic("search3", {"query": q, "songCount": limit, "albumCount": 0, "artistCount": 5})
    result = data.get("searchResult3", {})
    return {
        "artists": result.get("artist", []),
        "songs":   result.get("song", []),
    }


@router.get("/browse")
async def browse(id: str = ""):
    if id:
        data = await _subsonic("getMusicDirectory", {"id": id})
        return data.get("directory", {})
    else:
        data = await _subsonic("getArtists")
        return data.get("artists", {})


@router.get("/song/{song_id}/stream")
async def stream_song(song_id: str):
    url = f"{ND_URL}/rest/stream"
    params = _subsonic_params({"id": song_id})
    async with httpx.AsyncClient(timeout=None) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(502, "Stream error")
        content_type = resp.headers.get("content-type", "audio/mpeg")
        return StreamingResponse(
            resp.aiter_bytes(chunk_size=65536),
            media_type=content_type,
            headers={"Accept-Ranges": "bytes"},
        )


@router.get("/cover/{item_id}")
async def cover_art(item_id: str, size: int = 300):
    url = f"{ND_URL}/rest/getCoverArt"
    params = _subsonic_params({"id": item_id, "size": size})
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        return Response(
            content=resp.content,
            media_type=resp.headers.get("content-type", "image/jpeg"),
        )


@router.get("/recent")
async def recent_songs(limit: int = 20):
    data = await _subsonic("getAlbumList2", {"type": "newest", "size": limit})
    return data.get("albumList2", {}).get("album", [])


@router.get("/artist/{artist_id}")
async def get_artist(artist_id: str):
    data = await _subsonic("getArtist", {"id": artist_id})
    artist = data.get("artist", {})
    album_stubs = artist.get("album", [])

    async def fetch_album(stub):
        album_data = await _subsonic("getAlbum", {"id": stub["id"]})
        a = album_data.get("album", {})
        return {
            "id": a.get("id"),
            "name": a.get("name"),
            "coverArt": a.get("coverArt"),
            "year": a.get("year"),
            "songs": a.get("song", []),
        }

    albums = await asyncio.gather(*[fetch_album(s) for s in album_stubs])
    return {
        "id": artist.get("id"),
        "name": artist.get("name"),
        "albums": list(albums),
    }


@router.get("/album/{album_id}")
async def get_album(album_id: str):
    data = await _subsonic("getAlbum", {"id": album_id})
    a = data.get("album", {})
    return {
        "id": a.get("id"),
        "name": a.get("name"),
        "artist": a.get("artist"),
        "artistId": a.get("artistId"),
        "coverArt": a.get("coverArt"),
        "year": a.get("year"),
        "songs": a.get("song", []),
    }
