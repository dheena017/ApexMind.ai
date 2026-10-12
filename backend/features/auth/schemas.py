"""
backend/features/auth/schemas.py
Pydantic schemas and DTOs for Google Authentication and User Sessions.
"""

from typing import Optional
from pydantic import BaseModel, Field

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = Field(default=None, description="Google JWT ID token from Google Identity Services")
    email: Optional[str] = Field(default=None, description="Google user email")
    name: Optional[str] = Field(default=None, description="Google user full name")
    picture: Optional[str] = Field(default=None, description="Google profile picture / avatar URL")
    sub: Optional[str] = Field(default=None, description="Google unique subject ID")

class EmailLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: Optional[str] = Field(default=None, description="User password")

class UserProfileDTO(BaseModel):
    id: str
    email: str
    name: str
    avatarUrl: str
    provider: str
    verified: bool = True
    lastLoginAt: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    user: UserProfileDTO
    token: str
    message: str

class LogoutResponse(BaseModel):
    success: bool
    message: str
