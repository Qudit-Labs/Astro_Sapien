/**
 * FIRELINE — Centralized Research Data Provider Interface
 *
 * Defines the contract through which all frontend modules (FIRELINE, TESTMATCH, SMOKewise)
 * request scientific data. This decouples UI components from storage implementations,
 * enabling seamless runtime switching between Mock JSON and real FastAPI backend endpoints.
 */

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

export interface ResearchDataProvider {
  readonly mode: 'mock' | 'api';

  // System & Metadata
  getManifest(): Promise<DatasetManifest>;
  isMockMode(): boolean;

  // Investigations
  getInvestigations(): Promise<Investigation[]>;
  getInvestigationById(id: string): Promise<Investigation | null>;

  // Test Runs
  getTestRuns(filters?: TestRunFilters): Promise<TestRun[]>;
  getTestRunById(id: string): Promise<TestRun | null>;
  getTestRunsByInvestigation(investigationId: string): Promise<TestRun[]>;

  // Measurements
  getMeasurements(filters?: MeasurementFilters): Promise<Measurement[]>;
  getMeasurementById(id: string): Promise<Measurement | null>;
  getMeasurementsByTestRun(testRunId: string): Promise<Measurement[]>;

  // Findings
  getFindings(filters?: FindingFilters): Promise<Finding[]>;
  getFindingById(id: string): Promise<Finding | null>;
  getFindingsByInvestigation(investigationId: string): Promise<Finding[]>;

  // Sources & Evidence Chunks
  getSources(): Promise<Source[]>;
  getSourceById(id: string): Promise<Source | null>;
  getEvidenceChunks(investigationId?: string): Promise<EvidenceChunk[]>;

  // TESTMATCH Comparisons
  getComparisons(): Promise<Comparison[]>;
  getComparisonById(id: string): Promise<Comparison | null>;
  getComparisonsForTestRun(testRunId: string): Promise<Comparison[]>;

  // Research Reports
  getResearchReports(): Promise<ResearchReport[]>;
  getResearchReportById(id: string): Promise<ResearchReport | null>;
}
