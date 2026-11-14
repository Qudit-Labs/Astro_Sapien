# FIRELINE — Parameter Dictionary & SI Unit Normalization Standards

## 1. Principles of Unit Standardization

Scientific combustion datasets across historical NASA flight experiments report experimental parameters in diverse engineering units (e.g. `cm/s`, `mm/s`, `kPa`, `psia`, `% vol`, `ppm`, `nm`). 

To allow cross-experiment comparisons in **TESTMATCH** and consistent physical modeling in **FIRELINE** and **SMOKewise**, FIRELINE implements a strict two-tier data representation:

1. **Source Fidelity**: The original reported value and unit (`raw_value`, `raw_unit`) are preserved verbatim.
2. **Deterministic SI Normalization**: Values are converted into canonical SI units (`normalized_value`, `normalized_unit`) using verified physical constants.
3. **No Silent Fallbacks**: Missing or unmeasured parameters must never be replaced with zero (`0`). Missing values remain `null`.
4. **Ambiguity Guard**: If a raw unit cannot be converted deterministically without additional unstated assumptions (e.g. volume % to mass % without knowing molar mass), `normalized_value` is set to `null` and flagged with an explanatory note.

---

## 2. Canonical Parameter Dictionary

| Parameter Code | Canonical SI Unit | Default Display Unit | Category | Measurement Role | Conversion Multiplier / Formula |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `oxygen_concentration` | `mol/mol` | `% vol` | `atmospheric_condition` | `condition` | `% vol` × `0.01` → `mol/mol` |
| `airflow_velocity` | `m/s` | `cm/s` | `flow_condition` | `condition` | `cm/s` × `0.01` → `m/s` |
| `pressure` | `Pa` | `kPa` | `atmospheric_condition` | `condition` | `kPa` × `1000` → `Pa`; `atm` × `101325` → `Pa` |
| `temperature` | `K` | `K` | `atmospheric_condition` | `condition` | `°C` + `273.15` → `K` |
| `fuel_diameter` | `m` | `mm` | `fuel_geometry` | `condition` | `mm` × `0.001` → `m`; `cm` × `0.01` → `m` |
| `fuel_thickness` | `m` | `mm` | `fuel_geometry` | `condition` | `mm` × `0.001` → `m`; `µm` × `1e-6` → `m` |
| `flame_spread_rate` | `m/s` | `mm/s` | `flame_dynamics` | `outcome` | `mm/s` × `0.001` → `m/s`; `cm/s` × `0.01` → `m/s` |
| `burning_duration` | `s` | `s` | `flame_dynamics` | `outcome` | `min` × `60` → `s`; `ms` × `0.001` → `s` |
| `heat_release_rate` | `W` | `W` | `thermal_output` | `outcome` | `kW` × `1000` → `W` |
| `carbon_monoxide_concentration` | `mol/mol` | `ppm` | `gas_emissions` | `outcome` | `ppm` × `1e-6` → `mol/mol` |
| `carbon_dioxide_concentration` | `mol/mol` | `ppm` | `gas_emissions` | `outcome` | `ppm` × `1e-6` → `mol/mol` |
| `particle_diameter` | `m` | `nm` | `smoke_aerosol` | `outcome` | `nm` × `1e-9` → `m`; `µm` × `1e-6` → `m` |
| `particle_number_concentration` | `1/m³` | `1/cm³` | `smoke_aerosol` | `outcome` | `1/cm³` × `1e6` → `1/m³` |
| `particle_mass_concentration` | `kg/m³` | `mg/m³` | `smoke_aerosol` | `outcome` | `mg/m³` × `1e-6` → `kg/m³`; `g/m³` × `1e-3` → `kg/m³` |
| `soot_volume_fraction` | `m³/m³` | `ppm` | `soot_properties` | `outcome` | `ppm` × `1e-6` → `m³/m³` |
| `smoke_aging_time` | `s` | `s` | `smoke_aerosol` | `condition` | `min` × `60` → `s`; `ms` × `0.001` → `s` |
| `detector_response` | `V` | `V` | `detection_response` | `outcome` | `mV` × `0.001` → `V` |

---

## 3. Data Status Classifications

Every measurement and test record carries an explicit `data_status` enum:

- `reported`: Measured directly by NASA instrumentation and verified in official repositories.
- `approximate`: Derived from digitized curves or stated as approximate in literature.
- `range`: Measurement given as a boundary range (e.g. minimum/maximum).
- `not_reported`: Parameter was relevant to the test but omitted in source documentation.
- `not_applicable`: Parameter has no physical relevance (e.g. fuel thickness for spherical droplets).
- `synthetic_demo`: Explicitly marked placeholder record generated for interface development and validation.
- `needs_review`: Flagged during ingestion for manual scientific verification.
- `unparsed`: Raw entry waiting for automated regex/NLP extraction.

---

## 4. Normalization Code Examples

The canonical implementation is located in `shared/types/parameters.ts`:

```typescript
import { normalizeParameterValue } from '@shared/types/parameters';

// Velocity conversion
const vel = normalizeParameterValue('airflow_velocity', 20, 'cm/s');
// => { normalizedValue: 0.20, normalizedUnit: 'm/s', isAmbiguous: false }

// Aerosol size conversion
const part = normalizeParameterValue('particle_diameter', 300, 'nm');
// => { normalizedValue: 3.0e-7, normalizedUnit: 'm', isAmbiguous: false }

// Ambiguity handling
const bad = normalizeParameterValue('airflow_velocity', 15, 'unsupported_units');
// => { normalizedValue: null, normalizedUnit: 'm/s', isAmbiguous: true, note: '...' }
```
