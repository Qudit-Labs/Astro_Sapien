# FIRELINE — Spacecraft Fire-Safety Intelligence Backend

Pre-populated FastAPI + SQLite FTS5 + Gemini RAG backend built for **HackAthlone 2026**, ingesting:
- **NASA PSI-25 (`BASS-II`)**: 129 ISS microgravity solid-fuel combustion test runs + `NASA/TM-20210011385` (144-page Summary Report) + FAQ, Crew Procedure, and Engineering Requirements.
- **NASA PSI-101 (`SAME-R`)**: 32 verified microgravity smoke aerosol moment-method & TEM test points + `SAMER Final Report` (89 pages) + `AIAA 2012-3536` (13 pages).

## Quickstart (Local / Google Antigravity)

```bash
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/WSL/macOS: source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # Add your GEMINI_API_KEY

# Run automated verification suite against pre-built data/fireline.db
pytest -v

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

Interactive Swagger docs: `http://127.0.0.1:8000/docs`
OpenAPI contract for frontend TypeScript generation: `http://127.0.0.1:8000/openapi.json`
