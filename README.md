# IGNIS-G (FIRELINE)— Spacecraft Fire-Safety Intelligence Engine

[![NASA PSI Datasets](https://img.shields.io/badge/NASA%20PSI-5%20Investigations-0B3D91.svg)](https://psi.nasa.gov/)
[![Supabase PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![LangChain SQL Agent](https://img.shields.io/badge/LangChain-Conversational%20SQL-black.svg)](https://www.langchain.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash%20RAG-4285F4.svg)](https://deepmind.google/technologies/gemini/)
[![Voice AI CapCom](https://img.shields.io/badge/Voice%20AI-CapCom%20Bidirectional-FC3D21.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![Aerospace UI](https://img.shields.io/badge/GUI-Mission%20Control%20HUD-38BDF8.svg)](http://localhost:5173/)

**Team Astro_Sapien • NASA Space Apps Challenge 2026**

---
# 🚀 WATCH IGNIS-G (FIRELINE) IN ACTION — PROJECT DEMO VIDEO

🎬 **See how FIRELINE transforms NASA combustion research into intelligent spacecraft fire-safety insights.**

[▶️ WATCH THE 50-SECOND PROJECT VIDEO ON YOUTUBE](https://youtu.be/ZJ2zW66XxaE?si=P6-077j6pg3WKkx-)

---
---

## 1. Executive Summary & Problem Statement

### The Problem
Fire safety in human spacecraft is fundamentally challenging because **combustion behaves drastically differently in microgravity ($\mu\text{g}$) than it does on Earth ($1\text{ g}$)**. Without natural buoyant convection:
- Hot combustion products do not rise, dramatically altering flame spread geometries, radiative quenching dynamics, and low-speed blowoff limits.
- Fresh pyrolysis smoke particles remain trapped in sub-micron sizes without buoyant agglomeration, rendering traditional commercial ionization and optical scatter detectors prone to delayed detection or false alarms.
- Oxygen transport is dominated by forced ventilation, creating localized flammability hazards that differ between small glovebox ducts and full-scale spacecraft cabins.

Over decades of Space Shuttle and International Space Station (ISS) missions, NASA has conducted groundbreaking combustion research (e.g., **BASS-II**, **SAME-R**, **SAFFIRE**, **FLEX**, **SPICE**). However, these findings are **scattered across fragmented spreadsheets, non-standardized tabular logs, calibration sheets, and disparate technical publications (NASA-TM, AIAA)**. Researchers and flight safety engineers struggle to compare results across experimental geometries, verify environmental boundary conditions, detect critical knowledge gaps, and translate historical microgravity science into actionable spacecraft safety decisions for Artemis and Mars exploration.

### The Solution: FIRELINE
**FIRELINE** is an integrated scientific intelligence engine that unifies NASA microgravity combustion research into a cohesive decision-support platform. Rather than acting as a generic summarization chatbot, FIRELINE serves as a **traceable, evidence-based scientific platform** built on real experimental data from the **NASA Physical Sciences Informatics (PSI)** repository and the **NASA Technical Reports Server (NTRS)**.

```mermaid
flowchart TD
    subgraph NASA_Data ["NASA Research Ingestion Layer"]
        BASS["BASS-II (PSI-25)"]
        SAMER["SAME-R (PSI-101)"]
        SAFFIRE["SAFFIRE (PSI-98)"]
        FLEX["FLEX (PSI-69)"]
        SPICE["SPICE (PSI-107)"]
    end

    subgraph Core_Storage ["Unified Scientific Data Layer"]
        DB[("Supabase PostgreSQL\n1,077 Runs • 6,287 Measurements\n18 Sources • 662 Chunks")]
    end

    subgraph Analytical_Pillars ["Quad-Engine Scientific Architecture"]
        M1["Module 1: FIRELINE\nCombustion Evidence & LOC Engine"]
        M2["Module 2: TESTMATCH\nFlight-to-1g Regime Comparability (S, C)"]
        M3["Module 3: SMOKEwise\nSmoke Aerosols & Sensor Dynamics"]
        M4["Module 4: SMOKEVISION\nPlume Kinematics & Accumulation CV"]
    end

    subgraph Intelligence_Layer ["AI & Interface Layer"]
        SQLAgent["LangChain Conversational SQL Agent\n(Gemini 2.5 Flash + Supabase)"]
        VoiceAI["Voice AI CapCom Assistant\n(Hands-Free STT + TTS + Waveform)"]
        HUD["Mission-Control Aerospace HUD\n(Telemetry Ticker • Holographic Pass)"]
    end

    NASA_Data --> Core_Storage
    Core_Storage --> Analytical_Pillars
    Analytical_Pillars --> Intelligence_Layer
```

---

## 2. Quad-Capability Module Architecture

FIRELINE integrates four core scientific capabilities solving distinct facets of spacecraft fire protection:

### Module 1: FIRELINE — Evidence Intelligence & Flammability Limits
- **Combustion & Suppression Analysis**: Investigates solid-fuel flame spread, limiting oxygen concentration (LOC) flammability thresholds, radiative quenching, and gaseous extinguishment ($\text{CO}_2$, $\text{He}$, $\text{SF}_6$).
- **Integrated Investigations**: Aggregates records from `BASS-II` (solid PMMA/fabrics), `SAFFIRE` (large-scale vehicle fire tests), and `FLEX` (liquid droplet burning).
- **Ranked Evidence Retrieval**: Full-text search across 662 ingested technical report chunks (`ts_rank` / `websearch_to_tsquery`) with exact inline page and row citations.

### Module 2: TESTMATCH — Flight-vs-Ground Regime Comparability & Combustion Simulation
- **Mathematical Comparability Framework**: Evaluates pairwise experiment comparability using deterministic weighted similarity:
  $$S = 100 \times \frac{\sum w_i m_i s_i}{\sum w_i m_i}$$
  and data parameter coverage:
  $$C = 100 \times \frac{\sum w_i m_i}{\sum w_i}$$
  across 9 experimental parameters: gravity regime, material, geometry, flow regime, scale dimension, $\text{O}_2\%$, airflow ($\text{cm/s}$), pressure ($\text{kPa}$), and thickness ($\text{mm}$).
- **Interactive 2D Canvas Combustion Simulation (`CombustionChamberCanvas`)**:
  - Physics-driven real-time canvas simulating microgravity vs Earth 1g flame geometries.
  - Toggles between spherical microgravity flame structure (diffusion-dominated, soot shell formation) and buoyant Earth tear-drop plumes.
  - Interactive parameter modulation: airflow velocity slider ($0\text{--}25\,\text{cm/s}$), oxygen concentration ($15\text{--}30\%\,\text{O}_2$), and ambient pressure.
  - Dynamic vector fields rendering convective airflow streamlines and thermal dissipation gradients.
  - **Dual-Burn Split-Screen Comparison**: Synchronized side-by-side combustion chambers enabling simultaneous flight-versus-ground visual verification.
- **Automated Scientific Warning Guards**:
  - **Scale Divergence Alert (`BASS-II` vs. `SAFFIRE`)**: Proactively flags that small glovebox ducts ($1\text{--}2\text{ cm}$) exhibit up to an order-of-magnitude difference in radiative preheating and concurrent flame spread compared to full Cygnus spacecraft panels ($0.4\text{ m} \times 0.94\text{ m}$).
  - **Cross-Domain Separation**: Prevents inappropriate comparisons between non-interchangeable domains (solid flame spread vs. liquid droplet extinction vs. smoke aerosol pyrolysis).
  - **Sensor Quality Flags**: Automatically detects and alerts on sensor anomalies (such as negative baseline drift or saturated over-range CO sensors).

### Module 3: SMOKEwise — Smoke Aerosol Dynamics & Detector Suitability
- **Particle Sizing Trajectories**: Analyzes microgravity smoke aerosol growth across 5 critical spacecraft materials: Kapton wire insulation, Teflon, Silicone, Lampwick, and Pyrell.
- **Coagulation Kinetics**: Computes mass-mean diameter ($d_{mm}$) and geometric mean diameter ($d_g$) trajectories across aging states ($11\text{--}1800\text{ s}$) and flow conditions (quiescent $0\text{ cm/s}$ vs. forced draft $1\text{--}8\text{ cm/s}$).
- **Detector Technology Benchmarking**:
  - **ISS Near-IR Scattering ($>1000\text{ nm}$)**: Fresh Kapton/Teflon pyrolysis produces sub-$100\text{ nm}$ particles that evade near-IR detection until $>700\text{ s}$ of coagulation aging.
  - **Shuttle Ionization Detectors**: Highly sensitive to sub-micron particles, but prone to false alarms caused by cabin humidity and dust particles.
  - **Two-Moment MPASS Prototype**: Combines number concentration (0th/1st moment) with optical mass (2nd/3rd moment), cutting response variance by $>2\times$ and discriminating true smoke from background dust.
- **Scientific Segregation**: Flaming soot point records (`SPICE`) are strictly segregated from pyrolysis smoke records (`SAME-R`).

### Module 4: SMOKEVISION — Smoke Plume Kinematics, Accumulation & Real-Time Surveillance Engine
- **Smoke-Region Segmentation & Cloud Boundary Detection**: Extracts continuous closed plume contours, convex hulls, and perimeter node coordinates against microgravity chamber backgrounds.
- **Plume Expansion Kinematics**: Computes temporal expansion rate $dA/dt$ ($\text{cm}^2/\text{s}$), centroid drift velocity $\vec{v}_c$, and radial dispersion symmetry.
- **Calibrated Smoke Density Estimation (Beer-Lambert Optics)**:
  - Enforces the physical principle: **Image brightness is not smoke concentration** (forward scattering alters perceived brightness).
  - Evaluates transmittance $T = I / I_0 = \exp(-\tau)$ and computes optical depth:
    $$\tau(x, y, t) = -\ln\left(\frac{I(x, y, t)}{I_0(x, y)}\right) = k_{ext} \cdot L \cdot C_s(x, y, t)$$
    referencing pre-ignition baseline frames ($I_0$) with material-specific mass extinction coefficients ($k_{ext}$).
- **Transmission Electron Microscopy (TEM / SEM) Sizing Engine**:
  - Automated particle morphology analysis on NASA SAME-R thermophoretic soot grids.
  - Extracts Count Mean Diameter (CMD), Mass Mean Diameter ($d_{mm}$), lognormal geometric mean ($d_g$), and geometric standard deviation ($\sigma_g$).
  - Particle Size Distribution (PSD) histograms classifying primary spherules vs fractal chain agglomerates.
- **Dense Optical Flow & Dispersion Vector Fields**: Quiver arrow overlays showing ventilation-driven convective transport versus quiescent diffusion.
- **★ Smoke Accumulation Mapping (Temporal Dwell Tensor)**:
  - Integrates smoke masks across time:
    $$A(x, y) = \frac{1}{T} \sum_{t=1}^T M(x, y, t) \cdot \tau(x, y, t)$$
  - Detects recirculating eddies and air stagnation pockets where microgravity traps smoke without buoyant dispersal.
  - Outputs **Stagnation Severity Scores (0–100)** and generates actionable **Spacecraft Smoke Detector Placement Advisories** for ISS, Orion, and Lunar Gateway cabins.
- **Real-Time Video Surveillance & Ingestion Engine**:
  - Ingests video streams (`.mp4`, `.webm`, `.avi`, `.mov`) from laboratory cameras, drop towers, and spacecraft cabin feeds.
  - **Dynamic Baseline Lock ($I_0$)**: Automatically extracts ambient background reference from pre-ignition frames.
  - **Autonomous Flight Safety Threat Classifier**:
    - `CLEAR`: Nominal cabin environment.
    - `ADVISORY: SMOLDERING TRACE`: Early slow-growth pyrolysis ($dA/dt < 4\,\text{cm}^2/\text{s}$).
    - `WARNING: ACTIVE PLUME GROWTH`: Propagating flame wake ($dA/dt > 4\,\text{cm}^2/\text{s}$).
    - `CRITICAL FIRE / ACCUMULATION`: Severe expansion ($dA/dt > 12\,\text{cm}^2/\text{s}$) or heavy ventilation recirculation ($>65\%$).
  - **Flight Controller CapCom Event Log**: Live chronological console logging detection milestones with millisecond precision.
  - **Dual-Mode Video Player**: Seamlessly toggles between **CV Augmented Inspection (Zero-codec canvas player)** and native HTML5 `<video>`.
  - **Pre-Staged NASA Demo Video**: Bundled with microgravity smoke footage for instant 1-click execution.
- **Cross-Experiment Benchmarking**: Synchronized side-by-side comparison across SAME-R Run 101 ($0\text{ cm/s}$ quiescent), SAME-R Run 104 ($2\text{ cm/s}$ duct), BASS-II Run 25 ($5\text{ cm/s}$ glovebox flow), and SAFFIRE-I ($20\text{ cm/s}$ Cygnus vehicle).

---

## 3. Advanced AI Capabilities

### LangChain Conversational SQL Agent (`POST /api/v1/agent/query`)
- **Direct Database Reasoning**: Connects to the live Supabase PostgreSQL database using `SQLDatabase.from_uri` via SQLAlchemy.
- **Deterministic Translation**: Uses Google Gemini (`gemini-2.5-flash`, temperature 0.0) with LangChain's `create_sql_agent` and `SQLDatabaseToolkit` to translate natural language research questions into valid, read-only SQL queries.
- **Read-Only Scope Protection**: Strictly restricted to:
  ```python
  include_tables=["investigations", "sources", "test_runs", "measurements", "findings"]
  ```
- **Intermediate Step Transparency**: Returns the full reasoning chain, inspected schema, generated SQL query, and execution output.
- **Quota & Network Resilience**: Features a deterministic SQL fallback that runs live queries against Supabase even if the external LLM hits rate limits (429).

### Hands-Free Voice AI CapCom Assistant
- **Hands-Free Speech-to-Text (STT)**: Built on the native W3C Web Speech API (`webkitSpeechRecognition`) for zero-latency, local speech recognition without third-party audio API keys.
- **Aerospace Text-to-Speech (TTS) Normalization**: A dedicated speech cleaner converts complex scientific text and LaTeX equations into natural spoken English for NASA CapCom audio:
  - $\text{CO}_2 \rightarrow$ *"carbon dioxide"*
  - $\mu\text{g} \rightarrow$ *"microgravity"*
  - $d_{mm} \rightarrow$ *"mass median diameter"*
  - Strips citation tags and markdown delimiters for smooth audio playback.
- **Live Audio Frequency Waveform Visualizer**: Renders dynamic animated frequency bars that pulse in alert-amber during speech input and glow in cyber-cyan during CapCom transmission.
- **One-Click Astronaut Voice Commands**: Pre-programmed scientific flight inquiries with automated speech dispatch and audio response readout.
- **On-Demand Message Audio Replay**: Dedicated `Voice` / `Stop` buttons on every assistant message bubble.

### Grounded Gemini 2.5 Flash RAG Engine
- **Mandatory Scientific Certainty Labels**: Every statement generated by the RAG synthesizer is labeled with one of:
  - `[NASA observation]`
  - `[Calculated result]`
  - `[AI interpretation]`
  - `[Research implication]`
  - `[Unknown]`
- **Partial-Gravity Guardrails**: Prohibits extrapolating microgravity (ISS LEO) or $1\text{ g}$ ground data to Lunar ($1/6\text{ g}$) or Martian ($3/8\text{ g}$) environments without explicit qualification of the experimental gap.
- **Traceable Inline Citations**: Every finding includes exact inline citations (e.g., `[PSI-25 / NASA-TM-20210011385, p. 75]`).

---

## 4. Mission-Control Aerospace GUI (v2.0)

The user interface delivers a mission-control intelligence console designed for aerospace researchers:
- **Orbital Telemetry HUD Ticker**: Positioned directly beneath the header, streaming live mission telemetry, quad-engine statuses (`ENGINES: FLAME • MATCH • SMOKE • VISION`), active gravity regime (`ISS LEO μg`), and partial-gravity guardrail alerts.
- **Grouped Flight Navigation Rail**: Sectioned into `MISSION CONTROL`, `QUAD-CAPABILITY SUITE [μg]`, `INTELLIGENCE & SYNTHESIS`, and `SECURITY & ACCESS`, featuring active laser indicators, module badges (`M1`, `M2`, `M3`, `M4`, `LIVE RAG`, `ID PASS`), and smooth collapse-to-rail toggle.
- **Real-Time Video Surveillance HUD (`/smokevision`)**: Live video playback synchronized with OpenCV computer vision inference, displaying live boundary contours, centroid crosshair reticles, optical depth heatmaps, CapCom chronological event logs, and spatial accumulation dead-zone overlays.
- **Dual-Burn 2D Combustion Chamber Canvas (`/testmatch`)**: Real-time canvas rendering spherical microgravity vs buoyant Earth flame dynamics, thermal gradients, and airflow vectors in a synchronized side-by-side split screen.
- **Interactive Holographic Researcher Pass (`/auth`)**: Live digital badge preview rendering dynamic researcher initials, institutional affiliation (NASA GRC, Ames, ESA, JAXA, MIT, Stanford, DLR), clearance tier, token identifier, and security barcode in real time.
- **Dark Glassmorphic HUD Panels**: High-contrast dark space backgrounds (`#0B1D36` / `#10243D`) with hover lifts, animated glow borders (`hud-panel-flame`, `hud-panel-smoke`), and radar sweeps.

---

## 5. Live Ingested NASA Datasets

The platform connects to live Supabase PostgreSQL containing **5 NASA investigations**, **18 primary sources**, **1,077 test runs**, **6,287 normalized measurements**, **8 curated findings**, and **662 indexed evidence chunks**:

| Investigation | PSI ID | Phenomenon / Facility | Scale & Materials | Ingested Metrics |
| :--- | :--- | :--- | :--- | :--- |
| **BASS-II** | `PSI-25` | Solid-fuel flame spread in ISS Microgravity Science Glovebox (MSG) | Small-scale ($1\text{--}2\text{ cm}$ ducts): PMMA, SIBAL fabric, Nomex, Cotton | 176 test runs, 1,300 measurements, 258 evidence chunks (`NASA/TM-20210011385`, Fan Calibration data) |
| **SAME-R** | `PSI-101` | Smoke aerosol generation, particle sizing & aging in microgravity | Pyrolysis of Kapton, Silicone, Teflon, Pyrell, Lampwick ($11\text{--}1800\text{ s}$ aging) | 140 test runs, 761 measurements, 215 evidence chunks (`SAMER Final Report`, `AIAA 2012-3536`) |
| **SAFFIRE-I / II** | `PSI-98` / `PSI-99` | Large-scale practical spacecraft fire tests in Cygnus resupply vehicles | Full-scale vehicle ($0.4\text{ m} \times 0.94\text{ m}$): SIBAL, PMMA, Silicone, Nomex | 19 test runs, 53 measurements, 25 evidence chunks (`NTRS 20170000230`) |
| **FLEX / FLEX-2** | `PSI-69` | Isolated microgravity liquid droplet combustion & gaseous suppression | Liquid droplet combustion: Methanol, Heptane, Decane, gaseous suppressants ($\text{CO}_2$, $\text{He}$, $\text{SF}_6$) | 273 test runs, 2,346 measurements, 164 evidence chunks (`NASA/TP-2015-216046`) |
| **SPICE** | `PSI-107` | Microgravity laminar co-flow smoke point & soot emissions | Gaseous fuels: Ethylene, Propane, Methane in quiescent/co-flow microgravity | 469 test runs, 1,827 measurements (kept strictly segregated from pyrolysis smoke) |

---

## 6. Project Architecture

```text
Astro_Sapien/
│
├── backend/                       # FastAPI + Supabase PostgreSQL backend
│   ├── app/
│   │   ├── ai/
│   │   │   ├── gemini_rag.py      # Grounded Gemini 2.5 Flash RAG with scientific guardrails
│   │   │   └── langchain_agent.py # LangChain Conversational SQL Agent over Supabase
│   │   ├── core/config.py         # Database and Gemini environment settings
│   │   ├── database/              # Supabase PostgreSQL schema, indexes & connection
│   │   ├── engines/               # Four deterministic analytical engines
│   │   │   ├── fireline_engine.py # Combustion & suppression evidence analysis + FTS
│   │   │   ├── testmatch_engine.py# Deterministic comparability formula & scale divergence rules
│   │   │   ├── smokewise_engine.py# Smoke aerosol particle aging & detector implications
│   │   │   └── smokevision_engine.py# OpenCV/NumPy microgravity plume CV & accumulation mapping
│   │   ├── ingestion/             # Multi-investigation parsers (BASS-II, SAME-R, SAFFIRE, FLEX, SPICE)
│   │   └── main.py                # FastAPI REST API surface with CORS & video ingestion
│   ├── data/                      # Raw and processed NASA records
│   ├── tests/
│   │   ├── test_backend.py        # Automated test suite (100% pass rate)
│   │   └── test_smokevision.py    # SMOKEVISION CV, video & accumulation test suite
│   ├── pytest.ini                 # Pytest configuration
│   └── requirements.txt           # Python dependencies (OpenCV, SciPy, LangChain, FastAPI)
│
├── frontend/                      # React 18 + TypeScript + Vite frontend
│   ├── public/
│   │   ├── demo_microgravity_smoke.mp4  # Pre-staged NASA-style microgravity smoke video
│   │   └── demo_microgravity_smoke.webm # High-compatibility WebM video
│   ├── src/
│   │   ├── components/            # Reusable aerospace HUD UI library
│   │   │   ├── common/            # CombustionChamberCanvas, VoiceWaveformVisualizer, KPIStatCard
│   │   │   └── layout/            # AppShell (Telemetry Ticker), Sidebar (Laser Rail), Header
│   │   ├── context/               # AuthContext (JWT & profiles), ResearchDataContext
│   │   ├── data/                  # ApiResearchDataProvider & MockResearchDataProvider
│   │   ├── pages/                 # Overview, Explorer, FIRELINE, TESTMATCH, SMOKewise, SMOKEVISION, Assistant, Auth
│   │   └── services/              # smokeVisionService.ts, voiceAssistant.ts, aiAssistantService.ts
│   ├── package.json               # Frontend dependencies & scripts
│   ├── vite.config.ts             # Vite bundle splitting & path aliases
│   ├── tailwind.config.js         # Aerospace theme configuration
│   └── tsconfig.json              # TypeScript configuration
│
├── shared/schemas/                # Canonical JSON Schemas
├── openapi.json                   # Exported OpenAPI 3.1 specification
└── README.md
```

---

## 7. Getting Started

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
   DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

5. Run the automated pytest suite:
   ```bash
   python -m pytest tests/test_backend.py -v
   ```
   *(Expected result: 13/13 passed).*

6. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - API Base URL: `http://127.0.0.1:8000`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
   - Health Check: `http://127.0.0.1:8000/health`

---

### Frontend Setup & Execution

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Run typecheck and unit tests:
   ```bash
   npm run typecheck
   npm test
   ```
   *(Expected result: 0 TypeScript errors, 16/16 Vitest tests passed).*

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   - Accessible at `http://localhost:5173`

4. Production build:
   ```bash
   npm run build
   ```

---

## 8. Complete FastAPI REST API Surface

The complete OpenAPI 3.1 specification is maintained in [`openapi.json`](./openapi.json):

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Live database health and table counts |
| `GET` | `/api/v1/manifest` | Database manifest, active modules, record counts & provenance notice |
| `GET` | `/api/v1/investigations` | List all 5 investigations with run counts |
| `GET` | `/api/v1/investigations/{id}` | Detailed investigation metadata, sources & findings |
| `GET` | `/api/v1/tests` / `/api/v1/test-runs` | Query runs filtered by investigation, material, geometry, flow |
| `GET` | `/api/v1/tests/{test_id}` | Test run details with measurements and provenance |
| `GET` | `/api/v1/measurements` | Query measurement records by run ID, parameter code, and limit |
| `GET` | `/api/v1/findings` | Curated scientific findings categorized by pillar and module |
| `GET` | `/api/v1/sources` | Complete authoritative source catalogue with DOI and URL links |
| `GET` | `/api/v1/sources/{source_id}` | Source metadata, report citation, and document details |
| `GET` | `/api/v1/evidence-chunks` | Ingested PDF/report evidence chunks with page numbers and sections |
| `GET` | `/api/v1/evidence/search` | Ranked full-text search across indexed evidence chunks |
| `GET` | `/api/v1/comparisons` | Baseline cross-experiment comparability evaluations |
| `GET` | `/api/v1/reports` | Default integrated scientific research reports |
| `POST` | `/api/v1/fireline/analyze` | Combustion evidence analysis, extinction modes, and O2 limits |
| `POST` | `/api/v1/testmatch/compare` | Deterministic pairwise comparability ($S$, $C$) & warnings |
| `POST` | `/api/v1/smokewise/analyze` | Smoke aerosol size distribution and detector implications |
| `GET` | `/api/v1/smokevision/presets` | Available microgravity experiment sequences (SAME-R, BASS-II, SAFFIRE) |
| `GET` | `/api/v1/smokevision/sequence` | Multi-frame plume kinematic sequences, flow vectors, and accumulation heatmaps |
| `GET` | `/api/v1/smokevision/microscopy` | Transmission Electron Microscopy (TEM) particle morphology and PSD histograms |
| `GET` | `/api/v1/smokevision/compare` | Cross-experiment microgravity smoke dynamics comparison matrix |
| `POST` | `/api/v1/smokevision/analyze-video` | Ingest video file (.mp4, .webm) and return real-time surveillance analytics |
| `GET` | `/api/v1/smokevision/demo-video-analysis` | 1-click execution on pre-staged NASA-style microgravity smoke video |
| `POST` | `/api/v1/assistant/query` | Grounded Gemini RAG research query synthesizer |
| `POST` | `/api/v1/agent/query` | **LangChain Conversational SQL Agent over Supabase PostgreSQL** |
| `POST` | `/api/v1/auth/signup` | Register new researcher profile with organization and role |
| `POST` | `/api/v1/auth/login` | Authenticate researcher and issue bearer access token |
| `GET` | `/api/v1/auth/me` | Fetch active researcher credential profile |
| `POST` | `/api/v1/reports/generate` | Multi-pillar integrated research report generator |

---

## 9. Quality Assurance & Scientific Integrity

- **Automated Backend Tests (`pytest -v`)**: 18/18 passed across all investigations, FTS search, TESTMATCH comparisons, SMOKewise aggregations, SMOKEVISION plume kinematics, TEM particle sizing, video surveillance ingestion, authentication endpoints, Gemini RAG, and LangChain SQL agent.
- **Automated Frontend Tests (`vitest`)**: 16/16 passed across data providers, TESTMATCH scoring engine, and Voice AI speech normalization.
- **TypeScript Type Safety**: `npm run typecheck` passed (0 TypeScript errors with strict typing).
- **Zero-Imputation Policy**: Missing experimental parameters are strictly preserved as `null` or `not_available` to prevent false equivalence conclusions.
- **Scientific Honesty**: Explicit partial-gravity notices, physical calibration guards ($\tau = -\ln(I/I_0)$), and domain separation rules enforce that microgravity glovebox or Cygnus results are never conflated with Lunar ($1/6\text{ g}$) or Martian ($3/8\text{ g}$) environments without documented caveats.

---

## 10. License & Attribution

Developed by **Team Astro_Sapien** for NASA Space Apps Challenge 2026.
**Local Event Location:** Islamabad
**Team Members**: Muhammad Taha Nawab, Muhammad Zain Nadeem

Microgravity combustion, detection, and suppression data sourced from the **NASA Physical Sciences Informatics (PSI)** system and the **NASA Technical Reports Server (NTRS)**.
