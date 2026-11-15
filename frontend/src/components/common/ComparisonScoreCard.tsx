import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { DataStatusBadge } from './DataStatusBadge';

interface ComparisonScoreCardProps {
  score: number | null;
  dataCoverage: number;
  isMockDemo?: boolean;
}

export const ComparisonScoreCard: React.FC<ComparisonScoreCardProps> = ({
  score,
  dataCoverage,
  isMockDemo = true,
}) => {
  const [showMethodology, setShowMethodology] = useState(false);

  const scorePct = score !== null ? Math.round(score * 100) : null;
  const coveragePct = Math.round(dataCoverage * 100);

  return (
    <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-4 hud-panel shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
              Prototype Condition Comparability Indicator
            </h3>
            <button
              type="button"
              onClick={() => setShowMethodology((s) => !s)}
              aria-expanded={showMethodology}
              className="inline-flex items-center gap-1 text-xs text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Methodology
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9FB1C7] mt-0.5">
            Structural heuristic based on shared experimental conditions — NOT a validated scientific equivalence score.
          </p>
        </div>
        {isMockDemo && <DataStatusBadge status="synthetic_demo" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#9FB1C7]">
            Prototype Weighted Score
          </span>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-[#38BDF8] mt-1">
            {scorePct !== null ? `${scorePct}%` : 'Insufficient Data'}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-[#38BDF8] transition-all duration-300"
              style={{ width: `${scorePct ?? 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#9FB1C7]">
            Parameter Data Coverage
          </span>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-[#24B8A0] mt-1">
            {coveragePct}%
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-[#24B8A0] transition-all duration-300"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
      </div>

      {showMethodology && (
        <div className="p-3.5 rounded-lg bg-sky-50 dark:bg-[#0B3D91]/20 border border-sky-200 dark:border-[#38BDF8]/30 text-xs text-slate-700 dark:text-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-[#0B3D91] dark:text-[#38BDF8]">
            <Info className="w-3.5 h-3.5" />
            TESTMATCH Prototype Scoring Rules
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Evaluates 9 core condition, geometry, and diagnostic method dimensions using SI-normalized values.
            </li>
            <li>
              <strong>Missing values are never treated as matching or zero</strong>; they reduce Data Coverage and are excluded from the numerator/denominator.
            </li>
            <li>
              If Data Coverage falls below 50%, no prototype score is computed.
            </li>
            <li>
              Incompatible geometries (e.g. droplet vs flat sheet) are flagged as <em>Not comparable</em> and earn zero weight.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
