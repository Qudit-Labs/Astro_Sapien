/**
 * FIRELINE — Runtime Zod Validation Schemas
 *
 * Mirrors the JSON Schema contracts in `shared/schemas/*.schema.json` and TypeScript
 * interfaces in `shared/types/index.ts` for runtime validation in data providers.
 */

import { z } from 'zod';
import { PARAMETER_CODES } from '../types/parameters';

export const ModuleTagSchema = z.enum(['FIRELINE', 'TESTMATCH', 'SMOKEWISE']);

export const FireSafetyPillarSchema = z.enum([
  'prevention',
  'detection',
  'suppression',
  'supporting',
]);

export const GravityRegimeSchema = z.enum([
  'microgravity',
  'lunar_partial',
  'martian_partial',
  'earth_normal',
  'parabolic_low_g',
]);

export const DataStatusSchema = z.enum([
  'reported',
  'approximate',
  'range',
  'not_reported',
  'not_applicable',
  'synthetic_demo',
  'needs_review',
  'unparsed',
]);

export const DataAvailabilityStatusSchema = z.enum([
  'public_metadata_only',
  'partial_open_data',
  'full_psi_dataset',
  'synthetic_preview',
]);

export const ParameterCodeSchema = z.enum(PARAMETER_CODES);

export const ParameterCategorySchema = z.enum([
  'atmospheric_condition',
  'flow_condition',
  'fuel_geometry',
  'flame_dynamics',
  'thermal_output',
  'gas_emissions',
  'smoke_aerosol',
  'soot_properties',
  'detection_response',
]);

export const MeasurementRoleSchema = z.enum(['condition', 'outcome']);

export const EvidenceTypeSchema = z.enum([
  'observed',
  'calculated',
  'interpretation',
  'research_implication',
]);

export const ConfidenceLabelSchema = z.enum([
  'high',
  'moderate',
  'preliminary',
  'illustrative_synthetic',
]);

export const SourceTypeSchema = z.enum([
  'psi_investigation',
  'ntrs_report',
  'scientific_publication',
  'nasa_guide',
  'historical_case',
]);

export const VerificationStatusSchema = z.enum([
  'verified_public_url',
  'metadata_verified',
  'pending_ingestion',
  'illustrative_reference',
]);

export const DimensionValueSchema = z.object({
  value: z.number().nullable(),
  unit: z.string(),
  normalized_m: z.number().nullable(),
});

export const SampleDimensionsSchema = z.object({
  length: DimensionValueSchema.nullable().optional(),
  width: DimensionValueSchema.nullable().optional(),
  thickness: DimensionValueSchema.nullable().optional(),
  diameter: DimensionValueSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const ExperimentalConditionsSummarySchema = z.object({
  oxygen_pct_vol: z.number().nullable(),
  pressure_kpa: z.number().nullable(),
  airflow_cm_s: z.number().nullable(),
  ambient_temp_k: z.number().nullable(),
  flow_direction: z.enum([
    'concurrent',
    'opposed',
    'quiescent',
    'coaxial_jet',
    'mixed',
  ]),
  ignition_method: z.string(),
});

export const InvestigationSchema = z.object({
  id: z.string().regex(/^INV-[A-Z0-9-]+$/),
  name: z.string().min(3),
  short_name: z.string().min(2),
  psi_id: z.string().regex(/^PSI-[0-9]+$/),
  doi: z.string().nullable(),
  description: z.string().min(10),
  research_objectives: z.array(z.string()).min(1),
  research_categories: z.array(z.string()).min(1),
  module_tags: z.array(ModuleTagSchema).min(1),
  fire_safety_pillar: FireSafetyPillarSchema,
  gravity_regimes: z.array(GravityRegimeSchema).min(1),
  fuel_types: z.array(z.string()).min(1),
  source_ids: z.array(z.string().regex(/^SRC-[A-Z0-9-]+$/)).min(1),
  official_url: z.string().url(),
  data_availability: DataAvailabilityStatusSchema,
  is_mock_metadata: z.boolean(),
});

export const TestRunSchema = z.object({
  id: z.string().regex(/^TR-[A-Z0-9-]+$/),
  investigation_id: z.string().regex(/^INV-[A-Z0-9-]+$/),
  test_label: z.string().min(2),
  test_sequence: z.number().int().nullable(),
  gravity_regime: GravityRegimeSchema,
  fuel_name: z.string().min(1),
  fuel_family: z.string().min(1),
  geometry: z.enum([
    'flat_sheet',
    'thin_fabric',
    'cylindrical_rod',
    'spherical_droplet',
    'wire_insulation',
    'heated_lamp_filament',
    'structured_array',
  ]),
  sample_dimensions: SampleDimensionsSchema,
  experimental_conditions: ExperimentalConditionsSummarySchema,
  outcome_categories: z.array(z.string()).min(1),
  measurement_ids: z.array(z.string().regex(/^MEAS-[A-Z0-9-]+$/)).min(1),
  source_ids: z.array(z.string().regex(/^SRC-[A-Z0-9-]+$/)).min(1),
  data_status: DataStatusSchema,
  is_mock: z.boolean(),
});

export const MeasurementSchema = z.object({
  id: z.string().regex(/^MEAS-[A-Z0-9-]+$/),
  test_run_id: z.string().regex(/^TR-[A-Z0-9-]+$/),
  investigation_id: z.string().regex(/^INV-[A-Z0-9-]+$/),
  parameter_code: ParameterCodeSchema,
  parameter_label: z.string().min(2),
  parameter_category: ParameterCategorySchema,
  measurement_role: MeasurementRoleSchema,
  raw_value: z.number().nullable(),
  raw_unit: z.string().min(1),
  normalized_value: z.number().nullable(),
  normalized_unit: z.string().min(1),
  display_unit: z.string().min(1),
  minimum_value: z.number().nullable(),
  maximum_value: z.number().nullable(),
  time_s: z.number().nullable(),
  sensor: z.string().nullable(),
  measurement_method: z.string().nullable(),
  uncertainty: z.string().nullable(),
  data_status: DataStatusSchema,
  source_id: z.string().regex(/^SRC-[A-Z0-9-]+$/),
  source_page: z.number().int().nullable(),
  is_mock: z.boolean(),
});

export const FindingSchema = z.object({
  id: z.string().regex(/^FND-[A-Z0-9-]+$/),
  investigation_id: z.string().regex(/^INV-[A-Z0-9-]+$/),
  related_test_run_ids: z.array(z.string().regex(/^TR-[A-Z0-9-]+$/)).min(1),
  title: z.string().min(5),
  finding_text: z.string().min(20),
  summary: z.string().min(10),
  research_category: z.string().min(2),
  module_tags: z.array(ModuleTagSchema).min(1),
  evidence_type: EvidenceTypeSchema,
  confidence_label: ConfidenceLabelSchema,
  limitations: z.array(z.string()).min(1),
  source_references: z.array(z.string().regex(/^SRC-[A-Z0-9-]+$/)).min(1),
  data_status: DataStatusSchema,
  is_mock: z.boolean(),
});

export const SourceSchema = z.object({
  id: z.string().regex(/^SRC-[A-Z0-9-]+$/),
  source_type: SourceTypeSchema,
  title: z.string().min(3),
  organization: z.string().min(2),
  investigation_id: z.string().regex(/^INV-[A-Z0-9-]+$/).nullable(),
  url: z.string().url(),
  doi: z.string().nullable(),
  document_filename: z.string().nullable(),
  version: z.string().nullable(),
  publication_year: z.number().int().nullable(),
  page_start: z.number().int().nullable(),
  page_end: z.number().int().nullable(),
  source_role: z.string().min(2),
  verification_status: VerificationStatusSchema,
});

export const EvidenceChunkSchema = z.object({
  id: z.string().regex(/^CHK-[A-Z0-9-]+$/),
  source_id: z.string().regex(/^SRC-[A-Z0-9-]+$/),
  investigation_id: z.string().regex(/^INV-[A-Z0-9-]+$/),
  text: z.string().min(20),
  page_number: z.number().int().nullable(),
  section_title: z.string().min(2),
  chunk_index: z.number().int().min(0),
  embedding_reference: z.string().nullable(),
  is_mock: z.boolean(),
});

export const ComparisonSchema = z.object({
  id: z.string().regex(/^CMP-[A-Z0-9-]+$/),
  test_run_a_id: z.string().regex(/^TR-[A-Z0-9-]+$/),
  test_run_b_id: z.string().regex(/^TR-[A-Z0-9-]+$/),
  comparison_parameters: z.array(ParameterCodeSchema).min(1),
  matching_parameters: z.array(ParameterCodeSchema),
  differing_parameters: z.array(ParameterCodeSchema),
  unavailable_parameters: z.array(ParameterCodeSchema),
  weighted_score: z.number().min(0).max(1).nullable(),
  data_coverage: z.number().min(0).max(1),
  methodology: z.string().min(10),
  limitations: z.array(z.string()).min(1),
  parameter_deltas: z
    .array(
      z.object({
        parameter_code: ParameterCodeSchema,
        value_a: z.number().nullable(),
        value_b: z.number().nullable(),
        unit: z.string(),
        relative_difference_pct: z.number().nullable(),
        status: z.enum(['match', 'differ', 'unavailable']),
      })
    )
    .optional(),
  is_mock: z.boolean(),
});

export const ResearchReportSchema = z.object({
  id: z.string().regex(/^RPT-[A-Z0-9-]+$/),
  title: z.string().min(5),
  research_question: z.string().min(10),
  executive_summary: z.string().min(20),
  investigation_ids: z.array(z.string().regex(/^INV-[A-Z0-9-]+$/)).min(1),
  finding_ids: z.array(z.string().regex(/^FND-[A-Z0-9-]+$/)).min(1),
  comparison_ids: z.array(z.string().regex(/^CMP-[A-Z0-9-]+$/)),
  analytical_results: z
    .array(
      z.object({
        module: ModuleTagSchema,
        heading: z.string(),
        key_metrics_summary: z.string(),
        implications: z.array(z.string()),
      })
    )
    .min(1),
  limitations: z.array(z.string()).min(1),
  source_ids: z.array(z.string().regex(/^SRC-[A-Z0-9-]+$/)).min(1),
  generated_at: z.string().datetime(),
  is_mock: z.boolean(),
});
