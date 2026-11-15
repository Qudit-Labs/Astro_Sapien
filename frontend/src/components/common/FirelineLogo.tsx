import React from 'react';

interface FirelineLogoProps {
  compact?: boolean;
}

export const FirelineLogo: React.FC<FirelineLogoProps> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Original orbital + flame-inspired mark */}
      <div className="relative w-8 h-8 rounded-lg bg-[#0B3D91] flex items-center justify-center shadow-sm border border-[#38BDF8]/30 shrink-0">
        <svg
          viewBox="0 0 32 32"
          className="w-5 h-5"
          fill="none"
          aria-hidden="true"
        >
          {/* Orbital ring */}
          <ellipse
            cx="16"
            cy="16"
            rx="12"
            ry="5.5"
            transform="rotate(-25 16 16)"
            stroke="#38BDF8"
            strokeWidth="1.6"
            strokeOpacity="0.85"
          />
          {/* Abstract flame core */}
          <path
            d="M16 7C16 7 20.5 11.8 20.5 16.2C20.5 18.8 18.5 21 16 21C13.5 21 11.5 18.8 11.5 16.2C11.5 13.7 13.3 11.3 14.3 10.2C14.3 10.2 14.2 12.6 15.6 13.3C15.1 11.1 16 7 16 7Z"
            fill="#FC3D21"
          />
          <circle cx="16" cy="17.2" r="1.8" fill="#F5B942" />
        </svg>
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-wider text-sm text-slate-900 dark:text-[#F4F7FC]">
              FIRELINE
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0B3D91]/20 text-[#0B3D91] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8] font-bold border border-[#38BDF8]/30">
              v2.0
            </span>
          </div>
          <span className="block text-[10px] text-slate-500 dark:text-[#9FB1C7] tracking-wide">
            Spacecraft Fire Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
