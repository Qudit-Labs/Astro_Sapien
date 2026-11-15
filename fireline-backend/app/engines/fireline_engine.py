import re
from pathlib import Path
from app.database.connection import get_connection


def search_evidence_chunks(query: str, investigation_id: str | None = None, limit: int = 8, db_path: Path | None = None) -> list[dict]:
    tokens = [t for t in re.findall(r"[a-zA-Z0-9_]+", query) if len(t) >= 2]
    if not tokens:
        return []
    fts_query = " OR ".join(f'"{t}"' for t in tokens[:10])

    sql = """
        SELECT c.source_id, c.investigation_id, c.page_number, c.section_title, c.content_text,
               s.title AS source_title, s.psi_id, s.url AS source_url, bm25(evidence_chunks) AS rank
        FROM evidence_chunks c
        JOIN sources s ON c.source_id = s.id
        WHERE evidence_chunks MATCH ?
    """
    params: list = [fts_query]
    if investigation_id:
        sql += " AND c.investigation_id = ?"
        params.append(investigation_id)
    sql += " ORDER BY rank LIMIT ?"
    params.append(limit)

    with get_connection(db_path) as conn:
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]


def analyze_combustion_evidence(
    material: str | None = None,
    flow_regime: str | None = None,
    min_o2_pct: float | None = None,
    max_o2_pct: float | None = None,
    pillar: str | None = None,
    db_path: Path | None = None,
) -> dict:
    sql = """
        SELECT t.*, m_o2.normalized_value AS o2_initial_pct, m_o2f.normalized_value AS o2_final_pct,
               m_air.normalized_value AS airflow_initial_cm_s, m_co.normalized_value AS co_final_ppm,
               m_co.quality_status AS co_status
        FROM test_runs t
        LEFT JOIN measurements m_o2 ON t.id = m_o2.test_run_id AND m_o2.parameter = 'o2_initial_pct'
        LEFT JOIN measurements m_o2f ON t.id = m_o2f.test_run_id AND m_o2f.parameter = 'o2_final_pct'
        LEFT JOIN measurements m_air ON t.id = m_air.test_run_id AND m_air.parameter = 'airflow_initial_cm_s'
        LEFT JOIN measurements m_co ON t.id = m_co.test_run_id AND m_co.parameter = 'co_final_ppm'
        WHERE t.investigation_id = 'BASS-II'
    """
    params: list = []
    if material:
        sql += " AND LOWER(t.material_normalized) = LOWER(?)"
        params.append(material)
    if flow_regime:
        sql += " AND LOWER(t.flow_regime) = LOWER(?)"
        params.append(flow_regime)
    if min_o2_pct is not None:
        sql += " AND m_o2.normalized_value >= ?"
        params.append(min_o2_pct)
    if max_o2_pct is not None:
        sql += " AND m_o2.normalized_value <= ?"
        params.append(max_o2_pct)

    with get_connection(db_path) as conn:
        runs = [dict(r) for r in conn.execute(sql + " ORDER BY t.raw_row_index", params).fetchall()]
        f_sql = "SELECT f.*, s.title AS source_title, s.psi_id FROM findings f JOIN sources s ON f.source_id = s.id WHERE 1=1"
        f_params: list = []
        if pillar:
            f_sql += " AND LOWER(f.pillar) = LOWER(?)"
            f_params.append(pillar)
        findings = [dict(r) for r in conn.execute(f_sql, f_params).fetchall()]

    o2_vals = [r["o2_initial_pct"] for r in runs if r["o2_initial_pct"] is not None]
    air_vals = [r["airflow_initial_cm_s"] for r in runs if r["airflow_initial_cm_s"] is not None]
    ext_counts: dict[str, int] = {}
    for r in runs:
        em = r["extinction_mode"] or "not_reported"
        ext_counts[em] = ext_counts.get(em, 0) + 1

    return {
        "matched_test_runs": len(runs),
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
            "NASA PSI provides microgravity (ISS) and 1-g ground reference combustion data, "
            "but does not contain validated partial-gravity datasets for Lunar (1/6 g) or Martian (3/8 g) environments."
        ),
    }
