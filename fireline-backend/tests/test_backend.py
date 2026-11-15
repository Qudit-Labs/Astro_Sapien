from pathlib import Path
from app.core.config import DB_PATH
from app.engines.fireline_engine import analyze_combustion_evidence, search_evidence_chunks
from app.engines.testmatch_engine import compare_test_runs
from app.engines.smokewise_engine import analyze_smoke_aerosols
from app.ai.gemini_rag import answer_research_question


def test_database_exists_and_populated():
    assert DB_PATH.exists(), "Pre-built data/fireline.db must exist"
    comb = analyze_combustion_evidence(db_path=DB_PATH)
    assert comb["matched_test_runs"] == 129, f"Expected 129 BASS-II runs, got {comb['matched_test_runs']}"

    smoke = analyze_smoke_aerosols(db_path=DB_PATH)
    assert smoke["total_records"] >= 30, f"Expected >= 30 SAME-R records, got {smoke['total_records']}"


def test_fts5_search_citations():
    hits = search_evidence_chunks("radiative extinction PMMA thickness", db_path=DB_PATH)
    assert len(hits) > 0, "FTS5 search should return NASA TM-20210011385 passages"
    assert "page_number" in hits[0]


def test_testmatch_within_and_cross_domain():
    same_inv = compare_test_runs("PSI-25:B1", "PSI-25:B4", db_path=DB_PATH)
    assert same_inv["comparability_mode"] == "within_investigation"
    assert same_inv["similarity_score"] > 70.0

    cross_inv = compare_test_runs("PSI-25:B1", "PSI-101:TBL1-KAPTON-U", db_path=DB_PATH)
    assert cross_inv["comparability_mode"] == "cross_domain_complementary"
    assert any("NOT directly interchangeable" in w for w in cross_inv["scientific_warnings"])


def test_assistant_fallback_and_guardrails():
    res = answer_research_question("How does zero airflow affect smoke particle diameter in microgravity?", db_path=DB_PATH)
    assert len(res["citations"]) > 0
    assert "Lunar" in res["answer"] or "partial-gravity" in res["answer"]
