# NASA Data Sources & Provenance Manifest

**FIRELINE • Spacecraft Fire-Safety Intelligence Engine**

This document details the NASA microgravity physical sciences datasets and technical literature ingested into the FIRELINE platform. All datasets originate from the **NASA Physical Sciences Informatics (PSI)** repository and the **NASA Technical Reports Server (NTRS)**.

---

## 1. Batch A Datasets

### 1.1 BASS-II (Burning and Suppression of Solids - II)
- **NASA PSI ID**: `PSI-25`
- **DOI**: `10.60555/4qc4-de67`
- **Facility**: Microgravity Science Glovebox (MSG), International Space Station (ISS)
- **Principal Investigators**: Dr. Sandra Olson (NASA GRC), Prof. Paul Ferkul, Prof. James S. T'ien
- **Primary Data Files**:
  - `PSI-25_Experimental table_BASS-II.csv`: 129 flight burns across PMMA slabs, rods, and SIBAL fabric.
  - `Fan calibration data.xlsx`: Calibration matrix mapping fan display voltage to airflow velocity ($0\text{--}50\text{ cm/s}$) across flow restrictors 0, 1, and 2.
  - `BASS-II_ReadMe.docx`: FAQ, instrumentation procedures, and sensor limitations.
  - `NASA/TM-20210011385.pdf`: 144-page comprehensive summary report with Miller's spread rates (p. 57) and T'ien's fabric runs (p. 96).
- **Physical Phenomena**: Low-speed opposed and concurrent flow flame spread, radiative extinction boundaries, low-flow extinction limits ($<2\text{ cm/s}$), and NASA-STD-6001 Test 1 comparability.

### 1.2 SAME-R (Smoke Aerosol Measurement Experiment - Reflight)
- **NASA PSI ID**: `PSI-101`
- **DOI**: `10.60555/2np7-jv14`
- **Facility**: ISS Microgravity Science Glovebox (MSG)
- **Principal Investigator**: Dr. David L. Urban (NASA GRC)
- **Primary Data Files**:
  - `SAME-R_Experimental_Table.csv`: Tabular run matrix.
  - `SAMER_Final 0602 2014.pdf`: 89-page final flight report containing moment-method particle sizing ($M_0$ through $M_6$) and TEM morphology.
  - `AIAA 2012-3536 (20130000422.pdf)`: Peer-reviewed conference paper on particle morphology and size distributions.
  - `SAME_Baseline_Concept_Description.pdf`: Sensor architecture and calibration procedures.
- **Materials**: Kapton wire insulation, Teflon, Silicone, Lampwick cotton, and Pyrell polyurethane foam.
- **Physical Phenomena**: Microgravity smoke aerosol generation, coagulation aging trajectories ($11\text{--}1800\text{ s}$), particle diameter growth ($d_{mm}$ and $d_g$), and detector response limitations (near-IR light scattering vs. ionization vs. two-moment prototype).

---

## 2. Batch B Datasets

### 2.1 SAFFIRE (Spacecraft Fire Safety Demonstration - I & II)
- **NASA PSI ID**: `PSI-98` (Saffire-I) / `PSI-99` (Saffire-II)
- **Facility**: Unmanned Orbital ATK / Northrop Grumman Cygnus Resupply Vehicle
- **Principal Investigator**: Dr. David L. Urban (NASA GRC)
- **Primary Data Files**:
  - `SAFFIRE-I_Experimental_Table.csv`: Large-scale ($0.4\text{ m} \times 0.94\text{ m}$) concurrent flame spread over SIBAL cotton-fiberglass fabric.
  - `SAFFIRE-II_Experimental_Table.csv`: Multi-material flammability tests across Nomex, Silicone, PMMA, and SIBAL.
  - `NTRS 20170000230.pdf`: Saffire spacecraft flight demonstration overview.
- **Physical Phenomena**: Large-scale spacecraft vehicle fire growth, flame propagation speeds, radiometer heat flux, airflow coupling, and scale divergence comparison against small-scale glovebox tests.

### 2.2 FLEX / FLEX-2 (Flame Extinction Experiment)
- **NASA PSI ID**: `PSI-69`
- **Facility**: Multi-User Droplet Combustion Apparatus (MDCA) in CIR, ISS
- **Principal Investigators**: Prof. Forman Williams (UCSD), Prof. Frederick Dryer (Princeton)
- **Primary Data Files**:
  - `FLEX_Experimental_Table.csv`: 273 microgravity droplet combustion runs.
  - `NASA/TP-2015-216046.pdf`: 150-page final results report on droplet extinction and gaseous suppression.
- **Fuels**: Pure and blended liquid hydrocarbons (Methanol, Heptane, Decane).
- **Suppressants**: Gaseous inerting agents ($\text{CO}_2$, $\text{He}$, $\text{SF}_6$, $\text{N}_2$).
- **Physical Phenomena**: Spherically symmetric microgravity droplet burning rates, soot shell formation, radiative extinction diameters, and gaseous suppression concentration limits.

### 2.3 SPICE (Smoke Point In Co-flow Experiment)
- **NASA PSI ID**: `PSI-107`
- **Facility**: ISS Combustion Integrated Rack (CIR)
- **Principal Investigator**: Dr. Peter Sunderland (University of Maryland)
- **Primary Data Files**:
  - `SPICE_Experimental_Table.csv`: 469 laminar co-flow flame soot point test runs.
  - `SPICE_SRD.doc`: Science Requirements Document.
- **Fuels**: Gaseous fuels (Ethylene, Propane, Methane) in laminar co-flow.
- **Physical Phenomena**: Smoke point flame length, soot volume fractions, and non-buoyant smoke emission thresholds (strictly segregated from solid pyrolysis aerosols).

---

## 3. Database Schema Mapping

Every raw data file maps directly into the relational schema (`backend/app/database/schema.py`):

```text
investigations ──< sources ──< evidence_chunks (FTS tsvector / BM25)
      │               │
      └──< test_runs ──< measurements
      │
      └──< findings
```

- `investigations`: Mission overview and research pillars (`prevention`, `detection`, `suppression`).
- `sources`: Source document metadata, DOIs, URLs, and page/row counts.
- `test_runs`: Normalized test runs with material, geometry, flow regime, and dimensions.
- `measurements`: Numerical and categorical observations tagged with SI units and quality flags (`valid`, `suspect`, `over_range`).
- `findings`: Peer-reviewed scientific findings with exact paragraph/table citations.
- `evidence_chunks`: Full-text searchable document chunks indexed with GIN / BM25.
