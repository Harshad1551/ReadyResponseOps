import psycopg2
import os
from dotenv import load_dotenv

# Load .env once
load_dotenv()

def get_connection():
    required = ["DBPORT", "DBNAME", "DB.USER", "DB_PASSWORD"]
    for var in required:
        if not os.getenv(var):
            raise RuntimeError(f"Missing env variable: {var}")

    return psycopg2.connect(
        port=os.getenv("DBPORT"),
        dbname=os.getenv("DBNAME"),
        user=os.getenv("DB.USER"),
        password=os.getenv("DB_PASSWORD"),
    )

