import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        return False

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
MANIFESTS_DIR = DATA_DIR / "manifests"

DATABASE_URL = os.getenv("DATABASE_URL", "")

env_db = os.getenv("FIRELINE_DB_PATH")
if env_db:
    p = Path(env_db)
    FIRELINE_DB_PATH = p if p.is_absolute() else (BASE_DIR / p)
else:
    FIRELINE_DB_PATH = DATA_DIR / "fireline.db"

DB_PATH = FIRELINE_DB_PATH

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
