import csv
from pathlib import Path
from pypdf import PdfReader
from app.database.connection import get_connection

SAMER_VERIFIED_RECORDS = [
    # Table 1: Baseline Moment Instrument Results (8.1 cm/s inlet velocity, Unaged vs Aged 720 s)
    {"code": "TBL1-KAPTON-U", "mat": "Kapton", "aging": "unaged", "age_s": 11.0, "flow": 8.1, "temp_c": None, "dg_nm": 47.0, "cmd_nm": 62.0, "dmm_nm": 106.0, "sigma_g": 2.072, "source_ref": "Table 1, p. 4", "notes": "Baseline moment instrument run (unaged)"},
    {"code": "TBL1-KAPTON-A", "mat": "Kapton", "aging": "aged", "age_s": 720.0, "flow": 8.1, "temp_c": None, "dg_nm": 102.0, "cmd_nm": 121.0, "dmm_nm": 169.0, "sigma_g": 1.790, "source_ref": "Table 1, p. 4", "notes": "Baseline moment instrument run (aged 720 s)"},
    {"code": "TBL1-LAMPWICK-U", "mat": "Lampwick", "aging": "unaged", "age_s": 11.0, "flow": 8.1, "temp_c": None, "dg_nm": 103.0, "cmd_nm": 142.0, "dmm_nm": 271.0, "sigma_g": 2.232, "source_ref": "Table 1, p. 5", "notes": "Cellulose lamp wick baseline (unaged)"},
    {"code": "TBL1-LAMPWICK-A", "mat": "Lampwick", "aging": "aged", "age_s": 720.0, "flow": 8.1, "temp_c": None, "dg_nm": 269.0, "cmd_nm": 308.0, "dmm_nm": 401.0, "sigma_g": 1.673, "source_ref": "Table 1, p. 5", "notes": "Cellulose lamp wick baseline (aged 720 s)"},
    {"code": "TBL1-SILICONE-U", "mat": "Silicone", "aging": "unaged", "age_s": 11.0, "flow": 8.1, "temp_c": None, "dg_nm": 152.0, "cmd_nm": 221.0, "dmm_nm": 468.0, "sigma_g": 2.382, "source_ref": "Table 1, p. 5", "notes": "Silicone rubber baseline (unaged); substantial >1 um aerodynamic fraction"},
    {"code": "TBL1-SILICONE-A", "mat": "Silicone", "aging": "aged", "age_s": 720.0, "flow": 8.1, "temp_c": None, "dg_nm": 320.0, "cmd_nm": 400.0, "dmm_nm": 628.0, "sigma_g": 1.956, "source_ref": "Table 1, p. 5", "notes": "Silicone rubber baseline (aged 720 s)"},
    {"code": "TBL1-TEFLON-U", "mat": "Teflon", "aging": "unaged", "age_s": 11.0, "flow": 8.1, "temp_c": None, "dg_nm": 93.0, "cmd_nm": 111.0, "dmm_nm": 173.0, "sigma_g": 2.081, "source_ref": "Table 1, p. 5", "notes": "Teflon fractal agglomerates (unaged)"},
    {"code": "TBL1-TEFLON-A", "mat": "Teflon", "aging": "aged", "age_s": 720.0, "flow": 8.1, "temp_c": None, "dg_nm": 80.0, "cmd_nm": 115.0, "dmm_nm": 237.0, "sigma_g": 2.342, "source_ref": "Table 1, p. 5", "notes": "Teflon fractal agglomerates (aged 720 s)"},
    {"code": "TBL1-PYRELL-U", "mat": "Pyrell", "aging": "unaged", "age_s": 11.0, "flow": 8.1, "temp_c": None, "dg_nm": 177.0, "cmd_nm": 227.0, "dmm_nm": 377.0, "sigma_g": 2.032, "source_ref": "Table 1, p. 5", "notes": "Pyrell intumescent foam baseline (unaged)"},
    {"code": "TBL1-PYRELL-A", "mat": "Pyrell", "aging": "aged", "age_s": 720.0, "flow": 8.1, "temp_c": None, "dg_nm": 348.0, "cmd_nm": 400.0, "dmm_nm": 529.0, "sigma_g": 1.697, "source_ref": "Table 1, p. 5", "notes": "Pyrell intumescent foam baseline (aged 720 s)"},
    # Table 2: Flight Data Comparison of TEM and Moment Method Parameters
    {"code": "ISS-54-LW-U", "mat": "Lampwick", "aging": "unaged", "age_s": 57.0, "flow": 8.1, "temp_c": 264.7, "dg_nm": 72.0, "cmd_nm": 110.0, "dmm_nm": 253.0, "sigma_g": 2.493, "tem_dg_nm": 255.0, "tem_dmm_nm": 403.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #54 (7L) Low Temp 264.7 C, 511 TEM particles"},
    {"code": "ISS-55-LW-A", "mat": "Lampwick", "aging": "aged", "age_s": 218.0, "flow": 8.1, "temp_c": 262.9, "dg_nm": 102.0, "cmd_nm": 149.0, "dmm_nm": 320.0, "sigma_g": 2.400, "tem_dg_nm": 284.0, "tem_dmm_nm": 499.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #55 (8L) Low Temp 262.9 C, 196 TEM particles"},
    {"code": "ISS-94-KAP-A", "mat": "Kapton", "aging": "aged", "age_s": 567.0, "flow": 8.1, "temp_c": 527.3, "dg_nm": 119.0, "cmd_nm": 136.0, "dmm_nm": 176.0, "sigma_g": 1.669, "tem_dg_nm": 103.0, "tem_dmm_nm": 159.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #94 (47K) Low Temp 527.3 C, 1353 TEM particles"},
    {"code": "ISS-62-KAP-U", "mat": "Kapton", "aging": "unaged", "age_s": 39.0, "flow": 8.1, "temp_c": 574.3, "dg_nm": 114.0, "cmd_nm": 148.0, "dmm_nm": 251.0, "sigma_g": 2.066, "tem_dg_nm": 158.0, "tem_dmm_nm": 226.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #62 (15K) High Temp 574.3 C, 1320 TEM particles"},
    {"code": "ISS-62-KAP-A", "mat": "Kapton", "aging": "aged", "age_s": 808.0, "flow": 8.1, "temp_c": 574.3, "dg_nm": 194.0, "cmd_nm": 243.0, "dmm_nm": 383.0, "sigma_g": 1.962, "tem_dg_nm": 210.0, "tem_dmm_nm": 289.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #62a (15Ka) High Temp 574.3 C, 796 TEM particles"},
    {"code": "ISS-63-PYR-U", "mat": "Pyrell", "aging": "unaged", "age_s": 56.0, "flow": 8.1, "temp_c": 225.3, "dg_nm": 151.0, "cmd_nm": 207.0, "dmm_nm": 392.0, "sigma_g": 2.222, "tem_dg_nm": 244.0, "tem_dmm_nm": 394.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #63 (16P) Low Temp 225.3 C, 3436 TEM particles"},
    {"code": "ISS-63-PYR-A", "mat": "Pyrell", "aging": "aged", "age_s": 840.0, "flow": 8.1, "temp_c": 225.3, "dg_nm": 293.0, "cmd_nm": 359.0, "dmm_nm": 539.0, "sigma_g": 1.892, "tem_dg_nm": 292.0, "tem_dmm_nm": 468.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #63a (16Pa) Low Temp 225.3 C, 2658 TEM particles"},
    {"code": "ISS-64-PYR-U", "mat": "Pyrell", "aging": "unaged", "age_s": 47.0, "flow": 8.1, "temp_c": 242.1, "dg_nm": 192.0, "cmd_nm": 254.0, "dmm_nm": 445.0, "sigma_g": 2.115, "tem_dg_nm": 249.0, "tem_dmm_nm": 411.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #64 (17P) High Temp 242.1 C, 1888 TEM particles"},
    {"code": "ISS-64-PYR-A", "mat": "Pyrell", "aging": "aged", "age_s": 842.0, "flow": 8.1, "temp_c": 242.1, "dg_nm": 385.0, "cmd_nm": 450.0, "dmm_nm": 616.0, "sigma_g": 1.750, "tem_dg_nm": 328.0, "tem_dmm_nm": 540.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #64a (17Pa) High Temp 242.1 C, 1560 TEM particles"},
    {"code": "ISS-60-SIL-U", "mat": "Silicone", "aging": "unaged", "age_s": 49.0, "flow": 8.1, "temp_c": 379.9, "dg_nm": 162.0, "cmd_nm": 241.0, "dmm_nm": 533.0, "sigma_g": 2.440, "tem_dg_nm": 107.0, "tem_dmm_nm": 153.0, "source_ref": "Table 2, p. 16", "notes": "ISS Run #60 (13S) High Temp 379.9 C; volatile liquid droplets partially evaporated in TEM"},
    # Quiescent & Low-Flow Flight Runs
    {"code": "ISS-95-PYR-0FLOW", "mat": "Pyrell", "aging": "unaged", "age_s": 38.0, "flow": 0.0, "temp_c": None, "dg_nm": 140.0, "cmd_nm": None, "dmm_nm": 683.0, "sigma_g": 3.521, "source_ref": "Appendix B, p. 69", "notes": "No-flow quiescent run #95: spherical droplets, dmm 683 nm"},
    {"code": "ISS-98-LW-0FLOW-U", "mat": "Lampwick", "aging": "unaged", "age_s": 37.0, "flow": 0.0, "temp_c": None, "dg_nm": 168.0, "cmd_nm": None, "dmm_nm": 403.0, "sigma_g": 2.546, "source_ref": "Appendix B, p. 70", "notes": "No-flow quiescent run #98 unaged"},
    {"code": "ISS-98-LW-0FLOW-A", "mat": "Lampwick", "aging": "aged", "age_s": 585.0, "flow": 0.0, "temp_c": None, "dg_nm": 186.0, "cmd_nm": None, "dmm_nm": 431.0, "sigma_g": 2.503, "source_ref": "Appendix B, p. 71", "notes": "No-flow quiescent run #98a aged 585 s"},
    {"code": "ISS-101-KAP-0FLOW-U", "mat": "Kapton", "aging": "unaged", "age_s": 29.0, "flow": 0.0, "temp_c": None, "dg_nm": 223.0, "cmd_nm": None, "dmm_nm": 346.0, "sigma_g": 1.936, "source_ref": "Appendix B, p. 71", "notes": "No-flow quiescent run #101 unaged"},
    {"code": "ISS-101-KAP-0FLOW-A", "mat": "Kapton", "aging": "aged", "age_s": 561.0, "flow": 0.0, "temp_c": None, "dg_nm": 234.0, "cmd_nm": None, "dmm_nm": 351.0, "sigma_g": 1.893, "source_ref": "Appendix B, p. 71", "notes": "No-flow quiescent run #101a aged 561 s"},
    {"code": "ISS-105-TEF-0FLOW-U", "mat": "Teflon", "aging": "unaged", "age_s": 24.0, "flow": 0.0, "temp_c": None, "dg_nm": 172.0, "cmd_nm": None, "dmm_nm": 306.0, "sigma_g": 2.132, "source_ref": "Appendix B, p. 61", "notes": "No-flow quiescent run #105 unaged"},
    {"code": "ISS-105-TEF-0FLOW-A", "mat": "Teflon", "aging": "aged", "age_s": 559.0, "flow": 0.0, "temp_c": None, "dg_nm": 162.0, "cmd_nm": None, "dmm_nm": 324.0, "sigma_g": 2.298, "source_ref": "Appendix B, p. 62", "notes": "No-flow quiescent run #105a aged 559 s"},
    {"code": "ISS-107-PYR-1FLOW-U", "mat": "Pyrell", "aging": "unaged", "age_s": 32.0, "flow": 1.0, "temp_c": None, "dg_nm": 259.0, "cmd_nm": None, "dmm_nm": 922.0, "sigma_g": 3.084, "source_ref": "Appendix B, p. 62", "notes": "Low flow 1 cm/s run #107 unaged"},
    {"code": "ISS-107-PYR-1FLOW-A", "mat": "Pyrell", "aging": "aged", "age_s": 559.0, "flow": 1.0, "temp_c": None, "dg_nm": 282.0, "cmd_nm": None, "dmm_nm": 933.0, "sigma_g": 2.985, "source_ref": "Appendix B, p. 62", "notes": "Low flow 1 cm/s run #107a aged"},
    {"code": "ISS-108-KAP-1FLOW-U", "mat": "Kapton", "aging": "unaged", "age_s": 30.0, "flow": 1.0, "temp_c": None, "dg_nm": 135.0, "cmd_nm": None, "dmm_nm": 343.0, "sigma_g": 2.632, "source_ref": "Appendix B, p. 62", "notes": "Low flow 1 cm/s run #108 unaged"},
    {"code": "ISS-108-KAP-1FLOW-A", "mat": "Kapton", "aging": "aged", "age_s": 560.0, "flow": 1.0, "temp_c": None, "dg_nm": 145.0, "cmd_nm": None, "dmm_nm": 351.0, "sigma_g": 2.561, "source_ref": "Appendix B, p. 63", "notes": "Low flow 1 cm/s run #108a aged"},
    {"code": "ISS-106-LW-0FLOW", "mat": "Lampwick", "aging": "unaged", "age_s": 30.0, "flow": 0.0, "temp_c": None, "dg_nm": 442.0, "cmd_nm": None, "dmm_nm": 600.0, "sigma_g": 1.736, "source_ref": "Appendix B, p. 61", "notes": "No-flow quiescent run #106: large droplets up to 3.67 um"},
]


def ingest_samer(raw_dir: Path, conn_str: str | None = None) -> int:
    source_id = "NASA-PSI-101-FINAL-REPORT"
    pdf_path = raw_dir / "SAMER_Final 0602 2014.pdf"
    if not pdf_path.exists():
        pdf_path = raw_dir / "SAME-R_Final_Report.pdf"

    reader = PdfReader(str(pdf_path)) if pdf_path.exists() else None
    page_count = len(reader.pages) if reader else 75

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
                    "SAME-R",
                    "PSI-101",
                    "Smoke Aerosol Measurement Experiment - Reflight (SAME-R)",
                    "detection",
                    "10.60555/2np7-jv14",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
                    "ISS Microgravity Science Glovebox (MSG) 6000 cm3 aging piston + P-Trak, Ion Chamber, DustTrak, MPASS",
                    "Microgravity pyrolysis smoke particle size distributions, coagulation aging (11-1800 s), quiescent vs forced-flow morphology, and two-moment MPASS smoke detector validation across Kapton, Teflon, Pyrell, Silicone, and Lampwick.",
                ),
            )

            cur.execute(
                """
                INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    page_or_row_count = EXCLUDED.page_or_row_count;
                """,
                (
                    source_id,
                    "SAME-R",
                    "PSI-101",
                    "Smoke Aerosol Measurement Experiment Re-flight (SAMER) Final Report",
                    pdf_path.name if pdf_path.exists() else "SAMER_Final 0602 2014.pdf",
                    "10.60555/2np7-jv14",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
                    "pdf",
                    page_count,
                ),
            )

            inserted = 0
            # 1. Ingest 32 verified records
            for idx, rec in enumerate(SAMER_VERIFIED_RECORDS, start=1):
                run_id = f"PSI-101:{rec['code']}"
                flow_reg = "quiescent" if rec["flow"] == 0.0 else "forced_flow"
                cur.execute(
                    """
                    INSERT INTO test_runs (
                        id, investigation_id, test_code, pi_name, test_date, gmt_day, sample_code,
                        flow_regime, material_raw, material_normalized, color_or_grade, geometry,
                        thickness_mm, width_mm, diameter_mm, burn_sides, flow_restrictor,
                        extinction_mode, aging_state, gravity_regime, raw_row_index, source_id, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        flow_regime = EXCLUDED.flow_regime,
                        aging_state = EXCLUDED.aging_state,
                        notes = EXCLUDED.notes;
                    """,
                    (
                        run_id,
                        "SAME-R",
                        rec["code"],
                        "David L. Urban",
                        "2010-07-16 to 2010-09-09",
                        None,
                        rec["mat"][:3].upper(),
                        flow_reg,
                        rec["mat"],
                        rec["mat"],
                        "overheated_pyrolysis_sample",
                        "heated_wire_sample",
                        None,
                        None,
                        None,
                        None,
                        None,
                        "non_flaming_pyrolysis",
                        rec["aging"],
                        "microgravity",
                        idx,
                        source_id,
                        f"{rec['source_ref']} — {rec['notes']}",
                    ),
                )

                cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                meas = [
                    (run_id, "o2_initial_pct", "20.9", 20.9, "% vol", "approx"),
                    (run_id, "airflow_initial_cm_s", str(rec["flow"]), float(rec["flow"]), "cm/s", "recorded"),
                    (run_id, "aging_time_s", str(rec["age_s"]), float(rec["age_s"]), "s", "recorded"),
                    (run_id, "geometric_mean_diameter_nm", str(rec["dg_nm"]), float(rec["dg_nm"]), "nm", "recorded"),
                    (run_id, "diameter_average_mass_nm", str(rec["dmm_nm"]), float(rec["dmm_nm"]), "nm", "recorded"),
                    (run_id, "geometric_std_dev", str(rec["sigma_g"]), float(rec["sigma_g"]), "dimensionless", "recorded"),
                ]
                if rec.get("cmd_nm") is not None:
                    meas.append((run_id, "count_mean_diameter_nm", str(rec["cmd_nm"]), float(rec["cmd_nm"]), "nm", "recorded"))
                if rec.get("temp_c") is not None:
                    meas.append((run_id, "pyrolysis_temp_c", str(rec["temp_c"]), float(rec["temp_c"]), "C", "recorded"))
                if rec.get("tem_dg_nm") is not None:
                    meas.append((run_id, "tem_geometric_mean_diameter_nm", str(rec["tem_dg_nm"]), float(rec["tem_dg_nm"]), "nm", "recorded"))
                if rec.get("tem_dmm_nm") is not None:
                    meas.append((run_id, "tem_diameter_average_mass_nm", str(rec["tem_dmm_nm"]), float(rec["tem_dmm_nm"]), "nm", "recorded"))

                for m in meas:
                    cur.execute(
                        """
                        INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
                        VALUES (%s, %s, %s, %s, %s, %s);
                        """,
                        m,
                    )
                inserted += 1

            # 2. Ingest SAME-R Experimental Table CSV if present
            csv_path = raw_dir / "SAME-R_Experimental_Table.csv"
            if csv_path.exists():
                csv_source_id = "NASA-PSI-101-EXP-TABLE"
                with open(csv_path, mode="r", encoding="utf-8-sig", errors="replace") as f:
                    csv_reader = list(csv.DictReader(f))

                cur.execute(
                    """
                    INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        page_or_row_count = EXCLUDED.page_or_row_count;
                    """,
                    (
                        csv_source_id,
                        "SAME-R",
                        "PSI-101",
                        "SAME-R Experimental Table (109 Flight Runs)",
                        csv_path.name,
                        "10.60555/2np7-jv14",
                        "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
                        "csv",
                        len(csv_reader),
                    ),
                )

                for idx, row in enumerate(csv_reader, start=1):
                    test_num = str(row.get("SAME Test #", "")).strip()
                    run_id = f"PSI-101:TEST-{test_num}" if test_num else f"PSI-101:ROW-{idx}"
                    mat_raw = str(row.get("Sample Type", "Unknown")).strip()
                    desc = str(row.get("Description", "")).strip()
                    velocity = None
                    try:
                        velocity = float(row.get("Inlet velocity (cm/s)", 0))
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
                            notes = EXCLUDED.notes;
                        """,
                        (
                            run_id,
                            "SAME-R",
                            f"TEST-{test_num}",
                            "David L. Urban",
                            str(row.get("Date", "")).strip(),
                            None,
                            test_num,
                            "quiescent" if velocity == 0.0 else "forced_flow",
                            mat_raw,
                            mat_raw,
                            "pyrolysis",
                            "heated_sample",
                            None,
                            None,
                            None,
                            None,
                            None,
                            "non_flaming_pyrolysis",
                            "aged" if float(row.get("Primary aging time (sec)", 0) or 0) > 60 else "unaged",
                            "microgravity",
                            idx,
                            csv_source_id,
                            desc,
                        ),
                    )

                    cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                    csv_meas = []
                    if velocity is not None:
                        csv_meas.append((run_id, "inlet_velocity_cm_s", str(velocity), velocity, "cm/s", "recorded"))
                    for p_name, col_name, u in [
                        ("rt_r0_ratio", "Rt/R0", "ratio"),
                        ("duration_s", "Duration (sec)", "s"),
                        ("primary_aging_time_s", "Primary aging time (sec)", "s"),
                        ("primary_mixing_time_s", "Primary mixing time (sec)", "s"),
                        ("net_aging_time_s", "Net aging time (sec)", "s"),
                    ]:
                        raw_v = row.get(col_name)
                        if raw_v and str(raw_v).strip():
                            try:
                                nv = float(str(raw_v).strip())
                                csv_meas.append((run_id, p_name, str(raw_v), nv, u, "recorded"))
                            except ValueError:
                                pass
                    for cm in csv_meas:
                        cur.execute(
                            """
                            INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
                            VALUES (%s, %s, %s, %s, %s, %s);
                            """,
                            cm,
                        )
                    inserted += 1

        conn.commit()
    return inserted
