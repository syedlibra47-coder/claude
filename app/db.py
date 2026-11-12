"""SQLite storage. One connection per operation; WAL so the scheduler thread
and web requests don't block each other."""
import json
import re
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from . import config

STAGES = ["new", "contacted", "engaged", "site_visit", "negotiation", "won", "lost"]
OPEN_STAGES = STAGES[:5]

SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    source TEXT DEFAULT '',
    project TEXT DEFAULT '',
    budget TEXT DEFAULT '',
    stage TEXT DEFAULT 'new',
    notes TEXT DEFAULT '',
    opted_out INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_inbound_at TEXT,
    last_outbound_at TEXT,
    score INTEGER DEFAULT 0,
    rule_score INTEGER DEFAULT 0,
    timeline TEXT DEFAULT 'later',
    score_reasons TEXT DEFAULT '[]',
    next_action TEXT DEFAULT '',
    ai_probability INTEGER,
    ai_timeline TEXT,
    ai_summary TEXT,
    ai_next_action TEXT,
    ai_signals TEXT,
    ai_objections TEXT,
    ai_scored_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    ts TEXT NOT NULL,
    kind TEXT NOT NULL,          -- note, call, stage, wa_in, wa_out, email_in, email_out
    body TEXT DEFAULT '',
    status TEXT DEFAULT ''       -- sent, simulated, failed (outbound only)
);
CREATE INDEX IF NOT EXISTS idx_events_lead ON events(lead_id, ts);
CREATE TABLE IF NOT EXISTS sequences (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY,
    sequence_id INTEGER NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    delay_hours REAL NOT NULL,   -- wait after the previous step (or enrolment)
    channel TEXT NOT NULL,       -- whatsapp | email
    subject TEXT DEFAULT '',
    body TEXT NOT NULL,
    wa_template TEXT DEFAULT '', -- approved Meta template for outside the 24h window
    ai_personalize INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sequence_id INTEGER NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    step_index INTEGER DEFAULT 0,
    next_run_at TEXT,
    status TEXT DEFAULT 'active', -- active | completed | stopped
    stop_reason TEXT DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    enrollment_id INTEGER,
    channel TEXT NOT NULL,
    subject TEXT DEFAULT '',
    body TEXT NOT NULL,
    wa_template TEXT DEFAULT '',
    status TEXT DEFAULT 'draft',  -- draft | sent | simulated | failed | discarded
    error TEXT DEFAULT '',
    ai_written INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    sent_at TEXT
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
"""

DEFAULT_SETTINGS = {
    "send_mode": "dry_run",     # dry_run | approve | auto
    "agent_name": "",
    "company_name": "",
    "quiet_start": "21",        # local hour; no automated sends from here...
    "quiet_end": "9",           # ...until here
}


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_ts(s):
    if not s:
        return None
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


@contextmanager
def connect():
    path = config.db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    try:
        yield con
        con.commit()
    finally:
        con.close()


def init():
    with connect() as con:
        con.executescript(SCHEMA)
        for k, v in DEFAULT_SETTINGS.items():
            con.execute("INSERT OR IGNORE INTO settings(key, value) VALUES(?, ?)", (k, v))


def rows(con, sql, params=()):
    return [dict(r) for r in con.execute(sql, params).fetchall()]


def one(con, sql, params=()):
    r = con.execute(sql, params).fetchone()
    return dict(r) if r else None


def get_settings(con) -> dict:
    s = dict(DEFAULT_SETTINGS)
    s.update({r["key"]: r["value"] for r in con.execute("SELECT key, value FROM settings")})
    return s


def normalize_phone(raw: str) -> str:
    """Digits only, in international form without '+', as WhatsApp expects."""
    raw = (raw or "").strip()
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return ""
    cc = config.get("DEFAULT_COUNTRY_CODE", "971")
    if raw.startswith("+"):
        return digits
    if digits.startswith("00"):
        return digits[2:]
    if digits.startswith("0"):
        return cc + digits[1:]
    if len(digits) <= 9:
        return cc + digits
    return digits


def find_lead_by_phone(con, phone: str):
    p = normalize_phone(phone)
    if not p:
        return None
    lead = one(con, "SELECT * FROM leads WHERE phone = ?", (p,))
    if lead or len(p) < 9:
        return lead
    # Fall back to the national part so "0501234567" matches "971501234567".
    return one(con, "SELECT * FROM leads WHERE phone LIKE ?", ("%" + p[-9:],))


def add_event(con, lead_id, kind, body="", status="", ts=None):
    con.execute(
        "INSERT INTO events(lead_id, ts, kind, body, status) VALUES(?,?,?,?,?)",
        (lead_id, ts or iso(now()), kind, body, status),
    )


def create_lead(con, data: dict) -> int:
    t = iso(now())
    cur = con.execute(
        "INSERT INTO leads(name, phone, email, source, project, budget, stage, notes, created_at, updated_at)"
        " VALUES(?,?,?,?,?,?,?,?,?,?)",
        (
            (data.get("name") or "").strip() or "Unknown",
            normalize_phone(data.get("phone", "")),
            (data.get("email") or "").strip(),
            (data.get("source") or "").strip(),
            (data.get("project") or "").strip(),
            (data.get("budget") or "").strip(),
            data.get("stage") if data.get("stage") in STAGES else "new",
            (data.get("notes") or "").strip(),
            data.get("created_at") or t,
            t,
        ),
    )
    return cur.lastrowid


def lead_json(lead: dict) -> dict:
    out = dict(lead)
    for k in ("score_reasons", "ai_signals", "ai_objections"):
        out[k] = json.loads(out[k]) if out.get(k) else []
    out["opted_out"] = bool(out["opted_out"])
    return out
