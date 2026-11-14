# FIRELINE — Spacecraft Fire-Safety Intelligence Engine

**Astro_Sapien • NASA Space App Challenge**

FIRELINE is a unified scientific research platform that leverages NASA microgravity combustion and fire safety research (NASA Physical Sciences Informatics - PSI, and NASA Technical Reports Server - NTRS) to help researchers understand spacecraft fire safety.

The platform integrates three analytical modules:
1. **FIRELINE**: Combustion & fire-safety evidence intelligence, including material flammability, flame dynamics, ignition, burning duration, and heat release rates.
2. **TESTMATCH**: Experiment comparison, similarity analysis, experimental condition matching, and scientific limitation identification.
3. **SMOKewise**: Smoke aerosol morphology, particle sizing distribution, soot volume fraction, and smoke transport with implications for early spacecraft fire detection.

---

## Shared Data Architecture

All three modules operate on one unified scientific data model:
- **Canonical Schemas**: Located in `shared/schemas/*.schema.json` (JSON Schema draft-07) and `shared/validation/schemas.ts` (Zod runtime validation).
- **TypeScript Contracts**: Located in `shared/types/index.ts` and `shared/types/parameters.ts`.
- **SI Unit Standards**: Strictly normalized into canonical SI units (`mol/mol`, `m/s`, `Pa`, `K`, `m`, `1/m³`, `kg/m³`, `W`, `s`, `V`) while preserving raw reported units.
- **Provider Abstraction**: Decoupled via `ResearchDataProvider` (`src/data/index.ts`), allowing seamless switching between local mock JSON (`MockResearchDataProvider`) and future FastAPI endpoints (`ApiResearchDataProvider`).

---

## Represented NASA Investigations

- **BASS-II** (NASA PSI-25) — Burning and Suppression of Solids - II
- **SAFFIRE-I** (NASA PSI-98) — Spacecraft Fire Safety Demonstration - I
- **SAFFIRE-II** (NASA PSI-99) — Spacecraft Fire Safety Demonstration - II
- **SAFFIRE-III** (NASA PSI-100) — Spacecraft Fire Safety Demonstration - III
- **FLEX** (NASA PSI-69) — Flame Extinction Experiment
- **SAME-R** (NASA PSI-101) — Smoke Aerosol Measurement Experiment - Reflight
- **Original SAME** (NASA PSI-102) — Smoke Aerosol Measurement Experiment
- **SPICE** (NASA PSI-107) — Smoke and Particle Investigation of Coaxial Extinction

> **Notice**: All initial experimental test points, measurements, and illustrative findings are synthetic demonstrations explicitly marked with `"is_mock": true` and `"data_status": "synthetic_demo"`. Official NASA investigation names and links represent verified public metadata.

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run Data Validation Suite
Validates all mock datasets against JSON Schema and Zod definitions, verifies unique IDs, referential integrity, and parameter unit consistency:
```bash
npm run validate:data
```

### 3. Run Unit Tests
Executes unit tests for data providers and unit normalization rules:
```bash
npm test
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## Switching Between Mock & API Data Mode

Configure via `.env`:
```env
# Use local mock JSON datasets
VITE_DATA_MODE=mock

# Or connect to live FastAPI backend
# VITE_DATA_MODE=api
# VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Documentation

- [`docs/DATA_CONTRACT.md`](./docs/DATA_CONTRACT.md): Full entity schema specifications and cross-module relationships.
- [`docs/UNIT_STANDARDS.md`](./docs/UNIT_STANDARDS.md): Parameter dictionary, canonical SI units, and normalization rules.
- [`docs/MOCK_DATA_GUIDE.md`](./docs/MOCK_DATA_GUIDE.md): Mock dataset inventory and synthetic data handling protocols.
- [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md): FastAPI REST endpoint contracts and data provider switching instructions.
