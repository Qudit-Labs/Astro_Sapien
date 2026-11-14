import React from 'react';
import { Download, FileJson, FileText } from 'lucide-react';
import { DataStatusBadge } from './DataStatusBadge';

export interface GeneratedReportData {
  id: string;
  title: string;
  researchQuestion: string;
  executiveSummary: string;
  investigations: Array<{ id: string; short_name: string; name: string; psi_id: string }>;
  combustionEvidence: string[];
  comparisonSummary: string[];
  smokeAnalysis: string[];
  researchImplications: string[];
  limitations: string[];
  sources: Array<{ id: string; title: string; url: string }>;
  generatedAt: string;
  isMock: boolean;
}

interface ReportPreviewProps {
  report: GeneratedReportData;
  onDownloadMarkdown: () => void;
  onDownloadJson: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  onDownloadMarkdown,
  onDownloadJson,
}) => {
  return (
    <div className="rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#07172B] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-[#9FB1C7]">
            {report.id}
          </span>
          {report.isMock && <DataStatusBadge status="synthetic_demo" />}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0B3D91] text-white hover:bg-[#0B3D91]/90 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Markdown
            <Download className="w-3 h-3 opacity-80" />
          </button>
          <button
            type="button"
            onClick={onDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-[#F4F7FC] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <FileJson className="w-3.5 h-3.5" />
            Export JSON
            <Download className="w-3 h-3 opacity-80" />
          </button>
        </div>
      </div>

      {/* Report Body */}
      <div className="p-6 space-y-6 text-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#F4F7FC]">
            {report.title}
          </h2>
          <p className="text-xs font-mono text-slate-500 dark:text-[#9FB1C7] mt-1">
            Generated: {new Date(report.generatedAt).toLocaleString()} • SYNTHETIC DEMONSTRATION REPORT
          </p>
        </div>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-1">
            1. Research Question
          </h3>
          <p className="text-slate-800 dark:text-slate-200 font-medium">
            {report.researchQuestion}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-1">
            2. Executive Summary
          </h3>
          <p className="text-slate-700 dark:text-[#9FB1C7] leading-relaxed">
            {report.executiveSummary}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-2">
            3. Relevant NASA Investigations
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.investigations.map((inv) => (
              <span
                key={inv.id}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-[#07172B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-[#F4F7FC]"
              >
                <strong>{inv.short_name}</strong> ({inv.psi_id}) — {inv.name}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-1.5">
            4. Combustion Evidence (FIRELINE)
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-[#9FB1C7]">
            {report.combustionEvidence.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-1.5">
            5. Experiment Comparison (TESTMATCH)
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-[#9FB1C7]">
            {report.comparisonSummary.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-1.5">
            6. Smoke Analysis (SMOKewise)
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-[#9FB1C7]">
            {report.smokeAnalysis.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-1.5">
            7. Research Implications
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-[#9FB1C7]">
            {report.researchImplications.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-[#F5B942] mb-1.5">
            8. Experimental Limitations
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900 dark:text-amber-200/90">
            {report.limitations.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] mb-1.5">
            9. Source References
          </h3>
          <ul className="space-y-1 text-xs">
            {report.sources.map((src) => (
              <li key={src.id} className="font-mono text-slate-600 dark:text-[#9FB1C7]">
                [{src.id}] {src.title} —{' '}
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0B3D91] dark:text-[#38BDF8] hover:underline"
                >
                  {src.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
