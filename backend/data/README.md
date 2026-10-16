# ApexMind Studio - Data & Storage (`backend/data`)

This directory is the centralized, dedicated location for all persistent application data, SQLite databases, audio voiceovers, downloaded media, and exported videos.

---

### Data Directory Architecture

| Directory / File | Type | Description | Git Status |
| :--- | :--- | :--- | :--- |
| **`apexmind.db`** | SQLite Database | Primary relational store for channels, video projects, quote memory deduplication, notifications, and settings. | Ignored via `.gitignore` |
| **`audio/`** | Audio Files (`.wav`, `.mp3`) | Synthesized AI voiceover narration, text-to-speech audio cuts, and generated voice clips. | Dynamic files ignored; `.gitkeep` tracked |
| **`media/`** | Video & Images (`.webm`, `.mp4`, `.jpg`, `.png`) | Cached stock footage cuts, open internet media previews, and downloaded visual assets. | Dynamic files ignored; `.gitkeep` tracked |
| **`rendered_shorts/`** | Video Output (`.mp4`) | Exported 1080×1920 (9:16) vertical YouTube Shorts & Instagram Reels rendered by the engine. | Output files ignored; `.gitkeep` tracked |
| **`cache/`** | Temporary Cache | Cached API queries, thumbnail frames, and intermediate processing buffers. | Cache files ignored; `.gitkeep` tracked |

---

### Access from Python Backend
* **Database Connection**: [`backend.database.connection.DB_PATH`](file:///c:/Users/dheen/project/ApexMind.ai/backend/database/connection.py) (`backend/data/apexmind.db`)
* **Voiceover Audio**: `Path("backend/data/audio")`
* **Shorts Video Render**: `Path("backend/data/rendered_shorts")`
* **Media Assets**: `Path("backend/data/media")`
