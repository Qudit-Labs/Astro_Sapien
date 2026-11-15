import React from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import { Source } from '@shared/types/index';

interface SourceCitationProps {
  source?: Source;
  sourceId?: string;
  compact?: boolean;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({
  source,
  sourceId,
  compact = false,
}) => {
  if (!source) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-[#9FB1C7]">
        <BookOpen className="w-3 h-3" />
        {sourceId || 'Unknown Source'}
      </span>
    );
  }

  if (compact) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-mono text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
        title={source.title}
      >
        <BookOpen className="w-3 h-3 shrink-0" />
        <span className="truncate max-w-[200px]">{source.id}</span>
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-100 dark:bg-[#07172B]/70 border border-slate-200 dark:border-slate-700/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#0B3D91]/15 text-[#0B3D91] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]">
            {source.id}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-[#9FB1C7]">
            {source.organization}
          </span>
        </div>
        <p className="text-xs font-medium text-slate-800 dark:text-[#F4F7FC] mt-1">
          {source.title}
        </p>
      </div>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
      >
        Open
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
