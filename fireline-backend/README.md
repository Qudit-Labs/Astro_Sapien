# FIRELINE — Spacecraft Fire-Safety Intelligence Backend

**Astro_Sapien • NASA Space Apps / HackAthlone 2026**

High-performance, lightweight FastAPI backend powering the **FIRELINE Spacecraft Fire-Safety Intelligence Engine**. The backend unifies 5 primary NASA investigations from the **NASA Physical Sciences Informatics (PSI)** repository and the **NASA Technical Reports Server (NTRS)** into a single relational schema with full-text search (`ts_rank` / `websearch_to_tsquery`), deterministic analytical engines, and grounded Gemini 2.5 Flash RAG.

---

## Ingested Datasets Summary

| Investigation | PSI ID | Test Runs | Measurements | Sources | Evidence Chunks | Primary Data Sources |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BASS-II** | `PSI-25` | 176 | 1,300 | 8 | 258 | `PSI-25_Experimental table_BASS-II.csv`, `Fan calibration data.xlsx`, `NASA/TM-20210011385`, FAQ & matrices |
| **FLEX** | `PSI-69` | 273 | 2,346 | 2 | 164 | `FLEX_Experimental_Table.csv`, `NASA-TP-2015-216046.pdf` |
| **SAFFIRE** | `PSI-98` / `99` | 19 | 53 | 3 | 25 | `SAFFIRE-I_Experimental_Table.csv`, `SAFFIRE-II_Experimental_Table.csv`, `NTRS 20170000230.pdf` |
| **SAME-R** | `PSI-101` | 140 | 761 | 4 | 215 | `SAME-R_Experimental_Table.csv`, `SAMER_Final 0602 2014.pdf`, `AIAA 2012-3536.pdf`, Concept Spec |
| **SPICE** | `PSI-107` | 469 | 1,827 | 1 | 0 | `SPICE_Experimental_Table.csv`, `SPICE_SRD.doc` |
| **TOTAL** | — | **1,077** | **6,287** | **18** | **662** | Full Batch A & Batch B coverage |

---

## Core Architecture & Analytical Engines

### 1. `app/engines/fireline_engine.py` (Combustion & Suppression)
- Multi-investigation filtering across `BASS-II`, `SAFFIRE`, and `FLEX` by material, geometry, flow regime, and initial $\text{O}_2\%$.
- Full-Text Search ranked by PostgreSQL `ts_rank(search_tsv, websearch_to_tsquery('english', %s))` over 662 evidence chunks.
- Mandatory partial-gravity disclaimer noting NASA PSI lacks validated Lunar ($1/6g$) or Martian ($3/8g$) flammability data.

### 2. `app/engines/testmatch_engine.py` (Experiment Comparability)
- Deterministic weighted similarity:
  $$S = 100 \times \frac{\sum w_i m_i s_i}{\sum w_i m_i}$$
  and parameter coverage:
  $$C = 100 \times \frac{\sum w_i m_i}{\sum w_i}$$
- Enforces scientific warnings:
  - **Scale Divergence (`BASS-II` vs `SAFFIRE`)**: $1\text{--}2\text{ cm}$ MSG glovebox sample vs. $0.4\text{ m} \times 0.94\text{ m}$ Cygnus spacecraft fire.
  - **Cross-Domain Complementary**: Highlights non-interchangeable domains (solid flame spread vs. liquid droplet extinction vs. smoke aerosol pyrolysis).
  - **Sensor Quality Flags**: Surfaces `suspect` (e.g., negative CO drift) or `over_range` readings.

### 3. `app/engines/smokewise_engine.py` (Smoke Aerosol & Detection)
- Aggregates microgravity smoke particle growth across 5 materials (Kapton, Teflon, Silicone, Lampwick, Pyrell).
- Computes mass-mean diameter ($d_{mm}$) and geometric mean diameter ($d_g$) trajectories across aging times ($11\text{--}1800\text{ s}$).
- Evaluates detector implications: ISS near-IR light scattering ($>1000\text{ nm}$) vs. Shuttle ionization vs. MPASS two-moment prototype.
- Strictly segregates flaming soot point data (`SPICE`) from pyrolysis smoke data (`SAME-R`).

### 4. `app/ai/gemini_rag.py` (Grounded Gemini 2.5 Flash RAG)
- Uses `google-genai` (`gemini-2.5-flash`) at temperature $0.2$.
- Requires every statement to be tagged: `[NASA observation]`, `[Calculated result]`, `[AI interpretation]`, `[Research implication]`, or `[Unknown]`.
- Enforces exact inline source citations (e.g. `[PSI-25 / NASA-TM-20210011385, p. 75]`).
- Includes deterministic evidence-backed fallback when `GEMINI_API_KEY` is not provided.

---

## Quickstart

### 1. Environment Setup
```bash
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure `.env`
Create `.env` in `fireline-backend/`:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.udjxwuzyyefkyqsnxslx.supabase.co:5432/postgres
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

*(The database connection automatically falls back to local `data/fireline.db` with transparent PostgreSQL `%s` and `ts_rank` compatibility if Supabase is offline or unconfigured).*

### 3. Run Automated Tests
```bash
pytest -v
```
*(All 10 end-to-end tests verify endpoints, comparability calculations, aerosol aggregations, and RAG grounding).*

### 4. Start Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```
- Swagger UI: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`
- Live OpenAPI Schema: `http://127.0.0.1:8000/openapi.json`

---

## Re-running Data Ingestion

To re-ingest all Batch A and Batch B files from `data/raw/`:
```bash
python -c "from app.ingestion.pipeline import run_full_ingestion; run_full_ingestion()"
```

To refresh frontend manifests and contracts:
```bash
python -c "
import json
from pathlib import Path
from app.main import app
from app.database.connection import get_connection

# Export openapi.json
Path('openapi.json').write_text(json.dumps(app.openapi(), indent=2), encoding='utf-8')

# Export normalized test runs and sources manifest
with get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute('SELECT * FROM test_runs ORDER BY investigation_id, raw_row_index;')
        Path('data/processed/normalized_test_runs.json').write_text(json.dumps([dict(r) for r in cur.fetchall()], indent=2), encoding='utf-8')
        cur.execute('SELECT * FROM sources ORDER BY id;')
        Path('data/manifests/source_manifest.json').write_text(json.dumps([dict(r) for r in cur.fetchall()], indent=2), encoding='utf-8')
"
```
