import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Flame,
  Compass,
  TrendingUp,
  Target,
  AlertTriangle,
  Video,
  UploadCloud,
  Radio,
  AlertOctagon,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import {
  fetchSmokeSequence,
  fetchMicroscopyAnalysis,
  fetchExperimentComparison,
  uploadVideoForSurveillance,
  fetchDemoVideoSurveillance,
  SmokeSequenceData,
  MicroscopyData,
  ExperimentComparisonData,
  VideoSurveillanceResult,
} from '@/services/smokeVisionService';

export const SmokeVisionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vision' | 'surveillance' | 'microscopy' | 'benchmark'>('vision');
  const [selectedPreset, setSelectedPreset] = useState<string>('SAME-R-101');
  const [, setLoading] = useState<boolean>(true);
  const [sequenceData, setSequenceData] = useState<SmokeSequenceData | null>(null);

  // Video scrubber state
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<number | null>(null);

  // Overlay toggles
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [showCentroid, setShowCentroid] = useState<boolean>(true);
  const [showFlowVectors, setShowFlowVectors] = useState<boolean>(false);
  const [showOpticalDepth, setShowOpticalDepth] = useState<boolean>(false);
  const [showAccumulationHeatmap, setShowAccumulationHeatmap] = useState<boolean>(false);

  // Real-Time Surveillance Engine State
  const [surveillanceResult, setSurveillanceResult] = useState<VideoSurveillanceResult | null>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState<boolean>(false);
  const [surveillanceVideoSrc, setSurveillanceVideoSrc] = useState<string>('/demo_microgravity_smoke.mp4');
  const [surveillanceMaterial, setSurveillanceMaterial] = useState<string>('Kapton');
  const [videoPlayTime, setVideoPlayTime] = useState<number>(0);
  const [surveillanceFrameIdx, setSurveillanceFrameIdx] = useState<number>(0);
  const [isSurveillancePlaying, setIsSurveillancePlaying] = useState<boolean>(true);
  const [surveillanceViewMode, setSurveillanceViewMode] = useState<'canvas' | 'video'>('canvas');
  const surveillanceTimerRef = useRef<number | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Microscopy data
  const [selectedMicroMaterial, setSelectedMicroMaterial] = useState<string>('Kapton');
  const [microscopyData, setMicroscopyData] = useState<MicroscopyData | null>(null);

  // Benchmark data
  const [comparisonData, setComparisonData] = useState<ExperimentComparisonData | null>(null);

  // Load experiment sequence
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchSmokeSequence(selectedPreset).then((data) => {
      if (mounted) {
        setSequenceData(data);
        setCurrentFrameIdx(0);
        setIsPlaying(false);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [selectedPreset]);

  // Load microscopy & comparison
  useEffect(() => {
    fetchMicroscopyAnalysis(selectedMicroMaterial).then(setMicroscopyData);
  }, [selectedMicroMaterial]);

  useEffect(() => {
    fetchExperimentComparison().then(setComparisonData);
    // Initialize default surveillance demo
    fetchDemoVideoSurveillance('Kapton').then(setSurveillanceResult);
  }, []);

  // Frame player playback loop
  useEffect(() => {
    if (isPlaying && sequenceData && sequenceData.frames.length > 0) {
      playTimerRef.current = window.setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % sequenceData.frames.length);
      }, 450);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, sequenceData]);

  // Surveillance frame playback loop
  useEffect(() => {
    if (isSurveillancePlaying && surveillanceResult && surveillanceResult.frames.length > 0) {
      surveillanceTimerRef.current = window.setInterval(() => {
        setSurveillanceFrameIdx((prev) => (prev + 1) % surveillanceResult.frames.length);
      }, 350);
    } else if (surveillanceTimerRef.current) {
      clearInterval(surveillanceTimerRef.current);
    }
    return () => {
      if (surveillanceTimerRef.current) clearInterval(surveillanceTimerRef.current);
    };
  }, [isSurveillancePlaying, surveillanceResult]);

  const currentSurvFrame = useMemo(() => {
    if (!surveillanceResult || surveillanceResult.frames.length === 0) return null;
    return surveillanceResult.frames[surveillanceFrameIdx] || surveillanceResult.frames[0];
  }, [surveillanceResult, surveillanceFrameIdx]);

  const currentFrame = useMemo(() => {
    if (!sequenceData || sequenceData.frames.length === 0) return null;
    return sequenceData.frames[currentFrameIdx] || sequenceData.frames[0];
  }, [sequenceData, currentFrameIdx]);

  const currentKinetics = useMemo(() => {
    if (!sequenceData || sequenceData.expansion_kinetics.length === 0) return null;
    return sequenceData.expansion_kinetics[currentFrameIdx] || sequenceData.expansion_kinetics[0];
  }, [sequenceData, currentFrameIdx]);

  // Handle Video Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSurveillanceVideoSrc(url);
    setIsAnalyzingVideo(true);
    try {
      const res = await uploadVideoForSurveillance(file, surveillanceMaterial);
      setSurveillanceResult(res);
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const handleRunDemoAnalysis = async () => {
    setSurveillanceVideoSrc('/demo_microgravity_smoke.mp4');
    setIsAnalyzingVideo(true);
    try {
      const res = await fetchDemoVideoSurveillance(surveillanceMaterial);
      setSurveillanceResult(res);
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  // SVG dimensions for render canvas
  const canvasW = 480;
  const canvasH = 340;
  const scaleX = canvasW / 320;
  const scaleY = canvasH / 240;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. AEROSPACE HUD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-500/15 border border-cyan-500/30 text-[#38BDF8]">
              MODULE 4 • COMPUTER VISION
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-red-500/15 border border-red-500/30 text-[#FC3D21] flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              REAL-TIME SURVEILLANCE
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-[#24B8A0]">
              NASA PSI INGESTED
            </span>
            <span className="text-xs font-mono text-slate-400">μg Fluid Kinetics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Eye className="w-8 h-8 text-[#38BDF8]" />
            SMOKEVISION
            <span className="text-sm font-mono font-normal text-slate-500 dark:text-slate-400">
              Plume Kinematics & Real-Time Surveillance Engine
            </span>
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900/90 rounded-lg border border-slate-300 dark:border-slate-800 self-start md:self-auto font-mono text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'vision'
                ? 'bg-[#0B1D36] text-[#38BDF8] shadow-sm border border-cyan-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Plume & Accumulation
          </button>
          <button
            onClick={() => setActiveTab('surveillance')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeTab === 'surveillance'
                ? 'bg-[#0B1D36] text-[#FC3D21] shadow-sm border border-red-500/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#FC3D21]" />
            Live Video Surveillance
          </button>
          <button
            onClick={() => setActiveTab('microscopy')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'microscopy'
                ? 'bg-[#0B1D36] text-[#24B8A0] shadow-sm border border-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            TEM Particle Sizing
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'benchmark'
                ? 'bg-[#0B1D36] text-amber-400 shadow-sm border border-amber-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cross-Experiment
          </button>
        </div>
      </div>

      {/* PHYSICS DISCLAIMER BANNER */}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-[#F5B942] text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold font-mono">PHYSICAL CALIBRATION GUARD: </span>
          Image pixel brightness is not automatically smoke concentration. Forward optical scatter from chamber lighting alters perceived intensity. Quantitative density estimates in SMOKEVISION are calculated via calibrated Beer-Lambert extinction (optical depth &tau; = &minus;ln(I / I<sub>0</sub>) = k<sub>ext</sub> &bull; L &bull; C<sub>s</sub>) referencing pre-ignition baseline frames.
        </div>
      </div>

      {/* 2. TAB CONTENT: REAL-TIME SURVEILLANCE ENGINE (The User's Feature!) */}
      {activeTab === 'surveillance' && (
        <div className="space-y-6">
          {/* Top Control Bar for Video Ingestion */}
          <div className="bg-white dark:bg-[#0B1D36] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FC3D21] animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Real-Time Video Surveillance & Flight Safety Threat Monitor
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ingests video streams from spacecraft cabin cameras or laboratory drop towers to detect smoke inception, track expansion, and alert on ventilation stagnation.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzingVideo}
                className="px-3.5 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-[#38BDF8] hover:bg-cyan-500/25 transition font-mono text-xs font-semibold flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Laboratory Video
              </button>

              <button
                onClick={handleRunDemoAnalysis}
                disabled={isAnalyzingVideo}
                className="px-3.5 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-[#FC3D21] hover:bg-red-500/25 transition font-mono text-xs font-semibold flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                {isAnalyzingVideo ? 'Processing Stream...' : 'Run NASA Demo Video Feed'}
              </button>
            </div>
          </div>

          {/* SURVEILLANCE THREAT STATUS BANNER */}
          {surveillanceResult && (
            <div
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg ${
                surveillanceResult.surveillance_status.threat_level.includes('CRITICAL')
                  ? 'bg-red-950/40 border-red-500/60 text-red-200'
                  : surveillanceResult.surveillance_status.threat_level.includes('WARNING')
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${
                    surveillanceResult.surveillance_status.threat_level.includes('CRITICAL')
                      ? 'bg-red-500 text-white border-red-300 animate-pulse'
                      : surveillanceResult.surveillance_status.threat_level.includes('WARNING')
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-emerald-500 text-slate-950 border-emerald-300'
                  }`}
                >
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    REAL-TIME SURVEILLANCE STATUS
                  </div>
                  <div className="text-lg font-bold font-mono tracking-tight">
                    {surveillanceResult.surveillance_status.threat_level}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-xs space-y-1">
                <div className="text-white font-semibold">
                  RECOMMENDED ACTION: {surveillanceResult.surveillance_status.recommended_action}
                </div>
                <div className="text-slate-400 text-[11px]">
                  First Inception: {surveillanceResult.surveillance_status.first_detection_time_s?.toFixed(2)}s •
                  Peak dA/dt: {surveillanceResult.surveillance_status.peak_expansion_rate_cm2_s} cm²/s •
                  Stagnation Score: {surveillanceResult.surveillance_status.stagnation_severity_score}%
                </div>
              </div>
            </div>
          )}

          {/* MAIN VIDEO PLAYER + REAL-TIME AUGMENTED HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Video Player with Synchronized Overlays (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white font-semibold">OPTICAL SURVEILLANCE FEED</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSurveillanceViewMode('canvas')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                      surveillanceViewMode === 'canvas'
                        ? 'bg-cyan-500/20 text-[#38BDF8] border border-cyan-500/40 font-bold'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    CV Augmented Feed
                  </button>
                  <button
                    onClick={() => setSurveillanceViewMode('video')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                      surveillanceViewMode === 'video'
                        ? 'bg-cyan-500/20 text-[#38BDF8] border border-cyan-500/40 font-bold'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Native Video
                  </button>
                  <span className="text-[#38BDF8] font-bold">
                    t = {surveillanceViewMode === 'video' ? videoPlayTime.toFixed(1) : currentSurvFrame?.time_s.toFixed(2) || '0.00'}s
                  </span>
                </div>
              </div>

              {/* Video Element / Canvas Container */}
              <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {surveillanceViewMode === 'video' ? (
                  <video
                    ref={videoElementRef}
                    src={surveillanceVideoSrc}
                    controls
                    playsInline
                    onTimeUpdate={(e) => setVideoPlayTime(e.currentTarget.currentTime)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  /* CV Augmented Canvas Player */
                  <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                    {currentSurvFrame?.image_data ? (
                      <img
                        src={currentSurvFrame.image_data}
                        alt="Surveillance frame"
                        className="w-full h-full object-cover opacity-85"
                      />
                    ) : (
                      /* Render synthetic plume representation */
                      <div className="w-full h-full bg-gradient-to-b from-slate-950 to-[#071324] flex items-center justify-center">
                        <div
                          className="w-24 h-24 rounded-full bg-slate-200/40 blur-xl transition-all duration-300"
                          style={{
                            transform: `scale(${1 + (currentSurvFrame?.area_cm2 || 1) * 0.15})`,
                          }}
                        />
                      </div>
                    )}

                    {/* Augmented Overlays SVG */}
                    <svg
                      viewBox="0 0 320 240"
                      className="absolute inset-0 w-full h-full pointer-events-none select-none"
                    >
                      {/* Boundary Contour */}
                      {currentSurvFrame && currentSurvFrame.boundary_polygon.length > 2 && (
                        <polygon
                          points={currentSurvFrame.boundary_polygon.map(([x, y]) => `${x},${y}`).join(' ')}
                          fill="rgba(56, 189, 248, 0.15)"
                          stroke="#38BDF8"
                          strokeWidth={2}
                        />
                      )}

                      {/* Centroid Reticle */}
                      {currentSurvFrame && (
                        <g>
                          <circle
                            cx={currentSurvFrame.centroid.x}
                            cy={currentSurvFrame.centroid.y}
                            r={6}
                            fill="none"
                            stroke="#FC3D21"
                            strokeWidth={2}
                          />
                          <line
                            x1={currentSurvFrame.centroid.x - 10}
                            y1={currentSurvFrame.centroid.y}
                            x2={currentSurvFrame.centroid.x + 10}
                            y2={currentSurvFrame.centroid.y}
                            stroke="#FC3D21"
                            strokeWidth={1.5}
                          />
                          <line
                            x1={currentSurvFrame.centroid.x}
                            y1={currentSurvFrame.centroid.y - 10}
                            x2={currentSurvFrame.centroid.x}
                            y2={currentSurvFrame.centroid.y + 10}
                            stroke="#FC3D21"
                            strokeWidth={1.5}
                          />
                          <text
                            x={currentSurvFrame.centroid.x + 8}
                            y={currentSurvFrame.centroid.y + 14}
                            fill="#FC3D21"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            PLUME ({Math.round(currentSurvFrame.centroid.x)}, {Math.round(currentSurvFrame.centroid.y)})
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>
                )}

                {/* Overlaid AR HUD Annotations */}
                <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded border border-slate-700 text-[11px] font-mono text-white flex items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  CV ENGINE ENGAGED • I_0 BASELINE LOCKED
                </div>

                <div className="absolute bottom-3 right-3 bg-black/85 px-2.5 py-1.5 rounded border border-slate-700 text-[10px] font-mono text-slate-300 pointer-events-none space-y-0.5">
                  <div>RES: {surveillanceResult?.video_metadata.original_resolution}</div>
                  <div>FPS: {surveillanceResult?.video_metadata.fps}</div>
                  <div className="text-cyan-400">
                    FRAME: {surveillanceFrameIdx + 1} / {surveillanceResult?.frames.length || 16}
                  </div>
                </div>
              </div>

              {/* Scrubber & Playback Controls for Surveillance Feed */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSurveillancePlaying(!isSurveillancePlaying)}
                    className="p-2 rounded-lg bg-red-500/15 border border-red-500/40 text-[#FC3D21] hover:bg-red-500/25 transition"
                  >
                    {isSurveillancePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsSurveillancePlaying(false);
                      setSurveillanceFrameIdx(0);
                    }}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Scrubber Slider */}
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, (surveillanceResult?.frames.length || 16) - 1)}
                    value={surveillanceFrameIdx}
                    onChange={(e) => {
                      setIsSurveillancePlaying(false);
                      setSurveillanceFrameIdx(parseInt(e.target.value));
                    }}
                    className="flex-1 accent-[#FC3D21] cursor-pointer"
                  />
                  <span className="font-mono text-xs text-[#FC3D21] font-bold w-12 text-right">
                    {currentSurvFrame?.time_s.toFixed(1)}s
                  </span>
                </div>

                {/* Video Quick Info Strip */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 flex-wrap gap-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span>Fuel Calibration:</span>
                    <select
                      value={surveillanceMaterial}
                      onChange={(e) => setSurveillanceMaterial(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-[#38BDF8] rounded px-1.5 py-0.5 text-[11px]"
                    >
                      <option value="Kapton">Kapton (k_ext = 4.8 m²/g)</option>
                      <option value="Teflon">Teflon (k_ext = 2.9 m²/g)</option>
                      <option value="PMMA">PMMA (k_ext = 7.6 m²/g)</option>
                      <option value="SIBAL">SIBAL (k_ext = 6.8 m²/g)</option>
                    </select>
                  </div>
                  <div className="text-slate-400">
                    Current Area: <span className="text-white font-bold">{currentSurvFrame?.area_cm2 || 0} cm²</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Surveillance Chronological Events & Telemetry (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Surveillance Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#0B1D36] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Detection Status</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {surveillanceResult?.surveillance_status.smoke_detected ? 'SMOKE DETECTED' : 'CLEAR'}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                    Inception: {surveillanceResult?.surveillance_status.first_detection_time_s || 0}s
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Max Plume Area</div>
                  <div className="text-lg font-bold font-mono text-[#38BDF8] mt-0.5">
                    {surveillanceResult?.surveillance_status.max_plume_area_cm2 || 0} <span className="text-xs">cm²</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Expansion: {surveillanceResult?.surveillance_status.peak_expansion_rate_cm2_s} cm²/s
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Ventilation Stagnation</div>
                  <div className="text-lg font-bold font-mono text-[#FC3D21] mt-0.5">
                    {surveillanceResult?.surveillance_status.stagnation_severity_score || 0}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Recirculation Risk
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Analysis Frames</div>
                  <div className="text-lg font-bold font-mono text-[#24B8A0] mt-0.5">
                    {surveillanceResult?.video_metadata.frames_analyzed || 0}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Subsampled from {surveillanceResult?.video_metadata.total_frames || 0}
                  </div>
                </div>
              </div>

              {/* MISSION CONTROL SURVEILLANCE EVENT LOG */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    FLIGHT CONTROLLER CAPCOM EVENT LOG
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">TIMESTAMPED</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs font-mono">
                  {surveillanceResult?.events_log.map((ev, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded border text-[11px] leading-tight ${
                        ev.level === 'CRITICAL'
                          ? 'bg-red-950/60 border-red-500/50 text-red-200'
                          : ev.level === 'WARNING'
                          ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5 text-[10px] text-slate-400">
                        <span className="text-cyan-400 font-bold">T+{ev.time_s.toFixed(2)}s</span>
                        <span className="font-bold">{ev.level}</span>
                      </div>
                      <div>{ev.message}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accumulation Heatmap Preview for Video */}
              {surveillanceResult?.accumulation_map && (
                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#FC3D21]" />
                      Integrated Video Accumulation Heatmap
                    </span>
                    <span className="text-[10px] font-mono text-red-400 font-bold">
                      {surveillanceResult.accumulation_map.stagnation_severity_score}% Dwell
                    </span>
                  </div>

                  <div className="w-full aspect-[4/1.8] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
                    <svg viewBox="0 0 32 24" className="w-full h-full">
                      {surveillanceResult.accumulation_map.density_weighted_matrix.map((row, rIdx) =>
                        row.map((val, cIdx) => {
                          if (val < 0.05) return null;
                          const r = Math.min(255, Math.round(val * 320));
                          const g = Math.round(val > 0.5 ? (1.0 - val) * 255 : val * 220);
                          const b = Math.round((1.0 - val) * 200);
                          return (
                            <rect
                              key={`cell-${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width={1.05}
                              height={1.05}
                              fill={`rgb(${r},${g},${b})`}
                              opacity={val * 0.9}
                            />
                          );
                        })
                      )}
                    </svg>
                    <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-400 bg-black/70 px-1 rounded">
                      Dead-Zone Heatmap
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: PLUME & ACCUMULATION */}
      {activeTab === 'vision' && (
        <div className="space-y-6">
          {/* Preset Selector & Quick Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              {
                id: 'SAME-R-101',
                name: 'SAME-R Run 101',
                sub: 'ISS Quiescent (0 cm/s)',
                fuel: 'Kapton Wire',
                tag: 'High Stagnation',
                tagColor: 'text-red-400 bg-red-950/40 border-red-800',
              },
              {
                id: 'SAME-R-104',
                name: 'SAME-R Run 104',
                sub: 'ISS Duct (2 cm/s)',
                fuel: 'Teflon Wire',
                tag: 'Laminar Advection',
                tagColor: 'text-sky-400 bg-sky-950/40 border-sky-800',
              },
              {
                id: 'BASS-II-25',
                name: 'BASS-II Run 25',
                sub: 'Glovebox Flow (5 cm/s)',
                fuel: 'PMMA Solid',
                tag: 'Flame Wake',
                tagColor: 'text-amber-400 bg-amber-950/40 border-amber-800',
              },
              {
                id: 'SAFFIRE-I',
                name: 'SAFFIRE-I Test',
                sub: 'Cygnus Cabin (20 cm/s)',
                fuel: 'SIBAL Fabric',
                tag: 'Large-Scale Plume',
                tagColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800',
              },
            ].map((p) => {
              const active = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`p-3 rounded-xl text-left border transition relative overflow-hidden ${
                    active
                      ? 'bg-slate-900 border-[#38BDF8] ring-1 ring-[#38BDF8]/40 shadow-lg'
                      : 'bg-white dark:bg-[#0B1D36]/80 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${p.tagColor}`}>
                      {p.tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">{p.sub}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">Fuel: {p.fuel}</div>
                </button>
              );
            })}
          </div>

          {/* MAIN INTERACTIVE CV ANALYZER & ACCUMULATION SUITE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visualizer Canvas & Overlays (7 Columns) */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              {/* Header inside canvas */}
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-white font-semibold">
                    {sequenceData?.metadata.investigation || 'NASA PSI'} • {sequenceData?.metadata.material}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span>Airflow: {sequenceData?.metadata.airflow_cm_s} cm/s</span>
                  <span>Frame: {currentFrameIdx + 1} / {sequenceData?.frames_count || 12}</span>
                  <span className="text-[#38BDF8] font-bold">t = {currentFrame?.time_s.toFixed(1)}s</span>
                </div>
              </div>

              {/* The Multi-Layer SVG/Canvas Screen */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-950 to-[#050D1A] rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
                {/* Background Grid */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #38BDF8 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* SVG Render Layer */}
                <svg
                  viewBox={`0 0 ${canvasW} ${canvasH}`}
                  className="w-full h-full select-none"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.15))' }}
                >
                  <defs>
                    <radialGradient id="smokeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.85" />
                      <stop offset="45%" stopColor="#94A3B8" stopOpacity="0.45" />
                      <stop offset="85%" stopColor="#475569" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* 1. LAYER: ACCUMULATION HEATMAP (When Toggled) */}
                  {showAccumulationHeatmap && sequenceData?.accumulation_map && (
                    <g opacity={0.78}>
                      {sequenceData.accumulation_map.density_weighted_matrix.map((row, rIdx) => {
                        const cellH = canvasH / 24;
                        const cellW = canvasW / 32;
                        return row.map((val, cIdx) => {
                          if (val < 0.05) return null;
                          const r = Math.min(255, Math.round(val * 320));
                          const g = Math.round(val > 0.5 ? (1.0 - val) * 255 : val * 220);
                          const b = Math.round((1.0 - val) * 200);
                          return (
                            <rect
                              key={`cell-${rIdx}-${cIdx}`}
                              x={cIdx * cellW}
                              y={rIdx * cellH}
                              width={cellW + 0.5}
                              height={cellH + 0.5}
                              fill={`rgb(${r},${g},${b})`}
                              opacity={val * 0.85}
                            />
                          );
                        });
                      })}

                      {/* Stagnation Hotspot Reticle */}
                      {(() => {
                        const pt = sequenceData.accumulation_map.peak_stagnation_point;
                        const hx = pt.x_norm * canvasW;
                        const hy = pt.y_norm * canvasH;
                        return (
                          <g>
                            <circle
                              cx={hx}
                              cy={hy}
                              r={22}
                              fill="none"
                              stroke="#FC3D21"
                              strokeWidth={2}
                              strokeDasharray="4 3"
                            />
                            <circle cx={hx} cy={hy} r={4} fill="#FC3D21" />
                            <text
                              x={hx + 12}
                              y={hy - 10}
                              fill="#FC3D21"
                              fontSize="11"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              PEAK ACCUMULATION ZONE ({Math.round(pt.x_norm * 100)}%, {Math.round(pt.y_norm * 100)}%)
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  )}

                  {/* 2. LAYER: SIMULATED SMOKE CLOUD (When not purely viewing heatmap) */}
                  {currentFrame && (
                    <g>
                      {/* Diffuse Smoke Core */}
                      <ellipse
                        cx={currentFrame.centroid.x * scaleX}
                        cy={currentFrame.centroid.y * scaleY}
                        rx={Math.sqrt(currentFrame.area_px) * 0.9 * scaleX}
                        ry={Math.sqrt(currentFrame.area_px) * 0.75 * scaleY}
                        fill="url(#smokeGlow)"
                        opacity={showOpticalDepth ? 0.3 : 0.75}
                      />

                      {/* 3. LAYER: OPTICAL DEPTH FALSE COLOR */}
                      {showOpticalDepth && (
                        <ellipse
                          cx={currentFrame.centroid.x * scaleX}
                          cy={currentFrame.centroid.y * scaleY}
                          rx={Math.sqrt(currentFrame.area_px) * 0.8 * scaleX}
                          ry={Math.sqrt(currentFrame.area_px) * 0.65 * scaleY}
                          fill="#38BDF8"
                          opacity={Math.min(0.7, currentFrame.mean_optical_depth * 0.45)}
                          style={{ mixBlendMode: 'screen', filter: 'blur(12px)' }}
                        />
                      )}

                      {/* 4. LAYER: BOUNDARY CONTOUR POLYGON */}
                      {showBoundary && currentFrame.boundary_polygon.length > 2 && (
                        <g>
                          <polygon
                            points={currentFrame.boundary_polygon
                              .map(([x, y]) => `${x * scaleX},${y * scaleY}`)
                              .join(' ')}
                            fill="rgba(56, 189, 248, 0.08)"
                            stroke="#38BDF8"
                            strokeWidth={1.8}
                            strokeDasharray={showOpticalDepth ? '4 2' : 'none'}
                          />
                          {/* Vertex Nodes */}
                          {currentFrame.boundary_polygon.map(([x, y], idx) => (
                            <circle
                              key={`pt-${idx}`}
                              cx={x * scaleX}
                              cy={y * scaleY}
                              r={2}
                              fill="#38BDF8"
                              opacity={0.8}
                            />
                          ))}
                        </g>
                      )}

                      {/* 5. LAYER: CENTROID & EXPANSION RETICLE */}
                      {showCentroid && (
                        <g>
                          <circle
                            cx={currentFrame.centroid.x * scaleX}
                            cy={currentFrame.centroid.y * scaleY}
                            r={6}
                            fill="none"
                            stroke="#F5B942"
                            strokeWidth={2}
                          />
                          <line
                            x1={(currentFrame.centroid.x - 12) * scaleX}
                            y1={currentFrame.centroid.y * scaleY}
                            x2={(currentFrame.centroid.x + 12) * scaleX}
                            y2={currentFrame.centroid.y * scaleY}
                            stroke="#F5B942"
                            strokeWidth={1.5}
                          />
                          <line
                            x1={currentFrame.centroid.x * scaleX}
                            y1={(currentFrame.centroid.y - 12) * scaleY}
                            x2={currentFrame.centroid.x * scaleX}
                            y2={(currentFrame.centroid.y + 12) * scaleY}
                            stroke="#F5B942"
                            strokeWidth={1.5}
                          />
                          <text
                            x={(currentFrame.centroid.x + 10) * scaleX}
                            y={(currentFrame.centroid.y + 18) * scaleY}
                            fill="#F5B942"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            C({Math.round(currentFrame.centroid.x)}, {Math.round(currentFrame.centroid.y)})
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* 6. LAYER: DISPERSION FLOW VECTORS (Quiver) */}
                  {showFlowVectors && sequenceData?.flow_vector_field && (
                    <g opacity={0.65}>
                      {sequenceData.flow_vector_field.map((vec, idx) => {
                        const vx = vec.x * scaleX;
                        const vy = vec.y * scaleY;
                        const len = Math.min(22, vec.magnitude * 2.5);
                        const endX = vx + (vec.u / (vec.magnitude || 1)) * len;
                        const endY = vy + (vec.v / (vec.magnitude || 1)) * len;
                        return (
                          <g key={`flow-${idx}`}>
                            <line
                              x1={vx}
                              y1={vy}
                              x2={endX}
                              y2={endY}
                              stroke="#24B8A0"
                              strokeWidth={1.2}
                            />
                            <circle cx={endX} cy={endY} r={1.5} fill="#24B8A0" />
                          </g>
                        );
                      })}
                    </g>
                  )}
                </svg>

                {/* Microgravity Chamber Annotations */}
                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  FOV: 80 × 60 mm • Scale: {sequenceData?.metadata.scale_mm_per_px} mm/px
                </div>
                <div className="absolute top-2 right-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {showAccumulationHeatmap ? 'MODE: ACCUMULATION MAP' : 'MODE: FRAME INFERENCE'}
                  </span>
                </div>
              </div>

              {/* Scrubber Controls */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-[#38BDF8] hover:bg-cyan-500/25 transition"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrameIdx(0);
                    }}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Frame Slider */}
                  <input
                    type="range"
                    min={0}
                    max={(sequenceData?.frames.length || 12) - 1}
                    value={currentFrameIdx}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentFrameIdx(parseInt(e.target.value));
                    }}
                    className="flex-1 accent-[#38BDF8] cursor-pointer"
                  />
                  <span className="font-mono text-xs text-[#38BDF8] font-bold w-12 text-right">
                    {currentFrame?.time_s.toFixed(1)}s
                  </span>
                </div>

                {/* Overlays Toggle Bar */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400">CV OVERLAYS:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setShowBoundary(!showBoundary)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border transition ${
                        showBoundary
                          ? 'bg-cyan-950/80 text-[#38BDF8] border-cyan-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      Boundary Contour
                    </button>
                    <button
                      onClick={() => setShowCentroid(!showCentroid)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border transition ${
                        showCentroid
                          ? 'bg-amber-950/80 text-[#F5B942] border-amber-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      Centroid Vector
                    </button>
                    <button
                      onClick={() => setShowFlowVectors(!showFlowVectors)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border transition ${
                        showFlowVectors
                          ? 'bg-emerald-950/80 text-[#24B8A0] border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      Flow Vectors
                    </button>
                    <button
                      onClick={() => setShowOpticalDepth(!showOpticalDepth)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border transition ${
                        showOpticalDepth
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      Optical Depth (τ)
                    </button>
                    <button
                      onClick={() => setShowAccumulationHeatmap(!showAccumulationHeatmap)}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded border font-bold transition ${
                        showAccumulationHeatmap
                          ? 'bg-red-950 text-[#FC3D21] border-red-500/50 shadow-md ring-1 ring-red-500/30'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      ★ Accumulation Map
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Live Metrics & Stagnation Advisory (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Telemetry KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Plume Area A(t)</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {currentFrame?.area_cm2 || 0} <span className="text-xs text-slate-400">cm²</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-500 mt-1">
                    {currentFrame?.area_px.toLocaleString()} px²
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Expansion Rate dA/dt</div>
                  <div className="text-xl font-bold font-mono text-[#38BDF8] mt-1">
                    {currentKinetics?.expansion_rate_cm2_s || 0} <span className="text-xs text-slate-400">cm²/s</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Centroid v: {currentKinetics?.centroid_velocity_cm_s} cm/s
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Peak Optical Depth (τ)</div>
                  <div className="text-xl font-bold font-mono text-[#F5B942] mt-1">
                    {currentFrame?.peak_optical_depth || 0}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Mean τ: {currentFrame?.mean_optical_depth}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Est. Smoke Density</div>
                  <div className="text-xl font-bold font-mono text-[#24B8A0] mt-1">
                    {currentFrame?.estimated_smoke_density_mg_m3 || 0} <span className="text-xs text-slate-400">mg/m³</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    k_ext: {sequenceData?.metadata.k_ext} m²/g
                  </div>
                </div>
              </div>

              {/* SMOKE ACCUMULATION INTELLIGENCE CARD (The User's Feature!) */}
              <div className="bg-gradient-to-br from-[#0B1D36] to-slate-900 p-4 rounded-xl border border-red-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#FC3D21]" />
                    <span className="text-sm font-bold text-white tracking-wide">
                      SMOKE ACCUMULATION MAPPING
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-[#FC3D21] border border-red-500/40">
                    SCORE: {sequenceData?.accumulation_map.stagnation_severity_score} / 100
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Instead of evaluating single frames, the CV engine integrates smoke masks across time:
                  <span className="font-mono text-cyan-400 block my-1">
                    A(x, y) = 1/T ∑ M(x, y, t) • τ(x, y, t)
                  </span>
                  identifying hazardous microgravity air stagnation zones where lack of buoyant convection traps toxic particles.
                </p>

                <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="text-[#38BDF8] font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>SPACECRAFT SENSOR PLACEMENT ADVISORY</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-normal">
                    {sequenceData?.accumulation_map.recommended_detector_placement}
                  </div>
                  <div className="text-amber-400 text-[10px]">
                    Risk: {sequenceData?.accumulation_map.risk_assessment}
                  </div>
                </div>

                <button
                  onClick={() => setShowAccumulationHeatmap(!showAccumulationHeatmap)}
                  className="w-full py-2 rounded-lg font-mono text-xs font-bold bg-gradient-to-r from-red-600/30 to-amber-600/30 border border-red-500/50 text-white hover:brightness-125 transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-[#FC3D21]" />
                  {showAccumulationHeatmap ? 'Hide Accumulation Heatmap' : 'Overlay Accumulation Heatmap On Video'}
                </button>
              </div>

              {/* Expansion Kinetics Chart */}
              <div className="bg-white dark:bg-[#0B1D36] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Plume Expansion Kinetics (dA/dt)
                  </span>
                  <span className="text-[10px] font-mono text-[#38BDF8]">cm² vs. Time</span>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sequenceData?.expansion_kinetics || []}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis
                        dataKey="time_s"
                        stroke="#94A3B8"
                        fontSize={10}
                        tickFormatter={(v) => `${v}s`}
                      />
                      <YAxis stroke="#94A3B8" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          fontSize: '11px',
                          color: '#F8FAFC',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="area_cm2"
                        name="Area (cm²)"
                        stroke="#38BDF8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#areaGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="expansion_rate_cm2_s"
                        name="dA/dt (cm²/s)"
                        stroke="#F5B942"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: TEM PARTICLE SIZING */}
      {activeTab === 'microscopy' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0B1D36] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#24B8A0]" />
                Transmission Electron Microscopy (TEM) Particle Sizing Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Analyzes soot collected on NASA SAME-R thermophoretic grids on ISS. Measures primary spherule diameter, fractal agglomerates, and aspect ratios.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Sample Material:</span>
              <select
                value={selectedMicroMaterial}
                onChange={(e) => setSelectedMicroMaterial(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white"
              >
                <option value="Kapton">Kapton Wire Overload</option>
                <option value="Teflon">Teflon Pyrolysis Oligomers</option>
                <option value="Silicone">Silicone Wire Sheath</option>
                <option value="Lampwick">Lampwick Porous Carbon</option>
              </select>
            </div>
          </div>

          {/* Microscopy Grid & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Micrograph (7 Columns) */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-3">
                <span className="text-white font-semibold">
                  {microscopyData?.investigation_source} • Mag: {microscopyData?.magnification}
                </span>
                <span className="text-[#24B8A0] font-bold">
                  {microscopyData?.particles_detected_count} Particles Segmented
                </span>
              </div>

              {/* Micrograph Render */}
              <div className="relative w-full aspect-[4/3] bg-[#07101C] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 400 300" className="w-full h-full select-none">
                  {/* Subtle TEM Grid Pattern */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.4" />
                  </pattern>
                  <rect width="400" height="300" fill="url(#grid)" />

                  {/* Render Detected Particles */}
                  {microscopyData?.particles.map((p) => {
                    const isAgg = p.classification === 'Agglomerate Cluster';
                    return (
                      <g key={p.particle_id}>
                        {isAgg ? (
                          <ellipse
                            cx={p.center_x}
                            cy={p.center_y}
                            rx={p.radius_px * 1.4}
                            ry={p.radius_px * 0.9}
                            fill="#38BDF8"
                            fillOpacity="0.3"
                            stroke="#38BDF8"
                            strokeWidth={1.2}
                          />
                        ) : (
                          <circle
                            cx={p.center_x}
                            cy={p.center_y}
                            r={p.radius_px}
                            fill="#24B8A0"
                            fillOpacity="0.4"
                            stroke="#24B8A0"
                            strokeWidth={1.2}
                          />
                        )}
                        <circle cx={p.center_x} cy={p.center_y} r={1.5} fill="#F8FAFC" />
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-2 left-3 bg-black/80 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-slate-300">
                  Scale: {microscopyData?.pixel_scale_nm_per_px} nm/px (Bar = 100 nm)
                </div>
                <div className="absolute top-2 right-3 flex items-center gap-3 text-[10px] font-mono bg-black/70 px-2 py-1 rounded border border-slate-800">
                  <span className="flex items-center gap-1 text-[#24B8A0]">
                    <span className="w-2 h-2 rounded-full bg-[#24B8A0]" /> Primary Spherule
                  </span>
                  <span className="flex items-center gap-1 text-[#38BDF8]">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Agglomerate
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[#24B8A0] font-bold">Morphology: </span>
                {microscopyData?.morphology_assessment}
              </div>
            </div>

            {/* Particle Distribution Stats (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Count Mean CMD</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {microscopyData?.statistics.count_mean_diameter_nm} <span className="text-xs text-slate-400">nm</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-500 mt-1">0th Moment</div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Mass Mean d_mm</div>
                  <div className="text-xl font-bold font-mono text-[#24B8A0] mt-1">
                    {microscopyData?.statistics.mass_mean_diameter_dmm_nm} <span className="text-xs text-slate-400">nm</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-500 mt-1">3rd Moment (Optical)</div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Geometric Mean d_g</div>
                  <div className="text-xl font-bold font-mono text-[#F5B942] mt-1">
                    {microscopyData?.statistics.geometric_mean_diameter_dg_nm} <span className="text-xs text-slate-400">nm</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">Lognormal Median</div>
                </div>

                <div className="bg-white dark:bg-[#0B1D36] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Geometric Std Dev (σ_g)</div>
                  <div className="text-xl font-bold font-mono text-[#FC3D21] mt-1">
                    {microscopyData?.statistics.geometric_standard_deviation}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">Polydispersity Metric</div>
                </div>
              </div>

              {/* Particle Size Distribution Bar Chart */}
              <div className="bg-white dark:bg-[#0B1D36] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white uppercase tracking-wider block mb-2">
                  Particle Size Distribution (PSD) Histogram
                </span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={microscopyData?.size_distribution_bins || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="range" stroke="#94A3B8" fontSize={10} />
                      <YAxis stroke="#94A3B8" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          fontSize: '11px',
                          color: '#F8FAFC',
                        }}
                      />
                      <Bar dataKey="count" fill="#24B8A0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: CROSS-EXPERIMENT BENCHMARK */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1D36] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FC3D21]" />
              Cross-Experiment Microgravity Smoke Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {comparisonData?.key_scientific_takeaway}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B1D36] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Experiment</th>
                    <th className="p-3">Material</th>
                    <th className="p-3">Airflow (cm/s)</th>
                    <th className="p-3">Peak Area (cm²)</th>
                    <th className="p-3">Avg Expansion (cm²/s)</th>
                    <th className="p-3">Peak τ</th>
                    <th className="p-3">Stagnation Score</th>
                    <th className="p-3">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {comparisonData?.experiments.map((exp) => (
                    <tr key={exp.preset_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{exp.name}</td>
                      <td className="p-3 text-[#38BDF8]">{exp.material}</td>
                      <td className="p-3">{exp.airflow_cm_s}</td>
                      <td className="p-3">{exp.peak_area_cm2}</td>
                      <td className="p-3">{exp.avg_expansion_rate_cm2_s}</td>
                      <td className="p-3 text-[#F5B942]">{exp.peak_optical_depth}</td>
                      <td className="p-3 font-bold text-[#FC3D21]">{exp.stagnation_severity_score}%</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exp.stagnation_severity_score > 60
                              ? 'bg-red-500/20 text-[#FC3D21] border border-red-500/30'
                              : exp.stagnation_severity_score > 35
                              ? 'bg-amber-500/20 text-[#F5B942] border border-amber-500/30'
                              : 'bg-emerald-500/20 text-[#24B8A0] border border-emerald-500/30'
                          }`}
                        >
                          {exp.risk_assessment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
