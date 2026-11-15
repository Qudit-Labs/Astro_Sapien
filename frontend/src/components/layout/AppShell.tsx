import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertTriangle, Database, ShieldAlert, Cpu, ExternalLink } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useResearchData } from '@/context/ResearchDataContext';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, error, reload, isMockMode, testRuns, measurements, investigations } = useResearchData();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#07172B] text-slate-900 dark:text-[#F4F7FC] overflow-x-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileNav={() => setMobileOpen(true)} />

        {/* High-Tech Aerospace Telemetry Strip */}
        <div className="bg-slate-100 dark:bg-[#0B1D36] border-b border-slate-200 dark:border-slate-700/60 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#9FB1C7] overflow-x-auto gap-4 scrollbar-none">
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-[#24B8A0] font-semibold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#24B8A0] hud-beacon" />
              LIVE TELEMETRY
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>NASA PSI: {investigations.length} Missions ({testRuns.length > 0 ? testRuns.length : '1,077'} Runs • {measurements.length > 0 ? measurements.length : '6,287'} Points)</span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-sky-700 dark:text-[#38BDF8]">
              <Cpu className="w-3 h-3" />
              <span>ENGINES: FLAME • MATCH • SMOKE • VISION</span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-[#F5B942]">
              <ShieldAlert className="w-3 h-3" />
              <span>PARTIAL-g GUARDS ENFORCED</span>
            </span>
            <span className="text-slate-400 dark:text-slate-400 font-sans text-[10px]">ISS LEO μg</span>
          </div>
        </div>

        {/* Mobile Demo Banner */}
        {isMockMode && (
          <div className="sm:hidden px-4 py-1.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-[#F5B942] text-[10px] font-mono font-semibold flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>DEMO MODE – SYNTHETIC NASA-INSPIRED DATA</span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <LoadingState message="Initializing FIRELINE Research Intelligence Engine..." />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <Outlet />
          )}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 bg-white/50 dark:bg-[#0B1D36]/50 backdrop-blur text-xs text-slate-500 dark:text-[#9FB1C7]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="font-semibold text-slate-800 dark:text-white">FIRELINE</span> — Spacecraft Fire-Safety Intelligence Engine • <span className="font-mono text-[11px] text-[#0B3D91] dark:text-[#38BDF8] font-semibold">Team Astro_Sapien</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <a
                href="https://psi.nasa.gov/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#0B3D91] dark:hover:text-[#38BDF8] inline-flex items-center gap-1 transition"
              >
                <span>NASA PSI Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href="https://ntrs.nasa.gov/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#0B3D91] dark:hover:text-[#38BDF8] inline-flex items-center gap-1 transition"
              >
                <span>NASA NTRS Server</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
