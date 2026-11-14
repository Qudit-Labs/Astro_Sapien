import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, AlertTriangle, User } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useResearchData } from '@/context/ResearchDataContext';
import { SearchBar } from '../common/SearchBar';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav }) => {
  const { theme, toggleTheme } = useTheme();
  const { isMockMode, globalSearch, setGlobalSearch } = useResearchData();
  const navigate = useNavigate();

  const handleGlobalSearchChange = (val: string) => {
    setGlobalSearch(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate('/explorer');
    }
  };

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

      {/* Right: Mock indicator, theme toggle, user placeholder */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {isMockMode && (
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

        <div
          className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800"
          title="Researcher Session Placeholder"
        >
          <div className="w-7 h-7 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-medium text-slate-800 dark:text-[#F4F7FC]">
              Researcher
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-[#9FB1C7]">
              Astro_Sapien
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
