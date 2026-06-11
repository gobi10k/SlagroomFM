# Task: Fix artist pages + home navigation (platform frontend/backend)

## Context
Deployed on the Pi, stack works end-to-end (auth proxy to Navidrome via svc_platform is live,
/browse lists real library data). Two navigation bugs remain. Root cause for both identified below
— do not rediscover, just implement.

## Bug 1 — Artist pages 404 for library artists
**Symptom:** Browse lists artists (from Navidrome `getIndexes`), clicking one → "Artist not found."

**Root cause:** Two unconnected artist concepts.
- `Browse.jsx` links to `/artists/${a.id}` where `a.id` is a **Navidrome artist ID**.
- `Artist.jsx` fetches `/api/profiles/${slug}` which looks up the **platform users table by artist_slug**
  (`backend/routes/profiles.py`). Navidrome IDs never match profile slugs; bulk-loaded library
  artists have no platform account at all.

**Fix (design):** Artist pages must be library-first, profile-enriched:
1. Backend: add `GET /api/library/artist/{navidrome_id}` in `routes/library.py` →
   Subsonic `getArtist` (artist name + albums), plus `getAlbum` per album or `search3` for tracks.
   Return `{ name, albums: [{id, name, coverArt, songs:[...] }] }`.
2. Backend: add `GET /api/profiles/by-name/{display_name}` (case-insensitive) so a library artist
   can be matched to a platform profile when one exists.
3. Frontend `Artist.jsx`: route param is the Navidrome ID. Fetch library data first (always renders:
   name, albums, tracks, play-all). Then try profiles/by-name with the artist name; if found, render
   the profile section (bio, links, gig posts) above the library section. No profile ≠ error.
4. Keep `/api/profiles/{slug}` for profile-only pages (e.g. linked from gig board posts), but gig
   board links should go to a route that resolves via slug — add `/u/{slug}` route using existing
   profile endpoint, falling back gracefully if the user has no uploads.

## Bug 2 — Home page tiles do nothing
**Symptom:** Clicking recent-upload album tiles on Home has no effect.

**Root cause:** `Home.jsx` renders album cards with no onClick/Link.

**Fix:** Wrap tiles in `Link to={/albums/${album.id}}`; add an Album view (new route + component):
fetch Subsonic `getAlbum` via a new `GET /api/library/album/{id}`, render track list with the
existing TrackList + enqueue. Also make the radio banner's "Tune in" actually start the /stream
player via usePlayer.

## Constraints
- Don't change auth, uploads, or the gigs API.
- All Subsonic calls go through the existing `_subsonic` helper with the service account.
- Match existing code style; keep components consistent with current Browse/TrackList patterns.
- IMPORTANT deploy detail: the two systemd units on the Pi now run uvicorn as packages
  (`backend.main:app` from `/srv/app/platform`, `scheduler.main:app` from `/srv/app/radio`) —
  already fixed in repo systemd/ files; don't regress.

## Also: write scripts/deploy.sh (currently missing/incomplete)
One command from the Mac: `./scripts/deploy.sh 10.137.2.38`
1. `npm run build` in platform/frontend and radio/ui (radio/ui outputs to radio/scheduler/static)
2. rsync to the Pi: `platform/frontend/dist/`, `radio/scheduler/static/`, plus `git push` reminder
   (code itself reaches the Pi via `git pull` — print a reminder to pull, or ssh in and pull)
3. ssh restart: `sudo systemctl restart platform-backend radio-scheduler`
4. Exclude: node_modules, .venv-*, *.env, ._* AppleDouble files (`--exclude='._*'`)

## Acceptance
- Clicking any artist in Browse opens a page with their albums/tracks and play-all (no account needed)
- gobi_10k's page shows the Loitering… album; tracks play
- Home tiles open album pages; tracks play; Tune in starts the stream
- Registered users' pages additionally show bio/links/gigs
- `npm run build` clean in both frontends; deploy.sh works from the Mac
