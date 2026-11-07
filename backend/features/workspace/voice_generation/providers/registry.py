"""
backend/features/workspace/voice_generation/providers/registry.py
Provider Registry for managing and dynamically resolving voice synthesis engines.
"""

import logging
from typing import Dict, List, Optional
from .base import BaseVoiceProvider, VoiceDescriptor

logger = logging.getLogger("ApexMind.Voice.Registry")


class VoiceRegistry:
    def __init__(self):
        self._providers: Dict[str, BaseVoiceProvider] = {}
        self._default_provider_id: str = "edge_tts"

    def register(self, provider: BaseVoiceProvider):
        self._providers[provider.provider_id] = provider
        logger.info(f"[VoiceRegistry] Registered provider: '{provider.provider_id}' (available: {provider.is_available()})")

    def get_provider(self, provider_id: Optional[str] = None) -> Optional[BaseVoiceProvider]:
        if provider_id and provider_id in self._providers:
            return self._providers[provider_id]
        if self._default_provider_id in self._providers:
            return self._providers[self._default_provider_id]
        if self._providers:
            return next(iter(self._providers.values()))
        return None

    def list_providers(self) -> List[BaseVoiceProvider]:
        return list(self._providers.values())

    def list_available_voices(self) -> List[VoiceDescriptor]:
        voices: List[VoiceDescriptor] = []
        for p in self._providers.values():
            if p.is_available():
                voices.extend(p.list_voices())
        return voices

    def set_default_provider(self, provider_id: str):
        if provider_id in self._providers:
            self._default_provider_id = provider_id


# Global registry singleton
voice_registry = VoiceRegistry()

