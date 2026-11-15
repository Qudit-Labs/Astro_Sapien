import React from 'react';
import { ExternalLink, FlaskConical, ArrowRight } from 'lucide-react';
import { Investigation } from '@shared/types/index';

interface InvestigationCardProps {
  investigation: Investigation;
  testRunCount: number;
  findingCount: number;
  measurementCategories?: string[];
  onSelect?: (investigation: Investigation) => void;
}

const PILLAR_COLORS: Record<string, string> = {
  prevention: 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8] border-sky-500/30',
  detection: 'bg-teal-500/15 text-teal-700 dark:text-[#24B8A0] border-teal-500/30',
  suppression: 'bg-red-500/15 text-red-700 dark:text-[#FC3D21] border-red-500/30',
  supporting: 'bg-slate-500/15 text-slate-700 dark:text-[#9FB1C7] border-slate-500/30',
};

export const InvestigationCard: React.FC<InvestigationCardProps> = ({
  investigation,
  testRunCount,
  findingCount,
  measurementCategories = [],
  onSelect,
}) => {
  return (
    <div
      className="group rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 hover:border-[#0B3D91] dark:hover:border-[#38BDF8]/60 p-5 flex flex-col justify-between transition-all shadow-sm"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#0B3D91] text-white">
              {investigation.psi_id}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize ${
                PILLAR_COLORS[investigation.fire_safety_pillar] || PILLAR_COLORS.supporting
              }`}
            >
              {investigation.fire_safety_pillar}
            </span>
          </div>

          <a
            href={investigation.official_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B3D91] dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Official NASA PSI Repository"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-[#F4F7FC] mt-3">
          {investigation.short_name}{' '}
          <span className="font-normal text-slate-600 dark:text-[#9FB1C7]">
            — {investigation.name}
          </span>
        </h3>

        <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-2 line-clamp-3 leading-relaxed">
          {investigation.description}
        </p>

        {/* Objectives preview */}
        {investigation.research_objectives.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9FB1C7] mb-1">
              Primary Objective
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
              {investigation.research_objectives[0]}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {investigation.module_tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-slate-700 dark:text-[#38BDF8] border border-slate-200 dark:border-slate-700"
            >
              {tag}
            </span>
          ))}
          {measurementCategories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-[#9FB1C7]"
            >
              {cat.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-[#9FB1C7]">
          <span className="inline-flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-[#38BDF8]" />
            {testRunCount} Runs
          </span>
          <span>•</span>
          <span>{findingCount} Findings</span>
        </div>

        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(investigation)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
          >
            Inspect
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
