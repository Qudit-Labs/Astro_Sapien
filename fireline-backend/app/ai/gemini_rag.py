from pathlib import Path
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL
from app.engines.fireline_engine import search_evidence_chunks, analyze_combustion_evidence
from app.engines.smokewise_engine import analyze_smoke_aerosols

SYSTEM_PROMPT = """You are the FIRELINE Spacecraft Fire-Safety Scientific Assistant.
Answer strictly using the retrieved NASA experimental records and document excerpts provided below.

Mandatory Rules:
1. Label every scientific statement with one of: [NASA observation], [Calculated result], [AI interpretation], [Research implication], or [Unknown].
2. Cite exact sources inline using the provided source ID, PSI ID, and page/row reference (e.g., [PSI-25 / NASA-TM-20210011385, p. 75]).
3. Never invent experimental values or claim detector alarm statistics unless explicitly present in the context.
4. Explicitly note when relevant: NASA PSI provides microgravity (ISS) and 1-g ground reference datasets, NOT validated partial-gravity datasets for Lunar (1/6 g) or Martian (3/8 g) environments; treat exploration extrapolations as research implications rather than validated experimental data.
"""


def answer_research_question(question: str, investigation_id: str | None = None, db_path: Path | None = None) -> dict:
    chunks = search_evidence_chunks(question, investigation_id=investigation_id, limit=6, db_path=db_path)
    comb_summary = analyze_combustion_evidence(db_path=db_path)["summary_metrics"]
    smoke_summary = analyze_smoke_aerosols(db_path=db_path)["material_summary"]

    citations = [
        {
            "source_id": c["source_id"],
            "psi_id": c["psi_id"],
            "title": c["source_title"],
            "page_or_section": c["page_number"],
            "url": c["source_url"],
            "snippet": c["content_text"][:280] + ("..." if len(c["content_text"]) > 280 else ""),
        }
        for c in chunks
    ]

    if not GEMINI_API_KEY:
        # Deterministic evidence-backed fallback when GEMINI_API_KEY is not yet configured in .env
        synthesized = (
            "[NASA observation] Retrieved "
            f"{len(chunks)} matching NASA source passages from PSI-25 (BASS-II) and PSI-101 (SAME-R). "
            + (
                f"Top evidence ({chunks[0]['psi_id']} / {chunks[0]['source_id']}, p. {chunks[0]['page_number']}): "
                f"{chunks[0]['content_text'][:420]}... "
                if chunks
                else "No text passages matched the query terms directly. "
            )
            + "[Research implication] Set GEMINI_API_KEY in .env to enable full natural-language synthesis over these retrieved citations. "
            "Note: NASA PSI contains microgravity and 1-g data, not validated Lunar or Martian partial-gravity combustion datasets."
        )
        return {
            "question": question,
            "mode": "deterministic_evidence_fallback",
            "answer": synthesized,
            "citations": citations,
            "structured_context": {
                "bass2_summary": comb_summary,
                "samer_material_summary": smoke_summary,
            },
        }

    from google import genai
    from google.genai import types

    context_blocks = [
        f"--- CITATION [{i+1}] ({c['psi_id']} | {c['source_id']} | Page/Ref: {c['page_number']}) ---\n{c['content_text']}"
        for i, c in enumerate(chunks)
    ]
    user_payload = (
        f"Research Question: {question}\n\n"
        f"Structured BASS-II Summary Metrics: {comb_summary}\n"
        f"Structured SAME-R Aerosol Summary: {smoke_summary}\n\n"
        "Retrieved NASA Passages:\n" + "\n\n".join(context_blocks)
    )

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_payload,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
        ),
    )

    return {
        "question": question,
        "mode": f"gemini_rag:{GEMINI_MODEL}",
        "answer": response.text,
        "citations": citations,
        "structured_context": {
            "bass2_summary": comb_summary,
            "samer_material_summary": smoke_summary,
        },
    }
