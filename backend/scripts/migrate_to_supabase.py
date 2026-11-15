import sys
import sqlite3
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import DATABASE_URL, DB_PATH
import psycopg
from psycopg.rows import dict_row

print("=" * 70)
print("FIRELINE BULK MIGRATION: SQLite -> Supabase PostgreSQL")
print("=" * 70)

t0 = time.time()

# 1. Connect to SQLite
print(f"Reading from local SQLite: {DB_PATH} ...")
sqlite_conn = sqlite3.connect(str(DB_PATH))
sqlite_conn.row_factory = sqlite3.Row
scur = sqlite_conn.cursor()

# 2. Connect to Supabase PostgreSQL
print(f"Connecting to Supabase PostgreSQL ...")
pg_conn = psycopg.connect(DATABASE_URL, row_factory=dict_row, sslmode="require", connect_timeout=10)
pcur = pg_conn.cursor()

# 3. Migrate investigations
scur.execute("SELECT id, psi_id, title, pillar, doi, url, facility, summary FROM investigations;")
inv_rows = [tuple(r) for r in scur.fetchall()]
print(f"Migrating {len(inv_rows)} investigations...")
pcur.executemany(
    """
    INSERT INTO investigations (id, psi_id, title, pillar, doi, url, facility, summary)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        pillar = EXCLUDED.pillar,
        summary = EXCLUDED.summary;
    """,
    inv_rows,
)
pg_conn.commit()

# 4. Migrate sources
scur.execute("SELECT id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count FROM sources;")
src_rows = [tuple(r) for r in scur.fetchall()]
print(f"Migrating {len(src_rows)} sources...")
pcur.executemany(
    """
    INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        page_or_row_count = EXCLUDED.page_or_row_count;
    """,
    src_rows,
)
pg_conn.commit()

# 5. Migrate test_runs
scur.execute("""
    SELECT id, investigation_id, test_code, pi_name, test_date, gmt_day, sample_code,
           flow_regime, material_raw, material_normalized, color_or_grade, geometry,
           thickness_mm, width_mm, diameter_mm, burn_sides, flow_restrictor,
           extinction_mode, aging_state, gravity_regime, raw_row_index, source_id, notes
    FROM test_runs;
""")
run_rows = [tuple(r) for r in scur.fetchall()]
print(f"Migrating {len(run_rows)} test runs in bulk batches...")
batch_size = 500
for i in range(0, len(run_rows), batch_size):
    batch = run_rows[i:i + batch_size]
    pcur.executemany(
        """
        INSERT INTO test_runs (
            id, investigation_id, test_code, pi_name, test_date, gmt_day, sample_code,
            flow_regime, material_raw, material_normalized, color_or_grade, geometry,
            thickness_mm, width_mm, diameter_mm, burn_sides, flow_restrictor,
            extinction_mode, aging_state, gravity_regime, raw_row_index, source_id, notes
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s
        )
        ON CONFLICT (id) DO UPDATE SET
            test_code = EXCLUDED.test_code,
            flow_regime = EXCLUDED.flow_regime,
            material_normalized = EXCLUDED.material_normalized;
        """,
        batch,
    )
    pg_conn.commit()
    print(f"  Inserted test_runs {i + len(batch)} / {len(run_rows)}")

# 6. Migrate measurements
scur.execute("SELECT test_run_id, parameter, raw_value, normalized_value, unit, quality_status FROM measurements;")
meas_rows = [tuple(r) for r in scur.fetchall()]
print(f"Migrating {len(meas_rows)} measurements in bulk batches...")
pcur.execute("TRUNCATE TABLE measurements RESTART IDENTITY CASCADE;")
pg_conn.commit()
for i in range(0, len(meas_rows), batch_size):
    batch = meas_rows[i:i + batch_size]
    pcur.executemany(
        """
        INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
        VALUES (%s, %s, %s, %s, %s, %s);
        """,
        batch,
    )
    pg_conn.commit()
    print(f"  Inserted measurements {i + len(batch)} / {len(meas_rows)}")

# 7. Migrate findings
scur.execute("SELECT id, investigation_id, pillar, title, statement, evidence_label, source_id, page_or_row_ref FROM findings;")
fnd_rows = [tuple(r) for r in scur.fetchall()]
print(f"Migrating {len(fnd_rows)} curated findings...")
pcur.executemany(
    """
    INSERT INTO findings (id, investigation_id, pillar, title, statement, evidence_label, source_id, page_or_row_ref)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        statement = EXCLUDED.statement;
    """,
    fnd_rows,
)
pg_conn.commit()

# 8. Migrate evidence_chunks
scur.execute("SELECT source_id, investigation_id, page_number, section_title, content_text FROM evidence_chunks;")
chk_rows = [tuple(r) for r in scur.fetchall()]
print(f"Migrating {len(chk_rows)} evidence chunks (computing TSVECTOR in Supabase)...")
pcur.execute("TRUNCATE TABLE evidence_chunks RESTART IDENTITY CASCADE;")
pg_conn.commit()
for i in range(0, len(chk_rows), 200):
    batch = chk_rows[i:i + 200]
    pcur.executemany(
        """
        INSERT INTO evidence_chunks (source_id, investigation_id, page_number, section_title, content_text)
        VALUES (%s, %s, %s, %s, %s);
        """,
        batch,
    )
    pg_conn.commit()
    print(f"  Inserted evidence_chunks {i + len(batch)} / {len(chk_rows)}")

# Verification
print("\n" + "=" * 70)
print("LIVE SUPABASE POSTGRESQL TABLE COUNTS:")
print("=" * 70)
for t in ["investigations", "sources", "test_runs", "measurements", "findings", "evidence_chunks"]:
    pcur.execute(f"SELECT count(*) FROM {t};")
    count = pcur.fetchone()["count"]
    print(f"  {t:<20}: {count}")

pcur.close()
pg_conn.close()
scur.close()
sqlite_conn.close()

elapsed = time.time() - t0
print(f"\nMIGRATION COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS!")
print("=" * 70)
