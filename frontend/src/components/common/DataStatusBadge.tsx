import React from 'react';
import { DataStatus } from '@shared/types/index';

interface DataStatusBadgeProps {
  status: DataStatus | 'mock_demo';
  className?: string;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  synthetic_demo: {
    label: 'Synthetic Demo',
    classes:
      'bg-amber-500/15 text-amber-700 dark:text-[#F5B942] border-amber-500/30',
  },
  mock_demo: {
    label: 'DEMO MODE – SYNTHETIC NASA-INSPIRED DATA',
    classes:
      'bg-amber-500/15 text-amber-700 dark:text-[#F5B942] border-amber-500/30',
  },
  reported: {
    label: 'Reported',
    classes:
      'bg-teal-500/15 text-teal-700 dark:text-[#24B8A0] border-teal-500/30',
  },
  approximate: {
    label: 'Approximate',
    classes:
      'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30',
  },
  range: {
    label: 'Range',
    classes:
      'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30',
  },
  not_reported: {
    label: 'Not Reported',
    classes:
      'bg-slate-500/15 text-slate-600 dark:text-[#9FB1C7] border-slate-500/30',
  },
  not_applicable: {
    label: 'N/A',
    classes:
      'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
  },
  needs_review: {
    label: 'Needs Review',
    classes:
      'bg-red-500/15 text-red-700 dark:text-[#FC3D21] border-red-500/30',
  },
  unparsed: {
    label: 'Unparsed',
    classes:
      'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
};

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.synthetic_demo;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${cfg.classes} ${className}`}
    >
      {cfg.label}
    </span>
  );
};
