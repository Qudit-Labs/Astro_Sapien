import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
} from 'recharts';
import { Flame, FlaskConical, Activity, Layers, Info } from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import { PageHeader } from '@/components/common/PageHeader';
import { KPIStatCard } from '@/components/common/KPIStatCard';
import { FilterPanel } from '@/components/common/FilterPanel';
import { ChartCard } from '@/components/common/ChartCard';
import { ExperimentCard } from '@/components/common/ExperimentCard';
import { MeasurementTable } from '@/components/common/MeasurementTable';
import { EvidenceBadge } from '@/components/common/EvidenceBadge';
import { SourceCitation } from '@/components/common/SourceCitation';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { MicrogravityFlameVisualizer } from '@/components/common/MicrogravityFlameVisualizer';

export const FirelineModulePage: React.FC = () => {
  const {
    investigations,
    testRuns,
    measurements,
    findings,
    investigationById,
    sourceById,
    measurementsByTestRunId,
  } = useResearchData();

  const firelineInvs = useMemo(
    () => investigations.filter((i) => i.module_tags.includes('FIRELINE')),
    [investigations]
  );

  const firelineInvIds = useMemo(
    () => new Set(firelineInvs.map((i) => i.id)),
    [firelineInvs]
  );

  const firelineRuns = useMemo(
    () => testRuns.filter((r) => firelineInvIds.has(r.investigation_id)),
    [testRuns, firelineInvIds]
  );

  // Filter states
  const [invFilter, setInvFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [o2Filter, setO2Filter] = useState('all');
  const [airflowFilter, setAirflowFilter] = useState('all');
  const [gravityFilter, setGravityFilter] = useState('all');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const uniqueFuels = useMemo(
    () => Array.from(new Set(firelineRuns.map((r) => r.fuel_name))).sort(),
    [firelineRuns]
  );

  const uniqueGravities = useMemo(
    () => Array.from(new Set(firelineRuns.map((r) => r.gravity_regime))).sort(),
    [firelineRuns]
  );

  const hasActiveFilters =
    invFilter !== 'all' ||
    fuelFilter !== 'all' ||
    o2Filter !== 'all' ||
    airflowFilter !== 'all' ||
    gravityFilter !== 'all';

  const resetFilters = () => {
    setInvFilter('all');
    setFuelFilter('all');
    setO2Filter('all');
    setAirflowFilter('all');
    setGravityFilter('all');
  };

  const filteredRuns = useMemo(() => {
    return firelineRuns.filter((r) => {
      if (invFilter !== 'all' && r.investigation_id !== invFilter) return false;
      if (fuelFilter !== 'all' && r.fuel_name !== fuelFilter) return false;
      if (gravityFilter !== 'all' && r.gravity_regime !== gravityFilter) return false;

      const o2 = r.experimental_conditions.oxygen_pct_vol;
      if (o2Filter === 'hypoxic' && (o2 === null || o2 >= 20)) return false;
      if (o2Filter === 'normoxic' && (o2 === null || o2 < 20)) return false;

      const vel = r.experimental_conditions.airflow_cm_s;
      if (airflowFilter === 'quiescent' && vel !== 0) return false;
      if (airflowFilter === 'low' && (vel === null || vel === 0 || vel > 10)) return false;
      if (airflowFilter === 'elevated' && (vel === null || vel <= 10)) return false;

      return true;
    });
  }, [firelineRuns, invFilter, fuelFilter, o2Filter, airflowFilter, gravityFilter]);

  const filteredRunIds = useMemo(
    () => new Set(filteredRuns.map((r) => r.id)),
    [filteredRuns]
  );

  const combustionMeasurements = useMemo(() => {
    const combustionCategories = new Set([
      'atmospheric_condition',
      'flow_condition',
      'flame_dynamics',
      'thermal_output',
      'gas_emissions',
    ]);
    return measurements.filter(
      (m) =>
        filteredRunIds.has(m.test_run_id) &&
        combustionCategories.has(m.parameter_category)
    );
  }, [measurements, filteredRunIds]);

  // Chart 1: Flame Spread Rate across available runs
  const flameSpreadData = useMemo(() => {
    return filteredRuns
      .map((r) => {
        const m = (measurementsByTestRunId[r.id] || []).find(
          (x) => x.parameter_code === 'flame_spread_rate' && x.raw_value !== null
        );
        if (!m) return null;
        return {
          runId: r.id.replace('TR-', ''),
          spreadRateMmS: m.raw_value,
          airflowCmS: r.experimental_conditions.airflow_cm_s ?? 0,
          fuel: r.fuel_name,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [filteredRuns, measurementsByTestRunId]);

  // Chart 2: Burning Duration Distribution across available runs
  const burningDurationData = useMemo(() => {
    return filteredRuns
      .map((r) => {
        const m = (measurementsByTestRunId[r.id] || []).find(
          (x) => x.parameter_code === 'burning_duration' && x.raw_value !== null
        );
        if (!m) return null;
        return {
          runId: r.id.replace('TR-', ''),
          durationS: m.raw_value,
          o2Pct: r.experimental_conditions.oxygen_pct_vol,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [filteredRuns, measurementsByTestRunId]);

  // Chart 3: Oxygen Concentration vs Burning Duration / Suppression Envelope
  const suppressionEnvelopeData = useMemo(() => {
    return filteredRuns
      .map((r) => {
        const o2 = r.experimental_conditions.oxygen_pct_vol;
        const vel = r.experimental_conditions.airflow_cm_s;
        if (o2 === null || vel === null) return null;
        return {
          runId: r.id,
          o2Pct: o2,
          airflowCmS: vel,
          inv: investigationById[r.investigation_id]?.short_name || r.investigation_id,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [filteredRuns, investigationById]);

  const firelineFindings = useMemo(() => {
    return findings.filter(
      (f) =>
        f.module_tags.includes('FIRELINE') &&
        (invFilter === 'all' || f.investigation_id === invFilter)
    );
  }, [findings, invFilter]);

  const activeRun =
    filteredRuns.find((r) => r.id === selectedRunId) || filteredRuns[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Module 1 • FIRELINE"
        badgeColor="red"
        title="Combustion & Fire-Safety Intelligence"
        subtitle="Analyze microgravity material flammability, flame spread dynamics, heat release, and suppression boundaries across NASA PSI investigations."
      />

      {/* A. Combustion Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          label="Combustion Investigations"
          value={firelineInvs.length}
          sublabel="BASS-II, Saffire-I/II/III, FLEX, SPICE"
          icon={Flame}
          accent="red"
        />
        <KPIStatCard
          label="Matching Test Runs"
          value={filteredRuns.length}
          sublabel={`of ${firelineRuns.length} combustion runs`}
          icon={FlaskConical}
          accent="cyan"
        />
        <KPIStatCard
          label="Combustion Measurements"
          value={combustionMeasurements.length}
          sublabel="Condition & outcome records"
          icon={Activity}
          accent="teal"
        />
        <KPIStatCard
          label="Materials Represented"
          value={uniqueFuels.length}
          sublabel="Polymers, fabrics, droplets, gases"
          icon={Layers}
          accent="amber"
        />
      </div>

      {/* B. Experimental Explorer Filters */}
      <FilterPanel
        title="Combustion Experiment Filters"
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
            <option value="all">All FIRELINE Investigations</option>
            {firelineInvs.map((i) => (
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
            <option value="all">All Materials ({uniqueFuels.length})</option>
            {uniqueFuels.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
            Oxygen Condition
          </label>
          <select
            value={o2Filter}
            onChange={(e) => setO2Filter(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
          >
            <option value="all">All O₂ Concentrations</option>
            <option value="normoxic">Normoxic (≥ 20% O₂)</option>
            <option value="hypoxic">Reduced / Diluent (&lt; 20% O₂)</option>
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
            <option value="all">All Flow Regimes</option>
            <option value="quiescent">Quiescent (0 cm/s)</option>
            <option value="low">Low Convection (1–10 cm/s)</option>
            <option value="elevated">Elevated Flow (&gt; 10 cm/s)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7] mb-1">
            Gravity Regime
          </label>
          <select
            value={gravityFilter}
            onChange={(e) => setGravityFilter(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-slate-800 dark:text-[#F4F7FC]"
          >
            <option value="all">All Gravity Regimes</option>
            {uniqueGravities.map((g) => (
              <option key={g} value={g}>
                {g.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </FilterPanel>

      {/* C. Visualizations */}
      {filteredRuns.length === 0 ? (
        <EmptyState
          title="No combustion runs match these filters"
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard
              title="Flame Spread Rate by Test Run"
              subtitle="Only runs with reported flame_spread_rate"
              unitNote="Y-axis: mm/s (SI canonical: m/s)"
            >
              {flameSpreadData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={flameSpreadData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
                    <XAxis dataKey="runId" tick={{ fontSize: 10, fill: '#9FB1C7' }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#07172B',
                        borderColor: '#1A3456',
                        color: '#F4F7FC',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="spreadRateMmS"
                      name="Flame Spread (mm/s)"
                      fill="#FC3D21"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[230px] flex items-center justify-center text-xs text-slate-500 dark:text-[#9FB1C7]">
                  No flame spread measurements in current filter selection.
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Burning Duration Distribution"
              subtitle="Total elapsed burn time across runs"
              unitNote="Y-axis: seconds (s)"
            >
              {burningDurationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={burningDurationData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
                    <XAxis dataKey="runId" tick={{ fontSize: 10, fill: '#9FB1C7' }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#9FB1C7' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#07172B',
                        borderColor: '#1A3456',
                        color: '#F4F7FC',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="durationS"
                      name="Burning Duration (s)"
                      fill="#F5B942"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[230px] flex items-center justify-center text-xs text-slate-500 dark:text-[#9FB1C7]">
                  No burning duration measurements in current filter selection.
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Suppression & Convection Envelope"
              subtitle="Oxygen (% vol) vs Airflow Velocity (cm/s)"
              unitNote="X: % vol O₂ • Y: cm/s airflow"
            >
              <ResponsiveContainer width="100%" height={230}>
                <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
                  <XAxis
                    type="number"
                    dataKey="o2Pct"
                    name="Oxygen"
                    unit="%"
                    domain={[14, 23]}
                    tick={{ fontSize: 11, fill: '#9FB1C7' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="airflowCmS"
                    name="Airflow"
                    unit=" cm/s"
                    tick={{ fontSize: 11, fill: '#9FB1C7' }}
                  />
                  <ZAxis range={[70, 70]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#07172B',
                      borderColor: '#1A3456',
                      color: '#F4F7FC',
                      fontSize: '12px',
                    }}
                  />
                  <Scatter
                    name="Test Runs"
                    data={suppressionEnvelopeData}
                    fill="#38BDF8"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Interactive Test Run Selector & Tidy Measurement Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
                Select Test Run to Inspect Measurements ({filteredRuns.length})
              </h3>
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredRuns.map((tr) => (
                  <ExperimentCard
                    key={tr.id}
                    testRun={tr}
                    investigationShortName={investigationById[tr.investigation_id]?.short_name}
                    measurementCount={(measurementsByTestRunId[tr.id] || []).length}
                    selected={activeRun?.id === tr.id}
                    onSelect={(run) => setSelectedRunId(run.id)}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {activeRun && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
                      Measurements for {activeRun.id}
                    </h3>
                    <span className="text-xs font-mono text-slate-500 dark:text-[#9FB1C7]">
                      {activeRun.fuel_name}
                    </span>
                  </div>
                  <MeasurementTable measurements={measurementsByTestRunId[activeRun.id] || []} />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* D. Evidence Panel & E. Explainability Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
            Combustion Evidence Panel ({firelineFindings.length})
          </h3>
          <div className="space-y-3">
            {firelineFindings.slice(0, 6).map((f) => {
              const inv = investigationById[f.investigation_id];
              const src = sourceById[f.source_references[0]];
              return (
                <div
                  key={f.id}
                  className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-[#0B3D91] dark:text-[#38BDF8]">
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
                  <div className="text-[11px] text-amber-700 dark:text-[#F5B942] bg-amber-500/10 px-2.5 py-1.5 rounded">
                    <strong>Limitations:</strong> {f.limitations.join(' ')}
                  </div>
                  <div className="pt-1">
                    <SourceCitation source={src} sourceId={f.source_references[0]} compact />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* E. Explainability Panel */}
        <div className="lg:col-span-4">
          <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-4 sticky top-24 shadow-md">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
              <Info className="w-4 h-4 text-[#38BDF8]" />
              <span>Scientific Explainability</span>
            </div>

            {/* Dynamic Microgravity Flame Visualizer */}
            <MicrogravityFlameVisualizer />

            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
              In microgravity, the absence of buoyancy eliminates natural upward convective drafts. Flames rely on{' '}
              <strong>low-speed forced ventilation</strong> (e.g., spacecraft cabin airflow 2–25 cm/s) for oxidizer transport.
            </p>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
              <strong>Distinguishing Data Types:</strong> Official NASA PSI investigation titles and URLs shown here are verified public metadata. Numerical values in the charts and tables above are{' '}
              <span className="font-mono text-amber-700 dark:text-[#F5B942]">synthetic_demo</span>{' '}
              placeholders designed to validate the FIRELINE analytical interface.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-[#9FB1C7]">
              <strong>Why Missing Values Are Omitted:</strong> Droplet tests (FLEX) do not report planar flame spread rates, so they are excluded from the Flame Spread bar chart rather than plotted as zero.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
