import os
import json
import logging
from datetime import datetime, timezone, timedelta
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
            logger.debug("Schema verified (schema.sql)")

    # 2. Seed initial data using idempotent INSERT OR IGNORE
    if os.path.exists(SEED_FILE):
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            seed_sql = f.read()
            cursor.executescript(seed_sql)
            logger.debug("Presets verified (seed.sql)")

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
        logger.debug(f"Notifications schema migration notice: {e}")

    # 4. Dynamic migration for youtube_channels columns (banner_url & OAuth credentials)
    try:
        cursor.execute("PRAGMA table_info(youtube_channels)")
        ch_cols = {row[1] for row in cursor.fetchall()}
        if ch_cols:
            if "banner_url" not in ch_cols:
                cursor.execute("ALTER TABLE youtube_channels ADD COLUMN banner_url TEXT")
                logger.info("Migrated youtube_channels: added 'banner_url' column")
            if "refresh_token" not in ch_cols:
                cursor.execute("ALTER TABLE youtube_channels ADD COLUMN refresh_token TEXT")
                logger.info("Migrated youtube_channels: added 'refresh_token' column")
            if "access_token" not in ch_cols:
                cursor.execute("ALTER TABLE youtube_channels ADD COLUMN access_token TEXT")
                logger.info("Migrated youtube_channels: added 'access_token' column")
            if "token_expiry" not in ch_cols:
                cursor.execute("ALTER TABLE youtube_channels ADD COLUMN token_expiry TEXT")
                logger.info("Migrated youtube_channels: added 'token_expiry' column")
            if "is_oauth_authenticated" not in ch_cols:
                cursor.execute("ALTER TABLE youtube_channels ADD COLUMN is_oauth_authenticated INTEGER DEFAULT 0")
                logger.info("Migrated youtube_channels: added 'is_oauth_authenticated' column")
    except Exception as e:
        logger.debug(f"YouTube channels schema migration notice: {e}")

    # 5. Verify website_videos table & seed starter studio-created videos if empty
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS website_videos (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            quote TEXT NOT NULL,
            hook TEXT,
            cta TEXT,
            category TEXT DEFAULT 'Stoic Mindset & Discipline',
            cover_image_url TEXT NOT NULL,
            video_url TEXT,
            audio_url TEXT,
            voice TEXT DEFAULT 'Fenrir',
            aspect_ratio TEXT DEFAULT '9:16',
            duration TEXT DEFAULT '00:30',
            visual_theme TEXT DEFAULT 'v1',
            subtitles TEXT,
            tags TEXT,
            status TEXT DEFAULT 'ready',
            created_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_website_videos_created_at ON website_videos (created_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_website_videos_category ON website_videos (category);")
    except Exception as e:
        logger.debug(f"website_videos table initialization notice: {e}")

    # 6. Verify automation_jobs table and columns
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS automation_jobs (
            id TEXT PRIMARY KEY,
            theme TEXT NOT NULL,
            schedule TEXT NOT NULL,
            voice TEXT NOT NULL,
            music_track TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            next_run TEXT NOT NULL,
            channel_id TEXT,
            privacy_status TEXT DEFAULT 'public',
            publish_time TEXT DEFAULT '08:00',
            last_run TEXT,
            last_status TEXT DEFAULT 'idle',
            last_video_title TEXT,
            last_video_url TEXT,
            last_run_message TEXT,
            last_is_live INTEGER DEFAULT 0,
            created_at TEXT
        );
        """)
        cursor.execute("PRAGMA table_info(automation_jobs)")
        auto_cols = {row[1] for row in cursor.fetchall()}
        for col_name, col_def in [
            ("channel_id", "TEXT"),
            ("privacy_status", "TEXT DEFAULT 'public'"),
            ("publish_time", "TEXT DEFAULT '08:00'"),
            ("last_run", "TEXT"),
            ("last_status", "TEXT DEFAULT 'idle'"),
            ("last_video_title", "TEXT"),
            ("last_video_url", "TEXT"),
            ("last_run_message", "TEXT"),
            ("last_is_live", "INTEGER DEFAULT 0"),
            ("ai_model", "TEXT DEFAULT 'gemini-2.5-flash'"),
            ("aspect_ratio", "TEXT DEFAULT '9:16'"),
            ("length", "TEXT DEFAULT '30 seconds'"),
            ("created_at", "TEXT"),
        ]:
            if col_name not in auto_cols:
                cursor.execute(f"ALTER TABLE automation_jobs ADD COLUMN {col_name} {col_def}")
                logger.info(f"Migrated automation_jobs: added '{col_name}' column")

        # Seed default automation job if none exist
        cursor.execute("SELECT COUNT(*) FROM automation_jobs")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
            INSERT INTO automation_jobs (id, theme, schedule, voice, music_track, active, next_run, privacy_status, publish_time, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, 'public', '08:00', datetime('now'))
            """, (
                "job_daily_stoic",
                "Stoic Mindset & Discipline",
                "Daily at 08:00 AM",
                "Fenrir",
                "Epic Cinematic",
                (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=8, minute=0, second=0).isoformat(),
            ))
            logger.info("Seeded starter automation job: 'job_daily_stoic'")
    except Exception as e:
        logger.debug(f"automation_jobs schema migration notice: {e}")

    # 7. Verify automation_history table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS automation_history (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            status TEXT NOT NULL,
            video_title TEXT,
            video_url TEXT,
            youtube_url TEXT,
            is_live INTEGER DEFAULT 0,
            duration_seconds REAL DEFAULT 0,
            message TEXT,
            executed_at TEXT NOT NULL,
            project_data TEXT,
            FOREIGN KEY (job_id) REFERENCES automation_jobs(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_automation_history_job_id ON automation_history (job_id, executed_at DESC);")
        # Migrate project_data column if it doesn't exist yet
        try:
            cursor.execute("ALTER TABLE automation_history ADD COLUMN project_data TEXT;")
        except Exception:
            pass
    except Exception as e:
        logger.debug(f"automation_history table initialization notice: {e}")

    conn.commit()
    conn.close()
