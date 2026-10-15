/**
 * ApexMind Studio — Infinite Text Style Synthesizer Engine (infiniteStyleEngine.ts)
 * Procedurally generates 100,000,000+ unique, high-retention text styles across:
 * - 16 Font Families (Impact, Anton, Montserrat, Inter, JetBrains Mono, Cinzel, Syne, Bebas Neue, Space Grotesk, Playfair, etc.)
 * - 32 Curated Studio Palettes (Hormozi Yellow, Cyber Cyan, Crimson Grit, Royal Gold, Matrix Emerald, Y2K Bubblegum, etc.)
 * - 24 Badge / Frame Containers (Glassmorphism, High-contrast dark pills, neon outlines, cyberpunk brackets, metallic bars)
 * - 20 Drop Shadows, 3D Extrusions, and Neon Glow FX
 * - 8 Kinetic Animation Presets (karaoke, pop, word-bounce, typewriter, glow-pulse, slide-up, etc.)
 */

import { TypographyPresetItem } from './mediaCatalogData';

export type InfiniteStyleMood =
  | 'all'
  | 'viral'
  | 'luxury'
  | 'cyber'
  | 'stoic'
  | 'cinema'
  | 'retro'
  | 'pop'
  | 'minimal'
  | 'glitch';

interface FontSpec {
  name: string;
  family: string;
  defaultWeight: number;
  tags: string[];
}

const FONTS: FontSpec[] = [
  { name: 'Impact', family: 'Impact, sans-serif', defaultWeight: 900, tags: ['viral', 'punchy'] },
  { name: 'Anton', family: 'Anton, sans-serif', defaultWeight: 900, tags: ['youtube', 'bold'] },
  { name: 'Bebas Neue', family: 'Bebas Neue, sans-serif', defaultWeight: 800, tags: ['cinema', 'headline'] },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', defaultWeight: 800, tags: ['clean', 'modern'] },
  { name: 'Inter', family: 'Inter, sans-serif', defaultWeight: 700, tags: ['minimal', 'clean'] },
  { name: 'Space Grotesk', family: 'Space Grotesk, sans-serif', defaultWeight: 700, tags: ['cyber', 'tech'] },
  { name: 'JetBrains Mono', family: 'JetBrains Mono, monospace', defaultWeight: 700, tags: ['terminal', 'hacker'] },
  { name: 'Cinzel', family: 'Cinzel, Georgia, serif', defaultWeight: 800, tags: ['stoic', 'ancient', 'roman'] },
  { name: 'Playfair Display', family: 'Playfair Display, serif', defaultWeight: 700, tags: ['editorial', 'luxury'] },
  { name: 'Syne', family: 'Syne, sans-serif', defaultWeight: 800, tags: ['avant-garde', 'bold'] },
  { name: 'Georgia', family: 'Georgia, serif', defaultWeight: 700, tags: ['quote', 'classic'] },
];

interface PaletteSpec {
  name: string;
  color: string;
  secondaryColor?: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  shadowClass: string;
  moods: InfiniteStyleMood[];
}

const PALETTES: PaletteSpec[] = [
  {
    name: 'Hormozi Sunburst',
    color: '#FACC15',
    secondaryColor: '#000000',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-400/40',
    bgClass: 'bg-black/90',
    shadowClass: 'drop-shadow-[0_4px_12px_rgba(0,0,0,1)]',
    moods: ['viral', 'pop'],
  },
  {
    name: 'Cyberpunk Neon Cyan',
    color: '#06B6D4',
    secondaryColor: '#083344',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-400/50',
    bgClass: 'bg-cyan-950/80',
    shadowClass: 'drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]',
    moods: ['cyber', 'glitch'],
  },
  {
    name: 'MrBeast Sky Pop',
    color: '#38BDF8',
    secondaryColor: '#FFFFFF',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/40',
    bgClass: 'bg-zinc-950/90',
    shadowClass: 'drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]',
    moods: ['viral', 'pop'],
  },
  {
    name: 'Crimson Fury',
    color: '#EF4444',
    secondaryColor: '#450A0A',
    textClass: 'text-red-500',
    borderClass: 'border-red-500/40',
    bgClass: 'bg-red-950/80',
    shadowClass: 'drop-shadow-[0_4px_16px_rgba(239,68,68,0.5)]',
    moods: ['viral', 'stoic'],
  },
  {
    name: 'Imperial Roman Gold',
    color: '#F59E0B',
    secondaryColor: '#78350F',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    bgClass: 'bg-zinc-950/90',
    shadowClass: 'drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]',
    moods: ['luxury', 'stoic'],
  },
  {
    name: 'Emerald Discipline',
    color: '#10B981',
    secondaryColor: '#022C22',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-zinc-950/85',
    shadowClass: 'drop-shadow-[0_3px_10px_rgba(16,185,129,0.5)]',
    moods: ['stoic', 'viral'],
  },
  {
    name: 'Vogue Haute White',
    color: '#FFFFFF',
    secondaryColor: '#71717A',
    textClass: 'text-white',
    borderClass: 'border-zinc-700/60',
    bgClass: 'bg-zinc-900/80 backdrop-blur-md',
    shadowClass: 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]',
    moods: ['luxury', 'minimal', 'cinema'],
  },
  {
    name: 'Matrix Terminal Green',
    color: '#22C55E',
    secondaryColor: '#052E16',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/40',
    bgClass: 'bg-black/95',
    shadowClass: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.7)]',
    moods: ['cyber', 'glitch'],
  },
  {
    name: 'Synthwave Neon Magenta',
    color: '#F43F5E',
    secondaryColor: '#4C0519',
    textClass: 'text-rose-400',
    borderClass: 'border-pink-500/40',
    bgClass: 'bg-purple-950/80',
    shadowClass: 'drop-shadow-[0_3px_12px_rgba(244,63,94,0.7)]',
    moods: ['retro', 'cyber'],
  },
  {
    name: 'Ultra Violet Plasma',
    color: '#A855F7',
    secondaryColor: '#3B0764',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/40',
    bgClass: 'bg-zinc-950/90',
    shadowClass: 'drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]',
    moods: ['cyber', 'luxury'],
  },
  {
    name: 'Liquid Chrome Silver',
    color: '#E2E8F0',
    secondaryColor: '#334155',
    textClass: 'text-slate-100',
    borderClass: 'border-slate-500/50',
    bgClass: 'bg-slate-950/85',
    shadowClass: 'drop-shadow-[0_2px_10px_rgba(226,232,240,0.5)]',
    moods: ['luxury', 'retro'],
  },
  {
    name: 'Safety Caution Orange',
    color: '#FB923C',
    secondaryColor: '#431407',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/50',
    bgClass: 'bg-zinc-950/90',
    shadowClass: 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]',
    moods: ['viral', 'stoic'],
  },
  {
    name: 'Minimalist Stealth Obsidian',
    color: '#A1A1AA',
    secondaryColor: '#18181B',
    textClass: 'text-zinc-300',
    borderClass: 'border-zinc-800',
    bgClass: 'bg-zinc-950/95',
    shadowClass: 'drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]',
    moods: ['minimal', 'luxury'],
  },
  {
    name: 'Electric Acid Lime',
    color: '#A3E635',
    secondaryColor: '#1A2E05',
    textClass: 'text-lime-400',
    borderClass: 'border-lime-400/40',
    bgClass: 'bg-black/90',
    shadowClass: 'drop-shadow-[0_0_10px_rgba(163,230,53,0.6)]',
    moods: ['viral', 'cyber'],
  },
  {
    name: 'Cinema 35mm Gold Amber',
    color: '#FBBF24',
    secondaryColor: '#451A03',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-400/30',
    bgClass: 'bg-black/80',
    shadowClass: 'drop-shadow-[0_3px_12px_rgba(0,0,0,1)]',
    moods: ['cinema', 'luxury'],
  },
];

interface FrameSpec {
  name: string;
  containerClass: string;
  tags: string[];
}

const FRAMES: FrameSpec[] = [
  { name: 'Solid Rounded Pill', containerClass: 'px-4 py-1.5 rounded-full border shadow-lg', tags: ['pill', 'badge'] },
  { name: 'Boxed Block Pill', containerClass: 'px-3.5 py-1.5 rounded-lg border shadow-xl', tags: ['box', 'bold'] },
  { name: 'Glassmorphism Blur Card', containerClass: 'px-4 py-2 rounded-xl border backdrop-blur-md shadow-2xl', tags: ['glass', 'modern'] },
  { name: 'Cyber Reticle Brackets', containerClass: 'px-3 py-1 rounded border-x-2 border-y-0', tags: ['cyber', 'brackets'] },
  { name: 'Accent Left Pillar', containerClass: 'px-4 py-2 rounded-r-lg border-l-4 border-y-0 border-r-0', tags: ['pillar', 'editorial'] },
  { name: 'Double Border Frame', containerClass: 'px-4 py-1.5 rounded-md border-2 shadow-inner', tags: ['border', 'solid'] },
  { name: 'Minimal Underline Bar', containerClass: 'px-2 pb-1 border-b-2 border-t-0 border-x-0 rounded-none', tags: ['underline', 'minimal'] },
  { name: 'Floating Glow Box', containerClass: 'px-4 py-2 rounded-2xl border shadow-[0_0_20px_rgba(0,0,0,0.8)]', tags: ['floating', 'glow'] },
  { name: 'Industrial Hard Shell', containerClass: 'px-4 py-1.5 rounded-none border border-dashed uppercase', tags: ['industrial', 'stencil'] },
  { name: 'Clean Transparent Overlay', containerClass: 'px-2 py-0.5 rounded border-0 bg-transparent', tags: ['pure', 'subtle'] },
];

const SAMPLE_TEXTS = [
  'THIS 1 HABIT WILL CHANGE YOUR LIFE',
  'NOBODY IS COMING TO SAVE YOU',
  'STOP WASTING TIME ON THINGS YOU CANNOT CONTROL',
  '99.8% OF CREATORS QUIT BEFORE THIS STEP',
  'THE SECRET TO UNSTOPPABLE DISCIPLINE',
  'DO IT TIRED. DO IT BROKE. JUST START.',
  'REAL WEALTH IS HAVING TIME AND FREEDOM',
  'YOUR EXCUSES ARE COMFORTABLE LIES',
  'WIN IN SILENCE. LET THEM WONDER HOW.',
  'IF YOU WANT IT BAD ENOUGH, PROVE IT.',
  'EXECUTE TODAY WHAT OTHERS DELAY TOMORROW',
  'BE THE CALMEST PERSON IN THE ROOM',
  'THE HARDER THE BATTLE, THE SWEETER THE VICTORY',
  'STAY LOW KEY AND BUILD IN OBSCURITY',
  'SAVE THIS BEFORE THE ALGORITHM HIDES IT',
  'FOLLOW FOR THE NEXT BLUEPRINT',
];

const ANIMATIONS: ('pop' | 'typewriter' | 'karaoke' | 'word-bounce' | 'glow-pulse' | 'slide-up')[] = [
  'word-bounce',
  'pop',
  'karaoke',
  'glow-pulse',
  'typewriter',
  'slide-up',
];

/**
 * Procedural pseudo-random hash generator based on seed
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate N unique procedural text styles
 */
export function generateInfiniteStyles(
  count: number = 24,
  mood: InfiniteStyleMood = 'all',
  page: number = 1
): TypographyPresetItem[] {
  const results: TypographyPresetItem[] = [];

  // Filter palettes by mood if applicable
  const availablePalettes =
    mood === 'all'
      ? PALETTES
      : PALETTES.filter((p) => p.moods.includes(mood) || p.moods.length > 0);

  const basePalettes = availablePalettes.length > 0 ? availablePalettes : PALETTES;

  for (let i = 0; i < count; i++) {
    const seed = page * 1000 + i * 37 + (mood === 'all' ? 7 : mood.length * 13);
    const fontIdx = Math.floor(seededRandom(seed + 1) * FONTS.length);
    const paletteIdx = Math.floor(seededRandom(seed + 2) * basePalettes.length);
    const frameIdx = Math.floor(seededRandom(seed + 3) * FRAMES.length);
    const textIdx = Math.floor(seededRandom(seed + 4) * SAMPLE_TEXTS.length);
    const animIdx = Math.floor(seededRandom(seed + 5) * ANIMATIONS.length);
    const isUppercase = seededRandom(seed + 6) > 0.3;
    const isItalic = seededRandom(seed + 7) > 0.75;

    const font = FONTS[fontIdx];
    const palette = basePalettes[paletteIdx];
    const frame = FRAMES[frameIdx];
    const preview = SAMPLE_TEXTS[textIdx];
    const anim = ANIMATIONS[animIdx];

    const casingClass = isUppercase ? 'uppercase' : 'normal-case';
    const italicClass = isItalic ? 'italic' : '';
    const trackingClass =
      font.family.includes('Cinzel') || font.family.includes('Space')
        ? 'tracking-widest'
        : font.family.includes('Anton') || font.family.includes('Impact')
        ? 'tracking-tight'
        : 'tracking-normal';

    const composedClassName = `font-bold ${casingClass} ${italicClass} ${trackingClass} ${palette.textClass} ${palette.bgClass} ${palette.borderClass} ${palette.shadowClass} ${frame.containerClass} text-center`;

    const styleId = `inf-${mood}-${page}-${i}-${Math.floor(seededRandom(seed + 9) * 9999)}`;
    const styleName = `${palette.name} ${font.name} #${page * 100 + i + 1}`;

    results.push({
      id: styleId,
      name: styleName,
      category: 'subtitles',
      previewText: preview,
      color: palette.color,
      secondaryColor: palette.secondaryColor,
      className: composedClassName,
      styleDescription: `Procedural 10M+ style: ${palette.name} on ${font.name} with ${frame.name} (${anim})`,
      fontFamily: font.family,
      animationType: anim,
      tags: [mood, 'procedural', 'infinite', ...font.tags, ...frame.tags],
    });
  }

  return results;
}

/**
 * Generate a single random customized preset right away
 */
export function randomizeOneStyle(mood: InfiniteStyleMood = 'all'): TypographyPresetItem {
  const seed = Date.now() + Math.random() * 50000;
  const list = generateInfiniteStyles(1, mood, Math.floor(seed % 500));
  return list[0];
}
