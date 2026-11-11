-- =============================================================================
-- ApexMind Studio - Database Schema
-- Production Relational Schema for Creator Workflows & YouTube Automation
-- Compatible with SQLite, PostgreSQL, and MySQL
-- =============================================================================

-- 1. Users Table (Creator Accounts & Sessions)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    provider TEXT DEFAULT 'google',
    google_id TEXT,
    password_hash TEXT,
    salt TEXT,
    is_active INTEGER DEFAULT 1,
    active_channel_id TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 2. YouTube Channels Table (Connected Channels & Real-Time Sync)
CREATE TABLE IF NOT EXISTS youtube_channels (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    subscribers INTEGER DEFAULT 0,
    videos_uploaded INTEGER DEFAULT 0,
    avatar_url TEXT,
    banner_url TEXT,
    is_auto_upload_enabled INTEGER DEFAULT 1,
    schedule_cron TEXT DEFAULT 'Daily at 08:00 AM EST',
    connected_at TEXT NOT NULL,
    niche TEXT DEFAULT 'Motivational Quotes',
    refresh_token TEXT,
    access_token TEXT,
    token_expiry TEXT,
    is_oauth_authenticated INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_youtube_channels_connected_at ON youtube_channels (connected_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_handle ON youtube_channels (handle);
-- Index created dynamically in schema.py after column verification

-- 2b. Universal Social Accounts Table (Omnichannel Multi-Platform Support)
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

CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts (user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform_account ON social_accounts (platform, platform_account_id);

-- 2c. Omnichannel Published Posts Table
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

CREATE INDEX IF NOT EXISTS idx_published_posts_user ON published_posts (user_id, published_at DESC);

-- 3. Published Videos Table (Generated & Scheduled YouTube Shorts Catalog)
CREATE TABLE IF NOT EXISTS published_videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    quote TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    published_at TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    duration TEXT DEFAULT '00:30',
    channel_id TEXT,
    video_url TEXT,
    category TEXT DEFAULT 'Motivation',
    voice TEXT DEFAULT 'Fenrir',
    FOREIGN KEY (channel_id) REFERENCES youtube_channels (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_published_videos_published_at ON published_videos (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_published_videos_channel_id ON published_videos (channel_id);

-- 4. Quotes Memory Table (AI Negative Prompt Uniqueness Memory)
CREATE TABLE IF NOT EXISTS quotes_memory (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    hook TEXT,
    quote TEXT NOT NULL,
    category TEXT DEFAULT 'Stoic Mindset & Discipline',
    generated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_memory_generated_at ON quotes_memory (generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_memory_category ON quotes_memory (category);

-- 5. Notifications Table (Creator Activity Alerts & YouTube Sync Notices)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    type TEXT DEFAULT 'info',
    category TEXT DEFAULT 'system',
    action_url TEXT,
    priority TEXT DEFAULT 'normal'
);

CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);

-- 6. Automation Jobs Table (Autonomous Shorts Publishing Schedules)
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

CREATE INDEX IF NOT EXISTS idx_automation_jobs_active ON automation_jobs (active);

-- 6b. Automation History Table (Chronological Execution Runs)
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

CREATE INDEX IF NOT EXISTS idx_automation_history_job_id ON automation_history (job_id, executed_at DESC);

-- 7. Community Posts Table (Real YouTube Community Feed & Creator Updates)
CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    channel_id TEXT,
    author TEXT NOT NULL,
    handle TEXT NOT NULL,
    avatar_url TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    published_at TEXT NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES youtube_channels (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_posts_published_at ON community_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_channel_id ON community_posts (channel_id);

-- 8. Website Studio Videos Table (Videos created exclusively by the website studio)
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

CREATE INDEX IF NOT EXISTS idx_website_videos_created_at ON website_videos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_videos_category ON website_videos (category);

-- 9. AI Usage Quotas Table (Real Google Gemini API Rate Limits & Telemetry)
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

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_user ON ai_usage_quotas (user_id);

