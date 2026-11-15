import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Flame,
  GitCompare,
  Wind,
  Eye,
  Bot,
  FileText,
  BookOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Radio,
  Sparkles,
} from 'lucide-react';
import { FirelineLogo } from '../common/FirelineLogo';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badge?: string;
  badgeClass?: string;
  accentColor: string;
  subtext?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  tag?: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'mission-control',
    title: 'Mission Control',
    items: [
      {
        to: '/',
        label: 'Overview',
        icon: LayoutDashboard,
        accentColor: '#38BDF8',
        subtext: 'Executive Summary',
      },
      {
        to: '/explorer',
        label: 'Research Explorer',
        icon: Compass,
        accentColor: '#38BDF8',
        subtext: 'Datasets & Geometry',
      },
    ],
  },
  {
    id: 'tri-modules',
    title: 'Tri-Capability Suite',
    tag: 'μg',
    items: [
      {
        to: '/fireline',
        label: 'FIRELINE',
        icon: Flame,
        accentColor: '#FC3D21',
        badge: 'M1',
        badgeClass: 'bg-red-500/15 text-[#FC3D21] border-red-500/30',
        subtext: 'Combustion & LOC',
      },
      {
        to: '/testmatch',
        label: 'TESTMATCH',
        icon: GitCompare,
        accentColor: '#38BDF8',
        badge: 'M2',
        badgeClass: 'bg-sky-500/15 text-[#38BDF8] border-sky-500/30',
        subtext: 'Comparability S & C',
      },
      {
        to: '/smokewise',
        label: 'SMOKewise',
        icon: Wind,
        accentColor: '#24B8A0',
        badge: 'M3',
        badgeClass: 'bg-teal-500/15 text-[#24B8A0] border-teal-500/30',
        subtext: 'Aerosol Dynamics',
      },
      {
        to: '/smokevision',
        label: 'SMOKEVISION',
        icon: Eye,
        accentColor: '#38BDF8',
        badge: 'M4',
        badgeClass: 'bg-cyan-500/15 text-[#38BDF8] border-cyan-500/30 font-semibold',
        subtext: 'CV & Accumulation',
      },
    ],
  },
  {
    id: 'intelligence',
    title: 'Intelligence & Synthesis',
    items: [
      {
        to: '/assistant',
        label: 'AI Assistant',
        icon: Bot,
        accentColor: '#F5B942',
        badge: 'LIVE RAG',
        badgeClass: 'bg-amber-500/15 text-[#F5B942] border-amber-500/30 font-semibold',
        subtext: 'Gemini Grounding',
      },
      {
        to: '/reports',
        label: 'Research Reports',
        icon: FileText,
        accentColor: '#A78BFA',
        subtext: 'Traceable Insights',
      },
      {
        to: '/sources',
        label: 'Sources & Provenance',
        icon: BookOpen,
        accentColor: '#94A3B8',
        subtext: 'NASA PSI Citations',
      },
    ],
  },
  {
    id: 'clearance',
    title: 'Security & Access',
    items: [
      {
        to: '/auth',
        label: 'Researcher Portal',
        icon: ShieldCheck,
        accentColor: '#38BDF8',
        badge: 'ID PASS',
        badgeClass: 'bg-cyan-500/15 text-[#38BDF8] border-cyan-500/30',
        subtext: 'Digital Credentials',
      },
    ],
  },
];

// Flat export for backward compatibility
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

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
  const navContent = (isMobile: boolean) => {
    const isCompact = collapsed && !isMobile;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#07172B] border-r border-slate-200 dark:border-slate-800/80 shadow-xl transition-all duration-300">
        {/* Brand header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 shrink-0 bg-white/50 dark:bg-[#07172B]/60 backdrop-blur-md">
          <FirelineLogo compact={isCompact} />
          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#9FB1C7] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#9FB1C7] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition duration-150"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-[#38BDF8]" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-[#38BDF8]" />
              )}
            </button>
          )}
        </div>

        {/* Grouped Navigation links */}
        <nav
          className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 scrollbar-thin"
          aria-label="Main Navigation"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              {/* Group Heading */}
              {!isCompact ? (
                <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-mono font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
                  <span>{group.title}</span>
                  {group.tag && (
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-[#38BDF8] border border-sky-500/20 text-[9px] font-mono">
                      {group.tag}
                    </span>
                  )}
                </div>
              ) : (
                <div className="my-2 mx-auto w-6 border-t border-slate-200 dark:border-slate-800" />
              )}

              {/* Items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={isMobile ? onCloseMobile : undefined}
                    title={isCompact ? item.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-500/15 via-[#0B3D91]/20 to-transparent dark:from-[#38BDF8]/20 dark:via-[#0B3D91]/30 dark:to-transparent text-slate-900 dark:text-white font-semibold shadow-sm'
                          : 'text-slate-600 dark:text-[#9FB1C7] hover:bg-slate-100/80 dark:hover:bg-[#10243D]/70 hover:text-slate-900 dark:hover:text-[#F4F7FC]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active vertical laser indicator */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full shadow-sm"
                            style={{
                              backgroundColor: item.accentColor,
                              boxShadow: `0 0 10px ${item.accentColor}`,
                            }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                            isCompact ? 'mx-auto' : ''
                          }`}
                        >
                          <Icon
                            className="w-4 h-4 transition-colors"
                            style={{
                              color: isActive ? item.accentColor : undefined,
                            }}
                          />
                        </div>

                        {/* Text and Badge */}
                        {!isCompact && (
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                            <div className="truncate">
                              <span className="block truncate leading-tight">
                                {item.label}
                              </span>
                              {item.subtext && (
                                <span className="block truncate text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                  {item.subtext}
                                </span>
                              )}
                            </div>

                            {item.badge && (
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 uppercase ${
                                  item.badgeClass ||
                                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Mission Telemetry Card */}
        {!isCompact && (
          <div className="p-3 m-2.5 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-[#0B1D36]/80 dark:to-[#07172B] border border-slate-200 dark:border-slate-700/60 shadow-md hud-panel relative overflow-hidden">
            {/* Top row */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-[#38BDF8]">
                <Radio className="w-3 h-3 text-[#24B8A0] animate-pulse" />
                <span>ISS LEO μg</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-teal-500/15 text-[#24B8A0] border border-teal-500/30 text-[9px]">
                ONLINE
              </span>
            </div>

            {/* Description */}
            <div className="mt-2 text-[11px] text-slate-600 dark:text-[#9FB1C7] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F5B942] shrink-0" />
              <span className="truncate">NASA PSI Microgravity Hub</span>
            </div>

            {/* Quick Metrics */}
            <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <div>
                <span className="text-slate-400 dark:text-slate-500">Missions:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-200">8</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 dark:text-slate-500">Test Runs:</span>{' '}
                <strong className="text-slate-700 dark:text-slate-200">18</strong>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Mini Telemetry Indicator */}
        {isCompact && (
          <div className="p-2 mb-2 flex justify-center" title="ISS LEO μg • ONLINE">
            <div className="w-3 h-3 rounded-full bg-[#24B8A0] hud-beacon" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{navContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
