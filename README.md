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

---

## Phase 3 QA Results

Completed as part of the FIRELINE QA, Visual Polish and Backend Integration Readiness phase.

| Check | Result |
|---|---|
| `npm run typecheck` | PASSED - 0 TypeScript errors |
| `npm run validate:data` | PASSED - 0 errors, 6/6 checks |
| `npm test` | PASSED - 18/18 tests (3 test files) |
| `npm run build` | PASSED - production bundle with code splitting |
| Architecture audit | PASSED - single shared schemas, provider pattern, zero direct mock imports in UI |
| Mock data integrity | PASSED - all 246 unique IDs, cross-refs valid, SI units correct |
| Scientific integrity | PASSED - all mock entities tagged is_mock: true + synthetic_demo, synthetic disclaimers on all charts and AI responses |

### Code Splitting Applied (vite.config.ts)
The 919 KB monolithic bundle has been split into vendor chunks:
- `vendor-react` - react, react-dom, react-router-dom
- `vendor-charts` - recharts
- `vendor-lucide` - lucide-react

### Scientific Integrity Improvements
- Smoke Particle Diameter chart now displays explicit warning: `Particle Diameter (nm) != Detector Sensitivity`
- All ChartCard components show DataStatusBadge when isMock=true (default)
- ComparisonScoreCard clearly labels the score as a `Prototype Condition Comparability Indicator`
- AI Assistant responses always include synthetic disclaimer

### Backend Integration Readiness
New files added:
- `src/services/apiContracts.ts` - TypeScript interfaces for all 8 FastAPI endpoint contracts (request/response shapes)
- `ApiResearchDataProvider` extended with 6 new analytics methods: `analyzeFireline`, `compareTestMatch`, `analyzeSmokewise`, `queryAssistant`, `generateReport`, `searchEvidence`
- `ResearchAnalyticsProvider` interface added to `ResearchDataProvider.ts`
- `docs/API_CONTRACT.md` updated with Section 3 (POST analytics endpoints) and Section 4 (integration checklist)

---

## Connecting Real NASA Data

To connect the FIRELINE frontend to a real FastAPI backend ingesting NASA PSI / NTRS data:

1. **Set environment variables** in `.env` (do NOT commit this file):
   `VITE_DATA_MODE=api`
   `VITE_API_BASE_URL=http://localhost:8000/api/v1`
2. **Restart** dev server: `npm run dev` - the provider factory auto-selects ApiResearchDataProvider; no component changes needed.
3. **Verify** backend is healthy: `GET /api/v1/health` should return `status: "ok"`.
4. **Ingest NASA data** via: `POST /api/v1/ingestion/trigger` with `sources: ["nasa_psi", "ntrs"]`.
5. **Validate** data quality: `npm run validate:data` (update script to fetch from API).
6. **Enable** POST analytics by calling the new provider analytics methods from module pages.

Full API contract details: `docs/API_CONTRACT.md`
