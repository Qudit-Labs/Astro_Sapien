import csv
import re
from pathlib import Path
from pypdf import PdfReader
from app.database.connection import get_connection


def _clean_num(val) -> float | None:
    if val is None:
        return None
    s = str(val).strip()
    if not s or s.lower() in ("none", "nan", "n/a", "~"):
        return None
    s = s.replace("~", "").replace("cm/s", "").replace("mm", "").replace("cm", "").replace("W", "").replace("s", "").strip()
    m = re.search(r"[-+]?[0-9]*\.?[0-9]+", s)
    if m:
        try:
            return float(m.group(0))
        except ValueError:
            return None
    return None


def ingest_saffire(raw_dir: Path, conn_str: str | None = None) -> int:
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
                    "SAFFIRE",
                    "PSI-98",
                    "Spacecraft Fire Safety Demonstration (Saffire-I / II / III)",
                    "prevention",
                    "10.60555/saffire-2016",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-98",
                    "Cygnus Resupply Vehicle (0.4 m x 0.94 m flow tunnel, 0.6 m/s max flow)",
                    "Large-scale practical spacecraft fabric and composite flammability tests conducted inside unmanned Cygnus resupply vehicles following departure from the ISS.",
                ),
            )

            # Ingest Saffire report source if present
            rep_path = raw_dir / "20170000230.pdf"
            if rep_path.exists():
                reader = PdfReader(str(rep_path))
                cur.execute(
                    """
                    INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        page_or_row_count = EXCLUDED.page_or_row_count;
                    """,
                    (
                        "NASA-NTRS-20170000230",
                        "SAFFIRE",
                        "PSI-98",
                        "Saffire Spacecraft Fire Safety Demonstration Overview (NTRS 20170000230)",
                        rep_path.name,
                        "10.60555/saffire-2016",
                        "https://ntrs.nasa.gov/citations/20170000230",
                        "pdf",
                        len(reader.pages),
                    ),
                )

            total_runs = 0
            tables = [
                ("SAFFIRE-I_Experimental_Table.csv", "NASA-PSI-98-EXP-TABLE", "PSI-98", "Saffire-I Large-Scale SIBAL Burn Runs"),
                ("SAFFIRE-II_Experimental_Table.csv", "NASA-PSI-99-EXP-TABLE", "PSI-99", "Saffire-II Multi-Material Spacecraft Flammability Runs"),
            ]

            for fname, src_id, psi_code, src_title in tables:
                p = raw_dir / fname
                if not p.exists():
                    continue

                with open(p, mode="r", encoding="utf-8-sig", errors="replace") as f:
                    rows = list(csv.DictReader(f))

                cur.execute(
                    """
                    INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        page_or_row_count = EXCLUDED.page_or_row_count;
                    """,
                    (
                        src_id,
                        "SAFFIRE",
                        psi_code,
                        src_title,
                        fname,
                        "10.60555/saffire-2016",
                        f"https://psi.nasa.gov/physci/repo/data/investigations/{psi_code}",
                        "csv",
                        len(rows),
                    ),
                )

                for idx, row in enumerate(rows, start=1):
                    # Normalize keys
                    clean_row = { " ".join(k.strip().split()): v for k, v in row.items() if k }
                    sample_no = clean_row.get("Sample Number") or clean_row.get("Sample Number ") or f"S{idx}"
                    sample_code = str(sample_no).strip()
                    run_id = f"{psi_code}:{sample_code}"

                    mat_raw = str(clean_row.get("Material", "Unknown")).strip()
                    mat_norm = "SIBAL" if "sibal" in mat_raw.lower() else (
                        "Silicone" if "silicone" in mat_raw.lower() else (
                            "PMMA" if "pmma" in mat_raw.lower() else (
                                "Nomex" if "nomex" in mat_raw.lower() else mat_raw
                            )
                        )
                    )

                    # Extract dimensions
                    raw_th = clean_row.get("Sample Thickness (cm)") or clean_row.get("Samle Thickness ") or clean_row.get("Sample Thickness")
                    thick_mm = _clean_num(raw_th)
                    if thick_mm is not None and "cm" in str(raw_th).lower():
                        thick_mm = thick_mm * 10.0

                    raw_w = clean_row.get("Sample Width (cm)") or clean_row.get("Sample Width")
                    width_mm = _clean_num(raw_w)
                    if width_mm is not None and "cm" in str(raw_w).lower():
                        width_mm = width_mm * 10.0

                    flow_val = _clean_num(clean_row.get("Air Flow (cm/s)"))
                    flow_dir = str(clean_row.get("Flow Direction") or clean_row.get("Flow Direction ") or "concurrent").strip().lower()

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
                            width_mm = EXCLUDED.width_mm,
                            notes = EXCLUDED.notes;
                        """,
                        (
                            run_id,
                            "SAFFIRE",
                            sample_code,
                            "David L. Urban / Gary A. Ruff",
                            "2016-06",
                            None,
                            sample_code,
                            flow_dir,
                            mat_raw,
                            mat_norm,
                            "large_scale_sample",
                            "large_scale_sheet",
                            thick_mm,
                            width_mm,
                            None,
                            2,
                            None,
                            "burn_out",
                            "unaged",
                            "microgravity",
                            idx,
                            src_id,
                            f"Cygnus large-scale combustion test: {clean_row}",
                        ),
                    )

                    cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                    m_list = []
                    if flow_val is not None:
                        m_list.append((run_id, "airflow_velocity_cm_s", str(clean_row.get("Air Flow (cm/s)")), flow_val, "cm/s", "recorded"))

                    o2_val = _clean_num(clean_row.get("Percent O2") or clean_row.get("Percent O2 (Note 1)"))
                    if o2_val is not None:
                        m_list.append((run_id, "o2_pct", str(clean_row.get("Percent O2")), o2_val, "% vol", "recorded"))

                    pwr_val = _clean_num(clean_row.get("Ignition Power (W)"))
                    if pwr_val is not None:
                        m_list.append((run_id, "ignition_power_w", str(clean_row.get("Ignition Power (W)")), pwr_val, "W", "recorded"))

                    ign_time = _clean_num(clean_row.get("Ignition Time (s)"))
                    if ign_time is not None:
                        m_list.append((run_id, "ignition_time_s", str(clean_row.get("Ignition Time (s)")), ign_time, "s", "recorded"))

                    burn_time = _clean_num(clean_row.get("Burn Time (s)"))
                    if burn_time is not None:
                        m_list.append((run_id, "burn_time_s", str(clean_row.get("Burn Time (s)")), burn_time, "s", "recorded"))

                    spread_rate = _clean_num(clean_row.get("1-g Spread Rate"))
                    if spread_rate is not None:
                        m_list.append((run_id, "flame_spread_rate_mm_s", str(clean_row.get("1-g Spread Rate")), spread_rate, "mm/s", "recorded"))

                    for item in m_list:
                        cur.execute(
                            """
                            INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
                            VALUES (%s, %s, %s, %s, %s, %s);
                            """,
                            item,
                        )
                    total_runs += 1

        conn.commit()
    return total_runs
