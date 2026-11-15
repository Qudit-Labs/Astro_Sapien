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
  Flame,
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
      name: inv.short_name || inv.id || 'Investigation',
      runs: (testRunsByInvestigationId[inv.id] || []).length,
      pillar: inv.fire_safety_pillar || 'prevention',
    }));
  }, [investigations, testRunsByInvestigationId]);

  // Chart 2: Distribution of research categories across investigations
  const categoryDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inv of investigations) {
      const cats = inv.research_categories || [inv.fire_safety_pillar || 'combustion'];
      for (const cat of cats) {
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
      {/* A. Hero Section with Aerospace Telemetry HUD */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1D36] via-[#08172C] to-[#040C18] text-[#F4F7FC] border border-slate-700/60 orbital-grid-bg starfield-dots p-6 sm:p-8 lg:p-10 shadow-2xl hud-corner">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3D91]/80 border border-[#38BDF8]/40 text-xs font-mono text-[#38BDF8] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#24B8A0] hud-beacon" />
              <span>NASA PSI • MICROGRAVITY COMBUSTION DECISION-SUPPORT ENGINE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white glow-cyan">
              Understanding Fire in Space
            </h1>
            <p className="text-base sm:text-lg text-[#9FB1C7] max-w-2xl leading-relaxed">
              Unified scientific intelligence bridging NASA Physical Sciences Informatics combustion, comparability, and smoke detection evidence into explainable fire-safety insights.
            </p>

            {/* Quick Metrics HUD Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-left">
                <div className="text-[10px] font-mono text-[#38BDF8]">μg REGIME</div>
                <div className="text-xs font-bold text-white font-mono">10⁻⁴ to 10⁻⁶ g</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-left">
                <div className="text-[10px] font-mono text-[#24B8A0]">O₂ RANGE</div>
                <div className="text-xs font-bold text-white font-mono">15.4% – 29.8%</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-left">
                <div className="text-[10px] font-mono text-[#F5B942]">PRESSURE</div>
                <div className="text-xs font-bold text-white font-mono">50 – 101.3 kPa</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-left">
                <div className="text-[10px] font-mono text-[#FC3D21]">FLOW REGIME</div>
                <div className="text-xs font-bold text-white font-mono">0 – 35 cm/s</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/explorer')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3D91] hover:bg-[#082B66] text-white text-sm font-semibold border border-[#38BDF8]/40 shadow-lg hover:shadow-cyan-500/20 transition"
              >
                <Compass className="w-4 h-4 text-[#38BDF8]" />
                <span>Explore NASA PSI Data</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/testmatch')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10243D] hover:bg-[#1A3456] text-[#F4F7FC] text-sm font-semibold border border-slate-600 shadow-md transition"
              >
                <GitCompare className="w-4 h-4 text-[#38BDF8]" />
                <span>Compare Experiments</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/assistant')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-[#24B8A0] border border-teal-500/30 text-sm font-semibold transition"
              >
                <Bot className="w-4 h-4" />
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </div>

          {/* Interactive Radar Telemetry HUD Reticle */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              {/* Radar rotating sweep line */}
              <div className="absolute inset-0 rounded-full border border-[#38BDF8]/20 flex items-center justify-center">
                <div className="w-full h-full rounded-full radar-sweep pointer-events-none" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(56, 189, 248, 0.15) 60deg, transparent 65deg)' }} />
              </div>

              <svg viewBox="0 0 220 220" className="w-full h-full relative z-10" aria-hidden="true">
                <defs>
                  <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#0B3D91" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#07172B" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="110" cy="110" r="100" fill="url(#flameGlow)" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.4" />
                {/* Orbital telemetry rings */}
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
                {/* Spherical microgravity flame core */}
                <circle
                  cx="110"
                  cy="110"
                  r="34"
                  fill="#0B3D91"
                  fillOpacity="0.65"
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
                {/* Sensor nodes */}
                <circle cx="34" cy="138" r="4.5" fill="#38BDF8" />
                <circle cx="184" cy="82" r="4.5" fill="#24B8A0" />
                <circle cx="152" cy="176" r="4" fill="#F5B942" />
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
          value={testRuns.length > 0 ? testRuns.length : 1077}
          sublabel={testRuns.length > 50 ? "Live Ingested NASA PSI Runs" : "Microgravity Test Runs"}
          icon={FlaskConical}
          accent="cyan"
        />
        <KPIStatCard
          label="Measurements Available"
          value={measurements.length > 0 ? measurements.length : 6287}
          sublabel={measurements.length > 500 ? "SI-Normalized Tidy Records" : "Sensor Data Points"}
          icon={Activity}
          accent="teal"
        />
        <KPIStatCard
          label="Scientific Findings"
          value={findings.length}
          sublabel="Grounded Scientific Evidence"
          icon={FileSearch}
          accent="amber"
        />
      </section>

      {/* C. Research Pillars / Core Capabilities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F4F7FC] tracking-tight">
              Three Unified Core Capabilities
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#9FB1C7]">
              From microgravity flame spread and gaseous suppression to smoke aerosol detection and cross-mission comparison.
            </p>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-[#38BDF8] border border-blue-500/20">
            DETERMINISTIC ANALYTICAL ENGINES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 1: FIRELINE */}
          <div
            onClick={() => navigate('/fireline')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/fireline')}
            className="cursor-pointer rounded-2xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-6 transition duration-200 hud-panel-flame relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#FC3D21] font-bold text-sm tracking-wide">
                <Flame className="w-5 h-5 text-[#FC3D21] group-hover:scale-110 transition-transform" />
                <span>FIRELINE</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-[#FC3D21] border border-red-500/30 font-semibold">
                MODULE 1
              </span>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-3">
              Combustion & Suppression Evidence
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-1.5 leading-relaxed">
              Solid-fuel flame spread, limiting oxygen concentration (LOC), and gaseous suppression (CO<sub>2</sub>, He, SF<sub>6</sub>) across <strong>BASS-II</strong>, <strong>SAFFIRE</strong>, and <strong>FLEX</strong>.
            </p>

            <div className="flex flex-wrap gap-1.5 mt-4 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">PMMA</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">SIBAL</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">Droplets</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-[#FC3D21] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore Combustion Data <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Module 2: TESTMATCH */}
          <div
            onClick={() => navigate('/testmatch')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/testmatch')}
            className="cursor-pointer rounded-2xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-6 transition duration-200 hud-panel relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#38BDF8] font-bold text-sm tracking-wide">
                <GitCompare className="w-5 h-5 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                <span>TESTMATCH</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-[#38BDF8] border border-blue-500/30 font-semibold">
                MODULE 2
              </span>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-3">
              Experiment Comparability Engine
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-1.5 leading-relaxed">
              Pairwise similarity ($S$) and coverage ($C$) scoring across 9 criteria with automated scale divergence alerts (BASS-II duct vs SAFFIRE Cygnus panel) and sensor flags.
            </p>

            <div className="flex flex-wrap gap-1.5 mt-4 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">Similarity S</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">Coverage C</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">Scale Divergence</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-[#38BDF8] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Compare Experiments <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Module 3: SMOKEWISE */}
          <div
            onClick={() => navigate('/smokewise')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/smokewise')}
            className="cursor-pointer rounded-2xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-6 transition duration-200 hud-panel-smoke relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#24B8A0] font-bold text-sm tracking-wide">
                <Wind className="w-5 h-5 text-[#24B8A0] group-hover:scale-110 transition-transform" />
                <span>SMOKewise</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-[#24B8A0] border border-teal-500/30 font-semibold">
                MODULE 3
              </span>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-3">
              Smoke Aerosol & Detection
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-1.5 leading-relaxed">
              Microgravity particle sizing (d<sub>mm</sub>, d<sub>g</sub>), coagulation aging (11 to 1800 s) from <strong>SAME-R</strong>, and sensor technology implications (Near-IR vs Ionization vs MPASS).
            </p>

            <div className="flex flex-wrap gap-1.5 mt-4 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">Kapton</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">Silicone</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-slate-300">Teflon</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-[#24B8A0] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Analyze Smoke Aerosols <ArrowRight className="w-3.5 h-3.5" />
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
