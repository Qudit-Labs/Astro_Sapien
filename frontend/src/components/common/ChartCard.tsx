import React from 'react';
import { DataStatusBadge } from './DataStatusBadge';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  unitNote?: string;
  isMock?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  unitNote,
  isMock = true,
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 sm:p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-[#9FB1C7] mt-0.5">{subtitle}</p>
          )}
        </div>
        {isMock && <DataStatusBadge status="synthetic_demo" className="shrink-0" />}
      </div>

      <div className="w-full min-h-[240px]">{children}</div>

      {unitNote && (
        <p className="text-[11px] font-mono text-slate-500 dark:text-[#9FB1C7] mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          {unitNote}
        </p>
      )}
    </div>
  );
};
