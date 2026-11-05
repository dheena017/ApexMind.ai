"""
backend/features/social/adapters/base.py
Abstract base class and contract for all Omnichannel Social Platform Publishers.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class SocialPlatformPublisher(ABC):
    """
    Standard interface implemented by each platform publisher adapter:
    - YouTube Shorts (YouTube Data API v3)
    - Instagram Reels (Meta Graph API)
    - Facebook Reels (Meta Pages API)
    - LinkedIn Video
    - X / Twitter Media
    """

    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Normalized platform identifier (e.g. 'youtube', 'instagram', 'facebook')."""
        pass

    @abstractmethod
    async def publish_video(
        self,
        account: Dict[str, Any],
        video_path_or_url: str,
        title: str,
        description: str,
        tags: Optional[List[str]] = None,
        privacy: str = "public",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Publishes video to the platform and returns:
        {
            "success": True,
            "platform": "...",
            "postId": "...",
            "url": "https://...",
            "status": "published" | "queued",
            "message": "..."
        }
        """
        pass

    def format_ai_disclosure(self, caption: str, platform: str) -> str:
        """
        Appends mandatory AI generated disclosure adhering to platform compliance:
        - Meta (IG / FB): `#AIGenerated` hashtag
        - YouTube: `🤖 AI Disclosure: Content generated with AI assistance.`
        """
        clean_caption = caption.strip() if caption else ""
        if platform in ("instagram", "facebook"):
            if "#AIGenerated" not in clean_caption:
                clean_caption = f"{clean_caption}\n\n#AIGenerated #AIContent #ApexMind".strip()
        elif platform == "youtube":
            disclosure_line = "🤖 AI Disclosure: Generated with AI audio synthesis & visual production."
            if "AI Disclosure" not in clean_caption:
                clean_caption = f"{clean_caption}\n\n{disclosure_line}".strip()
        return clean_caption
