import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Play,
  RotateCcw,
  Flame,
  ShieldAlert,
  Clock,
  Layers
} from 'lucide-react';
import { simulationAudio } from '../../services/simulationAudioService';

export interface TourStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  content: string;
  physicsEquation?: string;
  keyTakeaway: string;
  recommendedParams: {
    gravity: number;
    oxygen: number;
    flow: number;
    pressure: number;
  };
}

export interface ScienceTour {
  id: string;
  title: string;
  shortDesc: string;
  iconName: 'flame' | 'shield' | 'clock';
  durationMinutes: number;
  steps: TourStep[];
}

const DISCOVERY_TOURS: ScienceTour[] = [
  {
    id: 'why-flames-dont-rise',
    title: "Why Don't Flames Rise in Space?",
    shortDesc: 'Discover how the absence of buoyant convection transforms teardrop flames into slow-burning spherical domes.',
    iconName: 'flame',
    durationMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'Earth 1-g: Buoyant Convection Dominance',
        subtitle: 'Hot air rises because thermal expansion reduces gas density.',
        content:
          'On Earth, combustion products heat up to 1400–1800 K. According to the ideal gas law, heated air expands and becomes significantly less dense than surrounding ambient air. Under Earth gravity (1g), Archimedes buoyant force pulls dense cold air downward and pushes hot air upward at speeds of 1–3 m/s, elongating the flame into the familiar teardrop shape and continually feeding fresh oxygen into the flame base.',
        physicsEquation: 'F_{buoyant} = (\\rho_{\\infty} - \\rho_{flame}) \\cdot g \\cdot V',
        keyTakeaway: 'Earth flames are convective engines driven by gravity-induced density differences.',
        recommendedParams: { gravity: 1.0, oxygen: 21.0, flow: 0.0, pressure: 1.0 }
      },
      {
        stepNumber: 2,
        title: 'Microgravity: Vanishing Natural Convection',
        subtitle: 'In 0-g, Grashof number drops to zero, killing buoyant plumes.',
        content:
          'In orbit (e.g. onboard the ISS), spacecraft and contents are in perpetual freefall, producing an effective gravitational acceleration g ≈ 0. Without gravity, density differences cannot create buoyancy forces. The buoyant plume vanishes instantly. Hot combustion products do not rise, and cold oxidizer is no longer drawn upward into the base.',
        physicsEquation: 'Gr = \\frac{g \\beta (T_s - T_\\infty) L^3}{\\nu^2} \\to 0',
        keyTakeaway: 'Without gravity, natural convection ceases completely. Buoyancy-driven airflow is 0 cm/s.',
        recommendedParams: { gravity: 0.0, oxygen: 21.0, flow: 0.0, pressure: 1.0 }
      },
      {
        stepNumber: 3,
        title: 'Molecular Diffusion & Spherical Symmetry',
        subtitle: 'Oxygen can only reach the reaction zone via Brownian random walks.',
        content:
          'With convective flow eliminated, oxidizer transport is governed strictly by molecular diffusion (Fickian diffusion). Because diffusion is isotropic (equal in all spatial directions), oxygen molecules diffuse inward uniformly toward the fuel surface from all angles. The flame reorganizes into a perfectly spherical, quiescent envelope.',
        physicsEquation: 'J = -D \\nabla C \\implies \\text{Spherical Symmetry}',
        keyTakeaway: '0-g diffusion produces spherical flames that burn cooler, quieter, and significantly slower than 1-g flames.',
        recommendedParams: { gravity: 0.0, oxygen: 21.0, flow: 1.0, pressure: 1.0 }
      },
      {
        stepNumber: 4,
        title: 'Astronaut Safety Hazard: Low-O₂ Stealth Persistence',
        subtitle: 'Spherical flames can survive at ultra-low oxygen and flare unexpectedly.',
        content:
          'Because spherical diffusion flames have lower heat loss to turbulent convective plumes, they can persist at oxygen concentrations that would immediately extinguish an Earth candle (down to 13–15% O₂). If ventilation fans restart or an astronaut opens a hatch, incoming forced air delivers a sudden pulse of fresh oxidizer, triggering an explosive flare-up.',
        physicsEquation: 'O_2 \\le 15\\% \\implies \\text{Quench Threshold or Smoldering Stealth State}',
        keyTakeaway: 'Never assume a quiescent microgravity fire is dead just because no flame plume is visible.',
        recommendedParams: { gravity: 0.0, oxygen: 14.5, flow: 0.0, pressure: 1.0 }
      }
    ]
  },
  {
    id: 'soot-shell-mystery',
    title: 'The Soot Shell Mystery',
    shortDesc: 'Investigate microgravity incomplete combustion, thermophoretic trapping, and fibrous soot agglomeration.',
    iconName: 'shield',
    durationMinutes: 5,
    steps: [
      {
        stepNumber: 1,
        title: 'Where Does the Soot Go in Space?',
        subtitle: 'In 1-g, soot burns out or escapes. In 0-g, soot cannot escape.',
        content:
          'On Earth, soot particles nucleate in fuel-rich regions and are swept upward by buoyancy into high-temperature oxidation zones where much of it burns away to CO₂ or emits familiar bright yellow radiant incandescence. In microgravity, without a rising convective plume, unburned carbon particles remain suspended right where they are produced.',
        physicsEquation: '\\tau_{residence, 0g} \\gg \\tau_{residence, 1g}',
        keyTakeaway: 'Soot residence time in microgravity is orders of magnitude longer than on Earth.',
        recommendedParams: { gravity: 0.0, oxygen: 21.0, flow: 3.0, pressure: 1.0 }
      },
      {
        stepNumber: 2,
        title: 'Thermophoresis & The Concentric Shell',
        subtitle: 'Steep thermal gradients repel soot particles outward.',
        content:
          'The flame reaction zone reaches temperatures above 1400 K, while the ambient spacecraft atmosphere is ~295 K. Gas molecules colliding with soot from the hot reaction side transfer greater momentum than molecules colliding from the cold side. This creates a thermophoretic force that pushes soot particles outward until they balance at a specific cooler radius, forming a distinct concentric spherical soot shell.',
        physicsEquation: 'F_{T} = -\\frac{6 \\pi \\mu \\nu d_p C_s (\\nabla T)}{T}',
        keyTakeaway: 'Thermophoretic force traps soot in a stable spherical shell hovering around the flame core.',
        recommendedParams: { gravity: 0.0, oxygen: 23.0, flow: 5.0, pressure: 1.0 }
      },
      {
        stepNumber: 3,
        title: 'Fibrous Chain Agglomeration',
        subtitle: 'Extended residence time allows micro-particles to weld together.',
        content:
          'Trapped inside the quiet soot shell, primary soot spheres (15–30 nm) collide repeatedly via Brownian motion. Instead of dispersing, they weld into long, porous, branched fractal chains that reach tens of microns in length. These fibrous soot structures have extraordinary radiative emissivity, causing the flame to radiate heat away rapidly.',
        physicsEquation: 'N_p = k_f \\left(\\frac{R_g}{d_p}\\right)^{D_f}, \\quad D_f \\approx 1.8',
        keyTakeaway: 'Soot agglomerates accelerate radiative cooling, frequently driving microgravity flames toward sudden extinction.',
        recommendedParams: { gravity: 0.0, oxygen: 18.0, flow: 2.0, pressure: 0.8 }
      }
    ]
  },
  {
    id: 'smoke-aging-timelapse',
    title: 'The Smoke Aging Time-Lapse & Sensor Deception',
    shortDesc: 'Understand how zero-gravity aerosol particle growth fools conventional spacecraft smoke detectors.',
    iconName: 'clock',
    durationMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'Nascent Smoke: The Invisible Nano-Aerosols',
        subtitle: 'Fresh pyrolysis produces high-density particles under 25 nm.',
        content:
          'In the earliest seconds of an electrical overheat or smoldering wire insulation in microgravity, pyrolysis yields billions of ultra-fine aerosol droplets with diameters between 10 nm and 25 nm. Because their diameter is far smaller than the wavelength of visible light (λ ≈ 450–700 nm), they scatter light via Rayleigh scattering (proportional to d⁶) and are essentially invisible to standard optical smoke detectors.',
        physicsEquation: 'I_{scatter} \\propto \\frac{d^6}{\\lambda^4}',
        keyTakeaway: 'Early spacecraft smoke generates virtually zero optical scattering, blinding optical sensors.',
        recommendedParams: { gravity: 0.0, oxygen: 21.0, flow: 6.0, pressure: 1.0 }
      },
      {
        stepNumber: 2,
        title: 'Coagulation in Quiescent Spacecraft Cabins',
        subtitle: 'Brownian collisions merge millions of nano-particles into mega-clusters.',
        content:
          'Without gravity to cause sedimentation, particles remain suspended in the cabin air indefinitely. Over 10 to 30 minutes, Brownian collisions cause rapid coagulation: the total particle number drops precipitously by a factor of 100x while individual aggregate diameters swell beyond 500–1000 nm. The aerosol transitions into the Mie scattering regime.',
        physicsEquation: '\\frac{dN}{dt} = -K_{coag} N^2',
        keyTakeaway: 'Microgravity smoke shifts from Rayleigh to Mie scattering regimes over tens of minutes.',
        recommendedParams: { gravity: 0.0, oxygen: 21.0, flow: 12.0, pressure: 1.0 }
      },
      {
        stepNumber: 3,
        title: 'The Sensor Trap & Multi-Angle Polarization Solution',
        subtitle: 'Why standard ionization and simple photo detectors fail.',
        content:
          'Standard ionization detectors trigger on high particle count (N). As smoke ages, N collapses, causing ionization detectors to miss the fire. Simple optical obscuration detectors require large particle mass, triggering too late. NASA SAME-R and SmokeWise proven architectures solve this by utilizing multi-angle polarized laser scattering to discriminate soot morphology from harmless astronaut cabin dust and humidity.',
        physicsEquation: '\\text{Polarization Ratio: } P = \\frac{I_\\perp - I_\\parallel}{I_\\perp + I_\\parallel}',
        keyTakeaway: 'Multi-angle polarization scattering is essential to distinguish true smoldering soot from cabin lint.',
        recommendedParams: { gravity: 0.0, oxygen: 20.8, flow: 15.0, pressure: 1.0 }
      }
    ]
  }
];

interface DiscoveryToursDeckProps {
  onApplyChamberParams?: (params: {
    gravity: number;
    oxygen: number;
    flow: number;
    pressure: number;
  }) => void;
}

export const DiscoveryToursDeck: React.FC<DiscoveryToursDeckProps> = ({
  onApplyChamberParams
}) => {
  const [selectedTourId, setSelectedTourId] = useState<string>('why-flames-dont-rise');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [appliedStepIndex, setAppliedStepIndex] = useState<number | null>(null);

  const activeTour = DISCOVERY_TOURS.find((t) => t.id === selectedTourId) || DISCOVERY_TOURS[0];
  const activeStep = activeTour.steps[currentStepIndex] || activeTour.steps[0];

  const handleSelectTour = (tourId: string) => {
    setSelectedTourId(tourId);
    setCurrentStepIndex(0);
    setAppliedStepIndex(null);
    simulationAudio.playRadioClick();
  };

  const handleNextStep = () => {
    if (currentStepIndex < activeTour.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      simulationAudio.playRadioClick();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      simulationAudio.playRadioClick();
    }
  };

  const handleApplyToChamber = () => {
    simulationAudio.playIgnitionWhoosh();
    setAppliedStepIndex(currentStepIndex);
    if (onApplyChamberParams) {
      onApplyChamberParams(activeStep.recommendedParams);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tour Selection Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DISCOVERY_TOURS.map((tour) => {
          const isSelected = tour.id === selectedTourId;
          return (
            <button
              key={tour.id}
              onClick={() => handleSelectTour(tour.id)}
              className={`p-4 rounded-xl border text-left transition relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tour.iconName === 'flame' && <Flame className="w-4 h-4" />}
                  {tour.iconName === 'shield' && <ShieldAlert className="w-4 h-4" />}
                  {tour.iconName === 'clock' && <Clock className="w-4 h-4" />}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {tour.steps.length} STEPS · {tour.durationMinutes} MIN
                </div>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{tour.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{tour.shortDesc}</p>
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Step Card */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
        {/* Step Progress & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                STEP {activeStep.stepNumber} OF {activeTour.steps.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeTour.title}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{activeStep.title}</h2>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">{activeStep.subtitle}</p>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            {activeTour.steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  simulationAudio.playRadioClick();
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-8 bg-cyan-500'
                    : idx < currentStepIndex
                    ? 'bg-emerald-500/80'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                aria-label={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Step Content & Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="text-sm text-slate-300 leading-relaxed space-y-3">
              <p>{activeStep.content}</p>
            </div>

            {/* Physics Equation Card */}
            {activeStep.physicsEquation && (
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">PHYSICS GOVERNING EQUATION</span>
                <span className="text-sm font-mono font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded border border-amber-500/20">
                  {activeStep.physicsEquation}
                </span>
              </div>
            )}

            {/* Key Takeaway Callout */}
            <div className="p-3.5 bg-cyan-950/20 rounded-lg border border-cyan-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block mb-0.5">
                  Core Scientific Takeaway
                </span>
                <p className="text-xs text-slate-200">{activeStep.keyTakeaway}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Step Recommended Chamber Parameters */}
          <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Demonstration Parameters</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400">Gravity (g):</span>
                  <span className="font-bold text-white">
                    {activeStep.recommendedParams.gravity.toFixed(2)} g
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400">Oxygen (O₂):</span>
                  <span className="font-bold text-cyan-400">
                    {activeStep.recommendedParams.oxygen.toFixed(1)} %
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400">Airflow:</span>
                  <span className="font-bold text-sky-400">
                    {activeStep.recommendedParams.flow.toFixed(1)} cm/s
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400">Pressure:</span>
                  <span className="font-bold text-indigo-400">
                    {activeStep.recommendedParams.pressure.toFixed(2)} atm
                  </span>
                </div>
              </div>
            </div>

            {onApplyChamberParams && (
              <button
                onClick={handleApplyToChamber}
                className="mt-4 w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                {appliedStepIndex === currentStepIndex
                  ? 'Applied to Chamber Canvas!'
                  : 'Demonstrate on 2D Chamber'}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous Step
          </button>

          <div className="text-xs font-mono text-slate-500">
            Step {currentStepIndex + 1} of {activeTour.steps.length}
          </div>

          {currentStepIndex < activeTour.steps.length - 1 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                simulationAudio.playRadioClick();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
