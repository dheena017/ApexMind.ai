"""
backend/features/workspace/visual_production/three_d/__init__.py

Stage 3 Path B: 3D Blender Procedural Production Engine.
"""

from .blender_executor import blender_executor, BlenderExecutor
from .generators.three_d_engine import three_d_engine, ThreeDEngine

__all__ = [
    "blender_executor",
    "BlenderExecutor",
    "three_d_engine",
    "ThreeDEngine",
]

