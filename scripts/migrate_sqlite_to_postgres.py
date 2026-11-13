"""Copy a LeadPilot SQLite database into Postgres (e.g. Supabase).

    DATABASE_URL=postgresql://... python scripts/migrate_sqlite_to_postgres.py [path/to/leads.db]

The source defaults to DB_PATH / data/leads.db. It is only read, never changed.
Refuses to run if the Postgres database already contains leads, so it can't
overwrite or duplicate real data. Run it once."""
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config, db  # noqa: E402

ORDER = ["leads", "events", "sequences", "steps", "enrollments", "outbox"]  # parents before children


def main():
    config.load_env_file()
    if not config.database_url():
        sys.exit("Set DATABASE_URL to your Postgres connection string first.")
    src_path = Path(sys.argv[1]) if len(sys.argv) > 1 else config.db_path()
    if not src_path.exists():
        sys.exit(f"No SQLite database at {src_path}")
    src = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True)
    src.row_factory = sqlite3.Row

    db.init()
    with db.connect() as con:
        if db.one(con, "SELECT COUNT(*) AS n FROM leads")["n"]:
            sys.exit("The Postgres database already has leads; not copying anything.")
        # Drop the default sequence/settings seeded by init so the originals replace them.
        con.execute("DELETE FROM sequences")
        for table in ORDER:
            rows = src.execute(f"SELECT * FROM {table}").fetchall()
            for r in rows:
                cols = r.keys()
                con.execute(f"INSERT INTO {table}({', '.join(cols)}) VALUES({', '.join('?' * len(cols))})", tuple(r))
            print(f"{table}: {len(rows)} rows")
        for k, v in src.execute("SELECT key, value FROM settings"):
            con.execute("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (k, v))
        # Rows were inserted with their old ids; move each sequence past the highest one.
        for table in ORDER:
            con.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                        f"COALESCE((SELECT MAX(id) FROM {table}), 1), (SELECT MAX(id) FROM {table}) IS NOT NULL)")
    print("Done.")


if __name__ == "__main__":
    main()
