import sqlite3
import os

DB_PATH = os.environ.get("PLATFORM_DB_PATH", "/mnt/ssd/db/platform.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name  TEXT NOT NULL,
                artist_slug   TEXT UNIQUE,
                bio           TEXT,
                links_json    TEXT DEFAULT '[]',
                avatar_path   TEXT,
                role          TEXT NOT NULL DEFAULT 'listener'
                              CHECK(role IN ('admin','artist','listener')),
                created_at    INTEGER NOT NULL DEFAULT (unixepoch())
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id         TEXT PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at INTEGER NOT NULL DEFAULT (unixepoch()),
                expires_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS uploads (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                file_path        TEXT NOT NULL,
                title            TEXT NOT NULL,
                status           TEXT NOT NULL DEFAULT 'pending'
                                 CHECK(status IN ('pending','scanned')),
                navidrome_song_id TEXT,
                created_at       INTEGER NOT NULL DEFAULT (unixepoch())
            );

            CREATE TABLE IF NOT EXISTS gig_posts (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                kind       TEXT NOT NULL CHECK(kind IN ('playing','looking')),
                title      TEXT NOT NULL,
                body       TEXT,
                venue      TEXT,
                city       TEXT,
                date       TEXT,
                link       TEXT,
                created_at INTEGER NOT NULL DEFAULT (unixepoch()),
                expires_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS embeddings (
                song_id TEXT PRIMARY KEY,
                vector  BLOB NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user   ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_uploads_user    ON uploads(user_id);
            CREATE INDEX IF NOT EXISTS idx_gigs_city_date  ON gig_posts(city, date);
            CREATE INDEX IF NOT EXISTS idx_gigs_expires    ON gig_posts(expires_at);
        """)
