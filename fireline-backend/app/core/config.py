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
FIRELINE_DB_PATH = Path(os.getenv("FIRELINE_DB_PATH", str(DATA_DIR / "fireline.db")))
DB_PATH = FIRELINE_DB_PATH

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
