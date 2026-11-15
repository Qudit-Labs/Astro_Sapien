import os
import re
import sqlite3
from pathlib import Path
from app.core.config import DATABASE_URL, DB_PATH

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = None
    dict_row = None


class SQLitePostgresCompatCursor:
    """A cursor wrapper that translates %s to ? and websearch_to_tsquery for SQLite compatibility."""
    def __init__(self, cursor):
        self._cur = cursor

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            self._cur.close()
        except Exception:
            pass

    def execute(self, sql, params=None):
        if params is None:
            params = []
        translated_sql = sql.replace("%s", "?")
        # Translate websearch_to_tsquery full-text search syntax for SQLite FTS5
        if "websearch_to_tsquery" in translated_sql:
            translated_sql = re.sub(
                r"ts_rank\([^)]+websearch_to_tsquery\([^)]+\)[^)]*\)",
                "bm25(evidence_chunks)",
                translated_sql,
                flags=re.IGNORECASE,
            )
            translated_sql = re.sub(
                r"[a-zA-Z0-9_.]*search_tsv\s*@@\s*websearch_to_tsquery\([^)]+\)",
                "evidence_chunks MATCH ?",
                translated_sql,
                flags=re.IGNORECASE,
            )
            if len(params) >= 2 and params[0] == params[1]:
                params = [params[0]] + list(params[2:])

        return self._cur.execute(translated_sql, params)

    def fetchone(self):
        row = self._cur.fetchone()
        return dict(row) if row is not None else None

    def fetchall(self):
        rows = self._cur.fetchall()
        return [dict(r) for r in rows]

    def __getattr__(self, name):
        return getattr(self._cur, name)


class SQLitePostgresCompatConnection:
    """Wraps an sqlite3.Connection to behave like a psycopg connection with dict_row."""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return SQLitePostgresCompatCursor(self._conn.cursor())

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self._conn.rollback()
        else:
            self._conn.commit()


_REMOTE_CHECKED = False
_REMOTE_CONN_INFO = None

def get_connection(conn_str: str | None = None):
    global _REMOTE_CHECKED, _REMOTE_CONN_INFO

    url = conn_str or DATABASE_URL or os.getenv("DATABASE_URL", "")

    # If an explicit SQLite path is passed
    if url.startswith("sqlite:") or (isinstance(conn_str, Path) and conn_str.suffix == ".db"):
        path = str(conn_str).replace("sqlite:///", "").replace("sqlite:", "")
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        return SQLitePostgresCompatConnection(conn)

    # If Supabase URL is configured and has a real password
    if url.startswith("postgres") and "[YOUR-PASSWORD]" not in url:
        if not _REMOTE_CHECKED:
            _REMOTE_CHECKED = True
            # Check pooler first (IPv4 compatible)
            m = re.match(r"postgresql://([^:]+):([^@]+)@(?:db\.([a-z0-9]+)\.supabase\.co|aws-0-([a-z0-9-]+)\.pooler\.supabase\.com):(?:\d+)/([^?]+)", url)
            if m:
                user, pwd, ref_direct, reg_pooler, dbname = m.groups()
                ref = ref_direct or "udjxwuzyyefkyqsnxslx"
                target_hosts = [
                    (f"aws-0-ap-northeast-2.pooler.supabase.com", 5432, f"postgres.{ref}"),
                ]
                for host, port, u_name in target_hosts:
                    try:
                        p_url = f"postgresql://{u_name}:{pwd}@{host}:{port}/{dbname}"
                        c = psycopg.connect(p_url, row_factory=dict_row, sslmode="require", connect_timeout=3)
                        _REMOTE_CONN_INFO = p_url
                        return c
                    except Exception:
                        pass
            
            try:
                c = psycopg.connect(url, row_factory=dict_row, sslmode="require", connect_timeout=2)
                _REMOTE_CONN_INFO = url
                return c
            except Exception:
                _REMOTE_CONN_INFO = None

        if _REMOTE_CONN_INFO:
            return psycopg.connect(_REMOTE_CONN_INFO, row_factory=dict_row, sslmode="require", connect_timeout=3)

        # Remote check failed or not available; fallback to local SQLite
        if DB_PATH.exists():
            conn = sqlite3.connect(str(DB_PATH))
            conn.row_factory = sqlite3.Row
            return SQLitePostgresCompatConnection(conn)

    # Fallback to local database if DATABASE_URL is not yet connected with password
    if DB_PATH.exists():
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return SQLitePostgresCompatConnection(conn)

    raise ValueError("No database connection available: DATABASE_URL not configured and fireline.db not found.")
