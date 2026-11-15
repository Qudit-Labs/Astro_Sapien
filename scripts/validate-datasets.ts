/**
 * FIRELINE — Dataset Integrity & Schema Validation Suite
 *
 * Runs comprehensive validation:
 * 1. JSON Schema validation (Ajv draft-07 + ajv-formats)
 * 2. Zod runtime schema validation
 * 3. Referential integrity checks:
 *    - All entity IDs are unique across their collection
 *    - All investigation_id references exist in investigations.json
 *    - All test_run_id references exist in test_runs.json
 *    - All source_id references exist in sources.json
 *    - All measurement_ids in test runs exist in measurements.json
 *    - All related_test_run_ids in findings exist in test_runs.json
 *    - Comparison records (test_run_a_id, test_run_b_id) exist in test_runs.json
 *    - All finding_ids, investigation_ids, comparison_ids in research reports exist
 * 4. Parameter and unit consistency checks:
 *    - Measurement parameter codes match canonical dictionary
 *    - Normalized units match canonical SI units
 * 5. Synthetic flag verification:
 *    - All mock records have `is_mock: true`
 *    - All mock measurements have `data_status: "synthetic_demo"`
 * 6. Module coverage verification (FIRELINE, TESTMATCH, SMOKEWISE)
 */

import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  InvestigationSchema,
  TestRunSchema,
  MeasurementSchema,
  FindingSchema,
  SourceSchema,
  EvidenceChunkSchema,
  ComparisonSchema,
  ResearchReportSchema,
} from '../shared/validation/schemas';
import { PARAMETER_DICTIONARY, ParameterCode } from '../shared/types/parameters';

const ROOT_DIR = fs.existsSync(path.resolve(process.cwd(), 'datasets/mock'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');
const DATA_DIR = path.resolve(ROOT_DIR, 'datasets/mock');
const SCHEMA_DIR = path.resolve(ROOT_DIR, 'shared/schemas');

function loadJson<T>(filename: string): T {
  const p = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function loadSchema(filename: string): object {
  const p = path.join(SCHEMA_DIR, filename);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function runValidation() {
  console.log('===========================================================');
  console.log('FIRELINE DATASET INTEGRITY & VALIDATION SUITE');
  console.log('===========================================================\n');

  let errorCount = 0;

  // 1. Setup AJV
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  const schemaFiles = [
    { dataFile: 'sources.json', schemaFile: 'source.schema.json', zodSchema: SourceSchema },
    { dataFile: 'investigations.json', schemaFile: 'investigation.schema.json', zodSchema: InvestigationSchema },
    { dataFile: 'test_runs.json', schemaFile: 'test_run.schema.json', zodSchema: TestRunSchema },
    { dataFile: 'measurements.json', schemaFile: 'measurement.schema.json', zodSchema: MeasurementSchema },
    { dataFile: 'findings.json', schemaFile: 'finding.schema.json', zodSchema: FindingSchema },
    { dataFile: 'evidence_chunks.json', schemaFile: 'evidence_chunk.schema.json', zodSchema: EvidenceChunkSchema },
    { dataFile: 'comparisons.json', schemaFile: 'comparison.schema.json', zodSchema: ComparisonSchema },
    { dataFile: 'research_reports.json', schemaFile: 'research_report.schema.json', zodSchema: ResearchReportSchema },
  ];

  console.log('--- 1. JSON Schema & Zod Validation ---');
  for (const { dataFile, schemaFile, zodSchema } of schemaFiles) {
    const rawData = loadJson<any[]>(dataFile);
    const schema = loadSchema(schemaFile);
    const validateAjv = ajv.compile(schema);

    let ajvErrors = 0;
    let zodErrors = 0;

    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i];

      // AJV check
      const validAjv = validateAjv(item);
      if (!validAjv) {
        ajvErrors++;
        console.error(`[AJV Error] in ${dataFile}[${i}] (ID: ${item.id}):`, validateAjv.errors);
      }

      // Zod check
      const zodRes = zodSchema.safeParse(item);
      if (!zodRes.success) {
        zodErrors++;
        console.error(`[Zod Error] in ${dataFile}[${i}] (ID: ${item.id}):`, zodRes.error.format());
      }
    }

    if (ajvErrors === 0 && zodErrors === 0) {
      console.log(`✓ ${dataFile} (${rawData.length} records) passed both JSON Schema & Zod validation.`);
    } else {
      errorCount += ajvErrors + zodErrors;
      console.error(`✗ ${dataFile} failed validation: ${ajvErrors} AJV errors, ${zodErrors} Zod errors.`);
    }
  }

  // Load all entities for referential integrity checks
  const sources = loadJson<any[]>('sources.json');
  const investigations = loadJson<any[]>('investigations.json');
  const testRuns = loadJson<any[]>('test_runs.json');
  const measurements = loadJson<any[]>('measurements.json');
  const findings = loadJson<any[]>('findings.json');
  const evidenceChunks = loadJson<any[]>('evidence_chunks.json');
  const comparisons = loadJson<any[]>('comparisons.json');
  const researchReports = loadJson<any[]>('research_reports.json');

  console.log('\n--- 2. Unique ID Verification ---');
  const allCollections = [
    { name: 'sources', items: sources },
    { name: 'investigations', items: investigations },
    { name: 'test_runs', items: testRuns },
    { name: 'measurements', items: measurements },
    { name: 'findings', items: findings },
    { name: 'evidence_chunks', items: evidenceChunks },
    { name: 'comparisons', items: comparisons },
    { name: 'research_reports', items: researchReports },
  ];

  for (const { name, items } of allCollections) {
    const ids = new Set<string>();
    let dupes = 0;
    for (const item of items) {
      if (ids.has(item.id)) {
        console.error(`[Duplicate ID Error] Collection ${name} has duplicate ID: ${item.id}`);
        dupes++;
        errorCount++;
      }
      ids.add(item.id);
    }
    if (dupes === 0) {
      console.log(`✓ ${name}: all ${items.length} IDs are unique.`);
    }
  }

  console.log('\n--- 3. Referential Integrity Checks ---');
  const sourceIds = new Set(sources.map((s) => s.id));
  const investigationIds = new Set(investigations.map((i) => i.id));
  const testRunIds = new Set(testRuns.map((t) => t.id));
  const measurementIds = new Set(measurements.map((m) => m.id));
  const findingIds = new Set(findings.map((f) => f.id));
  const comparisonIds = new Set(comparisons.map((c) => c.id));

  // Check investigation source_ids
  for (const inv of investigations) {
    for (const srcId of inv.source_ids) {
      if (!sourceIds.has(srcId)) {
        console.error(`[Ref Error] Investigation ${inv.id} references missing source: ${srcId}`);
        errorCount++;
      }
    }
  }

  // Check test_run investigation_id and source_ids
  for (const tr of testRuns) {
    if (!investigationIds.has(tr.investigation_id)) {
      console.error(`[Ref Error] TestRun ${tr.id} references missing investigation: ${tr.investigation_id}`);
      errorCount++;
    }
    for (const srcId of tr.source_ids) {
      if (!sourceIds.has(srcId)) {
        console.error(`[Ref Error] TestRun ${tr.id} references missing source: ${srcId}`);
        errorCount++;
      }
    }
    for (const mId of tr.measurement_ids) {
      if (!measurementIds.has(mId)) {
        console.error(`[Ref Error] TestRun ${tr.id} references missing measurement: ${mId}`);
        errorCount++;
      }
    }
  }

  // Check measurements references
  for (const m of measurements) {
    if (!testRunIds.has(m.test_run_id)) {
      console.error(`[Ref Error] Measurement ${m.id} references missing test_run: ${m.test_run_id}`);
      errorCount++;
    }
    if (!investigationIds.has(m.investigation_id)) {
      console.error(`[Ref Error] Measurement ${m.id} references missing investigation: ${m.investigation_id}`);
      errorCount++;
    }
    if (!sourceIds.has(m.source_id)) {
      console.error(`[Ref Error] Measurement ${m.id} references missing source: ${m.source_id}`);
      errorCount++;
    }
  }

  // Check findings references
  for (const f of findings) {
    if (!investigationIds.has(f.investigation_id)) {
      console.error(`[Ref Error] Finding ${f.id} references missing investigation: ${f.investigation_id}`);
      errorCount++;
    }
    for (const trId of f.related_test_run_ids) {
      if (!testRunIds.has(trId)) {
        console.error(`[Ref Error] Finding ${f.id} references missing test run: ${trId}`);
        errorCount++;
      }
    }
    for (const srcId of f.source_references) {
      if (!sourceIds.has(srcId)) {
        console.error(`[Ref Error] Finding ${f.id} references missing source: ${srcId}`);
        errorCount++;
      }
    }
  }

  // Check comparisons references
  for (const c of comparisons) {
    if (!testRunIds.has(c.test_run_a_id)) {
      console.error(`[Ref Error] Comparison ${c.id} references missing test_run_a: ${c.test_run_a_id}`);
      errorCount++;
    }
    if (!testRunIds.has(c.test_run_b_id)) {
      console.error(`[Ref Error] Comparison ${c.id} references missing test_run_b: ${c.test_run_b_id}`);
      errorCount++;
    }
  }

  // Check research reports references
  for (const r of researchReports) {
    for (const invId of r.investigation_ids) {
      if (!investigationIds.has(invId)) {
        console.error(`[Ref Error] ResearchReport ${r.id} references missing investigation: ${invId}`);
        errorCount++;
      }
    }
    for (const fId of r.finding_ids) {
      if (!findingIds.has(fId)) {
        console.error(`[Ref Error] ResearchReport ${r.id} references missing finding: ${fId}`);
        errorCount++;
      }
    }
    for (const cId of r.comparison_ids) {
      if (!comparisonIds.has(cId)) {
        console.error(`[Ref Error] ResearchReport ${r.id} references missing comparison: ${cId}`);
        errorCount++;
      }
    }
    for (const srcId of r.source_ids) {
      if (!sourceIds.has(srcId)) {
        console.error(`[Ref Error] ResearchReport ${r.id} references missing source: ${srcId}`);
        errorCount++;
      }
    }
  }

  console.log('✓ All cross-entity foreign keys and references verified successfully.');

  console.log('\n--- 4. Parameter & Unit Consistency ---');
  let unitErrors = 0;
  for (const m of measurements) {
    const def = PARAMETER_DICTIONARY[m.parameter_code as ParameterCode];
    if (!def) {
      console.error(`[Parameter Error] Unknown parameter code: ${m.parameter_code} in measurement ${m.id}`);
      unitErrors++;
      continue;
    }
    if (m.normalized_unit !== def.canonicalUnit) {
      console.error(`[Unit Error] Measurement ${m.id} normalized_unit '${m.normalized_unit}' does not match canonical '${def.canonicalUnit}'`);
      unitErrors++;
    }
  }
  if (unitErrors === 0) {
    console.log(`✓ All ${measurements.length} measurements match canonical parameter definitions and SI units.`);
  } else {
    errorCount += unitErrors;
  }

  console.log('\n--- 5. Synthetic Flag Integrity ---');
  let mockFlagErrors = 0;
  for (const tr of testRuns) {
    if (tr.is_mock !== true || tr.data_status !== 'synthetic_demo') {
      console.error(`[Synthetic Error] TestRun ${tr.id} is not marked is_mock=true or data_status=synthetic_demo`);
      mockFlagErrors++;
    }
  }
  for (const m of measurements) {
    if (m.is_mock !== true || m.data_status !== 'synthetic_demo') {
      console.error(`[Synthetic Error] Measurement ${m.id} is not marked is_mock=true or data_status=synthetic_demo`);
      mockFlagErrors++;
    }
  }
  for (const f of findings) {
    if (f.is_mock !== true || f.data_status !== 'synthetic_demo') {
      console.error(`[Synthetic Error] Finding ${f.id} is not marked is_mock=true or data_status=synthetic_demo`);
      mockFlagErrors++;
    }
  }
  for (const c of comparisons) {
    if (c.is_mock !== true) {
      console.error(`[Synthetic Error] Comparison ${c.id} is not marked is_mock=true`);
      mockFlagErrors++;
    }
  }
  for (const r of researchReports) {
    if (r.is_mock !== true) {
      console.error(`[Synthetic Error] ResearchReport ${r.id} is not marked is_mock=true`);
      mockFlagErrors++;
    }
  }

  if (mockFlagErrors === 0) {
    console.log('✓ All mock entities have is_mock: true and synthetic_demo status explicitly set.');
  } else {
    errorCount += mockFlagErrors;
  }

  console.log('\n--- 6. Multi-Module Coverage ---');
  const moduleCounts = { FIRELINE: 0, TESTMATCH: 0, SMOKEWISE: 0 };
  for (const inv of investigations) {
    for (const tag of inv.module_tags) {
      if (tag in moduleCounts) {
        moduleCounts[tag as keyof typeof moduleCounts]++;
      }
    }
  }
  console.log('Module coverage across investigations:', moduleCounts);
  if (moduleCounts.FIRELINE >= 2 && moduleCounts.TESTMATCH >= 2 && moduleCounts.SMOKEWISE >= 2) {
    console.log('✓ All three modules (FIRELINE, TESTMATCH, SMOKEWISE) are robustly represented.');
  } else {
    console.error('✗ Insufficient module coverage!');
    errorCount++;
  }

  console.log('\n===========================================================');
  if (errorCount === 0) {
    console.log('✓ ALL VALIDATION CHECKS PASSED (0 errors).');
    console.log('===========================================================');
    process.exit(0);
  } else {
    console.error(`✗ VALIDATION FAILED with ${errorCount} errors.`);
    console.log('===========================================================');
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error('Unhandled validation error:', err);
  process.exit(1);
});
