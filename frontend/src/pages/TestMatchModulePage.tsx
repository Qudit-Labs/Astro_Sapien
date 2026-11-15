import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Ban,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResearchData } from '@/context/ResearchDataContext';
import {
  computeTestMatchComparison,
  VariableComparisonStatus,
} from '@/services/testMatchEngine';
import { PageHeader } from '@/components/common/PageHeader';
import { ComparisonScoreCard } from '@/components/common/ComparisonScoreCard';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';

const STATUS_BADGE: Record<
  VariableComparisonStatus,
  { label: string; icon: React.ReactNode; classes: string }
> = {
  similar: {
    label: 'Similar',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    classes: 'bg-teal-500/15 text-teal-700 dark:text-[#24B8A0] border-teal-500/30',
  },
  different: {
    label: 'Different',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    classes: 'bg-amber-500/15 text-amber-700 dark:text-[#F5B942] border-amber-500/30',
  },
  not_available: {
    label: 'Not available',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    classes: 'bg-slate-500/15 text-slate-600 dark:text-[#9FB1C7] border-slate-500/30',
  },
  not_comparable: {
    label: 'Not comparable',
    icon: <Ban className="w-3.5 h-3.5" />,
    classes: 'bg-red-500/15 text-red-700 dark:text-[#FC3D21] border-red-500/30',
  },
};

const getBadgeGlowAnimation = (status: VariableComparisonStatus) => {
  switch (status) {
    case 'similar':
      return {
        boxShadow: [
          '0 0 0px rgba(36, 184, 160, 0)',
          '0 0 10px rgba(36, 184, 160, 0.45)',
          '0 0 0px rgba(36, 184, 160, 0)',
        ],
      };
    case 'different':
      return {
        boxShadow: [
          '0 0 0px rgba(245, 185, 66, 0)',
          '0 0 10px rgba(245, 185, 66, 0.45)',
          '0 0 0px rgba(245, 185, 66, 0)',
        ],
      };
    case 'not_comparable':
      return {
        boxShadow: [
          '0 0 0px rgba(252, 61, 33, 0)',
          '0 0 10px rgba(252, 61, 33, 0.45)',
          '0 0 0px rgba(252, 61, 33, 0)',
        ],
      };
    default:
      return {};
  }
};

export const TestMatchModulePage: React.FC = () => {
  const {
    testRuns,
    comparisons,
    investigationById,
    measurementsByTestRunId,
  } = useResearchData();

  const [runAId, setRunAId] = useState<string>(() => testRuns[3]?.id || testRuns[0]?.id || '');
  const [runBId, setRunBId] = useState<string>(() => testRuns[1]?.id || testRuns[1]?.id || '');

  const runA = testRuns.find((r) => r.id === runAId) || testRuns[0];
  const runB = testRuns.find((r) => r.id === runBId) || testRuns[1] || testRuns[0];

  const comparison = useMemo(() => {
    if (!runA || !runB) return null;
    return computeTestMatchComparison(
      runA,
      runB,
      measurementsByTestRunId[runA.id] || [],
      measurementsByTestRunId[runB.id] || []
    );
  }, [runA, runB, measurementsByTestRunId]);

  const swapRuns = () => {
    const temp = runAId;
    setRunAId(runBId);
    setRunBId(temp);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Module 2 • TESTMATCH"
        badgeColor="cyan"
        title="Experiment Similarity & Comparison Workspace"
        subtitle="Compare any two microgravity combustion test runs across conditions, geometry, and SI-normalized outcomes while exposing missing data and scientific limitations."
      />

      {/* F. Example Comparison Presets */}
      <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9FB1C7]">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Example Pair Presets (Mock Demonstrations)</span>
          </div>
          <DataStatusBadge status="synthetic_demo" />
        </div>
        <div className="flex flex-wrap gap-2">
          {comparisons.slice(0, 5).map((cmp) => (
            <motion.button
              key={cmp.id}
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => {
                setRunAId(cmp.test_run_a_id);
                setRunBId(cmp.test_run_b_id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${
                runA?.id === cmp.test_run_a_id && runB?.id === cmp.test_run_b_id
                  ? 'bg-[#0B3D91] text-white border-[#38BDF8] shadow-sm shadow-[#38BDF8]/20'
                  : 'bg-slate-50 dark:bg-[#07172B] text-slate-700 dark:text-[#9FB1C7] border-slate-200 dark:border-slate-700 hover:border-[#38BDF8]'
              }`}
            >
              {cmp.test_run_a_id.replace('TR-', '')} vs {cmp.test_run_b_id.replace('TR-', '')}
            </motion.button>
          ))}
        </div>
      </div>

      {/* A. Experiment Selector with Smooth Layout Transitions */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
        {/* Run A */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          key={runA?.id ? `selector-run-a-${runA.id}` : 'run-a'}
          initial={{ opacity: 0.7, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-5 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 space-y-3 shadow-sm"
        >
          <label
            htmlFor="select-run-a"
            className="block text-xs font-mono uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] font-semibold"
          >
            Experiment Run A
          </label>
          <select
            id="select-run-a"
            value={runA?.id || ''}
            onChange={(e) => setRunAId(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-[#F4F7FC]"
          >
            {testRuns.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.id} — {tr.fuel_name} ({investigationById[tr.investigation_id]?.short_name})
              </option>
            ))}
          </select>

          {runA && (
            <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-[#9FB1C7]">
              <div>
                <strong>Investigation:</strong>{' '}
                {investigationById[runA.investigation_id]?.short_name} ({investigationById[runA.investigation_id]?.psi_id})
              </div>
              <div>
                <strong>Fuel:</strong> {runA.fuel_name}
              </div>
              <div>
                <strong>Gravity / Geometry:</strong> {runA.gravity_regime} • {runA.geometry.replace('_', ' ')}
              </div>
              <div>
                <strong>Conditions:</strong> {runA.experimental_conditions.oxygen_pct_vol ?? '—'}% O₂,{' '}
                {runA.experimental_conditions.pressure_kpa ?? '—'} kPa,{' '}
                {runA.experimental_conditions.airflow_cm_s ?? '—'} cm/s
              </div>
              <div>
                <strong>Available Measurements:</strong> {(measurementsByTestRunId[runA.id] || []).length} records
              </div>
            </div>
          )}
        </motion.div>

        {/* Swap Button */}
        <div className="lg:col-span-1 flex items-center justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.15, rotate: 180 }}
            whileTap={{ scale: 0.9, rotate: 360 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            onClick={swapRuns}
            aria-label="Swap Run A and Run B"
            title="Swap Run A and Run B"
            className="p-3 rounded-full bg-white dark:bg-[#10243D] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-[#38BDF8] hover:border-[#38BDF8] shadow-sm transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Run B */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          key={runB?.id ? `selector-run-b-${runB.id}` : 'run-b'}
          initial={{ opacity: 0.7, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-5 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-4 space-y-3 shadow-sm"
        >
          <label
            htmlFor="select-run-b"
            className="block text-xs font-mono uppercase tracking-wider text-teal-700 dark:text-[#24B8A0] font-semibold"
          >
            Experiment Run B
          </label>
          <select
            id="select-run-b"
            value={runB?.id || ''}
            onChange={(e) => setRunBId(e.target.value)}
            className="w-full text-xs rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-[#F4F7FC]"
          >
            {testRuns.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.id} — {tr.fuel_name} ({investigationById[tr.investigation_id]?.short_name})
              </option>
            ))}
          </select>

          {runB && (
            <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-[#9FB1C7]">
              <div>
                <strong>Investigation:</strong>{' '}
                {investigationById[runB.investigation_id]?.short_name} ({investigationById[runB.investigation_id]?.psi_id})
              </div>
              <div>
                <strong>Fuel:</strong> {runB.fuel_name}
              </div>
              <div>
                <strong>Gravity / Geometry:</strong> {runB.gravity_regime} • {runB.geometry.replace('_', ' ')}
              </div>
              <div>
                <strong>Conditions:</strong> {runB.experimental_conditions.oxygen_pct_vol ?? '—'}% O₂,{' '}
                {runB.experimental_conditions.pressure_kpa ?? '—'} kPa,{' '}
                {runB.experimental_conditions.airflow_cm_s ?? '—'} cm/s
              </div>
              <div>
                <strong>Available Measurements:</strong> {(measurementsByTestRunId[runB.id] || []).length} records
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* C. Comparison Visualization wrapped in Animated Transitions */}
      <AnimatePresence mode="wait">
        {comparison && (
          <motion.div
            key={`comparison-panel-${runA?.id}-${runB?.id}`}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6"
          >
            <ComparisonScoreCard
              score={comparison.prototypeComparabilityScore}
              dataCoverage={comparison.dataCoverage}
              isMockDemo={comparison.isMockDemo}
            />

            {/* B. Comparison Table with Staggered Dimension Matrix Reveal */}
            <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC]">
                  Parameter-by-Parameter Comparison Matrix
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-[#9FB1C7]">
                  {comparison.rows.length} dimensions evaluated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  <thead className="bg-slate-100 dark:bg-[#07172B]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                        Variable
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#0B3D91] dark:text-[#38BDF8]">
                        Run A ({runA.id})
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-[#24B8A0]">
                        Run B ({runB.id})
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                        Classification
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                        Notes / Delta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {comparison.rows.map((row, index) => {
                      const badge = STATUS_BADGE[row.status];
                      return (
                        <motion.tr
                          key={`${runA.id}-${runB.id}-${row.key}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: index * 0.05,
                            ease: 'easeOut',
                          }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-[#F4F7FC]">
                            {row.label}
                            <span className="block text-[10px] font-mono uppercase text-slate-400">
                              {row.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">
                            {row.valueA}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">
                            {row.valueB}
                          </td>
                          <td className="px-4 py-3">
                            <motion.span
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{
                                scale: 1,
                                opacity: 1,
                                ...getBadgeGlowAnimation(row.status),
                              }}
                              transition={{
                                scale: { type: 'spring', stiffness: 450, damping: 20 },
                                boxShadow: {
                                  repeat: Infinity,
                                  duration: 2.4,
                                  ease: 'easeInOut',
                                },
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badge.classes}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </motion.span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-[#9FB1C7]">
                            {row.deltaNote}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* D. Explain the Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-teal-700 dark:text-[#24B8A0]">
                  Main Similarities
                </h3>
                {comparison.mainSimilarities.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-[#9FB1C7]">
                    {comparison.mainSimilarities.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">No matching parameters identified.</p>
                )}

                <h3 className="text-sm font-semibold text-amber-700 dark:text-[#F5B942] pt-2">
                  Major Differences
                </h3>
                {comparison.majorDifferences.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-[#9FB1C7]">
                    {comparison.majorDifferences.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">No major differences in reported conditions.</p>
                )}
              </div>

              <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#FC3D21]">
                  Comparison Limitations & Missing Information
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-[#9FB1C7]">
                  {comparison.limitationReasons.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                  {comparison.missingInformation.map((m, i) => (
                    <li key={`miss-${i}`}>{m}</li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div>
                    <strong className="text-teal-700 dark:text-[#24B8A0]">
                      Results Suitable for Comparison:
                    </strong>
                    {comparison.comparableResults.length > 0 ? (
                      <ul className="list-disc pl-5 mt-1 text-slate-600 dark:text-[#9FB1C7]">
                        {comparison.comparableResults.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 mt-0.5">
                        No directly comparable outcome parameters overlap between these two runs.
                      </p>
                    )}
                  </div>

                  {comparison.nonComparableResults.length > 0 && (
                    <div>
                      <strong className="text-[#FC3D21]">
                        Results That Should NOT Be Directly Compared:
                      </strong>
                      <ul className="list-disc pl-5 mt-1 text-slate-600 dark:text-[#9FB1C7]">
                        {comparison.nonComparableResults.map((nc, i) => (
                          <li key={i}>{nc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
