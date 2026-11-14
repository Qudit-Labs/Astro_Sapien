import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dataProvider } from '@/data';
import {
  Comparison,
  DatasetManifest,
  EvidenceChunk,
  Finding,
  Investigation,
  Measurement,
  ResearchReport,
  Source,
  TestRun,
} from '@shared/types/index';

interface ResearchDataContextValue {
  mode: 'mock' | 'api';
  isMockMode: boolean;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;

  manifest: DatasetManifest | null;
  investigations: Investigation[];
  testRuns: TestRun[];
  measurements: Measurement[];
  findings: Finding[];
  sources: Source[];
  evidenceChunks: EvidenceChunk[];
  comparisons: Comparison[];
  researchReports: ResearchReport[];

  // Fast lookup maps
  investigationById: Record<string, Investigation>;
  testRunById: Record<string, TestRun>;
  sourceById: Record<string, Source>;
  measurementsByTestRunId: Record<string, Measurement[]>;
  findingsByInvestigationId: Record<string, Finding[]>;
  testRunsByInvestigationId: Record<string, TestRun[]>;

  // Global search state preserved across navigation
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

const ResearchDataContext = createContext<ResearchDataContextValue | undefined>(undefined);

export const ResearchDataProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  const [manifest, setManifest] = useState<DatasetManifest | null>(null);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [evidenceChunks, setEvidenceChunks] = useState<EvidenceChunk[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [researchReports, setResearchReports] = useState<ResearchReport[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        manifestRes,
        invsRes,
        runsRes,
        measRes,
        fndsRes,
        srcsRes,
        chunksRes,
        cmpsRes,
        rptsRes,
      ] = await Promise.all([
        dataProvider.getManifest(),
        dataProvider.getInvestigations(),
        dataProvider.getTestRuns(),
        dataProvider.getMeasurements(),
        dataProvider.getFindings(),
        dataProvider.getSources(),
        dataProvider.getEvidenceChunks(),
        dataProvider.getComparisons(),
        dataProvider.getResearchReports(),
      ]);

      setManifest(manifestRes);
      setInvestigations(invsRes);
      setTestRuns(runsRes);
      setMeasurements(measRes);
      setFindings(fndsRes);
      setSources(srcsRes);
      setEvidenceChunks(chunksRes);
      setComparisons(cmpsRes);
      setResearchReports(rptsRes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load research datasets.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const investigationById = useMemo(
    () => Object.fromEntries(investigations.map((i) => [i.id, i])),
    [investigations]
  );

  const testRunById = useMemo(
    () => Object.fromEntries(testRuns.map((t) => [t.id, t])),
    [testRuns]
  );

  const sourceById = useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s])),
    [sources]
  );

  const measurementsByTestRunId = useMemo(() => {
    const map: Record<string, Measurement[]> = {};
    for (const m of measurements) {
      if (!map[m.test_run_id]) map[m.test_run_id] = [];
      map[m.test_run_id].push(m);
    }
    return map;
  }, [measurements]);

  const findingsByInvestigationId = useMemo(() => {
    const map: Record<string, Finding[]> = {};
    for (const f of findings) {
      if (!map[f.investigation_id]) map[f.investigation_id] = [];
      map[f.investigation_id].push(f);
    }
    return map;
  }, [findings]);

  const testRunsByInvestigationId = useMemo(() => {
    const map: Record<string, TestRun[]> = {};
    for (const tr of testRuns) {
      if (!map[tr.investigation_id]) map[tr.investigation_id] = [];
      map[tr.investigation_id].push(tr);
    }
    return map;
  }, [testRuns]);

  const value: ResearchDataContextValue = {
    mode: dataProvider.mode,
    isMockMode: dataProvider.isMockMode(),
    loading,
    error,
    reload: loadAll,
    manifest,
    investigations,
    testRuns,
    measurements,
    findings,
    sources,
    evidenceChunks,
    comparisons,
    researchReports,
    investigationById,
    testRunById,
    sourceById,
    measurementsByTestRunId,
    findingsByInvestigationId,
    testRunsByInvestigationId,
    globalSearch,
    setGlobalSearch,
  };

  return <ResearchDataContext.Provider value={value}>{children}</ResearchDataContext.Provider>;
};

export function useResearchData(): ResearchDataContextValue {
  const ctx = useContext(ResearchDataContext);
  if (!ctx) {
    throw new Error('useResearchData must be used within ResearchDataProviderWrapper');
  }
  return ctx;
}
