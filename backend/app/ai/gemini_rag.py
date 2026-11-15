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


def answer_research_question(question: str, investigation_id: str | None = None, conn_str: str | None = None) -> dict:
    chunks = search_evidence_chunks(question, investigation_id=investigation_id, limit=6, conn_str=conn_str)
    comb_summary = analyze_combustion_evidence(conn_str=conn_str).get("summary_metrics", {})
    smoke_summary = analyze_smoke_aerosols(conn_str=conn_str).get("material_summary", [])

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
        # Deterministic evidence-backed fallback when GEMINI_API_KEY is not configured
        synthesized = (
            "[NASA observation] Retrieved "
            f"{len(chunks)} matching NASA source passages from PSI repositories. "
            + (
                f"Top evidence ({chunks[0]['psi_id']} / {chunks[0]['source_id']}, p. {chunks[0]['page_number']}): "
                f"{chunks[0]['content_text'][:420]}... "
                if chunks
                else "No text passages matched the query terms directly. "
            )
            + "[Research implication] Set GEMINI_API_KEY in .env to enable generative RAG synthesis over these retrieved citations. "
            "Note: NASA PSI contains microgravity and 1-g data, not validated Lunar (1/6 g) or Martian (3/8 g) partial-gravity combustion datasets."
        )
        return {
            "question": question,
            "mode": "deterministic_evidence_fallback",
            "answer": synthesized,
            "citations": citations,
            "evidence_chunk_count": len(chunks),
            "combustion_o2_range": [comb_summary.get("o2_initial_min_pct"), comb_summary.get("o2_initial_max_pct")],
            "smoke_materials_analyzed": [m["material"] for m in smoke_summary],
        }

    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)

        context_blocks = []
        for c in chunks:
            context_blocks.append(
                f"Source: {c['source_id']} ({c['psi_id']}) | Page/Section: {c['page_number']}\nContent: {c['content_text']}"
            )
        context_str = "\n\n---\n\n".join(context_blocks) if context_blocks else "No textual excerpts found."

        prompt = f"""User Question: {question}

Retrieved NASA Experimental Evidence:
{context_str}

BASS-II & Batch B Measured O2 Range: {comb_summary.get('o2_initial_min_pct')}% to {comb_summary.get('o2_initial_max_pct')}%
Smoke Pyrolysis Materials Available: {', '.join(m['material'] for m in smoke_summary)}

Please provide a scientifically rigorous, evidence-labeled answer with exact inline citations."""

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=dict(system_instruction=SYSTEM_PROMPT, temperature=0.2),
        )
        return {
            "question": question,
            "mode": "gemini_generative_rag",
            "answer": response.text,
            "citations": citations,
            "evidence_chunk_count": len(chunks),
        }
    except Exception as exc:
        return {
            "question": question,
            "mode": "error_fallback",
            "answer": f"[Unknown] An error occurred while contacting Gemini API: {exc}",
            "citations": citations,
            "evidence_chunk_count": len(chunks),
        }
