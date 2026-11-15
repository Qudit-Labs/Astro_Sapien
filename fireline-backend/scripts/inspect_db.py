import sqlite3
from pathlib import Path

db_path = Path("fireline-backend/data/fireline.db")
if not db_path.exists():
    print("fireline.db not found")
else:
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
    print("Tables in fireline.db:", tables)
    for t in tables:
        if not t.startswith("sqlite_") and "fts" not in t:
            try:
                c = cur.execute(f"SELECT COUNT(*) FROM {t};").fetchone()[0]
                print(f"  {t}: {c} rows")
            except Exception as e:
                print(f"  {t}: {e}")
