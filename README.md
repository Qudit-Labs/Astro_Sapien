# FIRELINE — Spacecraft Fire-Safety Intelligence Engine

**Astro_Sapien • NASA Space App Challenge**

FIRELINE is an AI-powered Spacecraft Fire-Safety Intelligence Engine that transforms NASA microgravity combustion research (NASA Physical Sciences Informatics – PSI, and NASA Technical Reports Server – NTRS) into searchable, comparable, and explainable scientific evidence.

The platform integrates three analytical modules under one unified data model:
1. **FIRELINE**: Combustion, flame behaviour, material flammability, heat release, and fire-suppression evidence.
2. **TESTMATCH**: Interactive pairwise experiment comparison, condition similarity analysis, data coverage tracking, and limitation reporting.
3. **SMOKewise**: Smoke aerosol particle sizing, coagulation aging, transport, and soot analysis with implications for spacecraft fire detection.

---

## Project Structure

```text
├── datasets/mock/            # Synthetic JSON datasets (8 investigations, 18 runs, 162 measurements, 22 findings)
├── docs/                     # DATA_CONTRACT.md, UNIT_STANDARDS.md, MOCK_DATA_GUIDE.md, API_CONTRACT.md
├── scripts/                  # Mock dataset generator & Ajv/Zod integrity validator
├── shared/                   # Canonical JSON Schemas, TypeScript contracts, SI parameter dictionary & Zod schemas
└── src/
    ├── components/
    │   ├── common/           # Reusable aerospace UI library (KPIStatCard, ChartCard, MeasurementTable, DetailDrawer, etc.)
    │   └── layout/           # AppShell, collapsible Sidebar, Header with global search & theme toggle
    ├── context/              # ThemeContext (dark/light) & ResearchDataContext
    ├── data/                 # ResearchDataProvider interface, MockResearchDataProvider, ApiResearchDataProvider
    ├── pages/                # Overview, Research Explorer, FIRELINE, TESTMATCH, SMOKewise, AI Assistant, Reports, Sources
    └── services/             # TESTMATCH dynamic comparison engine & Mock AI Research Assistant service
```

---

## Installation & Running the Frontend

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Data Integrity Validation
Validates all mock datasets against JSON Schema (`shared/schemas/*.schema.json`) and Zod runtime schemas, plus referential integrity and SI unit consistency:
```bash
npm run validate:data
```

### 3. Run Unit Tests
Executes Vitest unit tests for SI normalization, `MockResearchDataProvider`, and `TESTMATCH` comparison logic:
```bash
npm test
```

### 4. Start the Development Server
```bash
npm run dev
```

### 5. Typecheck & Production Build
```bash
npm run typecheck
npm run build
```

---

## Mock-Data Mode vs. Future API Mode

Configure data mode via `.env` (see `.env.example`):

### Mock-Data Mode (Default)
```env
VITE_DATA_MODE=mock
```
Reads local synthetic JSON datasets from `datasets/mock/` via `MockResearchDataProvider`. All synthetic records are explicitly tagged with `is_mock: true` and `data_status: "synthetic_demo"`, and a global **DEMO MODE – SYNTHETIC NASA-INSPIRED DATA** indicator is displayed.

### Future FastAPI Backend Mode
```env
VITE_DATA_MODE=api
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
Automatically switches to `ApiResearchDataProvider`, fetching live NASA PSI / NTRS records from FastAPI endpoints documented in [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md).
