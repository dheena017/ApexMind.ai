"""
backend/features/media/schemas.py
Pydantic schemas and standard response envelopes for the media engine API.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .base import MediaAsset


class SceneResolveItem(BaseModel):
    sceneNumber: int = Field(..., description="1-indexed scene number")
    visualQuery: str = Field(..., description="Primary semantic search query")
    googleSearchQuery: Optional[str] = Field(None, description="Syntax-optimized query for Google CSE")
    fallbackQueries: List[str] = Field(default_factory=list, description="Fallback queries if primary yields no results")
    mediaType: str = Field("video", description="'video' | 'image'")


class BatchResolveMediaRequest(BaseModel):
    aspectRatio: str = Field("9:16", description="'9:16' | '16:9' | '1:1'")
    scenes: List[SceneResolveItem] = Field(..., description="List of scene items to resolve concurrently")


class ResolvedSceneResult(BaseModel):
    sceneNumber: int
    status: str = Field(..., description="'resolved' | 'unresolved'")
    media: Optional[MediaAsset] = None
    message: Optional[str] = None


class BatchResolveData(BaseModel):
    totalScenes: int
    resolvedScenes: int
    scenes: List[ResolvedSceneResult]


class BatchResolveMediaResponse(BaseModel):
    success: bool = True
    data: BatchResolveData
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SingleSceneResolveRequest(BaseModel):
    sceneNumber: int
    query: str
    mediaType: str = "video"
    aspectRatio: str = "9:16"
    excludeUrls: List[str] = Field(default_factory=list, description="URLs to exclude to prevent duplicate visual cuts")


class SingleSceneResolveResponse(BaseModel):
    success: bool = True
    data: ResolvedSceneResult
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MediaSearchData(BaseModel):
    query: str
    mediaType: str
    provider: str
    total: int
    page: int
    items: List[MediaAsset]


class MediaSearchResponse(BaseModel):
    success: bool = True
    data: MediaSearchData
    metadata: Dict[str, Any] = Field(default_factory=dict)


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
    metadata: Dict[str, Any] = Field(default_factory=dict)


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
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ProviderInfo(BaseModel):
    status: str = Field(..., description="'active' | 'missing_key' | 'disabled'")
    type: List[str]
    hasKey: bool = False
    authRequired: bool = True
    latencyMs: Optional[int] = None


class ProvidersStatusData(BaseModel):
    allHealthy: bool
    providers: Dict[str, ProviderInfo]


class ProvidersStatusResponse(BaseModel):
    success: bool = True
    data: ProvidersStatusData
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., description="Visual scene prompt description")
    aspectRatio: str = Field("9:16", description="'9:16' | '16:9' | '1:1'")
    style: Optional[str] = Field("cinematic", description="Visual aesthetic: cinematic | stoic | cyberpunk | anime | 3d | vintage | minimal")
    sceneNumber: Optional[int] = Field(None, description="Optional scene number index")
    model: Optional[str] = Field("imagen-3.0-generate-002", description="AI Image Generator Model: imagen-3.0-generate-002 | imagen-3.0-fast-generate-001 | gemini-2.5-flash | procedural-svg")


class GenerateImageResponse(BaseModel):
    success: bool = True
    data: MediaAsset
    metadata: Dict[str, Any] = Field(default_factory=dict)
