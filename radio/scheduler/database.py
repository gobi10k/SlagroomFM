import sqlite3
import os

DB_PATH = os.environ.get("RADIO_DB_PATH", "/mnt/ssd/db/radio.db")


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
            CREATE TABLE IF NOT EXISTS slots (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT NOT NULL,
                kind       TEXT NOT NULL CHECK(kind IN ('file','folder','live_placeholder')),
                path       TEXT,
                start_ts   INTEGER NOT NULL,
                end_ts     INTEGER NOT NULL,
                rrule      TEXT,
                color      TEXT DEFAULT '#4f46e5',
                notes      TEXT
            );

            CREATE TABLE IF NOT EXISTS play_log (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                slot_id    INTEGER REFERENCES slots(id) ON DELETE SET NULL,
                file       TEXT NOT NULL,
                started_at INTEGER NOT NULL DEFAULT (unixepoch())
            );

            CREATE INDEX IF NOT EXISTS idx_slots_start ON slots(start_ts);
            CREATE INDEX IF NOT EXISTS idx_play_log_started ON play_log(started_at);
        """)
