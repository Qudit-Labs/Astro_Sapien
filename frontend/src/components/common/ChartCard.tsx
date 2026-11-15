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
  isMock = false,
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#0B1D36] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-sm hover:border-[#38BDF8]/40 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#F4F7FC] tracking-tight">
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
        <p className="text-[10px] font-mono text-slate-500 dark:text-[#9FB1C7] mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          {unitNote}
        </p>
      )}
    </div>
  );
};
