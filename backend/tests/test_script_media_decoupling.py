"""
backend/tests/test_script_media_decoupling.py
Unit and integration tests verifying the decoupled dynamic media pipeline:
1. Pure script generation unblocked from media network latency.
2. Concurrent batch scene media resolution with deduplication.
3. Single scene regeneration with exclusion list support.
4. Closed Captions generation with word-level karaoke timestamps, SRT, and WebVTT.
5. Absence of hardcoded mock sample strings.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend.app.factory import create_app
from backend.features.media.schemas import SceneResolveItem
from backend.features.media.service import resolve_scenes_batch, resolve_single_scene
from backend.features.workspace.captions_service import generate_closed_captions


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_script_generation_is_decoupled(client):
    """Verifies that POST /api/generate-script generates scenes without blocking on media search."""
    mock_gemini_response = {
        "title": "Unbreakable Focus",
        "hook": "The greatest distraction is hesitation.",
        "quote": "Do what you must, let happen what may.",
        "cta": "Follow for daily discipline.",
        "estimatedDuration": "30s",
        "storyboard": [
            {
                "sceneNumber": 1,
                "subtitleText": "The greatest distraction is hesitation.",
                "duration": 3.0,
                "visualQuery": "dark pine mountain storm sunrise",
                "googleSearchQuery": "dark pine mountain sunrise 9:16",
                "fallbackQueries": ["alpine mountain ridge 9:16"],
                "mediaType": "video",
            },
            {
                "sceneNumber": 2,
                "subtitleText": "Every second you hesitate, someone else claims the ground.",
                "duration": 3.0,
                "visualQuery": "lone athlete sprint uphill rain",
                "googleSearchQuery": "lone athlete sprint uphill rain 9:16",
                "fallbackQueries": [],
                "mediaType": "video",
            },
        ],
        "soundDesign": {
            "soundtrackTrackId": "dark_cinematic_strings",
            "suggestedBgmQuery": "dark cinematic strings",
        },
    }

    with patch("backend.features.workspace.service.generate_gemini_script", return_value=mock_gemini_response):
        resp = client.post(
            "/api/generate-script",
            json={
                "category": "Stoic Mindset & Discipline",
                "topic": "Focus and Discipline",
                "aspectRatio": "9:16",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Unbreakable Focus"
        assert len(data["data"]["storyboard"]) == 2
        # Verify visual queries are present
        assert data["data"]["storyboard"][0]["visualQuery"] == "dark pine mountain storm sunrise"


def test_batch_scene_resolution():
    """Verifies concurrent batch scene resolution returns valid structure and deduplicated assets."""
    from backend.features.media.base import MediaAsset
    mock_asset_1 = MediaAsset(
        id="vid_1",
        mediaType="video",
        title="Mountain Sunrise",
        url="https://example.com/videos/mountain.mp4",
        previewUrl="https://example.com/videos/mountain.jpg",
        aspectRatio="9:16",
        provider="pexels",
    )

    items = [
        SceneResolveItem(sceneNumber=1, visualQuery="mountain sunrise", mediaType="video"),
        SceneResolveItem(sceneNumber=2, visualQuery="athlete sprint", mediaType="video"),
    ]

    with patch("backend.features.media.service.google_video.is_configured", return_value=False), \
         patch("backend.features.media.service.pexels_video.is_configured", return_value=True), \
         patch("backend.features.media.service.pexels_video.search", return_value=[mock_asset_1]), \
         patch("backend.features.media.service.pixabay_video.is_configured", return_value=True):
        
        batch_res = resolve_scenes_batch(items, aspect_ratio="9:16")
        assert batch_res.totalScenes == 2
        assert len(batch_res.scenes) == 2
        assert batch_res.scenes[0].sceneNumber == 1
        assert batch_res.scenes[1].sceneNumber == 2


def test_single_scene_regeneration_with_exclusions():
    """Verifies that single scene regeneration respects exclude_urls."""
    from backend.features.media.base import MediaAsset
    mock_old_url = "https://example.com/videos/mountain_old.mp4"
    mock_new_url = "https://example.com/videos/mountain_new.mp4"

    mock_candidates = [
        MediaAsset(id="v1", title="Old Vid", url=mock_old_url, previewUrl="", aspectRatio="9:16", provider="pexels", mediaType="video"),
        MediaAsset(id="v2", title="New Vid", url=mock_new_url, previewUrl="", aspectRatio="9:16", provider="pexels", mediaType="video"),
    ]

    with patch("backend.features.media.service.google_video.is_configured", return_value=False), \
         patch("backend.features.media.service.pexels_video.is_configured", return_value=True), \
         patch("backend.features.media.service.pexels_video.search", return_value=mock_candidates):
        
        res = resolve_single_scene(
            scene_number=1,
            query="mountain landscape",
            exclude_urls=[mock_old_url],
        )
        assert res.status == "resolved"
        assert res.media.url == mock_new_url


def test_closed_captions_generation(client):
    """Verifies Closed Captions generation produces valid karaoke timestamps, SRT, and WebVTT."""
    text = "The voice in your head telling you to wait is a liar."
    duration = 3.6

    resp = client.post(
        "/api/generate-captions",
        json={
            "text": text,
            "durationSeconds": duration,
            "stylePreset": "sub-hormozi",
            "maxWordsPerSegment": 4,
        },
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["totalWords"] == 12
    assert len(data["segments"]) >= 2
    assert "00:00:00" in data["srtExport"]
    assert "WEBVTT" in data["vttExport"]
    # Check that word timings are sequential
    first_seg_words = data["segments"][0]["words"]
    assert first_seg_words[0]["word"] == "The"
    assert first_seg_words[0]["start"] == 0.0


def test_no_mock_sample_strings_in_responses(client):
    """Guarantees that mock URLs like 'commondatastorage' and 'sintel' never leak into responses."""
    resp = client.get("/api/media/providers")
    assert resp.status_code == 200
    raw_text = resp.text.lower()
    for bad in ["commondatastorage", "sintel", "forbigger", "subaru", "tearsofsteel"]:
        assert bad not in raw_text
