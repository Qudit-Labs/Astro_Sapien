import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Database,
  FlaskConical,
  Activity,
  FileSearch,
  ShieldAlert,
  Radio,
  FlameKindling,
  Compass,
  GitCompare,
  Wind,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { useResearchData } from '@/context/ResearchDataContext';
import { KPIStatCard } from '@/components/common/KPIStatCard';
import { ChartCard } from '@/components/common/ChartCard';
import { EvidenceBadge } from '@/components/common/EvidenceBadge';
import { SourceCitation } from '@/components/common/SourceCitation';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    investigations,
    testRuns,
    measurements,
    findings,
    investigationById,
    sourceById,
    testRunsByInvestigationId,
  } = useResearchData();

  // Chart 1: Experiments by investigation
  const experimentsByInvData = useMemo(() => {
    return investigations.map((inv) => ({
      name: inv.short_name,
      runs: (testRunsByInvestigationId[inv.id] || []).length,
      pillar: inv.fire_safety_pillar,
    }));
  }, [investigations, testRunsByInvestigationId]);

  // Chart 2: Distribution of research categories across investigations
  const categoryDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inv of investigations) {
      for (const cat of inv.research_categories) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [investigations]);

  // Chart 3: Measurements by parameter category
  const measByParamCatData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of measurements) {
      const label = m.parameter_category.replace(/_/g, ' ');
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [measurements]);

  // Featured findings (diverse across modules)
  const featuredFindings = useMemo(() => {
    return findings.slice(0, 4);
  }, [findings]);

  return (
    <div className="space-y-8">
      {/* A. Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0B1D36] text-[#F4F7FC] border border-slate-700/60 orbital-grid-bg starfield-dots p-6 sm:p-8 lg:p-10 shadow-lg">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3D91]/60 border border-[#38BDF8]/30 text-xs font-mono text-[#38BDF8]">
              <span className="w-2 h-2 rounded-full bg-[#24B8A0]" />
              MISSION CONTROL • MICROGRAVITY COMBUSTION INTELLIGENCE
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Understanding Fire in Space
            </h1>
            <p className="text-base sm:text-lg text-[#9FB1C7] max-w-2xl leading-relaxed">
              NASA microgravity combustion research, connected through scientific intelligence.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/explorer')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white text-sm font-medium border border-[#38BDF8]/40 transition"
              >
                <Compass className="w-4 h-4 text-[#38BDF8]" />
                Explore NASA Research
              </button>
              <button
                type="button"
                onClick={() => navigate('/testmatch')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#10243D] hover:bg-[#1A3456] text-[#F4F7FC] text-sm font-medium border border-slate-600 transition"
              >
                <GitCompare className="w-4 h-4 text-[#38BDF8]" />
                Compare Experiments
              </button>
            </div>
          </div>

          {/* Lightweight Abstract Spacecraft / Flame / Orbit SVG */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
              <svg viewBox="0 0 220 220" className="w-full h-full" aria-hidden="true">
                <defs>
                  <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#0B3D91" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#07172B" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="110" cy="110" r="100" fill="url(#flameGlow)" />
                {/* Orbital ellipses */}
                <ellipse
                  cx="110"
                  cy="110"
                  rx="88"
                  ry="32"
                  transform="rotate(-22 110 110)"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                  strokeDasharray="4 4"
                />
                <ellipse
                  cx="110"
                  cy="110"
                  rx="76"
                  ry="28"
                  transform="rotate(28 110 110)"
                  fill="none"
                  stroke="#24B8A0"
                  strokeWidth="1.2"
                  strokeOpacity="0.4"
                />
                {/* Spherical microgravity flame */}
                <circle
                  cx="110"
                  cy="110"
                  r="34"
                  fill="#0B3D91"
                  fillOpacity="0.55"
                  stroke="#38BDF8"
                  strokeWidth="1.8"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="22"
                  fill="#FC3D21"
                  fillOpacity="0.85"
                />
                <circle cx="110" cy="110" r="10" fill="#F5B942" />
                {/* Orbiting sensor nodes */}
                <circle cx="34" cy="138" r="4" fill="#38BDF8" />
                <circle cx="184" cy="82" r="4" fill="#24B8A0" />
                <circle cx="152" cy="176" r="3.5" fill="#F5B942" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* B. KPI Cards (derived dynamically from shared datasets) */}
      <section aria-label="Key Platform Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          label="Investigations Indexed"
          value={investigations.length}
          sublabel="NASA PSI Microgravity Missions"
          icon={Database}
          accent="blue"
        />
        <KPIStatCard
          label="Experimental Runs"
          value={testRuns.length}
          sublabel="Synthetic Demo Configurations"
          icon={FlaskConical}
          accent="cyan"
        />
        <KPIStatCard
          label="Measurements Available"
          value={measurements.length}
          sublabel="SI-Normalized Tidy Records"
          icon={Activity}
          accent="teal"
        />
        <KPIStatCard
          label="Scientific Findings"
          value={findings.length}
          sublabel="Illustrative Evidence Summaries"
          icon={FileSearch}
          accent="amber"
        />
      </section>

      {/* C. Research Pillars */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-[#F4F7FC]">
          Spacecraft Fire-Safety Research Pillars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/fireline')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/fireline')}
            className="cursor-pointer rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 hover:border-[#38BDF8] p-5 transition"
          >
            <div className="flex items-center gap-2.5 text-[#0B3D91] dark:text-[#38BDF8] font-semibold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Prevention</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-2 leading-relaxed">
              Material flammability screening, Limiting Oxygen Concentration (LOC), and thickness effects from <strong>BASS-II</strong> and <strong>SAFFIRE</strong>.
            </p>
            <div className="mt-3 text-xs font-mono text-[#0B3D91] dark:text-[#38BDF8] inline-flex items-center gap-1">
              Open FIRELINE <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => navigate('/smokewise')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/smokewise')}
            className="cursor-pointer rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 hover:border-[#24B8A0] p-5 transition"
          >
            <div className="flex items-center gap-2.5 text-teal-700 dark:text-[#24B8A0] font-semibold text-sm">
              <Radio className="w-5 h-5" />
              <span>Detection</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-2 leading-relaxed">
              Smoke aerosol particle sizing, coagulation aging, and detector chamber response from <strong>SAME</strong> and <strong>SAME-R</strong>.
            </p>
            <div className="mt-3 text-xs font-mono text-teal-700 dark:text-[#24B8A0] inline-flex items-center gap-1">
              Open SMOKewise <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => navigate('/fireline')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/fireline')}
            className="cursor-pointer rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 hover:border-[#FC3D21] p-5 transition"
          >
            <div className="flex items-center gap-2.5 text-[#FC3D21] font-semibold text-sm">
              <FlameKindling className="w-5 h-5" />
              <span>Suppression</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-2 leading-relaxed">
              Radiative extinction limits, inert gas dilution, and low-velocity blow-off from <strong>FLEX</strong>, <strong>SPICE</strong>, and <strong>BASS-II</strong>.
            </p>
            <div className="mt-3 text-xs font-mono text-[#FC3D21] inline-flex items-center gap-1">
              Analyze Extinction <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* D. Research Activity Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Experiments by Investigation"
          subtitle="Synthetic test run counts per NASA PSI mission"
          unitNote="Unit: Count of TestRun records"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={experimentsByInvData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9FB1C7' }}
                angle={-25}
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9FB1C7' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#07172B',
                  borderColor: '#1A3456',
                  color: '#F4F7FC',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="runs" name="Test Runs" radius={[4, 4, 0, 0]}>
                {experimentsByInvData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={
                      entry.pillar === 'detection'
                        ? '#24B8A0'
                        : entry.pillar === 'suppression'
                        ? '#FC3D21'
                        : '#38BDF8'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Research Category Distribution"
          subtitle="Top scientific domains across investigations"
          unitNote="Unit: Investigation tag frequency"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={categoryDistData}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9FB1C7' }} />
              <YAxis
                dataKey="category"
                type="category"
                width={115}
                tick={{ fontSize: 10, fill: '#9FB1C7' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#07172B',
                  borderColor: '#1A3456',
                  color: '#F4F7FC',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" name="Investigations" fill="#0B3D91" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Measurements by Parameter Category"
          subtitle="Tidy measurement distribution across domains"
          unitNote="Unit: Count of Measurement records"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={measByParamCatData}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(159,177,199,0.15)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9FB1C7' }} />
              <YAxis
                dataKey="category"
                type="category"
                width={115}
                tick={{ fontSize: 10, fill: '#9FB1C7' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#07172B',
                  borderColor: '#1A3456',
                  color: '#F4F7FC',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" name="Measurements" fill="#24B8A0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* E. Featured Scientific Findings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#F4F7FC]">
            Featured Scientific Findings (Illustrative Synthetic Examples)
          </h2>
          <button
            type="button"
            onClick={() => navigate('/fireline')}
            className="text-xs font-medium text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
          >
            View all {findings.length} findings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredFindings.map((f) => {
            const inv = investigationById[f.investigation_id];
            const src = sourceById[f.source_references[0]];
            return (
              <div
                key={f.id}
                className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-2.5"
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
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#9FB1C7] leading-relaxed">
                  {f.summary}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-[#9FB1C7]">{f.research_category}</span>
                  <SourceCitation source={src} sourceId={f.source_references[0]} compact />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* F. Quick Actions */}
      <section className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC] mb-3">
          Quick Analytical Workflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => navigate('/explorer')}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 hover:border-[#38BDF8] text-left transition"
          >
            <Compass className="w-5 h-5 text-[#38BDF8] shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FC]">
                Explore NASA Research
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#9FB1C7]">
                Search & filter 8 PSI missions
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/testmatch')}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 hover:border-[#38BDF8] text-left transition"
          >
            <GitCompare className="w-5 h-5 text-[#38BDF8] shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FC]">
                Compare Experiments
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#9FB1C7]">
                Launch TESTMATCH workspace
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/smokewise')}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 hover:border-[#24B8A0] text-left transition"
          >
            <Wind className="w-5 h-5 text-[#24B8A0] shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FC]">
                Analyze Smoke Behaviour
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#9FB1C7]">
                Open SMOKewise aerosol lab
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/assistant')}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 hover:border-[#F5B942] text-left transition"
          >
            <Bot className="w-5 h-5 text-[#F5B942] shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FC]">
                Ask AI Research Assistant
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#9FB1C7]">
                Query synthetic evidence base
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
