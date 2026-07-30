import pathlib
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv(pathlib.Path(__file__).resolve().parent.parent / ".env.local")

conn = psycopg2.connect(os.environ["DATABASE_URL"])
with conn.cursor() as cur:
    cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
    print("pgvector extension:", cur.fetchone())

    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN
        ('campaigns','leads','lead_chunks','email_logs')
        ORDER BY table_name;
    """)
    print("Tables found:", [r[0] for r in cur.fetchall()])
conn.close()
