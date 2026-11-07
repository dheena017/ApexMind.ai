"""
backend/features/workspace/asset_resolution/asset_resolver.py

Story-to-Blender asset mapping engine (Milestone 10).
Resolves semantic script descriptions to discrete 3D library assets with strict
physical file verification, category organization, and universal bindings.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from .catalog_schema import BlenderAssetEntry
from .asset_catalog import (
    VALID_ASSET_CATEGORIES,
    get_catalog_root,
    validate_asset_path,
    verify_physical_blend_asset,
)

logger = logging.getLogger("ApexMind.AssetResolution.Resolver")

# Built-in sample 3D library catalog for semantic lookup
DEFAULT_3D_CATALOG: Dict[str, BlenderAssetEntry] = {
    "dog_golden_retriever": BlenderAssetEntry(
        assetId="dog_golden_retriever",
        assetType="animal",
        name="Golden Retriever",
        tags=["dog", "canine", "retriever", "golden", "animal", "pet"],
        sourceFile="animals/dog_golden_retriever.blend",
        rigType="quadruped",
        defaultScale=1.0,
        animations=["idle", "walk", "run", "sit", "bark", "sniff"],
    ),
    "human_male_hero": BlenderAssetEntry(
        assetId="human_male_hero",
        assetType="character",
        name="Stylized Male Hero",
        tags=["human", "man", "male", "hero", "philosopher", "stoic"],
        sourceFile="characters/human_male_hero.blend",
        rigType="humanoid",
        defaultScale=1.0,
        animations=["idle", "walk", "speak", "ponder", "point"],
    ),
    "suburban_street_autumn": BlenderAssetEntry(
        assetId="suburban_street_autumn",
        assetType="environment",
        name="Autumn Suburban Neighborhood",
        tags=["suburban", "street", "houses", "autumn", "trees", "leaves", "outdoor"],
        sourceFile="environments/suburban_street_autumn.blend",
        defaultScale=1.0,
    ),
    "ball_tennis": BlenderAssetEntry(
        assetId="ball_tennis",
        assetType="prop",
        name="Tennis Ball",
        tags=["ball", "tennis", "toy", "yellow"],
        sourceFile="props/ball_tennis.blend",
        defaultScale=0.1,
    ),
}

# Animal keyword detector for category separation
ANIMAL_KEYWORDS = {
    "dog", "retriever", "canine", "cat", "feline", "puppy", "kitten",
    "wolf", "bear", "horse", "deer", "bird", "hawk", "eagle", "animal",
    "rabbit", "fox", "hound", "husky", "labrador"
}


def infer_asset_category(asset_type: str, asset_id: str, name: str = "", tags: Optional[List[str]] = None) -> str:
    """
    Infers the correct catalog subfolder category.
    Ensures animals are assigned to 'animals/' rather than 'characters/'.
    """
    text = f"{asset_id} {name} {' '.join(tags or [])}".lower()
    
    # Check for animal
    if any(k in text for k in ANIMAL_KEYWORDS):
        return "animals"
    
    type_lower = asset_type.lower()
    if type_lower in ["house", "building", "structure"]:
        return "houses"
    elif type_lower in ["environment", "landscape", "backdrop"]:
        return "environments"
    elif type_lower in ["prop", "item", "debris", "object"]:
        return "props"
    elif type_lower in ["character", "human", "person", "avatar"]:
        return "characters"
    elif type_lower in VALID_ASSET_CATEGORIES:
        return type_lower
    
    return "props"


class BlenderAssetResolver:
    """Resolves and physically verifies script assets against the 3D asset catalog."""

    def __init__(self, catalog_root: Optional[Path] = None, catalog: Optional[Dict[str, BlenderAssetEntry]] = None):
        self.catalog_root = catalog_root or get_catalog_root()
        self.catalog = catalog or DEFAULT_3D_CATALOG

    def resolve_entity(
        self,
        entity_name: str,
        entity_type: str = "character",
        description: str = "",
    ) -> Dict[str, Any]:
        """
        Finds the best matching catalog asset for a script entity via semantic tags or returns a procedural fallback.
        """
        search_terms = set(
            f"{entity_name} {description}".lower().replace(",", " ").split()
        )

        best_match: Optional[BlenderAssetEntry] = None
        best_score = 0

        for entry in self.catalog.values():
            # Allow animal <-> character crossover
            entry_type = entry.assetType
            if entry_type != entity_type and not (entry_type in ["animal", "character"] and entity_type in ["animal", "character"]):
                continue
            overlap = len(search_terms.intersection(set(entry.tags)))
            if overlap > best_score:
                best_score = overlap
                best_match = entry

        if best_match and best_score > 0:
            return {
                "resolved": True,
                "assetId": best_match.assetId,
                "sourceFile": best_match.sourceFile,
                "name": best_match.name,
                "rigType": best_match.rigType,
                "scale": best_match.defaultScale,
                "matchConfidence": min(1.0, 0.4 + best_score * 0.2),
            }

        return {
            "resolved": False,
            "assetId": f"fallback_{entity_type}_{entity_name.lower().replace(' ', '_')}",
            "sourceFile": f"primitives/{entity_type}_box.glb",
            "name": f"Procedural {entity_name}",
            "rigType": "none",
            "scale": 1.0,
            "matchConfidence": 0.1,
        }

    def resolve_binding(
        self,
        story_asset_id: str,
        asset_type: str,
        name: str = "",
        expected_sha256: Optional[str] = None,
        is_generic_background: bool = False,
        classification: str = "hero",
        rig_type: Optional[str] = None,
        active_materials: Optional[Dict[str, str]] = None,
        active_accessories: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Creates a universal AssetBinding for any story entity (character, animal, environment, prop).
        Strictly tests for physical file presence on disk before setting status to 'resolved'.
        """
        category = infer_asset_category(asset_type, story_asset_id, name)
        
        # Determine catalog asset ID
        if category == "animals":
            catalog_id = f"animal_{story_asset_id}" if not story_asset_id.startswith("animal_") else story_asset_id
            default_rig = rig_type or "rigify_quadruped"
        elif category == "characters":
            catalog_id = f"char_{story_asset_id}" if not story_asset_id.startswith("char_") else story_asset_id
            default_rig = rig_type or "humanoid"
        elif category == "environments":
            catalog_id = f"env_{story_asset_id}" if not story_asset_id.startswith("env_") else story_asset_id
            default_rig = None
        else:
            catalog_id = f"prop_{story_asset_id}" if not story_asset_id.startswith("prop_") else story_asset_id
            default_rig = None

        # Determine target file path
        is_valid_path, target_path, path_err = validate_asset_path(
            category=category,
            asset_id=catalog_id,
            catalog_root=self.catalog_root,
        )

        if not is_valid_path or target_path is None:
            return {
                "assetType": "animal" if category == "animals" else asset_type,
                "storyAssetId": story_asset_id,
                "storyCharacterId": story_asset_id,
                "catalogAssetId": catalog_id,
                "category": category,
                "status": "incompatible",
                "modelFilePath": None,
                "sha256": None,
                "blenderVersion": "4.2.0",
                "rigType": default_rig,
                "activeMaterials": active_materials or {},
                "activeAccessories": active_accessories or [],
                "isGenericBackground": is_generic_background,
                "classification": classification,
                "notes": path_err or "Invalid path specification",
            }

        # Physical file verification
        verification = verify_physical_blend_asset(
            file_path=target_path,
            expected_sha256=expected_sha256,
            catalog_root=self.catalog_root,
        )

        # Build universal binding dict
        binding = {
            "assetType": "animal" if category == "animals" else asset_type,
            "storyAssetId": story_asset_id,
            "storyCharacterId": story_asset_id,
            "catalogAssetId": catalog_id,
            "category": category,
            "status": verification.status,
            "modelFilePath": str(target_path) if verification.status == "resolved" else str(target_path),
            "sha256": verification.sha256,
            "blenderVersion": verification.blender_version,
            "rigType": default_rig,
            "activeMaterials": active_materials or {},
            "activeAccessories": active_accessories or [],
            "isGenericBackground": is_generic_background,
            "classification": classification,
            "notes": verification.error_message,
        }

        # When physical model is missing on disk, clear modelFilePath if requested or keep path for modeling reference
        if verification.status in ["needs_modeling", "unresolved"]:
            binding["sha256"] = None

        return binding
