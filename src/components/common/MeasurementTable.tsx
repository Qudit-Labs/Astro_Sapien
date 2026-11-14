import React from 'react';
import { Measurement } from '@shared/types/index';
import { DataStatusBadge } from './DataStatusBadge';

interface MeasurementTableProps {
  measurements: Measurement[];
  compact?: boolean;
}

export const MeasurementTable: React.FC<MeasurementTableProps> = ({
  measurements,
  compact = false,
}) => {
  if (measurements.length === 0) {
    return (
      <div className="text-xs text-slate-500 dark:text-[#9FB1C7] py-4 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
        No measurement records available for this selection.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/60">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
        <thead className="bg-slate-100 dark:bg-[#07172B]">
          <tr>
            <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
              Parameter
            </th>
            <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
              Role
            </th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-[#9FB1C7]">
              Raw Value
            </th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-[#9FB1C7]">
              SI Normalized
            </th>
            {!compact && (
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
                Sensor / Method
              </th>
            )}
            <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-[#9FB1C7]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#10243D]/70">
          {measurements.map((m) => (
            <tr
              key={m.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="px-3 py-2.5">
                <div className="font-medium text-slate-900 dark:text-[#F4F7FC]">
                  {m.parameter_label}
                </div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-[#9FB1C7]">
                  {m.parameter_code}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                    m.measurement_role === 'condition'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-[#38BDF8]'
                      : 'bg-teal-500/15 text-teal-700 dark:text-[#24B8A0]'
                  }`}
                >
                  {m.measurement_role}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-800 dark:text-[#F4F7FC]">
                {m.raw_value !== null ? `${m.raw_value} ${m.raw_unit}` : 'Not reported'}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-[#9FB1C7]">
                {m.normalized_value !== null
                  ? `${m.normalized_value} ${m.normalized_unit}`
                  : 'null'}
              </td>
              {!compact && (
                <td className="px-3 py-2.5 text-slate-600 dark:text-[#9FB1C7] max-w-[220px]">
                  <div className="truncate" title={m.sensor || undefined}>
                    {m.sensor || '—'}
                  </div>
                  <div
                    className="text-[10px] opacity-75 truncate"
                    title={m.measurement_method || undefined}
                  >
                    {m.measurement_method || ''}
                  </div>
                </td>
              )}
              <td className="px-3 py-2.5">
                <DataStatusBadge status={m.data_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
