import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wind, Cpu } from 'lucide-react';

interface SmokeAerosolVisualizerProps {
  compact?: boolean;
}

export const SmokeAerosolVisualizer: React.FC<SmokeAerosolVisualizerProps> = ({
  compact = false,
}) => {
  const [detectorType, setDetectorType] = useState<'optical' | 'ionization'>('optical');
  const [airflowLevel, setAirflowLevel] = useState<'nominal' | 'low'>('nominal');

  const speed = airflowLevel === 'nominal' ? 2.5 : 4.5;

  // Generate 14 particle tracks with varying offsets and sizes (sub-micron representation)
  const particles = [
    { id: 1, y: 30, size: 3.5, delay: 0.1, duration: speed * 1.1, opacity: 0.8 },
    { id: 2, y: 45, size: 2.2, delay: 0.7, duration: speed * 0.9, opacity: 0.7 },
    { id: 3, y: 60, size: 4.0, delay: 0.3, duration: speed * 1.2, opacity: 0.85 },
    { id: 4, y: 75, size: 2.8, delay: 1.2, duration: speed * 1.0, opacity: 0.65 },
    { id: 5, y: 90, size: 3.2, delay: 0.5, duration: speed * 0.95, opacity: 0.75 },
    { id: 6, y: 105, size: 2.0, delay: 1.5, duration: speed * 1.15, opacity: 0.6 },
    { id: 7, y: 120, size: 4.5, delay: 0.9, duration: speed * 1.05, opacity: 0.9 },
    { id: 8, y: 40, size: 2.6, delay: 1.9, duration: speed * 1.0, opacity: 0.7 },
    { id: 9, y: 70, size: 3.8, delay: 2.2, duration: speed * 1.2, opacity: 0.8 },
    { id: 10, y: 95, size: 2.4, delay: 1.7, duration: speed * 0.85, opacity: 0.75 },
    { id: 11, y: 55, size: 3.0, delay: 2.6, duration: speed * 1.1, opacity: 0.7 },
    { id: 12, y: 115, size: 2.5, delay: 2.1, duration: speed * 0.9, opacity: 0.65 },
  ];

  return (
    <div className="rounded-xl bg-slate-100 dark:bg-[#07172B] border border-slate-200 dark:border-teal-900/50 p-4 space-y-3 font-sans text-slate-800 dark:text-slate-200 shadow-sm">
      {/* Header and Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-teal-700 dark:text-[#24B8A0]" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            Microgravity Aerosol Vector & Detector Chamber
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAirflowLevel((l) => (l === 'nominal' ? 'low' : 'nominal'))}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-teal-300 dark:border-teal-500/40 bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-[#24B8A0] hover:bg-teal-200 dark:hover:bg-teal-900/60 transition"
          >
            Airflow: {airflowLevel === 'nominal' ? '15 cm/s' : '4 cm/s (Slow)'}
          </button>
          <button
            type="button"
            onClick={() => setDetectorType((d) => (d === 'optical' ? 'ionization' : 'optical'))}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-300 dark:border-sky-500/40 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-[#38BDF8] hover:bg-sky-200 dark:hover:bg-sky-900/60 transition"
          >
            Sensor: {detectorType === 'optical' ? 'Optical Scatter' : 'Ionization'}
          </button>
        </div>
      </div>

      {/* Interactive SVG Animation Canvas */}
      <div className="relative w-full h-44 bg-gradient-to-r from-[#030B17] via-[#071C2E] to-[#030B17] rounded-lg overflow-hidden border border-slate-800/80">
        {/* Airflow Vector Guidelines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <defs>
            <linearGradient id="vectorLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#24B8A0" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#24B8A0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {[30, 60, 90, 120].map((y) => (
            <line
              key={`line-${y}`}
              x1="0"
              y1={y}
              x2="100%"
              y2={y}
              stroke="url(#vectorLine)"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Detector Sensor Sampling Target Zone */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-28 rounded-lg border-2 border-dashed border-[#24B8A0]/60 bg-[#24B8A0]/5 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center pointer-events-none">
          <Cpu className="w-5 h-5 text-[#24B8A0] animate-pulse mb-1" />
          <span className="text-[9px] font-mono font-bold text-[#24B8A0] uppercase leading-tight">
            {detectorType === 'optical' ? 'Optical Chamber' : 'Ion Chamber'}
          </span>
          <span className="text-[8px] font-mono text-slate-400 mt-0.5">
            {detectorType === 'optical' ? '90° Scatter' : 'Alpha Source'}
          </span>
        </div>

        {/* Drifting Sub-Micron Smoke Particles with Fading Trails */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute flex items-center"
              style={{ top: `${p.y}px` }}
              initial={{ x: -40, opacity: 0 }}
              animate={{
                x: [ -40, 320 ],
                opacity: [ 0, p.opacity, p.opacity, 0 ],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {/* Fading Trail */}
              <div
                className="h-[1.5px] bg-gradient-to-l from-[#24B8A0]/70 via-[#38BDF8]/40 to-transparent mr-1"
                style={{ width: `${p.size * 5}px` }}
              />
              {/* Particle Core */}
              <div
                className="rounded-full bg-cyan-200 shadow-sm shadow-[#24B8A0]"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Dynamic HUD Watermark */}
        <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-teal-400/90 bg-slate-950/70 px-2 py-0.5 rounded border border-teal-900/40 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#24B8A0] animate-ping" />
          <span>MICROGRAVITY FORCED VECTOR: NO BUOYANT PLUME</span>
        </div>
      </div>

      {/* Telemetry Explanatory Badges */}
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Aerosol Morphology</span>
            <span className="font-semibold text-teal-700 dark:text-[#24B8A0]">
              Sub-micron (&lt; 0.1 µm) Un-agglomerated
            </span>
          </div>
          <div className="p-2 rounded bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase">Detector Implication</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              Delayed Optical Scatter Alarm
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
