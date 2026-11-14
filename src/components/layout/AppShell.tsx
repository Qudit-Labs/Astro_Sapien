import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useResearchData } from '@/context/ResearchDataContext';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, error, reload, isMockMode } = useResearchData();

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

        <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-[#9FB1C7]">
          FIRELINE Spacecraft Fire-Safety Intelligence Engine • Astro_Sapien • NASA PSI & NTRS Schema Preview
        </footer>
      </div>
    </div>
  );
};
