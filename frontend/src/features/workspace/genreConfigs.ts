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

export interface SampleStoryPrompt {
  title: string;
  badge: string;
  prompt: string;
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
  default3DEngine: 'blender_hybrid' | 'blender_full' | 'motion_loop' | 'webgl';
  default3DProvider: 'roblox_creator_store' | 'poly_haven' | 'sketchfab' | 'sloyd_ai' | 'pixabay_3d';
  categories: GenreCategoryOption[];
  quickPromptChips: string[];
  sampleStoryPrompts: SampleStoryPrompt[];
  tones: GenreToneOption[];
}

export interface RenderEngine3DOption {
  value: 'blender_hybrid' | 'blender_full' | 'motion_loop' | 'webgl';
  label: string;
  badge: string;
  description: string;
}

export const RENDER_3D_ENGINES: RenderEngine3DOption[] = [
  {
    value: 'blender_hybrid',
    label: '⚡ Blender 3D Hybrid (~4-6s)',
    badge: 'Recommended • Fast',
    description: 'Blender 5.2 hero render + 2.5D multi-plane camera parallax & kinetic subtitles',
  },
  {
    value: 'blender_full',
    label: '🎨 Blender Full CGI Sequence',
    badge: 'Blender 5.2 Workbench',
    description: 'Headless frame-by-frame 3D animation render stitched with FFmpeg',
  },
  {
    value: 'motion_loop',
    label: '🔁 Motion Loops 3D Engine',
    badge: 'Seamless 60fps Loop',
    description: 'Ultra-fast (~2-3s) 3D motion loop generator with kinetic camera choreography',
  },
  {
    value: 'webgl',
    label: '🌐 WebGL 60 FPS (In-Browser GPU)',
    badge: 'Three.js Viewport',
    description: 'Client-side interactive Three.js 3D viewport normalized to broadcast MP4',
  },
];

export interface AssetProvider3DOption {
  value: 'roblox_creator_store' | 'sloyd_ai' | 'sketchfab' | 'poly_pizza' | 'poly_haven';
  label: string;
  badge: string;
  description: string;
}

export const ASSET_3D_PROVIDERS: AssetProvider3DOption[] = [
  {
    value: 'roblox_creator_store',
    label: '🧱 Roblox Creator Store',
    badge: 'Official Avatars & Assets',
    description: 'Roblox avatars, Brookhaven houses, Blox Fruits swords, accessories, game obbies',
  },
  {
    value: 'sloyd_ai',
    label: '⚡ Sloyd AI (Procedural Low-Poly)',
    badge: 'Instant Game 3D',
    description: 'Fast generative low-poly assets, stylized game weapons & vehicles',
  },
  {
    value: 'sketchfab',
    label: '🎨 Sketchfab (Free CC)',
    badge: 'Millions of Models',
    description: 'Massive library of community and professional 3D meshes and characters',
  },
  {
    value: 'poly_pizza',
    label: '🎮 Poly Pizza (Low-Poly)',
    badge: 'Free CC0',
    description: 'Vibrant low-poly game assets and everyday props',
  },
  {
    value: 'poly_haven',
    label: '🏛️ Poly Haven (CC0 Photoreal)',
    badge: 'Photorealistic CC0',
    description: '100% free CC0 photorealistic statues, stone busts & cinematic environments',
  },
];

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
    default3DEngine: 'blender_hybrid',
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
    sampleStoryPrompts: [
      {
        title: '⛰️ 4:00 AM Silent Rule',
        badge: 'Stoic Discipline',
        prompt: 'Focus on waking up at 4:00 AM in pitch black silence while the rest of the world is asleep. Speak with raw, stoic discipline. Explain that talking about your goals destroys your dopamine, and why 6 months of silent compounding gym work and study will shock everyone who ever doubted you. End with Marcus Aurelius wisdom.',
      },
      {
        title: '🤫 Silence is Deadliest Weapon',
        badge: 'Dark Moves',
        prompt: 'A lion never explains his hunting strategy to the sheep. Frame the monologue around cutting out toxic friends, deleting distracting apps, and letting results speak instead of words. Use hard-hitting staccato pauses, deep bass drops, and faceless mountain visuals to create an intense feeling of unstoppable determination.',
      },
      {
        title: '🛡️ Why Men Die at 25',
        badge: 'Urgent Wake-Up',
        prompt: 'Explain the psychological tragedy of dying at 25 and not getting buried until 75. Break down how modern comfort, endless scrolling, and settling for mediocrity slowly kills ambition. Deliver a high-retention psychological pattern interrupt demanding the viewer wake up and take control of their destiny today.',
      },
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
    default3DEngine: 'blender_hybrid',
    default3DProvider: 'roblox_creator_store',
    categories: [
      { value: 'Surreal Lore & Sky Myths (Volze Style)', label: '🕳️ Surreal Lore & Sky Myths (Volze Style)' },
      { value: 'Roblox Creepypasta & Myths', label: '👻 Roblox Creepypasta & Myths' },
      { value: 'Roblox POV Drama & Betrayal', label: '🎭 Roblox POV Drama & Betrayal' },
      { value: 'Impossible 999-Stage Obby Challenge', label: '🏃 Impossible 999-Stage Obby Challenge' },
      { value: 'Blox Fruits Anime Battles', label: '⚔️ Blox Fruits Anime Battles' },
      { value: 'Murder Mystery 2 Mindgames', label: '🕵️ Murder Mystery 2 Mindgames' },
    ],
    quickPromptChips: [
      'Every 10 Years, The Sky Gives Back...',
      'Never Play Brookhaven at 3:00 AM Alone...',
      'The Day Gravity Flipped for 60 Seconds...',
      'Every 10 Years, The Ocean Splits Open...',
      'The Day My Best Friend Scammed My Dream Pet in Adopt Me',
      'The Legend of the Abandoned Roblox Server',
    ],
    sampleStoryPrompts: [
      {
        title: '🕳️ Every 10 Years, The Sky Gives Back',
        badge: 'Volze Viral Lore',
        prompt: 'Every ten years, a glowing black hole opens in the sky above our town, and it rains down everything humanity has lost over the past decade. Car keys, wedding rings, old letters, and childhood memories tumble down from the clouds like a cosmic storm. But there is one rule everyone whispers: whatever hits the ground and isn\'t claimed before sunset gets sucked back into the void forever. Today, I looked up and saw a handwritten letter falling straight toward me...',
      },
      {
        title: '👻 Brookhaven 3AM Ghost',
        badge: 'Creepypasta',
        prompt: 'My friend Alex and I joined an empty Brookhaven server at 3:00 AM. We saw a glitching avatar named "Null" standing outside the abandoned hospital window with glowing red eyes. When we tried to reset our characters, the escape menu locked and our chat filled with red letters spelling my real name. We hid inside the secret basement under the church, but then the footsteps started getting closer...',
      },
      {
        title: '⚔️ Blox Fruits Betrayal',
        badge: 'Anime Revenge',
        prompt: 'I traded my legendary Leopard fruit to someone claiming to be my best friend in the second sea. The moment the trade timer reached zero, he blocked me on Discord, laughed in server chat, and left the game. 48 hours later, I rolled a permanent Kitsune fruit, mastered Godhuman, and tracked his crew down in the third sea to challenge him to a 1v1 duel in front of the whole server.',
      },
      {
        title: '🏃 Impossible 999-Stage Obby',
        badge: 'High Stakes Run',
        prompt: 'I was on stage 99 of the world\'s hardest Roblox difficulty chart obby with only 3 lives remaining. No one had beaten this stage in over 4 years. With 15 seconds left before server maintenance, I had to execute the infamous backwards wraparound ladder flick over a pool of neon lava while my hands were shaking. Here is how I pulled off the impossible jump...',
      },
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
    default3DEngine: 'blender_hybrid',
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
    sampleStoryPrompts: [
      {
        title: '🎯 Spot the Glitched Blade',
        badge: '5s Challenge',
        prompt: 'Show four Roblox avatars lined up side by side with a prominent 5-second ticking countdown timer on the screen. Avatars 1, 2, and 4 are holding glowing blue katanas, but Avatar 3 has a glitched red dark blade with an inverted aura. Start with a viral voiceover challenge: "Only 1% of Roblox players can spot the fake in five seconds!" Build intense ticking audio suspense, then freeze-frame flash highlight on Avatar 3 on the buzzer.',
      },
      {
        title: '🔎 Fake Brookhaven House',
        badge: 'Visual Mystery',
        prompt: 'Present four Brookhaven houses in a 2x2 grid. Three of the houses have normal white doors and streetlights, but house number two has a boarded-up window with a mysterious silhouette lurking inside. 5-second ticking countdown clock with heartbeats. On zero, play a loud victory chime and zoom right into the secret window.',
      },
      {
        title: '🧩 Valkyrie Feather Imposter',
        badge: 'IQ Test',
        prompt: 'Display four golden Roblox Valkyrie helms rotating in 3D. Three are authentic high-tier valks, but the fourth has a broken horn feather on the left side. Challenge the viewer with quick visual deduction, count down from 5 to 1 with staccato cues, and reveal the exact difference before time runs out.',
      },
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

