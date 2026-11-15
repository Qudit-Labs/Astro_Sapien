import csv
import re
from pathlib import Path
from pypdf import PdfReader
from app.database.connection import get_connection


def _parse_float(val) -> float | None:
    if val is None:
        return None
    s = str(val).strip()
    if not s or s.lower() in ("none", "nan", "n/a", "-"):
        return None
    m = re.search(r"[-+]?[0-9]*\.?[0-9]+", s)
    if m:
        try:
            return float(m.group(0))
        except ValueError:
            return None
    return None


def ingest_flex(raw_dir: Path, conn_str: str | None = None) -> int:
    source_id = "NASA-PSI-69-EXP-TABLE"
    csv_path = raw_dir / "FLEX_Experimental_Table.csv"
    pdf_path = raw_dir / "NASA-TP-2015-216046.pdf"

    page_count = 150
    if pdf_path.exists():
        try:
            reader = PdfReader(str(pdf_path))
            page_count = len(reader.pages)
        except Exception:
            pass

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
                    "FLEX",
                    "PSI-69",
                    "Flame Extinction Experiment (FLEX / FLEX-2)",
                    "suppression",
                    "10.60555/flex-2015",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
                    "ISS Multi-user Droplet Combustion Apparatus (MDCA) in Combustion Integrated Rack (CIR)",
                    "Microgravity spherical liquid fuel droplet combustion, burning rate constants, radiative vs diffusive extinction diameters, and gaseous suppression effectiveness using CO2, He, SF6, and N2.",
                ),
            )

            # Ingest FLEX final report source
            if pdf_path.exists():
                cur.execute(
                    """
                    INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        page_or_row_count = EXCLUDED.page_or_row_count;
                    """,
                    (
                        "NASA-TP-2015-216046",
                        "FLEX",
                        "PSI-69",
                        "Flame Extinction Experiment (FLEX) Final Results (NASA/TP-2015-216046)",
                        pdf_path.name,
                        "10.60555/flex-2015",
                        "https://ntrs.nasa.gov/citations/20150017013",
                        "pdf",
                        page_count,
                    ),
                )

            if not csv_path.exists():
                conn.commit()
                return 0

            with open(csv_path, mode="r", encoding="utf-8-sig", errors="replace") as f:
                rows = list(csv.DictReader(f))

            cur.execute(
                """
                INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    page_or_row_count = EXCLUDED.page_or_row_count;
                """,
                (
                    source_id,
                    "FLEX",
                    "PSI-69",
                    "FLEX Experimental Table (Microgravity Droplet Extinction Runs)",
                    csv_path.name,
                    "10.60555/flex-2015",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
                    "csv",
                    len(rows),
                ),
            )

            inserted = 0
            for idx, row in enumerate(rows, start=1):
                clean_row = { " ".join(k.strip().split()): v for k, v in row.items() if k }
                test_num = str(clean_row.get("FLEX Test #", idx)).strip()
                identifier = str(clean_row.get("FLEX Identifier", "")).strip()
                run_id = f"PSI-69:{identifier}" if identifier else f"PSI-69:TEST-{test_num}"
                fuel = str(clean_row.get("Fuel", "Unknown")).strip()
                test_end = str(clean_row.get("Test end", "extinction")).strip()

                init_diam = _parse_float(clean_row.get("Droplet initial diameter; mm"))
                ext_diam = _parse_float(clean_row.get("Visible flame extinction diameter; mm"))
                k_burn = _parse_float(clean_row.get("Burning rate; mm"))
                burn_time = _parse_float(clean_row.get("Burn time; s"))
                p_amb = _parse_float(clean_row.get("Ambient pressure; mmHg"))

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
                        diameter_mm = EXCLUDED.diameter_mm,
                        extinction_mode = EXCLUDED.extinction_mode,
                        notes = EXCLUDED.notes;
                    """,
                    (
                        run_id,
                        "FLEX",
                        identifier or test_num,
                        "Forman A. Williams / Vedha Nayagam",
                        str(clean_row.get("Test Date", "")).strip(),
                        None,
                        fuel,
                        "quiescent_droplet",
                        fuel,
                        fuel,
                        "liquid_droplet",
                        "droplet",
                        None,
                        None,
                        init_diam,
                        None,
                        None,
                        test_end,
                        "n/a",
                        "microgravity",
                        idx,
                        source_id,
                        f"FLEX Run {identifier} in CIR/MDCA. Extinction: {test_end}",
                    ),
                )

                cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                m_list = []
                if init_diam is not None:
                    m_list.append((run_id, "droplet_initial_diameter_mm", str(init_diam), init_diam, "mm", "recorded"))
                if ext_diam is not None:
                    m_list.append((run_id, "flame_extinction_diameter_mm", str(ext_diam), ext_diam, "mm", "recorded"))
                if k_burn is not None:
                    m_list.append((run_id, "burning_rate_constant_mm2_s", str(k_burn), k_burn, "mm2/s", "recorded"))
                if burn_time is not None:
                    m_list.append((run_id, "burn_time_s", str(burn_time), burn_time, "s", "recorded"))
                if p_amb is not None:
                    m_list.append((run_id, "ambient_pressure_torr", str(p_amb), p_amb, "mmHg", "recorded"))

                # Ingest ambient gas fractions (O2, N2, CO2, He)
                for param, col in [
                    ("o2_mole_fraction", "O initial ambient composition; mole fraction"),
                    ("n2_mole_fraction", "N initial ambient composition; mole fraction"),
                    ("co2_mole_fraction", "CO initial ambient composition; mole fraction"),
                    ("he_mole_fraction", "He initial ambient composition; mole fraction"),
                ]:
                    v = _parse_float(clean_row.get(col))
                    if v is not None:
                        m_list.append((run_id, param, str(v), v, "mole_fraction", "recorded"))

                for m in m_list:
                    cur.execute(
                        """
                        INSERT INTO measurements (test_run_id, parameter, raw_value, normalized_value, unit, quality_status)
                        VALUES (%s, %s, %s, %s, %s, %s);
                        """,
                        m,
                    )
                inserted += 1

        conn.commit()
    return inserted
