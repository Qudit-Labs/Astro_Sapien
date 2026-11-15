-- FIRELINE Spacecraft Fire-Safety Intelligence Engine
-- PostgreSQL Schema for Supabase (with Full-Text Search TSVECTOR & GIN Indexing)

-- 1. Investigations Table
CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY,
    psi_id TEXT NOT NULL,
    title TEXT NOT NULL,
    pillar TEXT NOT NULL,
    doi TEXT,
    url TEXT,
    facility TEXT,
    summary TEXT
);

-- 2. Sources Table
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    investigation_id TEXT REFERENCES investigations(id) ON DELETE CASCADE,
    psi_id TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    doi TEXT,
    url TEXT,
    source_type TEXT NOT NULL,
    page_or_row_count INTEGER
);

-- 3. Test Runs Table
CREATE TABLE IF NOT EXISTS test_runs (
    id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    test_code TEXT NOT NULL,
    pi_name TEXT,
    test_date TEXT,
    gmt_day INTEGER,
    sample_code TEXT,
    flow_regime TEXT,
    material_raw TEXT NOT NULL,
    material_normalized TEXT NOT NULL,
    color_or_grade TEXT,
    geometry TEXT NOT NULL,
    thickness_mm DOUBLE PRECISION,
    width_mm DOUBLE PRECISION,
    diameter_mm DOUBLE PRECISION,
    burn_sides INTEGER,
    flow_restrictor INTEGER,
    extinction_mode TEXT,
    aging_state TEXT,
    gravity_regime TEXT DEFAULT 'microgravity',
    raw_row_index INTEGER NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_inv ON test_runs(investigation_id);
CREATE INDEX IF NOT EXISTS idx_runs_mat ON test_runs(material_normalized);
CREATE INDEX IF NOT EXISTS idx_runs_geom ON test_runs(geometry);

-- 4. Measurements Table
CREATE TABLE IF NOT EXISTS measurements (
    id SERIAL PRIMARY KEY,
    test_run_id TEXT NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    parameter TEXT NOT NULL,
    raw_value TEXT,
    normalized_value DOUBLE PRECISION,
    unit TEXT,
    quality_status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meas_run ON measurements(test_run_id);
CREATE INDEX IF NOT EXISTS idx_meas_param ON measurements(parameter);

-- 5. Findings Table
CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    pillar TEXT NOT NULL,
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    evidence_label TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    page_or_row_ref TEXT NOT NULL
);

-- 6. Evidence Chunks Table (Full-Text Search with GIN Index)
CREATE TABLE IF NOT EXISTS evidence_chunks (
    id SERIAL PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    page_number TEXT,
    section_title TEXT,
    content_text TEXT NOT NULL,
    search_tsv TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(section_title, '') || ' ' || content_text)
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_evidence_tsv ON evidence_chunks USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS idx_evidence_inv ON evidence_chunks(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_source ON evidence_chunks(source_id);
