import sqlite3
import os

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEGACY_DB_PATH = os.path.join(BACKEND_DIR, "data", "apexmind.db")
DB_PATH = os.environ.get("APEXMIND_DB_PATH", LEGACY_DB_PATH)


def get_connection() -> sqlite3.Connection:
    """Returns a thread-safe SQLite connection with Row factory."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if (
        os.path.abspath(DB_PATH) != os.path.abspath(LEGACY_DB_PATH)
        and not os.path.exists(DB_PATH)
        and os.path.exists(LEGACY_DB_PATH)
    ):
        source = sqlite3.connect(LEGACY_DB_PATH)
        destination = sqlite3.connect(DB_PATH)
        try:
            source.backup(destination)
        finally:
            destination.close()
            source.close()
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
