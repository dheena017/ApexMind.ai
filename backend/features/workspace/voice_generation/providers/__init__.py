"""
backend/features/workspace/voice_generation/providers/__init__.py
Providers package initialization and automated registration.
"""

from .base import BaseVoiceProvider, VoiceDescriptor, SynthesisResult, ProviderCapabilities
from .registry import VoiceRegistry, voice_registry
from .edge_tts_provider import EdgeTTSVoiceProvider
from .pyttsx3_provider import Pyttsx3VoiceProvider
from .piper_provider import PiperVoiceProvider

# Auto-register all available zero-cost engines
edge_provider = EdgeTTSVoiceProvider()
pyttsx3_provider = Pyttsx3VoiceProvider()
piper_provider = PiperVoiceProvider()

if edge_provider.is_available():
    voice_registry.register(edge_provider)

if pyttsx3_provider.is_available():
    voice_registry.register(pyttsx3_provider)

if piper_provider.is_available():
    voice_registry.register(piper_provider)

# Set Edge-TTS as default online zero-cost, and Pyttsx3 / Piper as offline fallbacks
voice_registry.set_default_provider("edge_tts")

__all__ = [
    "BaseVoiceProvider",
    "VoiceDescriptor",
    "SynthesisResult",
    "ProviderCapabilities",
    "VoiceRegistry",
    "voice_registry",
    "EdgeTTSVoiceProvider",
    "Pyttsx3VoiceProvider",
    "PiperVoiceProvider",
]

