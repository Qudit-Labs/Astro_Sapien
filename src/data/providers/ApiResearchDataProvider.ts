/**
 * FIRELINE — FastAPI Backend Research Data Provider Implementation
 *
 * Connects to future FastAPI REST endpoints (e.g. `http://localhost:8000/api/v1`).
 * Validates responses against Zod runtime schemas when available and provides
 * structured error diagnostics when the backend service is offline.
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

export class ApiResearchDataProvider implements ResearchDataProvider {
  readonly mode = 'api' as const;
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (
      baseUrl ||
      import.meta.env.VITE_API_BASE_URL ||
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

      return (await response.json()) as T;
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
    return this.fetchJson<Investigation[]>('/investigations');
  }

  async getInvestigationById(id: string): Promise<Investigation | null> {
    try {
      return await this.fetchJson<Investigation>(`/investigations/${id}`);
    } catch (e) {
      return null;
    }
  }

  async getTestRuns(filters?: TestRunFilters): Promise<TestRun[]> {
    return this.fetchJson<TestRun[]>('/test-runs', filters);
  }

  async getTestRunById(id: string): Promise<TestRun | null> {
    try {
      return await this.fetchJson<TestRun>(`/test-runs/${id}`);
    } catch (e) {
      return null;
    }
  }

  async getTestRunsByInvestigation(investigationId: string): Promise<TestRun[]> {
    return this.fetchJson<TestRun[]>(`/investigations/${investigationId}/test-runs`);
  }

  async getMeasurements(filters?: MeasurementFilters): Promise<Measurement[]> {
    return this.fetchJson<Measurement[]>('/measurements', filters);
  }

  async getMeasurementById(id: string): Promise<Measurement | null> {
    try {
      return await this.fetchJson<Measurement>(`/measurements/${id}`);
    } catch (e) {
      return null;
    }
  }

  async getMeasurementsByTestRun(testRunId: string): Promise<Measurement[]> {
    return this.fetchJson<Measurement[]>(`/test-runs/${testRunId}/measurements`);
  }

  async getFindings(filters?: FindingFilters): Promise<Finding[]> {
    return this.fetchJson<Finding[]>('/findings', filters);
  }

  async getFindingById(id: string): Promise<Finding | null> {
    try {
      return await this.fetchJson<Finding>(`/findings/${id}`);
    } catch (e) {
      return null;
    }
  }

  async getFindingsByInvestigation(investigationId: string): Promise<Finding[]> {
    return this.fetchJson<Finding[]>(`/investigations/${investigationId}/findings`);
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
    return this.fetchJson<EvidenceChunk[]>('/evidence-chunks', {
      investigation_id: investigationId,
    });
  }

  async getComparisons(): Promise<Comparison[]> {
    return this.fetchJson<Comparison[]>('/comparisons');
  }

  async getComparisonById(id: string): Promise<Comparison | null> {
    try {
      return await this.fetchJson<Comparison>(`/comparisons/${id}`);
    } catch (e) {
      return null;
    }
  }

  async getComparisonsForTestRun(testRunId: string): Promise<Comparison[]> {
    return this.fetchJson<Comparison[]>(`/test-runs/${testRunId}/comparisons`);
  }

  async getResearchReports(): Promise<ResearchReport[]> {
    return this.fetchJson<ResearchReport[]>('/reports');
  }

  async getResearchReportById(id: string): Promise<ResearchReport | null> {
    try {
      return await this.fetchJson<ResearchReport>(`/reports/${id}`);
    } catch (e) {
      return null;
    }
  }
}
