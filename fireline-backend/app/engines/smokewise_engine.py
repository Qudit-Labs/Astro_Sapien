from app.database.connection import get_connection


def analyze_smoke_aerosols(
    material: str | None = None,
    include_spice: bool = True,
    conn_str: str | None = None,
) -> dict:
    sql_samer = """
        SELECT t.id, t.test_code, t.material_normalized AS material, t.aging_state, t.flow_regime, t.notes,
               COALESCE(m_flow.normalized_value, m_inlet.normalized_value) AS airflow_cm_s,
               m_age.normalized_value AS aging_time_s,
               m_dg.normalized_value AS geometric_mean_diameter_nm,
               m_cmd.normalized_value AS count_mean_diameter_nm,
               m_dmm.normalized_value AS diameter_average_mass_nm,
               m_sig.normalized_value AS geometric_std_dev,
               m_temp.normalized_value AS pyrolysis_temp_c,
               m_rt.normalized_value AS rt_r0_ratio
        FROM test_runs t
        LEFT JOIN measurements m_flow ON t.id = m_flow.test_run_id AND m_flow.parameter = 'airflow_initial_cm_s'
        LEFT JOIN measurements m_inlet ON t.id = m_inlet.test_run_id AND m_inlet.parameter = 'inlet_velocity_cm_s'
        LEFT JOIN measurements m_age ON t.id = m_age.test_run_id AND m_age.parameter = 'aging_time_s'
        LEFT JOIN measurements m_dg ON t.id = m_dg.test_run_id AND m_dg.parameter = 'geometric_mean_diameter_nm'
        LEFT JOIN measurements m_cmd ON t.id = m_cmd.test_run_id AND m_cmd.parameter = 'count_mean_diameter_nm'
        LEFT JOIN measurements m_dmm ON t.id = m_dmm.test_run_id AND m_dmm.parameter = 'diameter_average_mass_nm'
        LEFT JOIN measurements m_sig ON t.id = m_sig.test_run_id AND m_sig.parameter = 'geometric_std_dev'
        LEFT JOIN measurements m_temp ON t.id = m_temp.test_run_id AND m_temp.parameter = 'pyrolysis_temp_c'
        LEFT JOIN measurements m_rt ON t.id = m_rt.test_run_id AND m_rt.parameter = 'rt_r0_ratio'
        WHERE t.investigation_id = 'SAME-R'
    """
    params_samer: list = []
    if material:
        sql_samer += " AND LOWER(t.material_normalized) = LOWER(%s)"
        params_samer.append(material)

    sql_samer += " ORDER BY t.raw_row_index;"

    with get_connection(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute(sql_samer, params_samer)
            records = [dict(r) for r in cur.fetchall()]

            spice_records = []
            if include_spice:
                sql_spice = """
                    SELECT t.id, t.test_code, t.material_normalized AS fuel, t.sample_code,
                           m_noz.normalized_value AS nozzle_diameter_mm,
                           m_fsccm.normalized_value AS fuel_rate_sccm,
                           m_fmg.normalized_value AS fuel_rate_mg_s,
                           m_air.normalized_value AS air_rate_cm_s
                    FROM test_runs t
                    LEFT JOIN measurements m_noz ON t.id = m_noz.test_run_id AND m_noz.parameter = 'burner_nozzle_diameter_mm'
                    LEFT JOIN measurements m_fsccm ON t.id = m_fsccm.test_run_id AND m_fsccm.parameter = 'fuel_flow_rate_sccm'
                    LEFT JOIN measurements m_fmg ON t.id = m_fmg.test_run_id AND m_fmg.parameter = 'fuel_mass_rate_mg_s'
                    LEFT JOIN measurements m_air ON t.id = m_air.test_run_id AND m_air.parameter = 'air_flow_velocity_cm_s'
                    WHERE t.investigation_id = 'SPICE'
                    ORDER BY t.raw_row_index;
                """
                cur.execute(sql_spice)
                spice_records = [dict(r) for r in cur.fetchall()]

    # Aggregate SAME-R by material
    by_material: dict[str, dict] = {}
    for r in records:
        mat = r.get("material") or "Unknown"
        bucket = by_material.setdefault(
            mat,
            {
                "material": mat,
                "run_count": 0,
                "unaged_dmm_nm": [],
                "aged_dmm_nm": [],
                "quiescent_dmm_nm": [],
                "ventilated_dmm_nm": [],
            },
        )
        bucket["run_count"] += 1
        dmm = r.get("diameter_average_mass_nm")
        if dmm is not None:
            if r.get("aging_state") == "unaged":
                bucket["unaged_dmm_nm"].append(dmm)
            elif r.get("aging_state") == "aged":
                bucket["aged_dmm_nm"].append(dmm)
            if r.get("airflow_cm_s") == 0.0 or r.get("flow_regime") == "quiescent":
                bucket["quiescent_dmm_nm"].append(dmm)
            else:
                bucket["ventilated_dmm_nm"].append(dmm)

    material_summary = []
    for mat, b in by_material.items():
        avg = lambda arr: round(sum(arr) / len(arr), 1) if arr else None
        material_summary.append({
            "material": mat,
            "run_count": b["run_count"],
            "avg_unaged_dmm_nm": avg(b["unaged_dmm_nm"]),
            "avg_aged_dmm_nm": avg(b["aged_dmm_nm"]),
            "avg_quiescent_dmm_nm": avg(b["quiescent_dmm_nm"]),
            "avg_ventilated_dmm_nm": avg(b["ventilated_dmm_nm"]),
        })

    # Particle aging trajectory series
    aging_series = [
        {
            "test_code": r["test_code"],
            "material": r["material"],
            "aging_state": r["aging_state"],
            "airflow_cm_s": r["airflow_cm_s"],
            "aging_time_s": r["aging_time_s"],
            "geometric_mean_diameter_nm": r["geometric_mean_diameter_nm"],
            "diameter_average_mass_nm": r["diameter_average_mass_nm"],
            "notes": r.get("notes"),
        }
        for r in records
        if r.get("aging_time_s") is not None and r.get("diameter_average_mass_nm") is not None
    ]
    aging_series.sort(key=lambda x: (x["material"], x["aging_time_s"]))

    # SPICE summary (strictly separated as flaming soot point, not pyrolysis aerosol)
    spice_by_fuel: dict[str, list] = {}
    for sr in spice_records:
        fuel = sr.get("fuel") or "Unknown"
        spice_by_fuel.setdefault(fuel, []).append(sr)

    spice_summary = [
        {
            "fuel": fuel,
            "run_count": len(f_runs),
            "avg_smoke_point_sccm": round(
                sum(r["fuel_rate_sccm"] for r in f_runs if r.get("fuel_rate_sccm") is not None) /
                len([r for r in f_runs if r.get("fuel_rate_sccm") is not None]), 2
            ) if any(r.get("fuel_rate_sccm") is not None for r in f_runs) else None,
            "avg_smoke_point_mg_s": round(
                sum(r["fuel_rate_mg_s"] for r in f_runs if r.get("fuel_rate_mg_s") is not None) /
                len([r for r in f_runs if r.get("fuel_rate_mg_s") is not None]), 3
            ) if any(r.get("fuel_rate_mg_s") is not None for r in f_runs) else None,
            "phenomenon": "laminar_diffusion_flaming_soot_point",
        }
        for fuel, f_runs in spice_by_fuel.items()
    ]

    return {
        "samer_smoke_records": len(records),
        "spice_soot_records": len(spice_records),
        "material_summary": material_summary,
        "aging_trajectory_series": aging_series,
        "spice_soot_point_summary": spice_summary,
        "detector_implications": {
            "iss_near_ir_scattering_detector": (
                "Primary operational ISS smoke detectors rely on near-IR light scattering (>1000 nm). "
                "Because Kapton and Teflon pyrolysis produces sub-100 nm fresh smoke, "
                "they remain virtually undetectable until significant coagulation aging (>700 s) occurs."
            ),
            "shuttle_ionization_detector": (
                "Legacy Shuttle ionization detectors responded well to high particle count / sub-micron diameters, "
                "but suffered from vulnerability to cabin dust loading and humidity variance."
            ),
            "mpass_two_moment_prototype": (
                "The two-moment prototype (MPASS) evaluates both particle count (0th/1st moment) and mass (2nd/3rd moment), "
                "cutting response variance by more than 2x across all 5 spacecraft materials and distinguishing smoke from dust."
            ),
        },
        "sample_records": records[:20],
    }
