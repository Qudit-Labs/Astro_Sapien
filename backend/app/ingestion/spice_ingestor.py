import csv
import re
from pathlib import Path
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


def ingest_spice(raw_dir: Path, conn_str: str | None = None) -> int:
    source_id = "NASA-PSI-107-EXP-TABLE"
    csv_path = raw_dir / "SPICE_Experimental_Table.csv"
    if not csv_path.exists():
        return 0

    with open(csv_path, mode="r", encoding="utf-8-sig", errors="replace") as f:
        rows = list(csv.DictReader(f))

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
                    "SPICE",
                    "PSI-107",
                    "Smoke Point In Co-flow Experiment (SPICE)",
                    "detection",
                    "10.60555/spice-2015",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-107",
                    "ISS Microgravity Science Glovebox (MSG) co-flow laminar burner",
                    "Microgravity laminar co-flow diffusion flame smoke-point limits, soot emission thresholds, and radiative yields across gaseous hydrocarbon fuels (Ethylene, Propane, Methane) without mixing flaming soot into pyrolysis aerosols.",
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
                    "SPICE",
                    "PSI-107",
                    "SPICE Experimental Table (Laminar Co-flow Soot Point Runs)",
                    csv_path.name,
                    "10.60555/spice-2015",
                    "https://psi.nasa.gov/physci/repo/data/investigations/PSI-107",
                    "csv",
                    len(rows),
                ),
            )

            inserted = 0
            for idx, row in enumerate(rows, start=1):
                clean_row = { " ".join(k.strip().split()): v for k, v in row.items() if k }
                gmt_date = clean_row.get("GMT date", "")
                ign = clean_row.get("GMT ignition", "")
                fuel = str(clean_row.get("Fuel", "Hydrocarbon")).strip()
                nozzle_mm = _parse_float(clean_row.get("Nozzle (mm)"))
                fuel_sccm = _parse_float(clean_row.get("Fuel Rate (sccm)"))
                fuel_mg_s = _parse_float(clean_row.get("Fuel Rate (mg/s)"))
                air_rate = _parse_float(clean_row.get("Air Rate (cm/s)"))

                run_id = f"PSI-107:RUN-{idx:03d}"
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
                        notes = EXCLUDED.notes;
                    """,
                    (
                        run_id,
                        "SPICE",
                        f"SPICE-{idx}",
                        "David L. Urban / Peter B. Sunderland",
                        f"GMT {gmt_date} {ign}".strip(),
                        int(_parse_float(gmt_date) or 0) if _parse_float(gmt_date) else None,
                        fuel,
                        "co_flow_diffusion",
                        fuel,
                        fuel,
                        "gas_fuel",
                        "co_flow_burner",
                        None,
                        None,
                        nozzle_mm,
                        None,
                        None,
                        "soot_smoke_point",
                        "unaged",
                        "microgravity",
                        idx,
                        source_id,
                        f"SPICE co-flow soot point test with {fuel}. Nozzle {nozzle_mm} mm",
                    ),
                )

                cur.execute("DELETE FROM measurements WHERE test_run_id = %s;", (run_id,))
                m_list = []
                if nozzle_mm is not None:
                    m_list.append((run_id, "burner_nozzle_diameter_mm", str(nozzle_mm), nozzle_mm, "mm", "recorded"))
                if fuel_sccm is not None:
                    m_list.append((run_id, "fuel_flow_rate_sccm", str(fuel_sccm), fuel_sccm, "sccm", "recorded"))
                if fuel_mg_s is not None:
                    m_list.append((run_id, "fuel_mass_rate_mg_s", str(fuel_mg_s), fuel_mg_s, "mg/s", "recorded"))
                if air_rate is not None:
                    m_list.append((run_id, "air_flow_velocity_cm_s", str(air_rate), air_rate, "cm/s", "recorded"))

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
