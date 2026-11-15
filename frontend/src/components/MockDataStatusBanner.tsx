import React from 'react';
import { AlertTriangle, Database, ExternalLink, ShieldCheck } from 'lucide-react';

interface MockDataStatusBannerProps {
  mode: 'mock' | 'api';
  recordCounts?: {
    investigations: number;
    testRuns: number;
    measurements: number;
    findings: number;
  };
}

export const MockDataStatusBanner: React.FC<MockDataStatusBannerProps> = ({
  mode,
  recordCounts,
}) => {
  const isMock = mode === 'mock';

  return (
    <div
      role="alert"
      className={`border-b px-4 py-3 sm:px-6 transition-colors ${
        isMock
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200'
          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 mt-0.5">
            {isMock ? (
              <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm uppercase tracking-wider text-amber-900 dark:text-amber-300">
                {isMock ? 'SYNTHETIC DEMONSTRATION MODE' : 'PRODUCTION NASA API MODE'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono border border-amber-300 dark:border-transparent">
                DATA_MODE={mode}
              </span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-1 max-w-3xl leading-relaxed">
              {isMock ? (
                <>
                  All experimental test runs, measurements, and findings are synthetic and illustrative
                  demonstrations for scientific interface validation. Investigation metadata and links
                  point to official NASA Physical Sciences Informatics (PSI) public records.
                </>
              ) : (
                <>
                  Connected to live FastAPI backend at{' '}
                  <code className="text-emerald-800 dark:text-emerald-300">
                    {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}
                  </code>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono self-end md:self-center shrink-0">
          {recordCounts && (
            <div className="flex items-center gap-3 text-amber-900 dark:text-amber-200/90 bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1.5 rounded border border-amber-300 dark:border-amber-500/20">
              <Database className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{recordCounts.investigations} Invs</span>
              <span className="text-amber-400 dark:text-amber-500/40">•</span>
              <span>{recordCounts.testRuns} Tests</span>
              <span className="text-amber-400 dark:text-amber-500/40">•</span>
              <span>{recordCounts.measurements} Meas</span>
            </div>
          )}
          <a
            href="https://psi.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 hover:underline font-medium"
          >
            NASA PSI Portal
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
