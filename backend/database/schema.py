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

    # 4. Dynamic migration for youtube_channels columns (banner_url, user_id & OAuth credentials)
    try:
        cursor.execute("PRAGMA table_info(youtube_channels)")
        ch_cols = {row[1] for row in cursor.fetchall()}
        if ch_cols:
            if "user_id" not in ch_cols:
                cursor.execute("ALTER TABLE youtube_channels ADD COLUMN user_id TEXT")
                logger.info("Migrated youtube_channels: added 'user_id' column")
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
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_youtube_channels_user_id ON youtube_channels (user_id)")
    except Exception as e:
        logger.debug(f"YouTube channels schema migration notice: {e}")

    # 4b. Dynamic migration for users table (password_hash, salt, is_active, active_channel_id)
    try:
        cursor.execute("PRAGMA table_info(users)")
        user_cols = {row[1] for row in cursor.fetchall()}
        if user_cols:
            if "password_hash" not in user_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
                logger.info("Migrated users: added 'password_hash' column")
            if "salt" not in user_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN salt TEXT")
                logger.info("Migrated users: added 'salt' column")
            if "is_active" not in user_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")
                logger.info("Migrated users: added 'is_active' column")
            if "active_channel_id" not in user_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN active_channel_id TEXT")
                logger.info("Migrated users: added 'active_channel_id' column")
    except Exception as e:
        logger.debug(f"Users schema migration notice: {e}")

    # 4c. Verify social_accounts and published_posts tables (Omnichannel Multi-Platform)
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS social_accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            platform_account_id TEXT NOT NULL,
            name TEXT NOT NULL,
            handle TEXT NOT NULL,
            avatar_url TEXT,
            banner_url TEXT,
            followers_count INTEGER DEFAULT 0,
            posts_count INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            is_auto_upload_enabled INTEGER DEFAULT 1,
            schedule_cron TEXT DEFAULT 'Daily at 08:00 AM EST',
            niche TEXT DEFAULT 'Motivational Quotes',
            access_token TEXT,
            refresh_token TEXT,
            token_expiry TEXT,
            token_secret TEXT,
            connected_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            metadata TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts (user_id, platform);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_social_accounts_platform_account ON social_accounts (platform, platform_account_id);")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS published_posts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            social_account_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            video_id_or_url TEXT,
            title TEXT NOT NULL,
            caption TEXT,
            status TEXT DEFAULT 'published',
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            error_message TEXT,
            published_at TEXT NOT NULL,
            FOREIGN KEY (social_account_id) REFERENCES social_accounts (id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_published_posts_user ON published_posts (user_id, published_at DESC);")
    except Exception as e:
        logger.debug(f"Social accounts table migration notice: {e}")

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
            user_id TEXT,
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
            ai_model TEXT DEFAULT NULL,
            aspect_ratio TEXT DEFAULT '9:16',
            length TEXT DEFAULT '30 seconds',
            created_at TEXT
        );
        """)
        cursor.execute("PRAGMA table_info(automation_jobs)")
        auto_cols = {row[1] for row in cursor.fetchall()}
        for col_name, col_def in [
            ("user_id", "TEXT"),
            ("channel_id", "TEXT"),
            ("privacy_status", "TEXT DEFAULT 'public'"),
            ("publish_time", "TEXT DEFAULT '08:00'"),
            ("last_run", "TEXT"),
            ("last_status", "TEXT DEFAULT 'idle'"),
            ("last_video_title", "TEXT"),
            ("last_video_url", "TEXT"),
            ("last_run_message", "TEXT"),
            ("last_is_live", "INTEGER DEFAULT 0"),
            ("ai_model", "TEXT DEFAULT NULL"),
            ("aspect_ratio", "TEXT DEFAULT '9:16'"),
            ("length", "TEXT DEFAULT '30 seconds'"),
            ("created_at", "TEXT"),
        ]:
            if col_name not in auto_cols:
                cursor.execute(f"ALTER TABLE automation_jobs ADD COLUMN {col_name} {col_def}")
                logger.info(f"Migrated automation_jobs: added '{col_name}' column")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_automation_jobs_user_id ON automation_jobs (user_id);")
    except Exception as e:
        logger.debug(f"automation_jobs schema migration notice: {e}")

            # 7. Verify automation_history table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS automation_history (
            id TEXT PRIMARY KEY,
            user_id TEXT,
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
        # Migrate columns if they don't exist yet
        cursor.execute("PRAGMA table_info(automation_history)")
        h_cols = {row[1] for row in cursor.fetchall()}
        if "user_id" not in h_cols:
            cursor.execute("ALTER TABLE automation_history ADD COLUMN user_id TEXT;")
        if "project_data" not in h_cols:
            cursor.execute("ALTER TABLE automation_history ADD COLUMN project_data TEXT;")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_automation_history_job_id ON automation_history (job_id, executed_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_automation_history_user_id ON automation_history (user_id);")
    except Exception as e:
        logger.debug(f"automation_history table initialization notice: {e}")

    # 8. Verify ai_usage_quotas table (Real Google Gemini API Telemetry)
    try:
        cursor.execute("DROP TABLE IF EXISTS ai_usage_quotas;")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_usage_quotas (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            requests_today INTEGER DEFAULT 0,
            limit_daily INTEGER DEFAULT 20,
            reset_daily_at TEXT NOT NULL,
            requests_minute INTEGER DEFAULT 0,
            limit_minute INTEGER DEFAULT 5,
            reset_minute_at TEXT NOT NULL,
            tokens_consumed INTEGER DEFAULT 0,
            updated_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_user ON ai_usage_quotas (user_id);")
        logger.debug("AI usage quotas table verified")
    except Exception as e:
        logger.debug(f"ai_usage_quotas table initialization notice: {e}")

    conn.commit()
    conn.close()
