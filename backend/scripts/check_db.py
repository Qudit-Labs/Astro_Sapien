import os
import psycopg
from dotenv import load_dotenv

load_dotenv('backend/.env')
url = os.getenv('DATABASE_URL')
print("URL:", url.split("@")[-1])

conn = psycopg.connect(url)
cur = conn.cursor()
cur.execute('SELECT current_database(), current_schema(), current_user;')
print('Current DB/Schema/User:', cur.fetchone())

cur.execute("""
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
""")
print('All Tables:')
for r in cur.fetchall():
    print(r)

for tbl in ['investigations', 'sources', 'test_runs', 'measurements', 'findings', 'evidence_chunks']:
    try:
        cur.execute(f"SELECT COUNT(*) FROM {tbl};")
        print(f"Count {tbl}:", cur.fetchone()[0])
    except Exception as e:
        print(f"Error checking {tbl}:", e)
        conn.rollback()

conn.close()
