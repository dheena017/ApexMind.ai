"""
backend/features/social/adapters/youtube_adapter.py
Publisher adapter for YouTube Shorts & standard channels via YouTube Data API v3.
"""

import logging
from typing import Dict, Any, List, Optional
from .base import SocialPlatformPublisher

logger = logging.getLogger("ApexMind.Social.YouTube")


class YouTubePublisherAdapter(SocialPlatformPublisher):
    @property
    def platform_name(self) -> str:
        return "youtube"

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
        from backend.features.youtube.service import publish_video_to_shorts
        
        # Enforce YouTube Shorts title limit (max 100 characters)
        clean_title = (title or "AI Short").strip()
        if len(clean_title) > 90:
            clean_title = clean_title[:87] + "..."
        if "#Shorts" not in clean_title:
            clean_title = f"{clean_title} #Shorts"

        # Format mandatory AI disclosure & tags
        formatted_desc = self.format_ai_disclosure(description or title, "youtube")
        effective_tags = list(tags or ["Shorts", "AI", "Motivation", "Mindset"])
        if "Shorts" not in effective_tags:
            effective_tags.append("Shorts")

        channel_id = account.get("platformAccountId") or account.get("id")

        try:
            res = publish_video_to_shorts(
                title=clean_title,
                quote=formatted_desc,
                channel_id=channel_id,
                videoUrl=video_path_or_url,
                video_url=video_path_or_url,
                tags=effective_tags,
                privacy=privacy,
            )

            video_id = res.get("videoId") or res.get("id") or "yt_simulated"
            video_url = res.get("videoUrl") or f"https://youtube.com/shorts/{video_id}"

            return {
                "success": True,
                "platform": "youtube",
                "postId": str(video_id),
                "url": video_url,
                "status": "published",
                "message": f"Successfully published Short '{clean_title}' to YouTube!",
            }
        except Exception as e:
            logger.error(f"YouTube publishing error for account {channel_id}: {e}")
            return {
                "success": False,
                "platform": "youtube",
                "postId": None,
                "url": None,
                "status": "failed",
                "message": f"YouTube publishing failed: {str(e)}",
            }

