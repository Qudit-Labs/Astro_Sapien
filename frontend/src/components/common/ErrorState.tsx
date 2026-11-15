import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Retrieval Error',
  message,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/30 p-8 text-center flex flex-col items-center"
    >
      <AlertCircle className="w-7 h-7 text-[#FC3D21] mb-2" />
      <h3 className="text-sm font-semibold text-red-900 dark:text-[#F4F7FC]">{title}</h3>
      <p className="text-xs text-red-700 dark:text-red-200/80 mt-1 max-w-lg">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#FC3D21] text-white hover:bg-[#FC3D21]/90 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
