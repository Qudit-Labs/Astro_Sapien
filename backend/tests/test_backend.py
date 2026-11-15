import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.engines.fireline_engine import analyze_combustion_evidence, search_evidence_chunks
from app.engines.testmatch_engine import compare_test_runs
from app.engines.smokewise_engine import analyze_smoke_aerosols
from app.ai.gemini_rag import answer_research_question

client = TestClient(app)


def test_health_check_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["investigations_count"] >= 5
    assert data["test_runs_loaded"] >= 1000
    assert data["measurements_count"] >= 5000
    assert data["evidence_chunks_indexed"] >= 500


def test_list_and_get_investigations():
    res = client.get("/api/v1/investigations")
    assert res.status_code == 200
    data = res.json()
    inv_ids = [inv["id"] for inv in data["items"]]
    for expected_id in ["BASS-II", "SAME-R", "SAFFIRE", "FLEX", "SPICE"]:
        assert expected_id in inv_ids

    # Check detail for BASS-II
    res_b = client.get("/api/v1/investigations/BASS-II")
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["investigation"]["psi_id"] == "PSI-25"
    assert len(data_b["sources"]) > 0

    # Check detail for SAFFIRE
    res_s = client.get("/api/v1/investigations/SAFFIRE")
    assert res_s.status_code == 200
    data_s = res_s.json()
    assert data_s["investigation"]["pillar"] == "prevention"


def test_list_tests_with_filters():
    # Filter by investigation_id
    res_bass = client.get("/api/v1/tests?investigation_id=BASS-II")
    assert res_bass.status_code == 200
    assert res_bass.json()["count"] > 100

    # Filter by geometry
    res_geom = client.get("/api/v1/tests?geometry=droplet")
    assert res_geom.status_code == 200
    assert res_geom.json()["count"] > 0
    for item in res_geom.json()["items"]:
        assert item["geometry"] == "droplet"

    # Detail test lookup
    res_detail = client.get("/api/v1/tests/PSI-25:B1")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["test_run"]["test_code"] == "B1"
    assert len(detail["measurements"]) > 0
    assert detail["provenance"] is not None


def test_sources_endpoint():
    res = client.get("/api/v1/sources/NASA-TM-20210011385")
    assert res.status_code == 200
    src = res.json()
    assert src["psi_id"] == "PSI-25"
    assert "NASA/TM-20210011385" in src["title"]


def test_evidence_search_full_text():
    res = client.get("/api/v1/evidence/search?q=extinction")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    top_hit = data["results"][0]
    assert "source_id" in top_hit
    assert "content_text" in top_hit
    assert "page_number" in top_hit


def test_fireline_combustion_analysis():
    payload = {
        "investigation_id": None,
        "pillar": "prevention",
    }
    res = client.post("/api/v1/fireline/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["matched_test_runs"] > 0
    assert "scientific_limitation" in data
    assert "Lunar (1/6 g) or Martian (3/8 g)" in data["scientific_limitation"]
    assert "extinction_modes" in data["summary_metrics"]


def test_testmatch_comparability_modes():
    # 1. Within investigation (BASS-II vs BASS-II)
    res_within = client.post("/api/v1/testmatch/compare", json={"experiment_a": "PSI-25:B1", "experiment_b": "PSI-25:B4"})
    assert res_within.status_code == 200
    data_w = res_within.json()
    assert data_w["comparability_mode"] == "within_investigation"
    assert data_w["similarity_score"] > 80.0
    # Surfaces suspect quality flag on B4
    assert any("suspect" in w for w in data_w["scientific_warnings"])

    # 2. Scale divergence (BASS-II vs SAFFIRE)
    res_scale = client.post("/api/v1/testmatch/compare", json={"experiment_a": "PSI-25:B1", "experiment_b": "PSI-98:S1"})
    assert res_scale.status_code == 200
    data_s = res_scale.json()
    assert data_s["comparability_mode"] == "cross_domain_complementary"
    assert any("Scale Divergence" in w for w in data_s["scientific_warnings"])

    # 3. Cross-domain complementary (BASS-II vs SAME-R)
    res_cross = client.post("/api/v1/testmatch/compare", json={"experiment_a": "PSI-25:B1", "experiment_b": "PSI-101:TBL1-KAPTON-U"})
    assert res_cross.status_code == 200
    data_c = res_cross.json()
    assert data_c["comparability_mode"] == "cross_domain_complementary"
    assert any("Cross-investigation comparison" in w for w in data_c["scientific_warnings"])


def test_smokewise_smoke_intelligence():
    res = client.post("/api/v1/smokewise/analyze", json={"include_spice": True})
    assert res.status_code == 200
    data = res.json()
    assert data["samer_smoke_records"] >= 32
    assert data["spice_soot_records"] >= 400
    assert len(data["material_summary"]) >= 5
    materials = [m["material"] for m in data["material_summary"]]
    assert "Kapton" in materials
    assert "Teflon" in materials
    assert "iss_near_ir_scattering_detector" in data["detector_implications"]
    assert "mpass_two_moment_prototype" in data["detector_implications"]


def test_assistant_query_rag_grounding():
    req = {
        "question": "What is the critical radiative extinction velocity for thin PMMA in microgravity?",
        "investigation_id": "BASS-II",
    }
    res = client.post("/api/v1/assistant/query", json=req)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert len(data["citations"]) > 0
    # Must contain one of the mandatory scientific labels
    assert any(tag in data["answer"] for tag in ["[NASA observation]", "[Calculated result]", "[AI interpretation]", "[Research implication]"])
    # Must reference Lunar/Martian partial-gravity constraint
    assert "1/6 g" in data["answer"] or "partial-gravity" in data["answer"] or "Lunar" in data["answer"]


def test_integrated_reports_generation():
    req = {
        "topic": "Comprehensive Fire Safety across BASS-II, SAFFIRE, and SAME-R",
        "experiment_a": "PSI-25:B1",
        "experiment_b": "PSI-98:S1",
    }
    res = client.post("/api/v1/reports/generate", json=req)
    assert res.status_code == 200
    data = res.json()
    assert "FIRELINE Integrated Research Report" in data["report_title"]
    assert "prevention_and_suppression" in data["pillars"]
    assert "detection_and_aerosols" in data["pillars"]
    assert "cross_experiment_comparability_testmatch" in data["pillars"]
    assert len(data["provenance_manifest"]) == 5


def test_manifest_and_entity_endpoints():
    res_m = client.get("/api/v1/manifest")
    assert res_m.status_code == 200
    manifest = res_m.json()
    assert manifest["record_counts"]["investigations"] >= 5
    assert manifest["record_counts"]["test_runs"] >= 1000

    res_runs = client.get("/api/v1/test-runs?limit=10")
    assert res_runs.status_code == 200
    assert len(res_runs.json()["items"]) == 10

    res_meas = client.get("/api/v1/measurements?limit=10")
    assert res_meas.status_code == 200
    assert len(res_meas.json()["items"]) == 10

    res_findings = client.get("/api/v1/findings?limit=5")
    assert res_findings.status_code == 200
    assert len(res_findings.json()["items"]) > 0

    res_sources = client.get("/api/v1/sources?limit=5")
    assert res_sources.status_code == 200
    assert len(res_sources.json()["items"]) > 0


def test_auth_signup_and_login():
    signup_payload = {
        "name": "Dr. Marcus Vance",
        "email": "marcus.vance@nasa.gov",
        "password": "ResearchSecurity2026!",
        "organization": "NASA Ames Research Center",
        "role": "Spacecraft Life Support & ECLSS Specialist",
    }
    res_signup = client.post("/api/v1/auth/signup", json=signup_payload)
    assert res_signup.status_code == 200
    signup_data = res_signup.json()
    assert signup_data["status"] == "success"
    assert "access_token" in signup_data
    assert signup_data["user"]["name"] == "Dr. Marcus Vance"
    assert signup_data["user"]["email"] == "marcus.vance@nasa.gov"

    # Test login
    login_payload = {
        "email": "marcus.vance@nasa.gov",
        "password": "ResearchSecurity2026!",
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert login_data["status"] == "success"
    assert login_data["user"]["email"] == "marcus.vance@nasa.gov"


def test_langchain_sql_agent_endpoint():
    payload = {
        "question": "How many investigations are in the database?"
    }
    res = client.post("/api/v1/agent/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "output" in data
    assert "intermediate_steps" in data
    assert data["database"] == "supabase-postgresql"
    assert "investigations" in data["output"].lower() or "5" in data["output"]


def test_smokevision_endpoints():
    res_presets = client.get("/api/v1/smokevision/presets")
    assert res_presets.status_code == 200
    assert len(res_presets.json()["data"]) >= 4

    res_seq = client.get("/api/v1/smokevision/sequence?preset_id=SAME-R-101&num_frames=6")
    assert res_seq.status_code == 200
    seq_data = res_seq.json()["data"]
    assert seq_data["frames_count"] == 6
    assert len(seq_data["frames"]) == 6

    res_micro = client.get("/api/v1/smokevision/microscopy?material=Kapton")
    assert res_micro.status_code == 200
    assert res_micro.json()["data"]["material"] == "Kapton"

    res_comp = client.get("/api/v1/smokevision/compare")
    assert res_comp.status_code == 200
    assert res_comp.json()["data"]["compared_experiments_count"] >= 4

    res_demo = client.get("/api/v1/smokevision/demo-video-analysis?material=Kapton")
    assert res_demo.status_code == 200
    demo_data = res_demo.json()["data"]
    assert demo_data["status"] == "success"
    assert "surveillance_status" in demo_data
    assert len(demo_data["frames"]) > 0


def test_individual_entity_and_alias_endpoints():
    # /api/v1/health
    res_h = client.get("/api/v1/health")
    assert res_h.status_code == 200

    # /api/v1/measurements/{id}
    res_meas = client.get("/api/v1/measurements?limit=1")
    assert res_meas.status_code == 200
    meas_id = res_meas.json()["items"][0]["id"]
    res_single_meas = client.get(f"/api/v1/measurements/{meas_id}")
    assert res_single_meas.status_code == 200
    assert res_single_meas.json()["id"] == meas_id

    # /api/v1/findings/{id}
    res_f = client.get("/api/v1/findings?limit=1")
    assert res_f.status_code == 200
    f_id = res_f.json()["items"][0]["id"]
    res_single_f = client.get(f"/api/v1/findings/{f_id}")
    assert res_single_f.status_code == 200
    assert res_single_f.json()["id"] == f_id

    # /api/v1/comparisons & /api/v1/comparisons/{id}
    res_comps = client.get("/api/v1/comparisons")
    assert res_comps.status_code == 200
    comps_data = res_comps.json()
    comps = comps_data.get("items", comps_data) if isinstance(comps_data, dict) else comps_data
    assert len(comps) > 0
    first_c_id = comps[0]["id"]
    res_single_c = client.get(f"/api/v1/comparisons/{first_c_id}")
    assert res_single_c.status_code == 200
    assert res_single_c.json()["id"] == first_c_id

    # /api/v1/reports & /api/v1/reports/{id}
    res_reps = client.get("/api/v1/reports")
    assert res_reps.status_code == 200
    reps_data = res_reps.json()
    reps = reps_data.get("items", reps_data) if isinstance(reps_data, dict) else reps_data
    assert len(reps) > 0
    first_r_id = reps[0]["id"]
    res_single_r = client.get(f"/api/v1/reports/{first_r_id}")
    assert res_single_r.status_code == 200
    assert res_single_r.json()["id"] == first_r_id


def test_voice_transcribe_endpoint():
    dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    res = client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("test.wav", dummy_wav, "audio/wav")},
    )
    assert res.status_code == 200
    data = res.json()
    assert "transcript" in data
    assert len(data["transcript"]) > 0

