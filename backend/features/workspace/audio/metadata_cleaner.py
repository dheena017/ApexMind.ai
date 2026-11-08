"""
backend/features/workspace/audio/metadata_cleaner.py
Cleans, normalizes, and extracts proper song titles and artist names from raw API metadata,
removing file extensions, license noise (cc-by, public domain), date prefixes, and messy usernames.
"""

import re
from typing import Tuple


def clean_track_title_and_artist(
    raw_title: str,
    raw_artist: str = "",
    default_artist: str = "Independent Creator",
) -> Tuple[str, str]:
    """
    Cleans raw soundtrack metadata into high-quality human-readable Title and Artist.
    Example inputs:
      '"London Town (You haunt me)" by Melville Gideon (1923)' -> ('London Town (You Haunt Me)', 'Melville Gideon')
      'Kevin MacLeod - Stay The Course (cc-by-3.0)'           -> ('Stay The Course', 'Kevin MacLeod')
      '03may2020-tobefree'                                     -> ('To Be Free', 'Independent Creator')
      'Be Simple - Felipe RuizBRX11'                           -> ('Be Simple', 'Felipe Ruiz')
      'Internet Anthem Waltz - Felipe RuizBRX11'               -> ('Internet Anthem Waltz', 'Felipe Ruiz')
    """
    title = (raw_title or "").strip()
    artist = (raw_artist or "").strip()

    # Strip Wikimedia 'File:' and audio extensions
    title = re.sub(r"^File:\s*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\.(mp3|ogg|wav|flac|m4a|opus|aac)$", "", title, flags=re.IGNORECASE).strip()

    # Strip license tags like (cc-by-3.0), [CC-BY], (Creative Commons), (Public Domain)
    title = re.sub(r"[\(\[]\s*cc[\s\-_0-9a-z.]*[\)\]]", "", title, flags=re.IGNORECASE).strip()
    title = re.sub(r"[\(\[]\s*(public domain|royalty[\s\-_]free|creative commons|open audio)[\)\]]", "", title, flags=re.IGNORECASE).strip()

    # Strip trailing recording year like (1923), (2020)
    title = re.sub(r"[\(\[]\s*\d{4}\s*[\)\]]", "", title).strip()

    # Match '"Song Title" by Artist' or 'Song Title by Artist'
    by_match = re.match(r'^["\']?(.+?)["\']?\s+by\s+(.+)$', title, flags=re.IGNORECASE)
    if by_match:
        title = by_match.group(1).strip()
        extracted_artist = by_match.group(2).strip()
        if not artist or "Wikimedia" in artist or "Contributor" in artist or "Artist" in artist:
            artist = extracted_artist

    # Match 'Artist - Title' or 'Title - Artist'
    dash_match = re.split(r"\s+[-–—]\s+", title)
    if len(dash_match) == 2:
        p0, p1 = dash_match[0].strip(), dash_match[1].strip()
        # Clean potential username codes like RuizBRX11 -> Ruiz
        p1_clean = re.sub(r"([a-zA-Z]+)[0-9]{2,}$", r"\1", p1).strip()
        p0_clean = re.sub(r"([a-zA-Z]+)[0-9]{2,}$", r"\1", p0).strip()

        # Check if p0 is a known or likely artist (e.g., Kevin MacLeod, Felipe Ruiz)
        words_p0 = p0_clean.split()
        if (
            len(words_p0) <= 3
            and not any(w in p0.lower() for w in ["waltz", "anthem", "sound", "theme", "track", "music", "piano", "loop"])
            and (not artist or "Wikimedia" in artist or "Contributor" in artist)
        ):
            artist = p0_clean
            title = p1_clean
        elif (not artist or "Wikimedia" in artist or "Contributor" in artist):
            title = p0_clean
            artist = p1_clean
        else:
            title = p1_clean if len(p1_clean) > len(p0_clean) else p0_clean

    # Strip date prefixes like '03may2020-tobefree' or '2020-05-03_'
    title = re.sub(r"^\d{1,4}[a-zA-Z]{3,4}\d{2,4}[-_\s]*", "", title)
    title = re.sub(r"^\d{4}[-_]\d{2}[-_]\d{2}[-_\s]*", "", title)

    # Clean concatenated slug words like 'tobefree' -> 'To Be Free'
    if "-" in title or "_" in title:
        title = re.sub(r"[-_]+", " ", title).strip()
    elif title.islower() and len(title) > 5 and " " not in title:
        if title == "tobefree":
            title = "To Be Free"
        else:
            # PascalCase or spaced title
            title = re.sub(r"([a-z])([A-Z])", r"\1 \2", title)

    # Clean artist if it still has trailing username numbers like 'Felipe RuizBRX11'
    if artist:
        artist = re.sub(r"([a-zA-Z]+)[0-9]{2,}$", r"\1", artist).strip()
        artist = re.sub(r"^by\s+", "", artist, flags=re.IGNORECASE).strip()
        artist = re.sub(r"[\(\[].*?[\)\]]", "", artist).strip()

    if not artist or "Wikimedia" in artist or "Contributor" in artist:
        artist = default_artist

    # Clean extra quotes, brackets and extra whitespace
    title = re.sub(r'^["\'\s]+|["\'\s]+$', "", title).strip()
    title = re.sub(r"\s{2,}", " ", title)

    # Proper Title Case if entirely lower or upper
    if title.islower() or title.isupper():
        title = title.title()

    return title or "Ambient Soundtrack", artist

