import csv
import re
from pathlib import Path
import openpyxl
from app.database.connection import get_connection

PI_FLOW_MAP = {
    "Bhattacharjee": "opposed",
    "Fernandez-Pello": "opposed",
    "Olson": "concurrent_stagnation",
    "T'ien": "concurrent",
    "Miller": "opposed",
    "Ferkul": "forced_flow",
}

MILLER_TABLE_5_1 = [
    {"code": "M1", "thick_mm": 1.0, "width_mm": 22.0, "sides": 1, "vel_cm_s": 9.0, "spread_mm_s": 0.071, "o2_init": 22.2, "o2_final": 21.9, "burn_min": 6.4},
    {"code": "M2", "thick_mm": 3.0, "width_mm": 22.0, "sides": 1, "vel_cm_s": 20.0, "spread_mm_s": 0.052, "o2_init": 22.2, "o2_final": 21.2, "burn_min": 22.9},
    {"code": "M3", "thick_mm": 5.0, "width_mm": 22.0, "sides": 1, "vel_cm_s": 10.0, "spread_mm_s": 0.029, "o2_init": 20.8, "o2_final": 19.7, "burn_min": 20.1},
    {"code": "M4", "thick_mm": 5.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 5.0, "spread_mm_s": 0.045, "o2_init": 21.8, "o2_final": 19.8, "burn_min": 19.8},
    {"code": "M5", "thick_mm": 3.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 10.0, "spread_mm_s": 0.071, "o2_init": 22.2, "o2_final": 19.0, "burn_min": 27.2},
    {"code": "M6", "thick_mm": 1.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 10.0, "spread_mm_s": None, "o2_init": 21.8, "o2_final": 20.7, "burn_min": 16.8},
    {"code": "M7", "thick_mm": 1.0, "width_mm": 12.0, "sides": 2, "vel_cm_s": 10.0, "spread_mm_s": 0.106, "o2_init": 18.9, "o2_final": 18.4, "burn_min": 18.4},
    {"code": "M8", "thick_mm": 2.0, "width_mm": 12.0, "sides": 2, "vel_cm_s": 10.0, "spread_mm_s": 0.057, "o2_init": 19.1, "o2_final": 18.2, "burn_min": 25.2},
    {"code": "M9", "thick_mm": 3.0, "width_mm": 12.0, "sides": 2, "vel_cm_s": 14.0, "spread_mm_s": 0.025, "o2_init": 18.0, "o2_final": 17.6, "burn_min": 16.8},
    {"code": "M10", "thick_mm": 4.0, "width_mm": 12.0, "sides": 2, "vel_cm_s": 15.0, "spread_mm_s": 0.0373, "o2_init": 20.1, "o2_final": 18.6, "burn_min": 30.5},
    {"code": "M11", "thick_mm": 5.0, "width_mm": 12.0, "sides": 2, "vel_cm_s": 21.0, "spread_mm_s": 0.048, "o2_init": 20.0, "o2_final": 18.5, "burn_min": 28.5},
    {"code": "M12", "thick_mm": 2.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 12.0, "spread_mm_s": None, "o2_init": 21.7, "o2_final": 20.4, "burn_min": 16.2},
    {"code": "M13", "thick_mm": 4.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 6.0, "spread_mm_s": 0.047, "o2_init": 20.8, "o2_final": 19.0, "burn_min": 20.5},
    {"code": "M14", "thick_mm": 2.0, "width_mm": 22.0, "sides": 1, "vel_cm_s": 15.0, "spread_mm_s": 0.0624, "o2_init": 22.2, "o2_final": 21.6, "burn_min": 15.4},
    {"code": "M15", "thick_mm": 4.0, "width_mm": 22.0, "sides": 1, "vel_cm_s": 20.0, "spread_mm_s": 0.045, "o2_init": 21.0, "o2_final": 20.0, "burn_min": 22.0},
    {"code": "M16", "thick_mm": 1.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 5.0, "spread_mm_s": 0.144, "o2_init": 19.2, "o2_final": 18.7, "burn_min": 8.4},
    {"code": "M17", "thick_mm": 2.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 5.0, "spread_mm_s": 0.053, "o2_init": 18.8, "o2_final": 17.1, "burn_min": 30.7},
    {"code": "M18", "thick_mm": 3.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 10.0, "spread_mm_s": 0.026, "o2_init": 17.9, "o2_final": 16.8, "burn_min": 25.5},
    {"code": "M19", "thick_mm": 4.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 10.0, "spread_mm_s": 0.027, "o2_init": 19.0, "o2_final": 17.4, "burn_min": 25.7},
    {"code": "M20", "thick_mm": 5.0, "width_mm": 22.0, "sides": 2, "vel_cm_s": 10.0, "spread_mm_s": 0.012, "o2_init": 18.0, "o2_final": 17.4, "burn_min": 16.5},
]

TIEN_TABLE_7_1 = [
    {"code": "GMT45-T1", "width_mm": 22.0, "flow_cm_s": 10.0, "o2_vol": 18.5, "comments": "steady burning"},
    {"code": "GMT45-T2", "width_mm": 22.0, "flow_cm_s": 10.0, "o2_vol": 18.5, "comments": "10 to 5 cm/s flow"},
    {"code": "GMT45-T4", "width_mm": 22.0, "flow_cm_s": 10.0, "o2_vol": 18.7, "comments": "Quenched at 2.2 cm/s"},
    {"code": "GMT45-T15", "width_mm": 22.0, "flow_cm_s": 29.0, "o2_vol": 18.7, "comments": "No blowoff up to 29 cm/s"},
    {"code": "GMT100-T5", "width_mm": 22.0, "flow_cm_s": 10.0, "o2_vol": 18.8, "comments": "10 to 2.4 cm/s"},
    {"code": "GMT100-T6", "width_mm": 22.0, "flow_cm_s": 4.5, "o2_vol": 18.8, "comments": "4.5 to 2.6 cm/s"},
    {"code": "GMT100-T13", "width_mm": 22.0, "flow_cm_s": 4.0, "o2_vol": 17.5, "comments": "Quenched at 2.2 cm/s"},
    {"code": "GMT100-T16", "width_mm": 22.0, "flow_cm_s": 4.0, "o2_vol": 17.6, "comments": "4 to 3 cm/s"},
    {"code": "GMT175-T9", "width_mm": 22.0, "flow_cm_s": 10.0, "o2_vol": 16.4, "comments": "No ignition at 16.4% O2"},
    {"code": "GMT175-T10", "width_mm": 22.0, "flow_cm_s": 5.0, "o2_vol": 16.4, "comments": "No ignition at 16.4% O2"},
    {"code": "GMT175-T18", "width_mm": 22.0, "flow_cm_s": 5.0, "o2_vol": 17.4, "comments": "Quenched at 2.6 cm/s"},
    {"code": "GMT178-T11", "width_mm": 22.0, "flow_cm_s": 4.0, "o2_vol": 17.1, "comments": "steady burn at 4 cm/s"},
    {"code": "GMT178-T12", "width_mm": 22.0, "flow_cm_s": 5.0, "o2_vol": 16.8, "comments": "No ignition at 16.8% O2"},
    {"code": "GMT178-T14", "width_mm": 22.0, "flow_cm_s": 4.0, "o2_vol": 16.9, "comments": "Quenched at 2.8 cm/s"},
    {"code": "GMT178-T17", "width_mm": 22.0, "flow_cm_s": 53.0, "o2_vol": 16.9, "comments": "No blowoff up to 53 cm/s"},
    {"code": "GMT190-T19", "width_mm": 12.0, "flow_cm_s": 11.0, "o2_vol": 17.2, "comments": "narrow sample steady burn"},
    {"code": "GMT190-T20", "width_mm": 12.0, "flow_cm_s": 11.0, "o2_vol": 17.2, "comments": "Quenched at 3 cm/s"},
    {"code": "GMT190-T21", "width_mm": 12.0, "flow_cm_s": 47.0, "o2_vol": 17.2, "comments": "Blow-off extinction at 47 cm/s"},
    {"code": "GMT190-T22", "width_mm": 12.0, "flow_cm_s": 10.5, "o2_vol": 17.1, "comments": "Quenched at 5 cm/s"},
    {"code": "GMT190-T23", "width_mm": 22.0, "flow_cm_s": 10.0, "o2_vol": 17.2, "comments": "Reused sample, did not ignite"},
    {"code": "GMT190-T24", "width_mm": 22.0, "flow_cm_s": 10.0, "o2_vol": 18.2, "comments": "Reused sample, one-sided flame"},
    {"code": "GMT216-T25", "width_mm": 22.0, "flow_cm_s": 5.0, "o2_vol": 20.8, "comments": "Reused, ignited, quenched at 2.5 cm/s"},
    {"code": "GMT216-T26", "width_mm": 22.0, "flow_cm_s": 5.0, "o2_vol": 20.8, "comments": "Reused, ignited, quenched at 2.5 cm/s"},
    {"code": "GMT216-T27", "width_mm": 12.0, "flow_cm_s": 5.0, "o2_vol": 20.7, "comments": "Reused, ignited, quenched at 2 cm/s"},
    {"code": "GMT216-T28a", "width_mm": 12.0, "flow_cm_s": 5.0, "o2_vol": 20.7, "comments": "Reused, did not ignite"},
    {"code": "GMT216-T28b", "width_mm": 12.0, "flow_cm_s": 5.0, "o2_vol": 20.7, "comments": "Reused, did not ignite"},
    {"code": "GMT216-T29", "width_mm": 12.0, "flow_cm_s": 5.0, "o2_vol": 20.7, "comments": "Reused, ignited, quenched at 2 cm/s"},
]


def parse_material(raw: str, pi: str) -> dict:
    s = " ".join(str(raw).strip().split())
    sl = s.lower()

    if "sibal" in sl:
        mat, grade = "SIBAL", "75/25 cotton-fiberglass"
    elif "nomex" in sl:
        mat, grade = "Nomex III", "natural"
    elif "wax" in sl or "candle" in sl:
        mat, grade = "Japan Wax", "wick_candle"
    else:
        mat = "PMMA"
        grade = "black" if ("black" in sl or "blac" in sl) else ("clear" if "clear" in sl else None)

    if "rod" in sl:
        geom = "rod"
    elif "spher" in sl:
        geom = "spherical_section"
    elif "slab" in sl or "sided" in sl or "2ide" in sl or re.search(r"\b[1-5]\s*mm\b", sl):
        geom = "slab" if ("slab" in sl or "sided" in sl or "2ide" in sl or "wide" in sl) else "film"
    elif "film" in sl or "micron" in sl:
        geom = "film"
    elif "sibal" in sl or "nomex" in sl:
        geom = "fabric"
    elif "candle" in sl:
        geom = "candle"
    else:
        geom = "unknown"

    if mat == "PMMA" and geom == "slab" and "film" in sl:
        geom = "film"

    thickness_mm = None
    m_mic = re.search(r"(\d+(?:\.\d+)?)\s*micron", sl)
    if m_mic:
        thickness_mm = round(float(m_mic.group(1)) / 1000.0, 4)
    else:
        m_mm_thick = re.search(r"(\d+(?:\.\d+)?)\s*mm(?:\s*thick)?", sl)
        if m_mm_thick and geom in ("film", "slab"):
            thickness_mm = float(m_mm_thick.group(1))

    width_mm = None
    m_cm_wide = re.search(r"(\d+(?:\.\d+)?)\s*cm(?:\s*(?:wide|sibal|2ide|thick))?", sl)
    if m_cm_wide and geom in ("film", "slab", "fabric"):
        width_mm = float(m_cm_wide.group(1)) * 10.0

    diameter_mm = None
    if geom == "rod":
        if "1/4" in sl:
            diameter_mm = 6.35
        elif "3/8" in sl:
            diameter_mm = 9.525
        elif "1/2" in sl or "0.5" in sl:
            diameter_mm = 12.7
    elif geom == "spherical_section":
        m_sph = re.search(r"(\d+(?:\.\d+)?)\s*cm", sl)
        if m_sph:
            diameter_mm = float(m_sph.group(1)) * 10.0

    burn_sides = 1 if ("1 sided" in sl) else (2 if ("2 sided" in sl or "2ide" in sl) else None)

    return {
        "material_normalized": mat,
        "color_or_grade": grade,
        "geometry": geom,
        "thickness_mm": thickness_mm,
        "width_mm": width_mm,
        "diameter_mm": diameter_mm,
        "burn_sides": burn_sides,
    }


def parse_gas_value(raw_val, param: str) -> tuple[float | None, str]:
    if raw_val is None:
        return None, "not_reported"
    s = str(raw_val).strip()
    if s.lower() in ("", "none", "nan", "n/a"):
        return None, "not_reported"
    if s.upper() in ("OR", "OVER") or "OR" in s.upper():
        return 1000.0, "over_range"
    if s.startswith(">"):
        try:
            return float(s[1:]), "over_range"
        except ValueError:
            return 1000.0, "over_range"

    try:
        val = float(s)
    except ValueError:
        return None, "not_reported"

    if "co" in param and val < 0:
        return val, "suspect"
    if param == "o2_final_pct" and val < 10.0:
        return val, "suspect"
    return val, "recorded"


def parse_airflow_trajectory(raw_air) -> tuple[float | None, float | None, str]:
    if raw_air is None:
        return None, None, "not_reported"
    s = str(raw_air).strip().lower()
    if s in ("", "none", "nan"):
        return None, None, "not_reported"

    ext_mode = "blowoff" if "blowoff" in s else ("low_flow_extinction" if "ext" in s else "not_reported")
    nums = [float(x) for x in re.findall(r"(?<![a-z0-9.])\d+(?:\.\d+)?", s)]
    if not nums:
        return None, None, ext_mode
    return nums[0], nums[-1], ext_mode


def get_fan_calibration_map(xlsx_path: Path) -> dict:
    cal_map = {}
    if not xlsx_path.exists():
        return cal_map

    try:
        wb = openpyxl.load_workbook(xlsx_path, data_only=True)
        if "Fan Calibration data" in wb.sheetnames:
            ws = wb["Fan Calibration data"]
            rows = list(ws.iter_rows(values_only=True))
            # rows 7-13 are restrictor 0
            for r in rows[6:13]:
                if len(r) >= 5 and r[1] is not None and r[4] is not None:
                    try:
                        cal_map[(0, float(r[1]))] = float(r[4])
                    except (ValueError, TypeError):
                        pass
            # rows 16-22 are restrictor 1
            for r in rows[15:22]:
                if len(r) >= 5 and r[1] is not None and r[4] is not None:
                    try:
                        cal_map[(1, float(r[1]))] = float(r[4])
                    except (ValueError, TypeError):
                        pass
            # rows 25-32 are restrictor 2
            for r in rows[24:32]:
                if len(r) >= 5 and r[1] is not None and r[4] is not None:
                    try:
                        cal_map[(2, float(r[1]))] = float(r[4])
                    except (ValueError, TypeError):
                        pass
    except Exception:
        pass
    return cal_map


def ingest_bass2(csv_path: Path, raw_dir: Path, conn_str: str | None = None) -> int:
    source_id = "NASA-PSI-25-EXP-TABLE"
    fan_cal_path = raw_dir / "BASS-II_Fan_calibration_data.xlsx"
    if not fan_cal_path.exists():
        fan_cal_path = raw_dir / "Fan calibration data.xlsx"
    fan_cal = get_fan_calibration_map(fan_cal_path)

    with get_connection(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO investigations (id, psi_id, title, pillar, doi, url, facility, summary)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    pillar = EXCLUDED.pillar,
                    summary = EXCLUDED.summary;
                """,
                (
                    "BASS-II",
                    "PSI-25",
                    "Burning and Suppression of Solids - II (BASS-II)",
                    "prevention",
                    "10.60555/4qc4-de67",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
                    "ISS Microgravity Science Glovebox (MSG) 7.6x7.6x17 cm flow duct",
                    "Microgravity solid-fuel ignition, flame spread, radiative quenching, and blowoff extinction across PMMA films, slabs, rods, spheres, SIBAL fabric, and Nomex III.",
                ),
            )

            # Ingest 129 runs from CSV
            with open(csv_path, mode="r", encoding="utf-8-sig", errors="replace") as f:
                reader = csv.DictReader(f)
                cleaned_rows = []
                for row in reader:
                    cleaned_rows.append({ " ".join(k.strip().split()): v for k, v in row.items() if k })

            cur.execute(
                """
                INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    page_or_row_count = EXCLUDED.page_or_row_count;
                """,
                (
                    source_id,
                    "BASS-II",
                    "PSI-25",
                    "BASS-II Experimental Test Table (129 ISS Runs)",
                    csv_path.name,
                    "10.60555/4qc4-de67",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
                    "csv",
                    len(cleaned_rows),
                ),
            )

            inserted = 0
            for idx, row in enumerate(cleaned_rows, start=1):
                pi = str(row.get("PI", "")).strip()
                test_code = str(row.get("Test #", "")).strip()
                run_id = f"PSI-25:{test_code}"
                mat_raw = str(row.get("Fuel Sample Material", "")).strip()
                mat_info = parse_material(mat_raw, pi)
                air_init, air_final, ext_mode = parse_airflow_trajectory(row.get("Air display"))

                flow_res = None
                try:
                    flow_res = int(float(row.get("Flow restrictor", 0)))
                except (ValueError, TypeError):
                    pass

                fan_disp = None
                try:
                    fan_disp = float(row.get("Fan display", 0))
                except (ValueError, TypeError):
                    pass

                cur.execute(
                    """
                    INSERT INTO test_runs (
                        id, investigation_id, test_code, pi_name, test_date, gmt_day, sample_code,
                        flow_regime, material_raw, material_normalized, color_or_grade, geometry,
                        thickness_mm, width_mm, diameter_mm, burn_sides, flow_restrictor,
                        extinction_mode, aging_state, gravity_regime, raw_row_index, source_id, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        material_normalized = EXCLUDED.material_normalized,
                        geometry = EXCLUDED.geometry,
                        thickness_mm = EXCLUDED.thickness_mm,
                        width_mm = EXCLUDED.width_mm,
                        extinction_mode = EXCLUDED.extinction_mode,
                        notes = EXCLUDED.notes;
                    """,
                    (
                        run_id,
                        "BASS-II",
                        test_code,
                        pi,
                        str(row.get("Date", "")).strip(),
                        int(float(row.get("GMT", 0))) if row.get("GMT") else None,
                        str(row.get("Sample #", "")).strip(),
                        PI_FLOW_MAP.get(pi, "forced_flow"),
                        mat_raw,
                        mat_info["material_normalized"],
                        mat_info["color_or_grade"],
                        mat_info["geometry"],
                        mat_info["thickness_mm"],
                        mat_info["width_mm"],
                        mat_info["diameter_mm"],
                        mat_info["burn_sides"],
                        flow_res,
                        ext_mode,
                        "n/a",
                        "microgravity",
                        idx + 1,
                        source_id,
                        f"Fan display: {row.get('Fan display')} | Air display: {row.get('Air display')}",
                    ),
                )

                cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                meas_rows = []

                if air_init is not None:
                    meas_rows.append((run_id, "airflow_initial_cm_s", str(row.get("Air display")), air_init, "cm/s", "recorded"))
                if air_final is not None:
                    meas_rows.append((run_id, "airflow_final_cm_s", str(row.get("Air display")), air_final, "cm/s", "recorded"))

                # Check calibrated fan airflow from spreadsheet
                if flow_res is not None and fan_disp is not None and (flow_res, fan_disp) in fan_cal:
                    u_cal = fan_cal[(flow_res, fan_disp)]
                    meas_rows.append((run_id, "airflow_calibrated_cm_s", str(u_cal), u_cal, "cm/s", "recorded"))

                raw_frames = row.get("Total Frames Shot")
                if raw_frames and str(raw_frames).strip().lower() not in ("", "none", "nan"):
                    try:
                        meas_rows.append((run_id, "total_frames_shot", str(raw_frames), float(str(raw_frames).strip()), "frames", "recorded"))
                    except ValueError:
                        meas_rows.append((run_id, "total_frames_shot", str(raw_frames), None, "frames", "not_reported"))

                gas_map = [
                    ("o2_initial_pct", "Calibrated  initial O2 % by vol", "% vol"),
                    ("o2_final_pct", "Calibrated final O2 % by vol", "% vol"),
                    ("co2_initial_pct", "Initial CO2 % by vol", "% vol"),
                    ("co2_final_pct", "Final CO2 % by vol", "% vol"),
                    ("co_initial_ppm", "Initial CO (ppm)", "ppm"),
                    ("co_final_ppm", "Final CO (ppm)", "ppm"),
                ]
                for param, col_name, unit in gas_map:
                    raw_v = row.get(col_name)
                    norm_v, status = parse_gas_value(raw_v, param)
                    # B2 anomaly check: 1.6% final O2 in B2 is suspect
                    if test_code == "B2" and param == "o2_final_pct":
                        status = "suspect"
                    meas_rows.append((run_id, param, str(raw_v) if raw_v is not None else None, norm_v, unit, status))

                for m in meas_rows:
                    cur.execute(
                        """
                        INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
                        VALUES (%s, %s, %s, %s, %s, %s);
                        """,
                        m,
                    )
                inserted += 1

            # Ingest Miller Table 5.1 runs from TM-20210011385
            miller_source_id = "NASA-TM-20210011385-TBL-5-1"
            cur.execute(
                """
                INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    page_or_row_count = EXCLUDED.page_or_row_count;
                """,
                (
                    miller_source_id,
                    "BASS-II",
                    "PSI-25",
                    "Miller PMMA Slab Spread Rates (TM-20210011385 Table 5.1)",
                    "TM-20210011385.pdf",
                    "10.60555/4qc4-de67",
                    "https://ntrs.nasa.gov/citations/20210011385",
                    "pdf",
                    len(MILLER_TABLE_5_1),
                ),
            )
            for idx, m_row in enumerate(MILLER_TABLE_5_1, start=1):
                run_id = f"PSI-25:TBL5.1-{m_row['code']}"
                cur.execute(
                    """
                    INSERT INTO test_runs (
                        id, investigation_id, test_code, pi_name, test_date, gmt_day, sample_code,
                        flow_regime, material_raw, material_normalized, color_or_grade, geometry,
                        thickness_mm, width_mm, diameter_mm, burn_sides, flow_restrictor,
                        extinction_mode, aging_state, gravity_regime, raw_row_index, source_id, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        material_normalized = EXCLUDED.material_normalized,
                        thickness_mm = EXCLUDED.thickness_mm,
                        width_mm = EXCLUDED.width_mm;
                    """,
                    (
                        run_id,
                        "BASS-II",
                        m_row["code"],
                        "Miller",
                        "2014",
                        None,
                        f"PMMA-SLAB-{m_row['code']}",
                        "opposed",
                        f"PMMA slab {m_row['thick_mm']}mm x {m_row['width_mm']}mm",
                        "PMMA",
                        "clear",
                        "slab",
                        m_row["thick_mm"],
                        m_row["width_mm"],
                        None,
                        m_row["sides"],
                        None,
                        "steady_spread",
                        "n/a",
                        "microgravity",
                        idx,
                        miller_source_id,
                        f"Table 5.1, p. 57: burn time {m_row['burn_min']} min",
                    ),
                )
                cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                m_meas = [
                    (run_id, "airflow_velocity_cm_s", str(m_row["vel_cm_s"]), m_row["vel_cm_s"], "cm/s", "recorded"),
                    (run_id, "o2_initial_pct", str(m_row["o2_init"]), m_row["o2_init"], "% vol", "recorded"),
                    (run_id, "o2_final_pct", str(m_row["o2_final"]), m_row["o2_final"], "% vol", "recorded"),
                    (run_id, "burn_duration_min", str(m_row["burn_min"]), m_row["burn_min"], "min", "recorded"),
                ]
                if m_row["spread_mm_s"] is not None:
                    m_meas.append((run_id, "flame_spread_rate_mm_s", str(m_row["spread_mm_s"]), m_row["spread_mm_s"], "mm/s", "recorded"))
                for mm in m_meas:
                    cur.execute(
                        """
                        INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
                        VALUES (%s, %s, %s, %s, %s, %s);
                        """,
                        mm,
                    )
                inserted += 1

            # Ingest T'ien Table 7.1 runs from TM-20210011385
            tien_source_id = "NASA-TM-20210011385-TBL-7-1"
            cur.execute(
                """
                INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    page_or_row_count = EXCLUDED.page_or_row_count;
                """,
                (
                    tien_source_id,
                    "BASS-II",
                    "PSI-25",
                    "T'ien SIBAL Fabric Concurrent Runs (TM-20210011385 Table 7.1)",
                    "TM-20210011385.pdf",
                    "10.60555/4qc4-de67",
                    "https://ntrs.nasa.gov/citations/20210011385",
                    "pdf",
                    len(TIEN_TABLE_7_1),
                ),
            )
            for idx, t_row in enumerate(TIEN_TABLE_7_1, start=1):
                run_id = f"PSI-25:TBL7.1-{t_row['code']}"
                ext_mode = "quenched" if "Quenched" in t_row["comments"] else ("blowoff" if "Blow-off" in t_row["comments"] else "steady_burn")
                cur.execute(
                    """
                    INSERT INTO test_runs (
                        id, investigation_id, test_code, pi_name, test_date, gmt_day, sample_code,
                        flow_regime, material_raw, material_normalized, color_or_grade, geometry,
                        thickness_mm, width_mm, diameter_mm, burn_sides, flow_restrictor,
                        extinction_mode, aging_state, gravity_regime, raw_row_index, source_id, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        material_normalized = EXCLUDED.material_normalized,
                        width_mm = EXCLUDED.width_mm,
                        extinction_mode = EXCLUDED.extinction_mode;
                    """,
                    (
                        run_id,
                        "BASS-II",
                        t_row["code"],
                        "T'ien",
                        "2014",
                        None,
                        "SIBAL-FABRIC",
                        "concurrent",
                        "SIBAL fabric 75/25 cotton-fiberglass",
                        "SIBAL",
                        "75/25 cotton-fiberglass",
                        "fabric",
                        0.37,
                        t_row["width_mm"],
                        None,
                        2,
                        None,
                        ext_mode,
                        "n/a",
                        "microgravity",
                        idx,
                        tien_source_id,
                        f"Table 7.1, p. 96: {t_row['comments']}",
                    ),
                )
                cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                t_meas = [
                    (run_id, "airflow_velocity_cm_s", str(t_row["flow_cm_s"]), t_row["flow_cm_s"], "cm/s", "recorded"),
                    (run_id, "o2_vol_pct", str(t_row["o2_vol"]), t_row["o2_vol"], "% vol", "recorded"),
                ]
                for tm in t_meas:
                    cur.execute(
                        """
                        INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
                        VALUES (%s, %s, %s, %s, %s, %s);
                        """,
                        tm,
                    )
                inserted += 1

        conn.commit()
    return inserted
