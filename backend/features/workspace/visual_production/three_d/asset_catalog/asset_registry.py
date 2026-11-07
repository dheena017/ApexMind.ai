"""
backend/features/workspace/visual_production/three_d/asset_catalog/asset_registry.py

Central 3D Asset Library Registry for Stage 3 Visual Production.
Catalogs, resolves, and binds pre-created CC0 characters, props, and environment models
(GLB / GLTF / Blend) into Blender scene execution payloads.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Visuals.AssetRegistry3D")


class AssetRegistry3D:
    """Manages the catalog of pre-created 3D assets and maps storyboard queries to 3D models."""

    def __init__(self, base_asset_dir: Optional[Path] = None):
        self.root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        self.asset_dir = base_asset_dir or (self.root_dir / "backend" / "data" / "assets_3d")
        self.catalog_path = self.asset_dir / "catalog.json"
        self._catalog: Dict[str, Any] = {}
        self.load_catalog()

    def load_catalog(self) -> None:
        """Loads or reloads catalog.json from disk."""
        if self.catalog_path.is_file():
            try:
                with open(self.catalog_path, "r", encoding="utf-8") as f:
                    self._catalog = json.load(f)
                logger.info(f"[AssetRegistry3D] Loaded {len(self._catalog.get('assets', {}))} 3D assets from catalog.")
            except Exception as exc:
                logger.warning(f"[AssetRegistry3D] Failed to read catalog.json ({exc}); using empty catalog.")
                self._catalog = {"assets": {}}
        else:
            self._catalog = {"assets": {}}

    def list_assets(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns all registered assets optionally filtered by category (character, prop, environment)."""
        assets = []
        for aid, item in self._catalog.get("assets", {}).items():
            if category and item.get("category") != category:
                continue
            assets.append({"assetId": aid, **item})
        return assets

    def resolve_asset(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Resolves an asset by direct assetId or fuzzy tag/keyword matching.
        Returns a dict with absolute model path, default scale, position, and animation clips.
        """
        q = query.lower().strip()
        catalog_assets = self._catalog.get("assets", {})

        # 1. Exact or partial assetId match
        if q in catalog_assets:
            item = dict(catalog_assets[q])
            item["assetId"] = q
            item["absolutePath"] = str((self.asset_dir / item["path"]).resolve())
            return item

        # 2. Key prefix / substring matching (e.g. "dog", "airplane", "portal", "drone", "maya")
        for aid, item in catalog_assets.items():
            if q in aid.lower():
                res = dict(item)
                res["assetId"] = aid
                res["absolutePath"] = str((self.asset_dir / res["path"]).resolve())
                return res

            # Tag matching
            tags = [t.lower() for t in item.get("tags", [])]
            if any(t in q or q in t for t in tags):
                res = dict(item)
                res["assetId"] = aid
                res["absolutePath"] = str((self.asset_dir / res["path"]).resolve())
                return res

        return None

    def resolve_scene_assets(self, scene_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extracts characters, props, and environmental features from a storyboard scene
        and resolves them to pre-created 3D models with 3D positions and scales.
        """
        resolved: List[Dict[str, Any]] = []

        # 1. Character resolution
        characters = scene_data.get("characters") or []
        for ch in characters:
            ch_id = ch.get("characterId") if isinstance(ch, dict) else str(ch)
            asset = self.resolve_asset(ch_id)
            if not asset:
                # Try visual description hints (e.g. "dog", "golden retriever", "girl")
                desc = scene_data.get("visualDescription", "")
                if "dog" in desc.lower() or "cooper" in desc.lower():
                    asset = self.resolve_asset("dog")
                elif "girl" in desc.lower() or "maya" in desc.lower():
                    asset = self.resolve_asset("maya")

            if asset and Path(asset["absolutePath"]).is_file():
                start_pos = [0.0, 0.0, 0.0]
                if isinstance(ch, dict) and ch.get("startTransform", {}).get("position"):
                    pos_dict = ch["startTransform"]["position"]
                    start_pos = [pos_dict.get("x", 0.0), pos_dict.get("y", 0.0), pos_dict.get("z", 0.0)]
                else:
                    start_pos = asset.get("defaultPosition", [0.0, 0.0, 0.0])

                resolved.append({
                    "name": asset.get("name", ch_id),
                    "type": "character",
                    "path": asset["absolutePath"],
                    "position": start_pos,
                    "scale": asset.get("defaultScale", [1.0, 1.0, 1.0]),
                })

        # 2. Prop resolution
        props = scene_data.get("props") or []
        desc = scene_data.get("visualDescription", "")
        if "airplane" in desc.lower() or "plane" in desc.lower() or "toy" in desc.lower():
            props.append("red_airplane_01")
        if "drone" in desc.lower():
            props.append("drone_recon_01")

        for pr in props:
            pr_id = pr.get("propId") if isinstance(pr, dict) else str(pr)
            asset = self.resolve_asset(pr_id)
            if asset and Path(asset["absolutePath"]).is_file():
                resolved.append({
                    "name": asset.get("name", pr_id),
                    "type": "prop",
                    "path": asset["absolutePath"],
                    "position": asset.get("defaultPosition", [0.0, 0.0, 0.5]),
                    "scale": asset.get("defaultScale", [1.0, 1.0, 1.0]),
                })

        # 3. Environment/Sky Anomaly resolution
        if "portal" in desc.lower() or "sky opens" in desc.lower() or "vortex" in desc.lower() or "anomaly" in desc.lower():
            asset = self.resolve_asset("sky_anomaly_01")
            if asset and Path(asset["absolutePath"]).is_file():
                resolved.append({
                    "name": "Sky Vortex",
                    "type": "environment_feature",
                    "path": asset["absolutePath"],
                    "position": [0.0, 0.0, 3.2],
                    "scale": [2.5, 2.5, 2.5],
                })

        return resolved


# Singleton instance
asset_registry_3d = AssetRegistry3D()

