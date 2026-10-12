-- =============================================================================
-- ApexMind Studio - Database Seed Data (System Assets Only)
-- Royalty-free audio tracks, visual backdrops, and vocal synthesis profiles.
-- No fake user channels, published videos, notifications, or jobs.
-- =============================================================================

-- 1. Royalty-Free Background Music Tracks
INSERT OR IGNORE INTO media_tracks (
    id, title, genre, duration, bpm, copyright_free, license, frequency_data
) VALUES 
('m1', 'Ambient Motivation', 'Cinematic Ambient', '02:15', 78, 1, 'ApexMind Free Commercial License', '[20, 35, 50, 75, 90, 60, 45, 80, 95, 70, 40, 60, 85, 90, 50]'),
('m2', 'Cinematic Triumph', 'Orchestral Hybrid', '01:50', 95, 1, 'ApexMind Free Commercial License', '[30, 45, 85, 95, 100, 80, 65, 90, 95, 85, 60, 75, 90, 80, 40]'),
('m3', 'Epic Growth', 'Deep Synthwave', '02:04', 110, 1, 'ApexMind Free Commercial License', '[40, 60, 70, 80, 90, 95, 80, 70, 85, 90, 100, 85, 70, 60, 30]'),
('m4', 'Lo-Fi Chill Discipline', 'Lo-Fi Beats', '01:45', 82, 1, 'ApexMind Free Commercial License', '[15, 25, 40, 55, 60, 50, 45, 65, 70, 55, 40, 50, 60, 40, 20]');

-- 2. Visual Backdrops
INSERT OR IGNORE INTO visual_backdrops (
    id, name, category, aspect_ratio, preview_color, text_color, particle_effect
) VALUES 
('v1', 'Dark Mountain Dawn', 'Nature & Solitude', '9:16', 'from-slate-900 via-indigo-950 to-purple-950', '#FFFFFF', 'glowing-dust'),
('v2', 'Cyberpunk Workspace', 'Futuristic Studio', '9:16', 'from-slate-950 via-purple-950 to-cyan-950', '#38BDF8', 'neon-grid'),
('v3', 'Dramatic Gym Shadows', 'Fitness & Power', '9:16', 'from-neutral-950 via-stone-900 to-amber-950', '#F59E0B', 'smoke-sparks'),
('v4', 'Deep Ocean Mindset', 'Calm & Resilience', '9:16', 'from-slate-950 via-blue-950 to-teal-950', '#2DD4BF', 'water-ripples');

-- 3. Voice Profiles
INSERT OR IGNORE INTO voice_profiles (
    id, name, gender, style, speed
) VALUES 
('Kore', 'Kore', 'Female', 'Clear, Inspiring, Authoritative', '1.0x'),
('Fenrir', 'Fenrir', 'Male', 'Deep, Powerful, Stoic Leader', '0.95x'),
('Puck', 'Puck', 'Male', 'Energetic, High-Octane Motivational', '1.05x'),
('Zephyr', 'Zephyr', 'Female', 'Smooth, Calming Wisdom & Meditation', '0.9x'),
('Charon', 'Charon', 'Male', 'Grit & Relentless Focus', '1.0x');
