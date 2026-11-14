import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'blue' | 'red' | 'cyan' | 'teal' | 'amber';
  actions?: React.ReactNode;
}

const BADGE_CLASSES = {
  blue: 'bg-[#0B3D91]/15 text-[#0B3D91] dark:bg-[#0B3D91]/40 dark:text-[#38BDF8] border-[#0B3D91]/30',
  red: 'bg-red-500/15 text-red-700 dark:text-[#FC3D21] border-red-500/30',
  cyan: 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30',
  teal: 'bg-teal-500/15 text-teal-700 dark:text-[#24B8A0] border-teal-500/30',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-[#F5B942] border-amber-500/30',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'blue',
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
      <div>
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider border mb-2 ${BADGE_CLASSES[badgeColor]}`}
          >
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F4F7FC]">
          {title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-[#9FB1C7] mt-1 max-w-3xl">
          {subtitle}
        </p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
