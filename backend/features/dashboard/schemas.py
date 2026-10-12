"""
backend/features/dashboard/schemas.py
Pydantic schemas and DTOs for the Dashboard analytics feature.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    success: bool
    totalShortsGenerated: int
    totalViews: int
    totalLikes: int
    activeChannelsCount: int
    totalQuotesGenerated: Optional[int] = 0
    tokensUsed: Optional[int] = 0
    tokenQuota: Optional[int] = 1_000_000
    primaryChannel: Optional[Dict[str, Any]] = None
