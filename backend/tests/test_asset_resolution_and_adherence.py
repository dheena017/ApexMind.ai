"""
backend/tests/test_asset_resolution_and_adherence.py

Automated regression suite verifying:
1. Missing .blend file (must not be marked resolved).
2. Existing valid .blend file (verified with SHA-256 and BLENDER header).
3. Invalid SHA-256 mismatch.
4. Invalid asset path / path traversal prevention.
5. Universal Character bindings.
6. Universal Environment bindings.
7. Universal Prop bindings.
8. Detection of missing characters in scene staging (e.g., boy silhouette).
9. Environment mismatch prompt adherence validation.
10. Complete universal asset resolution pipeline.
"""

import hashlib
import os
from pathlib import Path
import pytest

from backend.features.workspace.asset_resolution.asset_catalog import (
    validate_asset_path,
    verify_physical_blend_asset,
    VALID_ASSET_CATEGORIES,
)
from backend.features.workspace.asset_resolution.asset_resolver import (
    BlenderAssetResolver,
    infer_asset_category,
)
from backend.features.workspace.script_generation.asset_planner import (
    extract_asset_manifest,
)
from backend.features.workspace.script_generation.prompt_adherence_validator import (
    validate_prompt_adherence,
)
from backend.features.workspace.schemas import (
    AssetBinding,
    ScriptGenerationResponse,
)


@pytest.fixture
def mock_catalog(tmp_path: Path):
    """Creates a temporary isolated asset catalog with approved subfolders."""
    catalog_root = tmp_path / "asset_catalog"
    for cat in VALID_ASSET_CATEGORIES:
        (catalog_root / cat).mkdir(parents=True, exist_ok=True)
    return catalog_root


def create_fake_blend_file(path: Path, content: bytes = b"test_data_42") -> str:
    """Creates a file with valid Blender magic bytes and returns its SHA-256."""
    path.parent.mkdir(parents=True, exist_ok=True)
    file_bytes = b"BLENDER_v402" + content
    with open(path, "wb") as f:
        f.write(file_bytes)
    return hashlib.sha256(file_bytes).hexdigest()


# -----------------------------------------------------------------------------
# Test 1: Missing .blend file must NEVER be marked as resolved
# -----------------------------------------------------------------------------
def test_missing_blend_file(mock_catalog: Path):
    missing_file = mock_catalog / "characters" / "ghost_char.blend"
    result = verify_physical_blend_asset(missing_file, catalog_root=mock_catalog)
    
    assert result.status == "needs_modeling"
    assert result.sha256 is None
    assert "does not exist" in (result.error_message or "")


# -----------------------------------------------------------------------------
# Test 2: Existing valid .blend file verified with header and SHA-256
# -----------------------------------------------------------------------------
def test_existing_valid_blend_file(mock_catalog: Path):
    target_file = mock_catalog / "characters" / "hero_01.blend"
    expected_hash = create_fake_blend_file(target_file, b"sample_hero_mesh")
    
    result = verify_physical_blend_asset(target_file, expected_sha256=expected_hash, catalog_root=mock_catalog)
    
    assert result.status == "resolved"
    assert result.sha256 == expected_hash
    assert result.error_message is None


# -----------------------------------------------------------------------------
# Test 3: Invalid SHA-256 mismatch detected
# -----------------------------------------------------------------------------
def test_invalid_sha256(mock_catalog: Path):
    target_file = mock_catalog / "props" / "sword_01.blend"
    create_fake_blend_file(target_file, b"sword_mesh")
    wrong_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    
    result = verify_physical_blend_asset(target_file, expected_sha256=wrong_hash, catalog_root=mock_catalog)
    
    assert result.status == "incompatible"
    assert "mismatch" in (result.error_message or "")


# -----------------------------------------------------------------------------
# Test 4: Invalid asset path and path traversal prevention
# -----------------------------------------------------------------------------
def test_invalid_asset_path(mock_catalog: Path):
    # Traversal test
    is_valid, target, err = validate_asset_path(
        category="characters",
        asset_id="../../outside_entity",
        catalog_root=mock_catalog,
    )
    assert not is_valid
    assert err is not None

    # Invalid category test
    is_valid_cat, _, err_cat = validate_asset_path(
        category="weapons_secret",
        asset_id="laser_gun",
        catalog_root=mock_catalog,
    )
    assert not is_valid_cat
    assert "Invalid asset category" in (err_cat or "")


# -----------------------------------------------------------------------------
# Test 5: Universal Character and Animal binding generation & category isolation
# -----------------------------------------------------------------------------
def test_missing_character_binding(mock_catalog: Path):
    resolver = BlenderAssetResolver(catalog_root=mock_catalog)
    
    char_bind = resolver.resolve_binding(
        story_asset_id="maya_01",
        asset_type="character",
        name="Maya",
    )
    assert char_bind["category"] == "characters"
    assert char_bind["status"] == "needs_modeling"  # Physical file missing
    assert char_bind["storyAssetId"] == "maya_01"
    assert char_bind["storyCharacterId"] == "maya_01"

    dog_bind = resolver.resolve_binding(
        story_asset_id="cooper_dog",
        asset_type="character",
        name="Cooper the Golden Retriever",
    )
    assert dog_bind["category"] == "animals"  # Animal category isolation
    assert dog_bind["rigType"] == "rigify_quadruped"


# -----------------------------------------------------------------------------
# Test 6: Universal Environment binding generation & category isolation
# -----------------------------------------------------------------------------
def test_missing_environment_binding(mock_catalog: Path):
    resolver = BlenderAssetResolver(catalog_root=mock_catalog)

    env_bind = resolver.resolve_binding(
        story_asset_id="autumn_town_01",
        asset_type="environment",
        name="Suburban Street",
    )
    assert env_bind["category"] == "environments"
    assert env_bind["storyAssetId"] == "autumn_town_01"
    assert env_bind["status"] == "needs_modeling"


# -----------------------------------------------------------------------------
# Test 7: Universal Prop binding generation & generic background classification
# -----------------------------------------------------------------------------
def test_missing_prop_binding(mock_catalog: Path):
    resolver = BlenderAssetResolver(catalog_root=mock_catalog)

    prop_bind = resolver.resolve_binding(
        story_asset_id="toy_plane_01",
        asset_type="prop",
        name="Toy Plane",
        is_generic_background=False,
    )
    assert prop_bind["category"] == "props"
    assert prop_bind["storyAssetId"] == "toy_plane_01"
    assert prop_bind["classification"] == "hero"

    # Background generic prop test
    debris_bind = resolver.resolve_binding(
        story_asset_id="locket_01",
        asset_type="prop",
        name="Lost Locket",
        is_generic_background=True,
        classification="background_generic",
    )
    assert debris_bind["isGenericBackground"] is True
    assert debris_bind["classification"] == "background_generic"


# -----------------------------------------------------------------------------
# Test 8: Missing character in scene staging detection
# -----------------------------------------------------------------------------
def test_missing_character_in_scene_staging():
    scenes = [
        {
            "sceneNumber": 7,
            "narration": "Maya looks up at the sky. Her long lost brother appears in the rift.",
            "visualDescription": "A silhouette of a small boy appears in the rift, floating down toward Maya.",
            "characters": [{"characterId": "girl_01", "role": "primary"}],
            "props": [],
        },
        {
            "sceneNumber": 8,
            "narration": "The sky gave back what it took.",
            "visualDescription": "Maya embraces the silhouette boy.",
            "characters": [{"characterId": "girl_01", "role": "primary"}],
            "props": [],
        }
    ]

    manifest, bindings = extract_asset_manifest(scenes=scenes)
    
    char_ids = [c["id"] for c in manifest["characters"]]
    assert "boy_silhouette_01" in char_ids
    
    # Check scene 7 staging received boy_silhouette_01
    sc7_chars = [c.get("characterId") for c in scenes[0]["characters"]]
    assert "boy_silhouette_01" in sc7_chars


# -----------------------------------------------------------------------------
# Test 9: Environment mismatch prompt adherence validation
# -----------------------------------------------------------------------------
def test_environment_mismatch_prompt_adherence():
    user_prompt = "Create a 60-second video set in a peaceful suburban town during dusk."
    
    # Intentionally missing timeOfDay and wrong environment
    script_data = {
        "aspectRatio": "9:16",
        "totalDuration": 60.0,
        "scenes": [
            {
                "sceneNumber": 1,
                "duration": 60.0,
                "environment": {"name": "Outer Space", "timeOfDay": "", "weather": "none"},
                "lighting": {},
                "narration": "Floating in space.",
                "visualDescription": "Stars and black void.",
            }
        ],
        "assetManifest": {"characters": []}
    }

    checks, score, warnings, errors = validate_prompt_adherence(
        user_prompt=user_prompt,
        script_data=script_data,
        target_aspect_ratio="9:16",
        target_seconds=60.0,
    )

    assert score < 100.0
    assert any("timeofday" in w.lower() for w in warnings)


# -----------------------------------------------------------------------------
# Test 10: Complete universal asset resolution pipeline with real files
# -----------------------------------------------------------------------------
def test_valid_complete_asset_resolution(mock_catalog: Path):
    # Create valid physical .blend files in mock catalog
    girl_path = mock_catalog / "characters" / "char_girl_01.blend"
    dog_path = mock_catalog / "animals" / "animal_dog_01.blend"
    env_path = mock_catalog / "environments" / "env_autumn_town_01.blend"
    prop_path = mock_catalog / "props" / "prop_toy_plane_01.blend"

    girl_hash = create_fake_blend_file(girl_path, b"girl_3d_mesh")
    dog_hash = create_fake_blend_file(dog_path, b"dog_3d_mesh")
    env_hash = create_fake_blend_file(env_path, b"town_3d_mesh")
    prop_hash = create_fake_blend_file(prop_path, b"plane_3d_mesh")

    resolver = BlenderAssetResolver(catalog_root=mock_catalog)

    scenes = [
        {
            "sceneNumber": 1,
            "characters": [
                {"characterId": "girl_01"},
                {"characterId": "dog_01"},
            ],
            "environment": {"assetId": "autumn_town_01"},
            "props": [{"propId": "toy_plane_01"}],
        }
    ]

    manifest, bindings = extract_asset_manifest(scenes=scenes)

    # Re-verify bindings using our mock resolver pointing to mock catalog
    verified_bindings = []
    for b in bindings:
        v_bind = resolver.resolve_binding(
            story_asset_id=b["storyAssetId"],
            asset_type=b["assetType"],
            name=b["storyAssetId"],
        )
        verified_bindings.append(v_bind)

    # Validate all 4 entities are resolved
    for b in verified_bindings:
        assert b["status"] == "resolved", f"Expected resolved for {b['storyAssetId']}, got {b['status']}: {b.get('notes')}"
        assert b["sha256"] is not None

    # Validate against Pydantic model
    validated_bindings = [AssetBinding(**b) for b in verified_bindings]
    assert len(validated_bindings) == 4
