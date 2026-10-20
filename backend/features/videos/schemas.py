from typing import Optional, List
from pydantic import BaseModel

class WebsiteVideoSchema(BaseModel):
    id: str
    title: str
    quote: str
    hook: Optional[str] = ""
    cta: Optional[str] = ""
    category: str
    coverImageUrl: str
    videoUrl: Optional[str] = ""
    audioUrl: Optional[str] = ""
    voice: str
    aspectRatio: str = "9:16"
    duration: str = "00:30"
    visualTheme: Optional[str] = "v1"
    subtitles: Optional[str] = "[]"
    tags: Optional[str] = "[]"
    status: str = "ready"
    createdAt: str

class CreateWebsiteVideoRequest(BaseModel):
    id: Optional[str] = None
    title: str
    quote: str
    hook: Optional[str] = ""
    cta: Optional[str] = ""
    category: Optional[str] = "Stoic Mindset & Discipline"
    coverImageUrl: Optional[str] = ""
    videoUrl: Optional[str] = ""
    audioUrl: Optional[str] = ""
    voice: Optional[str] = "Fenrir"
    aspectRatio: Optional[str] = "9:16"
    duration: Optional[str] = "00:30"
    visualTheme: Optional[str] = "v1"
    subtitles: Optional[List[dict]] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = "ready"

class UpdateWebsiteVideoRequest(BaseModel):
    title: Optional[str] = None
    quote: Optional[str] = None
    hook: Optional[str] = None
    cta: Optional[str] = None
    category: Optional[str] = None
    coverImageUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    audioUrl: Optional[str] = None
    voice: Optional[str] = None
    aspectRatio: Optional[str] = None
    duration: Optional[str] = None
    visualTheme: Optional[str] = None
    status: Optional[str] = None

class WebsiteVideoListResponse(BaseModel):
    success: bool
    videos: List[WebsiteVideoSchema]
    total: int
