import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No matching records found',
  description = 'Try adjusting your search query or clearing active filters to view available NASA research records.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#10243D]/40 p-10 text-center flex flex-col items-center justify-center">
      <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-[#9FB1C7] mb-3">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-[#9FB1C7] mt-1 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-[#0B3D91] text-white hover:bg-[#0B3D91]/90 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
