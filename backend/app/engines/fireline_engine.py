import re
from app.database.connection import get_connection


def search_evidence_chunks(
    query: str,
    investigation_id: str | None = None,
    limit: int = 8,
    conn_str: str | None = None,
) -> list[dict]:
    clean_query = query.strip()
    if not clean_query:
        return []

    sql = """
        SELECT c.source_id, c.investigation_id, c.page_number, c.section_title, c.content_text,
               s.title AS source_title, s.psi_id, s.url AS source_url,
               ts_rank(c.search_tsv, websearch_to_tsquery('english', %s)) AS rank
        FROM evidence_chunks c
        JOIN sources s ON c.source_id = s.id
        WHERE c.search_tsv @@ websearch_to_tsquery('english', %s)
    """
    params: list = [clean_query, clean_query]
    if investigation_id:
        sql += " AND c.investigation_id = %s"
        params.append(investigation_id)

    sql += " ORDER BY rank DESC LIMIT %s;"
    params.append(limit)

    with get_connection(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]


def analyze_combustion_evidence(
    investigation_id: str | None = None,
    pillar: str | None = None,
    material: str | None = None,
    flow_regime: str | None = None,
    geometry: str | None = None,
    min_o2_pct: float | None = None,
    max_o2_pct: float | None = None,
    conn_str: str | None = None,
) -> dict:
    sql = """
        SELECT t.*,
               COALESCE(m_o2.normalized_value, m_o2_alt.normalized_value) AS o2_initial_pct,
               m_o2f.normalized_value AS o2_final_pct,
               COALESCE(m_air.normalized_value, m_air_alt.normalized_value) AS airflow_initial_cm_s,
               m_co.normalized_value AS co_final_ppm,
               m_co.quality_status AS co_status,
               m_k.normalized_value AS burning_rate_constant_mm2_s,
               m_ext.normalized_value AS flame_extinction_diameter_mm
        FROM test_runs t
        LEFT JOIN measurements m_o2 ON t.id = m_o2.test_run_id AND m_o2.parameter = 'o2_initial_pct'
        LEFT JOIN measurements m_o2_alt ON t.id = m_o2_alt.test_run_id AND m_o2_alt.parameter IN ('o2_pct', 'o2_vol_pct')
        LEFT JOIN measurements m_o2f ON t.id = m_o2f.test_run_id AND m_o2f.parameter = 'o2_final_pct'
        LEFT JOIN measurements m_air ON t.id = m_air.test_run_id AND m_air.parameter = 'airflow_initial_cm_s'
        LEFT JOIN measurements m_air_alt ON t.id = m_air_alt.test_run_id AND m_air_alt.parameter IN ('airflow_velocity_cm_s', 'airflow_calibrated_cm_s')
        LEFT JOIN measurements m_co ON t.id = m_co.test_run_id AND m_co.parameter = 'co_final_ppm'
        LEFT JOIN measurements m_k ON t.id = m_k.test_run_id AND m_k.parameter = 'burning_rate_constant_mm2_s'
        LEFT JOIN measurements m_ext ON t.id = m_ext.test_run_id AND m_ext.parameter = 'flame_extinction_diameter_mm'
        WHERE 1=1
    """
    params: list = []

    if investigation_id:
        sql += " AND t.investigation_id = %s"
        params.append(investigation_id)
    else:
        sql += " AND t.investigation_id IN ('BASS-II', 'SAFFIRE', 'FLEX')"

    if material:
        sql += " AND LOWER(t.material_normalized) = LOWER(%s)"
        params.append(material)

    if flow_regime:
        sql += " AND LOWER(t.flow_regime) = LOWER(%s)"
        params.append(flow_regime)

    if geometry:
        sql += " AND LOWER(t.geometry) = LOWER(%s)"
        params.append(geometry)

    if min_o2_pct is not None:
        sql += " AND COALESCE(m_o2.normalized_value, m_o2_alt.normalized_value) >= %s"
        params.append(min_o2_pct)

    if max_o2_pct is not None:
        sql += " AND COALESCE(m_o2.normalized_value, m_o2_alt.normalized_value) <= %s"
        params.append(max_o2_pct)

    sql += " ORDER BY t.investigation_id, t.raw_row_index;"

    with get_connection(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            runs = [dict(r) for r in cur.fetchall()]

            f_sql = """
                SELECT f.*, s.title AS source_title, s.psi_id, s.url AS source_url
                FROM findings f
                JOIN sources s ON f.source_id = s.id
                WHERE 1=1
            """
            f_params: list = []
            if pillar:
                f_sql += " AND LOWER(f.pillar) = LOWER(%s)"
                f_params.append(pillar)
            if investigation_id:
                f_sql += " AND f.investigation_id = %s"
                f_params.append(investigation_id)
            else:
                f_sql += " AND f.investigation_id IN ('BASS-II', 'SAFFIRE', 'FLEX')"

            f_sql += " ORDER BY f.id;"
            cur.execute(f_sql, f_params)
            findings = [dict(r) for r in cur.fetchall()]

    o2_vals = [r["o2_initial_pct"] for r in runs if r.get("o2_initial_pct") is not None]
    air_vals = [r["airflow_initial_cm_s"] for r in runs if r.get("airflow_initial_cm_s") is not None]
    
    ext_counts: dict[str, int] = {}
    inv_counts: dict[str, int] = {}
    for r in runs:
        em = r.get("extinction_mode") or "not_reported"
        ext_counts[em] = ext_counts.get(em, 0) + 1
        inv = r.get("investigation_id") or "unknown"
        inv_counts[inv] = inv_counts.get(inv, 0) + 1

    return {
        "matched_test_runs": len(runs),
        "investigation_breakdown": inv_counts,
        "summary_metrics": {
            "o2_initial_min_pct": min(o2_vals) if o2_vals else None,
            "o2_initial_max_pct": max(o2_vals) if o2_vals else None,
            "airflow_initial_min_cm_s": min(air_vals) if air_vals else None,
            "airflow_initial_max_cm_s": max(air_vals) if air_vals else None,
            "extinction_modes": ext_counts,
        },
        "curated_findings": findings,
        "sample_runs": runs[:25],
        "scientific_limitation": (
            "NASA Physical Sciences Informatics (PSI) provides validated microgravity (ISS / Cygnus) "
            "and normal-gravity (1-g) reference combustion data across BASS-II, SAFFIRE, and FLEX, "
            "but strictly lacks validated partial-gravity flammability datasets for Lunar (1/6 g) or Martian (3/8 g) spacecraft atmospheres."
        ),
    }
