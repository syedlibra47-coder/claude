"""Start LeadPilot:  python run.py  ->  http://127.0.0.1:8000"""
import os

import uvicorn

from app import config

if __name__ == "__main__":
    config.load_env_file()
    # Local-only by default. Set HOST=0.0.0.0 (with APP_PASSWORD) to expose it.
    uvicorn.run("app.main:app", host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "8000")))
