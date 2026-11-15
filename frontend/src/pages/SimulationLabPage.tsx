import React, { useState, useEffect, useRef } from 'react';
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
  Wrench,
  Compass,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import {
  InteractiveChamberCanvas,
  FuelType,
  ViewMode,
  FUEL_SPECS,
} from '../components/simulation/InteractiveChamberCanvas';
import { MissionChallengeDeck } from '../components/simulation/MissionChallengeDeck';
import { CustomExperimentBuilder } from '../components/simulation/CustomExperimentBuilder';
import { DiscoveryToursDeck } from '../components/simulation/DiscoveryToursDeck';
import { simulationAudio } from '../services/simulationAudioService';

export const SimulationLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'challenges' | 'builder' | 'tours'>('sandbox');

  // Audio immersion controls (Feature 5)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isCabinHumActive, setIsCabinHumActive] = useState<boolean>(false);

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

  const prevExtinguishedRef = useRef(false);

  // Trigger procedural audio on extinction change
  useEffect(() => {
    if (physicsState.isExtinguished && !prevExtinguishedRef.current) {
      simulationAudio.playExtinctionHiss();
    }
    prevExtinguishedRef.current = physicsState.isExtinguished;
  }, [physicsState.isExtinguished]);

  const toggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    simulationAudio.setMuted(nextMuted);
    if (nextMuted) {
      setIsCabinHumActive(false);
    } else {
      simulationAudio.playRadioClick();
    }
  };

  const toggleCabinHum = () => {
    if (isAudioMuted) {
      setIsAudioMuted(false);
      simulationAudio.setMuted(false);
    }
    if (isCabinHumActive) {
      simulationAudio.stopCabinHum();
      setIsCabinHumActive(false);
    } else {
      simulationAudio.startCabinHum();
      setIsCabinHumActive(true);
    }
  };

  const handleApplyPreset = (preset: {
    g: number;
    o2: number;
    flow: number;
    p: number;
    fuel: FuelType;
  }) => {
    simulationAudio.playIgnitionWhoosh();
    setGravityG(preset.g);
    setOxygenPct(preset.o2);
    setAirflowCmS(preset.flow);
    setPressureKpa(preset.p);
    setFuelType(preset.fuel);
  };

  const handleLoadFromRigBuilder = (params: {
    gravity: number;
    oxygen: number;
    flow: number;
    pressure: number;
  }) => {
    setGravityG(params.gravity);
    setOxygenPct(params.oxygen);
    setAirflowCmS(params.flow);
    setPressureKpa(parseFloat((params.pressure * 101.325).toFixed(1)));
    setActiveTab('sandbox');
  };

  const handleApplyFromDiscoveryTour = (params: {
    gravity: number;
    oxygen: number;
    flow: number;
    pressure: number;
  }) => {
    setGravityG(params.gravity);
    setOxygenPct(params.oxygen);
    setAirflowCmS(params.flow);
    setPressureKpa(parseFloat((params.pressure * 101.325).toFixed(1)));
    setActiveTab('sandbox');
  };

  const currentFuelSpec = FUEL_SPECS[fuelType];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          badge="Interactive Simulation Lab"
          title="Spacecraft Combustion & Safety Simulation Lab"
          subtitle="Explore microgravity combustion physics with real-time parametric sandbox controls, live fluid streamlines, thermal infrared imaging, NASA benchmarks, and science discovery tours."
        />

        {/* Spacecraft Procedural Audio Immersion Dock (Feature 5) */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/90 border border-slate-800 p-2 rounded-xl shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
              isAudioMuted
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}
            title="Toggle procedural spaceflight sound synthesis"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>SFX: {isAudioMuted ? 'OFF' : 'ON'}</span>
          </button>

          <button
            type="button"
            onClick={toggleCabinHum}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
              isCabinHumActive
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Ambient 55Hz cabin ventilation loop"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Cabin Hum: {isCabinHumActive ? 'RUNNING' : 'STANDBY'}</span>
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('sandbox');
            simulationAudio.playRadioClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'sandbox'
              ? 'bg-[#0B3D91] text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-[#10243D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-[#38BDF8]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Combustion Sandbox</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('challenges');
            simulationAudio.playRadioClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'challenges'
              ? 'bg-[#0B3D91] text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-[#10243D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-[#38BDF8]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Safety Officer Missions</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            3 MISSIONS
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('builder');
            simulationAudio.playRadioClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'builder'
              ? 'bg-[#0B3D91] text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-[#10243D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-[#38BDF8]'
          }`}
        >
          <Wrench className="w-4 h-4 text-emerald-400" />
          <span>Rig Builder & NASA Benchmark</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            PSI GROUND TRUTH
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('tours');
            simulationAudio.playRadioClick();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'tours'
              ? 'bg-[#0B3D91] text-white shadow-md shadow-sky-500/20'
              : 'bg-white dark:bg-[#10243D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:border-[#38BDF8]'
          }`}
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Science Discovery Tours</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            GUIDED
          </span>
        </button>
      </div>

      {activeTab === 'challenges' && <MissionChallengeDeck />}

      {activeTab === 'builder' && (
        <CustomExperimentBuilder onLoadIntoChamber={handleLoadFromRigBuilder} />
      )}

      {activeTab === 'tours' && (
        <DiscoveryToursDeck onApplyChamberParams={handleApplyFromDiscoveryTour} />
      )}

      {activeTab === 'sandbox' && (
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
                      simulationAudio.playRadioClick();
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
                    min="0"
                    max="1"
                    step="0.01"
                    value={gravityG}
                    onChange={(e) => setGravityG(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 bg-slate-200 dark:bg-slate-800 h-2 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0g (Freefall)</span>
                    <span>0.166g</span>
                    <span>0.375g</span>
                    <span>1.0g (Standard)</span>
                  </div>
                </div>

                {/* Oxygen % Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-500" /> Oxygen Concentration (O₂ %)
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        oxygenPct < 15
                          ? 'bg-amber-500/20 text-amber-500'
                          : oxygenPct > 30
                          ? 'bg-red-500/20 text-red-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {oxygenPct.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="40"
                    step="0.5"
                    value={oxygenPct}
                    onChange={(e) => setOxygenPct(parseFloat(e.target.value))}
                    className="w-full accent-red-500 bg-slate-200 dark:bg-slate-800 h-2 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>12% (Hypoxic)</span>
                    <span>21% (Earth / ISS)</span>
                    <span>34% (Exploration EVA)</span>
                    <span>40%</span>
                  </div>
                </div>

                {/* Forced Airflow Velocity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-sky-400" /> Forced Ventilation (cm/s)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {airflowCmS.toFixed(1)} cm/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="0.5"
                    value={airflowCmS}
                    onChange={(e) => setAirflowCmS(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 bg-slate-200 dark:bg-slate-800 h-2 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0 (Quiescent)</span>
                    <span>5 (BASS Duct)</span>
                    <span>20 (Cabin Return)</span>
                    <span>40</span>
                  </div>
                </div>

                {/* Pressure Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-400" /> Cabin Pressure (kPa)
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {pressureKpa.toFixed(1)} kPa ({(pressureKpa / 101.325).toFixed(2)} atm)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    step="1"
                    value={pressureKpa}
                    onChange={(e) => setPressureKpa(parseFloat(e.target.value))}
                    className="w-full accent-teal-500 bg-slate-200 dark:bg-slate-800 h-2 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>40 kPa (Low)</span>
                    <span>70.3 kPa (Artemis Hab)</span>
                    <span>101.3 kPa (ISS Sea-level)</span>
                    <span>150</span>
                  </div>
                </div>

                {/* Fuel Material Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fuel Sample Substrate:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['PMMA', 'SIBAL', 'Kapton', 'Silicone', 'Methanol'] as FuelType[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setFuelType(f);
                          simulationAudio.playRadioClick();
                        }}
                        className={`p-2 rounded-xl text-left border transition text-xs ${
                          fuelType === f
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#07172B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        <div>{f}</div>
                        <div className="text-[10px] font-normal font-mono opacity-80">
                          {FUEL_SPECS[f].description.substring(0, 35)}...
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fuel Info Pill */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentFuelSpec.name} Properties
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <div>Limit O₂: {currentFuelSpec.locPct}%</div>
                    <div>Smoke Index: {currentFuelSpec.smokeRate}x</div>
                    <div>Base Temp: {currentFuelSpec.baseTemp} °C</div>
                    <div>Base Spread: {currentFuelSpec.baseSpreadRate} cm/s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive 2D Chamber Canvas & Telemetry Display (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
                {/* View Mode & Animation Controls */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                        isPlaying
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                      title={isPlaying ? 'Pause Simulation Physics' : 'Resume Simulation Physics'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                      {[0.5, 1, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                            playbackSpeed === spd
                              ? 'bg-[#0B3D91] text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Modes Switcher */}
                  <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
                    {(['optical', 'thermal', 'streamlines'] as ViewMode[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setViewMode(v);
                          simulationAudio.playRadioClick();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                          viewMode === v
                            ? 'bg-white dark:bg-[#0B3D91] text-slate-900 dark:text-white shadow-sm'
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
