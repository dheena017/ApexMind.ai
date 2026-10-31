"""
backend/tests/test_semantic_filter.py
Unit tests for Semantic Negative Filtering & Aesthetic Prioritization for stock footage.
"""

import unittest
from backend.features.media.base import MediaAsset
from backend.features.media.semantic_filter import evaluate_clip, filter_and_rank_candidates


class TestSemanticFilter(unittest.TestCase):
    def test_rejects_human_speech_talking_heads(self):
        asset = MediaAsset(
            id="talk_1",
            mediaType="video",
            title="Businessman talking to camera interview in studio",
            url="https://example.com/video1.mp4",
            aspectRatio="9:16",
            provider="pexels",
            extraMetadata={"tags": ["podcast", "talking head", "interview", "explaining"]},
        )
        res = evaluate_clip(asset)
        self.assertFalse(res.is_accepted)
        self.assertEqual(res.rejection_category, "human_speech")
        self.assertTrue("talking to camera" in (res.rejection_reason or "") or "interview" in (res.rejection_reason or ""))

    def test_rejects_crowded_city_streets(self):
        asset = MediaAsset(
            id="crowd_1",
            mediaType="video",
            title="Rush hour commuters in city crosswalk crowd",
            url="https://example.com/crowd.mp4",
            aspectRatio="9:16",
            provider="pexels",
            extraMetadata={"tags": ["crowded street", "pedestrians", "traffic jam"]},
        )
        res = evaluate_clip(asset)
        self.assertFalse(res.is_accepted)
        self.assertEqual(res.rejection_category, "crowded_city")

    def test_rejects_modern_tech_and_office_cubicles(self):
        asset = MediaAsset(
            id="tech_1",
            mediaType="video",
            title="Employee typing on laptop at office cubicle desk",
            url="https://example.com/office.mp4",
            aspectRatio="9:16",
            provider="pexels",
            extraMetadata={"tags": ["office desk", "corporate meeting", "laptop", "software code"]},
        )
        res = evaluate_clip(asset, target_query="motivation stoic focus")
        self.assertFalse(res.is_accepted)
        self.assertEqual(res.rejection_category, "modern_tech")

    def test_rejects_clipart_and_green_screens(self):
        asset = MediaAsset(
            id="chroma_1",
            mediaType="video",
            title="Subscribe button like animation green screen chroma key",
            url="https://example.com/chroma.mp4",
            aspectRatio="9:16",
            provider="pixabay",
        )
        res = evaluate_clip(asset)
        self.assertFalse(res.is_accepted)
        self.assertEqual(res.rejection_category, "clipart_overlay")

    def test_prioritizes_high_contrast_slow_motion_nature(self):
        slomo_nature = MediaAsset(
            id="epic_1",
            mediaType="video",
            title="Majestic mountain summit golden hour slow motion",
            url="https://example.com/slomo.mp4",
            resolution="1080x1920",
            aspectRatio="9:16",
            duration=7.5,
            provider="pexels",
            extraMetadata={
                "fps": 60.0,
                "tags": ["mountain peak", "sunset", "golden hour", "slow motion", "dramatic lighting"],
            },
        )
        res = evaluate_clip(slomo_nature)
        self.assertTrue(res.is_accepted)
        self.assertGreaterEqual(res.aesthetic_score, 120.0)
        self.assertIn("60fps High-Speed", res.badges)
        self.assertIn("Golden Hour", res.badges)
        self.assertIn("Epic Nature", res.badges)
        self.assertIn("9:16 Portrait", res.badges)

    def test_filter_and_rank_orders_by_aesthetic_score(self):
        bad_clip = MediaAsset(
            id="bad_1",
            mediaType="video",
            title="Man talking to camera podcast vlog",
            url="https://example.com/vlog.mp4",
            provider="pexels",
        )
        normal_clip = MediaAsset(
            id="norm_1",
            mediaType="video",
            title="Calm river flowing through forest trees",
            url="https://example.com/river.mp4",
            aspectRatio="9:16",
            duration=8.0,
            provider="pexels",
            extraMetadata={"tags": ["forest", "water"]},
        )
        epic_clip = MediaAsset(
            id="epic_2",
            mediaType="video",
            title="Chiaroscuro lightning storm over ocean waves high contrast slow-mo",
            url="https://example.com/storm.mp4",
            aspectRatio="9:16",
            duration=6.0,
            provider="pexels",
            extraMetadata={
                "fps": 120.0,
                "tags": ["thunderstorm", "lightning", "dramatic lighting", "ocean waves", "high contrast"],
            },
        )

        ranked, rejected = filter_and_rank_candidates([bad_clip, normal_clip, epic_clip])

        self.assertEqual(len(rejected), 1)
        self.assertEqual(rejected[0]["id"], "bad_1")
        self.assertEqual(len(ranked), 2)
        # Epic clip with 120fps and dramatic lighting must rank first
        self.assertEqual(ranked[0].id, "epic_2")
        self.assertEqual(ranked[1].id, "norm_1")
        self.assertGreater(ranked[0].extraMetadata["aestheticScore"], ranked[1].extraMetadata["aestheticScore"])


if __name__ == "__main__":
    unittest.main()
