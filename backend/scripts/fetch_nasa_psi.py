"""
Automated lightweight downloader for NASA PSI investigations (tables & reports only).
Skips multi-gigabyte video/image archives automatically.
Usage: python scripts/fetch_nasa_psi.py PSI-69 PSI-98 PSI-107
"""
import sys
from pathlib import Path
import requests

PSI_META_URL = "https://psi.nasa.gov/geode-py/ws/repo/investigations/{psi_id}"
PSI_DL_URL = "https://psi.nasa.gov/geode-py/ws/studies/{psi_id}/download"
ALLOWED_EXTS = {".csv", ".xlsx", ".xls", ".pdf", ".txt", ".docx"}


def fetch_investigation_tables_and_reports(psi_id: str, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    resp = requests.get(PSI_META_URL.format(psi_id=psi_id), timeout=30)
    resp.raise_for_status()
    meta = resp.json()
    version = str(meta.get("version", "1"))

    downloaded = []
    # Walk JSON strings to locate lightweight tabular & report filenames
    def walk(node):
        if isinstance(node, dict):
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, str):
            low = node.lower()
            if any(low.endswith(ext) for ext in ALLOWED_EXTS) and "video" not in low and "image" not in low:
                fname = Path(node).name
                dest = out_dir / f"{psi_id}_{fname}"
                if not dest.exists():
                    r = requests.get(
                        PSI_DL_URL.format(psi_id=psi_id),
                        params={"file": node, "version": version, "redirect": "true"},
                        timeout=60,
                    )
                    if r.ok and len(r.content) < 150 * 1024 * 1024:  # Cap at 150 MB
                        dest.write_bytes(r.content)
                        downloaded.append(dest)
                        print(f"[OK] Downloaded {dest.name} ({len(r.content)//1024} KB)")

    walk(meta)
    return downloaded


if __name__ == "__main__":
    targets = sys.argv[1:] or ["PSI-69", "PSI-98", "PSI-107"]
    raw_folder = Path(__file__).resolve().parents[1] / "data" / "raw"
    for pid in targets:
        print(f"Fetching lightweight files for {pid}...")
        try:
            files = fetch_investigation_tables_and_reports(pid, raw_folder)
            print(f"Finished {pid}: {len(files)} new files saved.")
        except Exception as exc:
            print(f"[WARN] Could not fetch {pid}: {exc}")
