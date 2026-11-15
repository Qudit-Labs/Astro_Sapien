import React, { useState } from 'react';
import {
  ShieldAlert,
  Trophy,
  Award,
  Zap,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  InteractiveChamberCanvas,
  FuelType,
  ViewMode,
  SuppressantType,
} from './InteractiveChamberCanvas';

export interface MissionScenario {
  id: string;
  title: string;
  facility: string;
  targetGravityG: number;
  fuel: FuelType;
  difficulty: 'CADET' | 'SPECIALIST' | 'FLIGHT DIRECTOR';
  badgeTitle: string;
  briefing: string;
  objectives: string[];
  initialConditions: {
    oxygenPct: number;
    airflowCmS: number;
    pressureKpa: number;
    suppressant?: SuppressantType;
  };
  evaluate: (params: {
    oxygenPct: number;
    airflowCmS: number;
    pressureKpa: number;
    suppressant?: SuppressantType;
    suppressantFlow?: number;
    selectedDetector?: 'near_ir' | 'ionization' | 'mpass';
  }) => {
    success: boolean;
    score: number;
    title: string;
    message: string;
    physicsExplanation: string;
  };
}

export const MISSIONS: MissionScenario[] = [
  {
    id: 'artemis_habitat',
    title: 'Mission 1: Artemis Lunar Base Atmosphere Tuning',
    facility: 'Lunar Habitat (1/6 g / 0.166 g)',
    targetGravityG: 0.166,
    fuel: 'SIBAL',
    difficulty: 'CADET',
    badgeTitle: 'Artemis Atmosphere Architect',
    briefing:
      'You are the Environmental Flight Safety Officer for the Artemis Surface Habitat. Astronauts require at least 19.0 kPa of oxygen partial pressure to breathe safely without hypoxemia. However, SIBAL fabrics and habitat panels ignite rapidly if oxygen volume percentage exceeds 26% or if ventilation drops below 3.0 cm/s (creating stagnant CO2 suffocation pockets).',
    objectives: [
      'Maintain breathable oxygen partial pressure: pO2 = P * (O2% / 100) >= 19.0 kPa',
      'Prevent runaway flame spread: Keep flame spread rate <= 0.32 cm/s (O2% <= 25.5%)',
      'Prevent CO2 stagnation pockets: Airflow >= 4.0 cm/s',
    ],
    initialConditions: {
      oxygenPct: 29.0, // Dangerous
      airflowCmS: 1.5, // Stagnant
      pressureKpa: 70.0,
    },
    evaluate: (params) => {
      const pO2 = params.pressureKpa * (params.oxygenPct / 100);
      const isBreathable = pO2 >= 19.0;
      const isSpreadSafe = params.oxygenPct <= 25.5;
      const isVentilated = params.airflowCmS >= 3.5;

      if (isBreathable && isSpreadSafe && isVentilated) {
        return {
          success: true,
          score: 100,
          title: 'PERFECT FLIGHT ENVELOPE',
          message: `Atmosphere tuned nominally! Oxygen partial pressure is ${pO2.toFixed(1)} kPa (breathable) while O2 concentration of ${params.oxygenPct}% is well below the rapid propagation boundary.`,
          physicsExplanation:
            'NASA Lunar habitat research shows that operating at reduced total pressure with moderate O2 concentration preserves crew alveolar oxygenation while maintaining flame spread rates near Earth-equivalent baselines.',
        };
      }

      if (!isBreathable) {
        return {
          success: false,
          score: 35,
          title: 'HYPOXIC CREW HAZARD',
          message: `Oxygen partial pressure dropped to ${pO2.toFixed(1)} kPa (< 19.0 kPa target). Crew is experiencing acute hypoxemia! Increase pressure or oxygen percentage.`,
          physicsExplanation:
            'Human alveolar respiration depends on oxygen partial pressure (pO2), not volume fraction alone. At reduced cabin pressures, O2 fraction must be elevated compensationally.',
        };
      }

      if (!isSpreadSafe) {
        return {
          success: false,
          score: 40,
          title: 'HYPEROXIC FLAMMABILITY RUNAWAY',
          message: `Oxygen concentration (${params.oxygenPct}%) exceeds safe vehicle threshold! In Lunar 1/6 g, SIBAL panels experience concurrent flame front acceleration.`,
          physicsExplanation:
            'SAFFIRE and BASS-II data confirm that above 26% O2, radiative preheating of unburned fuel overcomes convective heat dissipation, leading to exponential flame acceleration.',
        };
      }

      return {
        success: false,
        score: 50,
        title: 'CO2 STAGNATION DETECTED',
        message: `Ventilation speed (${params.airflowCmS} cm/s) is insufficient. Without 1g buoyancy, exhaled CO2 forms stagnant blankets around sleeping crew berths.`,
        physicsExplanation:
          'In fractional gravity (1/6 g), buoyancy is insufficient to disperse metabolic CO2. Forced ventilation >= 4 cm/s is required to maintain uniform atmospheric mixing.',
      };
    },
  },
  {
    id: 'glovebox_suppression',
    title: 'Mission 2: ISS Glovebox Extinction Sprint (BASS-II)',
    facility: 'ISS Microgravity Science Glovebox (0.000 g)',
    targetGravityG: 0.0,
    fuel: 'PMMA',
    difficulty: 'SPECIALIST',
    badgeTitle: 'Zero-G Quench Master',
    briefing:
      'A PMMA sample in the ISS Microgravity Science Glovebox has ignited at 21% O2. You must deploy a burst of gaseous suppressant (CO2, He, or SF6) to quench the flame. The catch: injecting too weakly (< 7 cm/s) fails to extinguish, while blasting too hard (> 18 cm/s) scatters burning embers into the exhaust filters!',
    objectives: [
      'Select a high-efficiency gaseous suppressant agent (CO2 or SF6)',
      'Inject at optimal velocity (8.0 to 16.0 cm/s) to achieve radiative quenching without ember scatter',
      'Quench flame completely within the 5-second pulse',
    ],
    initialConditions: {
      oxygenPct: 21.0,
      airflowCmS: 4.0,
      pressureKpa: 101.3,
      suppressant: 'CO2',
    },
    evaluate: (params) => {
      const agent = params.suppressant || 'CO2';
      const flow = params.suppressantFlow || 10;

      if (agent === 'none') {
        return {
          success: false,
          score: 10,
          title: 'NO SUPPRESSANT DEPLOYED',
          message: 'The combustion reaction proceeded unchecked, consuming the entire PMMA test section.',
          physicsExplanation: 'In microgravity, steady opposed flow sustains flame spread through molecular diffusion.',
        };
      }

      if (flow > 17.5) {
        return {
          success: false,
          score: 40,
          title: 'CRITICAL EMBER SCATTER HAZARD',
          message: `Suppression blast velocity (${flow} cm/s) was too violent! Burning PMMA char particles broke off and impinged on the glovebox particulate filters.`,
          physicsExplanation:
            'NASA BASS-II suppression trials demonstrated that high-momentum gas jets disrupt the molten surface char layer in microgravity, dispersing glowing fragments into the duct.',
        };
      }

      if (flow < 7.5) {
        return {
          success: false,
          score: 45,
          title: 'INCOMPLETE EXTINCTION',
          message: `Flow velocity (${flow} cm/s) was too weak. The suppressant diluted slightly but failed to overcome the reaction zone heat generation.`,
          physicsExplanation:
            'Gaseous extinguishment requires cooling the reaction zone below the radiative extinction limit before fresh oxygen diffuses into the flame envelope.',
        };
      }

      return {
        success: true,
        score: 100,
        title: 'CLEAN RADIATIVE QUENCH ACHIEVED',
        message: `Flame successfully extinguished with zero ember scatter! ${agent} reduced the Damköhler number below critical threshold within 2.8 seconds.`,
        physicsExplanation:
          'NASA FLEX and BASS-II data prove that CO2 and SF6 extinguish microgravity flames primarily through radiative quenching and oxygen displacement rather than thermal blowoff.',
      };
    },
  },
  {
    id: 'smokewise_detector',
    title: 'Mission 3: The SmokeWise Avionics Detection Trap',
    facility: 'SAME-R Avionics Duct (0.000 g)',
    targetGravityG: 0.0,
    fuel: 'Kapton',
    difficulty: 'FLIGHT DIRECTOR',
    badgeTitle: 'Avionics Fire Sentry',
    briefing:
      'A Kapton polyimide wire is overheating inside an ISS avionics equipment bay under 0 cm/s quiescent conditions. Fresh pyrolysis produces sub-100 nm aerosol particles. Commercial near-IR detectors cannot see particles smaller than 1000 nm. Choose the correct detector and ventilation setting before cabin obscuration reaches critical threshold.',
    objectives: [
      'Select an advanced detector technology capable of resolving sub-micron pyrolysis smoke',
      'Tune cabin duct ventilation (2.0 to 6.0 cm/s) to promote coagulation while transporting aerosol to the sensor',
      'Trigger fire alarm within 60 seconds with zero false alarm risk',
    ],
    initialConditions: {
      oxygenPct: 21.0,
      airflowCmS: 0.0, // Quiescent
      pressureKpa: 101.3,
    },
    evaluate: (params) => {
      const det = params.selectedDetector || 'near_ir';
      const flow = params.airflowCmS;

      if (det === 'near_ir') {
        return {
          success: false,
          score: 30,
          title: 'DETECTION FAILED — NEAR-IR BLINDNESS',
          message:
            'ISS Near-IR optical sensor failed to alarm! Sub-micron Kapton smoke particles (< 100 nm) evade near-IR scattering (1000 nm) until aging exceeds 700 seconds.',
          physicsExplanation:
            'Rayleigh scattering efficiency drops as (d/lambda)^6. Fresh pyrolysis smoke produces particle mass diameters (d_mm ~ 260 nm) that are virtually invisible to optical near-IR wavelengths until significant coagulation occurs.',
        };
      }

      if (det === 'ionization' && flow > 8.0) {
        return {
          success: false,
          score: 60,
          title: 'IONIZATION SENSOR SIGNAL LOSS',
          message:
            'Shuttle Ionization detector responded, but high duct turbulence diluted the aerosol number concentration below detection threshold.',
          physicsExplanation:
            'Ionization chambers respond to number concentration (0th moment). High ventilation disperses the particle cloud before ions can be effectively scavenged.',
        };
      }

      if (det === 'mpass' && flow >= 2.0 && flow <= 7.0) {
        return {
          success: true,
          score: 100,
          title: 'OPTIMAL TWO-MOMENT MPASS DETECTION',
          message:
            'Alarm sounded in 38 seconds! Two-Moment MPASS measured number concentration and optical mass simultaneously, discriminating true smoke from background cabin dust.',
          physicsExplanation:
            'NASA SAME-R findings proved that combining particle counting (0th moment) with optical extinction (2nd/3rd moment) cuts response time variance in half and eliminates humidity false alarms.',
        };
      }

      return {
        success: true,
        score: 85,
        title: 'DETECTION NOMINAL',
        message: 'Detector alarmed successfully within acceptable flight safety margins.',
        physicsExplanation: 'Forced ventilation transported coagulated smoke clusters into the sensor chamber.',
      };
    },
  },
];

export const MissionChallengeDeck: React.FC = () => {
  const [selectedMissionIdx, setSelectedMissionIdx] = useState<number>(0);
  const [activeParams, setActiveParams] = useState({
    oxygenPct: MISSIONS[0].initialConditions.oxygenPct,
    airflowCmS: MISSIONS[0].initialConditions.airflowCmS,
    pressureKpa: MISSIONS[0].initialConditions.pressureKpa,
    suppressant: (MISSIONS[0].initialConditions.suppressant || 'CO2') as SuppressantType,
    suppressantFlow: 12,
    selectedDetector: 'mpass' as 'near_ir' | 'ionization' | 'mpass',
  });

  const [isRunningTrial, setIsRunningTrial] = useState<boolean>(false);
  const [trialResult, setTrialResult] = useState<ReturnType<MissionScenario['evaluate']> | null>(null);
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('optical');

  const mission = MISSIONS[selectedMissionIdx];

  const handleSelectMission = (idx: number) => {
    setSelectedMissionIdx(idx);
    const m = MISSIONS[idx];
    setActiveParams({
      oxygenPct: m.initialConditions.oxygenPct,
      airflowCmS: m.initialConditions.airflowCmS,
      pressureKpa: m.initialConditions.pressureKpa,
      suppressant: (m.initialConditions.suppressant || 'CO2') as SuppressantType,
      suppressantFlow: 12,
      selectedDetector: 'mpass',
    });
    setTrialResult(null);
    setIsRunningTrial(false);
  };

  const handleRunMissionTrial = () => {
    setIsRunningTrial(true);
    setTrialResult(null);

    // Simulate 4-second flight test burn
    setTimeout(() => {
      const result = mission.evaluate(activeParams);
      setTrialResult(result);
      setIsRunningTrial(false);

      if (result.success) {
        setUserScores((prev) => ({ ...prev, [mission.id]: Math.max(prev[mission.id] || 0, result.score) }));
        if (!earnedBadges.includes(mission.badgeTitle)) {
          setEarnedBadges((prev) => [...prev, mission.badgeTitle]);
        }
      }
    }, 3200);
  };

  const totalScore = Object.values(userScores).reduce((a, b) => a + b, 0);
  const clearanceTier =
    totalScore >= 250
      ? 'Chief NASA Flight Safety Director'
      : totalScore >= 150
      ? 'Mission Specialist (Spacecraft Fire Protection)'
      : totalScore >= 70
      ? 'Certified Flight Safety Officer'
      : 'Flight Safety Cadet';

  return (
    <div className="space-y-6">
      {/* Flight Clearance Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0B1D36] to-slate-900 border border-slate-700/60 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[#F5B942]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                OFFICER CLEARANCE:
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#0B3D91] text-sky-300 border border-sky-400/30">
                {clearanceTier}
              </span>
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              Score: <span className="font-mono text-[#38BDF8]">{totalScore}</span> / 300 Points •{' '}
              <span className="font-mono text-amber-300">{earnedBadges.length}</span> Badges Earned
            </div>
          </div>
        </div>

        {/* Badges Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {earnedBadges.length === 0 ? (
            <span className="text-xs text-slate-400 italic">Complete mission challenges below to earn flight badges</span>
          ) : (
            earnedBadges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold animate-in fade-in"
              >
                <Award className="w-3.5 h-3.5 text-[#F5B942]" />
                {b}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Mission Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MISSIONS.map((m, idx) => {
          const isSelected = selectedMissionIdx === idx;
          const score = userScores[m.id];
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectMission(idx)}
              className={`p-4 rounded-xl border text-left transition relative overflow-hidden shadow-sm ${
                isSelected
                  ? 'bg-sky-50 dark:bg-[#07172B] border-[#0B3D91] dark:border-[#38BDF8] ring-2 ring-[#38BDF8]/40'
                  : 'bg-white dark:bg-[#10243D] border-slate-200 dark:border-slate-700/60 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    m.difficulty === 'CADET'
                      ? 'bg-teal-500/15 text-teal-700 dark:text-[#24B8A0] border-teal-500/30'
                      : m.difficulty === 'SPECIALIST'
                      ? 'bg-sky-500/15 text-[#0B3D91] dark:text-[#38BDF8] border-sky-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-[#F5B942] border-amber-500/30'
                  }`}
                >
                  {m.difficulty}
                </span>
                {typeof score === 'number' && (
                  <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-[#24B8A0]">
                    PASS ({score} pts)
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-[#F4F7FC] line-clamp-1">{m.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{m.facility}</div>
            </button>
          );
        })}
      </div>

      {/* Main Mission Control Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Mission Briefing & Tuner (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#0B3D91] dark:text-[#38BDF8]">
              <ShieldAlert className="w-4 h-4 text-[#FC3D21]" />
              <span>MISSION BRIEFING: {mission.facility}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{mission.briefing}</p>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                Critical Objectives:
              </span>
              {mission.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <ChevronRight className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Parameters Tuner */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-[#F4F7FC]">
                FLIGHT SAFETY CONTROLS
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveParams({
                    oxygenPct: mission.initialConditions.oxygenPct,
                    airflowCmS: mission.initialConditions.airflowCmS,
                    pressureKpa: mission.initialConditions.pressureKpa,
                    suppressant: (mission.initialConditions.suppressant || 'CO2') as SuppressantType,
                    suppressantFlow: 12,
                    selectedDetector: 'mpass',
                  })
                }
                className="text-[11px] font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Oxygen % Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-500" /> Oxygen Concentration (% O₂)
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activeParams.oxygenPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={32}
                step={0.5}
                value={activeParams.oxygenPct}
                onChange={(e) => setActiveParams((p) => ({ ...p, oxygenPct: parseFloat(e.target.value) }))}
                className="w-full accent-[#FC3D21]"
              />
            </div>

            {/* Ventilation Flow Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-500" /> Ventilation Speed (cm/s)
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activeParams.airflowCmS.toFixed(1)} cm/s
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={0.5}
                value={activeParams.airflowCmS}
                onChange={(e) => setActiveParams((p) => ({ ...p, airflowCmS: parseFloat(e.target.value) }))}
                className="w-full accent-[#24B8A0]"
              />
            </div>

            {/* Pressure Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" /> Cabin Pressure (kPa)
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activeParams.pressureKpa.toFixed(1)} kPa
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={105}
                step={1}
                value={activeParams.pressureKpa}
                onChange={(e) => setActiveParams((p) => ({ ...p, pressureKpa: parseFloat(e.target.value) }))}
                className="w-full accent-[#38BDF8]"
              />
            </div>

            {/* Mission 2 Specific: Suppressant Controls */}
            {mission.id === 'glovebox_suppression' && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Suppressant Gas & Jet Flow:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CO2', 'He', 'SF6'] as SuppressantType[]).map((sup) => (
                    <button
                      key={sup}
                      type="button"
                      onClick={() => setActiveParams((p) => ({ ...p, suppressant: sup }))}
                      className={`py-1 text-xs font-mono font-bold rounded border ${
                        activeParams.suppressant === sup
                          ? 'bg-[#0B3D91] text-white border-[#38BDF8]'
                          : 'bg-white dark:bg-[#10243D] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {sup}
                    </button>
                  ))}
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Blast Speed:</span>
                    <span className="font-mono font-bold">{activeParams.suppressantFlow} cm/s</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={25}
                    step={1}
                    value={activeParams.suppressantFlow}
                    onChange={(e) => setActiveParams((p) => ({ ...p, suppressantFlow: parseInt(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Mission 3 Specific: Detector Selector */}
            {mission.id === 'smokewise_detector' && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#07172B] border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Avionics Smoke Sensor Suite:
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'near_ir', name: 'ISS Near-IR Optical (λ > 1000 nm)' },
                    { id: 'ionization', name: 'Shuttle Ionization Chamber' },
                    { id: 'mpass', name: 'Two-Moment MPASS Prototype' },
                  ].map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="detector"
                        checked={activeParams.selectedDetector === d.id}
                        onChange={() => setActiveParams((p) => ({ ...p, selectedDetector: d.id as any }))}
                        className="accent-[#38BDF8]"
                      />
                      <span>{d.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Execute Trial Button */}
            <button
              type="button"
              disabled={isRunningTrial}
              onClick={handleRunMissionTrial}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B3D91] to-[#38BDF8] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-sky-500/20 disabled:opacity-50 transition"
            >
              {isRunningTrial ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-amber-300" />
                  <span>EXECUTING FLIGHT TEST BURN...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>IGNITE FLIGHT TRIAL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Live Flight Simulation Canvas & Evaluation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#10243D] border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                FLIGHT RIG TELEMETRY // g = {mission.targetGravityG.toFixed(3)} g
              </span>
              <div className="flex items-center gap-1.5">
                {(['optical', 'thermal', 'streamlines'] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setViewMode(v)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold border ${
                      viewMode === v
                        ? 'bg-[#0B3D91] text-white border-[#38BDF8]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Interactive Physics Canvas */}
            <InteractiveChamberCanvas
              gravityG={mission.targetGravityG}
              oxygenPct={activeParams.oxygenPct}
              airflowCmS={activeParams.airflowCmS}
              pressureKpa={activeParams.pressureKpa}
              fuelType={mission.fuel}
              viewMode={viewMode}
              suppressant={activeParams.suppressant}
              suppressantActive={mission.id === 'glovebox_suppression' && isRunningTrial}
              suppressantFlow={activeParams.suppressantFlow}
              isPlaying={true}
            />
          </div>

          {/* Trial Evaluation Result Callout */}
          {trialResult && (
            <div
              className={`p-5 rounded-2xl border shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                trialResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-100'
                  : 'bg-red-950/30 border-red-500/50 text-red-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {trialResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-bold tracking-wide uppercase">{trialResult.title}</h4>
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-black/40 border border-white/10">
                      Score: {trialResult.score} / 100
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{trialResult.message}</p>
                  <div className="pt-2 border-t border-white/10 text-[11px] font-mono leading-relaxed opacity-80">
                    <strong>NASA Flight Evidence:</strong> {trialResult.physicsExplanation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
