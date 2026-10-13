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
            logger.info("Schema verified (schema.sql)")

    # 2. Seed initial data using idempotent INSERT OR IGNORE
    if os.path.exists(SEED_FILE):
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            seed_sql = f.read()
            cursor.executescript(seed_sql)
            logger.info("Presets verified (seed.sql)")

    # 3. Dynamic migration for notifications table columns
    try:
        cursor.execute("PRAGMA table_info(notifications)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        if existing_cols:
            if "category" not in existing_cols:
                cursor.execute("ALTER TABLE notifications ADD COLUMN category TEXT DEFAULT 'system'")
                logger.info("Migrated notifications: added 'category' column")
            if "action_url" not in existing_cols:
                cursor.execute("ALTER TABLE notifications ADD COLUMN action_url TEXT")
                logger.info("Migrated notifications: added 'action_url' column")
            if "priority" not in existing_cols:
                cursor.execute("ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal'")
                logger.info("Migrated notifications: added 'priority' column")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications (category)")
    except Exception as e:
        logger.warning(f"Notifications schema migration notice: {e}")

    # 4. Dynamic migration for youtube_channels banner_url
    try:
        cursor.execute("PRAGMA table_info(youtube_channels)")
        ch_cols = {row[1] for row in cursor.fetchall()}
        if ch_cols and "banner_url" not in ch_cols:
            cursor.execute("ALTER TABLE youtube_channels ADD COLUMN banner_url TEXT")
            logger.info("Migrated youtube_channels: added 'banner_url' column")
    except Exception as e:
        logger.warning(f"YouTube channels schema migration notice: {e}")

    conn.commit()
    conn.close()
