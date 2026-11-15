import os
import re
import psycopg
from psycopg.rows import dict_row
from app.core.config import DATABASE_URL


def get_connection(conn_str: str | None = None) -> psycopg.Connection:
    """
    Connect to PostgreSQL (Supabase) using psycopg with row_factory=dict_row and sslmode='require'.
    """
    url = conn_str or DATABASE_URL or os.getenv("DATABASE_URL", "")
    if not url:
        raise ValueError("DATABASE_URL is not set in environment or .env file.")

    try:
        return psycopg.connect(url, row_factory=dict_row, sslmode="require")
    except psycopg.OperationalError as err:
        err_msg = str(err)
        # If IPv6 direct host cannot be resolved on an IPv4 network, check for pooler fallback
        m = re.match(r"postgresql://([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)/([^?]+)", url)
        if m and "failed to resolve host" in err_msg:
            user, pwd, ref, port, dbname = m.groups()
            regions = ["ap-south-1", "ap-southeast-1", "eu-central-1", "us-east-1", "us-west-1"]
            for reg in regions:
                pooler_host = f"aws-0-{reg}.pooler.supabase.com"
                pooler_user = f"{user}.{ref}"
                pooler_url = f"postgresql://{pooler_user}:{pwd}@{pooler_host}:5432/{dbname}"
                try:
                    return psycopg.connect(pooler_url, row_factory=dict_row, sslmode="require", connect_timeout=4)
                except Exception:
                    continue
        raise err
