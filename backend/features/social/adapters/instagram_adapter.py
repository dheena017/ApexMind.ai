"""
backend/features/social/adapters/instagram_adapter.py
Publisher adapter for Instagram Reels & Business/Creator accounts via Meta Graph API.
"""

import logging
import asyncio
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx

from .base import SocialPlatformPublisher

logger = logging.getLogger("ApexMind.Social.Instagram")
META_GRAPH_URL = "https://graph.facebook.com/v19.0"


class InstagramPublisherAdapter(SocialPlatformPublisher):
    @property
    def platform_name(self) -> str:
        return "instagram"

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
        ig_user_id = account.get("platformAccountId")
        access_token = account.get("accessToken")

        # 1. Prepare caption with AI disclosure and hashtag formatting
        combined_text = f"{title}\n\n{description}" if description else title
        caption = self.format_ai_disclosure(combined_text, "instagram")
        
        # Max caption length on Instagram is 2,200 characters
        if len(caption) > 2180:
            caption = caption[:2175] + "..."

        if tags:
            tag_string = " ".join(f"#{t.strip('#')}" for t in tags)
            if tag_string not in caption:
                caption = f"{caption}\n\n{tag_string}"

        if not access_token or not ig_user_id:
            # Fallback mock/simulated publication for unconfigured sandbox
            logger.warning(f"No Meta access token for Instagram account {ig_user_id}. Simulating publish.")
            simulated_media_id = f"ig_sim_{int(asyncio.get_event_loop().time() * 1000)}"
            return {
                "success": True,
                "platform": "instagram",
                "postId": simulated_media_id,
                "url": f"https://www.instagram.com/reel/{simulated_media_id}/",
                "status": "published",
                "message": f"Reel staged for Instagram @{account.get('handle', 'creator')} (Sandbox Mode)",
            }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # Step 1: Create Instagram Reel Media Container
                create_container_url = f"{META_GRAPH_URL}/{ig_user_id}/media"
                container_payload = {
                    "media_type": "REELS",
                    "video_url": video_path_or_url,
                    "caption": caption,
                    "share_to_feed": "true",
                    "access_token": access_token,
                }

                logger.info(f"Creating Instagram Reel container for IG User {ig_user_id}...")
                resp = await client.post(create_container_url, data=container_payload)
                if resp.status_code != 200:
                    err_detail = resp.text
                    logger.error(f"Failed to create IG container: {err_detail}")
                    return {
                        "success": False,
                        "platform": "instagram",
                        "postId": None,
                        "url": None,
                        "status": "failed",
                        "message": f"Instagram container creation error: {err_detail}",
                    }

                container_data = resp.json()
                creation_id = container_data.get("id")
                if not creation_id:
                    return {
                        "success": False,
                        "platform": "instagram",
                        "postId": None,
                        "url": None,
                        "status": "failed",
                        "message": "Did not receive container creation_id from Meta Graph API.",
                    }

                # Step 2: Poll container status until ready (up to 30 seconds)
                status_url = f"{META_GRAPH_URL}/{creation_id}?fields=status_code&access_token={access_token}"
                ready = False
                for _ in range(6):
                    await asyncio.sleep(4)
                    status_resp = await client.get(status_url)
                    if status_resp.status_code == 200:
                        status_val = status_resp.json().get("status_code")
                        if status_val == "FINISHED":
                            ready = True
                            break
                        elif status_val == "ERROR":
                            logger.error("Meta media processing error for container")
                            break

                # Step 3: Publish Media Container
                publish_url = f"{META_GRAPH_URL}/{ig_user_id}/media_publish"
                pub_payload = {
                    "creation_id": creation_id,
                    "access_token": access_token,
                }
                pub_resp = await client.post(publish_url, data=pub_payload)
                if pub_resp.status_code != 200:
                    return {
                        "success": False,
                        "platform": "instagram",
                        "postId": creation_id,
                        "url": None,
                        "status": "failed",
                        "message": f"Instagram publish failed: {pub_resp.text}",
                    }

                pub_data = pub_resp.json()
                published_id = pub_data.get("id", creation_id)
                permalink = f"https://www.instagram.com/reel/{published_id}/"

                return {
                    "success": True,
                    "platform": "instagram",
                    "postId": str(published_id),
                    "url": permalink,
                    "status": "published",
                    "message": f"Successfully published Reel to Instagram @{account.get('handle', 'creator')}!",
                }

            except Exception as e:
                logger.error(f"Instagram publishing exception: {e}")
                return {
                    "success": False,
                    "platform": "instagram",
                    "postId": None,
                    "url": None,
                    "status": "failed",
                    "message": f"Instagram publisher failed: {str(e)}",
                }

