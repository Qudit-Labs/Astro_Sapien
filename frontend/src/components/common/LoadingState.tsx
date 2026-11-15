import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading scientific datasets...',
}) => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10243D]/50 p-12 flex flex-col items-center justify-center text-center">
      <Loader2 className="w-7 h-7 text-[#0B3D91] dark:text-[#38BDF8] animate-spin mb-3" />
      <p className="text-sm font-mono text-slate-600 dark:text-[#9FB1C7]">{message}</p>
    </div>
  );
};
