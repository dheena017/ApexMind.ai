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

        cursor.execute("SELECT COUNT(*) FROM website_videos")
        v_count = cursor.fetchone()[0]
        if v_count == 0:
            import json
            starter_videos = [
                (
                    "vid_web_001",
                    "Unshakable Stoic Discipline",
                    "You have power over your mind - not outside events. Realize this, and you will find unstoppable strength.",
                    "Stop seeking comfort in excuses.",
                    "Master your mind today. Subscribe for daily stoic fire.",
                    "Stoic Mindset & Discipline",
                    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    "",
                    "Fenrir",
                    "9:16",
                    "00:30",
                    "v1",
                    json.dumps([
                        {"text": "Stop seeking comfort in excuses.", "start": 0, "duration": 4},
                        {"text": "You have power over your mind - not outside events.", "start": 4, "duration": 14},
                        {"text": "Realize this, and you will find unstoppable strength.", "start": 18, "duration": 8},
                        {"text": "Master your mind today.", "start": 26, "duration": 4}
                    ]),
                    json.dumps(["#stoic", "#discipline", "#motivation", "#shorts", "#mindset"]),
                    "ready",
                    "2026-10-14T08:30:00"
                ),
                (
                    "vid_web_002",
                    "Relentless Iron Will & Pain",
                    "Suffering produces endurance, and endurance produces character, and character produces unshakable hope.",
                    "The pain you feel today is the strength you build tomorrow.",
                    "Lock in and push past your limits.",
                    "Fitness & Iron Will",
                    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&q=85",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
                    "",
                    "Charon",
                    "9:16",
                    "00:25",
                    "v3",
                    json.dumps([
                        {"text": "The pain you feel today is the strength you build tomorrow.", "start": 0, "duration": 6},
                        {"text": "Suffering produces endurance.", "start": 6, "duration": 8},
                        {"text": "Endurance produces character and unshakable hope.", "start": 14, "duration": 8},
                        {"text": "Lock in and push past your limits.", "start": 22, "duration": 3}
                    ]),
                    json.dumps(["#fitness", "#grit", "#gymmotivation", "#relentless"]),
                    "ready",
                    "2026-10-14T07:15:00"
                ),
                (
                    "vid_web_003",
                    "Deep Focus In A Distracted Era",
                    "The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable.",
                    "Disconnect from the noise to connect with your destiny.",
                    "Enter flow state and conquer your goals.",
                    "Deep Focus & Flow",
                    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=85",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                    "",
                    "Kore",
                    "9:16",
                    "00:32",
                    "v2",
                    json.dumps([
                        {"text": "Disconnect from the noise to connect with your destiny.", "start": 0, "duration": 5},
                        {"text": "Deep work is becoming increasingly rare.", "start": 5, "duration": 12},
                        {"text": "Enter flow state and conquer your highest goals.", "start": 17, "duration": 15}
                    ]),
                    json.dumps(["#deepwork", "#focus", "#productivity", "#mindset"]),
                    "ready",
                    "2026-10-13T19:40:00"
                ),
                (
                    "vid_web_004",
                    "Calm Mind Amidst The Storm",
                    "The sea does not ask the storm for permission to rise. Become the ocean, not the wreckage.",
                    "When chaos surrounds you, stillness is your greatest weapon.",
                    "Stay grounded. Breathe. Conquer.",
                    "Calm & Resilience",
                    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=85",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                    "",
                    "Zephyr",
                    "9:16",
                    "00:28",
                    "v4",
                    json.dumps([
                        {"text": "When chaos surrounds you, stillness is your greatest weapon.", "start": 0, "duration": 6},
                        {"text": "Become the ocean, not the wreckage.", "start": 6, "duration": 14},
                        {"text": "Stay grounded and conquer.", "start": 20, "duration": 8}
                    ]),
                    json.dumps(["#resilience", "#innerpeace", "#mindfulness", "#stoicism"]),
                    "ready",
                    "2026-10-13T14:10:00"
                ),
                (
                    "vid_web_005",
                    "Rise From The Ashes",
                    "A fiery blaze turns everything thrown into it into fuel and brightness. Your obstacles are your fire.",
                    "Do not fear the furnace that creates your gold.",
                    "Ignite your inner fire today.",
                    "Unstoppable Motivation",
                    "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1080&q=85",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
                    "",
                    "Puck",
                    "9:16",
                    "00:26",
                    "v3",
                    json.dumps([
                        {"text": "Do not fear the furnace that creates your gold.", "start": 0, "duration": 5},
                        {"text": "Your obstacles are your fuel and your brightness.", "start": 5, "duration": 13},
                        {"text": "Ignite your inner fire today.", "start": 18, "duration": 8}
                    ]),
                    json.dumps(["#riseup", "#motivation", "#fire", "#grind"]),
                    "ready",
                    "2026-10-12T16:00:00"
                ),
                (
                    "vid_web_006",
                    "The Lone Wolf Architect",
                    "Build in silence, execute with absolute precision, and let the finished empire make all the noise.",
                    "Nobody needs to see the blueprints until the palace stands.",
                    "Keep building. Your time is coming.",
                    "Stoic Mindset & Discipline",
                    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=85",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
                    "",
                    "Fenrir",
                    "9:16",
                    "00:30",
                    "v1",
                    json.dumps([
                        {"text": "Nobody needs to see the blueprints until the palace stands.", "start": 0, "duration": 6},
                        {"text": "Build in silence, execute with precision.", "start": 6, "duration": 14},
                        {"text": "Keep building. Your time is coming.", "start": 20, "duration": 10}
                    ]),
                    json.dumps(["#architect", "#silence", "#success", "#mindset"]),
                    "ready",
                    "2026-10-11T12:00:00"
                )
            ]
            cursor.executemany("""
            INSERT INTO website_videos (
                id, title, quote, hook, cta, category, cover_image_url, video_url, audio_url,
                voice, aspect_ratio, duration, visual_theme, subtitles, tags, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, starter_videos)
            logger.info("Seeded initial studio-created website videos in website_videos table")
    except Exception as e:
        logger.warning(f"website_videos table initialization notice: {e}")

    conn.commit()
    conn.close()
