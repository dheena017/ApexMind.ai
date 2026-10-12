-- =============================================================================
-- ApexMind Studio - Database Schema
-- Compatible with SQLite, PostgreSQL, and MySQL
-- =============================================================================

-- 1. Quotes Memory Table
-- Ensures 100% uniqueness by storing all past generated quotes for negative prompt constraints
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

-- 2. YouTube Channels Table
-- Stores connected YouTube channels, automated upload configurations, and statistics
CREATE TABLE IF NOT EXISTS youtube_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    subscribers INTEGER DEFAULT 0,
    videos_uploaded INTEGER DEFAULT 0,
    avatar_url TEXT,
    is_auto_upload_enabled INTEGER DEFAULT 1,
    schedule_cron TEXT DEFAULT 'Daily at 08:00 AM EST',
    connected_at TEXT NOT NULL,
    niche TEXT DEFAULT 'Motivational Quotes'
);

CREATE INDEX IF NOT EXISTS idx_youtube_channels_connected_at ON youtube_channels (connected_at DESC);

-- 3. Published Videos Table
-- Tracks all published YouTube Shorts, viewer metrics, and voice/visual configurations
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

-- 4. Notifications Table
-- System alerts, video upload confirmation, and channel connection logs
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    type TEXT DEFAULT 'info'
);

CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);

-- 5. Automation Jobs Table
-- Scheduled automated pipelines for daily YouTube Shorts generation and publishing
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

-- 6. Media Audio Tracks Table
CREATE TABLE IF NOT EXISTS media_tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    duration TEXT NOT NULL,
    bpm INTEGER NOT NULL,
    copyright_free INTEGER DEFAULT 1,
    license TEXT NOT NULL,
    frequency_data TEXT NOT NULL
);

-- 7. Media Visual Backdrops Table
CREATE TABLE IF NOT EXISTS visual_backdrops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    aspect_ratio TEXT DEFAULT '9:16',
    preview_color TEXT NOT NULL,
    text_color TEXT NOT NULL,
    particle_effect TEXT NOT NULL
);

-- 8. Voice Profiles Table
CREATE TABLE IF NOT EXISTS voice_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    style TEXT NOT NULL,
    speed TEXT DEFAULT '1.0x'
);
