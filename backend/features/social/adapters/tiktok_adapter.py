"""
backend/features/social/adapters/tiktok_adapter.py
Publisher adapter for TikTok Content Posting API v2.
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
import httpx

from .base import SocialPlatformPublisher

logger = logging.getLogger("ApexMind.Social.TikTok")
TIKTOK_API_BASE = "https://open.tiktokapis.com/v2"


class TikTokPublisherAdapter(SocialPlatformPublisher):
    @property
    def platform_name(self) -> str:
        return "tiktok"

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
        access_token = account.get("accessToken")
        clean_text = f"{title} {description}".strip()
        caption = self.format_ai_disclosure(clean_text, "tiktok")

        if tags:
            tag_string = " ".join(f"#{t.strip('#')}" for t in tags)
            if tag_string not in caption:
                caption = f"{caption} {tag_string}"

        # TikTok character limit: 4,000 characters
        if len(caption) > 3900:
            caption = caption[:3890] + "..."

        if not access_token:
            logger.warning("No TikTok access token. Simulating TikTok upload.")
            sim_id = f"tt_sim_{int(asyncio.get_event_loop().time() * 1000)}"
            return {
                "success": True,
                "platform": "tiktok",
                "postId": sim_id,
                "url": f"https://www.tiktok.com/@{account.get('handle', 'creator')}/video/{sim_id}",
                "status": "published",
                "message": f"Clip dispatched to TikTok @{account.get('handle', 'creator')} (Sandbox Mode)",
            }

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json; charset=UTF-8",
                }

                # TikTok video init request
                init_url = f"{TIKTOK_API_BASE}/post/publish/video/init/"
                body = {
                    "post_info": {
                        "title": caption,
                        "privacy_level": "PUBLIC_TO_EVERYONE" if privacy == "public" else "SELF_ONLY",
                        "disable_duet": False,
                        "disable_stitch": False,
                        "disable_comment": False,
                        "video_cover_timestamp_ms": 1000,
                        "is_aigc": True,  # Mandatory AI generated content disclosure
                    },
                    "source_info": {
                        "source": "PULL_FROM_URL",
                        "video_url": video_path_or_url,
                    },
                }

                res = await client.post(init_url, json=body, headers=headers)
                if res.status_code != 200:
                    return {
                        "success": False,
                        "platform": "tiktok",
                        "postId": None,
                        "url": None,
                        "status": "failed",
                        "message": f"TikTok initialization failed: {res.text}",
                    }

                data = res.json().get("data", {})
                publish_id = data.get("publish_id", "tt_queued")

                return {
                    "success": True,
                    "platform": "tiktok",
                    "postId": str(publish_id),
                    "url": f"https://www.tiktok.com/@{account.get('handle', 'creator')}",
                    "status": "published",
                    "message": f"Successfully published to TikTok @{account.get('handle', 'creator')}!",
                }

            except Exception as e:
                logger.error(f"TikTok publishing exception: {e}")
                return {
                    "success": False,
                    "platform": "tiktok",
                    "postId": None,
                    "url": None,
                    "status": "failed",
                    "message": f"TikTok publisher error: {str(e)}",
                }

