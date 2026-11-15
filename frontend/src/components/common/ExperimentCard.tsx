import React from 'react';
import { TestRun } from '@shared/types/index';
import { DataStatusBadge } from './DataStatusBadge';
import { Wind, Gauge, Flame } from 'lucide-react';

interface ExperimentCardProps {
  testRun: TestRun;
  investigationShortName?: string;
  measurementCount: number;
  selected?: boolean;
  onSelect?: (testRun: TestRun) => void;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  testRun,
  investigationShortName,
  measurementCount,
  selected = false,
  onSelect,
}) => {
  const cond = testRun.experimental_conditions;

  return (
    <div
      onClick={onSelect ? () => onSelect(testRun) : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(testRun);
              }
            }
          : undefined
      }
      className={`rounded-xl p-4 border transition-all duration-200 relative overflow-hidden ${
        onSelect ? 'cursor-pointer' : ''
      } ${
        selected
          ? 'bg-[#0B3D91]/20 dark:bg-[#0B3D91]/40 border-[#38BDF8] shadow-lg shadow-[#38BDF8]/10 ring-1 ring-[#38BDF8]/50'
          : 'bg-white dark:bg-[#10243D] border-slate-200 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-[#38BDF8]/40 hover:-translate-y-0.5 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#07172B] text-[#0B3D91] dark:text-[#38BDF8]">
            {testRun.id}
          </span>
          {investigationShortName && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-[#9FB1C7]">
              {investigationShortName}
            </span>
          )}
        </div>
        <DataStatusBadge status={testRun.data_status} />
      </div>

      <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FC] mt-2">
        {testRun.test_label}
      </h4>

      <p className="text-xs text-slate-600 dark:text-[#9FB1C7] mt-1">
        Fuel: <span className="font-medium text-slate-800 dark:text-slate-200">{testRun.fuel_name}</span> •{' '}
        <span className="capitalize">{testRun.geometry.replace('_', ' ')}</span>
      </p>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-1 text-slate-600 dark:text-[#9FB1C7]">
          <Flame className="w-3 h-3 text-[#F5B942]" />
          <span>{cond.oxygen_pct_vol !== null ? `${cond.oxygen_pct_vol}% O₂` : '—'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 dark:text-[#9FB1C7]">
          <Wind className="w-3 h-3 text-[#38BDF8]" />
          <span>{cond.airflow_cm_s !== null ? `${cond.airflow_cm_s} cm/s` : '—'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 dark:text-[#9FB1C7]">
          <Gauge className="w-3 h-3 text-[#24B8A0]" />
          <span>{measurementCount} Meas</span>
        </div>
      </div>
    </div>
  );
};
