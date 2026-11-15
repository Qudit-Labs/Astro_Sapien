import React from 'react';
import { EvidenceType } from '@shared/types/index';

interface EvidenceBadgeProps {
  type: EvidenceType;
  className?: string;
}

const EVIDENCE_STYLES: Record<EvidenceType, { label: string; classes: string }> = {
  observed: {
    label: 'Observed',
    classes: 'bg-teal-500/15 text-teal-700 dark:text-[#24B8A0] border-teal-500/30',
  },
  calculated: {
    label: 'Calculated',
    classes: 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30',
  },
  interpretation: {
    label: 'Interpretation',
    classes: 'bg-amber-500/15 text-amber-700 dark:text-[#F5B942] border-amber-500/30',
  },
  research_implication: {
    label: 'Research Implication',
    classes: 'bg-[#0B3D91]/15 text-[#0B3D91] dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-500/30',
  },
};

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ type, className = '' }) => {
  const cfg = EVIDENCE_STYLES[type] || EVIDENCE_STYLES.interpretation;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.classes} ${className}`}
    >
      {cfg.label}
    </span>
  );
};
