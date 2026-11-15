import React, { useState, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataStatusBadge } from './DataStatusBadge';

interface ComparisonScoreCardProps {
  score: number | null;
  dataCoverage: number;
  isMockDemo?: boolean;
}

const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 1000,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(value * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

export const ComparisonScoreCard: React.FC<ComparisonScoreCardProps> = ({
  score,
  dataCoverage,
  isMockDemo = true,
}) => {
  const [showMethodology, setShowMethodology] = useState(false);

  const scorePct = score !== null ? Math.round(score * 100) : null;
  const coveragePct = Math.round(dataCoverage * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-4 hud-panel shadow-md"
    >
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
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-[#38BDF8] mt-1 flex items-baseline gap-0.5">
            {scorePct !== null ? (
              <>
                <AnimatedCounter value={scorePct} duration={1000} />
                <span>%</span>
              </>
            ) : (
              'Insufficient Data'
            )}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#38BDF8]"
              initial={{ width: '0%' }}
              animate={{ width: `${scorePct ?? 0}%` }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#9FB1C7]">
            Parameter Data Coverage
          </span>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-[#24B8A0] mt-1 flex items-baseline gap-0.5">
            <AnimatedCounter value={coveragePct} duration={1000} />
            <span>%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-[#24B8A0]"
              initial={{ width: '0%' }}
              animate={{ width: `${coveragePct}%` }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {showMethodology && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="p-3.5 rounded-lg bg-sky-50 dark:bg-[#0B3D91]/20 border border-sky-200 dark:border-[#38BDF8]/30 text-xs text-slate-700 dark:text-slate-200 space-y-1.5"
        >
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
        </motion.div>
      )}
    </motion.div>
  );
};
