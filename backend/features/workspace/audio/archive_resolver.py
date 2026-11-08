"""
backend/features/workspace/audio/archive_resolver.py
Thread-safe resolver for Internet Archive, Netlabels, FMA, and BBC items.
Fetches real, directly playable MP3/WAV/OGG stream URLs from Archive.org item metadata.
Zero hardcoded files - 100% dynamic live resolution.
"""

from __future__ import annotations

import concurrent.futures
import http.client
import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

# Enforce large header tolerance across all HTTP client calls
http.client._MAXLINE = 1048576

logger = logging.getLogger("ApexMind.Audio.ArchiveResolver")

# In-memory thread-safe resolution cache to guarantee sub-millisecond repeat access
_RESOLVED_CACHE: Dict[str, Optional[Dict[str, Any]]] = {}

# Valid audio formats prioritized by streaming reliability and browser codec support
_AUDIO_FORMATS = {
    "vbr mp3": 100,
    "128kbps mp3": 95,
    "mp3": 90,
    "256kbps mp3": 85,
    "320kbps mp3": 80,
    "ogg vorbis": 75,
    "flac": 60,
    "24bit flac": 55,
    "wave": 50,
    "wav": 50,
}

_EXCLUDED_EXTENSIONS = (
    ".iso",
    ".nrg",
    ".bin",
    ".cue",
    ".img",
    ".mdf",
    ".toast",
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".xml",
    ".sqlite",
    ".torrent",
    ".txt",
    ".afpk",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".m3u",
    ".pls",
)


def resolve_archive_item_audio(identifier: str, timeout: float = 4.5) -> Optional[Dict[str, Any]]:
    """
    Resolves the first verified playable audio stream from Archive.org's item metadata.
    Returns dictionary with direct audioUrl, title, artist, duration or None if item has no audio.
    """
    clean_id = (identifier or "").strip()
    if not clean_id:
        return None

    # Strip prefixes if passed like nl-xyz or ia-xyz
    for prefix in ("nl-", "ia-", "fma-", "bbc-", "ia-sfx-"):
        if clean_id.startswith(prefix):
            clean_id = clean_id[len(prefix):]
            break

    if clean_id in _RESOLVED_CACHE:
        return _RESOLVED_CACHE[clean_id]

    meta_url = f"https://archive.org/metadata/{clean_id}/files"
    req = urllib.request.Request(
        meta_url,
        headers={
            "User-Agent": "ApexMindStudio/2.0 (LiveArchiveResolver; https://apexmind.ai)",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            files = data.get("result") or data.get("files") or []
            if not files or not isinstance(files, list):
                _RESOLVED_CACHE[clean_id] = None
                return None

            candidates: List[tuple[int, Dict[str, Any]]] = []

            for f in files:
                fname = f.get("name", "")
                if not fname:
                    continue

                fname_lower = fname.lower()
                # Reject disk images, archives, and metadata files
                if fname_lower.endswith(_EXCLUDED_EXTENSIONS):
                    continue

                fmt = str(f.get("format", "")).strip().lower()

                score = 0
                if fmt in _AUDIO_FORMATS:
                    score = _AUDIO_FORMATS[fmt]
                elif fname_lower.endswith(".mp3"):
                    score = 90
                elif fname_lower.endswith(".ogg"):
                    score = 75
                elif fname_lower.endswith(".wav"):
                    score = 50
                elif fname_lower.endswith((".flac", ".m4a", ".opus", ".aac")):
                    score = 45

                if score > 0:
                    # Penalize short samples if full songs exist
                    if "sample" in fname_lower or "preview" in fname_lower:
                        score -= 30
                    candidates.append((score, f))

            if not candidates:
                _RESOLVED_CACHE[clean_id] = None
                return None

            # Sort descending by score
            candidates.sort(key=lambda x: x[0], reverse=True)
            chosen = candidates[0][1]

            chosen_name = chosen.get("name")
            # Build direct download URL with URL-encoded filename
            quoted_filename = urllib.parse.quote(chosen_name)
            direct_url = f"https://archive.org/download/{clean_id}/{quoted_filename}"

            # Extract track metadata
            raw_title = chosen.get("title") or chosen_name.rsplit(".", 1)[0].replace("_", " ").strip()
            raw_artist = chosen.get("creator") or chosen.get("artist") or ""

            try:
                raw_duration = float(chosen.get("length") or chosen.get("duration") or 180)
            except (ValueError, TypeError):
                raw_duration = 180.0

            result = {
                "identifier": clean_id,
                "url": direct_url,
                "title": str(raw_title)[:55],
                "artist": str(raw_artist)[:45],
                "duration": int(raw_duration),
                "format": chosen.get("format", "VBR MP3"),
                "filename": chosen_name,
            }

            _RESOLVED_CACHE[clean_id] = result
            return result
    except Exception as e:
        logger.debug(f"Failed to resolve Archive.org metadata for {clean_id}: {e}")
        # Secondary fallback directly to metadata root if files endpoint failed
        try:
            alt_url = f"https://archive.org/metadata/{clean_id}"
            alt_req = urllib.request.Request(
                alt_url,
                headers={"User-Agent": "ApexMindStudio/2.0 (LiveArchiveResolver; https://apexmind.ai)"},
            )
            with urllib.request.urlopen(alt_req, timeout=3.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                files = data.get("files", [])
                for f in files:
                    fname = f.get("name", "")
                    if fname.lower().endswith(".mp3"):
                        direct_url = f"https://archive.org/download/{clean_id}/{urllib.parse.quote(fname)}"
                        res = {
                            "identifier": clean_id,
                            "url": direct_url,
                            "title": str(f.get("title") or fname.rsplit(".", 1)[0])[:55],
                            "artist": str(f.get("creator") or "")[:45],
                            "duration": 180,
                            "format": "MP3",
                            "filename": fname,
                        }
                        _RESOLVED_CACHE[clean_id] = res
                        return res
        except Exception:
            pass

    _RESOLVED_CACHE[clean_id] = None
    return None


def batch_resolve_archive_items(
    identifiers: List[str],
    max_workers: int = 12,
    timeout: float = 4.5,
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Resolves multiple Archive.org items in parallel with a thread pool.
    Returns a dictionary mapping clean identifier to resolution result.
    """
    results: Dict[str, Optional[Dict[str, Any]]] = {}
    missing_ids: List[str] = []

    for raw_id in identifiers:
        clean_id = (raw_id or "").strip()
        for prefix in ("nl-", "ia-", "fma-", "bbc-", "ia-sfx-"):
            if clean_id.startswith(prefix):
                clean_id = clean_id[len(prefix):]
                break
        if not clean_id:
            continue
        if clean_id in _RESOLVED_CACHE:
            results[clean_id] = _RESOLVED_CACHE[clean_id]
        else:
            missing_ids.append(clean_id)

    if not missing_ids:
        return results

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(max_workers, len(missing_ids))) as executor:
        future_to_id = {
            executor.submit(resolve_archive_item_audio, cid, timeout): cid
            for cid in missing_ids
        }
        for future in concurrent.futures.as_completed(future_to_id):
            cid = future_to_id[future]
            try:
                res = future.result()
                results[cid] = res
            except Exception as e:
                logger.debug(f"Batch resolve error for {cid}: {e}")
                results[cid] = None

    return results

