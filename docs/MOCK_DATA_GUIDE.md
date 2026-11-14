# FIRELINE — Mock Data Guide & Synthetic Demonstration Protocols

## 1. Purpose and Boundaries

During Phase 1, FIRELINE utilizes synthetic mock datasets located in `datasets/mock/` to allow development, unit testing, schema validation, and interactive frontend prototyping without depending on unreleased NASA PSI pipeline scrapers or external network connections.

### Strict Scientific Integrity Rules
1. **Explicit Identification**: Every synthetic record contains `"is_mock": true` and `"data_status": "synthetic_demo"`.
2. **Never Claim NASA Observations**: Real NASA investigation titles, PSI identifiers, and public repository links are included as verified public metadata, but numerical test points and findings must **never** be presented as actual NASA telemetry.
3. **Illustrative Warnings**: Synthetic finding records contain prominent textual disclaimers:
   > `DISCLAIMER: This finding is an illustrative synthetic demonstration for frontend development and does not represent an actual verified NASA observation.`
4. **No Fabricated References**: DOI strings, document filenames, and page ranges are never fabricated; unverified fields are set to `null`.

---

## 2. Mock Dataset Inventory

| Dataset File | Entity | Record Count | Description & Modules Supported |
| :--- | :--- | :--- | :--- |
| `investigations.json` | `Investigation` | **8** | BASS-II, Saffire-I, Saffire-II, Saffire-III, FLEX, SAME-R, SAME, SPICE |
| `test_runs.json` | `TestRun` | **18** | Solid fuels, fabrics, thick PMMA, liquid droplets, overheated wire insulation, gas jet flames |
| `measurements.json` | `Measurement` | **162** | Tidy measurements with raw values and SI normalized counterparts |
| `findings.json` | `Finding` | **22** | Illustrative domain findings across flammability, extinction, and aerosols |
| `sources.json` | `Source` | **12** | Official PSI investigation portals, NTRS reports, and NASA standards |
| `evidence_chunks.json` | `EvidenceChunk` | **12** | RAG document chunks prepared for semantic vector indexing |
| `comparisons.json` | `Comparison` | **9** | TESTMATCH comparative records evaluating parameter deltas & similarity |
| `research_reports.json` | `ResearchReport` | **3** | Integrated cross-module scientific reports |
| `dataset_manifest.json` | `DatasetManifest` | **1** | Top-level metadata, schema versioning, and project-wide synthetic notice |

---

## 3. Supported Physical Regimes in Mock Data

The mock datasets cover key microgravity combustion scenarios:

- **Solid-Fuel Combustion**: Planar thin PMMA sheets and thick acrylic plates in opposed/concurrent flow (BASS-II, Saffire-II).
- **Large-Scale Spacecraft Fire**: 0.4 m × 1.0 m Sibal cotton-fiberglass fabric swatches burned in Cygnus resupply modules under 10–25 cm/s forced flow and depressurized exploration atmospheres (Saffire-I, Saffire-III).
- **Droplet Combustion & Cool Flames**: Isolated spherical n-heptane and methanol droplets exhibiting radiative extinction and secondary cool flame combustion (FLEX).
- **Smoke Aerosols & Particle Growth**: Overheated Teflon and Kapton aerospace wire insulation, smoldering cellulose paper, and silicone elastomeric seals showing zero-g particle coagulation up to 420 nm (SAME, SAME-R).
- **Soot Formation & Quenching**: Coaxial laminar ethylene jet flames analyzing soot volume fraction fields and nitrogen dilution blow-off (SPICE).

---

## 4. Re-generating Mock Datasets

If you modify data models or need additional test records, run the generator script:

```bash
npx tsx scripts/generate-mock-datasets.ts
```

Then re-run the integrity validation suite:

```bash
npm run validate:data
```
