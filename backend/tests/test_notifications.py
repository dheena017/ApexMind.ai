import pytest
from fastapi.testclient import TestClient
from backend.app.factory import create_app

@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)

def test_notifications_unified_manage(client):
    # 1. Create a notification
    res = client.post("/api/notifications", json={
        "title": "Test Alert",
        "message": "Testing unified notification management endpoint",
        "category": "system",
        "type": "info"
    })
    assert res.status_code == 200
    data = res.json()
    notif_id = data["notification"]["id"]

    # 2. Get unread count via /api/notifications/manage
    res = client.post("/api/notifications/manage", json={"action": "unread_count"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["action"] == "unread_count"
    assert "unreadCount" in body

    # 3. Toggle read status via /api/notifications/manage
    res = client.post("/api/notifications/manage", json={
        "action": "toggle_read",
        "notification_id": notif_id,
        "read": True
    })
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["action"] == "toggle_read"
    assert "unreadCount" in body

    # 4. Mark all read via /api/notifications/manage
    res = client.post("/api/notifications/manage", json={"action": "mark_all_read"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["action"] == "mark_all_read"
    assert "unreadCount" in body

    # 5. Delete notification via /api/notifications/manage
    res = client.post("/api/notifications/manage", json={
        "action": "delete",
        "notification_id": notif_id
    })
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["action"] == "delete"
    assert "unreadCount" in body
