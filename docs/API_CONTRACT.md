# FIRELINE — FastAPI Backend & Frontend API Contract

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
