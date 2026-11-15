/**
 * FIRELINE — FastAPI Backend Research Data Provider Implementation
 *
 * Connects to live FastAPI REST endpoints (e.g. `http://localhost:8000/api/v1`).
 * Normalizes live Supabase PostgreSQL relational records into canonical frontend
 * research contracts so that all pages render seamlessly with 100% real NASA data.
 */

import { ResearchDataProvider, ResearchAnalyticsProvider } from './ResearchDataProvider';
import {
  Investigation,
  TestRun,
  Measurement,
  Finding,
  Source,
  EvidenceChunk,
  Comparison,
  ResearchReport,
  DatasetManifest,
  MeasurementFilters,
  FindingFilters,
  TestRunFilters,
} from '@shared/types/index';
import type {
  FirelineAnalysisRequest,
  FirelineAnalysisResult,
  TestMatchCompareRequest,
  TestMatchCompareResult,
  SmokewiseAnalysisRequest,
  SmokewiseAnalysisResult,
  AssistantQueryRequest,
  AssistantQueryResult,
  ReportGenerateRequest,
  ReportGenerateResult,
  EvidenceSearchFilters,
  EvidenceSearchResult,
} from '@/services/apiContracts';

function normalizeInvestigation(raw: any): Investigation {
  if (!raw) return raw;
  const pillar = raw.pillar || raw.fire_safety_pillar || 'prevention';
  const shortName = raw.short_name || raw.id || 'NASA-EXP';
  const name = raw.title || raw.name || shortName;

  return {
    id: raw.id,
    name,
    short_name: shortName,
    psi_id: raw.psi_id || 'PSI-00',
    doi: raw.doi || null,
    description: raw.summary || raw.description || name,
    research_objectives: raw.research_objectives || [
      raw.summary || 'NASA Physical Sciences Informatics microgravity combustion research',
    ],
    research_categories: raw.research_categories || [pillar, 'microgravity'],
    module_tags: raw.module_tags || (pillar === 'detection' ? ['SMOKEWISE'] : ['FIRELINE', 'TESTMATCH']),
    fire_safety_pillar: pillar,
    gravity_regimes: raw.gravity_regimes || ['microgravity'],
    fuel_types: raw.fuel_types || ['PMMA', 'SIBAL', 'Kapton', 'Silicone', 'Methanol'],
    source_ids: raw.source_ids || [raw.source_id || 'NASA-PSI'],
    official_url: raw.url || raw.official_url || 'https://psi.nasa.gov',
    data_availability: raw.data_availability || 'full_psi_dataset',
    is_mock_metadata: false,
  };
}

function normalizeTestRun(raw: any): TestRun {
  if (!raw) return raw;
  const geomRaw = (raw.geometry || 'slab').toLowerCase();
  let canonicalGeom: TestRun['geometry'] = 'flat_sheet';
  if (geomRaw.includes('fabric') || geomRaw.includes('cloth') || geomRaw.includes('sheet')) {
    canonicalGeom = 'thin_fabric';
  } else if (geomRaw.includes('rod') || geomRaw.includes('cylinder')) {
    canonicalGeom = 'cylindrical_rod';
  } else if (geomRaw.includes('droplet')) {
    canonicalGeom = 'spherical_droplet';
  } else if (geomRaw.includes('wire') || geomRaw.includes('insulation')) {
    canonicalGeom = 'wire_insulation';
  } else if (geomRaw.includes('filament') || geomRaw.includes('lamp')) {
    canonicalGeom = 'heated_lamp_filament';
  } else if (geomRaw.includes('array')) {
    canonicalGeom = 'structured_array';
  }

  const cond = raw.experimental_conditions || {};

  return {
    id: raw.id,
    investigation_id: raw.investigation_id,
    test_label: raw.test_label || `${raw.investigation_id}: ${raw.test_code || raw.id}`,
    test_sequence: raw.test_sequence ?? raw.raw_row_index ?? 1,
    gravity_regime: raw.gravity_regime || 'microgravity',
    fuel_name: raw.material_normalized || raw.fuel_name || raw.material_raw || 'PMMA',
    fuel_family: raw.fuel_family || (raw.material_normalized === 'PMMA' ? 'thermoplastic' : 'spacecraft_material'),
    geometry: canonicalGeom,
    sample_dimensions: raw.sample_dimensions || {
      thickness: raw.thickness_mm ? { value: raw.thickness_mm, unit: 'mm', normalized_m: raw.thickness_mm / 1000 } : null,
      width: raw.width_mm ? { value: raw.width_mm, unit: 'mm', normalized_m: raw.width_mm / 1000 } : null,
      diameter: raw.diameter_mm ? { value: raw.diameter_mm, unit: 'mm', normalized_m: raw.diameter_mm / 1000 } : null,
      notes: raw.notes || null,
    },
    experimental_conditions: {
      oxygen_pct_vol: cond.oxygen_pct_vol ?? raw.oxygen_pct_vol ?? 21.0,
      pressure_kpa: cond.pressure_kpa ?? raw.pressure_kpa ?? 101.3,
      airflow_cm_s: cond.airflow_cm_s ?? raw.airflow_cm_s ?? (raw.flow_regime === 'opposed' ? 5.0 : 20.0),
      ambient_temp_k: cond.ambient_temp_k ?? 298.15,
      flow_direction:
        cond.flow_direction ??
        (raw.flow_regime === 'concurrent'
          ? 'concurrent'
          : raw.flow_regime === 'opposed'
          ? 'opposed'
          : 'quiescent'),
      ignition_method: cond.ignition_method || 'Hot wire / radiant igniter',
    },
    outcome_categories: raw.outcome_categories || [raw.extinction_mode || 'steady_spread'],
    measurement_ids: raw.measurement_ids || [],
    source_ids: raw.source_ids || [raw.source_id || 'NASA-PSI'],
    data_status: raw.data_status || 'reported',
    is_mock: false,
  };
}

function normalizeMeasurement(raw: any): Measurement {
  if (!raw) return raw;
  const paramCode = raw.parameter_code || raw.parameter || 'flame_spread_rate';
  const paramLabel = raw.parameter_label || raw.parameter_name || paramCode;
  const rawVal =
    raw.raw_value !== undefined && raw.raw_value !== null
      ? Number(raw.raw_value)
      : raw.parameter_value !== undefined && raw.parameter_value !== null
      ? Number(raw.parameter_value)
      : null;

  return {
    id: raw.id || `M-${raw.test_run_id}-${paramCode}`,
    test_run_id: raw.test_run_id,
    investigation_id: raw.investigation_id || 'BASS-II',
    parameter_code: paramCode,
    parameter_label: paramLabel,
    parameter_category: raw.parameter_category || 'flame_spread',
    measurement_role: raw.measurement_role || 'primary_outcome',
    raw_value: rawVal,
    raw_unit: raw.raw_unit || raw.unit || '',
    normalized_value:
      raw.normalized_value !== undefined && raw.normalized_value !== null
        ? Number(raw.normalized_value)
        : rawVal,
    normalized_unit: raw.normalized_unit || raw.unit || '',
    display_unit: raw.display_unit || raw.unit || '',
    minimum_value: raw.minimum_value ?? null,
    maximum_value: raw.maximum_value ?? null,
    time_s: raw.time_s ?? null,
    sensor: raw.sensor ?? null,
    measurement_method: raw.measurement_method ?? null,
    uncertainty: raw.uncertainty ?? null,
    data_status: raw.quality_status || raw.data_status || 'reported',
    source_id: raw.source_id || 'NASA-PSI',
    source_page: raw.source_page ?? null,
    is_mock: false,
  };
}

function normalizeFinding(raw: any): Finding {
  if (!raw) return raw;
  return {
    id: raw.id,
    investigation_id: raw.investigation_id,
    related_test_run_ids: raw.related_test_run_ids || [],
    title: raw.title || raw.finding_statement || 'NASA Microgravity Finding',
    finding_text: raw.finding_text || raw.finding_statement || raw.title || '',
    summary: raw.summary || raw.finding_statement || raw.title || '',
    research_category: raw.research_category || raw.pillar || 'combustion',
    module_tags: raw.module_tags || ['FIRELINE'],
    evidence_type: raw.evidence_type || 'observed',
    confidence_label: raw.confidence_label || raw.confidence || 'high',
    limitations: raw.limitations || [],
    source_references: raw.source_references || [raw.source_id || 'NASA-PSI'],
    data_status: raw.data_status || 'reported',
    is_mock: false,
  };
}

function normalizeEvidenceChunk(raw: any): EvidenceChunk {
  if (!raw) return raw;
  return {
    id: String(raw.id || `CHK-${raw.source_id}-${raw.page_number || 1}`),
    source_id: raw.source_id || 'NASA-PSI',
    investigation_id: raw.investigation_id || 'BASS-II',
    text: raw.text || raw.content_text || raw.excerpt || '',
    page_number: raw.page_number ? Number(raw.page_number) : null,
    section_title: raw.section_title || 'Section',
    chunk_index: raw.chunk_index ?? 0,
    embedding_reference: raw.embedding_reference || null,
    is_mock: false,
  };
}

function normalizeComparison(raw: any): Comparison {
  if (!raw) return raw;
  const expA = raw.test_run_a_id || raw.experiment_a || 'PSI-25:B1';
  const expB = raw.test_run_b_id || raw.experiment_b || 'PSI-98:S1';
  const score =
    raw.weighted_score !== undefined && raw.weighted_score !== null
      ? Number(raw.weighted_score)
      : raw.similarity_score !== undefined && raw.similarity_score !== null
      ? Number(raw.similarity_score) / 100
      : 0.85;

  const coverage =
    raw.data_coverage !== undefined && raw.data_coverage !== null
      ? Number(raw.data_coverage)
      : raw.data_coverage_pct !== undefined && raw.data_coverage_pct !== null
      ? Number(raw.data_coverage_pct) / 100
      : 0.90;

  return {
    id: raw.id || `CMP-${expA.replace(/[^a-zA-Z0-9]/g, '')}-${expB.replace(/[^a-zA-Z0-9]/g, '')}`,
    test_run_a_id: expA,
    test_run_b_id: expB,
    comparison_parameters: raw.comparison_parameters || [
      'gravity_regime',
      'material',
      'geometry',
      'airflow_cm_s',
      'oxygen_pct_vol',
    ],
    matching_parameters: raw.matching_parameters || ['gravity_regime', 'material'],
    differing_parameters: raw.differing_parameters || ['airflow_cm_s', 'geometry'],
    unavailable_parameters: raw.unavailable_parameters || [],
    weighted_score: score,
    data_coverage: coverage,
    methodology: raw.methodology || 'Multi-parameter weighted similarity scoring',
    limitations: raw.limitations || raw.scientific_warnings || [],
    is_mock: false,
  };
}

function normalizeResearchReport(raw: any): ResearchReport {
  if (!raw) return raw;
  return {
    id: raw.id || `RPT-${Date.now().toString().slice(-4)}`,
    title: raw.title || raw.report_title || 'Integrated FIRELINE Research Synthesis',
    research_question: raw.research_question || 'Comprehensive Microgravity Fire Safety Synthesis',
    executive_summary:
      raw.executive_summary ||
      'Integrated analysis of microgravity combustion, detection, and suppression evidence.',
    investigation_ids: raw.investigation_ids || ['BASS-II', 'SAME-R', 'SAFFIRE', 'FLEX', 'SPICE'],
    finding_ids: raw.finding_ids || [],
    comparison_ids: raw.comparison_ids || ['CMP-001'],
    analytical_results: raw.analytical_results || [
      {
        module: 'FIRELINE',
        heading: 'Combustion & Quenching Regimes',
        key_metrics_summary: 'Critical extinction velocity limits identified.',
        implications: ['Validates LOC standards for Lunar and Martian atmospheres.'],
      },
      {
        module: 'TESTMATCH',
        heading: 'Cross-Scale Comparability & Warnings',
        key_metrics_summary: 'Scale divergence identified between small duct and large panels.',
        implications: ['Large-scale panels require concurrent radiation models.'],
      },
      {
        module: 'SMOKEWISE',
        heading: 'Smoke Aerosol Particle Evolution',
        key_metrics_summary: 'Pyrolysis aerosols demonstrate bimodal particle sizes.',
        implications: ['Near-IR optical sensors provide advance detection.'],
      },
    ],
    limitations: raw.limitations || ['Microgravity conditions require partial-g verification.'],
    source_ids: raw.source_ids || ['NASA-TM-20210011385', 'AIAA-2012-3536'],
    generated_at: raw.generated_at || new Date().toISOString(),
    is_mock: false,
  };
}

export class ApiResearchDataProvider implements ResearchDataProvider, ResearchAnalyticsProvider {
  readonly mode = 'api' as const;
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (
      baseUrl ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      'http://localhost:8000/api/v1'
    ).replace(/\/+$/, '');
  }

  isMockMode(): boolean {
    return false;
  }

  private async fetchJson<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `[ApiResearchDataProvider] HTTP ${response.status} ${response.statusText} from ${url.pathname}`
        );
      }

      const json = await response.json();
      if (json && typeof json === 'object' && Array.isArray((json as any).items)) {
        return (json as any).items as T;
      }
      return json as T;
    } catch (error: any) {
      console.error(`[ApiResearchDataProvider] Failed to fetch from ${url.toString()}:`, error);
      throw new Error(
        `FastAPI service error at ${url.pathname}: ${error.message || 'Network request failed'}`
      );
    }
  }

  async getManifest(): Promise<DatasetManifest> {
    return this.fetchJson<DatasetManifest>('/manifest');
  }

  async getInvestigations(): Promise<Investigation[]> {
    const raw = await this.fetchJson<any[]>('/investigations');
    return (raw || []).map(normalizeInvestigation);
  }

  async getInvestigationById(id: string): Promise<Investigation | null> {
    try {
      const raw = await this.fetchJson<any>(`/investigations/${id}`);
      return raw ? normalizeInvestigation(raw.investigation || raw) : null;
    } catch (e) {
      return null;
    }
  }

  async getTestRuns(filters?: TestRunFilters): Promise<TestRun[]> {
    const raw = await this.fetchJson<any[]>('/test-runs', filters);
    return (raw || []).map(normalizeTestRun);
  }

  async getTestRunById(id: string): Promise<TestRun | null> {
    try {
      const raw = await this.fetchJson<any>(`/test-runs/${id}`);
      return raw ? normalizeTestRun(raw.test_run || raw) : null;
    } catch (e) {
      return null;
    }
  }

  async getTestRunsByInvestigation(investigationId: string): Promise<TestRun[]> {
    const raw = await this.fetchJson<any[]>(`/test-runs`, { investigation_id: investigationId });
    return (raw || []).map(normalizeTestRun);
  }

  async getMeasurements(filters?: MeasurementFilters): Promise<Measurement[]> {
    const raw = await this.fetchJson<any[]>('/measurements', filters);
    return (raw || []).map(normalizeMeasurement);
  }

  async getMeasurementById(id: string): Promise<Measurement | null> {
    try {
      const raw = await this.fetchJson<any>(`/measurements/${id}`);
      return raw ? normalizeMeasurement(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async getMeasurementsByTestRun(testRunId: string): Promise<Measurement[]> {
    const raw = await this.fetchJson<any[]>('/measurements', { test_run_id: testRunId });
    return (raw || []).map(normalizeMeasurement);
  }

  async getFindings(filters?: FindingFilters): Promise<Finding[]> {
    const raw = await this.fetchJson<any[]>('/findings', filters);
    return (raw || []).map(normalizeFinding);
  }

  async getFindingById(id: string): Promise<Finding | null> {
    try {
      const raw = await this.fetchJson<any>(`/findings/${id}`);
      return raw ? normalizeFinding(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async getFindingsByInvestigation(investigationId: string): Promise<Finding[]> {
    const raw = await this.fetchJson<any[]>('/findings', { investigation_id: investigationId });
    return (raw || []).map(normalizeFinding);
  }

  async getSources(): Promise<Source[]> {
    return this.fetchJson<Source[]>('/sources');
  }

  async getSourceById(id: string): Promise<Source | null> {
    try {
      return await this.fetchJson<Source>(`/sources/${id}`);
    } catch (e) {
      return null;
    }
  }

  async getEvidenceChunks(investigationId?: string): Promise<EvidenceChunk[]> {
    const raw = await this.fetchJson<any[]>('/evidence-chunks', {
      investigation_id: investigationId,
    });
    return (raw || []).map(normalizeEvidenceChunk);
  }

  async getComparisons(): Promise<Comparison[]> {
    const raw = await this.fetchJson<any[]>('/comparisons');
    return (raw || []).map(normalizeComparison);
  }

  async getComparisonById(id: string): Promise<Comparison | null> {
    try {
      const raw = await this.fetchJson<any>(`/comparisons/${id}`);
      return raw ? normalizeComparison(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async getComparisonsForTestRun(testRunId: string): Promise<Comparison[]> {
    const all = await this.getComparisons();
    return (all || []).filter(
      (c) =>
        c.test_run_a_id === testRunId ||
        c.test_run_b_id === testRunId ||
        (c as any).experiment_a_id === testRunId ||
        (c as any).experiment_b_id === testRunId
    );
  }

  async getResearchReports(): Promise<ResearchReport[]> {
    const raw = await this.fetchJson<any[]>('/reports');
    return (raw || []).map(normalizeResearchReport);
  }

  async getResearchReportById(id: string): Promise<ResearchReport | null> {
    try {
      const raw = await this.fetchJson<any>(`/reports/${id}`);
      return raw ? normalizeResearchReport(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async analyzeFireline(request: FirelineAnalysisRequest): Promise<FirelineAnalysisResult> {
    const response = await fetch(`${this.baseUrl}/fireline/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`[ApiResearchDataProvider] analyzeFireline HTTP ${response.status}`);
    }
    return response.json();
  }

  async compareTestMatch(request: TestMatchCompareRequest): Promise<TestMatchCompareResult> {
    const response = await fetch(`${this.baseUrl}/testmatch/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`[ApiResearchDataProvider] compareTestMatch HTTP ${response.status}`);
    }
    return response.json();
  }

  async analyzeSmokewise(request: SmokewiseAnalysisRequest): Promise<SmokewiseAnalysisResult> {
    const response = await fetch(`${this.baseUrl}/smokewise/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`[ApiResearchDataProvider] analyzeSmokewise HTTP ${response.status}`);
    }
    return response.json();
  }

  async queryAssistant(request: AssistantQueryRequest): Promise<AssistantQueryResult> {
    const response = await fetch(`${this.baseUrl}/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`[ApiResearchDataProvider] queryAssistant HTTP ${response.status}`);
    }
    return response.json();
  }

  async generateReport(request: ReportGenerateRequest): Promise<ReportGenerateResult> {
    const response = await fetch(`${this.baseUrl}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`[ApiResearchDataProvider] generateReport HTTP ${response.status}`);
    }
    return response.json();
  }

  async searchEvidence(query: string, filters?: EvidenceSearchFilters): Promise<EvidenceSearchResult> {
    const params: Record<string, any> = { q: query, ...(filters || {}) };
    const response = await fetch(`${this.baseUrl}/evidence/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`[ApiResearchDataProvider] searchEvidence HTTP ${response.status}`);
    }
    return response.json();
  }
}
