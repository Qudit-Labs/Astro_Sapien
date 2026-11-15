import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Wind } from 'lucide-react';

interface MicrogravityFlameVisualizerProps {
  initialRegime?: 'microgravity' | 'earth';
  compact?: boolean;
}

export const MicrogravityFlameVisualizer: React.FC<MicrogravityFlameVisualizerProps> = ({
  initialRegime = 'microgravity',
  compact = false,
}) => {
  const [regime, setRegime] = useState<'microgravity' | 'earth'>(initialRegime);
  const [hasForcedFlow, setHasForcedFlow] = useState(true);

  const isUg = regime === 'microgravity';

  return (
    <div className="rounded-xl bg-slate-100 dark:bg-[#07172B] border border-slate-200 dark:border-sky-900/50 p-4 space-y-3 font-sans text-slate-800 dark:text-slate-200 shadow-sm">
      {/* Header and Toggle Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${isUg ? 'text-[#0B3D91] dark:text-[#38BDF8]' : 'text-amber-500'}`} />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            {isUg ? 'Microgravity Flame Dome (µg)' : 'Earth Buoyant Flame (1g)'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRegime((r) => (r === 'microgravity' ? 'earth' : 'microgravity'))}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-300 dark:border-sky-500/40 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-[#38BDF8] hover:bg-sky-200 dark:hover:bg-sky-900/60 transition"
          >
            Switch to {isUg ? '1g Earth' : 'µg Spherical'}
          </button>
          <button
            type="button"
            onClick={() => setHasForcedFlow((f) => !f)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition flex items-center gap-1 ${
              hasForcedFlow
                ? 'border-teal-300 dark:border-teal-500/50 bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-[#24B8A0]'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Wind className="w-3 h-3" />
            {hasForcedFlow ? 'Flow: 12 cm/s' : 'Quiescent: 0 cm/s'}
          </button>
        </div>
      </div>

      {/* Interactive SVG Animation Canvas */}
      <div className="relative w-full h-44 bg-gradient-to-b from-[#030B17] to-[#07172B] rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80">
        {/* Subtle Background Grid & Vector Guidelines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38BDF8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Forced Flow Streamlines */}
        {hasForcedFlow && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[20, 50, 80, 110, 140].map((top, idx) => (
              <motion.div
                key={`flow-${idx}`}
                className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent"
                style={{ top: `${top}px`, width: '100%' }}
                animate={{ x: [-150, 150] }}
                transition={{
                  repeat: Infinity,
                  duration: isUg ? 3.5 : 2.0,
                  delay: idx * 0.4,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}

        <svg viewBox="0 0 240 160" className="w-full h-full max-w-[280px]">
          <defs>
            {/* Microgravity Blue Flame Radial Gradient */}
            <radialGradient id="ugFlameGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B3D91" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#2563EB" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="90%" stopColor="#0284C7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0B3D91" stopOpacity="0" />
            </radialGradient>

            {/* Inner Reaction Zone */}
            <radialGradient id="innerReactionZone" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#67E8F9" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
            </radialGradient>

            {/* Earth 1g Yellow/Orange Gradient */}
            <linearGradient id="earthFlame" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#2563EB" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#F5B942" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#EA580C" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Microgravity: Calm Glowing Spherical Blue Flame Dome with Radial Breathing */}
          {isUg ? (
            <g transform={hasForcedFlow ? 'translate(100, 80)' : 'translate(120, 80)'}>
              {/* Quenching Boundary Outer Orbit */}
              <motion.circle
                r="46"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity={0.4}
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              />

              {/* Outer Blue Aura with Radial Breathing Pulsation */}
              <motion.circle
                r="42"
                fill="url(#ugFlameGlow)"
                filter="url(#glowFilter)"
                animate={{
                  scale: [1, 1.08, 0.98, 1],
                  opacity: [0.85, 1, 0.88, 0.85],
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Inner Chemiluminescent Blue Reaction Shell */}
              <motion.circle
                r="26"
                fill="url(#innerReactionZone)"
                filter="url(#glowFilter)"
                animate={{
                  scale: [1, 1.05, 0.96, 1],
                  opacity: [0.9, 1, 0.9, 0.9],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Fuel Sample Core / Droplet */}
              <circle r="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
              <circle r="2.5" fill="#38BDF8" />

              {/* Wake Elongation Tail under forced flow */}
              {hasForcedFlow && (
                <motion.path
                  d="M 24 -15 Q 65 0 24 15 Z"
                  fill="url(#ugFlameGlow)"
                  opacity={0.65}
                  animate={{ scaleX: [1, 1.15, 0.95, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </g>
          ) : (
            /* 1g Earth: Buoyant Convective Teardrop Flame */
            <g transform="translate(120, 80)">
              <motion.path
                d="M -16 20 C -22 0, -18 -30, 0 -55 C 18 -30, 22 0, 16 20 C 10 32, -10 32, -16 20 Z"
                fill="url(#earthFlame)"
                filter="url(#glowFilter)"
                animate={{
                  d: [
                    'M -16 20 C -22 0, -18 -30, 0 -55 C 18 -30, 22 0, 16 20 C 10 32, -10 32, -16 20 Z',
                    'M -14 20 C -20 -5, -14 -35, 0 -62 C 14 -35, 20 -5, 14 20 C 8 32, -8 32, -14 20 Z',
                    'M -16 20 C -22 0, -18 -30, 0 -55 C 18 -30, 22 0, 16 20 C 10 32, -10 32, -16 20 Z',
                  ],
                }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Fuel Core */}
              <rect x="-8" y="24" width="16" height="12" rx="2" fill="#334155" />
            </g>
          )}
        </svg>

        {/* Dynamic HUD Watermark */}
        <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-sky-400/80 bg-slate-950/60 px-1.5 py-0.5 rounded border border-sky-900/40">
          {isUg ? 'SPHERICAL CHEMICALLUMINESCENT DOME' : 'BUOYANT 1g CONVECTIVE PLUME'}
        </div>
      </div>

      {/* Telemetry Explanatory Badges */}
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Convective Draft</span>
            <span className="font-semibold text-sky-700 dark:text-[#38BDF8]">
              {isUg ? '0 g (Pure Diffusion)' : '1 g (Strong Buoyant Chimney)'}
            </span>
          </div>
          <div className="p-2 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Chemiluminescence</span>
            <span className="font-semibold text-teal-700 dark:text-teal-400">
              {isUg ? 'Blue CH*/C2* Radicals' : 'Soot Incandescence (Yellow)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
