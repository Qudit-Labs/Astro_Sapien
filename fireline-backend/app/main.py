from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.core.config import DB_PATH
from app.database.connection import get_connection
from app.database.schema import init_db
from app.engines.fireline_engine import analyze_combustion_evidence, search_evidence_chunks
from app.engines.testmatch_engine import compare_test_runs
from app.engines.smokewise_engine import analyze_smoke_aerosols
from app.ai.gemini_rag import answer_research_question

app = FastAPI(
    title="FIRELINE Spacecraft Fire-Safety Intelligence API",
    description="Unified scientific evidence engine over NASA PSI-25 (BASS-II) and PSI-101 (SAME-R) microgravity combustion & smoke aerosol datasets.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db(DB_PATH)


@app.get("/health")
def health_check():
    with get_connection(DB_PATH) as conn:
        runs = conn.execute("SELECT COUNT(*) FROM test_runs").fetchone()[0]
        chunks = conn.execute("SELECT COUNT(*) FROM evidence_chunks").fetchone()[0]
    return {"status": "ok", "test_runs_loaded": runs, "evidence_chunks_indexed": chunks}


@app.get("/api/v1/investigations")
def list_investigations():
    with get_connection(DB_PATH) as conn:
        rows = conn.execute("""
            SELECT i.*, COUNT(t.id) AS test_run_count
            FROM investigations i
            LEFT JOIN test_runs t ON i.id = t.investigation_id
            GROUP BY i.id
            ORDER BY i.psi_id
        """).fetchall()
        return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/investigations/{investigation_id}")
def get_investigation(investigation_id: str):
    with get_connection(DB_PATH) as conn:
        inv = conn.execute("SELECT * FROM investigations WHERE LOWER(id) = LOWER(?)", (investigation_id,)).fetchone()
        if not inv:
            raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found")
        sources = conn.execute("SELECT * FROM sources WHERE investigation_id = ?", (inv["id"],)).fetchall()
        findings = conn.execute("SELECT * FROM findings WHERE investigation_id = ?", (inv["id"],)).fetchall()
        return {
            "investigation": dict(inv),
            "sources": [dict(s) for s in sources],
            "findings": [dict(f) for f in findings],
        }


@app.get("/api/v1/tests")
def list_tests(
    investigation_id: str | None = Query(None, description="BASS-II or SAME-R"),
    material: str | None = Query(None, description="PMMA, SIBAL, Kapton, Pyrell, Silicone, Lampwick, Teflon"),
    geometry: str | None = Query(None, description="film, slab, rod, spherical_section, fabric, heated_wire_sample"),
    flow_regime: str | None = Query(None, description="opposed, concurrent, concurrent_stagnation, quiescent, forced_flow"),
    limit: int = Query(200, ge=1, le=500),
):
    sql = "SELECT * FROM test_runs WHERE 1=1"
    params: list = []
    if investigation_id:
        sql += " AND LOWER(investigation_id) = LOWER(?)"
        params.append(investigation_id)
    if material:
        sql += " AND LOWER(material_normalized) = LOWER(?)"
        params.append(material)
    if geometry:
        sql += " AND LOWER(geometry) = LOWER(?)"
        params.append(geometry)
    if flow_regime:
        sql += " AND LOWER(flow_regime) = LOWER(?)"
        params.append(flow_regime)

    with get_connection(DB_PATH) as conn:
        rows = conn.execute(sql + " ORDER BY investigation_id, raw_row_index LIMIT ?", params + [limit]).fetchall()
        return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/tests/{test_id}")
def get_test_detail(test_id: str):
    with get_connection(DB_PATH) as conn:
        run = conn.execute("SELECT * FROM test_runs WHERE id = ?", (test_id,)).fetchone()
        if not run:
            raise HTTPException(status_code=404, detail=f"Test run '{test_id}' not found")
        meas = conn.execute(
            "SELECT parameter, raw_value, normalized_value, unit, quality_status FROM measurements WHERE test_run_id = ?",
            (test_id,),
        ).fetchall()
        src = conn.execute("SELECT * FROM sources WHERE id = ?", (run["source_id"],)).fetchone()
        return {
            "test_run": dict(run),
            "measurements": [dict(m) for m in meas],
            "provenance": dict(src) if src else None,
        }


@app.get("/api/v1/evidence/search")
def search_evidence(
    q: str = Query(..., min_length=2, description="Scientific search phrase"),
    investigation_id: str | None = Query(None),
    limit: int = Query(8, ge=1, le=25),
):
    results = search_evidence_chunks(q, investigation_id=investigation_id, limit=limit, db_path=DB_PATH)
    return {"query": q, "count": len(results), "results": results}


@app.get("/api/v1/sources/{source_id}")
def get_source(source_id: str):
    with get_connection(DB_PATH) as conn:
        src = conn.execute("SELECT * FROM sources WHERE id = ?", (source_id,)).fetchone()
        if not src:
            raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found")
        return dict(src)


class FirelineAnalyzeRequest(BaseModel):
    material: str | None = None
    flow_regime: str | None = None
    min_o2_pct: float | None = None
    max_o2_pct: float | None = None
    pillar: str | None = None


@app.post("/api/v1/fireline/analyze")
def fireline_analyze(req: FirelineAnalyzeRequest):
    return analyze_combustion_evidence(
        material=req.material,
        flow_regime=req.flow_regime,
        min_o2_pct=req.min_o2_pct,
        max_o2_pct=req.max_o2_pct,
        pillar=req.pillar,
        db_path=DB_PATH,
    )


class TestMatchRequest(BaseModel):
    experiment_a: str = Field(..., example="PSI-25:B1")
    experiment_b: str = Field(..., example="PSI-25:B4")


@app.post("/api/v1/testmatch/compare")
def testmatch_compare(req: TestMatchRequest):
    try:
        return compare_test_runs(req.experiment_a, req.experiment_b, db_path=DB_PATH)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


class SmokewiseRequest(BaseModel):
    material: str | None = None


@app.post("/api/v1/smokewise/analyze")
def smokewise_analyze(req: SmokewiseRequest):
    return analyze_smoke_aerosols(material=req.material, db_path=DB_PATH)


class AssistantQueryRequest(BaseModel):
    question: str = Field(..., min_length=4)
    investigation_id: str | None = None


@app.post("/api/v1/assistant/query")
def assistant_query(req: AssistantQueryRequest):
    return answer_research_question(req.question, investigation_id=req.investigation_id, db_path=DB_PATH)


class ReportRequest(BaseModel):
    topic: str = Field(default="Spacecraft Fire Prevention, Detection, and Suppression Synthesis")
    experiment_a: str = Field(default="PSI-25:B1")
    experiment_b: str = Field(default="PSI-101:TBL1-KAPTON-U")


@app.post("/api/v1/reports/generate")
def generate_integrated_report(req: ReportRequest):
    combustion = analyze_combustion_evidence(db_path=DB_PATH)
    smoke = analyze_smoke_aerosols(db_path=DB_PATH)
    comparison = compare_test_runs(req.experiment_a, req.experiment_b, db_path=DB_PATH)
    return {
        "report_title": f"FIRELINE Integrated Research Report: {req.topic}",
        "pillars": {
            "prevention_and_suppression_bass2": combustion,
            "detection_and_aerosols_samer": {
                "total_records": smoke["total_records"],
                "material_summary": smoke["material_summary"],
                "detector_implications": smoke["detector_implications"],
            },
            "cross_experiment_comparability_testmatch": comparison,
        },
        "provenance_manifest": [
            {"psi_id": "PSI-25", "title": "BASS-II Experimental Table & NASA/TM-20210011385"},
            {"psi_id": "PSI-101", "title": "SAMER Final Report & AIAA 2012-3536"},
        ],
    }
