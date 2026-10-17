import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_quote_memory_lifecycle():
    # 1. Clean slate
    res = client.delete("/api/quote-memory")
    assert res.status_code == 200

    # 2. Initial empty check
    res = client.get("/api/quote-memory")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["totalQuotesSaved"] == 0
    assert data["uniquenessScore"] == 100
    assert data["memoryStore"] == []

    # 3. Add first quote via POST /api/quote-memory
    quote_1 = {
        "title": "Discipline Over Motivation",
        "hook": "Motivation is a feeling, discipline is an operating system.",
        "quote": "Do what needs to be done, even especially when you do not feel like doing it.",
        "category": "Stoic Mindset & Discipline",
    }
    res = client.post("/api/quote-memory", json=quote_1)
    assert res.status_code == 201
    body1 = res.json()
    assert body1["success"] is True
    assert body1["quote"]["title"] == quote_1["title"]
    assert body1["totalQuotesSaved"] == 1
    quote1_id = body1["quote"]["id"]

    # 4. Add second quote in a different category
    quote_2 = {
        "title": "Deep Focus Warfare",
        "hook": "Distraction is the killer of greatness.",
        "quote": "Eliminate the noise to hear the signal of your true potential.",
        "category": "Deep Work & Focus",
    }
    res = client.post("/api/quote-memory", json=quote_2)
    assert res.status_code == 201
    body2 = res.json()
    assert body2["totalQuotesSaved"] == 2
    quote2_id = body2["quote"]["id"]

    # 5. Verify GET with full list, categories breakdown, and uniqueness
    res = client.get("/api/quote-memory")
    assert res.status_code == 200
    data = res.json()
    assert data["totalQuotesSaved"] == 2
    assert data["filteredCount"] == 2
    assert len(data["memoryStore"]) == 2
    assert "Stoic Mindset & Discipline" in data["categories"]
    assert "Deep Work & Focus" in data["categories"]
    assert len(data["quotes"]) == 2

    # 6. Filter by category
    res = client.get("/api/quote-memory", params={"category": "Deep Work & Focus"})
    assert res.status_code == 200
    filtered = res.json()
    assert filtered["filteredCount"] == 1
    assert filtered["memoryStore"][0]["title"] == "Deep Focus Warfare"

    # 7. Search by keyword
    res = client.get("/api/quote-memory", params={"search": "operating system"})
    assert res.status_code == 200
    searched = res.json()
    assert searched["filteredCount"] == 1
    assert searched["memoryStore"][0]["id"] == quote1_id

    # 8. Delete specific quote by ID
    res = client.delete("/api/quote-memory", params={"id": quote1_id})
    assert res.status_code == 200
    del_data = res.json()
    assert del_data["success"] is True
    assert del_data["deletedCount"] == 1

    # Verify only quote 2 remains
    res = client.get("/api/quote-memory")
    data = res.json()
    assert data["totalQuotesSaved"] == 1
    assert data["memoryStore"][0]["id"] == quote2_id

    # 9. Clear all quotes
    res = client.delete("/api/quote-memory")
    assert res.status_code == 200

    # Verify empty
    res = client.get("/api/quote-memory")
    assert res.json()["totalQuotesSaved"] == 0
