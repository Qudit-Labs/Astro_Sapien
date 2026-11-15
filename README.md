# FIRELINE — Spacecraft Fire-Safety Intelligence Engine

**Astro_Sapien • NASA Space Apps / HackAthlone 2026**

FIRELINE is an AI-powered Spacecraft Fire-Safety Intelligence Engine that unifies real NASA microgravity combustion, detection, and suppression research from the **NASA Physical Sciences Informatics (PSI)** repository and the **NASA Technical Reports Server (NTRS)** into searchable, comparable, and explainable scientific evidence.

The platform bridges small-scale laboratory experiments with full-scale spacecraft vehicle fire safety through three deterministic analytical engines and grounded Gemini 2.5 Flash RAG:
1. **FIRELINE**: Solid and liquid fuel combustion, flame spread, heat release, material flammability, and gaseous suppression ($\text{CO}_2$, $\text{He}$, $\text{SF}_6$).
2. **TESTMATCH**: Pairwise experiment comparability scoring ($S$, $C$), experimental scale divergence alerts, cross-investigation complementary domain tagging, and sensor quality monitoring.
3. **SMOKewise**: Microgravity smoke aerosol particle sizing, coagulation aging trajectories, and detector technology implications (near-IR light scattering vs. ionization vs. two-moment MPASS prototypes).

---

## Live Ingested NASA Datasets (Batch A & Batch B)

The engine ingests **5 complete NASA investigations** across **18 primary sources**, **1,077 test runs**, **6,287 normalized measurements**, **8 curated findings**, and **662 indexed evidence chunks**:

| Investigation | PSI ID | Phenomenon / Facility | Scale & Materials | Ingested Metrics |
| :--- | :--- | :--- | :--- | :--- |
| **BASS-II** | `PSI-25` | Solid-fuel flame spread in ISS Microgravity Science Glovebox (MSG) | Small-scale ($1\text{--}2\text{ cm}$ ducts): PMMA, SIBAL fabric, Nomex, Cotton | 176 test runs, 1,300 measurements, 258 evidence chunks (`NASA/TM-20210011385`, Fan Calibration data, FAQ) |
| **SAME-R** | `PSI-101` | Smoke aerosol generation, particle sizing & aging in microgravity | Pyrolysis of Kapton, Silicone, Teflon, Pyrell, Lampwick ($11\text{--}1800\text{ s}$ aging) | 140 test runs, 761 measurements, 215 evidence chunks (`SAMER Final Report`, `AIAA 2012-3536`) |
| **SAFFIRE-I / II** | `PSI-98` / `PSI-99` | Large-scale practical spacecraft fire tests in Cygnus resupply vehicles | Full-scale vehicle ($0.4\text{ m} \times 0.94\text{ m}$): SIBAL, PMMA, Silicone, Nomex | 19 test runs, 53 measurements, 25 evidence chunks (`NTRS 20170000230`) |
| **FLEX / FLEX-2** | `PSI-69` | Isolated microgravity liquid droplet combustion & gaseous suppression | Liquid droplet combustion: Methanol, Heptane, Decane, gaseous suppressants ($\text{CO}_2$, $\text{He}$, $\text{SF}_6$) | 273 test runs, 2,346 measurements, 164 evidence chunks (`NASA/TP-2015-216046`) |
| **SPICE** | `PSI-107` | Microgravity laminar co-flow smoke point & soot emissions | Gaseous fuels: Ethylene, Propane, Methane in quiescent/co-flow microgravity | 469 test runs, 1,827 measurements (kept strictly segregated from pyrolysis smoke) |

---

## System Architecture

```text
Astro_Sapien/
│
├── backend/                       # FastAPI + Supabase PostgreSQL / SQLite FTS5 backend
│   ├── app/
│   │   ├── ai/gemini_rag.py       # Grounded Gemini 2.5 Flash RAG with scientific guardrails
│   │   ├── core/config.py         # Database and Gemini environment settings
│   │   ├── database/              # Supabase PostgreSQL schema, indexes & dual-mode connection
│   │   ├── engines/               # Three deterministic analytical engines
│   │   │   ├── fireline_engine.py # Combustion & suppression evidence analysis + FTS
│   │   │   ├── testmatch_engine.py# Deterministic comparability formula & scale divergence rules
│   │   │   └── smokewise_engine.py# Smoke aerosol particle aging & detector implications
│   │   ├── ingestion/             # Multi-investigation parsers (BASS-II, SAME-R, SAFFIRE, FLEX, SPICE, PDFs)
│   │   └── main.py                # FastAPI REST API surface with CORS
│   ├── data/
│   │   ├── raw/                   # Raw NASA CSV, XLSX, PDF, DOCX, and PPTX reports
│   │   ├── processed/             # normalized_test_runs.json (1,077 records)
│   │   └── manifests/             # source_manifest.json (18 sources)
│   ├── tests/test_backend.py      # Automated 10-test suite (100% pass rate)
│   ├── pytest.ini                 # Pytest configuration
│   └── requirements.txt           # Lightweight dependencies (no heavy ML/vector DBs)
│
├── frontend/                      # React 18 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/            # Reusable aerospace UI library (ChartCard, KPIStatCard, AppShell)
│   │   ├── context/               # ResearchDataContext (switching between Mock & API modes)
│   │   ├── data/                  # ResearchDataProvider, MockResearchDataProvider, ApiResearchDataProvider
│   │   ├── pages/                 # Overview, FIRELINE, TESTMATCH, SMOKewise, AI Assistant, Reports, Sources
│   │   └── services/              # apiContracts.ts & analytical engine client integrations
│   ├── public/                    # Static assets
│   ├── package.json               # Frontend dependencies & scripts
│   ├── vite.config.ts             # Vite bundle splitting & path aliases
│   ├── tailwind.config.js         # Styling & theme configuration
│   └── tsconfig.json              # TypeScript configuration
│
├── shared/schemas/                # Canonical JSON Schemas (experiment, finding, report)
├── datasets/                      # Mock and downloaded NASA datasets
├── docs/                          # API_CONTRACT.md, DATA_CONTRACT.md, UNIT_STANDARDS.md
├── openapi.json                   # Exported OpenAPI 3.1 specification for frontend contract
└── README.md
```

---

## Deterministic Scientific Engines

### 1. FIRELINE Combustion & Suppression Engine
- Multi-investigation filtering across `BASS-II`, `SAFFIRE`, and `FLEX` by material, flow regime, geometry, and initial $\text{O}_2$ range.
- Full-Text Search ranked with `ts_rank` / `websearch_to_tsquery` across 662 indexed document chunks.
- **Mandatory Partial-Gravity Notice**: Explicitly surfaces the constraint that NASA PSI datasets cover microgravity and normal gravity, strictly lacking validated Lunar ($1/6g$) or Martian ($3/8g$) flammability data.

### 2. TESTMATCH Comparability Engine
- Evaluates pairwise experiment comparability using deterministic weighted similarity:
  $$S = 100 \times \frac{\sum w_i m_i s_i}{\sum w_i m_i}$$
  and data parameter coverage:
  $$C = 100 \times \frac{\sum w_i m_i}{\sum w_i}$$
  across 9 criteria: gravity regime, material, geometry, flow regime, experimental scale, $\text{O}_2\%$, airflow ($\text{cm/s}$), pressure ($\text{kPa}$), and characteristic dimension ($\text{mm}$).
- **Enforced Scientific Warnings**:
  - **Scale Divergence (`BASS-II` vs. `SAFFIRE`)**: Alerts that BASS-II ($1\text{--}2\text{ cm}$ MSG duct) vs. SAFFIRE ($0.4\text{ m} \times 0.94\text{ m}$ Cygnus panel) exhibit up to an order-of-magnitude difference in radiative preheating and concurrent flame spread rates.
  - **Cross-Domain Complementary**: Distinguishes non-interchangeable domains (solid flame spread vs. droplet extinction vs. smoke aerosol pyrolysis).
  - **Sensor Quality Flags**: Automatically flags `suspect` or `over_range` readings (e.g., negative CO sensor drift or saturated over-range CO values).

### 3. SMOKEWISE Aerosol & Detection Engine
- Aggregates microgravity smoke particle growth across 5 spacecraft materials: Kapton, Teflon, Silicone, Lampwick, and Pyrell.
- Computes mass-mean diameter ($d_{mm}$) and geometric mean diameter ($d_g$) trajectories across aging states ($11\text{--}1800\text{ s}$) and airflow regimes (quiescent $0\text{ cm/s}$ vs. low-flow $1\text{--}8\text{ cm/s}$).
- Evaluates detector implications:
  - **ISS Near-IR Scattering ($>1000\text{ nm}$)**: Fresh Kapton/Teflon pyrolysis produces sub-$100\text{ nm}$ particles that remain undetected until significant coagulation aging ($>700\text{ s}$) occurs.
  - **Shuttle Ionization**: Sensitive to high particle counts and sub-micron smoke, but vulnerable to cabin dust and humidity variance.
  - **Two-Moment Prototype (MPASS)**: Combines number concentration (0th/1st moment) and mass (2nd/3rd moment), cutting response variance by $>2\times$ and discriminating smoke from background dust.
- Strictly keeps flaming soot point data (`SPICE`) segregated from pyrolysis smoke data (`SAME-R`).

---

## Grounded Gemini 2.5 Flash RAG (`app/ai/gemini_rag.py`)

- **Synthesizer**: Uses `gemini-2.5-flash` via `google-genai` with temperature set to $0.2$.
- **Strict Evidence Labeling**: Every claim must be explicitly tagged with:
  - `[NASA observation]`
  - `[Calculated result]`
  - `[AI interpretation]`
  - `[Research implication]`
  - `[Unknown]`
- **Inline Provenance Citations**: Every finding includes exact inline citations (e.g., `[PSI-25 / NASA-TM-20210011385, p. 75]`).
- **Partial-Gravity Guardrail**: Prohibits extrapolating microgravity flame behavior to Lunar or Martian partial gravity without explicit research qualification.
- **Deterministic Fallback**: Automatically activates if `GEMINI_API_KEY` is not set, generating evidence-backed responses from retrieved passages without hallucinations.

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (tested with Python 3.14)

---

### Backend Setup & Execution

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\activate
   # Linux / macOS:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.udjxwuzyyefkyqsnxslx.supabase.co:5432/postgres
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
   *(Note: The database layer connects to Supabase PostgreSQL when available, or transparently uses `fireline.db` with the built-in PostgreSQL compatibility wrapper).*

5. Run the automated test suite:
   ```bash
   pytest -v
   ```
   *(Expected result: 10/10 passed).*

6. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - API Base URL: `http://127.0.0.1:8000`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
   - Health Endpoint: `http://127.0.0.1:8000/health`

---

### Frontend Setup & Execution

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Choose your data mode in `frontend/.env`:
   - **Live API Mode (Connected to FastAPI backend)**:
     ```env
     VITE_DATA_MODE=api
     VITE_API_BASE_URL=http://localhost:8000/api/v1
     ```
   - **Mock Data Mode (Offline demonstration)**:
     ```env
     VITE_DATA_MODE=mock
     ```

3. Run data validation and frontend tests:
   ```bash
   npm run validate:data
   npm test
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   - Accessible at `http://localhost:5173`

5. Production build:
   ```bash
   npm run build
   ```

---

## FastAPI REST API Endpoints

The complete OpenAPI 3.1 specification is available in [`openapi.json`](./openapi.json):

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Live database health and table counts |
| `GET` | `/api/v1/investigations` | List all 5 investigations with run counts |
| `GET` | `/api/v1/investigations/{id}` | Detailed investigation metadata, sources & findings |
| `GET` | `/api/v1/tests` | Query runs filtered by investigation, material, geometry, flow |
| `GET` | `/api/v1/tests/{test_id}` | Test run details with measurements and provenance |
| `GET` | `/api/v1/sources/{source_id}` | Source metadata, report citation, and document details |
| `GET` | `/api/v1/evidence/search` | Ranked full-text search across indexed evidence chunks |
| `POST` | `/api/v1/fireline/analyze` | Combustion evidence analysis, extinction modes, and O2 limits |
| `POST` | `/api/v1/testmatch/compare` | Deterministic pairwise comparability ($S$, $C$) & warnings |
| `POST` | `/api/v1/smokewise/analyze` | Smoke aerosol size distribution and detector implications |
| `POST` | `/api/v1/assistant/query` | Grounded Gemini RAG research query synthesizer |
| `POST` | `/api/v1/reports/generate` | Multi-pillar integrated research report generator |

---

## Quality Assurance & Verification

- **Automated Backend Tests (`pytest -v`)**: 10/10 passed across all 5 investigations, FTS search, TESTMATCH comparisons, SMOKewise aggregations, and Gemini RAG grounding.
- **Frontend Type Safety**: `npm run typecheck` passed (0 TypeScript errors).
- **Frontend Unit Tests**: `npm test` passed (18/18 tests).
- **Data Integrity**: `npm run validate:data` passed across all canonical JSON schemas.
- **Scientific Integrity**: All AI responses tagged with categorical certainty, inline citations, and partial-gravity boundary warnings.

---

## License & Attribution

Developed by **Team Astro_Sapien** for NASA Space Apps / HackAthlone 2026. Microgravity combustion, detection, and suppression data sourced from the **NASA Physical Sciences Informatics (PSI)** system and the **NASA Technical Reports Server (NTRS)**.
