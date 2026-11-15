import csv
import openpyxl
from pathlib import Path

raw = Path("backend/data/raw")

print("--- EXAMINING FILES IN RAW ---")
for f in sorted(raw.iterdir()):
    print(f.name, f.stat().st_size)

print("\n--- CHECKING CSVS ---")
for csv_name in [
    "PSI-25_Experimental table_BASS-II.csv",
    "SAME-R_Experimental_Table.csv",
    "SAFFIRE-I_Experimental_Table.csv",
    "SAFFIRE-II_Experimental_Table.csv",
    "FLEX_Experimental_Table.csv",
    "SPICE_Experimental_Table.csv"
]:
    p = raw / csv_name
    if p.exists():
        with open(p, "r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            rows = list(reader)
            print(f"\n=== {csv_name} ===")
            print(f"Row count: {len(rows)}")
            print("Columns:", fieldnames)
            if rows:
                print("First row:", dict(list(rows[0].items())[:8]))

print("\n--- CHECKING XLSX (Fan calibration data) ---")
for xlsx_name in ["BASS-II_Fan_calibration_data.xlsx", "Fan calibration data.xlsx"]:
    p = raw / xlsx_name
    if p.exists():
        wb = openpyxl.load_workbook(p, data_only=True)
        print(f"\n=== {xlsx_name} ===")
        print("Sheet names:", wb.sheetnames)
        for sname in wb.sheetnames:
            ws = wb[sname]
            srows = list(ws.iter_rows(values_only=True))
            print(f"Sheet '{sname}' rows: {len(srows)}")
            for r in srows[:6]:
                print("  ", r)
