from app.engines.fireline_engine import analyze_combustion_evidence, search_evidence_chunks
from app.engines.testmatch_engine import compare_test_runs
from app.engines.smokewise_engine import analyze_smoke_aerosols
from app.ai.gemini_rag import answer_research_question


def test_fireline_engine_signature():
    assert callable(analyze_combustion_evidence)
    assert callable(search_evidence_chunks)


def test_testmatch_engine_signature():
    assert callable(compare_test_runs)


def test_smokewise_engine_signature():
    assert callable(analyze_smoke_aerosols)


def test_gemini_rag_signature():
    assert callable(answer_research_question)
