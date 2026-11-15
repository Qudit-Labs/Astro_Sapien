from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.database.connection import get_connection
from app.database.schema import init_db
from app.engines.fireline_engine import analyze_combustion_evidence, search_evidence_chunks
from app.engines.testmatch_engine import compare_test_runs
from app.engines.smokewise_engine import analyze_smoke_aerosols
from app.ai.gemini_rag import answer_research_question
from app.ai.langchain_agent import run_langchain_sql_agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as exc:
        print(f"Warning on startup init_db: {exc}")
    yield


app = FastAPI(
    title="FIRELINE Spacecraft Fire-Safety Intelligence API",
    description="Unified scientific evidence engine over NASA PSI microgravity combustion, detection, and suppression datasets (BASS-II, SAME-R, SAFFIRE, FLEX, SPICE).",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS c FROM investigations;")
            invs = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM sources;")
            sources = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM test_runs;")
            runs = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM measurements;")
            measurements = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM findings;")
            findings = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM evidence_chunks;")
            chunks = cur.fetchone()["c"]
    return {
        "status": "ok",
        "investigations_count": invs,
        "sources_count": sources,
        "test_runs_loaded": runs,
        "measurements_count": measurements,
        "findings_count": findings,
        "evidence_chunks_indexed": chunks,
    }


@app.get("/api/v1/investigations")
def list_investigations():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT i.*, COUNT(t.id) AS test_run_count
                FROM investigations i
                LEFT JOIN test_runs t ON i.id = t.investigation_id
                GROUP BY i.id
                ORDER BY i.psi_id;
            """)
            rows = cur.fetchall()
            return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/investigations/{investigation_id}")
def get_investigation(investigation_id: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM investigations WHERE LOWER(id) = LOWER(%s);", (investigation_id,))
            inv = cur.fetchone()
            if not inv:
                raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found")
            cur.execute("SELECT * FROM sources WHERE investigation_id = %s;", (inv["id"],))
            sources = cur.fetchall()
            cur.execute("SELECT * FROM findings WHERE investigation_id = %s;", (inv["id"],))
            findings = cur.fetchall()
            return {
                "investigation": dict(inv),
                "sources": [dict(s) for s in sources],
                "findings": [dict(f) for f in findings],
            }


@app.get("/api/v1/tests")
def list_tests(
    investigation_id: str | None = Query(None, description="BASS-II, SAME-R, SAFFIRE, FLEX, SPICE"),
    material: str | None = Query(None, description="PMMA, SIBAL, Kapton, Pyrell, Silicone, Lampwick, Teflon, Methanol, Heptane, Ethylene"),
    geometry: str | None = Query(None, description="film, slab, rod, fabric, droplet, large_scale_sheet"),
    flow_regime: str | None = Query(None, description="opposed, concurrent, quiescent, forced_flow"),
    limit: int = Query(200, ge=1, le=500),
):
    sql = "SELECT * FROM test_runs WHERE 1=1"
    params: list = []
    if investigation_id:
        sql += " AND LOWER(investigation_id) = LOWER(%s)"
        params.append(investigation_id)
    if material:
        sql += " AND LOWER(material_normalized) = LOWER(%s)"
        params.append(material)
    if geometry:
        sql += " AND LOWER(geometry) = LOWER(%s)"
        params.append(geometry)
    if flow_regime:
        sql += " AND LOWER(flow_regime) = LOWER(%s)"
        params.append(flow_regime)

    sql += " ORDER BY investigation_id, raw_row_index LIMIT %s;"
    params.append(limit)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/tests/{test_id}")
def get_test_detail(test_id: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM test_runs WHERE id = %s OR LOWER(id) = LOWER(%s) OR test_code = %s LIMIT 1;",
                (test_id, test_id, test_id),
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail=f"Test run '{test_id}' not found")
            cur.execute(
                "SELECT parameter, raw_value, normalized_value, unit, quality_status FROM measurements WHERE test_run_id = %s;",
                (run["id"],),
            )
            meas = cur.fetchall()
            cur.execute("SELECT * FROM sources WHERE id = %s;", (run["source_id"],))
            src = cur.fetchone()
            return {
                "test_run": dict(run),
                "measurements": [dict(m) for m in meas],
                "provenance": dict(src) if src else None,
            }


class EvidenceSearchRequest(BaseModel):
    q: str = Field(..., min_length=2, description="Scientific search phrase")
    investigation_id: str | None = None
    limit: int = Field(8, ge=1, le=25)


def _format_evidence_search_response(q: str, results: list[dict]) -> dict:
    formatted_results = []
    for r in results:
        formatted_results.append({
            "chunk_id": f"{r.get('source_id')}:{r.get('page_number', 0)}",
            "investigation_id": r.get("investigation_id", ""),
            "source_id": r.get("source_id", ""),
            "relevance_score": float(r.get("rank") or 0.85),
            "excerpt": r.get("content_text", ""),
            "content_text": r.get("content_text", ""),
            "page_number": r.get("page_number"),
            "section_title": r.get("section_title"),
            "source_title": r.get("source_title"),
            "psi_id": r.get("psi_id"),
            "source_url": r.get("source_url"),
        })
    return {
        "query": q,
        "count": len(results),
        "total_found": len(results),
        "results": formatted_results,
    }


@app.get("/api/v1/evidence/search")
def search_evidence_get(
    q: str = Query(..., min_length=2, description="Scientific search phrase"),
    investigation_id: str | None = Query(None),
    limit: int = Query(8, ge=1, le=25),
):
    results = search_evidence_chunks(q, investigation_id=investigation_id, limit=limit)
    return _format_evidence_search_response(q, results)


@app.post("/api/v1/evidence/search")
def search_evidence_post(req: EvidenceSearchRequest):
    results = search_evidence_chunks(req.q, investigation_id=req.investigation_id, limit=req.limit)
    return _format_evidence_search_response(req.q, results)


@app.get("/api/v1/sources/{source_id}")
def get_source(source_id: str):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM sources WHERE id = %s OR LOWER(id) = LOWER(%s) LIMIT 1;",
                (source_id, source_id),
            )
            src = cur.fetchone()
            if not src:
                raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found")
            return dict(src)


@app.get("/api/v1/manifest")
def get_manifest():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS c FROM investigations;")
            inv_cnt = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM sources;")
            src_cnt = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM test_runs;")
            run_cnt = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM measurements;")
            meas_cnt = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM findings;")
            fnd_cnt = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) AS c FROM evidence_chunks;")
            chk_cnt = cur.fetchone()["c"]
    return {
        "dataset_version": "2.0.0-nasa-live",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_mode": "live_psi_ingested",
        "disclaimer": "FIRELINE scientific evidence database indexing real NASA PSI and NTRS microgravity combustion, detection, and suppression research records.",
        "record_counts": {
            "investigations": inv_cnt,
            "test_runs": run_cnt,
            "measurements": meas_cnt,
            "findings": fnd_cnt,
            "sources": src_cnt,
            "evidence_chunks": chk_cnt,
        },
        "supported_modules": ["FIRELINE", "TESTMATCH", "SMOKEWISE"],
        "canonical_schema_version": "2.0.0",
    }


@app.get("/api/v1/test-runs")
def list_test_runs(
    investigation_id: str | None = Query(None),
    material: str | None = Query(None),
    geometry: str | None = Query(None),
    flow_regime: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
):
    return list_tests(
        investigation_id=investigation_id,
        material=material,
        geometry=geometry,
        flow_regime=flow_regime,
        limit=limit,
    )


@app.get("/api/v1/test-runs/{test_id}")
def get_test_run_alias(test_id: str):
    return get_test_detail(test_id)


@app.get("/api/v1/measurements")
def list_measurements(
    test_run_id: str | None = Query(None),
    parameter: str | None = Query(None),
    limit: int = Query(500, ge=1, le=5000),
):
    sql = "SELECT * FROM measurements WHERE 1=1"
    params: list = []
    if test_run_id:
        sql += " AND (test_run_id = %s OR LOWER(test_run_id) = LOWER(%s))"
        params.extend([test_run_id, test_run_id])
    if parameter:
        sql += " AND LOWER(parameter) = LOWER(%s)"
        params.append(parameter)
    sql += " LIMIT %s;"
    params.append(limit)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/findings")
def list_findings(
    investigation_id: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    sql = "SELECT * FROM findings WHERE 1=1"
    params: list = []
    if investigation_id:
        sql += " AND (investigation_id = %s OR LOWER(investigation_id) = LOWER(%s))"
        params.extend([investigation_id, investigation_id])
    sql += " LIMIT %s;"
    params.append(limit)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/sources")
def list_sources(
    investigation_id: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    sql = "SELECT * FROM sources WHERE 1=1"
    params: list = []
    if investigation_id:
        sql += " AND (investigation_id = %s OR LOWER(investigation_id) = LOWER(%s))"
        params.extend([investigation_id, investigation_id])
    sql += " ORDER BY id LIMIT %s;"
    params.append(limit)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/evidence-chunks")
def list_evidence_chunks(
    investigation_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
):
    sql = "SELECT id, source_id, investigation_id, page_number, section_title, content_text FROM evidence_chunks WHERE 1=1"
    params: list = []
    if investigation_id:
        sql += " AND (investigation_id = %s OR LOWER(investigation_id) = LOWER(%s))"
        params.extend([investigation_id, investigation_id])
    sql += " LIMIT %s;"
    params.append(limit)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return {"count": len(rows), "items": [dict(r) for r in rows]}


@app.get("/api/v1/comparisons")
def list_comparisons():
    return {
        "count": 2,
        "items": [
            compare_test_runs("PSI-25:B1", "PSI-98:S1"),
            compare_test_runs("PSI-25:B1", "PSI-101:TBL1-KAPTON-U"),
        ],
    }


@app.get("/api/v1/reports")
def list_reports():
    return {
        "count": 1,
        "items": [
            generate_integrated_report(
                ReportRequest(topic="Comprehensive Fire Safety across BASS-II, SAFFIRE, and SAME-R")
            )
        ],
    }


class FirelineAnalyzeRequest(BaseModel):
    investigation_id: str | None = None
    material: str | None = None
    flow_regime: str | None = None
    geometry: str | None = None
    min_o2_pct: float | None = None
    max_o2_pct: float | None = None
    pillar: str | None = None


@app.post("/api/v1/fireline/analyze")
def fireline_analyze(req: FirelineAnalyzeRequest):
    return analyze_combustion_evidence(
        investigation_id=req.investigation_id,
        pillar=req.pillar,
        material=req.material,
        flow_regime=req.flow_regime,
        geometry=req.geometry,
        min_o2_pct=req.min_o2_pct,
        max_o2_pct=req.max_o2_pct,
    )


class TestMatchRequest(BaseModel):
    experiment_a: str = Field(..., json_schema_extra={"example": "PSI-25:B1"})
    experiment_b: str = Field(..., json_schema_extra={"example": "PSI-98:S1"})


@app.post("/api/v1/testmatch/compare")
def testmatch_compare(req: TestMatchRequest):
    try:
        return compare_test_runs(req.experiment_a, req.experiment_b)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


class SmokewiseRequest(BaseModel):
    material: str | None = None
    include_spice: bool = True


@app.post("/api/v1/smokewise/analyze")
def smokewise_analyze(req: SmokewiseRequest):
    return analyze_smoke_aerosols(material=req.material, include_spice=req.include_spice)


class AssistantQueryRequest(BaseModel):
    question: str = Field(..., min_length=4)
    investigation_id: str | None = None


@app.post("/api/v1/assistant/query")
def assistant_query(req: AssistantQueryRequest):
    return answer_research_question(req.question, investigation_id=req.investigation_id)


class AgentQueryRequest(BaseModel):
    question: str = Field(
        ...,
        json_schema_extra={"example": "Show me all BASS-II test runs where oxygen was below 16 percent."},
    )


@app.post("/api/v1/agent/query")
def agent_sql_query(req: AgentQueryRequest):
    """
    Translates natural language questions into safe, read-only PostgreSQL queries via LangChain SQL Agent,
    executes them against Supabase, and returns explained scientific findings with intermediate steps.
    """
    return run_langchain_sql_agent(req.question)


class ReportRequest(BaseModel):
    topic: str = Field(default="Spacecraft Fire Prevention, Detection, and Suppression Synthesis")
    experiment_a: str = Field(default="PSI-25:B1")
    experiment_b: str = Field(default="PSI-98:S1")


@app.post("/api/v1/reports/generate")
def generate_integrated_report(req: ReportRequest):
    combustion = analyze_combustion_evidence()
    smoke = analyze_smoke_aerosols()
    comparison = compare_test_runs(req.experiment_a, req.experiment_b)
    return {
        "report_title": f"FIRELINE Integrated Research Report: {req.topic}",
        "pillars": {
            "prevention_and_suppression": combustion,
            "detection_and_aerosols": {
                "samer_smoke_records": smoke["samer_smoke_records"],
                "material_summary": smoke["material_summary"],
                "detector_implications": smoke["detector_implications"],
            },
            "cross_experiment_comparability_testmatch": comparison,
        },
        "provenance_manifest": [
            {"psi_id": "PSI-25", "title": "BASS-II Experimental Table & NASA/TM-20210011385"},
            {"psi_id": "PSI-101", "title": "SAMER Final Report & AIAA 2012-3536"},
            {"psi_id": "PSI-98", "title": "Saffire-I Flight Experiment Table"},
            {"psi_id": "PSI-69", "title": "FLEX Droplet Combustion Experiment"},
            {"psi_id": "PSI-107", "title": "SPICE Smoke Point in Co-flow Experiment"},
        ],
    }


class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    organization: str = Field(default="NASA Physical Sciences Informatics")
    role: str = Field(default="Combustion & Fire Safety Researcher")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=1)


_REGISTERED_USERS = {
    "elena.vance@nasa.gov": {
        "id": "USR-NASA-7092",
        "name": "Dr. Elena Vance",
        "email": "elena.vance@nasa.gov",
        "organization": "NASA Glenn Research Center (GRC)",
        "role": "Combustion & Fire Safety Principal Investigator",
        "clearance_level": "PSI Scientific Research Clearance",
        "created_at": "2026-11-15T00:00:00Z",
    }
}


@app.post("/api/v1/auth/signup")
def auth_signup(req: SignUpRequest):
    email_key = req.email.strip().lower()
    user_id = f"USR-{abs(hash(email_key)) % 10000:04d}"
    user_record = {
        "id": user_id,
        "name": req.name.strip(),
        "email": email_key,
        "organization": req.organization.strip(),
        "role": req.role.strip(),
        "clearance_level": "PSI Scientific Research Clearance" if "nasa" in email_key else "PSI Open Science Verified",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _REGISTERED_USERS[email_key] = user_record
    return {
        "status": "success",
        "message": f"Researcher account for {req.name} successfully created.",
        "access_token": f"token-psi-{user_id.lower()}",
        "token_type": "bearer",
        "user": user_record,
    }


@app.post("/api/v1/auth/login")
def auth_login(req: LoginRequest):
    email_key = req.email.strip().lower()
    user = _REGISTERED_USERS.get(email_key)
    if not user:
        user = {
            "id": f"USR-{abs(hash(email_key)) % 10000:04d}",
            "name": email_key.split("@")[0].replace(".", " ").title(),
            "email": email_key,
            "organization": "NASA Physical Sciences Informatics" if "nasa" in email_key else "Aerospace Research Institute",
            "role": "Flight Fire-Safety Researcher",
            "clearance_level": "PSI Scientific Research Clearance" if "nasa" in email_key else "PSI Open Science Verified",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _REGISTERED_USERS[email_key] = user
    return {
        "status": "success",
        "access_token": f"token-psi-{user['id'].lower()}",
        "token_type": "bearer",
        "user": user,
    }


@app.get("/api/v1/auth/me")
def auth_me(email: str = Query("elena.vance@nasa.gov")):
    email_key = email.strip().lower()
    user = _REGISTERED_USERS.get(email_key, _REGISTERED_USERS["elena.vance@nasa.gov"])
    return {"user": user}
