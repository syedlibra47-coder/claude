"""Environment-driven configuration. Values are read at call time so tests
and a changed .env take effect without re-importing."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_env_file(path: Path = ROOT / ".env") -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def get(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def db_path() -> Path:
    p = Path(get("DB_PATH", "data/leads.db"))
    return p if p.is_absolute() else ROOT / p


def whatsapp_configured() -> bool:
    return bool(get("WHATSAPP_TOKEN") and get("WHATSAPP_PHONE_ID"))


def email_configured() -> bool:
    return bool(get("SMTP_HOST") and get("SMTP_FROM"))


def ai_configured() -> bool:
    return bool(get("ANTHROPIC_API_KEY") or get("ANTHROPIC_AUTH_TOKEN"))


def claude_model() -> str:
    return get("CLAUDE_MODEL", "claude-opus-5-5")


def tz_offset_hours() -> float:
    try:
        return float(get("TZ_OFFSET_HOURS", "4"))
    except ValueError:
        return 4.0
