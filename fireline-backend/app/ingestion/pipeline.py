from pathlib import Path
from app.core.config import RAW_DIR
from app.database.schema import init_db
from app.database.connection import get_connection
from app.ingestion.bass2_ingestor import ingest_bass2
from app.ingestion.samer_ingestor import ingest_samer
from app.ingestion.saffire_ingestor import ingest_saffire
from app.ingestion.flex_ingestor import ingest_flex
from app.ingestion.spice_ingestor import ingest_spice
from app.ingestion.doc_ingestor import ingest_documents


def print_table_counts(conn_str: str | None = None):
    tables_with_inv = ["sources", "test_runs", "findings", "evidence_chunks"]
    
    with get_connection(conn_str) as conn:
        with conn.cursor() as cur:
            print("\n" + "=" * 70)
            print("FIRELINE DATABASE INGESTION SUMMARY (SUPABASE / POSTGRESQL)")
            print("=" * 70)

            # Investigations
            cur.execute("SELECT id, psi_id, title, pillar FROM investigations ORDER BY id;")
            invs = cur.fetchall()
            print(f"\n[1] INVESTIGATIONS ({len(invs)} total):")
            for inv in invs:
                print(f"  - {inv['id']:<10} ({inv['psi_id']}) | Pillar: {inv['pillar']:<12} | Title: {inv['title']}")

            # Per-investigation counts across tables
            print(f"\n[2] ROW COUNTS PER INVESTIGATION:")
            print(f"{'Investigation':<15} {'Sources':<10} {'Test Runs':<12} {'Measurements':<15} {'Findings':<10} {'Chunks':<10}")
            print("-" * 75)

            for inv in invs:
                inv_id = inv["id"]
                # Sources
                cur.execute("SELECT COUNT(*) as c FROM sources WHERE investigation_id = %s;", (inv_id,))
                src_c = cur.fetchone()["c"]
                # Test Runs
                cur.execute("SELECT COUNT(*) as c FROM test_runs WHERE investigation_id = %s;", (inv_id,))
                run_c = cur.fetchone()["c"]
                # Measurements (join through test_runs)
                cur.execute(
                    """
                    SELECT COUNT(m.id) as c 
                    FROM measurements m 
                    JOIN test_runs r ON m.test_run_id = r.id 
                    WHERE r.investigation_id = %s;
                    """,
                    (inv_id,),
                )
                meas_c = cur.fetchone()["c"]
                # Findings
                cur.execute("SELECT COUNT(*) as c FROM findings WHERE investigation_id = %s;", (inv_id,))
                fnd_c = cur.fetchone()["c"]
                # Evidence chunks
                cur.execute("SELECT COUNT(*) as c FROM evidence_chunks WHERE investigation_id = %s;", (inv_id,))
                chk_c = cur.fetchone()["c"]

                print(f"{inv_id:<15} {src_c:<10} {run_c:<12} {meas_c:<15} {fnd_c:<10} {chk_c:<10}")

            # Overall totals
            print("-" * 75)
            totals = {}
            for t in ["investigations", "sources", "test_runs", "measurements", "findings", "evidence_chunks"]:
                cur.execute(f"SELECT COUNT(*) as c FROM {t};")
                totals[t] = cur.fetchone()["c"]
            print(f"TOTALS: Investigations: {totals['investigations']} | Sources: {totals['sources']} | "
                  f"Test Runs: {totals['test_runs']} | Measurements: {totals['measurements']} | "
                  f"Findings: {totals['findings']} | Evidence Chunks: {totals['evidence_chunks']}")
            print("=" * 70 + "\n")


def run_full_ingestion(raw_dir: Path = RAW_DIR, conn_str: str | None = None) -> dict:
    print(f"Initializing database schema...")
    init_db(conn_str)

    print("Ingesting BASS-II (PSI-25)...")
    csv_bass2 = raw_dir / "PSI-25_Experimental table_BASS-II.csv"
    if not csv_bass2.exists():
        csv_bass2 = raw_dir / "BASS-II_Experimental_Table.csv"
    bass_count = ingest_bass2(csv_bass2, raw_dir, conn_str)

    print("Ingesting SAME-R (PSI-101)...")
    samer_count = ingest_samer(raw_dir, conn_str)

    print("Ingesting SAFFIRE (PSI-98 / PSI-99)...")
    saffire_count = ingest_saffire(raw_dir, conn_str)

    print("Ingesting FLEX (PSI-69)...")
    flex_count = ingest_flex(raw_dir, conn_str)

    print("Ingesting SPICE (PSI-107)...")
    spice_count = ingest_spice(raw_dir, conn_str)

    print("Ingesting Documents and Evidence Chunks...")
    chunk_count = ingest_documents(raw_dir, conn_str)

    print_table_counts(conn_str)

    return {
        "bass2_runs": bass_count,
        "samer_runs": samer_count,
        "saffire_runs": saffire_count,
        "flex_runs": flex_count,
        "spice_runs": spice_count,
        "evidence_chunks": chunk_count,
    }


if __name__ == "__main__":
    run_full_ingestion()
