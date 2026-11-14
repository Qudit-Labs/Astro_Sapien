import React, { useEffect, useState } from 'react';
import { dataProvider } from './data';
import { MockDataStatusBanner } from './components/MockDataStatusBanner';
import { Investigation, TestRun, Measurement, Finding } from '@shared/types/index';
import { Flame, GitCompare, Wind, Database, CheckCircle2, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'FIRELINE' | 'TESTMATCH' | 'SMOKEWISE'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [invs, runs, meas, fnds] = await Promise.all([
          dataProvider.getInvestigations(),
          dataProvider.getTestRuns(),
          dataProvider.getMeasurements(),
          dataProvider.getFindings(),
        ]);
        setInvestigations(invs);
        setTestRuns(runs);
        setMeasurements(meas);
        setFindings(fnds);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredInvs = activeTab === 'all'
    ? investigations
    : investigations.filter((i) => i.module_tags.includes(activeTab));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <MockDataStatusBanner
        mode={dataProvider.mode}
        recordCounts={{
          investigations: investigations.length,
          testRuns: testRuns.length,
          measurements: measurements.length,
          findings: findings.length,
        }}
      />

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <Flame className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  FIRELINE
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Astro_Sapien
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  AI-Powered Spacecraft Fire-Safety Intelligence Engine
                </p>
              </div>
            </div>
          </div>

          {/* Module Selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Modules
            </button>
            <button
              onClick={() => setActiveTab('FIRELINE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'FIRELINE'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              FIRELINE
            </button>
            <button
              onClick={() => setActiveTab('TESTMATCH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'TESTMATCH'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-sky-400" />
              TESTMATCH
            </button>
            <button
              onClick={() => setActiveTab('SMOKEWISE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'SMOKEWISE'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-purple-400" />
              SMOKewise
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Quick Architectural Foundation Banner */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-orange-400 tracking-wider">
                Phase 1 Foundation Complete
              </span>
              <h2 className="text-lg font-semibold text-white mt-1">
                Canonical Microgravity Combustion Data Foundation
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Unified data schemas (JSON Schema + TypeScript + Zod) established for 8 official NASA PSI investigations,
                supporting FIRELINE (Combustion Intelligence), TESTMATCH (Experiment Similarity), and SMOKewise (Aerosol Analysis).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4" />
                Validated via Ajv & Zod
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-center">
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="text-2xl font-bold font-mono text-white">{investigations.length}</div>
              <div className="text-xs text-slate-400 mt-1">NASA Investigations</div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="text-2xl font-bold font-mono text-sky-400">{testRuns.length}</div>
              <div className="text-xs text-slate-400 mt-1">Synthetic Test Runs</div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="text-2xl font-bold font-mono text-orange-400">{measurements.length}</div>
              <div className="text-xs text-slate-400 mt-1">Tidy Measurements</div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <div className="text-2xl font-bold font-mono text-purple-400">{findings.length}</div>
              <div className="text-xs text-slate-400 mt-1">Illustrative Findings</div>
            </div>
          </div>
        </section>

        {/* Investigations Explorer */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-400" />
              NASA Investigations ({filteredInvs.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Filter: {activeTab}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-sm">
              Loading research data from {dataProvider.mode} provider...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInvs.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-orange-300 font-medium">
                          {inv.psi_id}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">
                          {inv.short_name} — {inv.name}
                        </h4>
                      </div>
                      <a
                        href={inv.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition"
                        title="View on NASA PSI Repository"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {inv.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {inv.module_tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                            tag === 'FIRELINE'
                              ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                              : tag === 'TESTMATCH'
                              ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                              : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Pillar: {inv.fire_safety_pillar}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[240px]">
                      Fuels: {inv.fuel_types.join(', ')}
                    </span>
                    <span className="font-mono text-amber-400/90 text-[11px]">
                      is_mock_metadata: true
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 px-4 text-center text-xs text-slate-500">
        FIRELINE Spacecraft Fire-Safety Intelligence Engine • NASA Space App Challenge • Astro_Sapien
      </footer>
    </div>
  );
};

export default App;
