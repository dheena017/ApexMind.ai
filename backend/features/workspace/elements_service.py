"""
backend/features/workspace/elements_service.py
Service for Studio Visual Elements, Badges, Overlays, Frames, Social Stickers,
Progress Scrubbers, and Visual FX textures.
Provides catalog queries, AI-driven element recommendations based on video theme/tone,
and custom badge creation.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Studio.Elements")

VISUAL_ELEMENTS_CATALOG: List[Dict[str, Any]] = [
    # ── VIRAL BADGES ──
    {
        "id": "b-rule-1",
        "name": "Rule #1 Core Principle",
        "category": "badges",
        "label": "RULE #1",
        "desc": "Core Foundation",
        "color": "from-amber-500 to-orange-600",
        "iconName": "Zap",
        "type": "badge",
        "tags": ["rule", "core", "amber", "discipline", "mindset"],
    },
    {
        "id": "b-one-percent",
        "name": "The 1% Club",
        "category": "badges",
        "label": "THE 1% CLUB",
        "desc": "Elite Standards",
        "color": "from-blue-600 to-indigo-700",
        "iconName": "Crown",
        "type": "badge",
        "tags": ["1%", "elite", "blue", "wealth", "standards"],
    },
    {
        "id": "b-no-excuses",
        "name": "No Excuses",
        "category": "badges",
        "label": "NO EXCUSES",
        "desc": "Raw Discipline",
        "color": "from-red-600 to-rose-700",
        "iconName": "Flame",
        "type": "badge",
        "tags": ["discipline", "red", "excuses", "hardcore", "grit"],
    },
    {
        "id": "b-stoic-mind",
        "name": "Stoic Mindset",
        "category": "badges",
        "label": "STOIC MINDSET",
        "desc": "Mental Fortress",
        "color": "from-zinc-600 to-zinc-800",
        "iconName": "Shield",
        "type": "badge",
        "tags": ["stoic", "shield", "zinc", "philosophy", "calm"],
    },
    {
        "id": "b-day-one",
        "name": "Day 1 Or One Day",
        "category": "badges",
        "label": "DAY 1 OR ONE DAY",
        "desc": "Action Bias",
        "color": "from-emerald-600 to-teal-700",
        "iconName": "Target",
        "type": "badge",
        "tags": ["action", "emerald", "day1", "momentum", "habits"],
    },
    {
        "id": "b-silent-warrior",
        "name": "Silent Warrior",
        "category": "badges",
        "label": "SILENT WARRIOR",
        "desc": "Zero Talk",
        "color": "from-purple-600 to-indigo-800",
        "iconName": "Award",
        "type": "badge",
        "tags": ["silent", "purple", "warrior", "quiet", "solitude"],
    },
    {
        "id": "b-four-am",
        "name": "4:00 AM Club",
        "category": "badges",
        "label": "4:00 AM CLUB",
        "desc": "Early Discipline",
        "color": "from-cyan-600 to-blue-700",
        "iconName": "Zap",
        "type": "badge",
        "tags": ["morning", "cyan", "early", "routine", "clock"],
    },
    {
        "id": "b-zero-distract",
        "name": "Zero Distractions",
        "category": "badges",
        "label": "ZERO DISTRACTIONS",
        "desc": "Laser Focus",
        "color": "from-fuchsia-600 to-pink-700",
        "iconName": "Target",
        "type": "badge",
        "tags": ["focus", "fuchsia", "laser", "deep-work", "monk"],
    },
    {
        "id": "b-forge-self",
        "name": "Forge Yourself",
        "category": "badges",
        "label": "FORGE YOURSELF",
        "desc": "Iron Will",
        "color": "from-orange-600 to-red-700",
        "iconName": "Flame",
        "type": "badge",
        "tags": ["iron", "orange", "will", "strength", "overcome"],
    },
    {
        "id": "b-unstoppable",
        "name": "Unstoppable Momentum",
        "category": "badges",
        "label": "UNSTOPPABLE",
        "desc": "Pure Momentum",
        "color": "from-emerald-500 to-cyan-600",
        "iconName": "Crown",
        "type": "badge",
        "tags": ["momentum", "unstoppable", "energy", "confidence"],
    },
    {
        "id": "b-memento-mori",
        "name": "Memento Mori",
        "category": "badges",
        "label": "MEMENTO MORI",
        "desc": "Time Scarcity",
        "color": "from-zinc-700 to-zinc-900",
        "iconName": "Shield",
        "type": "badge",
        "tags": ["time", "memento", "mori", "stoic", "urgency"],
    },
    {
        "id": "b-empire-build",
        "name": "Empire Builder",
        "category": "badges",
        "label": "EMPIRE BUILDER",
        "desc": "Generational Wealth",
        "color": "from-amber-600 to-yellow-700",
        "iconName": "Award",
        "type": "badge",
        "tags": ["empire", "wealth", "gold", "finance", "business"],
    },
    {
        "id": "b-monk-mode",
        "name": "Monk Mode",
        "category": "badges",
        "label": "MONK MODE",
        "desc": "Isolated Focus",
        "color": "from-slate-700 to-zinc-900",
        "iconName": "Shield",
        "type": "badge",
        "tags": ["monk", "mode", "isolation", "discipline"],
    },
    {
        "id": "b-stay-hard",
        "name": "Stay Hard",
        "category": "badges",
        "label": "STAY HARD",
        "desc": "Goggins Energy",
        "color": "from-red-700 to-neutral-900",
        "iconName": "Flame",
        "type": "badge",
        "tags": ["goggins", "hard", "grit", "relentless"],
    },
    {
        "id": "b-dopamine-detox",
        "name": "Dopamine Detox",
        "category": "badges",
        "label": "DOPAMINE DETOX",
        "desc": "Reset Chemistry",
        "color": "from-teal-600 to-emerald-800",
        "iconName": "Zap",
        "type": "badge",
        "tags": ["dopamine", "detox", "reset", "mind"],
    },
    {
        "id": "b-high-agency",
        "name": "High Agency",
        "category": "badges",
        "label": "HIGH AGENCY",
        "desc": "Bend Reality",
        "color": "from-indigo-600 to-violet-800",
        "iconName": "Crown",
        "type": "badge",
        "tags": ["agency", "leadership", "power", "control"],
    },

    # ── SOCIAL ENGAGEMENT STICKERS ──
    {
        "id": "s-yt-sub",
        "name": "YouTube Subscribe Pill",
        "category": "social",
        "label": "SUBSCRIBE",
        "desc": "Red Button with Bell",
        "color": "from-red-600 to-red-700",
        "iconName": "Youtube",
        "type": "sticker",
        "tags": ["youtube", "subscribe", "social", "cta"],
    },
    {
        "id": "s-ig-tag",
        "name": "Instagram Creator Tag",
        "category": "social",
        "label": "@ApexMind.ai",
        "desc": "IG gradient handle",
        "color": "from-purple-600 via-pink-600 to-amber-500",
        "iconName": "Instagram",
        "type": "sticker",
        "tags": ["instagram", "handle", "social", "follow"],
    },
    {
        "id": "s-share-arrow",
        "name": "Share This Video",
        "category": "social",
        "label": "SHARE THIS REEL",
        "desc": "Virality Reminder",
        "color": "from-blue-500 to-indigo-600",
        "iconName": "Share2",
        "type": "sticker",
        "tags": ["share", "viral", "arrow", "social"],
    },
    {
        "id": "s-save-bookmark",
        "name": "Save For Later",
        "category": "social",
        "label": "SAVE REEL",
        "desc": "Bookmark Badge",
        "color": "from-amber-500 to-orange-500",
        "iconName": "Bookmark",
        "type": "sticker",
        "tags": ["save", "bookmark", "algorithm"],
    },
    {
        "id": "s-verified-blue",
        "name": "Verified Badge Blue",
        "category": "social",
        "label": "VERIFIED",
        "desc": "Official Checkmark",
        "color": "from-sky-500 to-blue-600",
        "iconName": "CheckCircle",
        "type": "badge",
        "tags": ["verified", "blue", "official", "authority"],
    },
    {
        "id": "s-verified-gold",
        "name": "Verified Badge Gold",
        "category": "social",
        "label": "VIP GOLD",
        "desc": "Gold Verified Check",
        "color": "from-amber-400 to-yellow-600",
        "iconName": "CheckCircle",
        "type": "badge",
        "tags": ["verified", "gold", "vip", "luxury"],
    },

    # ── FRAMES & BORDERS ──
    {
        "id": "frame-cinema-bars",
        "name": "Cinematic Letterbox",
        "category": "frames",
        "desc": "Anamorphic black bars top & bottom",
        "iconName": "Square",
        "type": "frame",
        "tags": ["cinema", "letterbox", "bars", "widescreen"],
    },
    {
        "id": "frame-scanlines",
        "name": "CRT Scanlines",
        "category": "frames",
        "desc": "Retro television interlaced scanline effect",
        "iconName": "Tv",
        "type": "frame",
        "tags": ["crt", "scanlines", "retro", "analog"],
    },
    {
        "id": "frame-minimal-border",
        "name": "Minimalist White Border",
        "category": "frames",
        "desc": "Clean 2px inner white framing line",
        "iconName": "Square",
        "type": "frame",
        "tags": ["minimal", "clean", "border", "white"],
    },
    {
        "id": "frame-cyber-grid",
        "name": "Cyber Neon Grid",
        "category": "frames",
        "desc": "Futuristic neon framing corners",
        "iconName": "Grid",
        "type": "frame",
        "tags": ["cyber", "neon", "grid", "futuristic"],
    },

    # ── PROGRESS BARS & SCRUBBERS ──
    {
        "id": "prog-top",
        "name": "Top Reel Countdown Scrubber",
        "category": "progress",
        "desc": "Smooth 0-100% time bar on top edge",
        "iconName": "Clock",
        "type": "progress",
        "tags": ["progress", "countdown", "scrubber", "top"],
    },
    {
        "id": "prog-bottom",
        "name": "Bottom Progress Scrubber",
        "category": "progress",
        "desc": "Clean blue fill bar across bottom",
        "iconName": "Clock",
        "type": "progress",
        "tags": ["progress", "bottom", "blue", "timeline"],
    },
    {
        "id": "prog-soundwave",
        "name": "Dynamic Soundwave Bars",
        "category": "progress",
        "desc": "Animated audio spectrum equalizer bars",
        "iconName": "Activity",
        "type": "progress",
        "tags": ["soundwave", "audio", "spectrum", "bars"],
    },

    # ── EMOJIS & SYMBOLS ──
    {
        "id": "emoji-lightning",
        "name": "Lightning Bolt",
        "category": "emojis",
        "symbol": "⚡",
        "label": "Lightning",
        "type": "emoji",
        "tags": ["energy", "fast", "speed", "power"],
    },
    {
        "id": "emoji-swords",
        "name": "Crossed Swords",
        "category": "emojis",
        "symbol": "⚔️",
        "label": "Swords",
        "type": "emoji",
        "tags": ["battle", "warrior", "fight", "stoic"],
    },
    {
        "id": "emoji-crown",
        "name": "Royal Crown",
        "category": "emojis",
        "symbol": "👑",
        "label": "Crown",
        "type": "emoji",
        "tags": ["king", "leader", "wealth", "empire"],
    },
    {
        "id": "emoji-fire",
        "name": "Pure Fire",
        "category": "emojis",
        "symbol": "🔥",
        "label": "Fire",
        "type": "emoji",
        "tags": ["hot", "drive", "intensity", "burn"],
    },
    {
        "id": "emoji-lion",
        "name": "Lion King",
        "category": "emojis",
        "symbol": "🦁",
        "label": "Lion",
        "type": "emoji",
        "tags": ["courage", "predator", "strength", "beast"],
    },
    {
        "id": "emoji-hourglass",
        "name": "Hourglass Time",
        "category": "emojis",
        "symbol": "⏳",
        "label": "Hourglass",
        "type": "emoji",
        "tags": ["time", "memento", "mori", "urgency"],
    },
    {
        "id": "emoji-pillar",
        "name": "Stoic Pillar",
        "category": "emojis",
        "symbol": "🏛️",
        "label": "Stoic Pillar",
        "type": "emoji",
        "tags": ["roman", "stoic", "foundation", "temple"],
    },
    {
        "id": "emoji-shield",
        "name": "Iron Shield",
        "category": "emojis",
        "symbol": "🛡️",
        "label": "Shield",
        "type": "emoji",
        "tags": ["defense", "fortress", "armor", "protection"],
    },
    {
        "id": "emoji-rocket",
        "name": "Rocket Ship",
        "category": "emojis",
        "symbol": "🚀",
        "label": "Rocket",
        "type": "emoji",
        "tags": ["growth", "moon", "scale", "future"],
    },
]

ELEMENT_CATEGORIES = [
    {"id": "badges", "label": "Badges & Seals", "count": 16},
    {"id": "fx", "label": "Visual FX", "count": 4},
    {"id": "social", "label": "Social Tags", "count": 6},
    {"id": "frames", "label": "Frames & Borders", "count": 4},
    {"id": "progress", "label": "Progress Scrubbers", "count": 3},
    {"id": "emojis", "label": "Symbolic Emojis", "count": 9},
]


def get_elements_catalog(category: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve all available elements, optionally filtered by category or keyword search."""
    items = list(VISUAL_ELEMENTS_CATALOG)
    if category and category.strip() and category.lower() != "all":
        cat_lower = category.strip().lower()
        items = [e for e in items if e.get("category") == cat_lower]

    if search and search.strip():
        q = search.strip().lower()
        items = [
            e
            for e in items
            if q in e.get("name", "").lower()
            or q in e.get("label", "").lower()
            or q in e.get("desc", "").lower()
            or any(q in t.lower() for t in e.get("tags", []))
        ]

    return {
        "success": True,
        "total": len(items),
        "category": category or "all",
        "categories": ELEMENT_CATEGORIES,
        "elements": items,
    }


def get_recommended_elements(
    category: str,
    topic: Optional[str] = None,
    tone: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Intelligently recommends 3-5 visual elements tailored to the video's theme,
    topic, and emotional tone to maximize viewer retention and engagement.
    """
    cat_lower = (category or "").lower()
    topic_lower = (topic or "").lower()
    tone_lower = (tone or "").lower()
    context = f"{cat_lower} {topic_lower} {tone_lower}"

    scored: List[tuple[int, Dict[str, Any]]] = []

    for el in VISUAL_ELEMENTS_CATALOG:
        score = 0
        tags = el.get("tags", [])

        # Thematic tag matching
        if any(t in context for t in tags):
            score += 3

        # Tone matching
        if "stoic" in context and el.get("id") in ["b-stoic-mind", "b-memento-mori", "emoji-pillar", "b-silent-warrior"]:
            score += 5
        elif "motivation" in context and el.get("id") in ["b-unstoppable", "b-forge-self", "b-no-excuses", "emoji-fire"]:
            score += 5
        elif "wealth" in context or "finance" in context and el.get("id") in ["b-one-percent", "b-empire-build", "emoji-crown"]:
            score += 5
        elif "early" in context or "morning" in context and el.get("id") in ["b-four-am", "emoji-lightning"]:
            score += 5

        # Boost high-performing social elements for viral Shorts
        if el.get("id") in ["s-yt-sub", "s-save-bookmark", "prog-top"]:
            score += 2

        if score > 0:
            scored.append((score, el))

    # Sort descending by score
    scored.sort(key=lambda x: x[0], reverse=True)
    recommended = [item[1] for item in scored[:6]]

    # Fallback to default high-retention trio if no specific matches
    if not recommended:
        recommended = [
            next(e for e in VISUAL_ELEMENTS_CATALOG if e["id"] == "b-rule-1"),
            next(e for e in VISUAL_ELEMENTS_CATALOG if e["id"] == "s-save-bookmark"),
            next(e for e in VISUAL_ELEMENTS_CATALOG if e["id"] == "prog-top"),
        ]

    logger.debug(f"[ElementsService] Recommended {len(recommended)} elements for context '{context}'")
    return {
        "success": True,
        "category": category,
        "recommended": recommended,
    }


def create_custom_badge(
    text: str,
    gradient: Optional[str] = None,
    icon: Optional[str] = None,
    category: Optional[str] = "custom",
) -> Dict[str, Any]:
    """Generates a custom badge item with sanitized text and styling."""
    clean_text = (text or "").strip().upper()
    if not clean_text:
        raise ValueError("Badge text cannot be empty.")

    clean_gradient = gradient or "from-amber-500 to-orange-600"
    badge_id = f"custom-badge-{clean_text.lower().replace(' ', '-')[:20]}"

    new_element = {
        "id": badge_id,
        "name": clean_text,
        "category": category or "custom",
        "label": clean_text,
        "desc": "Custom Creator Badge",
        "color": clean_gradient,
        "iconName": icon or "Zap",
        "type": "badge",
        "tags": ["custom", clean_text.lower()],
    }

    logger.info(f"[ElementsService] Created custom badge: '{clean_text}' ({badge_id})")
    return {
        "success": True,
        "element": new_element,
    }

