-- =============================================================================
-- ApexMind Studio - Database Schema
-- Production Relational Schema for Creator Workflows & YouTube Automation
-- Compatible with SQLite, PostgreSQL, and MySQL
-- =============================================================================

-- 1. Users Table (Google OAuth Creator Accounts & Sessions)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    provider TEXT DEFAULT 'google',
    google_id TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 2. YouTube Channels Table (Connected Channels & Real-Time Sync)
CREATE TABLE IF NOT EXISTS youtube_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    subscribers INTEGER DEFAULT 0,
    videos_uploaded INTEGER DEFAULT 0,
    avatar_url TEXT,
    banner_url TEXT,
    is_auto_upload_enabled INTEGER DEFAULT 1,
    schedule_cron TEXT DEFAULT 'Daily at 08:00 AM EST',
    connected_at TEXT NOT NULL,
    niche TEXT DEFAULT 'Motivational Quotes'
);

CREATE INDEX IF NOT EXISTS idx_youtube_channels_connected_at ON youtube_channels (connected_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_handle ON youtube_channels (handle);

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
    theme TEXT NOT NULL,
    schedule TEXT NOT NULL,
    voice TEXT NOT NULL,
    music_track TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    next_run TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_active ON automation_jobs (active);

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

