/**
 * FIRELINE — Mock Research Data Provider Implementation
 *
 * Supplies synthetic data from local JSON files under `datasets/mock/`.
 * Implements client-side filtering, lookup, and explicit mock flags.
 */

import { ResearchDataProvider } from './ResearchDataProvider';
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

import investigationsData from '@datasets/mock/investigations.json';
import testRunsData from '@datasets/mock/test_runs.json';
import measurementsData from '@datasets/mock/measurements.json';
import findingsData from '@datasets/mock/findings.json';
import sourcesData from '@datasets/mock/sources.json';
import evidenceChunksData from '@datasets/mock/evidence_chunks.json';
import comparisonsData from '@datasets/mock/comparisons.json';
import researchReportsData from '@datasets/mock/research_reports.json';
import manifestData from '@datasets/mock/dataset_manifest.json';

export class MockResearchDataProvider implements ResearchDataProvider {
  readonly mode = 'mock' as const;

  private readonly investigations: Investigation[] = investigationsData as Investigation[];
  private readonly testRuns: TestRun[] = testRunsData as TestRun[];
  private readonly measurements: Measurement[] = measurementsData as Measurement[];
  private readonly findings: Finding[] = findingsData as Finding[];
  private readonly sources: Source[] = sourcesData as Source[];
  private readonly evidenceChunks: EvidenceChunk[] = evidenceChunksData as EvidenceChunk[];
  private readonly comparisons: Comparison[] = comparisonsData as Comparison[];
  private readonly researchReports: ResearchReport[] = researchReportsData as ResearchReport[];
  private readonly manifest: DatasetManifest = manifestData as DatasetManifest;

  async getManifest(): Promise<DatasetManifest> {
    return Promise.resolve({ ...this.manifest });
  }

  isMockMode(): boolean {
    return true;
  }

  async getInvestigations(): Promise<Investigation[]> {
    return Promise.resolve([...this.investigations]);
  }

  async getInvestigationById(id: string): Promise<Investigation | null> {
    const found = this.investigations.find((i) => i.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getTestRuns(filters?: TestRunFilters): Promise<TestRun[]> {
    let result = [...this.testRuns];

    if (filters) {
      if (filters.investigation_id) {
        result = result.filter((tr) => tr.investigation_id === filters.investigation_id);
      }
      if (filters.gravity_regime) {
        result = result.filter((tr) => tr.gravity_regime === filters.gravity_regime);
      }
      if (filters.fuel_family) {
        result = result.filter((tr) =>
          tr.fuel_family.toLowerCase().includes(filters.fuel_family!.toLowerCase())
        );
      }
      if (filters.geometry) {
        result = result.filter((tr) => tr.geometry === filters.geometry);
      }
    }

    return Promise.resolve(result);
  }

  async getTestRunById(id: string): Promise<TestRun | null> {
    const found = this.testRuns.find((tr) => tr.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getTestRunsByInvestigation(investigationId: string): Promise<TestRun[]> {
    return this.getTestRuns({ investigation_id: investigationId });
  }

  async getMeasurements(filters?: MeasurementFilters): Promise<Measurement[]> {
    let result = [...this.measurements];

    if (filters) {
      if (filters.investigation_id) {
        result = result.filter((m) => m.investigation_id === filters.investigation_id);
      }
      if (filters.test_run_id) {
        result = result.filter((m) => m.test_run_id === filters.test_run_id);
      }
      if (filters.parameter_code) {
        result = result.filter((m) => m.parameter_code === filters.parameter_code);
      }
      if (filters.parameter_category) {
        result = result.filter((m) => m.parameter_category === filters.parameter_category);
      }
      if (filters.measurement_role) {
        result = result.filter((m) => m.measurement_role === filters.measurement_role);
      }
      if (filters.data_status) {
        result = result.filter((m) => m.data_status === filters.data_status);
      }
    }

    return Promise.resolve(result);
  }

  async getMeasurementById(id: string): Promise<Measurement | null> {
    const found = this.measurements.find((m) => m.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getMeasurementsByTestRun(testRunId: string): Promise<Measurement[]> {
    return this.getMeasurements({ test_run_id: testRunId });
  }

  async getFindings(filters?: FindingFilters): Promise<Finding[]> {
    let result = [...this.findings];

    if (filters) {
      if (filters.investigation_id) {
        result = result.filter((f) => f.investigation_id === filters.investigation_id);
      }
      if (filters.module_tag) {
        result = result.filter((f) => f.module_tags.includes(filters.module_tag!));
      }
      if (filters.research_category) {
        result = result.filter((f) => f.research_category === filters.research_category);
      }
      if (filters.evidence_type) {
        result = result.filter((f) => f.evidence_type === filters.evidence_type);
      }
      if (filters.search_query) {
        const q = filters.search_query.toLowerCase();
        result = result.filter(
          (f) =>
            f.title.toLowerCase().includes(q) ||
            f.summary.toLowerCase().includes(q) ||
            f.finding_text.toLowerCase().includes(q)
        );
      }
    }

    return Promise.resolve(result);
  }

  async getFindingById(id: string): Promise<Finding | null> {
    const found = this.findings.find((f) => f.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getFindingsByInvestigation(investigationId: string): Promise<Finding[]> {
    return this.getFindings({ investigation_id: investigationId });
  }

  async getSources(): Promise<Source[]> {
    return Promise.resolve([...this.sources]);
  }

  async getSourceById(id: string): Promise<Source | null> {
    const found = this.sources.find((s) => s.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getEvidenceChunks(investigationId?: string): Promise<EvidenceChunk[]> {
    if (!investigationId) {
      return Promise.resolve([...this.evidenceChunks]);
    }
    return Promise.resolve(
      this.evidenceChunks.filter((c) => c.investigation_id === investigationId)
    );
  }

  async getComparisons(): Promise<Comparison[]> {
    return Promise.resolve([...this.comparisons]);
  }

  async getComparisonById(id: string): Promise<Comparison | null> {
    const found = this.comparisons.find((c) => c.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getComparisonsForTestRun(testRunId: string): Promise<Comparison[]> {
    return Promise.resolve(
      this.comparisons.filter(
        (c) => c.test_run_a_id === testRunId || c.test_run_b_id === testRunId
      )
    );
  }

  async getResearchReports(): Promise<ResearchReport[]> {
    return Promise.resolve([...this.researchReports]);
  }

  async getResearchReportById(id: string): Promise<ResearchReport | null> {
    const found = this.researchReports.find((r) => r.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }
}
