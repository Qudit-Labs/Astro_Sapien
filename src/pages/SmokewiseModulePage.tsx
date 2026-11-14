import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
} from 'recharts';
import { Wind, FlaskConical, Activity, Layers, AlertTriangle } from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import { PageHeader } from '@/components/common/PageHeader';
import { KPIStatCard } from '@/components/common/KPIStatCard';
import { FilterPanel } from '@/components/common/FilterPanel';
import { ChartCard } from '@/components/common/ChartCard';
import { EvidenceBadge } from '@/components/common/EvidenceBadge';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';
import { SourceCitation } from '@/components/common/SourceCitation';
import { EmptyState } from '@/components/common/EmptyState';

export const SmokewiseModulePage: React.FC = () => {
  const {
    investigations,
    testRuns,
    measurements,
    findings,
    investigationById,
    sourceById,
    measurementsByTestRunId,
  } = useResearchData();

  const smokeInvs = useMemo(
    () => investigations.filter((i) => i.module_tags.includes('SMOKEWISE')),
    [investigations]
  );

  const smokeInvIds = useMemo(
    () => new Set(smokeInvs.map((i) => i.id)),
    [smokeInvs]
  );

  const smokeRuns = useMemo(
    () => testRuns.filter((r) => smokeInvIds.has(r.investigation_id)),
    [testRuns, smokeInvIds]
  );

  // Filters
  const [invFilter, setInvFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [sizeRangeFilter, setSizeRangeFilter] = useState('all');
  const [airflowFilter, setAirflowFilter] = useState('all');
  const [agingFilter, setAgingFilter] = useState('all');
  const [gravityFilter, setGravityFilter] = useState('all');

  const uniqueFuels = useMemo(
    () => Array.from(new Set(smokeRuns.map((r) => r.fuel_name))).sort(),
    [smokeRuns]
  );

  const uniqueGravities = useMemo(
    () => Array.from(new Set(smokeRuns.map((r) => r.gravity_regime))).sort(),
    [smokeRuns]
  );

  const hasActiveFilters =
    invFilter !== 'all' ||
    fuelFilter !== 'all' ||
    sizeRangeFilter !== 'all' ||
    airflowFilter !== 'all' ||
    agingFilter !== 'all' ||
    gravityFilter !== 'all';

  const resetFilters = () => {
    setInvFilter('all');
    setFuelFilter('all');
    setSizeRangeFilter('all');
    setAirflowFilter('all');
    setAgingFilter('all');
    setGravityFilter('all');
  };

  const filteredRuns = useMemo(() => {
    return smokeRuns.filter((r) => {
      if (invFilter !== 'all' && r.investigation_id !== invFilter) return false;
      if (fuelFilter !== 'all' && r.fuel_name !== fuelFilter) return false;
      if (gravityFilter !== 'all' && r.gravity_regime !== gravityFilter) return false;

      const vel = r.experimental_conditions.airflow_cm_s;
      if (airflowFilter === 'quiescent' && vel !== 0) return false;
      if (airflowFilter === 'low' && (vel === null || vel === 0 || vel > 10)) return false;
      if (airflowFilter === 'elevated' && (vel === null || vel <= 10)) return false;

      const runMeas = measurementsByTestRunId[r.id] || [];
      const diamMeas = runMeas.find((m) => m.parameter_code === 'particle_diameter');
      if (sizeRangeFilter === 'ultrafine' && (!diamMeas?.raw_value || diamMeas.raw_value >= 150))
        return false;
      if (sizeRangeFilter === 'submicron' && (!diamMeas?.raw_value || diamMeas.raw_value < 150))
        return false;

      const agingMeas = runMeas.find((m) => m.parameter_code === 'smoke_aging_time');
      if (agingFilter === 'short' && (!agingMeas?.raw_value || agingMeas.raw_value > 60))
        return false;
      if (agingFilter === 'long' && (!agingMeas?.raw_value || agingMeas.raw_value <= 60))
        return false;

      return true;
    });
  }, [
    smokeRuns,
    invFilter,
    fuelFilter,
    sizeRangeFilter,
    airflowFilter,
    agingFilter,
    gravityFilter,
    measurementsByTestRunId,
  ]);

  const filteredRunIds = useMemo(
    () => new Set(filteredRuns.map((r) => r.id)),
    [filteredRuns]
  );

  // Distinctly separate aerosol particle measurements from soot volume fraction
  const aerosolMeasurements = useMemo(() => {
    const aerosolCodes = new Set([
      'particle_diameter',
      'particle_number_concentration',
      'particle_mass_concentration',
      'smoke_aging_time',
      'detector_response',
    ]);
    return measurements.filter(
      (m) => filteredRunIds.has(m.test_run_id) && aerosolCodes.has(m.parameter_code)
    );
  }, [measurements, filteredRunIds]);

  const sootMeasurements = useMemo(() => {
    return measurements.filter(
      (m) =>
        filteredRunIds.has(m.test_run_id) &&
        m.parameter_code === 'soot_volume_fraction'
    );
  }, [measurements, filteredRunIds]);

  // Chart 1: Particle Diameter Distribution (nm)
  const particleSizeData = useMemo(() => {
    return filteredRuns
      .map((r) => {
        const m = (measurementsByTestRunId[r.id] || []).find(
          (x) => x.parameter_code === 'particle_diameter' && x.raw_value !== null
        );
        if (!m) return null;
        return {
          runId: r.id.replace('TR-', ''),
          diameterNm: m.raw_value,
          fuel: r.fuel_name,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [filteredRuns, measurementsByTestRunId]);

  // Chart 2: Particle Diameter vs Aging Time
  const diameterVsAgingData = useMemo(() => {
    return filteredRuns
      .map((r) => {
        const ms = measurementsByTestRunId[r.id] || [];
        const diam = ms.find((x) => x.parameter_code === 'particle_diameter' && x.raw_value !== null);
        const aging = ms.find((x) => x.parameter_code === 'smoke_aging_time' && x.raw_value !== null);
        if (!diam || !aging) return null;
        return {
          runId: r.id,
          agingTimeS: aging.raw_value,
          diameterNm: diam.raw_value,
          fuel: r.fuel_name,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [filteredRuns, measurementsByTestRunId]);

  // Chart 3: Airflow Velocity vs Particle Diameter
  const airflowVsParticleData = useMemo(() => {
    return filteredRuns
      .map((r) => {
        const ms = measurementsByTestRunId[r.id] || [];
        const diam = ms.find((x) => x.parameter_code === 'particle_diameter' && x.raw_value !== null);
        const vel = r.experimental_conditions.airflow_cm_s;
        if (!diam || vel === null) return null;
        return {
          runId: r.id,
          airflowCmS: vel,
          diameterNm: diam.raw_value,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [filteredRuns, measurementsByTestRunId]);

  // Chart 4: Soot Volume Fraction (Kept strictly distinct from Smoke Aerosol Particle Size)
  const sootData = useMemo(() => {
    return sootMeasurements
      .filter((m) => m.raw_value !== null)
      .map((m) => ({
        runId: m.test_run_id.replace('TR-', ''),
        sootPpm: m.raw_value,
        inv: investigationById[m.investigation_id]?.short_name || m.investigation_id,
      }));
  }, [sootMeasurements, investigationById]);

  const smokeFindings = useMemo(() => {
    return findings.filter(
      (f) =>
        f.module_tags.includes('SMOKEWISE') &&
        (invFilter === 'all' || f.investigation_id === invFilter)
    );
  }, [findings, invFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Module 3 • SMOKewise"
        badgeColor="teal"
        title="Smoke Aerosol, Soot & Detection Intelligence"
        subtitle="Explore microgravity smoke particle size distributions, coagulation aging, transport dynamics, and spacecraft smoke-detector implications."
      />

      {/* A. Smoke-Research Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          label="Smoke Investigations"
          value={smokeInvs.length}
          sublabel="SAME, SAME-R, SPICE, Saffire"
          icon={Wind}
          accent="teal"
        />
        <KPIStatCard
          label="Smoke Test Records"
          value={filteredRuns.length}
          sublabel={`of ${smokeRuns.length} module runs`}
          icon={FlaskConical}
          accent="cyan"
        />
        <KPIStatCard
          label="Aerosol Measurements"
          value={aerosolMeasurements.length}
          sublabel={`+ ${sootMeasurements.length} distinct soot records`}
          icon={Activity}
          accent="blue"
        />
        <KPIStatCard
          label="Materials Represented"
          value={uniqueFuels.length}
          sublabel="Wire insulation, cellulose, silicone"
          icon={Layers}
          accent="amber"
        />
      </div>

      {/* B. Filters */}
      <FilterPanel
        title="Smoke Aerosol & Soot Filters"
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
            Investigation
          </label>
          <select
            value={invFilter}
            onChange={(e) => setInvFilter(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
          >
            <option value="all">All SMOKewise Investigations</option>
            {smokeInvs.map((i) => (
              <option key={i.id} value={i.id}>
                {i.short_name} ({i.psi_id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
            Fuel / Material
          </label>
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
          >
            <option value="all">All Materials</option>
            {uniqueFuels.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
            Particle Size Range
          </label>
          <select
            value={sizeRangeFilter}
            onChange={(e) => setSizeRangeFilter(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
          >
            <option value="all">All Particle Sizes</option>
            <option value="ultrafine">Ultrafine (&lt; 150 nm)</option>
            <option value="submicron">Coagulated Submicron (≥ 150 nm)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
            Airflow Velocity
          </label>
          <select
            value={airflowFilter}
            onChange={(e) => setAirflowFilter(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
          >
            <option value="all">All Flow Conditions</option>
            <option value="quiescent">Quiescent (0 cm/s)</option>
            <option value="low">Low Flow (1–10 cm/s)</option>
            <option value="elevated">Elevated (&gt; 10 cm/s)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
            Aging Time / Gravity
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              aria-label="Aging time filter"
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">Any Aging</option>
              <option value="short">≤ 60 s</option>
              <option value="long">&gt; 60 s</option>
            </select>
            <select
              value={gravityFilter}
              onChange={(e) => setGravityFilter(e.target.value)}
              aria-label="Gravity regime filter"
              className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2 py-2 text-slate-800 dark:text-[#F4F7FC]"
            >
              <option value="all">All g</option>
              {uniqueGravities.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterPanel>

      {/* C. Charts */}
      {filteredRuns.length === 0 ? (
        <EmptyState
          title="No smoke or soot records match these filters"
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Smoke Particle Diameter Distribution"
            subtitle="Mean/median aerosol diameter across runs with particle_diameter"
            unitNote="Y-axis: nm (SI canonical: m). Distinct from soot volume fraction."
          >
            {particleSizeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={particleSizeData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
                  <XAxis dataKey="runId" tick={{ fontSize: 10, fill: '#9FB1C7' }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07172B',
                      borderColor: '#1A3456',
                      color: '#F4F7FC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="diameterNm" name="Particle Diameter (nm)" fill="#24B8A0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-slate-500">
                No particle diameter records in current filter selection.
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Particle Diameter vs Smoke Aging Time"
            subtitle="Coagulation growth across matching aging_time & particle_diameter observations"
            unitNote="X: aging time (s) • Y: particle diameter (nm)"
          >
            {diameterVsAgingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
                  <XAxis type="number" dataKey="agingTimeS" name="Aging Time" unit=" s" tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                  <YAxis type="number" dataKey="diameterNm" name="Diameter" unit=" nm" tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                  <ZAxis range={[80, 80]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07172B',
                      borderColor: '#1A3456',
                      color: '#F4F7FC',
                      fontSize: '12px',
                    }}
                  />
                  <Scatter name="Aerosol Aging" data={diameterVsAgingData} fill="#38BDF8" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-slate-500">
                No matching aging-time + particle-diameter records in current selection.
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Airflow Velocity vs Particle Diameter"
            subtitle="Convective transport effect on measured aerosol sizing"
            unitNote="X: airflow (cm/s) • Y: particle diameter (nm)"
          >
            {airflowVsParticleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
                  <XAxis type="number" dataKey="airflowCmS" name="Airflow" unit=" cm/s" tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                  <YAxis type="number" dataKey="diameterNm" name="Diameter" unit=" nm" tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                  <ZAxis range={[80, 80]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07172B',
                      borderColor: '#1A3456',
                      color: '#F4F7FC',
                      fontSize: '12px',
                    }}
                  />
                  <Scatter name="Flow vs Particle Size" data={airflowVsParticleData} fill="#F5B942" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-slate-500">
                No matching airflow + particle-diameter records in current selection.
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Soot Volume Fraction (Separate from Smoke Aerosol Sizing)"
            subtitle="Flame soot measurements from Saffire & SPICE (soot_volume_fraction)"
            unitNote="Y-axis: ppm (m³/m³ × 10⁻⁶). Kept distinct from aerosol particle diameter."
          >
            {sootData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sootData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
                  <XAxis dataKey="runId" tick={{ fontSize: 10, fill: '#9FB1C7' }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07172B',
                      borderColor: '#1A3456',
                      color: '#F4F7FC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="sootPpm" name="Soot Volume Fraction (ppm)" fill="#FC3D21" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-xs text-slate-500">
                No soot volume fraction measurements in current filter selection.
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {/* D. Smoke Research Insights & E. Data Limitations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
            Smoke Aerosol & Detector Implications ({smokeFindings.length})
          </h3>
          <div className="space-y-3">
            {smokeFindings.map((f) => {
              const inv = investigationById[f.investigation_id];
              const src = sourceById[f.source_references[0]];
              return (
                <div
                  key={f.id}
                  className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-teal-700 dark:text-[#24B8A0]">
                      {inv ? `${inv.short_name} (${inv.psi_id})` : f.investigation_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <EvidenceBadge type={f.evidence_type} />
                      <DataStatusBadge status={f.data_status} />
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
                    {f.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
                    {f.finding_text}
                  </p>
                  <SourceCitation source={src} sourceId={f.source_references[0]} compact />
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-[#F5B942]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Scientific Boundaries & Limitations</span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              <li>
                <strong>Particle Size ≠ Detector Sensitivity:</strong> Smoke particle diameter measurements describe aerosol morphology and must not be conflated with direct smoke-detector alarm thresholds without chamber response calibration.
              </li>
              <li>
                <strong>Soot vs Smoke Aerosol:</strong> Flame soot volume fractions (SPICE/Saffire) are plotted separately from smoldering aerosol particle sizes (SAME/SAME-R).
              </li>
              <li>
                <strong>Synthetic Data:</strong> Numerical points are illustrative placeholders for frontend testing (`data_status: synthetic_demo`).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
