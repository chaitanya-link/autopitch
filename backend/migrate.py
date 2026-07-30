"""Applies schema.sql to the database configured via DATABASE_URL."""
import pathlib
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv(pathlib.Path(__file__).resolve().parent.parent / ".env.local")

def main():
    database_url = os.environ["DATABASE_URL"]
    schema_sql = (pathlib.Path(__file__).resolve().parent / "schema.sql").read_text()

    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(schema_sql)
    conn.close()
    print("Schema applied successfully.")

if __name__ == "__main__":
    main()
