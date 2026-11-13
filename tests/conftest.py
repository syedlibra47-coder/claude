import os

import pytest

from app import db, engine


def _reset_postgres(url):
    import psycopg
    with psycopg.connect(url, autocommit=True) as c:
        c.execute("DROP SCHEMA public CASCADE")
        c.execute("CREATE SCHEMA public")


@pytest.fixture(autouse=True)
def fresh_db(tmp_path, monkeypatch):
    """SQLite by default. Set TEST_DATABASE_URL to run the whole suite on Postgres."""
    pg = os.environ.get("TEST_DATABASE_URL")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    if pg:
        monkeypatch.setenv("DATABASE_URL", pg)
        _reset_postgres(pg)
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("DISABLE_SCHEDULER", "1")
    for var in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID",
                "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN", "SMTP_HOST", "SMTP_FROM", "APP_PASSWORD"):
        monkeypatch.delenv(var, raising=False)
    db.init()
    engine.seed_default_sequence()
    # Quiet hours off so tests don't depend on the time of day they run.
    with db.connect() as con:
        con.execute("UPDATE settings SET value='0' WHERE key IN ('quiet_start','quiet_end')")
