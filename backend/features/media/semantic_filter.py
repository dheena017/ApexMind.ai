"""
backend/features/media/semantic_filter.py
Semantic Negative Filtering & Aesthetic Prioritization Engine for Stock Footage.
Ensures zero mismatched, crowded, modern tech, gym/fitness, or commercial clutter clips,
and strictly prioritizes 4K UHD, 60fps/120fps slow-motion, and dramatic natural lighting footage.
"""

from __future__ import annotations

import re
import logging
from typing import List, Set, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field

from backend.features.media.base import MediaAsset

logger = logging.getLogger("ApexMind.media.semantic_filter")

# ── Semantic Negative Filter Patterns (Hard Rejection) ──────────────────────────

# 1. Humans talking, interviews, podcasts, talking heads to camera
HUMAN_SPEECH_REJECTIONS: Set[str] = {
    "talking to camera", "talking head", "interview", "podcast", "speaking to camera",
    "vlog", "vlogger", "presenter", "webinar", "explaining", "reporter", "news anchor",
    "speech", "mouth moving", "conversation", "zoom call", "facetime", "testimonial",
    "video call", "conference call", "talking person", "talking woman", "talking man",
    "influencer speaking", "talking close up", "person speaking", "dialogue", "host",
    "spokesperson", "headshot talking", "speaking microphone"
}

# 2. Crowded city streets, pedestrian traffic, rush hour congestion
CROWDED_CITY_REJECTIONS: Set[str] = {
    "crowded street", "crowd of people", "crowded sidewalk", "pedestrians", "pedestrian crossing",
    "crosswalk crowd", "traffic jam", "rush hour", "commuters", "busy street", "city crowd",
    "busy sidewalk", "shopping mall crowd", "subway crowd", "metro station crowd",
    "busy intersection", "crowded market", "traffic congestion", "cars in traffic",
    "city pedestrians", "walking in crowd", "tourist crowd", "packed street"
}

# 3. Modern tech, office cubicles, laptops, smartphones, corporate meetings
MODERN_TECH_REJECTIONS: Set[str] = {
    "laptop", "smartphone", "cell phone", "typing on keyboard", "typing on laptop",
    "computer screen", "office desk", "office cubicle", "corporate meeting", "boardroom",
    "software code", "cellphone", "texting", "call center", "desktop monitor",
    "business presentation", "excel sheet", "working on laptop", "browsing phone",
    "scrolling phone", "office workers at desks", "holding smartphone", "programmer coding",
    "coworking space", "business people handshake", "financial chart on screen"
}

# 4. Low-effort overlays, green screens, chroma keys, clipart CTA buttons
CLIPART_OVERLAY_REJECTIONS: Set[str] = {
    "green screen", "chroma key", "isolated on white", "transparent background",
    "isolated on black", "subscribe button", "like and subscribe", "lower third",
    "subscribe animation", "animated icon", "cartoon character", "infographic",
    "click button", "red button", "isolated green", "subscribe like"
}

# 5. Gyms, workout rooms, modern fitness cliches (mismatches stoic/philosophical depth)
GYM_FITNESS_REJECTIONS: Set[str] = {
    "gym", "gyms", "weightlifting", "bodybuilder", "bodybuilding", "treadmill",
    "fitness club", "exercise equipment", "crossfit", "bicep curl", "bench press",
    "dumbbells", "barbell", "workout video", "gym selfie", "spandex workout",
    "aerobics class", "spinning class", "gym workout", "lifting weights in gym",
    "pilates class", "locker room"
}

# 6. Modern vehicle traffic & street clutter
MODERN_VEHICLE_REJECTIONS: Set[str] = {
    "driving car", "car dashboard", "sports car speeding", "traffic light", "parking lot",
    "gas station", "car interior", "steering wheel", "rear view mirror", "supercar",
    "highway driving", "car showroom", "car dealership", "sedan", "suv on street",
    "car engine", "fuel pump", "mechanic shop"
}

# 7. Commercial retail clutter & supermarkets
COMMERCIAL_RETAIL_REJECTIONS: Set[str] = {
    "supermarket", "shopping cart", "retail store", "cash register", "credit card payment",
    "fast food", "restaurant kitchen", "bar counter", "grocery store", "aisle shopping",
    "store shelves", "price tag", "checkout counter", "buying clothes", "department store"
}


# ── Semantic Positive Aesthetic Signals (High Scoring & Prioritization) ─────────

# 1. Slow Motion & High Framerate (+40 pts)
SLOW_MOTION_KEYWORDS: Set[str] = {
    "slow motion", "slow-mo", "slomo", "slowmo", "60fps", "120fps", "240fps",
    "high frame rate", "high speed camera", "phantom flex", "ultra slow motion",
    "cinematic slow", "water drop slow", "flame slow motion", "slow motion waves"
}

# 2. High Contrast & Dramatic Lighting (+35 pts)
DRAMATIC_LIGHTING_KEYWORDS: Set[str] = {
    "dramatic lighting", "high contrast", "golden hour", "sunset", "sunrise",
    "silhouette", "chiaroscuro", "dark moody", "volumetric lighting", "atmospheric",
    "fog", "mist", "thunderstorm", "lightning", "rays of light", "god rays",
    "crepuscular rays", "lens flare", "twilight", "dusk", "neon glow", "rim lighting",
    "backlit", "cinematic lighting", "storm clouds", "golden light", "shadows"
}

# 3. Epic Nature & Stoic Elements (+25 pts)
EPIC_NATURE_KEYWORDS: Set[str] = {
    "mountains", "mountain peak", "ocean waves", "clouds time lapse", "forest",
    "waterfall", "fire", "smoke", "embers", "sparks", "stars", "milky way", "galaxy",
    "nebula", "space", "statue", "marble bust", "ancient ruins", "desert dunes",
    "canyon", "cliff", "glacier", "aurora borealis", "northern lights", "volcano",
    "rain on glass", "dark storm", "ocean horizon", "raging sea", "cascading water",
    "snow storm", "lone wanderer", "foggy pine trees", "stormy sky"
}


class SemanticEvaluationResult(BaseModel):
    is_accepted: bool = True
    rejection_reason: Optional[str] = None
    rejection_category: Optional[str] = None
    aesthetic_score: float = 0.0
    badges: List[str] = Field(default_factory=list)
    positive_matches: List[str] = Field(default_factory=list)


def _extract_all_text_tokens(cand: MediaAsset) -> str:
    """Combines title, tags, description, source URL, and metadata into a normalized searchable string."""
    parts: List[str] = [cand.title or ""]

    extra = cand.extraMetadata or {}
    if "tags" in extra:
        raw_tags = extra["tags"]
        if isinstance(raw_tags, list):
            parts.extend([str(t) for t in raw_tags])
        elif isinstance(raw_tags, str):
            parts.append(raw_tags)

    if "description" in extra:
        parts.append(str(extra["description"]))
    if "sourceUrl" in extra:
        parts.append(str(extra["sourceUrl"]).replace("-", " ").replace("_", " "))

    url = cand.url or ""
    parts.append(url.replace("-", " ").replace("_", " ").replace("/", " "))

    combined = " ".join(parts).lower()
    return re.sub(r"[^\w\s]", " ", combined)


def evaluate_clip(
    cand: MediaAsset,
    target_query: str = "",
    allow_tech_if_query_explicit: bool = True,
) -> SemanticEvaluationResult:
    """
    Evaluates a stock media candidate against semantic negative filters and computes an aesthetic score.
    Returns SemanticEvaluationResult with accept/reject decision, rejection reason, and aesthetic badges.
    """
    if not cand or not cand.url:
        return SemanticEvaluationResult(is_accepted=False, rejection_reason="Empty or missing media asset URL")

    text_corpus = _extract_all_text_tokens(cand)
    target_q_clean = (target_query or "").lower().strip()

    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 1: HARD NEGATIVE CHECKS
    # ─────────────────────────────────────────────────────────────────────────────

    # 1. Clipart & Green Screen Check (Always Rejected)
    for bad in CLIPART_OVERLAY_REJECTIONS:
        if bad in text_corpus:
            return SemanticEvaluationResult(
                is_accepted=False,
                rejection_reason=f"Rejected: Clipart/Chroma key overlay pattern ('{bad}')",
                rejection_category="clipart_overlay",
            )

    # 2. Human Speech / Interviews / Talking to Camera Check
    for bad in HUMAN_SPEECH_REJECTIONS:
        if bad in text_corpus:
            return SemanticEvaluationResult(
                is_accepted=False,
                rejection_reason=f"Rejected: Talking head / human speech clip ('{bad}')",
                rejection_category="human_speech",
            )

    # 3. Crowded City Streets / Pedestrian Congestion Check
    for bad in CROWDED_CITY_REJECTIONS:
        if bad in text_corpus:
            return SemanticEvaluationResult(
                is_accepted=False,
                rejection_reason=f"Rejected: Crowded street / pedestrian traffic congestion ('{bad}')",
                rejection_category="crowded_city",
            )

    # 4. Modern Tech / Office Cubicle Check (Unless target_query explicitly asked for coding/tech)
    user_explicitly_wants_tech = bool(
        allow_tech_if_query_explicit
        and any(w in target_q_clean for w in ["coding", "code", "programming", "software", "laptop", "computer", "tech"])
    )

    if not user_explicitly_wants_tech:
        for bad in MODERN_TECH_REJECTIONS:
            if bad in text_corpus:
                return SemanticEvaluationResult(
                    is_accepted=False,
                    rejection_reason=f"Rejected: Modern office / tech clutter ('{bad}')",
                    rejection_category="modern_tech",
                )

    # 5. Gyms & Workout Rooms Check (Unless target_query explicitly asked for gym/workout)
    user_explicitly_wants_fitness = bool(
        any(w in target_q_clean for w in ["gym", "workout", "fitness", "bodybuilding", "exercise", "weightlifting"])
    )
    if not user_explicitly_wants_fitness:
        for bad in GYM_FITNESS_REJECTIONS:
            if bad in text_corpus:
                return SemanticEvaluationResult(
                    is_accepted=False,
                    rejection_reason=f"Rejected: Gym / workout cliche ('{bad}')",
                    rejection_category="gym_fitness",
                )

    # 6. Modern Vehicle Traffic Check (Unless query explicitly asked for cars/driving)
    user_explicitly_wants_vehicle = bool(
        any(w in target_q_clean for w in ["car", "cars", "drive", "driving", "automobile", "racing"])
    )
    if not user_explicitly_wants_vehicle:
        for bad in MODERN_VEHICLE_REJECTIONS:
            if bad in text_corpus:
                return SemanticEvaluationResult(
                    is_accepted=False,
                    rejection_reason=f"Rejected: Modern vehicle traffic clutter ('{bad}')",
                    rejection_category="modern_vehicle",
                )

    # 7. Commercial Retail Clutter Check
    for bad in COMMERCIAL_RETAIL_REJECTIONS:
        if bad in text_corpus:
            return SemanticEvaluationResult(
                is_accepted=False,
                rejection_reason=f"Rejected: Commercial store / retail clutter ('{bad}')",
                rejection_category="commercial_retail",
            )

    # ─────────────────────────────────────────────────────────────────────────────
    # STEP 2: POSITIVE AESTHETIC SCORING & BADGE COMPUTATION
    # ─────────────────────────────────────────────────────────────────────────────
    score: float = 50.0  # Base passing score
    badges: List[str] = []
    positive_matches: List[str] = []

    extra = cand.extraMetadata or {}
    fps = float(extra.get("fps") or 0.0)

    # A. Slow Motion & High Framerate Check (+40 pts)
    is_slomo = False
    if fps >= 59.0:
        score += 40.0
        badges.append(f"{int(fps)}fps High-Speed")
        is_slomo = True
    else:
        for sm in SLOW_MOTION_KEYWORDS:
            if sm in text_corpus:
                score += 35.0
                badges.append("Slow-Motion")
                positive_matches.append(sm)
                is_slomo = True
                break

    # B. High Contrast & Dramatic Lighting Check (+35 pts)
    lighting_matched = False
    for dl in DRAMATIC_LIGHTING_KEYWORDS:
        if dl in text_corpus:
            positive_matches.append(dl)
            if not lighting_matched:
                score += 30.0
                lighting_matched = True
            if ("lighting" in dl or "rays" in dl or "flare" in dl or "silhouette" in dl) and "Dramatic Lighting" not in badges:
                badges.append("Dramatic Lighting")
            if ("contrast" in dl or "shadows" in dl or "chiaroscuro" in dl) and "High Contrast" not in badges:
                badges.append("High Contrast")
            if ("sunset" in dl or "golden hour" in dl or "sunrise" in dl) and "Golden Hour" not in badges:
                badges.append("Golden Hour")

    # C. Epic Nature & Stoic Mood (+25 pts)
    for en in EPIC_NATURE_KEYWORDS:
        if en in text_corpus:
            score += 25.0
            if "mountain" in en or "ocean" in en or "waterfall" in en or "canyon" in en or "cliff" in en:
                badges.append("Epic Nature")
            elif "statue" in en or "ruins" in en:
                badges.append("Stoic Classic")
            elif "space" in en or "galaxy" in en or "nebula" in en or "stars" in en:
                badges.append("Cosmic Space")
            positive_matches.append(en)
            break

    # D. 4K UHD & High Resolution (+25 pts)
    w_str, h_str = (cand.resolution or "1080x1920").split("x") if "x" in (cand.resolution or "") else ("1080", "1920")
    try:
        w_val, h_val = int(w_str), int(h_str)
        max_dim = max(w_val, h_val)
        if max_dim >= 3840 or "4k" in text_corpus or "uhd" in text_corpus:
            score += 25.0
            badges.append("4K UHD")
        elif max_dim >= 1920:
            score += 15.0
            badges.append("1080p FHD")

        # Aspect Ratio Match (+20 pts)
        if cand.aspectRatio == "9:16" and h_val > w_val:
            score += 20.0
            badges.append("9:16 Portrait")
        elif cand.aspectRatio == "16:9" and w_val >= h_val:
            score += 20.0
            badges.append("16:9 Landscape")
    except Exception:
        pass

    # E. Sweet-Spot Short-Form Duration (+10 pts)
    dur = float(cand.duration or 0.0)
    if 4.0 <= dur <= 18.0:
        score += 10.0
    elif dur > 35.0:
        score -= 15.0  # Penalize unwieldy large video files that cause buffer delays

    # Cap score at 100 max
    final_score = min(100.0, max(0.0, score))

    # Deduplicate badges while preserving order
    unique_badges = list(dict.fromkeys(badges))

    return SemanticEvaluationResult(
        is_accepted=True,
        aesthetic_score=round(final_score, 1),
        badges=unique_badges,
        positive_matches=list(set(positive_matches)),
    )


def filter_and_rank_candidates(
    candidates: List[MediaAsset],
    target_query: str = "",
    min_score_threshold: float = 35.0,
) -> Tuple[List[MediaAsset], List[Dict[str, Any]]]:
    """
    Filters a list of candidate MediaAssets through semantic negative filtering,
    rejects mismatched items, enriches accepted assets with aesthetic badges and scores,
    and returns candidates sorted from highest aesthetic quality to lowest.
    """
    accepted: List[Tuple[float, MediaAsset]] = []
    rejected_logs: List[Dict[str, Any]] = []

    for cand in candidates:
        eval_res = evaluate_clip(cand, target_query=target_query)
        if not eval_res.is_accepted:
            rejected_logs.append({
                "id": cand.id,
                "title": cand.title,
                "reason": eval_res.rejection_reason,
                "category": eval_res.rejection_category,
            })
            continue

        if eval_res.aesthetic_score < min_score_threshold:
            rejected_logs.append({
                "id": cand.id,
                "title": cand.title,
                "reason": f"Aesthetic score ({eval_res.aesthetic_score}) below threshold ({min_score_threshold})",
                "category": "low_aesthetic_score",
            })
            continue

        # Attach scoring metadata to candidate
        cand.extraMetadata["aestheticScore"] = eval_res.aesthetic_score
        cand.extraMetadata["aestheticBadges"] = eval_res.badges
        cand.extraMetadata["positiveMatches"] = eval_res.positive_matches

        accepted.append((eval_res.aesthetic_score, cand))

    # Sort accepted clips descending by aesthetic score
    accepted.sort(key=lambda x: x[0], reverse=True)
    ranked_assets = [item[1] for item in accepted]

    if rejected_logs:
        logger.info(
            f"Semantic filter: Rejected {len(rejected_logs)} / {len(candidates)} clips | "
            f"Accepted {len(ranked_assets)} high-aesthetic clips."
        )

    return ranked_assets, rejected_logs


def evaluate_clip_with_gemini(
    cand: MediaAsset,
    scene_description: str,
) -> Optional[Dict[str, Any]]:
    """
    Optional Multimodal Gemini evaluation pass for candidate clips.
    Scores relevance to the scene description (1-100) and confirms absence of modern artifacts.
    """
    try:
        from backend.shared.config import settings
        from google import genai
        from google.genai import types

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None

        client = genai.Client(api_key=api_key)
        prompt = (
            f"Evaluate this stock footage candidate for a cinematic vertical short film.\n"
            f"Target Scene: \"{scene_description}\"\n"
            f"Candidate Title: \"{cand.title}\"\n"
            f"Candidate Tags: {cand.extraMetadata.get('tags', [])}\n\n"
            f"Output JSON with keys: score (int 1-100), cinematicFit (bool), reasoning (str), bestMoodTag (str)."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        if response and response.text:
            import json
            return json.loads(response.text)
    except Exception as exc:
        logger.debug(f"Gemini clip evaluation skipped: {exc}")
    return None
