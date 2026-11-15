import os
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
BASE_DIR = r"c:\Users\laure\OneDrive\Desktop\Astro_Sapien"
AUDIO_DIR = os.path.join(BASE_DIR, "video_assets", "audio")
OUTPUT_DIR = os.path.join(BASE_DIR, "video_assets", "rendered_clips")
FINAL_VIDEO = os.path.join(BASE_DIR, "video_assets", "FIRELINE_NASA_SpaceApps_Presentation.mp4")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1920x1080 at 24 fps
WIDTH, HEIGHT = 1920, 1080
FPS = 24

# Colors (RGB)
BG_COLOR = (11, 29, 54)        # Deep Space Navy #0B1D36
CARD_BG = (16, 36, 61)         # HUD Panel #10243D
BORDER_COLOR = (30, 58, 95)    # Slate Border
CYAN = (56, 189, 248)          # Cyber Cyan #38BDF8
AMBER = (245, 158, 11)         # Alert Amber #F59E0B
EMERALD = (16, 185, 129)       # Telemetry Green #10B981
ROSE = (244, 63, 94)           # Critical Red #F43F5E
WHITE = (248, 250, 252)        # Text Primary #F8FAFC
MUTED = (148, 163, 184)        # Text Secondary #94A3B8

def get_font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except:
        return ImageFont.load_default()

FONT_HEADER = get_font(26)
FONT_TITLE = get_font(46)
FONT_SUBTITLE = get_font(24)
FONT_BODY = get_font(22)
FONT_BADGE = get_font(18)
FONT_SUBTITLE_VO = get_font(28)

SCENES = [
    {
        "id": "clip_01",
        "audio": "clip_01_silent_peril.mp3",
        "title": "THE SILENT PERIL OF MICROGRAVITY",
        "badge": "ALERT: ZERO-G COMBUSTION ANOMALY // NO NATURAL BUOYANCY",
        "badge_color": ROSE,
        "subtitle": "In microgravity, flames form silent, cold spherical domes that defy Earth physics.",
        "type": "flame_sphere"
    },
    {
        "id": "clip_02",
        "audio": "clip_02_convection_paradox.mp3",
        "title": "THE BUOYANCY & VENTILATION PARADOX",
        "badge": "PHYSICS DIVERGENCE: 1g BUOYANT PLUME vs. μg VENTILATION DRIFT",
        "badge_color": AMBER,
        "subtitle": "Without gravity, hot air hovers in place. Flames crawl wherever forced cabin ducts blow.",
        "type": "split_physics"
    },
    {
        "id": "clip_03",
        "audio": "clip_03_smoke_detector_trap.mp3",
        "title": "THE SUB-MICRON SMOKE DETECTOR TRAP",
        "badge": "SENSOR BLIND SPOT: PYROLYSIS PARTICLES < 100nm EVADE SENSORS",
        "badge_color": ROSE,
        "subtitle": "Nanoscale smoke aerosols evade commercial optical detectors until toxic cabin thresholds.",
        "type": "smoke_sensor"
    },
    {
        "id": "clip_04",
        "audio": "clip_04_fragmented_nasa_data.mp3",
        "title": "DECADES OF NASA RESEARCH FRAGMENTED",
        "badge": "DATA SILOS: BASS-II • SAME-R • SAFFIRE • FLEX • SPICE",
        "badge_color": AMBER,
        "subtitle": "Vital microgravity combustion data isolated across incompatible spreadsheets and papers.",
        "type": "data_silos"
    },
    {
        "id": "clip_05",
        "audio": "clip_05_introducing_fireline.mp3",
        "title": "INTRODUCING FIRELINE ENGINE",
        "badge": "SYSTEM REVEAL // TEAM ASTRO_SAPIEN • NASA SPACE APPS 2026",
        "badge_color": CYAN,
        "subtitle": "The world's first unified, traceable fire-safety intelligence engine for human spaceflight.",
        "type": "fireline_reveal"
    },
    {
        "id": "clip_06",
        "audio": "clip_06_psi_evidence_loc.mp3",
        "title": "UNIFIED NASA PSI INGESTION & LOC ENGINE",
        "badge": "1,077 TEST RUNS • 6,287 MEASUREMENTS • 662 EVIDENCE CHUNKS",
        "badge_color": EMERALD,
        "subtitle": "Instant limiting oxygen concentrations, flame spread rates, and gaseous suppression limits.",
        "type": "loc_engine"
    },
    {
        "id": "clip_07",
        "audio": "clip_07_testmatch_smokewise.mp3",
        "title": "TESTMATCH & SMOKEWISE ANALYTICS",
        "badge": "SCALE DIVERGENCE GUARD // SMOKE AEROSOL KINETICS",
        "badge_color": CYAN,
        "subtitle": "Mathematically flags glovebox-to-vehicle scale errors and models aerosol aging kinetics.",
        "type": "testmatch_smokewise"
    },
    {
        "id": "clip_08",
        "audio": "clip_08_gemini_capcom_sql.mp3",
        "title": "AI CAPCOM VOICE & CONVERSATIONAL SQL",
        "badge": "GROUNDED GEMINI 2.5 FLASH RAG • SUPABASE POSTGRESQL AGENT",
        "badge_color": CYAN,
        "subtitle": "Zero-latency hands-free astronaut voice commands and deterministic SQL database queries.",
        "type": "capcom_ai"
    },
    {
        "id": "clip_09",
        "audio": "clip_09_artemis_mars_handoff.mp3",
        "title": "MISSION-READY FOR ARTEMIS & MARS",
        "badge": "EXPEDITION SAFETY: LEO • LUNAR GATEWAY • MARS HABITATS",
        "badge_color": EMERALD,
        "subtitle": "Protecting long-duration human space exploration. Initializing live system demo...",
        "type": "mission_handoff"
    }
]

def get_audio_duration(audio_path):
    cmd = [FFMPEG, "-i", audio_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            time_str = line.strip().split("Duration:")[1].split(",")[0].strip()
            h, m, s = time_str.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 10.0

def draw_hud_chrome(draw, t, scene_idx, total_scenes):
    # Top Telemetry Bar
    draw.rectangle([(0, 0), (WIDTH, 70)], fill=(8, 20, 38))
    draw.line([(0, 70), (WIDTH, 70)], fill=BORDER_COLOR, width=2)
    
    # NASA Space Apps & Logo
    draw.text((40, 20), "NASA SPACE APPS 2026", font=FONT_HEADER, fill=CYAN)
    draw.text((360, 22), "|  TEAM ASTRO_SAPIEN", font=FONT_BADGE, fill=WHITE)
    draw.text((640, 22), "|  PROJECT: FIRELINE v2.0", font=FONT_BADGE, fill=EMERALD)
    
    # Right-hand orbital metrics
    timecode = f"MET +00:{scene_idx*10 + int(t):02d}:{int((t % 1)*24):02d}"
    draw.text((WIDTH - 420, 20), timecode, font=FONT_HEADER, fill=AMBER)
    draw.text((WIDTH - 180, 22), "ISS LEO [μg]", font=FONT_BADGE, fill=CYAN)

    # Bottom Subtitle / Narration Bar
    draw.rectangle([(0, HEIGHT - 110), (WIDTH, HEIGHT)], fill=(8, 20, 38))
    draw.line([(0, HEIGHT - 110), (WIDTH, HEIGHT - 110)], fill=BORDER_COLOR, width=2)

def draw_scene_content(img, draw, scene, t, progress):
    stype = scene["type"]
    cx, cy = WIDTH // 2, HEIGHT // 2 - 20

    # Scene Title & Badge
    bcolor = scene["badge_color"]
    badge_text = scene["badge"]
    draw.rectangle([(WIDTH//2 - 420, 100), (WIDTH//2 + 420, 140)], fill=(bcolor[0]//5, bcolor[1]//5, bcolor[2]//5), outline=bcolor, width=2)
    bbox = draw.textbbox((0, 0), badge_text, font=FONT_BADGE)
    bw = bbox[2] - bbox[0]
    draw.text((WIDTH//2 - bw//2, 110), badge_text, font=FONT_BADGE, fill=bcolor)

    title_text = scene["title"]
    tbox = draw.textbbox((0, 0), title_text, font=FONT_TITLE)
    tw = tbox[2] - tbox[0]
    draw.text((WIDTH//2 - tw//2, 155), title_text, font=FONT_TITLE, fill=WHITE)

    # Subtitle at bottom
    sub_text = f'"{scene["subtitle"]}"'
    sbox = draw.textbbox((0, 0), sub_text, font=FONT_SUBTITLE_VO)
    sw = sbox[2] - sbox[0]
    draw.text((WIDTH//2 - sw//2, HEIGHT - 75), sub_text, font=FONT_SUBTITLE_VO, fill=CYAN)

    # Dynamic Center Visuals
    if stype == "flame_sphere":
        # Draw glowing microgravity spherical blue flame
        radius = int(140 + 15 * math.sin(t * 3))
        for r in range(radius, 20, -15):
            alpha = int(255 * (1 - r / radius))
            c = (20, int(150 * (r/radius)), int(255 * (r/radius)))
            draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], outline=c, width=3)
        # Inner glowing core
        draw.ellipse([(cx - 35, cy - 35), (cx + 35, cy + 35)], fill=(120, 230, 255))
        # Orbital trajectory arc
        draw.arc([(cx - 380, cy - 180), (cx + 380, cy + 180)], start=0, end=360, fill=(30, 70, 120), width=2)
        # Info labels
        draw.text((cx - 350, cy - 40), "SPHERICAL FLAME FRONT\n(Diffusion Dominated)", font=FONT_BODY, fill=CYAN)
        draw.text((cx + 180, cy - 40), "BUOYANCY = 0.000 g\nNO NATURAL CONVECTION", font=FONT_BODY, fill=ROSE)

    elif stype == "split_physics":
        # Left Panel (Earth 1g)
        draw.rectangle([(200, 240), (WIDTH//2 - 20, HEIGHT - 150)], fill=CARD_BG, outline=(50, 80, 120), width=2)
        draw.text((230, 260), "EARTH 1g REGIME", font=FONT_HEADER, fill=AMBER)
        draw.text((230, 300), "• Buoyant convection lifts hot gases\n• Flame elongates into teardrop\n• Natural air entrainment accelerates combustion\n• Smoke plumes rise rapidly to ceiling", font=FONT_BODY, fill=MUTED)
        # 1g flame curve
        fx, fy = 380, 560
        draw.polygon([(fx, fy-100), (fx-40, fy+40), (fx+40, fy+40)], fill=(255, 180, 0))
        draw.line([(fx, fy-110), (fx, fy-170)], fill=(200, 200, 200), width=3)
        draw.text((fx-50, fy-190), "RISING SMOKE", font=FONT_BADGE, fill=WHITE)

        # Right Panel (Microgravity μg)
        draw.rectangle([(WIDTH//2 + 20, 240), (WIDTH - 200, HEIGHT - 150)], fill=CARD_BG, outline=CYAN, width=2)
        draw.text((WIDTH//2 + 50, 260), "SPACECRAFT μg REGIME", font=FONT_HEADER, fill=CYAN)
        draw.text((WIDTH//2 + 50, 300), "• Buoyancy = 0.0 (No natural chimney effect)\n• Spherical flame front with radiative quenching\n• Driven strictly by forced cabin ventilation\n• Smoke aerosols hover in stagnation pockets", font=FONT_BODY, fill=MUTED)
        # μg spherical flame
        mx, my = WIDTH//2 + 280, 560
        draw.ellipse([(mx-60, my-60), (mx+60, my+60)], fill=(0, 180, 255), outline=WHITE, width=2)
        # Horizontal duct airflow arrow
        draw.line([(mx-150, my), (mx-80, my)], fill=EMERALD, width=4)
        draw.polygon([(mx-80, my-8), (mx-65, my), (mx-80, my+8)], fill=EMERALD)
        draw.text((mx-180, my+20), "FORCED AIRFLOW (1-8 cm/s)", font=FONT_BADGE, fill=EMERALD)

    elif stype == "smoke_sensor":
        # Smoke particles visualization
        draw.rectangle([(250, 240), (WIDTH - 250, HEIGHT - 150)], fill=CARD_BG, outline=ROSE, width=2)
        draw.text((290, 265), "NANOSCALE PYROLYSIS AEROSOL DISPERSION", font=FONT_HEADER, fill=ROSE)
        draw.text((290, 310), "Material Tested: Kapton Wire Insulation & Teflon Pyrolysis (SAME-R PSI-101)", font=FONT_SUBTITLE, fill=WHITE)
        
        # Detector comparison boxes
        draw.rectangle([(300, 380), (700, 560)], fill=(20, 40, 70), outline=MUTED)
        draw.text((320, 400), "ISS Optical Near-IR Detector", font=FONT_HEADER, fill=MUTED)
        draw.text((320, 440), "Wavelength: > 1,000 nm\nDetection Threshold: 150-300 nm\nStatus: BLIND TO FRESH SMOKE\nDetection Delay: > 700 Seconds", font=FONT_BODY, fill=ROSE)

        draw.rectangle([(750, 380), (1150, 560)], fill=(20, 40, 70), outline=AMBER)
        draw.text((770, 400), "Shuttle Ionization Detector", font=FONT_HEADER, fill=AMBER)
        draw.text((770, 440), "Mechanism: Alpha Particle Decay\nParticle Size: Sensitive to <100 nm\nStatus: UNSTABLE IN HUMIDITY\nHigh False Alarm Rate from Dust", font=FONT_BODY, fill=AMBER)

        draw.rectangle([(1200, 380), (1600, 560)], fill=(10, 50, 60), outline=EMERALD, width=2)
        draw.text((1220, 400), "FIRELINE MPASS Prototype", font=FONT_HEADER, fill=EMERALD)
        draw.text((1220, 440), "Method: Dual-Moment Discrimination\n0th/1st Moment (Particle Count)\n2nd/3rd Moment (Optical Mass)\nVariance Reduced by > 2x", font=FONT_BODY, fill=WHITE)

    elif stype == "data_silos":
        # 5 NASA Investigations Cards
        invs = [
            ("BASS-II (PSI-25)", "Solid Flame Spread in Glovebox (PMMA, SIBAL, Nomex)", "176 Runs • 1,300 Meas", CYAN),
            ("SAME-R (PSI-101)", "Microgravity Smoke Aerosol Particle Sizing", "140 Runs • 761 Meas", AMBER),
            ("SAFFIRE (PSI-98)", "Full-Scale Cygnus Vehicle Spacecraft Fire Tests", "19 Runs • 53 Meas", ROSE),
            ("FLEX (PSI-69)", "Droplet Combustion & Extinction (CO2, He, SF6)", "273 Runs • 2,346 Meas", EMERALD),
            ("SPICE (PSI-107)", "Microgravity Laminar Co-Flow Smoke Points", "469 Runs • 1,827 Meas", WHITE),
        ]
        y_start = 250
        for name, desc, stats, col in invs:
            draw.rectangle([(250, y_start), (WIDTH - 250, y_start + 65)], fill=CARD_BG, outline=col, width=2)
            draw.text((280, y_start + 12), name, font=FONT_HEADER, fill=col)
            draw.text((620, y_start + 18), desc, font=FONT_BODY, fill=WHITE)
            draw.text((WIDTH - 540, y_start + 18), stats, font=FONT_BADGE, fill=MUTED)
            y_start += 75

    elif stype == "fireline_reveal":
        # Big central holographic logo
        draw.rectangle([(300, 240), (WIDTH - 300, HEIGHT - 150)], fill=(12, 32, 60), outline=CYAN, width=3)
        draw.text((cx - 300, cy - 140), "F I R E L I N E", font=get_font(72), fill=CYAN)
        draw.text((cx - 380, cy - 40), "SPACECRAFT FIRE-SAFETY INTELLIGENCE ENGINE", font=FONT_HEADER, fill=WHITE)
        draw.text((cx - 240, cy + 15), "TEAM ASTRO_SAPIEN • NASA SPACE APPS 2026", font=FONT_SUBTITLE, fill=AMBER)
        # Architecture Pills
        pills = ["M1: Flammability & LOC", "M2: TESTMATCH Comparability", "M3: SMOKEwise Kinetics", "M4: SMOKEVISION CV"]
        px = 350
        for p in pills:
            draw.rectangle([(px, cy + 80), (px + 280, cy + 130)], fill=(20, 50, 90), outline=CYAN)
            draw.text((px + 20, cy + 95), p, font=FONT_BADGE, fill=WHITE)
            px += 310

    elif stype == "loc_engine":
        # Live Flammability curves
        draw.rectangle([(250, 240), (WIDTH - 250, HEIGHT - 150)], fill=CARD_BG, outline=EMERALD, width=2)
        draw.text((290, 260), "MODULE 1: EVIDENCE INTELLIGENCE & LOC ENGINE", font=FONT_HEADER, fill=EMERALD)
        draw.text((290, 305), "Live Ingested Database: 1,077 Test Runs | 6,287 Measurements | 662 Technical Chunks", font=FONT_SUBTITLE, fill=WHITE)
        # Flame spread curve simulation
        draw.line([(320, 580), (950, 580)], fill=MUTED, width=2)
        draw.line([(320, 580), (320, 380)], fill=MUTED, width=2)
        draw.text((320, 355), "Flame Spread Velocity (cm/s)", font=FONT_BADGE, fill=CYAN)
        draw.text((800, 595), "Forced Flow Velocity (cm/s)", font=FONT_BADGE, fill=CYAN)
        # Curve points
        pts = [(330, 560), (420, 520), (530, 460), (660, 420), (820, 410), (940, 440)]
        for i in range(len(pts)-1):
            draw.line([pts[i], pts[i+1]], fill=AMBER, width=4)
        # Citation block
        draw.rectangle([(1020, 360), (1600, 580)], fill=(16, 42, 70), outline=CYAN)
        draw.text((1045, 380), "NASA EMPIRICAL CITATION:", font=FONT_HEADER, fill=CYAN)
        draw.text((1045, 425), "• Source: NASA/TM-20210011385 (BASS-II)\n• Sample: PMMA Cast Acrylic, Flat Slab 1.27cm\n• Limiting Oxygen Concentration (LOC): 16.2%\n• Extinguishment Limit: 4.8 cm/s Blowoff\n• Database ID: PSI-25 / Run #BASS2-084", font=FONT_BODY, fill=WHITE)

    elif stype == "testmatch_smokewise":
        # TESTMATCH formula on Left
        draw.rectangle([(200, 240), (WIDTH//2 - 20, HEIGHT - 150)], fill=CARD_BG, outline=CYAN, width=2)
        draw.text((230, 260), "MODULE 2: TESTMATCH ENGINE", font=FONT_HEADER, fill=CYAN)
        draw.text((230, 300), "Deterministic Regime Comparability Formula:", font=FONT_SUBTITLE, fill=WHITE)
        draw.text((230, 340), "S = 100 * (Σ w_i * m_i * s_i) / (Σ w_i * m_i)\nC = 100 * (Σ w_i * m_i) / (Σ w_i)", font=FONT_HEADER, fill=AMBER)
        draw.rectangle([(230, 440), (WIDTH//2 - 50, 560)], fill=(50, 15, 25), outline=ROSE, width=2)
        draw.text((250, 455), "SCALE DIVERGENCE GUARD TRIGGERED!", font=FONT_HEADER, fill=ROSE)
        draw.text((250, 495), "Alert: BASS-II (1.2cm glovebox) flame spread cannot\nbe directly scaled to SAFFIRE (0.4m x 0.94m panel)\nRadiative pre-heating scale factor divergence: > 8x", font=FONT_BODY, fill=WHITE)

        # SMOKEwise on Right
        draw.rectangle([(WIDTH//2 + 20, 240), (WIDTH - 200, HEIGHT - 150)], fill=CARD_BG, outline=EMERALD, width=2)
        draw.text((WIDTH//2 + 50, 260), "MODULE 3: SMOKEWISE ENGINE", font=FONT_HEADER, fill=EMERALD)
        draw.text((WIDTH//2 + 50, 300), "Microgravity Aerosol Coagulation Kinetics:", font=FONT_SUBTITLE, fill=WHITE)
        draw.text((WIDTH//2 + 50, 350), "• Mass-mean diameter (d_mm) growth over 1800s\n• Geometric mean diameter (d_g) trajectories\n• Materials: Kapton, Silicone, Teflon, Lampwick\n• Segregated from Flaming Soot (SPICE PSI-107)\n• MPASS Dual-Moment Algorithm Verification", font=FONT_BODY, fill=MUTED)

    elif stype == "capcom_ai":
        # AI CapCom Assistant with Waveform
        draw.rectangle([(250, 240), (WIDTH - 250, HEIGHT - 150)], fill=CARD_BG, outline=CYAN, width=2)
        draw.text((290, 260), "AI CAPCOM ASSISTANT & LANGCHAIN SQL AGENT", font=FONT_HEADER, fill=CYAN)
        draw.text((290, 300), "Hands-Free Astronaut Voice Control with Grounded Gemini 2.5 Flash RAG", font=FONT_SUBTITLE, fill=WHITE)
        
        # Audio Waveform bars
        wx_start = 320
        for i in range(32):
            h = int(25 + 55 * math.sin(t * 8 + i * 0.4) ** 2)
            color = CYAN if i % 2 == 0 else AMBER
            draw.rectangle([(wx_start + i * 20, 420 - h//2), (wx_start + i * 20 + 12, 420 + h//2)], fill=color)

        draw.text((1020, 370), "VOICE CAPCOM ACTIVE", font=FONT_HEADER, fill=EMERALD)
        draw.text((1020, 410), "Streaming 48kHz Bidirectional Audio\nNormalized Aerospace Speech (CO2, μg, d_mm)", font=FONT_BODY, fill=MUTED)

        # SQL Agent Output box
        draw.rectangle([(290, 470), (WIDTH - 290, 580)], fill=(10, 25, 45), outline=BORDER_COLOR)
        draw.text((310, 485), "User Voice: 'What was the limiting oxygen concentration for Nomex in BASS-II?'", font=FONT_BODY, fill=WHITE)
        draw.text((310, 515), "SQL Query: SELECT loc_pct, airflow_velocity FROM test_runs WHERE fuel_material='Nomex';", font=FONT_BODY, fill=CYAN)
        draw.text((310, 545), "AI Result: [NASA observation] LOC is 18.4% at 3.2 cm/s airflow [PSI-25 / NASA-TM-20210011385, p. 42]", font=FONT_BODY, fill=EMERALD)

    elif stype == "mission_handoff":
        # Final handoff card
        draw.rectangle([(300, 240), (WIDTH - 300, HEIGHT - 150)], fill=(12, 34, 62), outline=EMERALD, width=3)
        draw.text((cx - 360, cy - 130), "MISSION READY FOR DEEP SPACE", font=get_font(48), fill=EMERALD)
        draw.text((cx - 440, cy - 50), "Protecting Astronauts Across Artemis, Lunar Gateway, and Mars", font=FONT_HEADER, fill=WHITE)
        
        # Big Launch CTA Button
        draw.rectangle([(cx - 260, cy + 30), (cx + 260, cy + 110)], fill=(16, 185, 129), outline=WHITE, width=2)
        draw.text((cx - 220, cy + 50), "INITIALIZING LIVE DEMO ──▶", font=FONT_HEADER, fill=(8, 20, 38))

def render_scene_video(scene, scene_idx, total_scenes):
    audio_file = os.path.join(AUDIO_DIR, scene["audio"])
    duration = get_audio_duration(audio_file)
    total_frames = int(duration * FPS)
    video_out = os.path.join(OUTPUT_DIR, f"{scene['id']}_visual.mp4")
    final_clip = os.path.join(OUTPUT_DIR, f"{scene['id']}.mp4")

    print(f"Rendering {scene['id']} ({duration:.2f}s, {total_frames} frames)...")

    # Use OpenCV VideoWriter
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(video_out, fourcc, FPS, (WIDTH, HEIGHT))

    for f in range(total_frames):
        t = f / FPS
        progress = f / total_frames

        # Create PIL Image
        img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
        draw = ImageDraw.Draw(img)

        # Draw HUD Chrome & Scene Contents
        draw_hud_chrome(draw, t, scene_idx, total_scenes)
        draw_scene_content(img, draw, scene, t, progress)

        # Convert to OpenCV frame
        frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        out.write(frame)

    out.release()

    # Mux with Audio using FFmpeg
    cmd = [
        FFMPEG, "-y",
        "-i", video_out,
        "-i", audio_file,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        final_clip
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(video_out):
        os.remove(video_out)
    return final_clip

def concatenate_all_clips(clip_files):
    list_file = os.path.join(OUTPUT_DIR, "concat_list.txt")
    with open(list_file, "w") as f:
        for c in clip_files:
            # write formatted absolute path for ffmpeg
            f.write(f"file '{c.replace(os.sep, '/')}'\n")

    print("Concatenating all 9 segments into final master presentation...")
    cmd = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list_file,
        "-c", "copy",
        FINAL_VIDEO
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Master presentation video successfully generated at:\n{FINAL_VIDEO}")

if __name__ == "__main__":
    rendered_clips = []
    for idx, scene in enumerate(SCENES):
        clip_path = render_scene_video(scene, idx, len(SCENES))
        rendered_clips.append(clip_path)
    concatenate_all_clips(rendered_clips)
