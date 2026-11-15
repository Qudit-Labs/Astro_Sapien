from pathlib import Path
from app.database.connection import get_connection


def compare_test_runs(experiment_a: str, experiment_b: str, db_path: Path | None = None) -> dict:
    with get_connection(db_path) as conn:
        a = conn.execute("SELECT * FROM test_runs WHERE id = ?", (experiment_a,)).fetchone()
        b = conn.execute("SELECT * FROM test_runs WHERE id = ?", (experiment_b,)).fetchone()
        if not a or not b:
            raise KeyError("One or both experiment IDs were not found in test_runs.")

        def get_meas(run_id: str) -> dict:
            rows = conn.execute("SELECT * FROM measurements WHERE test_run_id = ?", (run_id,)).fetchall()
            return {r["parameter"]: dict(r) for r in rows}

        ma = get_meas(experiment_a)
        mb = get_meas(experiment_b)

    a, b = dict(a), dict(b)
    cross_domain = a["investigation_id"] != b["investigation_id"]

    # Weighted comparability equation: S = 100 * sum(w*m*s)/sum(w*m), C = 100 * sum(w*m)/sum(w)
    criteria = [
        ("gravity_regime", 2.0, 1.0 if a["gravity_regime"] == b["gravity_regime"] else 0.0, True, a["gravity_regime"], b["gravity_regime"]),
        ("material", 2.0, 1.0 if a["material_normalized"].lower() == b["material_normalized"].lower() else 0.0, True, a["material_normalized"], b["material_normalized"]),
        ("geometry", 1.5, 1.0 if a["geometry"] == b["geometry"] else 0.0, True, a["geometry"], b["geometry"]),
        ("flow_regime", 1.5, 1.0 if a["flow_regime"] == b["flow_regime"] else 0.0, True, a["flow_regime"], b["flow_regime"]),
    ]

    # O2 initial
    o2_a = ma.get("o2_initial_pct", {}).get("normalized_value")
    o2_b = mb.get("o2_initial_pct", {}).get("normalized_value")
    if o2_a is not None and o2_b is not None:
        o2_sim = max(0.0, 1.0 - abs(o2_a - o2_b) / 10.0)
        criteria.append(("o2_initial_pct", 2.0, o2_sim, True, f"{o2_a}%", f"{o2_b}%"))
    else:
        criteria.append(("o2_initial_pct", 2.0, 0.0, False, o2_a, o2_b))

    # Airflow initial
    air_a = ma.get("airflow_initial_cm_s", {}).get("normalized_value")
    air_b = mb.get("airflow_initial_cm_s", {}).get("normalized_value")
    if air_a is not None and air_b is not None:
        air_sim = max(0.0, 1.0 - abs(air_a - air_b) / 20.0)
        criteria.append(("airflow_initial_cm_s", 1.5, air_sim, True, f"{air_a} cm/s", f"{air_b} cm/s"))
    else:
        criteria.append(("airflow_initial_cm_s", 1.5, 0.0, False, air_a, air_b))

    # Characteristic thickness or diameter
    dim_a = a["thickness_mm"] or a["diameter_mm"]
    dim_b = b["thickness_mm"] or b["diameter_mm"]
    if dim_a is not None and dim_b is not None and max(dim_a, dim_b) > 0:
        dim_sim = min(dim_a, dim_b) / max(dim_a, dim_b)
        criteria.append(("characteristic_dimension_mm", 1.0, dim_sim, True, f"{dim_a} mm", f"{dim_b} mm"))
    else:
        criteria.append(("characteristic_dimension_mm", 1.0, 0.0, False, dim_a, dim_b))

    total_w = sum(w for _, w, _, _, _, _ in criteria)
    avail_w = sum(w for _, w, _, avail, _, _ in criteria if avail)
    matched_w = sum(w * sim for _, w, sim, avail, _, _ in criteria if avail)

    similarity_score = round(100.0 * matched_w / avail_w, 1) if avail_w > 0 else 0.0
    coverage_pct = round(100.0 * avail_w / total_w, 1)

    warnings = []
    if cross_domain:
        warnings.append(
            f"Cross-investigation comparison ({a['investigation_id']} vs. {b['investigation_id']}): "
            "findings represent complementary fire-safety evidence across different physical phenomena and are NOT directly interchangeable."
        )
    if a["geometry"] != b["geometry"]:
        warnings.append(f"Geometry mismatch ({a['geometry']} vs. {b['geometry']}): heat-loss length scales and flame spread mechanisms differ.")
    if a["flow_regime"] != b["flow_regime"]:
        warnings.append(f"Flow direction/regime mismatch ({a['flow_regime']} vs. {b['flow_regime']}).")

    for label, m_dict in [(experiment_a, ma), (experiment_b, mb)]:
        for p, item in m_dict.items():
            if item["quality_status"] in ("suspect", "over_range"):
                warnings.append(
                    f"{label} measurement '{p}' has quality_status='{item['quality_status']}' (raw='{item['raw_value']}')."
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
