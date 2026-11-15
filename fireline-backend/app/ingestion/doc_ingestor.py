import re
from pathlib import Path
from pypdf import PdfReader
from docx import Document
from pptx import Presentation
from app.database.connection import get_connection

DOC_REGISTRY = [
    {
        "source_id": "NASA-TM-20210011385",
        "investigation_id": "BASS-II",
        "psi_id": "PSI-25",
        "title": "Burning and Suppression of Solids-II (BASS-II) Summary Report (NASA/TM-20210011385)",
        "file_name": "TM-20210011385.pdf",
        "doi": "10.60555/4qc4-de67",
        "url": "https://ntrs.nasa.gov/citations/20210011385",
    },
    {
        "source_id": "NASA-PSI-25-README",
        "investigation_id": "BASS-II",
        "psi_id": "PSI-25",
        "title": "BASS-II Data FAQ & ReadMe Documentation",
        "file_name": "BASS-II_ReadMe.docx",
        "doi": "10.60555/4qc4-de67",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
    },
    {
        "source_id": "NASA-PSI-101-FINAL-REPORT",
        "investigation_id": "SAME-R",
        "psi_id": "PSI-101",
        "title": "Smoke Aerosol Measurement Experiment Re-flight (SAMER) Final Report",
        "file_name": "SAMER_Final 0602 2014.pdf",
        "doi": "10.60555/2np7-jv14",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
    },
    {
        "source_id": "NASA-AIAA-2012-3536",
        "investigation_id": "SAME-R",
        "psi_id": "PSI-101",
        "title": "Particle Morphology and Size Results from SAME-2 (NTRS 20130000422)",
        "file_name": "20130000422.pdf",
        "doi": "10.2514/6.2012-3536",
        "url": "https://ntrs.nasa.gov/citations/20130000422",
    },
    {
        "source_id": "NASA-SAME-CONCEPT",
        "investigation_id": "SAME-R",
        "psi_id": "PSI-101",
        "title": "SAME Baseline Concept Description and Sensor Architecture",
        "file_name": "SAME_Baseline_Concept_Description.pdf",
        "doi": "10.60555/2np7-jv14",
        "url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-101",
    },
    {
        "source_id": "NASA-NTRS-20170000230",
        "investigation_id": "SAFFIRE",
        "psi_id": "PSI-98",
        "title": "Saffire Spacecraft Fire Safety Demonstration Overview (NTRS 20170000230)",
        "file_name": "20170000230.pdf",
        "doi": "10.60555/saffire-2016",
        "url": "https://ntrs.nasa.gov/citations/20170000230",
    },
    {
        "source_id": "NASA-TP-2015-216046",
        "investigation_id": "FLEX",
        "psi_id": "PSI-69",
        "title": "Flame Extinction Experiment (FLEX) Final Results (NASA/TP-2015-216046)",
        "file_name": "NASA-TP-2015-216046.pdf",
        "doi": "10.60555/flex-2015",
        "url": "https://ntrs.nasa.gov/citations/20150017013",
    },
]

CURATED_FINDINGS = [
    {
        "id": "FND-BASS2-01",
        "investigation_id": "BASS-II",
        "pillar": "prevention",
        "title": "Microgravity Flammability Boundary Extends Below Normal-Gravity Limits",
        "statement": "In microgravity axial stagnation flow, PMMA rods sustained burning down to 13.5% O2 at stretch rates of 8-12 s^-1 (flow ~1-2 cm/s), well below the normal-gravity upward flame spread limit of 15.4% O2.",
        "evidence_label": "NASA observation",
        "source_id": "NASA-TM-20210011385",
        "page_or_row_ref": "Section 6.1.4.4, Figs. 6.9-6.10, pp. 75-76",
    },
    {
        "id": "FND-BASS2-02",
        "investigation_id": "BASS-II",
        "pillar": "prevention",
        "title": "Critical Radiative Extinction Velocity Is Independent of Fuel Thickness",
        "statement": "For thermally thin PMMA films (100 to 400 microns) in opposed microgravity flow at 21% O2, radiative extinction occurred at a critical opposed-flow velocity of ~1.0 to 1.5 cm/s regardless of thickness, increasing to ~2.6-4.0 cm/s at 16% O2.",
        "evidence_label": "NASA observation",
        "source_id": "NASA-TM-20210011385",
        "page_or_row_ref": "Section 2.1.2.1 & Table 2.1, pp. 13-15, 28",
    },
    {
        "id": "FND-BASS2-03",
        "investigation_id": "BASS-II",
        "pillar": "prevention",
        "title": "NASA-STD-6001 Test 1 25-Second Ignition Time Underestimates Low-O2 Ignition",
        "statement": "At reduced O2 concentrations (<16% O2), PMMA rod ignition delay times reached up to 230 seconds due to conductive heat loss into the cold solid—nearly 10x longer than the standard 25-second NASA-STD-6001 Test 1 igniter duration.",
        "evidence_label": "NASA observation",
        "source_id": "NASA-TM-20210011385",
        "page_or_row_ref": "Section 6.1.4.1, Fig. 6.2, pp. 68-69",
    },
    {
        "id": "FND-BASS2-04",
        "investigation_id": "BASS-II",
        "pillar": "suppression",
        "title": "Post-Suppression Re-Ignition Hazard from Subsurface Vapor Bubbles & High CO Yield",
        "statement": "Microgravity PMMA flames burned fuel-rich (average global equivalence ratio 1.3) with CO/CO2 ratios an order of magnitude higher than efficient terrestrial burners, while subsurface pressurized monomer bubbles persisted after flame extinction and risked re-ignition until cooled.",
        "evidence_label": "NASA observation",
        "source_id": "NASA-TM-20210011385",
        "page_or_row_ref": "Sections 1.4-1.5 & 4.1.2, pp. 8-11, 52",
    },
    {
        "id": "FND-SAMER-01",
        "investigation_id": "SAME-R",
        "pillar": "detection",
        "title": "Zero-Flow Microgravity Pyrolysis Produces 30-40% Larger Smoke Particles",
        "statement": "Under quiescent (0 cm/s) microgravity conditions, smoke remained confined near the heater (~64 cm^3 vs 6000 cm^3 piston), increasing initial concentration ~50x and producing diameters of average mass 30-40% larger than 8 cm/s ventilated runs (and shifting Pyrell morphology from fractal chains to spheres).",
        "evidence_label": "NASA observation",
        "source_id": "NASA-PSI-101-FINAL-REPORT",
        "page_or_row_ref": "Section D, Fig. 13, pp. 8-9",
    },
    {
        "id": "FND-SAMER-02",
        "investigation_id": "SAME-R",
        "pillar": "detection",
        "title": "Two-Moment Optical Detection (MPASS) Cuts False-Alarm Variance by >2x",
        "statement": "Single-moment detectors struggle to detect sub-100 nm Kapton/Teflon pyrolysis smoke without false alarms from >1 um dust. Combining two scattering moments in MPASS reduced response variance by more than a factor of 2 across all 5 spacecraft materials.",
        "evidence_label": "NASA observation",
        "source_id": "NASA-PSI-101-FINAL-REPORT",
        "page_or_row_ref": "Section B, Figs. 9-10, pp. 6-7",
    },
    {
        "id": "FND-SAFFIRE-01",
        "investigation_id": "SAFFIRE",
        "pillar": "prevention",
        "title": "Large-Scale Spacecraft Fabric Flame Spread Exceeds Small-Scale Burn Limits",
        "statement": "In Cygnus 0.4 m x 0.94 m flammability tests, SIBAL fabrics produced continuous upward/concurrent flame spread over 1-meter lengths at velocities up to 20 cm/s with heat release rates exceeding small-scale BASS-II samples by over an order of magnitude.",
        "evidence_label": "NASA observation",
        "source_id": "NASA-NTRS-20170000230",
        "page_or_row_ref": "Section 4.1, pp. 6-8",
    },
    {
        "id": "FND-FLEX-01",
        "investigation_id": "FLEX",
        "pillar": "suppression",
        "title": "Radiative vs Diffusive Droplet Extinction with Gaseous Suppressants",
        "statement": "In microgravity spherical droplet combustion with gaseous suppressants (CO2, He, SF6), visible flame extinction diameters increased with initial droplet size due to radiative quenching at large diameters and diffusive cooling limits at small diameters.",
        "evidence_label": "NASA observation",
        "source_id": "NASA-TP-2015-216046",
        "page_or_row_ref": "Section 3.2, pp. 45-50",
    },
]


def _chunk_text(text: str, max_chars: int = 1600) -> list[str]:
    clean = " ".join(text.split())
    if not clean:
        return []
    chunks = []
    start = 0
    while start < len(clean):
        end = min(start + max_chars, len(clean))
        if end < len(clean):
            sp = clean.rfind(" ", start, end)
            if sp > start + 400:
                end = sp
        chunks.append(clean[start:end].strip())
        start = end
    return chunks


def ingest_documents(raw_dir: Path, conn_str: str | None = None) -> int:
    total_chunks = 0
    with get_connection(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM evidence_chunks;")

            for doc in DOC_REGISTRY:
                fpath = raw_dir / doc["file_name"]
                if not fpath.exists():
                    # Check alternate filename if applicable
                    if doc["file_name"] == "20130000422.pdf" and (raw_dir / "20130000422 (1).pdf").exists():
                        fpath = raw_dir / "20130000422 (1).pdf"
                    elif doc["file_name"] == "SAMER_Final 0602 2014.pdf" and (raw_dir / "SAME-R_Final_Report.pdf").exists():
                        fpath = raw_dir / "SAME-R_Final_Report.pdf"
                    else:
                        continue

                ext = fpath.suffix.lower().lstrip(".")
                pages: list[tuple[str, str, str]] = []  # (page_label, section, text)

                if ext == "pdf":
                    try:
                        reader = PdfReader(str(fpath))
                        # Limit large PDFs to first 120 pages to stay well within memory constraints
                        max_p = min(len(reader.pages), 120)
                        for p_idx in range(max_p):
                            txt = reader.pages[p_idx].extract_text() or ""
                            pages.append((str(p_idx + 1), f"Page {p_idx + 1}", txt))
                    except Exception as e:
                        print(f"Warning extracting PDF {fpath.name}: {e}")
                elif ext == "docx":
                    try:
                        d = Document(str(fpath))
                        full_txt = "\n".join(p.text for p in d.paragraphs if p.text.strip())
                        for t in d.tables:
                            for row in t.rows:
                                full_txt += "\n" + " | ".join(c.text.strip() for c in row.cells)
                        pages.append(("1", doc["title"], full_txt))
                    except Exception as e:
                        print(f"Warning extracting DOCX {fpath.name}: {e}")
                elif ext == "pptx":
                    try:
                        prs = Presentation(str(fpath))
                        for s_idx, slide in enumerate(prs.slides, start=1):
                            parts = []
                            for shape in slide.shapes:
                                if shape.has_text_frame:
                                    parts.append(shape.text_frame.text)
                            pages.append((f"Slide {s_idx}", f"Slide {s_idx}", "\n".join(parts)))
                    except Exception as e:
                        print(f"Warning extracting PPTX {fpath.name}: {e}")

                cur.execute(
                    """
                    INSERT INTO sources (id, investigation_id, psi_id, title, file_name, doi, url, source_type, page_or_row_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        page_or_row_count = EXCLUDED.page_or_row_count;
                    """,
                    (
                        doc["source_id"],
                        doc["investigation_id"],
                        doc["psi_id"],
                        doc["title"],
                        doc["file_name"],
                        doc["doi"],
                        doc["url"],
                        ext,
                        len(pages),
                    ),
                )

                for p_label, sec_title, p_text in pages:
                    for chunk in _chunk_text(p_text):
                        if chunk:
                            cur.execute(
                                """
                                INSERT INTO evidence_chunks (source_id, investigation_id, page_number, section_title, content_text)
                                VALUES (%s, %s, %s, %s, %s);
                                """,
                                (doc["source_id"], doc["investigation_id"], p_label, sec_title, chunk),
                            )
                            total_chunks += 1

            for f in CURATED_FINDINGS:
                cur.execute(
                    """
                    INSERT INTO findings (id, investigation_id, pillar, title, statement, evidence_label, source_id, page_or_row_ref)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        statement = EXCLUDED.statement,
                        evidence_label = EXCLUDED.evidence_label,
                        page_or_row_ref = EXCLUDED.page_or_row_ref;
                    """,
                    (
                        f["id"],
                        f["investigation_id"],
                        f["pillar"],
                        f["title"],
                        f["statement"],
                        f["evidence_label"],
                        f["source_id"],
                        f["page_or_row_ref"],
                    ),
                )

        conn.commit()
    return total_chunks
