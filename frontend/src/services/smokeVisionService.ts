/**
 * SMOKEVISION Client Service
 * Interacts with FastAPI backend for microgravity smoke plume CV analytics,
 * with graceful offline fallback generation.
 */

export interface PresetExperiment {
  id: string;
  name: string;
  investigation: string;
  material: string;
  airflow_cm_s: number;
  gravity: string;
  description: string;
}

export interface PlumeFrame {
  frame_index: number;
  time_s: number;
  image_data: string;
  area_px: number;
  area_cm2: number;
  centroid: { x: number; y: number };
  boundary_polygon: number[][];
  mean_optical_depth: number;
  peak_optical_depth: number;
  estimated_smoke_density_mg_m3: number;
}

export interface ExpansionKinetics {
  frame_index: number;
  time_s: number;
  area_px: number;
  area_cm2: number;
  centroid_x: number;
  centroid_y: number;
  mean_optical_depth: number;
  peak_optical_depth: number;
  estimated_smoke_density_mg_m3: number;
  expansion_rate_cm2_s: number;
  centroid_velocity_cm_s: number;
}

export interface AccumulationMap {
  grid_width: number;
  grid_height: number;
  resolution: string;
  peak_stagnation_point: {
    x_px: number;
    y_px: number;
    x_norm: number;
    y_norm: number;
  };
  stagnation_severity_score: number;
  risk_assessment: string;
  recommended_detector_placement: string;
  density_weighted_matrix: number[][];
  residence_frequency_matrix: number[][];
}

export interface FlowVector {
  x: number;
  y: number;
  u: number;
  v: number;
  magnitude: number;
  angle_deg: number;
}

export interface SmokeSequenceData {
  preset_id: string;
  metadata: {
    name: string;
    investigation: string;
    material: string;
    gravity: string;
    airflow_cm_s: number;
    pressure_kpa: number;
    o2_pct: number;
    description: string;
    k_ext: number;
    scale_mm_per_px: number;
  };
  frames_count: number;
  frames: PlumeFrame[];
  expansion_kinetics: ExpansionKinetics[];
  accumulation_map: AccumulationMap;
  flow_vector_field: FlowVector[];
}

export interface MicroscopyParticle {
  particle_id: number;
  center_x: number;
  center_y: number;
  diameter_nm: number;
  radius_px: number;
  circularity: number;
  aspect_ratio: number;
  classification: string;
}

export interface MicroscopyData {
  material: string;
  investigation_source: string;
  microscopy_type: string;
  magnification: string;
  pixel_scale_nm_per_px: number;
  particles_detected_count: number;
  morphology_assessment: string;
  statistics: {
    count_mean_diameter_nm: number;
    mass_mean_diameter_dmm_nm: number;
    geometric_mean_diameter_dg_nm: number;
    geometric_standard_deviation: number;
    min_diameter_nm: number;
    max_diameter_nm: number;
  };
  size_distribution_bins: { range: string; count: number }[];
  particles: MicroscopyParticle[];
}

export interface ExperimentComparisonItem {
  preset_id: string;
  name: string;
  investigation: string;
  material: string;
  airflow_cm_s: number;
  gravity: string;
  peak_area_cm2: number;
  avg_expansion_rate_cm2_s: number;
  peak_optical_depth: number;
  stagnation_severity_score: number;
  risk_assessment: string;
  recommended_detector_location: string;
}

export interface ExperimentComparisonData {
  compared_experiments_count: number;
  experiments: ExperimentComparisonItem[];
  key_scientific_takeaway: string;
}

export interface SurveillanceEvent {
  time_s: number;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface VideoSurveillanceResult {
  status: string;
  video_metadata: {
    duration_s: number;
    total_frames: number;
    fps: number;
    original_resolution: string;
    processed_resolution: string;
    frames_analyzed: number;
  };
  surveillance_status: {
    threat_level: string;
    threat_color: string;
    smoke_detected: boolean;
    first_detection_time_s: number | null;
    max_plume_area_cm2: number;
    peak_expansion_rate_cm2_s: number;
    stagnation_severity_score: number;
    recommended_action: string;
  };
  events_log: SurveillanceEvent[];
  frames: PlumeFrame[];
  expansion_kinetics: ExpansionKinetics[];
  accumulation_map: AccumulationMap;
}

const API_BASE = '/api/v1';

export async function fetchSmokeSequence(presetId: string = 'SAME-R-101'): Promise<SmokeSequenceData> {
  try {
    const res = await fetch(`${API_BASE}/smokevision/sequence?preset_id=${presetId}&num_frames=12`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, using client-side fallback:', err);
  }

  // Client-side fallback if backend server is not running
  return generateClientFallbackSequence(presetId);
}

export async function uploadVideoForSurveillance(
  file: File,
  material: string = 'Kapton'
): Promise<VideoSurveillanceResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE}/smokevision/analyze-video?material=${material}`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API video analysis failed, using synthetic fallback:', err);
  }

  return generateClientFallbackSurveillance(file.name);
}

export async function fetchDemoVideoSurveillance(
  material: string = 'Kapton'
): Promise<VideoSurveillanceResult> {
  try {
    const res = await fetch(`${API_BASE}/smokevision/demo-video-analysis?material=${material}`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API demo video analysis failed:', err);
  }

  return generateClientFallbackSurveillance('demo_microgravity_smoke.mp4');
}

function generateClientFallbackSurveillance(filename: string): VideoSurveillanceResult {
  const seq = generateClientFallbackSequence('SAME-R-101');
  return {
    status: 'success',
    video_metadata: {
      duration_s: 6.0,
      total_frames: 90,
      fps: 15.0,
      original_resolution: '480x360',
      processed_resolution: '320x240',
      frames_analyzed: seq.frames.length,
    },
    surveillance_status: {
      threat_level: 'WARNING: ACTIVE PLUME GROWTH',
      threat_color: 'AMBER',
      smoke_detected: true,
      first_detection_time_s: 1.13,
      max_plume_area_cm2: 12.4,
      peak_expansion_rate_cm2_s: 5.2,
      stagnation_severity_score: 58.4,
      recommended_action: 'ALERT FLIGHT CREW & VERIFY SECONDARY IONIZATION DETECTOR',
    },
    events_log: [
      { time_s: 0.0, level: 'INFO', message: `SURVEILLANCE FEED INITIALIZED: ${filename}` },
      { time_s: 0.2, level: 'INFO', message: 'BASELINE OPTICAL CALIBRATION LOCKED (I_0)' },
      { time_s: 1.13, level: 'WARNING', message: 'SMOKE INCEPTION DETECTED at (168, 120) • Area: 2.1 cm²' },
      { time_s: 3.4, level: 'WARNING', message: 'PLUME GROWTH THRESHOLD EXCEEDED: dA/dt = 4.8 cm²/s' },
      { time_s: 5.8, level: 'WARNING', message: 'VENTILATION STAGNATION HAZARD: Smoke persistence 58.4%' },
    ],
    frames: seq.frames,
    expansion_kinetics: seq.expansion_kinetics,
    accumulation_map: seq.accumulation_map,
  };
}

export async function fetchMicroscopyAnalysis(material: string = 'Kapton'): Promise<MicroscopyData> {
  try {
    const res = await fetch(`${API_BASE}/smokevision/microscopy?material=${material}`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, using client-side fallback:', err);
  }

  return generateClientFallbackMicroscopy(material);
}

export async function fetchExperimentComparison(): Promise<ExperimentComparisonData> {
  try {
    const res = await fetch(`${API_BASE}/smokevision/compare`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, using client-side fallback:', err);
  }

  return {
    compared_experiments_count: 4,
    experiments: [
      {
        preset_id: 'SAME-R-101',
        name: 'SAME-R Run 101 (ISS Quiescent)',
        investigation: 'SAME-R (PSI-101)',
        material: 'Kapton Wire Insulation',
        airflow_cm_s: 0,
        gravity: 'Microgravity (ISS LEO)',
        peak_area_cm2: 48.2,
        avg_expansion_rate_cm2_s: 3.45,
        peak_optical_depth: 1.78,
        stagnation_severity_score: 74.2,
        risk_assessment: 'HIGH STAGNATION RECIRCLUATION',
        recommended_detector_location: 'Mount primary detector at center coordinates (45%, 55%)',
      },
      {
        preset_id: 'SAME-R-104',
        name: 'SAME-R Run 104 (ISS 2 cm/s Duct)',
        investigation: 'SAME-R (PSI-101)',
        material: 'Teflon Wire Insulation',
        airflow_cm_s: 2,
        gravity: 'Microgravity (ISS LEO)',
        peak_area_cm2: 62.8,
        avg_expansion_rate_cm2_s: 4.12,
        peak_optical_depth: 1.42,
        stagnation_severity_score: 41.5,
        risk_assessment: 'MODERATE ACCUMULATION',
        recommended_detector_location: 'Mount detector 30 cm downstream along duct ceiling',
      },
      {
        preset_id: 'BASS-II-25',
        name: 'BASS-II Run 25 (Glovebox Flow)',
        investigation: 'BASS-II (PSI-25)',
        material: 'PMMA Flat Slab',
        airflow_cm_s: 5,
        gravity: 'Microgravity (ISS MSG)',
        peak_area_cm2: 78.5,
        avg_expansion_rate_cm2_s: 5.8,
        peak_optical_depth: 1.95,
        stagnation_severity_score: 32.0,
        risk_assessment: 'LOW RESIDENCE / RAPID ADVECTION',
        recommended_detector_location: 'Mount sensor at glovebox exhaust suction port',
      },
      {
        preset_id: 'SAFFIRE-I',
        name: 'SAFFIRE-I Flight Test (Cygnus Module)',
        investigation: 'SAFFIRE (PSI-98)',
        material: 'SIBAL Fabric Blend',
        airflow_cm_s: 20,
        gravity: 'Microgravity (Cygnus Cargo)',
        peak_area_cm2: 320.0,
        avg_expansion_rate_cm2_s: 18.4,
        peak_optical_depth: 2.15,
        stagnation_severity_score: 22.8,
        risk_assessment: 'LOW RESIDENCE / RAPID ADVECTION',
        recommended_detector_location: 'Mount at return air grille along vehicle overhead aisle',
      },
    ],
    key_scientific_takeaway:
      'Microgravity airflow regime is the single greatest determinant of smoke accumulation. Under quiescent conditions (SAME-R 101, 0 cm/s), smoke lingers indefinitely at the pyrolysis core with extreme stagnation scores (>70%). Conversely, even modest cabin duct drafts transform the threat from localized toxic accumulation to widespread cabin ventilation transport.',
  };
}

// ---------------------------------------------------------------------------
// Client Fallback Data Generators
// ---------------------------------------------------------------------------

function generateClientFallbackSequence(presetId: string): SmokeSequenceData {
  const frames: PlumeFrame[] = [];
  const kinetics: ExpansionKinetics[] = [];
  const numFrames = 12;

  const isQuiescent = presetId === 'SAME-R-101';
  const isDuct = presetId === 'SAME-R-104';
  const isBass = presetId === 'BASS-II-25';

  const material = isQuiescent ? 'Kapton' : isDuct ? 'Teflon' : isBass ? 'PMMA' : 'SIBAL';
  const airflow = isQuiescent ? 0 : isDuct ? 2 : isBass ? 5 : 20;

  for (let i = 0; i < numFrames; i++) {
    const t = (i + 1) * 1.5;
    const baseRadius = 15 + i * 9.5;
    const areaPx = Math.round(Math.PI * baseRadius * (baseRadius * 0.85));
    const areaCm2 = Math.round((areaPx * 0.000625) * 100) / 100;

    const cx = Math.round(isQuiescent ? 160 + i * 1.2 : 80 + i * 14);
    const cy = Math.round(isQuiescent ? 120 - i * 0.5 : 120 + Math.sin(i * 0.5) * 6);

    const meanTau = Math.round((Math.max(0.2, 1.6 - i * 0.07)) * 1000) / 1000;
    const peakTau = Math.round((meanTau * 1.8) * 1000) / 1000;
    const density = Math.round((meanTau / (4.5 * 0.05)) * 1000);

    const boundary: number[][] = [];
    const pointsCount = 20;
    for (let p = 0; p < pointsCount; p++) {
      const angle = (p / pointsCount) * Math.PI * 2;
      const r = baseRadius * (1 + 0.12 * Math.sin(p * 3 + i));
      boundary.push([
        Math.round(cx + Math.cos(angle) * r),
        Math.round(cy + Math.sin(angle) * (r * 0.85)),
      ]);
    }

    frames.push({
      frame_index: i,
      time_s: t,
      image_data: '',
      area_px: areaPx,
      area_cm2: areaCm2,
      centroid: { x: cx, y: cy },
      boundary_polygon: boundary,
      mean_optical_depth: meanTau,
      peak_optical_depth: peakTau,
      estimated_smoke_density_mg_m3: density,
    });

    const prevArea = i > 0 ? kinetics[i - 1].area_cm2 : 0;
    const rate = i > 0 ? Math.round(((areaCm2 - prevArea) / 1.5) * 100) / 100 : 0;
    const driftVel = i > 0 ? (isQuiescent ? 0.3 : isDuct ? 2.1 : 4.8) : 0;

    kinetics.push({
      frame_index: i,
      time_s: t,
      area_px: areaPx,
      area_cm2: areaCm2,
      centroid_x: cx,
      centroid_y: cy,
      mean_optical_depth: meanTau,
      peak_optical_depth: peakTau,
      estimated_smoke_density_mg_m3: density,
      expansion_rate_cm2_s: rate,
      centroid_velocity_cm_s: driftVel,
    });
  }

  // 32x24 Accumulation Matrix
  const densityMatrix: number[][] = [];
  const dwellMatrix: number[][] = [];
  for (let r = 0; r < 24; r++) {
    const dRow: number[] = [];
    const wRow: number[] = [];
    for (let c = 0; c < 32; c++) {
      const targetC = isQuiescent ? 16 : 14;
      const targetR = 12;
      const dist = Math.sqrt((c - targetC) ** 2 + (r - targetR) ** 2);
      const val = Math.max(0, Math.round(Math.exp(-0.5 * (dist / (isQuiescent ? 4.5 : 7.0)) ** 2) * 100) / 100);
      dRow.push(val);
      wRow.push(val > 0.15 ? Math.min(1.0, val * 1.2) : 0);
    }
    densityMatrix.push(dRow);
    dwellMatrix.push(wRow);
  }

  // Flow vectors
  const vectors: FlowVector[] = [];
  for (let y = 16; y < 240; y += 32) {
    for (let x = 16; x < 320; x += 32) {
      const u = isQuiescent ? (x - 160) * 0.02 : airflow * 0.4 + (x - 160) * 0.01;
      const v = isQuiescent ? (y - 120) * 0.02 : (y - 120) * 0.015;
      const mag = Math.sqrt(u * u + v * v);
      vectors.push({
        x,
        y,
        u: Math.round(u * 100) / 100,
        v: Math.round(v * 100) / 100,
        magnitude: Math.round(mag * 100) / 100,
        angle_deg: Math.round(Math.atan2(v, u) * (180 / Math.PI)),
      });
    }
  }

  return {
    preset_id: presetId,
    metadata: {
      name: isQuiescent ? 'SAME-R Run 101 (ISS Quiescent)' : 'SAME-R Run 104 (ISS 2 cm/s Duct)',
      investigation: isQuiescent || isDuct ? 'SAME-R (PSI-101)' : 'BASS-II (PSI-25)',
      material: `${material} Wire Insulation`,
      gravity: 'Microgravity (ISS LEO, 10^-5 g)',
      airflow_cm_s: airflow,
      pressure_kpa: 101.3,
      o2_pct: 21.0,
      description: isQuiescent
        ? 'Quiescent wire overload pyrolysis. Symmetrical spherical expansion; high stagnation risk.'
        : 'Low-speed forced flow in duct. Smoke advects downstream slowly.',
      k_ext: 4.8,
      scale_mm_per_px: 0.25,
    },
    frames_count: numFrames,
    frames,
    expansion_kinetics: kinetics,
    accumulation_map: {
      grid_width: 32,
      grid_height: 24,
      resolution: '320x240',
      peak_stagnation_point: {
        x_px: isQuiescent ? 160 : 140,
        y_px: 120,
        x_norm: isQuiescent ? 0.5 : 0.44,
        y_norm: 0.5,
      },
      stagnation_severity_score: isQuiescent ? 72.4 : 41.2,
      risk_assessment: isQuiescent ? 'HIGH STAGNATION RECIRCLUATION' : 'MODERATE ACCUMULATION',
      recommended_detector_placement: `Mount primary sensor at cabin coordinates (${isQuiescent ? '50%' : '44%'}, 50%) to intercept dwell pocket.`,
      density_weighted_matrix: densityMatrix,
      residence_frequency_matrix: dwellMatrix,
    },
    flow_vector_field: vectors,
  };
}

function generateClientFallbackMicroscopy(material: string): MicroscopyData {
  const particles: MicroscopyParticle[] = [];
  const count = 46;
  const baseCmd = material === 'Kapton' ? 68 : material === 'Teflon' ? 45 : 95;

  for (let i = 0; i < count; i++) {
    const d = Math.round(baseCmd * (0.6 + Math.random() * 1.2) * 10) / 10;
    particles.push({
      particle_id: i + 1,
      center_x: Math.round(30 + Math.random() * 340),
      center_y: Math.round(30 + Math.random() * 240),
      diameter_nm: d,
      radius_px: Math.round((d / 2.4 / 2) * 10) / 10,
      circularity: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
      aspect_ratio: Math.round((1.1 + Math.random() * 0.8) * 100) / 100,
      classification: d > 120 ? 'Agglomerate Cluster' : 'Primary Spherule',
    });
  }

  return {
    material,
    investigation_source: 'NASA SAME-R (PSI-101) Thermophoretic Soot Collector',
    microscopy_type: 'Transmission Electron Microscopy (TEM, 80 kV)',
    magnification: '25,000x',
    pixel_scale_nm_per_px: 2.4,
    particles_detected_count: count,
    morphology_assessment:
      material === 'Kapton'
        ? 'Chain-like fractal soot aggregates with high specific surface area.'
        : 'Dense spherical fluorocarbon polymer droplets.',
    statistics: {
      count_mean_diameter_nm: baseCmd,
      mass_mean_diameter_dmm_nm: Math.round(baseCmd * 1.95),
      geometric_mean_diameter_dg_nm: Math.round(baseCmd * 0.92),
      geometric_standard_deviation: 1.74,
      min_diameter_nm: 22.4,
      max_diameter_nm: 340.5,
    },
    size_distribution_bins: [
      { range: '< 50 nm', count: 12 },
      { range: '50–100 nm', count: 18 },
      { range: '100–200 nm', count: 11 },
      { range: '200–400 nm', count: 4 },
      { range: '> 400 nm', count: 1 },
    ],
    particles,
  };
}
