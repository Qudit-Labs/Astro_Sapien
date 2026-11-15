import os
import math
import subprocess
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cv2
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
BASE_DIR = r"c:\Users\laure\OneDrive\Desktop\Astro_Sapien"
IMG_DIR = os.path.join(BASE_DIR, "video_assets", "images")
AUDIO_DIR = os.path.join(BASE_DIR, "video_assets", "audio")
CLIPS_DIR = os.path.join(BASE_DIR, "video_assets", "rendered_clips")
FINAL_VIDEO = os.path.join(BASE_DIR, "video_assets", "FIRELINE_NASA_SpaceApps_Presentation.mp4")

os.makedirs(CLIPS_DIR, exist_ok=True)

WIDTH, HEIGHT = 1920, 1080
FPS = 24

# Colors
CYAN = (56, 189, 248)
AMBER = (245, 158, 11)
EMERALD = (16, 185, 129)
ROSE = (244, 63, 94)
WHITE = (248, 250, 252)
MUTED = (148, 163, 184)
NAVY_BG = (10, 22, 40)

def get_font(size):
    for name in ["segoeui.ttf", "arialbd.ttf", "arial.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except:
            continue
    return ImageFont.load_default()

FONT_HEADER = get_font(26)
FONT_BADGE = get_font(20)
FONT_SUBTITLE = get_font(26)
FONT_TELEMETRY = get_font(18)

SCENES = [
    {
        "id": "clip_01",
        "img": "scene_01.jpg",
        "audio": "clip_01_silent_peril.mp3",
        "badge": "ALERT: ZERO-G COMBUSTION ANOMALY // NO NATURAL BUOYANCY",
        "badge_color": ROSE,
        "subtitle": "In deep space, fire does not behave like it does on Earth. In microgravity, flames form silent, ghostly spheres.",
        "motion": "zoom_in"
    },
    {
        "id": "clip_02",
        "img": "scene_02.jpg",
        "audio": "clip_02_convection_paradox.mp3",
        "badge": "PHYSICS DIVERGENCE: 1g BUOYANT PLUME vs. μg VENTILATION DRIFT",
        "badge_color": AMBER,
        "subtitle": "Without gravity's natural buoyancy, hot gases hover in place. Flames crawl wherever cabin ventilation pushes them.",
        "motion": "pan_right"
    },
    {
        "id": "clip_03",
        "img": "scene_03.jpg",
        "audio": "clip_03_smoke_detector_trap.mp3",
        "badge": "DETECTOR BLIND SPOT: NANOSCALE SOOT < 100nm // NEAR-IR BLIND",
        "badge_color": ROSE,
        "subtitle": "Microgravity smoke particles remain microscopically tiny, evading traditional optical detectors until toxic levels.",
        "motion": "zoom_in"
    },
    {
        "id": "clip_04",
        "img": "scene_04.jpg",
        "audio": "clip_04_fragmented_nasa_data.mp3",
        "badge": "EMPIRICAL DATA SILOS: BASS-II • SAME-R • SAFFIRE • FLEX • SPICE",
        "badge_color": AMBER,
        "subtitle": "NASA has conducted decades of combustion research. Yet vital data sits fragmented across hundreds of disparate logs.",
        "motion": "tilt_up"
    },
    {
        "id": "clip_05",
        "img": "scene_05.jpg",
        "audio": "clip_05_introducing_fireline.mp3",
        "badge": "SYSTEM REVEAL // TEAM ASTRO_SAPIEN • NASA SPACE APPS 2026",
        "badge_color": CYAN,
        "subtitle": "Meet FIRELINE: the world's first unified, traceable fire-safety intelligence engine for human spaceflight.",
        "motion": "zoom_out"
    },
    {
        "id": "clip_06",
        "img": "scene_06.jpg",
        "audio": "clip_06_psi_evidence_loc.mp3",
        "badge": "LOC FLAMMABILITY ENGINE: 1,077 TEST RUNS • 6,287 MEASUREMENTS",
        "badge_color": EMERALD,
        "subtitle": "Connecting to real NASA flight runs, FIRELINE computes limiting oxygen thresholds and flame spread rates with exact citations.",
        "motion": "pan_left"
    },
    {
        "id": "clip_07",
        "img": "scene_07.jpg",
        "audio": "clip_07_testmatch_smokewise.mp3",
        "badge": "SCALE GUARD: TESTMATCH COMPARABILITY & SMOKEWISE KINETICS",
        "badge_color": AMBER,
        "subtitle": "Its TESTMATCH engine mathematically prevents scale errors, while SMOKEwise models true aerosol aging and detector triggers.",
        "motion": "zoom_in"
    },
    {
        "id": "clip_08",
        "img": "scene_08.jpg",
        "audio": "clip_08_gemini_capcom_sql.mp3",
        "badge": "AI CAPCOM VOICE ASSISTANT & LANGCHAIN SUPABASE SQL AGENT",
        "badge_color": CYAN,
        "subtitle": "Powered by Gemini Flash, LangChain conversational SQL, and CapCom Voice AI, astronauts get instant, verified answers.",
        "motion": "tracking"
    },
    {
        "id": "clip_09",
        "img": "scene_09.jpg",
        "audio": "clip_09_artemis_mars_handoff.mp3",
        "badge": "MISSION READY: ARTEMIS • LUNAR GATEWAY • MARS HABITATS",
        "badge_color": EMERALD,
        "subtitle": "From Low Earth Orbit to the Artemis Moon Base and crewed missions to Mars... here is FIRELINE in action.",
        "motion": "zoom_in"
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

# Generate 50 persistent particles with random seeds
random.seed(42)
PARTICLES = [
    {
        "x": random.uniform(0, WIDTH),
        "y": random.uniform(0, HEIGHT),
        "vx": random.uniform(-0.6, 0.6),
        "vy": random.uniform(-0.8, -0.2),
        "size": random.randint(2, 5),
        "alpha": random.randint(80, 200),
        "color": random.choice([CYAN, AMBER, (200, 230, 255)])
    }
    for _ in range(50)
]

def apply_ken_burns(base_img_np, motion, progress):
    h, w, _ = base_img_np.shape
    # Calculate crop window based on motion type
    if motion == "zoom_in":
        scale = 1.0 + 0.14 * progress
        cw, ch = int(w / scale), int(h / scale)
        cx, cy = w // 2, h // 2
    elif motion == "zoom_out":
        scale = 1.14 - 0.14 * progress
        cw, ch = int(w / scale), int(h / scale)
        cx, cy = w // 2, h // 2
    elif motion == "pan_right":
        scale = 1.12
        cw, ch = int(w / scale), int(h / scale)
        cx = int(cw // 2 + (w - cw) * (0.2 + 0.6 * progress))
        cy = h // 2
    elif motion == "pan_left":
        scale = 1.12
        cw, ch = int(w / scale), int(h / scale)
        cx = int(cw // 2 + (w - cw) * (0.8 - 0.6 * progress))
        cy = h // 2
    elif motion == "tilt_up":
        scale = 1.12
        cw, ch = int(w / scale), int(h / scale)
        cx = w // 2
        cy = int(ch // 2 + (h - ch) * (0.75 - 0.5 * progress))
    else:  # tracking
        scale = 1.08 + 0.05 * math.sin(progress * math.pi)
        cw, ch = int(w / scale), int(h / scale)
        cx = int(w // 2 + 30 * math.sin(progress * 2 * math.pi))
        cy = int(h // 2 + 15 * math.cos(progress * 2 * math.pi))

    x1 = max(0, cx - cw // 2)
    y1 = max(0, cy - ch // 2)
    x2 = min(w, x1 + cw)
    y2 = min(h, y1 + ch)

    crop = base_img_np[y1:y2, x1:x2]
    resized = cv2.resize(crop, (WIDTH, HEIGHT), interpolation=cv2.INTER_CUBIC)
    return resized

def render_scene(scene, scene_idx, total_scenes):
    audio_path = os.path.join(AUDIO_DIR, scene["audio"])
    duration = get_audio_duration(audio_path)
    total_frames = int(duration * FPS)

    img_path = os.path.join(IMG_DIR, scene["img"])
    base_img = cv2.imread(img_path)
    if base_img is None:
        raise FileNotFoundError(f"Missing {img_path}")
    base_img_rgb = cv2.cvtColor(base_img, cv2.COLOR_BGR2RGB)

    video_raw = os.path.join(CLIPS_DIR, f"{scene['id']}_raw.mp4")
    final_clip = os.path.join(CLIPS_DIR, f"{scene['id']}.mp4")

    print(f"🎬 Rendering {scene['id']} ({duration:.2f}s, {total_frames} frames, {scene['motion']})...")

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(video_raw, fourcc, FPS, (WIDTH, HEIGHT))

    for f in range(total_frames):
        t = f / FPS
        progress = f / total_frames

        # 1. Ken Burns background frame
        frame_rgb = apply_ken_burns(base_img_rgb, scene["motion"], progress)

        # 2. Subtle Vignette
        mask_x = np.linspace(-1, 1, WIDTH)
        mask_y = np.linspace(-1, 1, HEIGHT)
        X, Y = np.meshgrid(mask_x, mask_y)
        dist = np.sqrt(X**2 + Y**2)
        vignette = np.clip(1.0 - 0.45 * (dist**1.8), 0.35, 1.0)
        frame_rgb = (frame_rgb * vignette[:, :, np.newaxis]).astype(np.uint8)

        # Convert to PIL for crisp typography & HUD overlays
        pil_frame = Image.fromarray(frame_rgb)
        draw = ImageDraw.Draw(pil_frame, "RGBA")

        # 3. Floating Zero-G Particles
        for p in PARTICLES:
            px = int((p["x"] + p["vx"] * f * 1.5) % WIDTH)
            py = int((p["y"] + p["vy"] * f * 1.5) % HEIGHT)
            col = p["color"]
            draw.ellipse(
                [(px - p["size"], py - p["size"]), (px + p["size"], py + p["size"])],
                fill=(col[0], col[1], col[2], p["alpha"])
            )

        # 4. Top Telemetry Banner (Glassmorphism)
        draw.rectangle([(0, 0), (WIDTH, 75)], fill=(10, 22, 40, 210))
        draw.line([(0, 75), (WIDTH, 75)], fill=(56, 189, 248, 180), width=2)
        
        # NASA Space Apps & Mission Tags
        draw.text((45, 22), "NASA SPACE APPS 2026", font=FONT_HEADER, fill=CYAN)
        draw.text((385, 25), "|  TEAM ASTRO_SAPIEN", font=FONT_TELEMETRY, fill=WHITE)
        draw.text((630, 25), "|  PROJECT: FIRELINE v2.0", font=FONT_TELEMETRY, fill=EMERALD)
        
        timecode = f"MET +00:{scene_idx*10 + int(t):02d}:{int((t % 1)*FPS):02d}"
        draw.text((WIDTH - 440, 22), timecode, font=FONT_HEADER, fill=AMBER)
        draw.text((WIDTH - 190, 25), "ISS LEO [μg]", font=FONT_TELEMETRY, fill=CYAN)

        # 5. Holographic Corner Brackets
        margin = 35
        blen = 30
        bcol = (56, 189, 248, 160)
        # Top-left
        draw.line([(margin, 95), (margin + blen, 95)], fill=bcol, width=2)
        draw.line([(margin, 95), (margin, 95 + blen)], fill=bcol, width=2)
        # Top-right
        draw.line([(WIDTH - margin, 95), (WIDTH - margin - blen, 95)], fill=bcol, width=2)
        draw.line([(WIDTH - margin, 95), (WIDTH - margin, 95 + blen)], fill=bcol, width=2)
        # Bottom-left
        draw.line([(margin, HEIGHT - 125), (margin + blen, HEIGHT - 125)], fill=bcol, width=2)
        draw.line([(margin, HEIGHT - 125), (margin, HEIGHT - 125 - blen)], fill=bcol, width=2)
        # Bottom-right
        draw.line([(WIDTH - margin, HEIGHT - 125), (WIDTH - margin - blen, HEIGHT - 125)], fill=bcol, width=2)
        draw.line([(WIDTH - margin, HEIGHT - 125), (WIDTH - margin, HEIGHT - 125 - blen)], fill=bcol, width=2)

        # 6. Upper Holographic Alert Badge
        bcol = scene["badge_color"]
        btext = scene["badge"]
        bbox = draw.textbbox((0, 0), btext, font=FONT_BADGE)
        bw = bbox[2] - bbox[0]
        bx1 = WIDTH // 2 - bw // 2 - 25
        bx2 = WIDTH // 2 + bw // 2 + 25
        draw.rectangle([(bx1, 98), (bx2, 140)], fill=(10, 22, 40, 220), outline=bcol, width=2)
        draw.text((WIDTH // 2 - bw // 2, 108), btext, font=FONT_BADGE, fill=bcol)

        # 7. Scene 8 Special: Dynamic CapCom Audio Spectrum Analyzer
        if scene["id"] == "clip_08":
            aw_cx = WIDTH // 2
            aw_y = 200
            num_bars = 42
            bar_w = 12
            spacing = 7
            total_w = num_bars * (bar_w + spacing)
            start_x = aw_cx - total_w // 2
            for bi in range(num_bars):
                phase = bi * 0.35 + t * 9
                h = int(12 + 55 * (math.sin(phase) ** 2))
                col = CYAN if bi % 2 == 0 else AMBER
                draw.rectangle(
                    [(start_x + bi * (bar_w + spacing), aw_y - h), (start_x + bi * (bar_w + spacing) + bar_w, aw_y + h)],
                    fill=(col[0], col[1], col[2], 220)
                )

        # 8. Bottom Subtitle Glassmorphism Banner
        draw.rectangle([(120, HEIGHT - 105), (WIDTH - 120, HEIGHT - 25)], fill=(8, 18, 34, 230), outline=(56, 189, 248, 160), width=2)
        sub_text = scene["subtitle"]
        sbox = draw.textbbox((0, 0), sub_text, font=FONT_SUBTITLE)
        sw = sbox[2] - sbox[0]
        draw.text((WIDTH // 2 - sw // 2, HEIGHT - 78), sub_text, font=FONT_SUBTITLE, fill=WHITE)

        # Output frame
        final_bgr = cv2.cvtColor(np.array(pil_frame), cv2.COLOR_RGB2BGR)
        writer.write(final_bgr)

    writer.release()

    # Mux with Audio using FFmpeg
    cmd = [
        FFMPEG, "-y",
        "-i", video_raw,
        "-i", audio_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_clip
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(video_raw):
        os.remove(video_raw)
    return final_clip

def concatenate_all(clips):
    list_path = os.path.join(CLIPS_DIR, "concat_master.txt")
    with open(list_path, "w") as f:
        for c in clips:
            f.write(f"file '{c.replace(os.sep, '/')}'\n")

    print("\n🚀 Stitching all 9 cinematic segments into master video...")
    cmd = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list_path,
        "-c", "copy",
        FINAL_VIDEO
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"✨ Master video ready at: {FINAL_VIDEO}")

if __name__ == "__main__":
    rendered = []
    for idx, scene in enumerate(SCENES):
        clip = render_scene(scene, idx, len(SCENES))
        rendered.append(clip)
    concatenate_all(rendered)
