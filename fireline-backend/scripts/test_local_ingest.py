from pathlib import Path
from app.ingestion.bass2_ingestor import ingest_bass2
from app.ingestion.samer_ingestor import ingest_samer
from app.ingestion.saffire_ingestor import ingest_saffire
from app.ingestion.flex_ingestor import ingest_flex
from app.ingestion.spice_ingestor import ingest_spice

raw = Path("fireline-backend/data/raw")
db = Path("fireline-backend/data/fireline.db")

print("Testing ingestion into fireline.db...")
try:
    b_count = ingest_bass2(raw / "PSI-25_Experimental table_BASS-II.csv", raw)
    print("BASS-II ingested:", b_count)
except Exception as e:
    print("BASS-II error:", e)

try:
    sam_count = ingest_samer(raw)
    print("SAME-R ingested:", sam_count)
except Exception as e:
    print("SAME-R error:", e)

try:
    saff_count = ingest_saffire(raw)
    print("SAFFIRE ingested:", saff_count)
except Exception as e:
    print("SAFFIRE error:", e)

try:
    fl_count = ingest_flex(raw)
    print("FLEX ingested:", fl_count)
except Exception as e:
    print("FLEX error:", e)

try:
    sp_count = ingest_spice(raw)
    print("SPICE ingested:", sp_count)
except Exception as e:
    print("SPICE error:", e)
