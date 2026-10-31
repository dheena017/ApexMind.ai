"""
backend/features/media/providers/image_gemini.py
Multimodal AI Visual & Scene Generation Provider using Google GenAI SDK (Gemini Nano Banana / Imagen).
Generates high-resolution vertical 9:16 cinematic visuals tailored for YouTube Shorts.
"""

import base64
import hashlib
import logging
import os
import time
import uuid
from pathlib import Path
from typing import List, Optional

from google import genai
from google.genai import types

from backend.shared.config import settings
from ..base import BaseMediaProvider, MediaAsset

logger = logging.getLogger("ApexMind.media.image_gemini")

OUTPUT_DIR = Path("backend/data/generated_images")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Visual style prompt modifiers
STYLE_PROMPT_PRESETS: dict[str, str] = {
    "cinematic": (
        "cinematic 8k photograph, dramatic volumetric atmospheric lighting, "
        "hyperrealistic, shallow depth of field, IMAX color grading, 35mm lens, photorealistic masterpiece"
    ),
    "stoic": (
        "classical antique marble statue aesthetic, dramatic chiaroscuro lighting, "
        "dark moody atmosphere, cinematic gold and charcoal contrast, epic stoic philosophy vibe, high detail"
    ),
    "cyberpunk": (
        "futuristic cyberpunk aesthetic, neon cyan and magenta rim lighting, "
        "dark rainy reflective asphalt, high-tech dystopian city, intricate detail, octane render 8k"
    ),
    "anime": (
        "high-end modern anime aesthetic, Makoto Shinkai style, vibrant dramatic sky, "
        "gorgeous atmospheric lighting, clean line art, masterwork illustration"
    ),
    "3d": (
        "stylized 3D digital art, Pixar and Unreal Engine 5 render, raytraced subsurface scattering, "
        "rich textures, playful yet majestic lighting, 8k resolution"
    ),
    "vintage": (
        "retro 1970s kodachrome film photograph, authentic analog grain, nostalgic warm hues, "
        "cinematic framing, documentary realism, timeless visual"
    ),
    "minimal": (
        "minimalist fine-art composition, vast negative space, soft ambient daylight, "
        "clean architectural lines, elegant aesthetic, zen atmosphere"
    ),
}

ASPECT_RATIO_DIMENSIONS: dict[str, tuple[int, int]] = {
    "9:16": (1080, 1920),
    "16:9": (1920, 1080),
    "1:1": (1080, 1080),
    "4:5": (1080, 1350),
    "21:9": (2560, 1080),
}


class GeminiImageProvider(BaseMediaProvider):
    """Generates bespoke scene visuals using Google Gemini Multimodal Image Generation."""

    @property
    def name(self) -> str:
        return "gemini_image"

    @property
    def supported_types(self) -> List[str]:
        return ["image"]

    def __init__(self):
        super().__init__()
        self.api_key = settings.GEMINI_API_KEY
        self.client: Optional[genai.Client] = None
        if self.api_key and self.api_key.strip():
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize GenAI client in GeminiImageProvider: {e}")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def enhance_prompt(self, base_prompt: str, style: str = "cinematic", aspect_ratio: str = "9:16") -> str:
        """Enrich user/scene prompt with photographic and compositional cues."""
        style_suffix = STYLE_PROMPT_PRESETS.get(style.lower(), STYLE_PROMPT_PRESETS["cinematic"])
        aspect_desc = "vertical framing for 9:16 video" if aspect_ratio == "9:16" else f"composition for {aspect_ratio}"
        clean_base = (base_prompt or "cinematic scene backdrop").strip().rstrip(".")
        return f"{clean_base}, {aspect_desc}, {style_suffix}"

    def generate(
        self,
        prompt: str,
        aspect_ratio: str = "9:16",
        style: str = "cinematic",
        scene_number: Optional[int] = None,
        model: Optional[str] = None,
    ) -> Optional[MediaAsset]:
        """
        Generates an image via Gemini / Imagen Multimodal API and saves to backend/data/generated_images.
        Returns a complete MediaAsset.
        """
        chosen_model = model or "imagen-3.0-generate-002"
        width, height = ASPECT_RATIO_DIMENSIONS.get(aspect_ratio, (1080, 1920))
        enhanced_prompt = self.enhance_prompt(prompt, style=style, aspect_ratio=aspect_ratio)

        image_bytes: Optional[bytes] = None

        if chosen_model == "procedural-svg":
            logger.info("Direct generation: Stylized Procedural Vector Backdrop")
            image_bytes = self._generate_fallback_svg_bytes(prompt, style, width, height)
        elif self.is_configured() and self.client:
            try:
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    # Try official Google Imagen 3 image generation
                    target_imagen_model = "imagen-3.0-fast-generate-001" if "fast" in chosen_model else "imagen-3.0-generate-002"
                    img_res = self.client.models.generate_images(
                        model=target_imagen_model,
                        prompt=enhanced_prompt,
                        config=dict(
                            number_of_images=1,
                            aspect_ratio="9:16" if aspect_ratio == "9:16" else "16:9",
                            output_mime_type="image/png",
                        ),
                    )
                if img_res and hasattr(img_res, "generated_images") and img_res.generated_images:
                    image_bytes = img_res.generated_images[0].image.image_bytes
                    logger.info(f"Successfully generated bespoke scene visual via {target_imagen_model}")
            except Exception as gen_err:
                logger.debug(f"Imagen 3 ({chosen_model}) not available or quota exceeded ({gen_err})")

        if not image_bytes:
            return None

        # Save to disk
        file_hash = hashlib.sha256(f"{prompt}_{time.time()}".encode()).hexdigest()[:12]
        filename = f"ai_scene_{scene_number or 'gen'}_{file_hash}.png"
        filepath = OUTPUT_DIR / filename
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        # Public access URL
        asset_url = f"/api/media/generated/{filename}"
        asset_id = f"ai_gen_{file_hash}"

        return MediaAsset(
            id=asset_id,
            mediaType="image",
            title=f"AI: {prompt[:40]}",
            url=asset_url,
            previewUrl=asset_url,
            thumbnailUrl=asset_url,
            duration=6.0,
            resolution=f"{width}x{height}",
            aspectRatio=aspect_ratio,
            provider="gemini_ai",
            extraMetadata={
                "source": "gemini_ai",
                "license": "ApexMind Generated / SynthID Watermarked",
                "tags": ["ai_generated", style, aspect_ratio],
                "width": width,
                "height": height,
            },
        )

    def search(self, query: str, aspect_ratio: str = "9:16", limit: int = 5) -> List[MediaAsset]:
        """Base search compatibility: triggers generation for query."""
        res = self.generate(prompt=query, aspect_ratio=aspect_ratio)
        return [res] if res else []

