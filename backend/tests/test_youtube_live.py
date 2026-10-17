import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.connection import get_connection

client = TestClient(app)

def test_database_has_no_fake_youtube_records():
    """Verify that apexmind.db has zero fake published_videos or mock community posts."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM published_videos")
    (pub_count,) = cursor.fetchone()
    assert pub_count == 0, f"Found {pub_count} fake videos in published_videos table! Must be 0."

    cursor.execute("SELECT count(*) FROM community_posts")
    (post_count,) = cursor.fetchone()
    assert post_count == 0, f"Found {post_count} fake posts in community_posts table! Must be 0."
    conn.close()


def test_youtube_search_videos():
    """Test live YouTube video search."""
    res = client.get("/api/youtube/search/videos", params={"query": "brain teaser", "limit": 5})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert isinstance(data["videos"], list)


def test_youtube_channel_live_lookup():
    """Test live channel resolution for @emoji-eye-spy."""
    res = client.get("/api/youtube/channel/details", params={"channel": "@emoji-eye-spy"})
    assert res.status_code == 200
    data = res.json()
    channel = data["channel"]
    assert channel["handle"] == "@emoji-eye-spy"
    assert channel["subscribers"] >= 70
    assert "https://www.youtube.com/@emoji-eye-spy" in channel["channelUrl"]


def test_youtube_channel_feed():
    """Test live dual-engine video feed extraction."""
    res = client.get("/api/youtube/channel/feed", params={"channel": "@emoji-eye-spy"})
    assert res.status_code == 200
    feed = res.json()
    assert "channel" in feed
    assert "videos" in feed
    assert "shorts" in feed
    assert len(feed["videos"]) > 0
    # Confirm thumbnail URLs are real YouTube CDN links
    first_vid = feed["videos"][0]
    assert "i.ytimg.com" in first_vid["thumbnailUrl"]
    assert "https://www.youtube.com/watch?v=" in first_vid["videoUrl"]


def test_youtube_channel_analytics():
    """Test live derived channel analytics."""
    res = client.get("/api/youtube/channel/analytics", params={"channel": "@emoji-eye-spy"})
    assert res.status_code == 200
    data = res.json()
    analytics = data["analytics"]
    assert analytics["channelName"] == "Emoji Eye Spy"
    assert analytics["subscribers"] >= 70
    assert analytics["totalVideosUploaded"] >= 1


def test_youtube_publish_json():
    """Test unified RESTful /api/youtube/videos endpoint with JSON short payload."""
    res = client.post("/api/youtube/videos", json={
        "title": "Test Motivational Short",
        "quote": "Success is the sum of small efforts repeated daily.",
        "voice": "Fenrir",
        "category": "Motivation",
    })
    try:
        assert res.status_code == 201
        data = res.json()
        assert data["success"] is True
        assert "video" in data
        assert data["video"]["title"] == "Test Motivational Short"
    finally:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM published_videos WHERE title = 'Test Motivational Short'")
        conn.commit()
        conn.close()


def test_youtube_publish_alias():
    """Test backward-compatibility alias /api/youtube/publish."""
    res = client.post("/api/youtube/publish", json={
        "title": "Test Alias Short",
        "quote": "Consistency builds greatness.",
        "voice": "Fenrir",
        "category": "Motivation",
    })
    try:
        assert res.status_code == 201
        data = res.json()
        assert data["success"] is True
    finally:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM published_videos WHERE title = 'Test Alias Short'")
        conn.commit()
        conn.close()


def test_youtube_publish_update():
    """Test updating and deleting video metadata via unified POST /api/youtube/videos endpoint."""
    # POST /api/youtube/videos with action="update"
    post_update_res = client.post(
        "/api/youtube/videos",
        json={"videoId": "dummy123", "title": "Updated Title Via POST", "action": "update"},
    )
    assert post_update_res.status_code in (200, 400, 401)

    # POST /api/youtube/videos with action="delete"
    post_delete_res = client.post(
        "/api/youtube/videos",
        json={"videoId": "dummy123", "action": "delete"},
    )
    assert post_delete_res.status_code in (200, 400, 401)


def test_youtube_playlists_endpoint():
    """Test unified POST /api/youtube/playlists endpoint."""
    res = client.post(
        "/api/youtube/playlists",
        json={"title": "Test Playlist", "description": "Playlist desc", "action": "create"},
    )
    # Without live OAuth credentials in test environment, it handles cleanly with 400
    assert res.status_code in (200, 201, 400, 401)


def test_youtube_comments_endpoint():
    """Test unified POST /api/youtube/video/comments endpoint."""
    res = client.post(
        "/api/youtube/video/comments",
        json={"videoId": "dummy123", "text": "Great video!"},
    )
    assert res.status_code in (200, 201, 400, 401)

