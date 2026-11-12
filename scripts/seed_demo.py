"""Fill the database with fictional leads so you can try the dashboard.

    python scripts/seed_demo.py

Uses DB_PATH from .env (default data/leads.db). Does nothing if leads exist.
Safe to delete afterwards: just remove the database file."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config, demo  # noqa: E402

if __name__ == "__main__":
    config.load_env_file()
    n = demo.seed()
    print(f"Added {n} demo leads." if n else "The database already has leads; not adding demo data.")
