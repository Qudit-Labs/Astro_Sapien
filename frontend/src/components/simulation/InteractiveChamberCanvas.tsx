import React, { useRef, useEffect, useMemo } from 'react';

export type FuelType = 'PMMA' | 'SIBAL' | 'Kapton' | 'Silicone' | 'Methanol';
export type ViewMode = 'optical' | 'thermal' | 'streamlines';
export type SuppressantType = 'none' | 'CO2' | 'He' | 'SF6';

export interface InteractiveChamberCanvasProps {
  gravityG: number;             // 0.0 (microgravity) to 1.5 (high g)
  oxygenPct: number;            // 10 to 35 %
  airflowCmS: number;           // 0 to 30 cm/s
  pressureKpa: number;          // 30 to 140 kPa
  fuelType: FuelType;
  viewMode: ViewMode;
  suppressant?: SuppressantType;
  suppressantActive?: boolean;
  suppressantFlow?: number;     // 0 to 25 cm/s
  isPlaying?: boolean;
  playbackSpeed?: number;
  onPhysicsUpdate?: (physics: {
    spreadRateCmS: number;
    flameTempC: number;
    reynoldsNumber: number;
    damkohlerNumber: number;
    opticalDepth: number;
    isExtinguished: boolean;
    extinctionReason: string | null;
    emberScatter: boolean;
  }) => void;
}

export const FUEL_SPECS: Record<
  FuelType,
  {
    name: string;
    locPct: number;
    baseSpreadRate: number;
    baseTemp: number;
    color: string;
    smokeRate: number;
    description: string;
  }
> = {
  PMMA: {
    name: 'Clear Cast PMMA (Acrylic)',
    locPct: 15.2,
    baseSpreadRate: 0.28,
    baseTemp: 980,
    color: '#38BDF8',
    smokeRate: 1.2,
    description: 'Thermoplastic polymer tested in BASS-II glovebox flights.',
  },
  SIBAL: {
    name: 'SIBAL Fabric (Cotton/Fiberglass)',
    locPct: 16.0,
    baseSpreadRate: 0.45,
    baseTemp: 1120,
    color: '#F5B942',
    smokeRate: 1.6,
    description: 'SAFFIRE spacecraft cargo panel fabric blend.',
  },
  Kapton: {
    name: 'Kapton Polyimide Wire Insulation',
    locPct: 20.5,
    baseSpreadRate: 0.18,
    baseTemp: 840,
    color: '#F97316',
    smokeRate: 2.4,
    description: 'SAME-R microgravity smoke aerosol pyrolysis source.',
  },
  Silicone: {
    name: 'Silicone Elastomer Tubing',
    locPct: 18.5,
    baseSpreadRate: 0.22,
    baseTemp: 910,
    color: '#24B8A0',
    smokeRate: 1.8,
    description: 'Spacecraft seal & damping material with silica aerosol.',
  },
  Methanol: {
    name: 'Liquid Methanol Droplet',
    locPct: 14.0,
    baseSpreadRate: 0.52,
    baseTemp: 1250,
    color: '#6366F1',
    smokeRate: 0.4,
    description: 'FLEX isolated microgravity spherical droplet combustion.',
  },
};

export const InteractiveChamberCanvas: React.FC<InteractiveChamberCanvasProps> = ({
  gravityG,
  oxygenPct,
  airflowCmS,
  pressureKpa,
  fuelType,
  viewMode,
  suppressant = 'none',
  suppressantActive = false,
  suppressantFlow = 10,
  isPlaying = true,
  playbackSpeed = 1,
  onPhysicsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spec = FUEL_SPECS[fuelType];

  // Deterministic physics calculations
  const physics = useMemo(() => {
    const o2Deficit = oxygenPct - spec.locPct;
    let isExtinguished = false;
    let extinctionReason: string | null = null;
    let emberScatter = false;

    // 1. Oxygen extinction check (Radiative Quenching)
    if (oxygenPct < spec.locPct) {
      isExtinguished = true;
      extinctionReason = `Radiative Quenching: O₂ concentration (${oxygenPct.toFixed(1)}%) is below fuel LOC (${spec.locPct}%).`;
    }

    // 2. High flow blowoff check
    if (airflowCmS > 22 && oxygenPct < 19) {
      isExtinguished = true;
      extinctionReason = `Convective Blowoff: High airflow (${airflowCmS.toFixed(1)} cm/s) stripped heat faster than chemical kinetics.`;
    }

    // 3. Suppressant impact
    if (suppressantActive && suppressant !== 'none') {
      const effectiveness = suppressant === 'SF6' ? 1.8 : suppressant === 'CO2' ? 1.4 : 1.2;
      const coolingPower = (suppressantFlow / 10) * effectiveness;

      if (coolingPower > 1.2) {
        isExtinguished = true;
        extinctionReason = `Extinguished by ${suppressant} injection (thermal capacity & oxygen displacement).`;
      }

      if (suppressantFlow > 18) {
        emberScatter = true;
      }
    }

    // 4. Spread rate scaling
    let spreadRate = 0;
    if (!isExtinguished) {
      const o2Factor = Math.max(0.1, 1 + o2Deficit * 0.08);
      const flowFactor = 1 + Math.min(airflowCmS, 25) / 22;
      const pressureFactor = Math.pow(pressureKpa / 101.3, 0.3);
      const gFactor = gravityG === 0 ? 0.7 : 0.7 + gravityG * 0.3; // Earth buoyancy enhances spread
      spreadRate = Number((spec.baseSpreadRate * o2Factor * flowFactor * pressureFactor * gFactor).toFixed(2));
    }

    // 5. Flame Temperature
    const flameTemp = isExtinguished
      ? 180
      : Math.round(spec.baseTemp * (oxygenPct / 21) * Math.pow(pressureKpa / 101.3, 0.12));

    // 6. Dimensionless numbers
    // Re = rho * v * L / mu
    const airDensity = (pressureKpa * 1000) / (287.05 * 293.15); // kg/m^3
    const characteristicLength = 0.05; // 5 cm
    const dynamicViscosity = 1.81e-5;
    const reynoldsNumber = Math.round((airDensity * (airflowCmS / 100) * characteristicLength) / dynamicViscosity);

    // Damkohler Da = tau_flow / tau_chem ~ (L / v) * (exp(-E/RT) * [O2]^2)
    const damkohlerNumber = isExtinguished
      ? 0.15
      : Number((Math.max(0.4, (28 / Math.max(1, airflowCmS)) * (oxygenPct / 21))).toFixed(2));

    // Optical depth
    const opticalDepth = isExtinguished
      ? 0.05
      : Number((spec.smokeRate * (1 - gravityG * 0.4) * (pressureKpa / 101.3) * 0.8).toFixed(2));

    return {
      spreadRateCmS: spreadRate,
      flameTempC: flameTemp,
      reynoldsNumber,
      damkohlerNumber,
      opticalDepth,
      isExtinguished,
      extinctionReason,
      emberScatter,
    };
  }, [oxygenPct, airflowCmS, pressureKpa, gravityG, spec, suppressant, suppressantActive, suppressantFlow]);

  // Notify parent of physics updates
  useEffect(() => {
    onPhysicsUpdate?.(physics);
  }, [physics, onPhysicsUpdate]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 560;
    const height = 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animId: number;

    // Particle pool for smoke, convective airflow, and soot sparks
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      type: 'smoke' | 'spark' | 'suppressant';
    }> = [];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: 80 + Math.random() * 120,
        vx: (airflowCmS / 10) * 1.8 + Math.random() * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        life: Math.random(),
        maxLife: 1.0,
        size: Math.random() * 3 + 1.5,
        type: 'smoke',
      });
    }

    let burnProgress = 0.25;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Laboratory Chamber Background
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#040B16');
      bg.addColorStop(0.5, '#071526');
      bg.addColorStop(1, '#02060D');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // 2. High-Precision Chamber Coordinate Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 35; x < width; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 35; y < height; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Airflow Vector Streamlines (Green / Cyan dotted arrows)
      if (airflowCmS > 0 || viewMode === 'streamlines') {
        ctx.strokeStyle = viewMode === 'streamlines' ? 'rgba(36, 184, 160, 0.35)' : 'rgba(36, 184, 160, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        const shift = (performance.now() * 0.05 * (airflowCmS / 8)) % 10;
        ctx.lineDashOffset = -shift;
        for (let y = 50; y <= 240; y += 45) {
          ctx.beginPath();
          ctx.moveTo(15, y);
          ctx.lineTo(width - 15, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // 3. Fuel Sample Strip (Center)
      const sampleStartX = 70;
      const sampleEndX = width - 70;
      const sampleTotalPx = sampleEndX - sampleStartX;
      const sampleY = 175;
      const sampleHeight = fuelType === 'Methanol' ? 16 : 10;

      if (isPlaying && !physics.isExtinguished) {
        burnProgress = (burnProgress + 0.0006 * playbackSpeed * physics.spreadRateCmS) % 1.0;
      }
      const flameFrontX = sampleStartX + burnProgress * sampleTotalPx;

      // Fuel render
      if (fuelType === 'Methanol') {
        // Droplet mode
        ctx.fillStyle = '#6366F1';
        ctx.beginPath();
        ctx.arc(width / 2, sampleY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#818CF8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Unburned solid slab
        ctx.fillStyle = viewMode === 'thermal' ? '#334155' : '#CBD5E1';
        ctx.fillRect(flameFrontX, sampleY, sampleEndX - flameFrontX, sampleHeight);

        // Charred Burned Zone (Left of flame front)
        if (flameFrontX > sampleStartX) {
          const charGrad = ctx.createLinearGradient(sampleStartX, 0, flameFrontX, 0);
          charGrad.addColorStop(0, '#090D16');
          charGrad.addColorStop(1, '#1E293B');
          ctx.fillStyle = charGrad;
          ctx.fillRect(sampleStartX, sampleY, flameFrontX - sampleStartX, sampleHeight);
        }

        // Slab edge border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sampleStartX, sampleY, sampleTotalPx, sampleHeight);
      }

      // 4. Flame Morphology Physics Rendering
      const flameX = fuelType === 'Methanol' ? width / 2 : flameFrontX;
      const flameBaseY = sampleY;

      if (!physics.isExtinguished) {
        // Compute flame height & elongation based on gravity and flow
        // In 0g: round sphere. In 1g: tall teardrop pointing upward
        const buoyantRisePx = gravityG * 48; // Upward stretching
        const flowTrailingPx = (airflowCmS / 30) * 55; // Rightward stretching

        const radiusX = 18 + (oxygenPct / 21) * 8 + flowTrailingPx * 0.4;
        const radiusY = 16 + (oxygenPct / 21) * 6 + buoyantRisePx;

        ctx.save();
        ctx.translate(flameX, flameBaseY);

        if (viewMode === 'thermal') {
          // FLIR False-Color Thermal Infrared View
          // Outer thermal plume
          const thermGrad = ctx.createRadialGradient(
            flowTrailingPx * 0.3,
            -buoyantRisePx * 0.4,
            4,
            flowTrailingPx * 0.3,
            -buoyantRisePx * 0.4,
            radiusX * 2.2
          );
          thermGrad.addColorStop(0, '#FFFFFF'); // 1200 C core
          thermGrad.addColorStop(0.2, '#F59E0B'); // 800 C
          thermGrad.addColorStop(0.5, '#EF4444'); // 500 C
          thermGrad.addColorStop(0.8, '#8B5CF6'); // 300 C
          thermGrad.addColorStop(1, 'rgba(30, 27, 75, 0)'); // Ambient

          ctx.fillStyle = thermGrad;
          ctx.beginPath();
          ctx.ellipse(
            flowTrailingPx * 0.3,
            -buoyantRisePx * 0.3,
            radiusX * 1.8,
            radiusY * 1.8,
            (airflowCmS / 30) * 0.2,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Temperature contour ring
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Optical Visible Spectrum
          // A. Microgravity Soot Shell (Only in low gravity < 0.3g)
          if (gravityG < 0.35 && oxygenPct > 15) {
            ctx.strokeStyle = `rgba(245, 185, 66, ${0.45 * (1 - gravityG * 2.5)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, -6, radiusX * 1.15, 0, Math.PI * 2);
            ctx.stroke();
          }

          // B. Outer Blue Reaction Zone (Quenching boundary)
          const blueGrad = ctx.createRadialGradient(
            flowTrailingPx * 0.2,
            -buoyantRisePx * 0.3,
            2,
            flowTrailingPx * 0.2,
            -buoyantRisePx * 0.3,
            radiusX * 1.3
          );
          blueGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
          blueGrad.addColorStop(0.5, 'rgba(14, 116, 144, 0.6)');
          blueGrad.addColorStop(1, 'rgba(14, 116, 144, 0)');

          ctx.fillStyle = blueGrad;
          ctx.beginPath();
          ctx.ellipse(
            flowTrailingPx * 0.2,
            -buoyantRisePx * 0.25,
            radiusX * 1.1,
            radiusY * 1.05,
            (airflowCmS / 30) * 0.2,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // C. Inner Luminous Yellow Soot Flame (Buoyant in 1g, Centered in 0g)
          const coreGrad = ctx.createRadialGradient(
            flowTrailingPx * 0.2,
            -buoyantRisePx * 0.35,
            1,
            flowTrailingPx * 0.2,
            -buoyantRisePx * 0.35,
            radiusX * 0.75
          );
          coreGrad.addColorStop(0, '#FFFBEB');
          coreGrad.addColorStop(0.4, '#FDE047');
          coreGrad.addColorStop(0.75, '#F97316');
          coreGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.ellipse(
            flowTrailingPx * 0.2,
            -buoyantRisePx * 0.35,
            radiusX * 0.7,
            radiusY * 0.7,
            (airflowCmS / 30) * 0.2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        ctx.restore();
      } else {
        // Extinguished state: Puff of cold smoke
        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.beginPath();
        ctx.arc(flameX, flameBaseY - 10, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Suppressant Blast Cloud (If active)
      if (suppressantActive && suppressant !== 'none') {
        const suppColor = suppressant === 'SF6' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(56, 189, 248, 0.25)';
        ctx.fillStyle = suppColor;
        ctx.beginPath();
        ctx.ellipse(flameX + 10, flameBaseY - 15, 65, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = suppressant === 'SF6' ? '#A855F7' : '#38BDF8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 6. Dynamic Smoke & Spark Particles Simulation
      for (const p of particles) {
        p.x += p.vx * playbackSpeed;
        p.y += p.vy * playbackSpeed;
        p.life += 0.015 * playbackSpeed;

        // Gravity buoyancy on smoke
        if (gravityG > 0) {
          p.vy -= gravityG * 0.08 * playbackSpeed;
        }

        if (p.x > width || p.y < 20 || p.y > height - 20 || p.life > p.maxLife) {
          p.x = flameX + (Math.random() - 0.5) * 15;
          p.y = flameBaseY - 10 + (Math.random() - 0.5) * 10;
          p.vx = (airflowCmS / 10) * 1.8 + Math.random() * 0.5;
          p.vy = gravityG > 0 ? -gravityG * 1.2 : (Math.random() - 0.5) * 0.6;
          p.life = 0;
          p.size = Math.random() * 3 + 1.5;
        }

        const alpha = Math.max(0, 1 - p.life / p.maxLife) * (physics.isExtinguished ? 0.15 : 0.4);
        ctx.fillStyle =
          viewMode === 'thermal'
            ? `rgba(239, 68, 68, ${alpha * 0.6})`
            : physics.emberScatter
            ? `rgba(249, 115, 22, ${alpha * 1.2})`
            : `rgba(148, 163, 184, ${alpha})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. HUD Telemetry Overlay on Canvas
      ctx.fillStyle = 'rgba(7, 21, 38, 0.75)';
      ctx.fillRect(10, 10, 180, 52);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 180, 52);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '10px monospace';
      ctx.fillText(`GRAVITY: ${gravityG.toFixed(3)} g`, 18, 26);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(`FLAME TEMP: ${physics.flameTempC} °C`, 18, 40);
      ctx.fillStyle = physics.isExtinguished ? '#EF4444' : '#24B8A0';
      ctx.fillText(physics.isExtinguished ? 'STATE: EXTINCTION' : `SPREAD: ${physics.spreadRateCmS} cm/s`, 18, 54);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gravityG, oxygenPct, airflowCmS, pressureKpa, fuelType, viewMode, suppressant, suppressantActive, suppressantFlow, isPlaying, playbackSpeed, physics]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 flex flex-col items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: '560px', height: '280px' }}
        className="rounded-xl block"
      />
    </div>
  );
};
