import sqlite3
import os

# Database file located in backend/data/
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, "data", "apexmind.db")


def get_connection() -> sqlite3.Connection:
    """Returns a thread-safe SQLite connection with Row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
