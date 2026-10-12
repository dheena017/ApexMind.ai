import os
import logging
from .connection import get_connection

logger = logging.getLogger("ApexMind.Database")

SCHEMA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
SEED_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed.sql")

def init_db():
    """Initializes tables from schema.sql and seeds data from seed.sql if empty."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Execute DDL from schema.sql
    if os.path.exists(SCHEMA_FILE):
        with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
            schema_sql = f.read()
            cursor.executescript(schema_sql)
            logger.info("Database schema validated (schema.sql)")

    # 2. Seed initial data using idempotent INSERT OR IGNORE
    if os.path.exists(SEED_FILE):
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            seed_sql = f.read()
            cursor.executescript(seed_sql)
            logger.info("Media catalog presets verified (seed.sql)")



    conn.commit()
    conn.close()
