"""
backend/features/workspace/audio/service.py
Central audio service coordinating modular live music & SFX API providers:
- Jamendo Music (500,000+ live Creative Commons & royalty-free tracks)
- ccMixter Music (45,000+ live Creative Commons remixes & ambient beats)
- Netlabels Open Music (70,000+ live indie netlabel releases)
- Free Music Archive (150,000+ live indie and ambient creator tracks)
- Wikimedia Commons Audio (120,000+ live public domain tracks and SFX)
- Internet Archive Audio (14M+ live open audio recordings and SFX)
- BBC Sound Effects (16,000+ broadcast sound effects)
- Open SFX Commons (65,000+ live transitions, impacts, risers, and hits)

Zero hardcoded audio arrays - 100% dynamic live stream.
"""

import logging
from typing import Any, Dict, List

from .metadata_cleaner import clean_track_title_and_artist
from .providers import (
    BaseAudioProvider,
    BBCSoundEffectsProvider,
    CCMixterAudioProvider,
    FMAAudioProvider,
    InternetArchiveAudioProvider,
    JamendoAudioProvider,
    NetlabelsAudioProvider,
    OpenSFXProvider,
    WikimediaAudioProvider,
)

logger = logging.getLogger("ApexMind.Workspace.AudioService")

_PROVIDERS: Dict[str, BaseAudioProvider] = {
    "jamendo": JamendoAudioProvider(),
    "ccmixter": CCMixterAudioProvider(),
    "netlabels": NetlabelsAudioProvider(),
    "fma": FMAAudioProvider(),
    "wikimedia": WikimediaAudioProvider(),
    "internet_archive": InternetArchiveAudioProvider(),
    "bbc_sfx": BBCSoundEffectsProvider(),
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
    Supports single provider search ('jamendo', 'ccmixter', 'netlabels', 'fma', 'wikimedia', 'internet_archive')
    or aggregated multi-provider search ('all').
    """
    target_prov = provider.strip().lower()

    if target_prov in _PROVIDERS:
        prov = _PROVIDERS[target_prov]
        items = prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size)
        total = prov.get_total_tracks(query=query, genre=genre)

        # Resilient live failover: if the specific provider returns 0 tracks (e.g. API suspended or Cloudflare block),
        # automatically augment with active live Creative Commons providers so the user NEVER gets an empty panel
        if not items:
            logger.info(f"Audio provider '{target_prov}' returned 0 live streams; gracefully augmenting with live open audio.")
            soundtrack_sources = ["ccmixter", "netlabels", "fma", "wikimedia", "internet_archive"]
            for alt_id in soundtrack_sources:
                if alt_id != target_prov and alt_id in _PROVIDERS:
                    more = _PROVIDERS[alt_id].search_tracks(query=query, genre=genre, page=page, page_size=page_size)
                    if more:
                        items.extend(more)
                        if len(items) >= page_size:
                            break
    else:
        # Aggregated live search across soundtrack providers
        j_prov = _PROVIDERS["jamendo"]
        cc_prov = _PROVIDERS["ccmixter"]
        nl_prov = _PROVIDERS["netlabels"]
        fma_prov = _PROVIDERS["fma"]
        wm_prov = _PROVIDERS["wikimedia"]
        ia_prov = _PROVIDERS["internet_archive"]

        total = (
            j_prov.get_total_tracks(query, genre)
            + cc_prov.get_total_tracks(query, genre)
            + nl_prov.get_total_tracks(query, genre)
            + fma_prov.get_total_tracks(query, genre)
            + wm_prov.get_total_tracks(query, genre)
            + ia_prov.get_total_tracks(query, genre)
        )

        items: List[Dict[str, Any]] = []

        # 1. Primary live search on Jamendo
        j_tracks = j_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size)
        items.extend(j_tracks)

        # 2. Interleave ccMixter CC tracks
        if len(items) < page_size:
            cc_tracks = cc_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(cc_tracks)

        # 3. Interleave Netlabels
        if len(items) < page_size:
            nl_tracks = nl_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(nl_tracks)

        # 4. Interleave Free Music Archive
        if len(items) < page_size:
            fma_tracks = fma_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(fma_tracks)

        # 5. Interleave Wikimedia & Internet Archive
        if len(items) < page_size:
            wm_tracks = wm_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(wm_tracks)

        if len(items) < page_size:
            ia_tracks = ia_prov.search_tracks(query=query, genre=genre, page=page, page_size=page_size - len(items))
            items.extend(ia_tracks)

    # Deduplicate and clean track titles & artist names
    seen_urls = set()
    deduped_items = []
    for it in items:
        url = it.get("audioUrl", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            clean_t, clean_a = clean_track_title_and_artist(
                it.get("title", ""),
                it.get("artist", ""),
                default_artist="Independent Creator",
            )
            it["title"] = clean_t
            it["artist"] = clean_a
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
    Supports single provider search ('bbc_sfx', 'open_sfx', 'wikimedia', 'internet_archive')
    or aggregated search ('all').
    """
    target_prov = provider.strip().lower()

    if target_prov in _PROVIDERS:
        prov = _PROVIDERS[target_prov]
        items = prov.search_sfx(query=query, category=category, page=page, page_size=page_size)
        total = prov.get_total_sfx(query=query, category=category)

        # Resilient live failover for SFX providers
        if not items:
            sfx_sources = ["bbc_sfx", "open_sfx", "wikimedia", "internet_archive"]
            for alt_id in sfx_sources:
                if alt_id != target_prov and alt_id in _PROVIDERS:
                    more = _PROVIDERS[alt_id].search_sfx(query=query, category=category, page=page, page_size=page_size)
                    if more:
                        items.extend(more)
                        if len(items) >= page_size:
                            break
    else:
        bbc_prov = _PROVIDERS["bbc_sfx"]
        sfx_prov = _PROVIDERS["open_sfx"]
        wm_prov = _PROVIDERS["wikimedia"]
        ia_prov = _PROVIDERS["internet_archive"]

        total = (
            bbc_prov.get_total_sfx(query, category)
            + sfx_prov.get_total_sfx(query, category)
            + wm_prov.get_total_sfx(query, category)
            + ia_prov.get_total_sfx(query, category)
        )

        items: List[Dict[str, Any]] = []

        # 1. Primary BBC broadcast sound effects
        bbc_items = bbc_prov.search_sfx(query=query, category=category, page=page, page_size=page_size)
        items.extend(bbc_items)

        # 2. Augment with Open SFX Commons
        if len(items) < page_size:
            sfx_items = sfx_prov.search_sfx(query=query, category=category, page=page, page_size=page_size - len(items))
            items.extend(sfx_items)

        # 3. Augment with Wikimedia SFX
        if len(items) < page_size:
            wm_items = wm_prov.search_sfx(query=query, category=category, page=page, page_size=page_size - len(items))
            items.extend(wm_items)

        # 4. Augment with Internet Archive SFX
        if len(items) < page_size:
            ia_items = ia_prov.search_sfx(query=query, category=category, page=page, page_size=page_size - len(items))
            items.extend(ia_items)

    # Deduplicate and clean track titles & artist names
    seen_urls = set()
    deduped_items = []
    for it in items:
        url = it.get("audioUrl", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            clean_t, clean_a = clean_track_title_and_artist(
                it.get("title", ""),
                it.get("artist", ""),
                default_artist="Independent Creator",
            )
            it["title"] = clean_t
            it["artist"] = clean_a
            deduped_items.append(it)

    return {
        "success": True,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": deduped_items,
        "providers": get_audio_providers_status(),
    }
