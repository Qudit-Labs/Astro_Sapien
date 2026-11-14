/**
 * FIRELINE — Canonical Scientific Data Contracts
 *
 * Shared TypeScript interfaces and types for FIRELINE, TESTMATCH, and SMOKewise.
 */

import {
  MeasurementRole,
  ParameterCategory,
  ParameterCode,
} from './parameters';

export * from './parameters';

export type ModuleTag = 'FIRELINE' | 'TESTMATCH' | 'SMOKEWISE';

export type FireSafetyPillar =
  | 'prevention'
  | 'detection'
  | 'suppression'
  | 'supporting';

export type GravityRegime =
  | 'microgravity'
  | 'lunar_partial'
  | 'martian_partial'
  | 'earth_normal'
  | 'parabolic_low_g';

export type DataStatus =
  | 'reported'
  | 'approximate'
  | 'range'
  | 'not_reported'
  | 'not_applicable'
  | 'synthetic_demo'
  | 'needs_review'
  | 'unparsed';

export type DataAvailabilityStatus =
  | 'public_metadata_only'
  | 'partial_open_data'
  | 'full_psi_dataset'
  | 'synthetic_preview';

export type EvidenceType =
  | 'observed'
  | 'calculated'
  | 'interpretation'
  | 'research_implication';

export type ConfidenceLabel =
  | 'high'
  | 'moderate'
  | 'preliminary'
  | 'illustrative_synthetic';

export type SourceType =
  | 'psi_investigation'
  | 'ntrs_report'
  | 'scientific_publication'
  | 'nasa_guide'
  | 'historical_case';

export type VerificationStatus =
  | 'verified_public_url'
  | 'metadata_verified'
  | 'pending_ingestion'
  | 'illustrative_reference';

export interface DimensionValue {
  value: number | null;
  unit: string;
  normalized_m: number | null;
}

export interface SampleDimensions {
  length?: DimensionValue | null;
  width?: DimensionValue | null;
  thickness?: DimensionValue | null;
  diameter?: DimensionValue | null;
  notes?: string | null;
}

export interface ExperimentalConditionsSummary {
  oxygen_pct_vol: number | null;
  pressure_kpa: number | null;
  airflow_cm_s: number | null;
  ambient_temp_k: number | null;
  flow_direction: 'concurrent' | 'opposed' | 'quiescent' | 'coaxial_jet' | 'mixed';
  ignition_method: string;
}

/**
 * A. Investigation
 * Represents a NASA Physical Sciences Informatics (PSI) microgravity combustion investigation.
 */
export interface Investigation {
  id: string;
  name: string;
  short_name: string;
  psi_id: string;
  doi: string | null;
  description: string;
  research_objectives: string[];
  research_categories: string[];
  module_tags: ModuleTag[];
  fire_safety_pillar: FireSafetyPillar;
  gravity_regimes: GravityRegime[];
  fuel_types: string[];
  source_ids: string[];
  official_url: string;
  data_availability: DataAvailabilityStatus;
  is_mock_metadata: boolean;
}

/**
 * B. TestRun
 * Represents a single experimental test point or burn configuration within an investigation.
 */
export interface TestRun {
  id: string;
  investigation_id: string;
  test_label: string;
  test_sequence: number | null;
  gravity_regime: GravityRegime;
  fuel_name: string;
  fuel_family: string;
  geometry: 'flat_sheet' | 'thin_fabric' | 'cylindrical_rod' | 'spherical_droplet' | 'wire_insulation' | 'heated_lamp_filament' | 'structured_array';
  sample_dimensions: SampleDimensions;
  experimental_conditions: ExperimentalConditionsSummary;
  outcome_categories: string[];
  measurement_ids: string[];
  source_ids: string[];
  data_status: DataStatus;
  is_mock: boolean;
}

/**
 * C. Measurement
 * Long/tidy format: one record represents one parameter measured or reported under one experimental condition.
 */
export interface Measurement {
  id: string;
  test_run_id: string;
  investigation_id: string;
  parameter_code: ParameterCode;
  parameter_label: string;
  parameter_category: ParameterCategory;
  measurement_role: MeasurementRole;
  raw_value: number | null;
  raw_unit: string;
  normalized_value: number | null;
  normalized_unit: string;
  display_unit: string;
  minimum_value: number | null;
  maximum_value: number | null;
  time_s: number | null;
  sensor: string | null;
  measurement_method: string | null;
  uncertainty: string | null;
  data_status: DataStatus;
  source_id: string;
  source_page: number | null;
  is_mock: boolean;
}

/**
 * D. Finding
 * Structured scientific finding or illustrative domain insight linked to test runs and sources.
 */
export interface Finding {
  id: string;
  investigation_id: string;
  related_test_run_ids: string[];
  title: string;
  finding_text: string;
  summary: string;
  research_category: string;
  module_tags: ModuleTag[];
  evidence_type: EvidenceType;
  confidence_label: ConfidenceLabel;
  limitations: string[];
  source_references: string[];
  data_status: DataStatus;
  is_mock: boolean;
}

/**
 * E. Source
 * Authoritative bibliographic or repository source record.
 */
export interface Source {
  id: string;
  source_type: SourceType;
  title: string;
  organization: string;
  investigation_id: string | null;
  url: string;
  doi: string | null;
  document_filename: string | null;
  version: string | null;
  publication_year: number | null;
  page_start: number | null;
  page_end: number | null;
  source_role: string;
  verification_status: VerificationStatus;
}

/**
 * F. EvidenceChunk
 * Prepared RAG document chunk structure for retrieval-augmented evidence synthesis.
 */
export interface EvidenceChunk {
  id: string;
  source_id: string;
  investigation_id: string;
  text: string;
  page_number: number | null;
  section_title: string;
  chunk_index: number;
  embedding_reference: string | null;
  is_mock: boolean;
}

export interface ParameterDeltaDetail {
  parameter_code: ParameterCode;
  value_a: number | null;
  value_b: number | null;
  unit: string;
  relative_difference_pct: number | null;
  status: 'match' | 'differ' | 'unavailable';
}

/**
 * G. Comparison
 * TESTMATCH structured comparison between two experimental test runs.
 */
export interface Comparison {
  id: string;
  test_run_a_id: string;
  test_run_b_id: string;
  comparison_parameters: ParameterCode[];
  matching_parameters: ParameterCode[];
  differing_parameters: ParameterCode[];
  unavailable_parameters: ParameterCode[];
  weighted_score: number | null;
  data_coverage: number;
  methodology: string;
  limitations: string[];
  parameter_deltas?: ParameterDeltaDetail[];
  is_mock: boolean;
}

export interface AnalyticalResultSection {
  module: ModuleTag;
  heading: string;
  key_metrics_summary: string;
  implications: string[];
}

/**
 * H. ResearchReport
 * Integrated cross-module scientific synthesis report.
 */
export interface ResearchReport {
  id: string;
  title: string;
  research_question: string;
  executive_summary: string;
  investigation_ids: string[];
  finding_ids: string[];
  comparison_ids: string[];
  analytical_results: AnalyticalResultSection[];
  limitations: string[];
  source_ids: string[];
  generated_at: string;
  is_mock: boolean;
}

/**
 * Dataset Manifest Metadata
 */
export interface DatasetManifest {
  dataset_version: string;
  generated_at: string;
  data_mode: 'synthetic_mock' | 'production_nasa';
  disclaimer: string;
  record_counts: {
    investigations: number;
    test_runs: number;
    measurements: number;
    findings: number;
    sources: number;
    evidence_chunks: number;
    comparisons: number;
    research_reports: number;
  };
  supported_modules: ModuleTag[];
  canonical_schema_version: string;
}

/**
 * Query Filter Contracts for ResearchDataProvider
 */
export interface MeasurementFilters {
  investigation_id?: string;
  test_run_id?: string;
  parameter_code?: ParameterCode;
  parameter_category?: ParameterCategory;
  measurement_role?: MeasurementRole;
  data_status?: DataStatus;
}

export interface FindingFilters {
  investigation_id?: string;
  module_tag?: ModuleTag;
  research_category?: string;
  evidence_type?: EvidenceType;
  search_query?: string;
}

export interface TestRunFilters {
  investigation_id?: string;
  gravity_regime?: GravityRegime;
  fuel_family?: string;
  geometry?: TestRun['geometry'];
}
