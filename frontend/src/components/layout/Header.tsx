import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  AlertTriangle,
  LogOut,
  UserPlus,
  KeyRound,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useResearchData } from '@/context/ResearchDataContext';
import { SearchBar } from '../common/SearchBar';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const { isMockMode, globalSearch, setGlobalSearch } = useResearchData();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleGlobalSearchChange = (val: string) => {
    setGlobalSearch(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate('/explorer');
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#07172B]/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
      {/* Left: Mobile menu + Global Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-[#9FB1C7] hover:bg-slate-100 dark:hover:bg-[#10243D]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-full max-w-md" onKeyDown={handleSearchKeyDown}>
          <SearchBar
            value={globalSearch}
            onChange={handleGlobalSearchChange}
            placeholder="Global search (Press Enter to open Explorer)..."
            ariaLabel="Global search"
          />
        </div>
      </div>

      {/* Right: Mock/Live indicator, theme toggle, user session */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {!isMockMode ? (
          <div
            title="Connected directly to live FastAPI backend and Supabase PostgreSQL microgravity database."
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-[#24B8A0] text-[11px] font-mono font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-[#24B8A0] animate-pulse" />
            <span>LIVE SUPABASE · 1,077 NASA RUNS</span>
          </div>
        ) : (
          <div
            title="All experimental measurements and findings are synthetic demonstrations."
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-[#F5B942] text-[11px] font-mono font-semibold"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>DEMO MODE – SYNTHETIC NASA-INSPIRED DATA</span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10243D] text-slate-700 dark:text-[#F4F7FC] hover:border-[#38BDF8] transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#F5B942]" /> : <Moon className="w-4 h-4 text-[#0B3D91]" />}
        </button>

        {/* User Session / Sign Up Button */}
        {isAuthenticated && user ? (
          <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#10243D] transition"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-xs font-bold border border-[#38BDF8]/40 shadow-sm">
                {initials}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-800 dark:text-[#F4F7FC] truncate max-w-[130px]">
                  {user.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-[#9FB1C7] truncate max-w-[130px]">
                  {user.organization}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0B1D36] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 text-xs space-y-3"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">{user.name}</div>
                  <div className="text-slate-500 dark:text-[#9FB1C7] text-[11px] truncate">{user.email}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-[#24B8A0] text-[10px] font-mono">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user.clearanceLevel}</span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-600 dark:text-[#9FB1C7] text-[11px]">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-white">Organization:</span>{' '}
                    {user.organization}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-white">Role:</span> {user.role}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/auth');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#10243D] text-slate-700 dark:text-[#F4F7FC] flex items-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#0B3D91] dark:text-[#38BDF8]" />
                    <span>Switch or Register Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/auth?mode=signup')}
              className="px-3.5 py-1.5 rounded-lg bg-[#0B3D91] hover:bg-[#092B66] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth?mode=login')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-[#F4F7FC] hover:border-[#38BDF8] text-xs font-medium transition hidden sm:inline-flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#0B3D91] dark:text-[#38BDF8]" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
