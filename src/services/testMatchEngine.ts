/**
 * FIRELINE — TESTMATCH Dynamic Comparison Engine
 *
 * Computes structured pairwise comparisons between any two experimental TestRuns
 * using canonical SI-normalized measurements and experimental conditions.
 *
 * Rules:
 * - Missing values are NEVER treated as matching values or replaced with zero.
 * - Prototype comparability score is clearly labeled as a structural heuristic,
 *   NOT a validated scientific equivalence score.
 */

import { Measurement, ParameterCode, TestRun } from '@shared/types/index';

export type VariableComparisonStatus =
  | 'similar'
  | 'different'
  | 'not_available'
  | 'not_comparable';

export interface ComparisonRow {
  key: string;
  label: string;
  category: 'condition' | 'geometry' | 'method' | 'outcome';
  valueA: string;
  valueB: string;
  numericA: number | null;
  numericB: number | null;
  unit: string;
  status: VariableComparisonStatus;
  deltaNote: string;
  weight: number;
}

export interface ComputedTestMatchResult {
  runA: TestRun;
  runB: TestRun;
  rows: ComparisonRow[];
  prototypeComparabilityScore: number | null; // 0..1 or null if insufficient compatible data
  dataCoverage: number; // 0..1 fraction of evaluated variables present in both runs
  mainSimilarities: string[];
  majorDifferences: string[];
  missingInformation: string[];
  limitationReasons: string[];
  comparableResults: string[];
  nonComparableResults: string[];
  isMockDemo: boolean;
}

function formatNumber(val: number | null, unit: string, decimals = 2): string {
  if (val === null || Number.isNaN(val)) return 'Not reported';
  const rounded = Number(val.toFixed(decimals));
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

function getMeas(
  measurements: Measurement[],
  code: ParameterCode
): Measurement | undefined {
  return measurements.find((m) => m.parameter_code === code);
}

function formatSampleDimensions(tr: TestRun): string {
  const d = tr.sample_dimensions;
  const parts: string[] = [];
  if (d.length?.value != null) parts.push(`L: ${d.length.value} ${d.length.unit}`);
  if (d.width?.value != null) parts.push(`W: ${d.width.value} ${d.width.unit}`);
  if (d.thickness?.value != null) parts.push(`T: ${d.thickness.value} ${d.thickness.unit}`);
  if (d.diameter?.value != null) parts.push(`D: ${d.diameter.value} ${d.diameter.unit}`);
  return parts.length > 0 ? parts.join(' × ') : 'Not reported';
}

export function computeTestMatchComparison(
  runA: TestRun,
  runB: TestRun,
  measA: Measurement[],
  measB: Measurement[]
): ComputedTestMatchResult {
  const rows: ComparisonRow[] = [];

  // 1. Gravity regime
  const gravSimilar = runA.gravity_regime === runB.gravity_regime;
  rows.push({
    key: 'gravity_regime',
    label: 'Gravity Conditions',
    category: 'condition',
    valueA: runA.gravity_regime.replace('_', ' '),
    valueB: runB.gravity_regime.replace('_', ' '),
    numericA: null,
    numericB: null,
    unit: '',
    status: gravSimilar ? 'similar' : 'different',
    deltaNote: gravSimilar ? 'Identical gravity regime' : 'Gravity regimes differ',
    weight: 1.5,
  });

  // 2. Oxygen concentration
  const o2A = runA.experimental_conditions.oxygen_pct_vol;
  const o2B = runB.experimental_conditions.oxygen_pct_vol;
  let o2Status: VariableComparisonStatus = 'not_available';
  let o2Note = 'Missing oxygen data in one or both runs';
  if (o2A !== null && o2B !== null) {
    const diff = Math.abs(o2A - o2B);
    o2Status = diff <= 1.0 ? 'similar' : 'different';
    o2Note = diff === 0 ? 'Exact match' : `Δ ${diff.toFixed(1)}% vol`;
  }
  rows.push({
    key: 'oxygen_concentration',
    label: 'Oxygen Concentration',
    category: 'condition',
    valueA: formatNumber(o2A, '% vol', 1),
    valueB: formatNumber(o2B, '% vol', 1),
    numericA: o2A,
    numericB: o2B,
    unit: '% vol',
    status: o2Status,
    deltaNote: o2Note,
    weight: 1.5,
  });

  // 3. Ambient Pressure
  const pA = runA.experimental_conditions.pressure_kpa;
  const pB = runB.experimental_conditions.pressure_kpa;
  let pStatus: VariableComparisonStatus = 'not_available';
  let pNote = 'Missing pressure data';
  if (pA !== null && pB !== null) {
    const diff = Math.abs(pA - pB);
    pStatus = diff <= 2.5 ? 'similar' : 'different';
    pNote = diff === 0 ? 'Exact match' : `Δ ${diff.toFixed(1)} kPa`;
  }
  rows.push({
    key: 'pressure',
    label: 'Ambient Pressure',
    category: 'condition',
    valueA: formatNumber(pA, 'kPa', 1),
    valueB: formatNumber(pB, 'kPa', 1),
    numericA: pA,
    numericB: pB,
    unit: 'kPa',
    status: pStatus,
    deltaNote: pNote,
    weight: 1.2,
  });

  // 4. Airflow Velocity
  const vA = runA.experimental_conditions.airflow_cm_s;
  const vB = runB.experimental_conditions.airflow_cm_s;
  let vStatus: VariableComparisonStatus = 'not_available';
  let vNote = 'Missing airflow velocity';
  if (vA !== null && vB !== null) {
    const maxV = Math.max(vA, vB, 1);
    const relDiff = Math.abs(vA - vB) / maxV;
    vStatus = Math.abs(vA - vB) <= 2.0 || relDiff <= 0.15 ? 'similar' : 'different';
    vNote =
      vA === vB
        ? `Exact match (${runA.experimental_conditions.flow_direction})`
        : `Δ ${Math.abs(vA - vB).toFixed(1)} cm/s`;
  }
  rows.push({
    key: 'airflow_velocity',
    label: 'Airflow Velocity',
    category: 'condition',
    valueA: vA !== null ? `${vA} cm/s (${runA.experimental_conditions.flow_direction})` : 'Not reported',
    valueB: vB !== null ? `${vB} cm/s (${runB.experimental_conditions.flow_direction})` : 'Not reported',
    numericA: vA,
    numericB: vB,
    unit: 'cm/s',
    status: vStatus,
    deltaNote: vNote,
    weight: 1.4,
  });

  // 5. Material / Fuel Family
  const sameFuel = runA.fuel_name.toLowerCase() === runB.fuel_name.toLowerCase();
  const sameFamily = runA.fuel_family.toLowerCase() === runB.fuel_family.toLowerCase();
  rows.push({
    key: 'material',
    label: 'Fuel / Material',
    category: 'geometry',
    valueA: `${runA.fuel_name} (${runA.fuel_family})`,
    valueB: `${runB.fuel_name} (${runB.fuel_family})`,
    numericA: null,
    numericB: null,
    unit: '',
    status: sameFuel || sameFamily ? 'similar' : 'different',
    deltaNote: sameFuel
      ? 'Identical fuel formulation'
      : sameFamily
      ? 'Same fuel chemical family, different formulation'
      : 'Distinct fuel families',
    weight: 1.3,
  });

  // 6. Geometry
  const sameGeom = runA.geometry === runB.geometry;
  rows.push({
    key: 'geometry',
    label: 'Sample Geometry',
    category: 'geometry',
    valueA: runA.geometry.replace('_', ' '),
    valueB: runB.geometry.replace('_', ' '),
    numericA: null,
    numericB: null,
    unit: '',
    status: sameGeom ? 'similar' : 'not_comparable',
    deltaNote: sameGeom
      ? 'Compatible geometric configuration'
      : 'Different physical geometries limit direct thermal-scale equivalence',
    weight: 1.2,
  });

  // 7. Sample Dimensions
  const dimStrA = formatSampleDimensions(runA);
  const dimStrB = formatSampleDimensions(runB);
  let dimStatus: VariableComparisonStatus = 'not_available';
  let dimNote = 'Dimensions missing';
  if (dimStrA !== 'Not reported' && dimStrB !== 'Not reported') {
    if (!sameGeom) {
      dimStatus = 'not_comparable';
      dimNote = 'Dimension axes differ across geometries';
    } else {
      const lenA = runA.sample_dimensions.length?.normalized_m ?? null;
      const lenB = runB.sample_dimensions.length?.normalized_m ?? null;
      const diaA = runA.sample_dimensions.diameter?.normalized_m ?? null;
      const diaB = runB.sample_dimensions.diameter?.normalized_m ?? null;
      if (lenA !== null && lenB !== null) {
        dimStatus = Math.abs(lenA - lenB) / Math.max(lenA, lenB) <= 0.15 ? 'similar' : 'different';
        dimNote = dimStatus === 'similar' ? 'Comparable sample length' : 'Sample scale disparity';
      } else if (diaA !== null && diaB !== null) {
        dimStatus = Math.abs(diaA - diaB) / Math.max(diaA, diaB) <= 0.15 ? 'similar' : 'different';
        dimNote = dimStatus === 'similar' ? 'Comparable diameter' : 'Diameter differs';
      } else {
        dimStatus = dimStrA === dimStrB ? 'similar' : 'different';
        dimNote = 'Dimensional comparison based on reported axes';
      }
    }
  }
  rows.push({
    key: 'sample_dimensions',
    label: 'Sample Dimensions',
    category: 'geometry',
    valueA: dimStrA,
    valueB: dimStrB,
    numericA: null,
    numericB: null,
    unit: 'm (SI)',
    status: dimStatus,
    deltaNote: dimNote,
    weight: 1.0,
  });

  // 8. Ambient Temperature
  const tA = runA.experimental_conditions.ambient_temp_k;
  const tB = runB.experimental_conditions.ambient_temp_k;
  let tStatus: VariableComparisonStatus = 'not_available';
  let tNote = 'Missing ambient temperature';
  if (tA !== null && tB !== null) {
    const diff = Math.abs(tA - tB);
    tStatus = diff <= 5.0 ? 'similar' : 'different';
    tNote = `Δ ${diff.toFixed(1)} K`;
  }
  rows.push({
    key: 'temperature',
    label: 'Ambient Temperature',
    category: 'condition',
    valueA: formatNumber(tA, 'K', 1),
    valueB: formatNumber(tB, 'K', 1),
    numericA: tA,
    numericB: tB,
    unit: 'K',
    status: tStatus,
    deltaNote: tNote,
    weight: 0.8,
  });

  // 9. Measurement Methods
  const methodsA = Array.from(
    new Set(measA.map((m) => m.measurement_method).filter(Boolean))
  ) as string[];
  const methodsB = Array.from(
    new Set(measB.map((m) => m.measurement_method).filter(Boolean))
  ) as string[];
  const sharedMethods = methodsA.filter((m) => methodsB.includes(m));
  rows.push({
    key: 'measurement_methods',
    label: 'Measurement Methods',
    category: 'method',
    valueA: methodsA.length > 0 ? `${methodsA.length} sensor methods` : 'Not reported',
    valueB: methodsB.length > 0 ? `${methodsB.length} sensor methods` : 'Not reported',
    numericA: methodsA.length,
    numericB: methodsB.length,
    unit: '',
    status:
      methodsA.length === 0 || methodsB.length === 0
        ? 'not_available'
        : sharedMethods.length > 0
        ? 'similar'
        : 'different',
    deltaNote:
      sharedMethods.length > 0
        ? `${sharedMethods.length} overlapping instrumentation method(s)`
        : 'Distinct diagnostic instrumentation suites',
    weight: 0.7,
  });

  // Outcomes Comparison (only when both have measurements or clearly show missing/non-comparable)
  const outcomeParams: Array<{ code: ParameterCode; label: string }> = [
    { code: 'flame_spread_rate', label: 'Flame Spread Rate' },
    { code: 'heat_release_rate', label: 'Heat Release Rate' },
    { code: 'burning_duration', label: 'Burning Duration' },
    { code: 'particle_diameter', label: 'Smoke Particle Diameter' },
    { code: 'soot_volume_fraction', label: 'Soot Volume Fraction' },
  ];

  const comparableResults: string[] = [];
  const nonComparableResults: string[] = [];

  for (const op of outcomeParams) {
    const mA = getMeas(measA, op.code);
    const mB = getMeas(measB, op.code);

    if (mA && mB && mA.normalized_value !== null && mB.normalized_value !== null) {
      const valA = mA.raw_value;
      const valB = mB.raw_value;
      const normA = mA.normalized_value;
      const normB = mB.normalized_value;
      const rel = Math.abs(normA - normB) / Math.max(Math.abs(normA), Math.abs(normB), 1e-12);

      const isGeomCompatible = sameGeom || op.code === 'particle_diameter';
      const status: VariableComparisonStatus = !isGeomCompatible
        ? 'not_comparable'
        : rel <= 0.2
        ? 'similar'
        : 'different';

      rows.push({
        key: op.code,
        label: op.label,
        category: 'outcome',
        valueA: `${valA} ${mA.raw_unit}`,
        valueB: `${valB} ${mB.raw_unit}`,
        numericA: normA,
        numericB: normB,
        unit: mA.normalized_unit,
        status,
        deltaNote: !isGeomCompatible
          ? 'Not directly comparable due to incompatible geometries'
          : `SI Δ: ${Math.abs(normA - normB).toExponential(2)} ${mA.normalized_unit}`,
        weight: 0, // Outcome rows do not inflate condition similarity score
      });

      if (isGeomCompatible) {
        comparableResults.push(
          `${op.label}: Run A (${valA} ${mA.raw_unit}) vs Run B (${valB} ${mB.raw_unit})`
        );
      } else {
        nonComparableResults.push(
          `${op.label}: Measured in both runs, but geometry mismatch (${runA.geometry} vs ${runB.geometry}) prevents direct equivalence.`
        );
      }
    } else if (mA || mB) {
      nonComparableResults.push(
        `${op.label}: Only measured in ${mA ? runA.id : runB.id}; missing in counterpart.`
      );
    }
  }

  // Compute data coverage and prototype comparability score over condition/geometry/method rows
  const baseRows = rows.filter((r) => r.weight > 0);
  const availableRows = baseRows.filter(
    (r) => r.status !== 'not_available'
  );
  const dataCoverage = baseRows.length > 0 ? availableRows.length / baseRows.length : 0;

  // Require at least 50% coverage for a prototype score
  let prototypeComparabilityScore: number | null = null;
  if (dataCoverage >= 0.5 && availableRows.length > 0) {
    let totalWeight = 0;
    let earnedWeight = 0;
    for (const r of availableRows) {
      totalWeight += r.weight;
      if (r.status === 'similar') {
        earnedWeight += r.weight;
      } else if (r.status === 'different') {
        earnedWeight += r.weight * 0.2;
      }
      // not_comparable earns 0
    }
    prototypeComparabilityScore = totalWeight > 0 ? Number((earnedWeight / totalWeight).toFixed(2)) : null;
  }

  const mainSimilarities = rows
    .filter((r) => r.status === 'similar')
    .map((r) => `${r.label}: ${r.valueA} matches ${r.valueB} (${r.deltaNote})`);

  const majorDifferences = rows
    .filter((r) => r.status === 'different')
    .map((r) => `${r.label}: ${r.valueA} vs ${r.valueB} (${r.deltaNote})`);

  const missingInformation = rows
    .filter((r) => r.status === 'not_available')
    .map((r) => `${r.label}: Missing in one or both test runs.`);

  const limitationReasons: string[] = [
    'All underlying numerical measurements are synthetic demonstration values (data_status: synthetic_demo).',
  ];
  if (!sameGeom) {
    limitationReasons.push(
      `Geometric mismatch (${runA.geometry.replace('_', ' ')} vs ${runB.geometry.replace('_', ' ')}) alters boundary-layer heat and mass transport.`
    );
  }
  if (!sameFuel) {
    limitationReasons.push(
      `Fuel formulation differs (${runA.fuel_name} vs ${runB.fuel_name}), affecting pyrolysis kinetics and soot yield.`
    );
  }
  if (runA.investigation_id !== runB.investigation_id) {
    limitationReasons.push(
      'Cross-investigation comparison spans different test facilities/enclosures (e.g., ISS MSG/CIR vs Cygnus PCM).'
    );
  }
  if (missingInformation.length > 0) {
    limitationReasons.push(
      `${missingInformation.length} parameter(s) were not reported and were excluded from similarity scoring (never treated as zero).`
    );
  }

  return {
    runA,
    runB,
    rows,
    prototypeComparabilityScore,
    dataCoverage: Number(dataCoverage.toFixed(2)),
    mainSimilarities,
    majorDifferences,
    missingInformation,
    limitationReasons,
    comparableResults,
    nonComparableResults,
    isMockDemo: true,
  };
}
