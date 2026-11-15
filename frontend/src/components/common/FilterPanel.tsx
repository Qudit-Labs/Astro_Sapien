import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  title?: string;
  children: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  title = 'Filters',
  children,
  onReset,
  hasActiveFilters = false,
}) => {
  return (
    <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9FB1C7]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>{title}</span>
        </div>
        {onReset && hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {children}
      </div>
    </div>
  );
};
