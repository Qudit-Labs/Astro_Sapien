import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPIStatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  accent?: 'blue' | 'cyan' | 'teal' | 'amber' | 'red';
}

const ACCENT_MAP = {
  blue: 'bg-[#0B3D91]/15 text-[#0B3D91] dark:bg-[#0B3D91]/30 dark:text-[#38BDF8]',
  cyan: 'bg-sky-500/15 text-sky-600 dark:text-[#38BDF8]',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-[#24B8A0]',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-[#F5B942]',
  red: 'bg-red-500/15 text-red-600 dark:text-[#FC3D21]',
};

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = 'cyan',
}) => {
  return (
    <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#9FB1C7]">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-[#F4F7FC] mt-1.5">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-500 dark:text-[#9FB1C7] mt-1">{sublabel}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${ACCENT_MAP[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
