# FIRELINE â€” FastAPI Backend & Frontend API Contract

## 1. Overview & Switching Instructions

The FIRELINE frontend accesses all scientific data through the `ResearchDataProvider` abstraction defined in `src/data/providers/ResearchDataProvider.ts`.

To switch the application from local mock JSON to the future FastAPI backend:

1. Update `.env` (or copy from `.env.example`):
   ```env
   VITE_DATA_MODE=api
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```
2. Restart the Vite development server (`npm run dev`) or build for production (`npm run build`).
3. The centralized provider factory in `src/data/index.ts` will automatically instantiate `ApiResearchDataProvider` instead of `MockResearchDataProvider`. No component code changes are required.

---

## 2. REST Endpoints Specification (FastAPI Target)

All endpoints return JSON responses conforming to the canonical schemas in `shared/schemas/*.schema.json`.

### Metadata & System
- **`GET /api/v1/manifest`**
  - **Returns**: `DatasetManifest`
  - **Purpose**: Server health, record counts, active ingestion pipeline version, and NASA repository synchronization status.

### Investigations
- **`GET /api/v1/investigations`**
  - **Returns**: `Investigation[]`
- **`GET /api/v1/investigations/{id}`**
  - **Returns**: `Investigation` or 404

### Test Runs
- **`GET /api/v1/test-runs`**
  - **Query Parameters**:
    - `investigation_id?: string`
    - `gravity_regime?: string`
    - `fuel_family?: string`
    - `geometry?: string`
  - **Returns**: `TestRun[]`
- **`GET /api/v1/test-runs/{id}`**
  - **Returns**: `TestRun` or 404
- **`GET /api/v1/investigations/{investigation_id}/test-runs`**
  - **Returns**: `TestRun[]`

### Measurements
- **`GET /api/v1/measurements`**
  - **Query Parameters**:
    - `investigation_id?: string`
    - `test_run_id?: string`
    - `parameter_code?: string`
    - `parameter_category?: string`
    - `measurement_role?: string`
    - `data_status?: string`
  - **Returns**: `Measurement[]`
- **`GET /api/v1/measurements/{id}`**
  - **Returns**: `Measurement` or 404
- **`GET /api/v1/test-runs/{test_run_id}/measurements`**
  - **Returns**: `Measurement[]`

### Findings
- **`GET /api/v1/findings`**
  - **Query Parameters**:
    - `investigation_id?: string`
    - `module_tag?: string`
    - `research_category?: string`
    - `evidence_type?: string`
    - `search_query?: string`
  - **Returns**: `Finding[]`
- **`GET /api/v1/findings/{id}`**
  - **Returns**: `Finding` or 404
- **`GET /api/v1/investigations/{investigation_id}/findings`**
  - **Returns**: `Finding[]`

### Sources & RAG Evidence Chunks
- **`GET /api/v1/sources`**
  - **Returns**: `Source[]`
- **`GET /api/v1/sources/{id}`**
  - **Returns**: `Source` or 404
- **`GET /api/v1/evidence-chunks`**
  - **Query Parameters**:
    - `investigation_id?: string`
  - **Returns**: `EvidenceChunk[]`

### TESTMATCH Comparisons
- **`GET /api/v1/comparisons`**
  - **Returns**: `Comparison[]`
- **`GET /api/v1/comparisons/{id}`**
  - **Returns**: `Comparison` or 404
- **`GET /api/v1/test-runs/{test_run_id}/comparisons`**
  - **Returns**: `Comparison[]`

### Research Reports
- **`GET /api/v1/reports`**
  - **Returns**: `ResearchReport[]`
- **`GET /api/v1/reports/{id}`**
  - **Returns**: `ResearchReport` or 404

---

## 3. Analytics & AI POST Endpoints (Future FastAPI Sprint)

> **IMPORTANT:** These endpoints are **not yet implemented**. They are documented here as the contract for the future FastAPI backend sprint. Full TypeScript request/response interfaces are in `src/services/apiContracts.ts`. In mock mode, equivalent functionality is provided locally by `src/services/testMatchEngine.ts` and `src/services/aiAssistantService.ts`.

### FIRELINE Module Analysis
- **`POST /api/v1/fireline/analyze`**
  - **Request body**: `FirelineAnalysisRequest` — `test_run_ids[]`, optional `parameter_codes[]`, optional `gravity_regime`
  - **Returns**: `FirelineAnalysisResult` — per-parameter summaries (min/max/mean/stddev), generated findings, `data_status`

### TESTMATCH Comparison
- **`POST /api/v1/testmatch/compare`**
  - **Request body**: `TestMatchCompareRequest` — `test_run_a_id`, `test_run_b_id`, optional `dimension_codes[]`
  - **Returns**: `TestMatchCompareResult` — `overall_score` (0-1), per-dimension comparison rows, similarities, differences, limitations

### SMOKewise Aerosol Analysis
- **`POST /api/v1/smokewise/analyze`**
  - **Request body**: `SmokewiseAnalysisRequest` — `test_run_ids[]`, optional fuel/gravity/diameter filters
  - **Returns**: `SmokewiseAnalysisResult` — per-fuel aerosol summaries, `scientific_caveats` (particle diameter != detector sensitivity)

### AI Research Assistant
- **`POST /api/v1/assistant/query`**
  - **Request body**: `AssistantQueryRequest` — `question` (1000 chars max), optional `investigation_ids[]`, optional `max_evidence_chunks`
  - **Returns**: `AssistantQueryResult` — `answer`, `citations[]`, `llm_generated` flag, `model_id`, `synthetic_disclaimer`

### Research Report Generator
- **`POST /api/v1/reports/generate`**
  - **Request body**: `ReportGenerateRequest` — `investigation_ids[]`, optional `sections[]`, `format` (json|markdown|pdf), optional `title`
  - **Returns**: `ReportGenerateResult` — `content` (string), `confidence_score`, `data_status`, `synthetic_disclaimer`

### Evidence Search (Semantic / Keyword)
- **`GET /api/v1/evidence/search`**
  - **Query Parameters**: `q` (search query), optional `investigation_id`, optional `source_id`, optional `limit` (default 10, max 50)
  - **Returns**: `EvidenceSearchResult` — `results[]` with `chunk_id`, `relevance_score`, `excerpt`

### Health Check
- **`GET /api/v1/health`**
  - **Returns**: `HealthCheckResult` — `status` (ok|degraded|down), `version`, connectivity booleans, `uptime_seconds`

---

## 4. Frontend -> Backend Integration Checklist

When the FastAPI backend is ready, follow these steps to connect the FIRELINE frontend:

1. Set environment variables in `.env` (never commit this file):
   - `VITE_DATA_MODE=api`
   - `VITE_API_BASE_URL=http://localhost:8000/api/v1`
2. Restart the Vite dev server (`npm run dev`) or rebuild (`npm run build`). The factory in `src/data/index.ts` auto-selects `ApiResearchDataProvider` - no component changes needed.
3. Verify with `GET /api/v1/health` -> expect `status: "ok"`.
4. Run data integrity check: `npm run validate:data`.
5. Enable analytics POST endpoints by calling `provider.analyzeFireline(...)` etc. from module pages once the backend sprint is complete.
6. Ingest real NASA data via `POST /api/v1/ingestion/trigger` with `sources: ["nasa_psi", "ntrs"]`.
