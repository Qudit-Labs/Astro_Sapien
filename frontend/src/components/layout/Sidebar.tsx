import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Flame,
  GitCompare,
  Wind,
  Bot,
  FileText,
  BookOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { FirelineLogo } from '../common/FirelineLogo';

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/explorer', label: 'Research Explorer', icon: Compass },
  { to: '/fireline', label: 'FIRELINE', icon: Flame },
  { to: '/testmatch', label: 'TESTMATCH', icon: GitCompare },
  { to: '/smokewise', label: 'SMOKewise', icon: Wind },
  { to: '/assistant', label: 'AI Research Assistant', icon: Bot },
  { to: '/reports', label: 'Research Reports', icon: FileText },
  { to: '/sources', label: 'Sources & Methodology', icon: BookOpen },
  { to: '/auth', label: 'Researcher Portal', icon: ShieldCheck },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const navContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B1D36] border-r border-slate-200 dark:border-slate-800">
      {/* Brand header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <FirelineLogo compact={collapsed && !isMobile} />
        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#9FB1C7] dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#9FB1C7] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={isMobile ? onCloseMobile : undefined}
              title={collapsed && !isMobile ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0B3D91] text-white shadow-sm'
                    : 'text-slate-700 dark:text-[#9FB1C7] hover:bg-slate-100 dark:hover:bg-[#10243D] hover:text-slate-900 dark:hover:text-[#F4F7FC]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Mission Status */}
      {(!collapsed || isMobile) && (
        <div className="p-3 m-2.5 rounded-lg bg-slate-100 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-[#F4F7FC]">
            <span className="w-2 h-2 rounded-full bg-[#24B8A0]" />
            <span>ISS / PSI SCHEMA READY</span>
          </div>
          <p className="text-slate-500 dark:text-[#9FB1C7] mt-1">
            Unified Model: FIRELINE • TESTMATCH • SMOKewise
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{navContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
