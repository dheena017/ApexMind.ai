"""
backend/features/media/schemas.py
Pydantic schemas and standard response envelopes for the media engine API.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from .base import MediaAsset


class SceneResolveItem(BaseModel):
    sceneNumber: int = Field(..., description="1-indexed scene number")
    visualQuery: str = Field(..., description="Primary semantic search query")
    googleSearchQuery: Optional[str] = Field(None, description="Syntax-optimized query for Google CSE")
    fallbackQueries: List[str] = Field(default_factory=list, description="Fallback queries if primary yields no results")
    mediaType: str = Field("video", description="'video' | 'image'")


class ResolvedSceneResult(BaseModel):
    sceneNumber: int
    status: str = Field(..., description="'resolved' | 'unresolved'")
    media: Optional[MediaAsset] = None
    message: Optional[str] = None


class BatchResolveData(BaseModel):
    totalScenes: int
    resolvedScenes: int
    scenes: List[ResolvedSceneResult]


class MediaSearchData(BaseModel):
    query: str
    mediaType: str
    provider: str
    total: int
    page: int
    items: List[MediaAsset]


class AudioTrackAsset(BaseModel):
    id: str
    title: str
    artist: Optional[str] = None
    audioUrl: str
    duration: Optional[float] = None
    bpm: Optional[int] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    provider: str
    waveformPeaks: List[float] = Field(default_factory=list)


class AudioSearchData(BaseModel):
    query: str
    genre: str
    total: int
    items: List[AudioTrackAsset]


class AudioSearchResponse(BaseModel):
    success: bool = True
    data: AudioSearchData
    metadata: Dict[str, object] = Field(default_factory=dict)


class SfxAsset(BaseModel):
    id: str
    title: str
    audioUrl: str
    duration: Optional[float] = None
    category: str
    provider: str


class SfxSearchData(BaseModel):
    query: str
    total: int
    items: List[SfxAsset]


class SfxSearchResponse(BaseModel):
    success: bool = True
    data: SfxSearchData
    metadata: Dict[str, object] = Field(default_factory=dict)


class ProviderInfo(BaseModel):
    status: str = Field(..., description="'active' | 'missing_key' | 'disabled'")
    type: List[str]
    hasKey: bool = False
    authRequired: bool = True
    latencyMs: Optional[int] = None


class ProvidersStatusData(BaseModel):
    allHealthy: bool
    providers: Dict[str, ProviderInfo]
