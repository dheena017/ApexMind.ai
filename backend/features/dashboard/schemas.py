from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class DashboardMetrics(BaseModel):
    totalVideos: int = Field(0, description="Total website studio videos created")
    totalScripts: int = Field(0, description="Total AI generated scripts in memory")
    totalViews: int = Field(0, description="Aggregated view count")
    totalLikes: int = Field(0, description="Aggregated like count")
    connectedChannelsCount: int = Field(0, description="Number of connected YouTube channels")
    unreadNotificationsCount: int = Field(0, description="Unread notifications count")

class SystemStatusSummary(BaseModel):
    database: str = Field("connected", description="Database connection health")
    geminiAi: str = Field("ready", description="Gemini AI engine status")
    cachedAudioCount: int = Field(0, description="Cached synthesis files count")
    serverUptimeFormatted: str = Field("0h 0m 0s", description="Formatted uptime")

class TrendingPromptIdea(BaseModel):
    id: str
    title: str
    category: str
    hook: str
    topic: str
    estimatedDuration: str = "30s"

class DashboardSummaryResponse(BaseModel):
    success: bool = True
    metrics: DashboardMetrics
    recentVideos: List[Dict[str, Any]] = Field(default_factory=list)
    recentScripts: List[Dict[str, Any]] = Field(default_factory=list)
    activeChannel: Optional[Dict[str, Any]] = None
    systemStatus: SystemStatusSummary
    categories: List[str] = Field(default_factory=list)
    trendingPrompts: List[TrendingPromptIdea] = Field(default_factory=list)
    recentNotifications: List[Dict[str, Any]] = Field(default_factory=list)
