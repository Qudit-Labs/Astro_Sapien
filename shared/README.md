# FIRELINE Shared Schemas & Contracts

**Astro_Sapien • Shared Data Contracts**

This folder defines the canonical data models, JSON Schemas, TypeScript interfaces, and validation rules shared across both the frontend and backend of the FIRELINE platform.

---

## Structure

```text
shared/
├── schemas/                      # Canonical JSON Schemas
│   ├── experiment.schema.json    # Experiment / test run entity schema
│   ├── test_run.schema.json      # Primary test run schema
│   ├── measurement.schema.json   # Physical measurement schema (SI units, quality)
│   ├── finding.schema.json       # Scientific finding schema with citations
│   ├── investigation.schema.json # NASA investigation / mission schema
│   ├── source.schema.json        # Data source and document provenance schema
│   ├── evidence_chunk.schema.json# Searchable text passage chunk schema
│   ├── comparison.schema.json    # TESTMATCH pairwise comparison result schema
│   └── report.schema.json        # Research report output schema
│
├── types/                        # TypeScript type definitions generated from schemas
├── validation/                   # Zod runtime validators and SI parameter dictionaries
└── api-contract.md               # REST API contract specification
```

---

## Usage

- **Backend Ingestion**: Ingested NASA datasets in `backend/app/ingestion/` conform to the parameters and normalization rules specified in `shared/schemas/`.
- **Frontend State**: The React frontend (`frontend/src/`) imports TypeScript types via the `@shared` alias (`@shared/types/...`).
- **Data Integrity Tests**: `scripts/validate-datasets.ts` validates all records against `shared/schemas/*.schema.json` using Ajv and Zod.
