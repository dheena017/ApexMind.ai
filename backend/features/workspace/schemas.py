"""
backend/features/workspace/schemas.py
Pydantic schemas and DTOs for the Workspace feature (Scripting, Voiceover, Memory, Media Library).
"""

from typing import Optional, List
from pydantic import BaseModel, Field

# ── 1. Request Models ─────────────────────────────────────────────────────────

class GenerateScriptRequest(BaseModel):
    category: Optional[str] = Field(default="Stoic Mindset & Discipline", description="Motivational theme/category")
    topic: Optional[str] = Field(default="Overcoming laziness, building daily grit", description="Topic focus")
    tone: Optional[str] = Field(default="Authoritative & Inspiring", description="Vocal delivery tone")
    length: Optional[str] = Field(default="30 seconds", description="Target video duration")

class GenerateVoiceoverRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Script text to synthesize")
    voiceName: Optional[str] = Field(default="Fenrir", description="Voice profile identifier")

# ── 2. Response DTOs ──────────────────────────────────────────────────────────

class SubtitleItem(BaseModel):
    text: str
    start: float
    duration: float

class GeneratedScriptData(BaseModel):
    title: str
    hook: str
    quote: str
    cta: str
    speechStyle: Optional[str] = None
    visualTheme: Optional[str] = None
    recommendedVoice: Optional[str] = None
    tags: List[str] = []
    hashtags: List[str] = []
    subtitles: List[SubtitleItem] = []

class GenerateScriptResponse(BaseModel):
    success: bool
    data: GeneratedScriptData
    memoryCount: int

class VoiceoverResponse(BaseModel):
    success: bool
    voiceName: str
    mimeType: str
    audioBase64: Optional[str] = None
    message: Optional[str] = None

class QuoteMemoryItem(BaseModel):
    id: str
    title: str
    hook: Optional[str] = None
    quote: str
    category: Optional[str] = None
    generated_at: str

class QuoteMemoryListResponse(BaseModel):
    success: bool
    totalQuotesSaved: int
    uniquenessScore: int = 100
    memoryStore: List[QuoteMemoryItem]

class MusicTrackItem(BaseModel):
    id: str
    title: str
    genre: str
    duration: str
    bpm: int
    copyrightFree: bool
    license: str
    frequencyData: List[int]

class VisualBackdropItem(BaseModel):
    id: str
    name: str
    category: str
    aspectRatio: str
    previewColor: str
    textColor: str
    particleEffect: str

class VoiceProfileItem(BaseModel):
    id: str
    name: str
    gender: str
    style: str
    speed: str

class MediaLibraryData(BaseModel):
    musicTracks: List[MusicTrackItem]
    visualBackdrops: List[VisualBackdropItem]
    voiceProfiles: List[VoiceProfileItem]

class MediaLibraryResponse(BaseModel):
    success: bool
    data: MediaLibraryData
