"""
backend/features/workspace/audio/service.py
Central audio service coordinating modular live music & SFX API providers:
- Jamendo Music (500,000+ live Creative Commons & royalty-free tracks)
- Wikimedia Commons Audio (120,000+ live public domain tracks and SFX)
- Internet Archive Audio (14M+ live open audio recordings and SFX)
- Free Music Archive (150,000+ live indie and ambient creator tracks)
- Open SFX Commons (65,000+ live transitions, impacts, risers, and hits)

Zero hardcoded audio arrays - 100% dynamic live stream.
"""

import logging
from typing import Any, Dict, List

from .providers import (
    BaseAudioProvider,
    FMAAudioProvider,
    InternetArchiveAudioProvider,
    JamendoAudioProvider,
    OpenSFXProvider,
    WikimediaAudioProvider,
)

logger = logging.getLogger("ApexMind.Workspace.AudioService")

_PROVIDERS: Dict[str, BaseAudioProvider] = {
    "jamendo": JamendoAudioProvider(),
    "wikimedia": WikimediaAudioProvider(),
    "internet_archive": InternetArchiveAudioProvider(),
    "fma": FMAAudioProvider(),
    "open_sfx": OpenSFXProvider(),
}


def get_audio_providers_status() -> Dict[str, bool]:
    """Returns availability status for all real live audio providers."""
    return {
        key: provider.is_configured()
        for key, provider in _PROVIDERS.items()
    }


def search_soundtracks(
    query: str = "",
    genre: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
) -> Dict[str, Any]:
    """
    Search background soundtracks across pure live API providers.
    Supports single provider search ('jamendo', 'wikimedia', 'internet_archive', 'fma')
    or aggregated multi-provider search ('all').
    """
    target_prov = provider.strip().lower()

    if target_prov in _PROVIDERS:
        prov = _PROVIDERS[target_prov]
        items = prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size)
        total = prov.get_total_tracks(query=query, genre=genre)
    else:
        # Aggregated live search across providers
        j_prov = _PROVIDERS["jamendo"]
        wm_prov = _PROVIDERS["wikimedia"]
        ia_prov = _PROVIDERS["internet_archive"]
        fma_prov = _PROVIDERS["fma"]

        total = (
            j_prov.get_total_tracks(query, genre)
            + wm_prov.get_total_tracks(query, genre)
            + ia_prov.get_total_tracks(query, genre)
            + fma_prov.get_total_tracks(query, genre)
        )

        items: List[Dict[str, Any]] = []

        # 1. Primary live search on Jamendo (high fidelity, tempo/BPM tagged)
        j_tracks = j_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size)
        items.extend(j_tracks)

        # 2. If additional tracks needed, interleave Wikimedia & Internet Archive
        if len(items) < page_size:
            wm_tracks = wm_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(wm_tracks)

        if len(items) < page_size:
            ia_tracks = ia_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(ia_tracks)

        if len(items) < page_size:
            fma_tracks = fma_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(fma_tracks)

    # Deduplicate by audioUrl
    seen_urls = set()
    deduped_items = []
    for it in items:
        url = it.get("audioUrl", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            deduped_items.append(it)

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": deduped_items,
        "providers": get_audio_providers_status(),
    }


def search_sound_effects(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
) -> Dict[str, Any]:
    """
    Search sound effects (whooshes, impacts, tension risers) across pure live SFX providers.
    Supports single provider search ('open_sfx', 'wikimedia', 'internet_archive')
    or aggregated search ('all').
    """
    target_prov = provider.strip().lower()

    if target_prov in _PROVIDERS:
        prov = _PROVIDERS[target_prov]
        items = prov.search_sfx(query=query, category=category, page=page, page_size=page_size)
        total = prov.get_total_sfx(query=query, category=category)
    else:
        sfx_prov = _PROVIDERS["open_sfx"]
        wm_prov = _PROVIDERS["wikimedia"]
        ia_prov = _PROVIDERS["internet_archive"]

        total = (
            sfx_prov.get_total_sfx(query, category)
            + wm_prov.get_total_sfx(query, category)
            + ia_prov.get_total_sfx(query, category)
        )

        items: List[Dict[str, Any]] = []

        # 1. Primary search on Open SFX
        sfx_items = sfx_prov.search_sfx(query=query, category=category, page=page, page_size=page_size)
        items.extend(sfx_items)

        # 2. Augment with Wikimedia SFX
        if len(items) < page_size:
            wm_items = wm_prov.search_sfx(query=query, category=category, page=page, page_size=page_size - len(items))
            items.extend(wm_items)

        # 3. Augment with Internet Archive SFX
        if len(items) < page_size:
            ia_items = ia_prov.search_sfx(query=query, category=category, page=page, page_size=page_size - len(items))
            items.extend(ia_items)

    # Deduplicate by audioUrl
    seen_urls = set()
    deduped_items = []
    for it in items:
        url = it.get("audioUrl", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            deduped_items.append(it)

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": deduped_items,
        "providers": get_audio_providers_status(),
    }

