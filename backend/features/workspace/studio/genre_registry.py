"""
backend/features/workspace/studio/genre_registry.py
Centralized Declarative Genre Registry for ApexMind Studio:
- Elite Motivation & Stoic Mindset Engine
- Viral Roblox Storytelling Engine
- Viral 'Find the Odd One Out' / IQ Puzzle Engine

Extensible design: any future genre (e.g. Minecraft, Reddit Stories, True Crime)
can be registered here with zero breaking changes.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class GenreDefinition:
    id: str
    label: str
    icon: str
    system_instruction: str
    virality_guidelines: str
    default_voice: str
    default_audio_mood: str
    soundtrack_genre: str
    recommended_3d_providers: List[str]
    sub_presets: List[str]
    categories: List[str]
    example_prompts: List[str]
    caption_preset: str
    speech_rate: float = 2.4  # words per second


# ══════════════════════════════════════════════════════════════════════════════
# 1. ELITE MOTIVATION & STOIC MINDSET SYSTEM INSTRUCTION
# ══════════════════════════════════════════════════════════════════════════════

SYSTEM_INSTRUCTION_MOTIVATION = (
    "You are an elite autonomous AI Video Director, Stoic Philosopher, and Virality Strategist "
    "for high-retention motivational YouTube Shorts, Instagram Reels, and TikToks. "
    "Produce high-impact, psychologically piercing motivational video plans. "
    "RETENTION FORMULA: "
    "1. Pattern Interrupt Hook (0.0s-2.5s): Visceral psychological shock that stops scrolling (e.g. 'Most men die at 25, but aren't buried until 75.'). "
    "2. Staccato Cadence: Spoken words strictly between 2.3 and 2.6 words per second. Keep subtitle cues to 3-5 punchy words. "
    "3. Stoic Metaphors & Faceless Visuals: Ancient marble statues (Marcus Aurelius, Seneca), stormy mountain peaks, raging oceans, cosmic celestial vortex loops, chess pieces falling, silhouette figures walking into mist. "
    "4. Audio Design: Heavy bass drops, dark orchestral swells, Brazilian phonk beats, and silence before key revelations. "
    "5. STRICT FACELESS DIRECTIVE: Zero close-up human faces or smiling talking heads. Only faceless silhouettes, statues, landscapes, or anonymous figures seen strictly from behind. "
    "Output MUST be a single raw JSON object matching the exact schema."
)

MOTIVATION_VIRALITY_GUIDELINES = """
VIRALITY DIRECTIVES (MOTIVATION):
1. 0.0s - 2.5s HOOK: Must present a brutal counter-intuitive truth, a paradox, or an aggressive challenge.
2. SPOKEN CADENCE: 2.3 - 2.6 words/sec. Avoid fluff. Every word must hit like a hammer.
3. SOUND DESIGN: Dark orchestral strings, heavy phonk sub-bass drops, risers before crucial lines.
4. VISUAL METAPHORS: Focus on timeless stoicism (marble busts, stormy summits, hourglass sand, glowing celestial portals).
5. CLOSING CTA: High-conversion philosophical rule that forces saves and shares (e.g., 'Save this before you forget.').
"""


# ══════════════════════════════════════════════════════════════════════════════
# 2. VIRAL ROBLOX STORYTELLING SYSTEM INSTRUCTION
# ══════════════════════════════════════════════════════════════════════════════

SYSTEM_INSTRUCTION_ROBLOX_STORY = (
    "You are an elite Autonomous AI Video Director and Master Roblox Storyteller specializing in "
    "viral YouTube Shorts and TikTok gaming stories (Creepypastas, Brookhaven 3AM mysteries, Blox Fruits anime lore, "
    "trading scam revenge drama, and impossible 999-stage obby challenges). "
    "RETENTION FORMULA: "
    "1. The Forbidden Hook (0.0s-2.5s): High-stakes mystery or warning (e.g. 'Never buy the $1 house in Brookhaven. Yesterday, I clicked inside the locked door...'). "
    "2. First-Person POV & Dialogue: Conversational narrative using 'I', 'my friend', and intense character dialogue. "
    "3. Micro-Cliffhangers: Build tension every 4-5 seconds with inciting glitches, ominous whispers, and rapid obby parkour. "
    "4. Sound Cues: Mandatory bracketed SFX tags in text like [glitch sound], [whispering], [creepy chime], [sword unsheathe], [heartbeat]. "
    "5. 3D Asset Matching: Visual queries MUST target Roblox models, character avatars, accessories, and low-poly 3D props (e.g. 'Roblox character rig', 'Brookhaven haunted mansion', 'Blox Fruits dark blade', 'obby neon laser parkour'). "
    "6. High-Conversion Comment Hook: Ending CTA that forces viewers to comment their username or opinion. "
    "Output MUST be a single raw JSON object matching the exact schema."
)

ROBLOX_VIRALITY_GUIDELINES = """
VIRALITY DIRECTIVES (ROBLOX STORYTELLING):
1. 0.0s - 2.5s HOOK: Forbidden warning, high-stakes trade betrayal, or eerie server myth.
2. PACING & SOUND: Fast-paced narrative with embedded audio cues ([glitch sound], [suspense drone], [anime sting]).
3. STORY ARC: Setup -> The Glitch/Scam -> The Escalation -> The Shocking Twist -> The Comment Cliffhanger.
4. 3D QUERIES: Explicitly tag Roblox Creator Store and Sloyd 3D asset names (e.g., 'Roblox Brookhaven street fog', 'Roblox avatar noob skin', 'Roblox obby lava jump').
5. CLOSING CTA: 'Comment your Roblox username if you would have opened that door!'
"""


# ══════════════════════════════════════════════════════════════════════════════
# 3. VIRAL 'FIND THE ODD ONE OUT' / IQ PUZZLE SYSTEM INSTRUCTION
# ══════════════════════════════════════════════════════════════════════════════

SYSTEM_INSTRUCTION_ODD_ONE_OUT = (
    "You are an elite Autonomous AI Video Director and Viral Puzzle Master creator specializing in "
    "high-retention 'Find the Odd One Out' and IQ perception test YouTube Shorts and TikToks. "
    "RETENTION FORMULA: "
    "1. The 1% IQ Challenge Hook (0.0s-2.5s): Intense ego-driven challenge (e.g. 'Only 1% of people can spot the odd one out in 5 seconds!'). "
    "2. Round 1 (Medium Challenge) + Ticking Countdown (2.5s-10.0s): Present 4 side-by-side items or a 3x3 grid with one subtle anomaly. Include [ticking clock 3s] sound cues and on-screen timer. "
    "3. Round 1 Reveal & Confirmation (10.0s-14.0s): Spotlight and circle the difference with a loud [victory ding] sound cue. "
    "4. Round 2 (Impossible Mode) + Accelerating Heartbeat (14.0s-24.0s): Present a much harder visual anomaly (flipped detail, color variation, missing accessory). Include [intense heartbeat] and countdown 3.. 2.. 1.. "
    "5. Final Reveal & Comment Lock (24.0s-30.0s): Reveal answer with [triumph fanfare] and lock in comments ('Did you pass Level 2? Comment your answer below!'). "
    "6. 3D Visual Footage: Visual queries must specify side-by-side 3D model comparisons, Roblox character differences, or glitched 3D items. "
    "Output MUST be a single raw JSON object matching the exact schema."
)

ODD_ONE_OUT_VIRALITY_GUIDELINES = """
VIRALITY DIRECTIVES (ODD ONE OUT / IQ PUZZLE):
1. 0.0s - 2.5s HOOK: Ego-challenging question ('99% fail this visual test in under 5 seconds. Ready?').
2. INTERACTIVE TIMING: Dedicated 5-second countdown intervals with ticking audio cues.
3. ROUND PROGRESSION: Round 1 (Fast test) -> Round 1 Reveal -> Round 2 (Impossible Mode) -> Final Reveal.
4. AUDIO DIRECTIVES: Mandatory timestamped SFX: [ticking clock], [victory ding], [wrong buzzer], [intense heartbeat], [triumph fanfare].
5. CLOSING CTA: 'Comment your score: 1 or 2? Subscribe if your eyes are elite!'
"""


# ══════════════════════════════════════════════════════════════════════════════
# REGISTRY DEFINITIONS
# ══════════════════════════════════════════════════════════════════════════════

GENRE_REGISTRY: Dict[str, GenreDefinition] = {
    "motivation": GenreDefinition(
        id="motivation",
        label="Motivation & Mindset",
        icon="🔥",
        system_instruction=SYSTEM_INSTRUCTION_MOTIVATION,
        virality_guidelines=MOTIVATION_VIRALITY_GUIDELINES,
        default_voice="Fenrir",
        default_audio_mood="Dark Phonk / Brazilian Bass / Stoic Strings",
        soundtrack_genre="phonk",
        recommended_3d_providers=["poly_haven", "pixabay_3d", "sketchfab"],
        sub_presets=["stoic_discipline", "dark_psychology", "warrior_mindset", "mountain_peak"],
        categories=[
            "Stoic Mindset & Discipline",
            "Unstoppable Wild Motivation",
            "Dark Psychology & Quiet Moves",
            "High Finance & Generational Empire",
            "Ocean Storm & Inner Resilience",
        ],
        example_prompts=[
            "The 4:00 AM Rule of Unstoppable Men",
            "Why Most Men Die at 25 and Get Buried at 75",
            "Silence is Your Deadliest Weapon",
            "Build in Silence, Shock Them with Success",
        ],
        caption_preset="sub-hormozi",
        speech_rate=2.4,
    ),
    "roblox_story": GenreDefinition(
        id="roblox_story",
        label="Roblox Storytelling",
        icon="🧱",
        system_instruction=SYSTEM_INSTRUCTION_ROBLOX_STORY,
        virality_guidelines=ROBLOX_VIRALITY_GUIDELINES,
        default_voice="Puck",
        default_audio_mood="Suspense Mystery Piano / Gaming Phonk",
        soundtrack_genre="gaming",
        recommended_3d_providers=["roblox_creator_store", "sloyd_ai", "sketchfab"],
        sub_presets=["creepypasta", "brookhaven_mystery", "trading_drama", "obby_challenge", "blox_fruits"],
        categories=[
            "Roblox Creepypasta & Myths",
            "Roblox POV Drama & Betrayal",
            "Impossible 999-Stage Obby Challenge",
            "Blox Fruits Anime Battles",
            "Murder Mystery 2 Mindgames",
        ],
        example_prompts=[
            "Never Play Brookhaven at 3:00 AM Alone...",
            "The Day My Best Friend Scammed My Dream Pet in Adopt Me",
            "I Survived the World's Most Impossible 999-Stage Obby",
            "He Laughed at My Noob Avatar in Blox Fruits Until...",
            "The Legend of the Abandoned Roblox Server",
        ],
        caption_preset="sub-beast",
        speech_rate=2.6,
    ),
    "odd_one_out": GenreDefinition(
        id="odd_one_out",
        label="Find the Odd One Out",
        icon="🎯",
        system_instruction=SYSTEM_INSTRUCTION_ODD_ONE_OUT,
        virality_guidelines=ODD_ONE_OUT_VIRALITY_GUIDELINES,
        default_voice="Aoede",
        default_audio_mood="Ticking Countdown & Synth Pulse",
        soundtrack_genre="suspense_countdown",
        recommended_3d_providers=["roblox_creator_store", "poly_haven", "sketchfab", "sloyd_ai"],
        sub_presets=["emoji_puzzle", "roblox_avatar_difference", "iq_eyes_test", "real_vs_fake"],
        categories=[
            "Emoji & Symbol Odd One Out",
            "Roblox Avatar Spot the Difference",
            "Optical Illusion & IQ Test",
            "Real vs Fake 3D Object",
            "5-Second Impossible Eyes Test",
        ],
        example_prompts=[
            "Find the Fake Roblox Avatar in 5 Seconds!",
            "Only 1% Can Spot the Odd Emoji Before the Buzzer",
            "Level 1 Easy, Level 2 Hard, Level 3 Impossible!",
            "Spot the Difference: Which 3D Item is Glitched?",
            "Can You Find the Odd One Out in 5 Seconds?",
        ],
        caption_preset="sub-neon",
        speech_rate=2.5,
    ),
}


def get_genre_definition(genre_id: Optional[str]) -> GenreDefinition:
    """Retrieves genre definition with graceful fallback to motivation."""
    normalized = (genre_id or "motivation").strip().lower()
    return GENRE_REGISTRY.get(normalized, GENRE_REGISTRY["motivation"])


def list_available_genres() -> List[Dict[str, Any]]:
    """Lists metadata for all registered genres for discovery."""
    return [
        {
            "id": g.id,
            "label": g.label,
            "icon": g.icon,
            "defaultVoice": g.default_voice,
            "defaultAudioMood": g.default_audio_mood,
            "recommended3DProviders": g.recommended_3d_providers,
            "subPresets": g.sub_presets,
            "categories": g.categories,
            "examplePrompts": g.example_prompts,
            "captionPreset": g.caption_preset,
        }
        for g in GENRE_REGISTRY.values()
    ]

