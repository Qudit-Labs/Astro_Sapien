import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Flame,
  Activity,
  Eye,
  Thermometer,
} from 'lucide-react';
import { GravityRegime } from '@shared/types/index';

export interface CombustionChamberProps {
  title: string;
  testRunId?: string;
  fuelName?: string;
  gravityRegime: GravityRegime;
  oxygenPct?: number | null;
  airflowCmS?: number | null;
  pressureKpa?: number | null;
  flameSpreadRateCmS?: number | null;
  burnDurationS?: number | null;
  sampleLengthCm?: number;
  // External sync controls for Dual-Burn Split Screen
  syncTime?: number;
  syncIsPlaying?: boolean;
  syncPlaybackSpeed?: number;
  onSyncTimeChange?: (time: number) => void;
  onSyncTogglePlay?: () => void;
  isSyncControlled?: boolean;
}

export const CombustionChamberCanvas: React.FC<CombustionChamberProps> = ({
  title,
  testRunId,
  fuelName = 'PMMA Sample',
  gravityRegime,
  oxygenPct = 21,
  airflowCmS = 5,
  pressureKpa = 101.3,
  flameSpreadRateCmS,
  burnDurationS,
  sampleLengthCm = 10.0,
  syncTime,
  syncIsPlaying,
  syncPlaybackSpeed = 1,
  onSyncTimeChange,
  onSyncTogglePlay,
  isSyncControlled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fallback physics parameters based on conditions
  const o2 = oxygenPct ?? 21;
  const flow = airflowCmS ?? 0;
  const pressure = pressureKpa ?? 101.3;

  // Determine realistic spread rate (cm/s)
  const spreadRate = useMemo(() => {
    if (flameSpreadRateCmS && flameSpreadRateCmS > 0) return flameSpreadRateCmS;
    // Heuristic scaling
    const o2Factor = Math.max(0.05, (o2 - 12) / 9);
    const flowFactor = 1 + Math.min(flow, 30) / 25;
    if (gravityRegime === 'microgravity') {
      return Number((0.28 * o2Factor * flowFactor).toFixed(2));
    } else if (gravityRegime === 'earth_normal') {
      return Number((0.75 * o2Factor * flowFactor).toFixed(2));
    } else if (gravityRegime === 'lunar_partial') {
      return Number((0.40 * o2Factor * flowFactor).toFixed(2));
    } else {
      return Number((0.50 * o2Factor * flowFactor).toFixed(2));
    }
  }, [flameSpreadRateCmS, o2, flow, gravityRegime]);

  // Determine burn duration (s)
  const duration = useMemo(() => {
    if (burnDurationS && burnDurationS > 0) return burnDurationS;
    if (o2 < 14) return 8.0; // Rapid extinction under low oxygen
    const calculated = sampleLengthCm / Math.max(0.05, spreadRate);
    return Number(Math.min(60, Math.max(8, calculated)).toFixed(1));
  }, [burnDurationS, sampleLengthCm, spreadRate, o2]);

  // Local state for self-contained playback
  const [localTime, setLocalTime] = useState<number>(0);
  const [localIsPlaying, setLocalIsPlaying] = useState<boolean>(false);
  const [localSpeed, setLocalSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'optical' | 'thermal'>('optical');

  // Active time & play state
  const currentTime = isSyncControlled && syncTime !== undefined ? syncTime : localTime;
  const isPlaying = isSyncControlled && syncIsPlaying !== undefined ? syncIsPlaying : localIsPlaying;
  const playbackSpeed = isSyncControlled && syncPlaybackSpeed !== undefined ? syncPlaybackSpeed : localSpeed;

  const setCurrentTime = useCallback(
    (t: number | ((prev: number) => number)) => {
      if (isSyncControlled && onSyncTimeChange) {
        const next = typeof t === 'function' ? t(currentTime) : t;
        onSyncTimeChange(Math.max(0, Math.min(duration, next)));
      } else {
        setLocalTime((prev) => {
          const next = typeof t === 'function' ? t(prev) : t;
          return Math.max(0, Math.min(duration, next));
        });
      }
    },
    [isSyncControlled, onSyncTimeChange, currentTime, duration]
  );

  const togglePlay = () => {
    if (isSyncControlled && onSyncTogglePlay) {
      onSyncTogglePlay();
    } else {
      if (localTime >= duration) {
        setLocalTime(0);
      }
      setLocalIsPlaying((p) => !p);
    }
  };

  const handleReset = () => {
    if (isSyncControlled && onSyncTimeChange) {
      onSyncTimeChange(0);
    } else {
      setLocalTime(0);
      setLocalIsPlaying(false);
    }
  };

  // Animation frame loop for playback progression
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec * playbackSpeed;
        if (next >= duration) {
          if (!isSyncControlled) setLocalIsPlaying(false);
          return duration;
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed, duration, setCurrentTime, isSyncControlled]);

  // Main 2D Canvas Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI support
    const dpr = window.devicePixelRatio || 1;
    const width = 480;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let renderFrameId: number;

    // Particle pool for smoke and airflow
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number }> = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * width,
        y: 60 + Math.random() * 120,
        vx: (flow / 10) * 1.5 + (Math.random() * 0.5 + 0.2),
        vy: gravityRegime === 'earth_normal' ? -(Math.random() * 1.8 + 0.8) : (Math.random() - 0.5) * 0.3,
        life: Math.random(),
        size: Math.random() * 3 + 1.5,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Dark Chamber Interior Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#040B14');
      bgGrad.addColorStop(0.5, '#071626');
      bgGrad.addColorStop(1, '#02060D');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Chamber Grid Coordinates & Measurement Rulers
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 30; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 30; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Airflow Vector Streamlines
      if (flow > 0) {
        ctx.strokeStyle = 'rgba(36, 184, 160, 0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        const flowShift = (performance.now() * 0.05 * (flow / 10)) % 10;
        ctx.lineDashOffset = -flowShift;
        for (let y = 40; y <= 200; y += 40) {
          ctx.beginPath();
          ctx.moveTo(10, y);
          ctx.lineTo(width - 10, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // 3. Fuel Sample Strip
      const sampleStartX = 50;
      const sampleEndX = width - 50;
      const sampleTotalPx = sampleEndX - sampleStartX;
      const sampleY = 155;
      const sampleHeight = 12;

      // Current flame front progress
      const progressFraction = Math.min(1, currentTime / duration);
      const flameFrontPx = sampleStartX + progressFraction * sampleTotalPx;

      // Unburned Fuel (Right of flame front)
      ctx.fillStyle = viewMode === 'optical' ? '#E2E8F0' : '#475569';
      ctx.fillRect(flameFrontPx, sampleY, sampleEndX - flameFrontPx, sampleHeight);

      // Charred / Burned Zone (Left of flame front)
      if (flameFrontPx > sampleStartX) {
        const charGrad = ctx.createLinearGradient(sampleStartX, 0, flameFrontPx, 0);
        charGrad.addColorStop(0, '#0F172A');
        charGrad.addColorStop(1, '#1E293B');
        ctx.fillStyle = charGrad;
        ctx.fillRect(sampleStartX, sampleY, flameFrontPx - sampleStartX, sampleHeight);
      }

      // Sample mounting brackets
      ctx.fillStyle = '#64748B';
      ctx.fillRect(sampleStartX - 6, sampleY - 3, 6, sampleHeight + 6);
      ctx.fillRect(sampleEndX, sampleY - 3, 6, sampleHeight + 6);

      // Centimeter Ruler ticks under sample
      ctx.fillStyle = 'rgba(159, 177, 199, 0.4)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      for (let cm = 0; cm <= sampleLengthCm; cm += 2) {
        const tickX = sampleStartX + (cm / sampleLengthCm) * sampleTotalPx;
        ctx.fillRect(tickX - 0.5, sampleY + sampleHeight + 2, 1, 4);
        ctx.fillText(`${cm}cm`, tickX, sampleY + sampleHeight + 14);
      }

      // 4. Combustion Flame Rendering Physics
      const isExtinct = currentTime >= duration || (o2 < 14 && currentTime > 6.0);
      const isQuenching = o2 < 14 && currentTime > 3.0;

      if (!isExtinct && progressFraction < 0.99) {
        const flameX = flameFrontPx;
        const flameY = sampleY + 2;

        // Oxygen scaling factor
        const o2Scale = isQuenching
          ? Math.max(0.2, 1 - (currentTime - 3.0) / 3.0)
          : Math.min(1.4, Math.max(0.4, (o2 - 10) / 11));

        // Airflow tilt angle
        const tiltX = (flow / 25) * 16;

        // Base flame radius
        const baseRadius = 26 * o2Scale;

        if (viewMode === 'optical') {
          if (gravityRegime === 'microgravity') {
            // ==========================================
            // MICROGRAVITY (µg): Calm Spherical Blue Dome
            // Zero buoyant flicker, radial symmetry, cyan/blue chemiluminescence
            // ==========================================
            const breathe = Math.sin(performance.now() * 0.003) * 1.5;
            const r = Math.max(8, baseRadius + breathe);

            // Outer Chemiluminescent Blue Glow
            const glowGrad = ctx.createRadialGradient(
              flameX + tiltX * 0.4,
              flameY - 4,
              2,
              flameX + tiltX * 0.4,
              flameY - 4,
              r * 1.8
            );
            glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
            glowGrad.addColorStop(0.35, 'rgba(14, 116, 144, 0.6)');
            glowGrad.addColorStop(0.7, 'rgba(11, 61, 145, 0.25)');
            glowGrad.addColorStop(1, 'rgba(11, 61, 145, 0)');

            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(flameX + tiltX * 0.4, flameY - 4, r * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Inner Vibrant Reaction Core Dome
            const coreGrad = ctx.createRadialGradient(
              flameX + tiltX * 0.2,
              flameY - 2,
              1,
              flameX + tiltX * 0.2,
              flameY - 2,
              r * 0.9
            );
            coreGrad.addColorStop(0, '#FFFFFF');
            coreGrad.addColorStop(0.3, '#38BDF8');
            coreGrad.addColorStop(0.7, '#0284C7');
            coreGrad.addColorStop(1, 'rgba(3, 105, 161, 0)');

            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(flameX + tiltX * 0.2, flameY - 2, r * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Quenching Shell Ring
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.arc(flameX + tiltX * 0.4, flameY - 4, r * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // ==========================================
            // EARTH (1g) / PARTIAL GRAVITY: Buoyant Teardrop
            // Chaotic upward flicker, yellow/orange tip, buoyant soot
            // ==========================================
            const flickerSpeed = performance.now() * 0.02;
            const flicker = Math.sin(flickerSpeed) * 3 + Math.cos(flickerSpeed * 2.3) * 2;
            const buoyancyMult =
              gravityRegime === 'earth_normal' ? 2.6 : gravityRegime === 'martian_partial' ? 1.7 : 1.3;
            const flameHeight = (baseRadius * buoyancyMult + flicker) * (gravityRegime === 'earth_normal' ? 1 : 0.85);
            const flameWidth = baseRadius * 0.9;

            // Outer Thermal Buoyant Envelope
            ctx.save();
            ctx.translate(flameX, flameY);
            ctx.beginPath();
            ctx.moveTo(-flameWidth, 0);
            ctx.bezierCurveTo(
              -flameWidth * 1.2,
              -flameHeight * 0.4,
              tiltX - flameWidth * 0.4,
              -flameHeight * 0.8,
              tiltX,
              -flameHeight
            );
            ctx.bezierCurveTo(
              tiltX + flameWidth * 0.4,
              -flameHeight * 0.8,
              flameWidth * 1.2,
              -flameHeight * 0.4,
              flameWidth,
              0
            );
            ctx.closePath();

            const earthGrad = ctx.createLinearGradient(0, 0, tiltX, -flameHeight);
            earthGrad.addColorStop(0, 'rgba(56, 189, 248, 0.8)'); // Blue base
            earthGrad.addColorStop(0.25, '#F5B942'); // Bright yellow
            earthGrad.addColorStop(0.65, '#EA580C'); // Orange
            earthGrad.addColorStop(0.9, '#DC2626'); // Red tip
            earthGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');

            ctx.fillStyle = earthGrad;
            ctx.fill();

            // Inner Hot Core
            ctx.beginPath();
            ctx.moveTo(-flameWidth * 0.5, 0);
            ctx.bezierCurveTo(
              -flameWidth * 0.6,
              -flameHeight * 0.3,
              tiltX * 0.5 - flameWidth * 0.2,
              -flameHeight * 0.5,
              tiltX * 0.5,
              -flameHeight * 0.6
            );
            ctx.bezierCurveTo(
              tiltX * 0.5 + flameWidth * 0.2,
              -flameHeight * 0.5,
              flameWidth * 0.6,
              -flameHeight * 0.3,
              flameWidth * 0.5,
              0
            );
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fill();
            ctx.restore();
          }
        } else {
          // ==========================================
          // FLIR THERMAL FALSE-COLOR INFRARED (Ironbow)
          // 300K -> 1600K false color heat map
          // ==========================================
          const r = baseRadius * 1.6;
          const flirGrad = ctx.createRadialGradient(flameX, flameY - 5, 2, flameX, flameY - 5, r * 1.5);
          flirGrad.addColorStop(0, '#FFFFFF'); // Peak white heat (>1500 K)
          flirGrad.addColorStop(0.2, '#FEF08A'); // Yellow (1200 K)
          flirGrad.addColorStop(0.45, '#F97316'); // Orange (900 K)
          flirGrad.addColorStop(0.7, '#A855F7'); // Magenta / Violet (600 K)
          flirGrad.addColorStop(0.9, '#1E1B4B'); // Deep Indigo (400 K)
          flirGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');

          ctx.fillStyle = flirGrad;
          ctx.beginPath();
          ctx.arc(flameX, flameY - 5, r * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Isothermal Contour Lines
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(flameX, flameY - 5, r * 0.6, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
          ctx.beginPath();
          ctx.arc(flameX, flameY - 5, r * 1.0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Drifting Smoke Aerosol Particles
        if (gravityRegime === 'microgravity') {
          // Microgravity: sub-micron smoke particles drifting horizontally without buoyancy
          for (let p of particles) {
            p.x += p.vx;
            if (p.x > width) p.x = flameX + (Math.random() - 0.5) * 10;
            ctx.fillStyle = `rgba(56, 189, 248, ${0.35 * (1 - p.x / width)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Earth: smoke curls and accelerates upward toward ceiling exhaust
          for (let p of particles) {
            p.x += p.vx * 0.6;
            p.y += p.vy;
            if (p.y < 10) {
              p.y = sampleY - 10;
              p.x = flameX + (Math.random() - 0.5) * 15;
            }
            ctx.fillStyle = `rgba(148, 163, 184, ${0.4 * (p.y / sampleY)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (isExtinct) {
        // Extinct embers
        ctx.fillStyle = '#EF4444';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EXTINCT / BURNOUT COMPLETE', width / 2, sampleY - 20);
      }

      renderFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(renderFrameId);
  }, [
    currentTime,
    duration,
    sampleLengthCm,
    gravityRegime,
    o2,
    flow,
    viewMode,
  ]);

  // Derived telemetry metrics
  const currentFlameXCm = Number(
    Math.min(sampleLengthCm, (currentTime / duration) * sampleLengthCm).toFixed(2)
  );

  const flameStatus =
    currentTime >= duration
      ? 'EXTINCT'
      : o2 < 14 && currentTime > 3
      ? 'QUENCHING'
      : currentTime < 1.0
      ? 'IGNITION'
      : 'STEADY BURN';

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="rounded-xl bg-slate-950 dark:bg-[#07172B] border border-slate-700/80 dark:border-sky-900/60 overflow-hidden shadow-xl flex flex-col">
      {/* Chamber Top HUD Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 dark:bg-[#0B1E36] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Flame
            className={`w-4 h-4 ${
              gravityRegime === 'microgravity' ? 'text-[#38BDF8]' : 'text-amber-500'
            }`}
          />
          <span className="font-semibold text-white tracking-wide">{title}</span>
          {testRunId && (
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-[#38BDF8]">
              {testRunId}
            </span>
          )}
        </div>

        {/* Diagnostic Color Mode Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'optical' ? 'thermal' : 'optical'))}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1 ${
              viewMode === 'thermal'
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {viewMode === 'thermal' ? (
              <>
                <Thermometer className="w-3 h-3 text-purple-400" />
                FLIR Thermal
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-[#38BDF8]" />
                Optical True-Color
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Viewport Container with NASA HUD Overlay */}
      <div className="relative w-full aspect-[2/1] bg-black overflow-hidden flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />

        {/* Live HUD Badges Overlay */}
        <div className="absolute top-2.5 left-3 flex flex-col gap-1 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-slate-700/60 font-mono text-[11px] text-[#38BDF8]">
            <Activity className="w-3 h-3 text-teal-400 animate-pulse" />
            <span>T+{formatTimer(currentTime)}s</span>
            <span className="text-slate-400">/ {duration.toFixed(1)}s</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-slate-700/60 font-mono text-[10px] text-slate-300">
            <span>Front X:</span>
            <span className="font-bold text-teal-300">{currentFlameXCm.toFixed(1)} cm</span>
            <span className="text-slate-400">({spreadRate.toFixed(2)} cm/s)</span>
          </div>
        </div>

        {/* Status Badge (Top Right) */}
        <div className="absolute top-2.5 right-3 pointer-events-none">
          <span
            className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border shadow-sm ${
              flameStatus === 'EXTINCT'
                ? 'bg-red-950/80 text-red-400 border-red-700'
                : flameStatus === 'QUENCHING'
                ? 'bg-amber-950/80 text-amber-400 border-amber-700'
                : flameStatus === 'IGNITION'
                ? 'bg-blue-950/80 text-blue-400 border-blue-700'
                : 'bg-teal-950/80 text-[#24B8A0] border-teal-700'
            }`}
          >
            {flameStatus}
          </span>
        </div>

        {/* Telemetry Bar (Bottom Left Overlay) */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/70 px-2 py-1 rounded border border-slate-800/80 pointer-events-none">
          <div className="flex items-center gap-2.5">
            <span>
              O₂: <strong className="text-white">{o2}%</strong>
            </span>
            <span>•</span>
            <span>
              u: <strong className="text-white">{flow} cm/s</strong>
            </span>
            <span>•</span>
            <span>
              P: <strong className="text-white">{pressure} kPa</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="capitalize text-sky-400">{gravityRegime.replace('_', ' ')}</span>
            <span>•</span>
            <span className="truncate max-w-[120px] text-slate-300">{fuelName}</span>
          </div>
        </div>
      </div>

      {/* Scrub & Playback Controls Bar */}
      <div className="p-3 bg-slate-900/90 dark:bg-[#07172B] border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 rounded-lg bg-[#0B3D91] hover:bg-sky-700 text-white transition shadow-sm"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Reset to Ignition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Interactive Scrub Timeline Slider */}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            aria-label="Timeline scrub"
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
          />

          {/* Speed Multiplier Button */}
          <button
            type="button"
            onClick={() => {
              const next = playbackSpeed === 1 ? 2 : 1;
              if (!isSyncControlled) setLocalSpeed(next);
            }}
            className="px-2 py-1 rounded text-[11px] font-mono bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
};
