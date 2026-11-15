import os
import re
import time
import sqlite3
import threading
import logging
from pathlib import Path
from app.core.config import DATABASE_URL, DB_PATH

logger = logging.getLogger("fireline.database")

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = None
    dict_row = None


class SQLitePostgresCompatCursor:
    """A cursor wrapper that translates %s to ? and tsquery syntax for SQLite compatibility."""
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
        elif isinstance(params, tuple):
            params = list(params)
        elif not isinstance(params, list):
            params = [params]

        translated_sql = sql.replace("%s", "?")

        # In SQLite FTS5 table evidence_chunks, rowid is the primary key rather than id
        if "from evidence_chunks" in translated_sql.lower() and "select id," in translated_sql.lower():
            translated_sql = re.sub(r"select\s+id\s*,", "SELECT rowid AS id,", translated_sql, flags=re.IGNORECASE)

        # Translate websearch_to_tsquery and to_tsquery full-text search syntax for SQLite FTS5
        if "websearch_to_tsquery" in translated_sql or "to_tsquery" in translated_sql:
            translated_sql = re.sub(
                r"ts_rank\s*\([^;]+?\)\s*AS\s+rank",
                "bm25(evidence_chunks) AS rank",
                translated_sql,
                flags=re.IGNORECASE,
            )
            translated_sql = re.sub(
                r"[a-zA-Z0-9_.]*search_tsv\s*@@\s*(?:websearch_to_tsquery|to_tsquery)\s*\([^;]+?\)",
                "evidence_chunks MATCH ?",
                translated_sql,
                flags=re.IGNORECASE,
            )
            raw_q = str(params[0]) if params else ""
            stop_words = {"what", "is", "the", "for", "in", "and", "with", "this", "that", "how", "are", "from", "can", "does", "where"}
            tokens = [w for w in re.findall(r"\w+", raw_q) if w.lower() not in stop_words and len(w) > 1]
            if not tokens:
                tokens = re.findall(r"\w+", raw_q)
            fts_q = " OR ".join(tokens) if tokens else raw_q

            if len(params) >= 2 and params[0] == params[1]:
                params = [fts_q] + list(params[2:])
            elif len(params) >= 1:
                params = [fts_q] + list(params[1:])

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


class PooledPostgresConnection:
    """Wraps a psycopg connection borrowed from the pool, returning it on close/exit."""
    def __init__(self, conn, pool):
        self._conn = conn
        self._pool = pool
        self._active = True

    def cursor(self, *args, **kwargs):
        return self._conn.cursor(*args, **kwargs)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        if self._active and self._pool and self._conn:
            self._active = False
            self._pool.release(self._conn)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._active and self._conn:
            try:
                if exc_type is not None:
                    self._conn.rollback()
                else:
                    self._conn.commit()
            except Exception:
                pass
            self.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)


class PostgresConnectionPool:
    """Thread-safe connection pool with health checking, pre-warming, and instant fallback."""
    def __init__(self, conn_str: str, max_size: int = 4, timeout: float = 2.5):
        self.conn_str = conn_str
        self.max_size = max_size
        self.timeout = timeout
        self._lock = threading.Lock()
        self._pool: list = []

    def acquire(self):
        with self._lock:
            while self._pool:
                conn = self._pool.pop()
                if not conn.closed:
                    return PooledPostgresConnection(conn, self)

        # Trigger background replenishment of pool without blocking request
        self._replenish_async()

        # If pool has no ready connection, immediately serve from local high-performance SQLite
        if DB_PATH.exists():
            return _get_sqlite_conn()

        # Fallback to direct synchronous connection if local DB not on disk
        c = psycopg.connect(self.conn_str, row_factory=dict_row, sslmode="require", connect_timeout=self.timeout)
        c.autocommit = False
        return PooledPostgresConnection(c, self)

    def release(self, conn):
        with self._lock:
            if not conn.closed and len(self._pool) < self.max_size:
                try:
                    conn.rollback()
                except Exception:
                    pass
                self._pool.append(conn)
            else:
                try:
                    conn.close()
                except Exception:
                    pass

    def _replenish_async(self):
        def _connect():
            try:
                with self._lock:
                    if len(self._pool) >= self.max_size:
                        return
                c = psycopg.connect(self.conn_str, row_factory=dict_row, sslmode="require", connect_timeout=self.timeout)
                c.autocommit = False
                with self._lock:
                    if len(self._pool) < self.max_size:
                        self._pool.append(c)
                    else:
                        c.close()
            except Exception:
                pass

        threading.Thread(target=_connect, daemon=True).start()


_POOL: PostgresConnectionPool | None = None
_POOL_LOCK = threading.Lock()


def _get_sqlite_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return SQLitePostgresCompatConnection(conn)


def get_connection(conn_str: str | None = None):
    global _POOL

    url = conn_str or DATABASE_URL or os.getenv("DATABASE_URL", "")

    # Explicit SQLite path
    if url.startswith("sqlite:") or (isinstance(conn_str, Path) and conn_str.suffix == ".db"):
        path = str(conn_str).replace("sqlite:///", "").replace("sqlite:", "")
        conn = sqlite3.connect(path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return SQLitePostgresCompatConnection(conn)

    # Force local DB toggle
    if os.getenv("FORCE_LOCAL_DB", "").lower() in ("true", "1"):
        return _get_sqlite_conn()

    # Remote PostgreSQL via pooled connection with instant fallback
    if psycopg and url.startswith("postgres") and "[YOUR-PASSWORD]" not in url:
        with _POOL_LOCK:
            if _POOL is None or _POOL.conn_str != url:
                _POOL = PostgresConnectionPool(url, max_size=4, timeout=2.5)

        return _POOL.acquire()

    return _get_sqlite_conn()
