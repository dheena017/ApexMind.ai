"""
backend/features/workspace/voice_generation/profiles/delivery_presets.py
Reusable voice configuration profiles and delivery presets with capability validation.
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from ..providers.base import ProviderCapabilities


class DeliveryPreset(BaseModel):
    id: str
    name: str
    description: str
    speedMultiplier: float = 1.0
    pitchAdjustment: float = 0.0  # Semitones / Hz
    intensity: str = "medium"     # "low", "medium", "high"
    emotion: Optional[str] = None
    tempoModulationDescription: str = "Standard cadence"


DELIVERY_PRESETS: Dict[str, DeliveryPreset] = {
    "cinematic_narrator": DeliveryPreset(
        id="cinematic_narrator",
        name="Cinematic Narrator",
        description="Deep, grounded, deliberate pacing for epic and reflective stories.",
        speedMultiplier=0.92,
        pitchAdjustment=-1.0,
        intensity="high",
        emotion="dramatic",
        tempoModulationDescription="Slower, heavier delivery with dramatic pauses.",
    ),
    "motivational": DeliveryPreset(
        id="motivational",
        name="Motivational Speaker",
        description="High-energy, urgent and commanding delivery designed for reels and shorts.",
        speedMultiplier=1.06,
        pitchAdjustment=0.0,
        intensity="high",
        emotion="urgent",
        tempoModulationDescription="Urgent, driving pace with crisp articulation.",
    ),
    "calm": DeliveryPreset(
        id="calm",
        name="Calm & Reflective",
        description="Serene, soft, meditative cadence for philosophical and poetic content.",
        speedMultiplier=0.88,
        pitchAdjustment=-0.5,
        intensity="low",
        emotion="serene",
        tempoModulationDescription="Relaxed cadence with extended acoustic pauses.",
    ),
    "dramatic": DeliveryPreset(
        id="dramatic",
        name="Dramatic & Serious",
        description="Heavy, intense delivery for suspense, historical, or climactic scenes.",
        speedMultiplier=0.94,
        pitchAdjustment=-1.5,
        intensity="high",
        emotion="intense",
        tempoModulationDescription="Grounded, deliberate, solemn pace.",
    ),
    "energetic": DeliveryPreset(
        id="energetic",
        name="Energetic & Upbeat",
        description="Fast, enthusiastic delivery for tutorials, hooks, and punchy content.",
        speedMultiplier=1.12,
        pitchAdjustment=1.0,
        intensity="high",
        emotion="enthusiastic",
        tempoModulationDescription="Rapid tempo with dynamic emphasis.",
    ),
}


class VoiceProfile(BaseModel):
    profileId: str
    name: str
    provider: str
    voiceId: str
    language: str = "en-US"
    accent: str = "american"
    defaultPreset: str = "cinematic_narrator"
    speed: float = 1.0
    pitch: float = 0.0


DEFAULT_VOICE_PROFILES: Dict[str, VoiceProfile] = {
    "deep_cinematic_male": VoiceProfile(
        profileId="deep_cinematic_male",
        name="Deep Cinematic Male",
        provider="edge_tts",
        voiceId="en-US-ChristopherNeural",
        language="en-US",
        accent="american",
        defaultPreset="cinematic_narrator",
        speed=0.95,
        pitch=-1.0,
    ),
    "piper_lessac_offline": VoiceProfile(
        profileId="piper_lessac_offline",
        name="Piper Lessac (Offline Neural)",
        provider="piper",
        voiceId="en_US-lessac-medium",
        language="en-US",
        accent="american",
        defaultPreset="cinematic_narrator",
        speed=1.0,
        pitch=0.0,
    ),
    "system_offline_fallback": VoiceProfile(
        profileId="system_offline_fallback",
        name="System OS Voice (Guaranteed Offline)",
        provider="pyttsx3",
        voiceId="default",
        language="en-US",
        accent="system",
        defaultPreset="motivational",
        speed=1.0,
        pitch=0.0,
    ),
}


def resolve_voice_and_delivery(
    voice_id: str,
    provider_id: str,
    preset_name: Optional[str] = None,
    requested_speed: Optional[float] = None,
    requested_pitch: Optional[float] = None,
    capabilities: Optional[ProviderCapabilities] = None,
) -> Dict[str, Any]:
    """
    Applies preset parameters and clamps settings according to declared provider capabilities.
    Never assumes a provider supports pitch or emotion if unsupported.
    """
    preset = DELIVERY_PRESETS.get(preset_name or "cinematic_narrator", DELIVERY_PRESETS["cinematic_narrator"])

    # Base speed calculation
    speed = requested_speed if requested_speed is not None else preset.speedMultiplier
    speed = max(0.5, min(2.0, speed))

    # Base pitch calculation
    pitch = requested_pitch if requested_pitch is not None else preset.pitchAdjustment
    pitch = max(-20.0, min(20.0, pitch))

    # Capability filtering
    effective_pitch = pitch
    effective_emotion = preset.emotion
    if capabilities:
        if not capabilities.supportsPitch:
            effective_pitch = 0.0
        if not capabilities.supportsEmotion:
            effective_emotion = None

    return {
        "voiceId": voice_id,
        "providerId": provider_id,
        "preset": preset.id,
        "speed": round(speed, 2),
        "pitch": round(effective_pitch, 2),
        "emotion": effective_emotion,
        "intensity": preset.intensity,
        "tempoDescription": preset.tempoModulationDescription,
    }

