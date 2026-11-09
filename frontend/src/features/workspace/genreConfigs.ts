/**
 * frontend/src/features/workspace/genreConfigs.ts
 * Declarative Content Genre Registry for ApexMind Studio.
 *
 * Designed for future-proof scalability: adding any future genre
 * (e.g., Minecraft, Reddit Stories, True Crime, Anime Recaps)
 * only requires appending an entry to `GENRE_CONFIGS`.
 */

export interface GenreCategoryOption {
  value: string;
  label: string;
}

export interface GenreToneOption {
  value: string;
  label: string;
  desc: string;
}

export interface GenreConfig {
  id: string;
  label: string;
  icon: string;
  badgeText: string;
  tagline: string;
  accentColor: string;
  defaultTone: string;
  defaultVoice: string;
  defaultSubtitlePreset: string;
  default3DProvider: 'roblox_creator_store' | 'poly_haven' | 'sketchfab' | 'sloyd_ai' | 'pixabay_3d';
  categories: GenreCategoryOption[];
  quickPromptChips: string[];
  tones: GenreToneOption[];
}

export const GENRE_CONFIGS: Record<string, GenreConfig> = {
  motivation: {
    id: 'motivation',
    label: 'Motivation & Mindset',
    icon: '🔥',
    badgeText: 'Stoic & Discipline',
    tagline: 'Deep psychological pattern interrupts, staccato cadence, and faceless 3D cinematic CGI.',
    accentColor: '#F59E0B',
    defaultTone: 'Aggressive Discipline',
    defaultVoice: 'Fenrir',
    defaultSubtitlePreset: 'sub-hormozi',
    default3DProvider: 'poly_haven',
    categories: [
      { value: 'Stoic Mindset & Discipline', label: '⛰️ Stoic Mindset & Mountain Peak' },
      { value: 'Unstoppable Wild Motivation', label: '⚡ Unstoppable Wild Motivation' },
      { value: 'Dark Psychology & Quiet Moves', label: '🌑 Dark Psychology & Quiet Moves' },
      { value: 'High Finance & Generational Empire', label: '💎 High Finance & Generational Empire' },
      { value: 'Ocean Storm & Inner Resilience', label: '🌊 Ocean Storm & Inner Resilience' },
    ],
    quickPromptChips: [
      'The 4:00 AM Rule of Unstoppable Men',
      'Why Most Men Die at 25 and Get Buried at 75',
      'Silence is Your Deadliest Weapon',
      'Build in Silence, Shock Them with Success',
    ],
    tones: [
      { value: 'Aggressive Discipline', label: '⚡ Aggressive Discipline', desc: 'Raw, urgent, unforgiving staccato cadence.' },
      { value: 'Deep Philosophical', label: '🏛️ Deep Philosophical', desc: 'Marcus Aurelius stoic meditation style.' },
      { value: 'Dark Psychology', label: '🌑 Dark Psychology', desc: 'Whispered, quiet, high-status power moves.' },
      { value: 'Triumphant Empire', label: '👑 Triumphant Empire', desc: 'Inspiring, orchestral, billionaire compound growth.' },
    ],
  },

  roblox_story: {
    id: 'roblox_story',
    label: 'Roblox Storytelling',
    icon: '🧱',
    badgeText: 'Viral Gaming Drama',
    tagline: 'First-person Roblox creepypastas, Brookhaven mysteries, trading scam drama, and impossible obbies.',
    accentColor: '#06B6D4',
    defaultTone: 'Cinematic Storyteller',
    defaultVoice: 'Puck',
    defaultSubtitlePreset: 'sub-beast',
    default3DProvider: 'roblox_creator_store',
    categories: [
      { value: 'Roblox Creepypasta & Myths', label: '👻 Roblox Creepypasta & Myths' },
      { value: 'Roblox POV Drama & Betrayal', label: '🎭 Roblox POV Drama & Betrayal' },
      { value: 'Impossible 999-Stage Obby Challenge', label: '🏃 Impossible 999-Stage Obby Challenge' },
      { value: 'Blox Fruits Anime Battles', label: '⚔️ Blox Fruits Anime Battles' },
      { value: 'Murder Mystery 2 Mindgames', label: '🕵️ Murder Mystery 2 Mindgames' },
    ],
    quickPromptChips: [
      'Never Play Brookhaven at 3:00 AM Alone...',
      'The Day My Best Friend Scammed My Dream Pet in Adopt Me',
      'I Survived the World\'s Most Impossible 999-Stage Obby',
      'He Laughed at My Noob Avatar in Blox Fruits Until...',
      'The Legend of the Abandoned Roblox Server',
    ],
    tones: [
      { value: 'Cinematic Storyteller', label: '🎬 Cinematic Storyteller', desc: 'Suspenseful, dramatic narrative pacing with SFX.' },
      { value: 'Creepypasta Suspense', label: '👻 Creepypasta Suspense', desc: 'Eerie, whispering 3 AM Brookhaven mystery.' },
      { value: 'High-Energy Gamer', label: '🎮 High-Energy Gamer', desc: 'Fast, animated gaming commentary with obby cuts.' },
      { value: 'Emotional Betrayal', label: '💔 Emotional Betrayal', desc: 'First-person trading drama and ultimate revenge.' },
    ],
  },

  odd_one_out: {
    id: 'odd_one_out',
    label: 'Find the Odd One Out',
    icon: '🎯',
    badgeText: '5s IQ Challenge',
    tagline: 'Gamified visual perception tests, 5-second ticking countdowns, and spot-the-difference reveals.',
    accentColor: '#EC4899',
    defaultTone: 'High-Energy Quiz Host',
    defaultVoice: 'Aoede',
    defaultSubtitlePreset: 'sub-neon',
    default3DProvider: 'roblox_creator_store',
    categories: [
      { value: 'Emoji & Symbol Odd One Out', label: '🧩 Emoji & Symbol Odd One Out' },
      { value: 'Roblox Avatar Spot the Difference', label: '🧱 Roblox Avatar Spot the Difference' },
      { value: 'Optical Illusion & IQ Test', label: '🧠 Optical Illusion & IQ Test' },
      { value: 'Real vs Fake 3D Object', label: '🔍 Real vs Fake 3D Object' },
      { value: '5-Second Impossible Eyes Test', label: '⏱️ 5-Second Impossible Eyes Test' },
    ],
    quickPromptChips: [
      'Find the Fake Roblox Avatar in 5 Seconds!',
      'Only 1% Can Spot the Odd Emoji Before the Buzzer',
      'Level 1 Easy, Level 2 Hard, Level 3 Impossible!',
      'Spot the Difference: Which 3D Item is Glitched?',
      'Can You Find the Odd One Out in 5 Seconds?',
    ],
    tones: [
      { value: 'High-Energy Quiz Host', label: '🎙️ High-Energy Quiz Host', desc: 'Fast-paced, countdown ticking challenge.' },
      { value: 'Perception IQ Challenger', label: '🧠 Perception IQ Challenger', desc: 'Ego-triggering competitive brain teaser.' },
      { value: 'Arcade Suspense', label: '🕹️ Arcade Suspense', desc: 'Intense heartbeat countdowns and buzzer reveals.' },
    ],
  },
};

export const DEFAULT_GENRE_ID = 'motivation';

export function getGenreConfig(genreId?: string): GenreConfig {
  const key = (genreId || DEFAULT_GENRE_ID).toLowerCase().trim();
  return GENRE_CONFIGS[key] || GENRE_CONFIGS[DEFAULT_GENRE_ID];
}

export function getAllGenreConfigs(): GenreConfig[] {
  return Object.values(GENRE_CONFIGS);
}

