import { describe, it, expect } from 'vitest';
import { MockResearchDataProvider } from '@/data/providers/MockResearchDataProvider';
import { computeTestMatchComparison } from './testMatchEngine';

describe('TESTMATCH Comparison Engine', () => {
  it('computes comparison between Saffire-I and BASS-II without treating missing values as zero', async () => {
    const provider = new MockResearchDataProvider();
    const runA = await provider.getTestRunById('TR-SAF1-01');
    const runB = await provider.getTestRunById('TR-BASS-02');
    expect(runA).not.toBeNull();
    expect(runB).not.toBeNull();

    const measA = await provider.getMeasurementsByTestRun(runA!.id);
    const measB = await provider.getMeasurementsByTestRun(runB!.id);

    const res = computeTestMatchComparison(runA!, runB!, measA, measB);
    expect(res.dataCoverage).toBeGreaterThan(0.5);
    expect(res.prototypeComparabilityScore).not.toBeNull();
    expect(res.isMockDemo).toBe(true);
    expect(res.rows.some((r) => r.key === 'oxygen_concentration' && r.status === 'similar')).toBe(true);
    expect(res.rows.some((r) => r.key === 'airflow_velocity' && r.status === 'different')).toBe(true);
  });

  it('flags incompatible geometries as not_comparable', async () => {
    const provider = new MockResearchDataProvider();
    const runA = await provider.getTestRunById('TR-FLEX-01'); // spherical_droplet
    const runB = await provider.getTestRunById('TR-SAF1-01'); // flat_sheet
    const measA = await provider.getMeasurementsByTestRun(runA!.id);
    const measB = await provider.getMeasurementsByTestRun(runB!.id);

    const res = computeTestMatchComparison(runA!, runB!, measA, measB);
    const geomRow = res.rows.find((r) => r.key === 'geometry');
    expect(geomRow?.status).toBe('not_comparable');
  });
});
