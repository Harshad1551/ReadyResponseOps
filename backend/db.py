import psycopg2
import os

def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("Missing env variable: DATABASE_URL")

    return psycopg2.connect(database_url)
