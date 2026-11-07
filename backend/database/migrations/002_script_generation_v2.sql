-- 002_script_generation_v2.sql
-- ApexMind.ai Script Generation Architecture v2 Database Migration
-- Fully compatible with SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    generation_profile TEXT NOT NULL DEFAULT 'motivational_reel',
    title TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL DEFAULT '9:16',
    total_duration REAL NOT NULL DEFAULT 30.0,
    status TEXT NOT NULL DEFAULT 'draft',
    current_version_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS script_versions (
    id TEXT PRIMARY KEY,
    script_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    generation_profile TEXT NOT NULL DEFAULT 'motivational_reel',
    title TEXT NOT NULL,
    description TEXT,
    total_duration REAL NOT NULL,
    aspect_ratio TEXT NOT NULL,
    document_payload TEXT NOT NULL,
    asset_manifest TEXT,
    change_summary TEXT,
    created_by TEXT NOT NULL DEFAULT 'ai_agent',
    created_at TEXT NOT NULL,
    FOREIGN KEY(script_id) REFERENCES scripts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scene_versions (
    id TEXT PRIMARY KEY,
    script_version_id TEXT NOT NULL,
    scene_number INTEGER NOT NULL,
    scene_id TEXT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    duration REAL NOT NULL,
    narration TEXT,
    visual_description TEXT,
    scene_payload TEXT NOT NULL,
    FOREIGN KEY(script_version_id) REFERENCES script_versions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS script_approvals (
    id TEXT PRIMARY KEY,
    script_version_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by TEXT,
    approved_at TEXT,
    comments TEXT,
    FOREIGN KEY(script_version_id) REFERENCES script_versions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generation_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    project_id TEXT,
    generation_profile TEXT NOT NULL DEFAULT 'motivational_reel',
    status TEXT NOT NULL DEFAULT 'queued',
    phase TEXT NOT NULL DEFAULT 'queued',
    progress_percent INTEGER NOT NULL DEFAULT 0,
    fencing_token INTEGER NOT NULL DEFAULT 0,
    worker_id TEXT,
    lease_expires_at TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    payload TEXT NOT NULL,
    result TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_scripts_project_id ON scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_script_versions_script_id ON script_versions(script_id);
CREATE INDEX IF NOT EXISTS idx_scene_versions_version_id ON scene_versions(script_version_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status_lease ON generation_jobs(status, lease_expires_at);

