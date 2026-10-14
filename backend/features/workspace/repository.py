"""
backend/features/workspace/repository.py
Database persistence and SQLite queries for workspace quote memory.
"""

from datetime import datetime
from typing import List, Dict, Any
from backend.database.connection import get_connection
from backend.database.repository import get_media_library

def fetch_quote_memory(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve stored quotes to evaluate uniqueness."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, hook, quote, category, generated_at FROM quotes_memory ORDER BY generated_at DESC LIMIT ?",
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_quote(title: str, hook: str, quote: str, category: str) -> Dict[str, Any]:
    """Save newly generated quote to SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    record_id = f"mem_{int(datetime.utcnow().timestamp() * 1000)}"
    timestamp = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO quotes_memory (id, title, hook, quote, category, generated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (record_id, title, hook, quote, category, timestamp))
    conn.commit()
    conn.close()
    return {
        "id": record_id,
        "title": title,
        "hook": hook,
        "quote": quote,
        "category": category,
        "generated_at": timestamp,
    }

def delete_all_quotes() -> int:
    """Clear memory store."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quotes_memory")
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted

def fetch_media_library() -> Dict[str, Any]:
    """Retrieve media library catalog from SQLite database."""
    return get_media_library()

