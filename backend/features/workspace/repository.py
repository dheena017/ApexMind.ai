"""
backend/features/workspace/repository.py
Database persistence and SQLite queries for workspace quote memory.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.database.connection import get_connection
from backend.database.repository import get_media_library


def fetch_quote_memory(
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "newest",
) -> List[Dict[str, Any]]:
    """Retrieve stored quotes to evaluate uniqueness and power creative deduplication."""
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT id, title, hook, quote, category, generated_at FROM quotes_memory"
    conditions = []
    params: List[Any] = []

    if category and category.strip():
        conditions.append("LOWER(category) = LOWER(?)")
        params.append(category.strip())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        conditions.append("(LOWER(title) LIKE ? OR LOWER(quote) LIKE ? OR LOWER(hook) LIKE ?)")
        params.extend([term, term, term])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    order_map = {
        "oldest": "ORDER BY generated_at ASC",
        "category": "ORDER BY category ASC, generated_at DESC",
        "title": "ORDER BY title ASC",
        "newest": "ORDER BY generated_at DESC",
    }
    query += f" {order_map.get(sort, 'ORDER BY generated_at DESC')} LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def count_quotes(category: Optional[str] = None, search: Optional[str] = None) -> int:
    """Return total quotes matching optional category or search filters."""
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT COUNT(*) FROM quotes_memory"
    conditions = []
    params: List[Any] = []

    if category and category.strip():
        conditions.append("LOWER(category) = LOWER(?)")
        params.append(category.strip())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        conditions.append("(LOWER(title) LIKE ? OR LOWER(quote) LIKE ? OR LOWER(hook) LIKE ?)")
        params.extend([term, term, term])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    cursor.execute(query, tuple(params))
    count = cursor.fetchone()[0]
    conn.close()
    return count


def get_quote_categories_breakdown() -> Dict[str, int]:
    """Return counts of stored quotes grouped by category."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT category, COUNT(*) as cnt FROM quotes_memory GROUP BY category ORDER BY cnt DESC"
    )
    rows = cursor.fetchall()
    conn.close()
    return {r["category"] or "General": r["cnt"] for r in rows}


def save_quote(title: str, hook: str, quote: str, category: str) -> Dict[str, Any]:
    """Save newly generated or user-added quote to SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    record_id = f"mem_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    timestamp = datetime.now(timezone.utc).isoformat()
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


def delete_quote_by_id(quote_id: str) -> bool:
    """Delete a single quote by record ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quotes_memory WHERE id = ?", (quote_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def delete_all_quotes() -> int:
    """Clear entire quote memory store."""
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
