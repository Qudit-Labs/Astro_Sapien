from pathlib import Path
from app.database.connection import get_connection


def analyze_smoke_aerosols(material: str | None = None, db_path: Path | None = None) -> dict:
    sql = """
        SELECT t.id, t.test_code, t.material_normalized AS material, t.aging_state, t.flow_regime, t.notes,
               m_flow.normalized_value AS airflow_cm_s,
               m_age.normalized_value AS aging_time_s,
               m_dg.normalized_value AS geometric_mean_diameter_nm,
               m_cmd.normalized_value AS count_mean_diameter_nm,
               m_dmm.normalized_value AS diameter_average_mass_nm,
               m_sig.normalized_value AS geometric_std_dev,
               m_temp.normalized_value AS pyrolysis_temp_c
        FROM test_runs t
        LEFT JOIN measurements m_flow ON t.id = m_flow.test_run_id AND m_flow.parameter = 'airflow_initial_cm_s'
        LEFT JOIN measurements m_age ON t.id = m_age.test_run_id AND m_age.parameter = 'aging_time_s'
        LEFT JOIN measurements m_dg ON t.id = m_dg.test_run_id AND m_dg.parameter = 'geometric_mean_diameter_nm'
        LEFT JOIN measurements m_cmd ON t.id = m_cmd.test_run_id AND m_cmd.parameter = 'count_mean_diameter_nm'
        LEFT JOIN measurements m_dmm ON t.id = m_dmm.test_run_id AND m_dmm.parameter = 'diameter_average_mass_nm'
        LEFT JOIN measurements m_sig ON t.id = m_sig.test_run_id AND m_sig.parameter = 'geometric_std_dev'
        LEFT JOIN measurements m_temp ON t.id = m_temp.test_run_id AND m_temp.parameter = 'pyrolysis_temp_c'
        WHERE t.investigation_id = 'SAME-R'
    """
    params: list = []
    if material:
        sql += " AND LOWER(t.material_normalized) = LOWER(?)"
        params.append(material)

    with get_connection(db_path) as conn:
        records = [dict(r) for r in conn.execute(sql + " ORDER BY t.raw_row_index", params).fetchall()]

    # Aggregate by material for frontend bar/scatter charts
    by_material: dict[str, dict] = {}
    for r in records:
        mat = r["material"]
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
        dmm = r["diameter_average_mass_nm"]
        if dmm is not None:
            if r["aging_state"] == "unaged":
                bucket["unaged_dmm_nm"].append(dmm)
            elif r["aging_state"] == "aged":
                bucket["aged_dmm_nm"].append(dmm)
            if r["airflow_cm_s"] == 0.0:
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

    # Aging trajectory series (aging_time_s vs diameter_average_mass_nm)
    aging_series = [
        {
            "test_code": r["test_code"],
            "material": r["material"],
            "aging_state": r["aging_state"],
            "airflow_cm_s": r["airflow_cm_s"],
            "aging_time_s": r["aging_time_s"],
            "geometric_mean_diameter_nm": r["geometric_mean_diameter_nm"],
            "diameter_average_mass_nm": r["diameter_average_mass_nm"],
        }
        for r in records
        if r["aging_time_s"] is not None and r["diameter_average_mass_nm"] is not None
    ]

    return {
        "total_records": len(records),
        "material_summary": material_summary,
        "aging_trajectory_series": aging_series,
        "records": records,
        "detector_implications": {
            "iss_near_ir_detector": "Most sensitive to particles > 1000 nm; struggles with fresh sub-100 nm Kapton/Teflon pyrolysis smoke.",
            "shuttle_ionization_detector": "Sensitive to sub-micron count/first moment, but vulnerable to saturation or dust.",
            "mpass_two_moment_prototype": "Reduces response variance by >2x across materials by combining two scattering angles to separate smoke from large dust.",
        },
    }
