import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Wind,
  Layers,
  RotateCcw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Sliders,
  ShieldCheck,
  Play,
  Pause,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import {
  InteractiveChamberCanvas,
  FuelType,
  ViewMode,
  FUEL_SPECS,
} from '../components/simulation/InteractiveChamberCanvas';
import { MissionChallengeDeck } from '../components/simulation/MissionChallengeDeck';

export const SimulationLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'challenges'>('sandbox');

  // Sandbox parameters
  const [gravityG, setGravityG] = useState<number>(0.0);
  const [oxygenPct, setOxygenPct] = useState<number>(21.0);
  const [airflowCmS, setAirflowCmS] = useState<number>(5.0);
  const [pressureKpa, setPressureKpa] = useState<number>(101.3);
  const [fuelType, setFuelType] = useState<FuelType>('PMMA');
  const [viewMode, setViewMode] = useState<ViewMode>('optical');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Live physics state from canvas
  const [physicsState, setPhysicsState] = useState({
    spreadRateCmS: 0.28,
    flameTempC: 980,
    reynoldsNumber: 154,
    damkohlerNumber: 5.6,
    opticalDepth: 0.96,
    isExtinguished: false,
    extinctionReason: null as string | null,
    emberScatter: false,
  });

  const currentFuelSpec = FUEL_SPECS[fuelType];

  const handleApplyPreset = (preset: {
    g: number;
    o2: number;
    flow: number;
    p: number;
    fuel: FuelType;
  }) => {
    setGravityG(preset.g);
    setOxygenPct(preset.o2);
    setAirflowCmS(preset.flow);
    setPressureKpa(preset.p);
    setFuelType(preset.fuel);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Interactive Simulation Lab"
        title="Spacecraft Combustion & Safety Simulation Lab"
        subtitle="Explore microgravity combustion physics with real-time parametric sandbox controls, live fluid streamlines, thermal infrared imaging, and gamified NASA Flight Safety challenges."
      />

      {/* Main Mode Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'sandbox'
              ? 'bg-[#0B3D91] text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-[#10243D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-[#38BDF8]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Virtual Combustion Sandbox</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'challenges'
              ? 'bg-[#0B3D91] text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-[#10243D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-[#38BDF8]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Flight Safety Officer Challenges</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            3 MISSIONS
          </span>
        </button>
      </div>

      {activeTab === 'challenges' ? (
        <MissionChallengeDeck />
      ) : (
        /* Sandbox Workspace */
        <div className="space-y-6">
          {/* Quick Gravity & Facility Presets */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
              <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              <span>Experiment Environment Presets:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { name: 'ISS Microgravity (BASS-II)', g: 0.0, o2: 21.0, flow: 5.0, p: 101.3, fuel: 'PMMA' as FuelType },
                { name: 'Moon Artemis (1/6 g)', g: 0.166, o2: 24.0, flow: 4.0, p: 70.3, fuel: 'SIBAL' as FuelType },
                { name: 'Mars Surface (3/8 g)', g: 0.375, o2: 21.0, flow: 6.0, p: 85.0, fuel: 'Silicone' as FuelType },
                { name: 'Earth Normal (1.0 g)', g: 1.0, o2: 20.9, flow: 5.0, p: 101.3, fuel: 'PMMA' as FuelType },
                { name: 'Droplet Burning (FLEX)', g: 0.0, o2: 21.0, flow: 0.0, p: 101.3, fuel: 'Methanol' as FuelType },
              ].map((pst) => (
                <button
                  key={pst.name}
                  type="button"
                  onClick={() => handleApplyPreset(pst)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono border bg-slate-50 dark:bg-[#07172B] border-slate-300 dark:border-slate-700 hover:border-[#38BDF8] text-slate-800 dark:text-slate-200 transition"
                >
                  {pst.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Parametric Knobs & Sliders (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8] flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    <span>CHAMBER PARAMETERS</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setGravityG(0.0);
                      setOxygenPct(21.0);
                      setAirflowCmS(5.0);
                      setPressureKpa(101.3);
                      setFuelType('PMMA');
                    }}
                    className="text-[11px] font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Gravity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" /> Gravity Regime (g)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {gravityG.toFixed(3)} g{' '}
                      {gravityG === 0
                        ? '(µg ISS)'
                        : Math.abs(gravityG - 0.166) < 0.05
                        ? '(Moon 1/6g)'
                        : Math.abs(gravityG - 0.375) < 0.05
                        ? '(Mars 3/8g)'
                        : gravityG === 1
                        ? '(Earth 1g)'
                        : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.2}
                    step={0.02}
                    value={gravityG}
                    onChange={(e) => setGravityG(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0g (Microgravity)</span>
                    <span>1/6g (Moon)</span>
                    <span>3/8g (Mars)</span>
                    <span>1g (Earth)</span>
                  </div>
                </div>

                {/* Oxygen % Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-500" /> Oxygen Concentration (% O₂)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {oxygenPct.toFixed(1)}%{' '}
                      <span className="text-[11px] font-normal text-slate-400">(LOC: {currentFuelSpec.locPct}%)</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10.0}
                    max={35.0}
                    step={0.5}
                    value={oxygenPct}
                    onChange={(e) => setOxygenPct(parseFloat(e.target.value))}
                    className="w-full accent-[#FC3D21]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-red-400">10% (Extinction)</span>
                    <span>15.2% (BASS LOC)</span>
                    <span>21% (Earth Air)</span>
                    <span className="text-amber-400">35% (Hyperoxic)</span>
                  </div>
                </div>

                {/* Ventilation Airflow Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-teal-400" /> Ventilation Velocity (cm/s)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {airflowCmS.toFixed(1)} cm/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={30.0}
                    step={0.5}
                    value={airflowCmS}
                    onChange={(e) => setAirflowCmS(parseFloat(e.target.value))}
                    className="w-full accent-[#24B8A0]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0 (Quiescent Diffusion)</span>
                    <span>5 (Glovebox Draft)</span>
                    <span>20 (Cygnus Saffire)</span>
                    <span>30 (Blowoff)</span>
                  </div>
                </div>

                {/* Cabin Pressure Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" /> Chamber Pressure (kPa)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {pressureKpa.toFixed(1)} kPa
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30.0}
                    max={135.0}
                    step={1.0}
                    value={pressureKpa}
                    onChange={(e) => setPressureKpa(parseFloat(e.target.value))}
                    className="w-full accent-[#38BDF8]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>34 kPa (Artemis Suit)</span>
                    <span>70 kPa (Airlock)</span>
                    <span>101.3 kPa (1 atm)</span>
                  </div>
                </div>

                {/* Fuel Material Selector */}
                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Fuel Material Sample:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(FUEL_SPECS) as FuelType[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFuelType(f)}
                        className={`p-2 rounded-lg border text-left transition ${
                          fuelType === f
                            ? 'bg-[#0B3D91] text-white border-[#38BDF8] ring-1 ring-[#38BDF8]'
                            : 'bg-slate-50 dark:bg-[#07172B] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold">{f}</div>
                        <div className="text-[10px] opacity-80 truncate">{FUEL_SPECS[f].name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 2D Physics Canvas & Live Telemetry Gauges (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#38BDF8]" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      COMBUSTION CHAMBER SIMULATION // {fuelType} ({currentFuelSpec.name})
                    </span>
                  </div>

                  {/* View Mode & Playback Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-[#38BDF8] text-xs flex items-center gap-1"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-0.5 text-[10px] font-mono">
                      {[0.5, 1, 2].map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => setPlaybackSpeed(sp)}
                          className={`px-1.5 py-0.5 rounded ${
                            playbackSpeed === sp
                              ? 'bg-[#0B3D91] text-white font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {sp}x
                        </button>
                      ))}
                    </div>

                    {(['optical', 'thermal', 'streamlines'] as ViewMode[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setViewMode(v)}
                        className={`px-3 py-1 rounded text-xs font-mono uppercase font-bold border transition ${
                          viewMode === v
                            ? 'bg-[#0B3D91] text-white border-[#38BDF8]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {v === 'optical' ? 'Visible Optical' : v === 'thermal' ? 'FLIR Thermal IR' : 'Streamlines'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Canvas */}
                <InteractiveChamberCanvas
                  gravityG={gravityG}
                  oxygenPct={oxygenPct}
                  airflowCmS={airflowCmS}
                  pressureKpa={pressureKpa}
                  fuelType={fuelType}
                  viewMode={viewMode}
                  isPlaying={isPlaying}
                  playbackSpeed={playbackSpeed}
                  onPhysicsUpdate={setPhysicsState}
                />

                {/* Active Alerts */}
                {physicsState.isExtinguished ? (
                  <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-semibold">{physicsState.extinctionReason}</span>
                  </div>
                ) : oxygenPct >= 30 ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      HYPEROXIC RUNAWAY RISK: High oxygen concentration ({oxygenPct.toFixed(1)}%) drives severe soot
                      radiation and accelerated flame propagation.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Nominal flame spread sustained via balanced convective-diffusive oxygen transport.</span>
                  </div>
                )}

                {/* Real-Time Physics Telemetry HUD Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Spread Rate</div>
                    <div className="text-base font-bold font-mono text-[#0B3D91] dark:text-[#38BDF8] mt-0.5">
                      {physicsState.spreadRateCmS} <span className="text-xs font-normal">cm/s</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Flame Temp</div>
                    <div className="text-base font-bold font-mono text-red-600 dark:text-red-400 mt-0.5">
                      {physicsState.flameTempC} <span className="text-xs font-normal">°C</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Reynolds (Re)</div>
                    <div className="text-base font-bold font-mono text-teal-600 dark:text-[#24B8A0] mt-0.5">
                      {physicsState.reynoldsNumber}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Damköhler (Da)</div>
                    <div className="text-base font-bold font-mono text-amber-600 dark:text-[#F5B942] mt-0.5">
                      {physicsState.damkohlerNumber}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
