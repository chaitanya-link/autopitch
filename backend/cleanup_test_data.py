import pathlib
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv(pathlib.Path(__file__).resolve().parent.parent / ".env.local")

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = True
with conn.cursor() as cur:
    cur.execute("DELETE FROM campaigns WHERE product_name = 'AutoPitch Test Product';")
    print(f"Deleted {cur.rowcount} test campaign(s) (leads cascade-deleted).")
conn.close()
