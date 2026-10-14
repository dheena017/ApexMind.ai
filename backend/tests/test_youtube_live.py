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


def test_youtube_seo_autocomplete():
    """Test live YouTube autocomplete search query predictions."""
    res = client.get("/api/youtube/seo/autocomplete", params={"q": "brain teaser"})
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "brain teaser"
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) > 0


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
    assert analytics["totalVideosUploaded"] >= 9
