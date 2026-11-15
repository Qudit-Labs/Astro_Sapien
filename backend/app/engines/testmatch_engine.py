from app.database.connection import get_connection


def _extract_o2(m_dict: dict) -> float | None:
    for key in ("o2_initial_pct", "o2_pct", "o2_vol_pct"):
        if key in m_dict and m_dict[key].get("normalized_value") is not None:
            return float(m_dict[key]["normalized_value"])
    if "o2_mole_fraction" in m_dict and m_dict["o2_mole_fraction"].get("normalized_value") is not None:
        return round(float(m_dict["o2_mole_fraction"]["normalized_value"]) * 100.0, 2)
    return None


def _extract_airflow(m_dict: dict) -> float | None:
    for key in ("airflow_initial_cm_s", "airflow_velocity_cm_s", "airflow_calibrated_cm_s", "inlet_velocity_cm_s", "air_flow_velocity_cm_s"):
        if key in m_dict and m_dict[key].get("normalized_value") is not None:
            return float(m_dict[key]["normalized_value"])
    return None


def _extract_pressure_kpa(m_dict: dict, investigation_id: str) -> float | None:
    for key in ("pressure_kpa", "ambient_pressure_kpa"):
        if key in m_dict and m_dict[key].get("normalized_value") is not None:
            return float(m_dict[key]["normalized_value"])
    for key in ("ambient_pressure_torr", "ambient_pressure_mmhg"):
        if key in m_dict and m_dict[key].get("normalized_value") is not None:
            return round(float(m_dict[key]["normalized_value"]) * 0.133322, 2)
    # Standard nominal ISS / spacecraft cabin atmosphere is 101.3 kPa
    if investigation_id in ("BASS-II", "SAFFIRE", "SAME-R", "SPICE"):
        return 101.3
    return None


def _get_scale_category(run: dict) -> str:
    inv = run.get("investigation_id")
    geom = str(run.get("geometry", "")).lower()
    if inv == "SAFFIRE" or "large_scale" in geom:
        return "large_scale_spacecraft"
    if inv == "BASS-II":
        return "small_scale_glovebox"
    if inv == "FLEX" or "droplet" in geom:
        return "droplet_micro_scale"
    if inv == "SAME-R":
        return "pyrolysis_chamber"
    if inv == "SPICE":
        return "laminar_burner"
    return "laboratory_scale"


def compare_test_runs(experiment_a: str, experiment_b: str, conn_str: str | None = None) -> dict:
    with get_connection(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM test_runs WHERE id = %s;", (experiment_a,))
            row_a = cur.fetchone()
            cur.execute("SELECT * FROM test_runs WHERE id = %s;", (experiment_b,))
            row_b = cur.fetchone()

            if not row_a or not row_b:
                missing = []
                if not row_a:
                    missing.append(experiment_a)
                if not row_b:
                    missing.append(experiment_b)
                raise KeyError(f"Experiment ID(s) not found in test_runs: {', '.join(missing)}")

            def get_measurements(run_id: str) -> dict:
                cur.execute("SELECT * FROM measurements WHERE test_run_id = %s;", (run_id,))
                rows = cur.fetchall()
                return {r["parameter"]: dict(r) for r in rows}

            ma = get_measurements(experiment_a)
            mb = get_measurements(experiment_b)

    a, b = dict(row_a), dict(row_b)
    cross_domain = a["investigation_id"] != b["investigation_id"]

    criteria = []

    # 1. gravity_regime (weight 2.0)
    g_a, g_b = a.get("gravity_regime", "microgravity"), b.get("gravity_regime", "microgravity")
    sim_g = 1.0 if g_a == g_b else 0.0
    criteria.append(("gravity_regime", 2.0, sim_g, True, g_a, g_b))

    # 2. material (weight 2.0)
    mat_a = str(a.get("material_normalized", "")).strip().lower()
    mat_b = str(b.get("material_normalized", "")).strip().lower()
    if mat_a == mat_b:
        sim_mat = 1.0
    elif mat_a in mat_b or mat_b in mat_a:
        sim_mat = 0.5
    else:
        sim_mat = 0.0
    criteria.append(("material", 2.0, sim_mat, True, a.get("material_normalized"), b.get("material_normalized")))

    # 3. geometry (weight 1.5)
    geom_a, geom_b = a.get("geometry", "unknown"), b.get("geometry", "unknown")
    sim_geom = 1.0 if geom_a == geom_b else 0.0
    criteria.append(("geometry", 1.5, sim_geom, True, geom_a, geom_b))

    # 4. flow_regime (weight 1.5)
    flow_a, flow_b = a.get("flow_regime", "unknown"), b.get("flow_regime", "unknown")
    sim_flow = 1.0 if flow_a == flow_b else 0.0
    criteria.append(("flow_regime", 1.5, sim_flow, True, flow_a, flow_b))

    # 5. experimental_scale (weight 1.5)
    scale_a = _get_scale_category(a)
    scale_b = _get_scale_category(b)
    if scale_a == scale_b:
        sim_scale = 1.0
    elif {scale_a, scale_b} == {"small_scale_glovebox", "large_scale_spacecraft"}:
        sim_scale = 0.35  # Both are solid combustion, but vastly different spatial scales
    else:
        sim_scale = 0.0
    criteria.append(("experimental_scale", 1.5, sim_scale, True, scale_a, scale_b))

    # 6. o2_initial_pct (weight 2.0)
    o2_a = _extract_o2(ma)
    o2_b = _extract_o2(mb)
    if o2_a is not None and o2_b is not None:
        o2_sim = max(0.0, 1.0 - abs(o2_a - o2_b) / 10.0)
        criteria.append(("o2_initial_pct", 2.0, o2_sim, True, f"{o2_a}%", f"{o2_b}%"))
    else:
        criteria.append(("o2_initial_pct", 2.0, 0.0, False, o2_a, o2_b))

    # 7. airflow_initial_cm_s (weight 1.5)
    air_a = _extract_airflow(ma)
    air_b = _extract_airflow(mb)
    if air_a is not None and air_b is not None:
        air_sim = max(0.0, 1.0 - abs(air_a - air_b) / 20.0)
        criteria.append(("airflow_initial_cm_s", 1.5, air_sim, True, f"{air_a} cm/s", f"{air_b} cm/s"))
    else:
        criteria.append(("airflow_initial_cm_s", 1.5, 0.0, False, air_a, air_b))

    # 8. pressure_kpa (weight 1.0)
    p_a = _extract_pressure_kpa(ma, a["investigation_id"])
    p_b = _extract_pressure_kpa(mb, b["investigation_id"])
    if p_a is not None and p_b is not None:
        p_sim = max(0.0, 1.0 - abs(p_a - p_b) / 50.0)
        criteria.append(("pressure_kpa", 1.0, p_sim, True, f"{p_a} kPa", f"{p_b} kPa"))
    else:
        criteria.append(("pressure_kpa", 1.0, 0.0, False, p_a, p_b))

    # 9. characteristic_dimension_mm (weight 1.0)
    dim_a = a.get("thickness_mm") or a.get("diameter_mm") or a.get("width_mm")
    dim_b = b.get("thickness_mm") or b.get("diameter_mm") or b.get("width_mm")
    if dim_a is not None and dim_b is not None and max(dim_a, dim_b) > 0:
        dim_sim = min(dim_a, dim_b) / max(dim_a, dim_b)
        criteria.append(("characteristic_dimension_mm", 1.0, dim_sim, True, f"{dim_a} mm", f"{dim_b} mm"))
    else:
        criteria.append(("characteristic_dimension_mm", 1.0, 0.0, False, dim_a, dim_b))

    # Formula: S = 100 * sum(w_i * m_i * s_i) / sum(w_i * m_i), C = 100 * sum(w_i * m_i) / sum(w_i)
    total_w = sum(w for _, w, _, _, _, _ in criteria)
    avail_w = sum(w for _, w, _, avail, _, _ in criteria if avail)
    matched_w = sum(w * sim for _, w, sim, avail, _, _ in criteria if avail)

    similarity_score = round(100.0 * matched_w / avail_w, 1) if avail_w > 0 else 0.0
    coverage_pct = round(100.0 * avail_w / total_w, 1)

    # Scientific Comparability Rules
    warnings = []
    if cross_domain:
        warnings.append(
            f"Cross-investigation comparison ({a['investigation_id']} vs. {b['investigation_id']}): "
            "findings represent complementary fire-safety evidence across different physical phenomena "
            "(e.g. solid flame spread vs. droplet extinction vs. smoke aerosol pyrolysis) and are NOT directly interchangeable."
        )

    # Scale divergence rule (BASS-II vs SAFFIRE)
    if {a["investigation_id"], b["investigation_id"]} == {"BASS-II", "SAFFIRE"}:
        warnings.append(
            "Scale Divergence: BASS-II uses small-scale flow duct samples (1-2 cm wide) inside the ISS MSG, "
            "whereas SAFFIRE uses full-scale spacecraft composite/fabric panels (0.4 m x 0.94 m) in Cygnus. "
            "Large-scale radiative preheating and concurrent flame spread rates differ by up to an order of magnitude."
        )

    if a.get("geometry") != b.get("geometry"):
        warnings.append(
            f"Geometry mismatch ({a.get('geometry')} vs. {b.get('geometry')}): "
            "solid heat-loss length scales, surface-to-volume ratios, and extinction mechanisms differ."
        )

    if a.get("flow_regime") != b.get("flow_regime"):
        warnings.append(f"Flow regime mismatch ({a.get('flow_regime')} vs. {b.get('flow_regime')}).")

    # Sensor quality flags
    for exp_id, m_dict in [(experiment_a, ma), (experiment_b, mb)]:
        for p, item in m_dict.items():
            if item.get("quality_status") in ("suspect", "over_range"):
                warnings.append(
                    f"{exp_id} measurement '{p}' has quality_status='{item['quality_status']}' (raw='{item.get('raw_value')}')."
                )

    return {
        "experiment_a": experiment_a,
        "experiment_b": experiment_b,
        "investigation_a": a["investigation_id"],
        "investigation_b": b["investigation_id"],
        "comparability_mode": "cross_domain_complementary" if cross_domain else "within_investigation",
        "similarity_score": similarity_score,
        "data_coverage_pct": coverage_pct,
        "breakdown": [
            {
                "parameter": name,
                "weight": w,
                "available": avail,
                "value_a": va,
                "value_b": vb,
                "similarity_pct": round(sim * 100, 1) if avail else None,
            }
            for name, w, sim, avail, va, vb in criteria
        ],
        "scientific_warnings": warnings,
    }
