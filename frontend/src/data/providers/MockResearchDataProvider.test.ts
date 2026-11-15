import { describe, it, expect, beforeEach } from 'vitest';
import { MockResearchDataProvider } from './MockResearchDataProvider';

describe('MockResearchDataProvider', () => {
  let provider: MockResearchDataProvider;

  beforeEach(() => {
    provider = new MockResearchDataProvider();
  });

  it('reports mode as mock and isMockMode() as true', () => {
    expect(provider.mode).toBe('mock');
    expect(provider.isMockMode()).toBe(true);
  });

  it('loads all 8 required NASA PSI investigations', async () => {
    const invs = await provider.getInvestigations();
    expect(invs.length).toBe(8);

    const psiIds = invs.map((i) => i.psi_id);
    expect(psiIds).toContain('PSI-25'); // BASS-II
    expect(psiIds).toContain('PSI-98'); // SAFFIRE-I
    expect(psiIds).toContain('PSI-99'); // SAFFIRE-II
    expect(psiIds).toContain('PSI-100'); // SAFFIRE-III
    expect(psiIds).toContain('PSI-69'); // FLEX
    expect(psiIds).toContain('PSI-101'); // SAME-R
    expect(psiIds).toContain('PSI-102'); // Original SAME
    expect(psiIds).toContain('PSI-107'); // SPICE
  });

  it('retrieves an investigation by id', async () => {
    const inv = await provider.getInvestigationById('INV-BASS-II');
    expect(inv).not.toBeNull();
    expect(inv?.short_name).toBe('BASS-II');
    expect(inv?.psi_id).toBe('PSI-25');
  });

  it('filters test runs by investigation id', async () => {
    const runs = await provider.getTestRunsByInvestigation('INV-SAFFIRE-I');
    expect(runs.length).toBeGreaterThanOrEqual(2);
    expect(runs.every((r) => r.investigation_id === 'INV-SAFFIRE-I')).toBe(true);
  });

  it('filters measurements by parameter code', async () => {
    const o2Meas = await provider.getMeasurements({
      parameter_code: 'oxygen_concentration',
    });
    expect(o2Meas.length).toBeGreaterThan(0);
    expect(o2Meas.every((m) => m.parameter_code === 'oxygen_concentration')).toBe(true);
    expect(o2Meas.every((m) => m.data_status === 'synthetic_demo')).toBe(true);
    expect(o2Meas.every((m) => m.is_mock === true)).toBe(true);
  });

  it('retrieves comparisons between existing test runs', async () => {
    const comparisons = await provider.getComparisons();
    expect(comparisons.length).toBeGreaterThanOrEqual(8);
    for (const c of comparisons) {
      expect(c.test_run_a_id).toBeDefined();
      expect(c.test_run_b_id).toBeDefined();
      expect(c.is_mock).toBe(true);
    }
  });

  it('retrieves integrated research reports', async () => {
    const reports = await provider.getResearchReports();
    expect(reports.length).toBeGreaterThanOrEqual(3);
    const r1 = reports[0];
    expect(r1.analytical_results.length).toBeGreaterThanOrEqual(1);
    expect(r1.is_mock).toBe(true);
  });

  it('retrieves dataset manifest with explicit synthetic disclaimer', async () => {
    const manifest = await provider.getManifest();
    expect(manifest.data_mode).toBe('synthetic_mock');
    expect(manifest.disclaimer).toContain('SYNTHETIC AND ILLUSTRATIVE DEMONSTRATIONS');
    expect(manifest.record_counts.investigations).toBe(8);
    expect(manifest.record_counts.test_runs).toBe(18);
  });
});
