/**
 * ApexMind Studio — Master Creative Media Catalog (mediaCatalogData.ts)
 * Comprehensive, production-grade dataset for all workspace sidebar panels:
 * - 70+ Typography & Subtitle Presets (Hormozi, MrBeast, Karaoke, Monospace, HUD)
 * - 250+ Visual Elements & Stickers (Viral badges, memes, progress bars, waveforms, containers)
 * - 120+ Curated 9:16 Vertical Stock Images (8 niches)
 * - 100+ Seamless 9:16 Vertical Video Loops (1080x1920)
 * - 60 Master Soundtracks (8 genres)
 * - 100 Creator Sound Effects (SFX)
 * - 24-Pad Instant Meme Soundboard (Web Audio API)
 * - 24 Cinematic Color LUT Presets
 * - 24 Video Transitions
 * - 7 Platform Safe-Zone Overlays
 * - 36 AI Visual Prompt Starters
 */

import { MASTER_TYPOGRAPHY_PRESETS } from './typographyPresetsData';

// ============================================================================
// 1. TYPOGRAPHY & SUBTITLE PRESETS
// ============================================================================

export interface TypographyPresetItem {
  id: string;
  name: string;
  category: 'subtitles' | 'hooks' | 'quotes' | 'lowerthirds' | 'cta' | 'animations';
  previewText: string;
  className: string;
  color: string;
  secondaryColor?: string;
  styleDescription: string;
  fontFamily: string;
  animationType?: 'pop' | 'typewriter' | 'karaoke' | 'word-bounce' | 'glow-pulse' | 'slide-up';
  tags: string[];
  aestheticBadges?: string[];
  aestheticScore?: number;
}

export const TYPOGRAPHY_PRESETS: TypographyPresetItem[] = MASTER_TYPOGRAPHY_PRESETS;

const _LEGACY_TYPOGRAPHY_PRESETS: TypographyPresetItem[] = [
  // --- SUBTITLES ---
  {
    id: 'sub-hormozi',
    name: 'Hormozi Viral Yellow',
    category: 'subtitles',
    previewText: 'WORK HARDER THAN EVERYONE',
    color: '#FACC15',
    secondaryColor: '#000000',
    className: 'font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] [-webkit-text-stroke:2px_#000] [paint-order:stroke_fill] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,0_4px_12px_rgba(0,0,0,0.95)]',
    styleDescription: 'Iconic Alex Hormozi high-retention subtitle with punchy black border',
    fontFamily: 'Impact, sans-serif',
    animationType: 'word-bounce',
    tags: ['hormozi', 'viral', 'subtitles', 'yellow', 'bold'],
  },
  {
    id: 'sub-mrbeast',
    name: 'MrBeast Pop Bold',
    category: 'subtitles',
    previewText: 'I GAVE AWAY $1,000,000!',
    color: '#38BDF8',
    secondaryColor: '#FFFFFF',
    className: 'font-black tracking-tighter text-sky-400 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,1)] stroke-black',
    styleDescription: 'High-energy, spring-scaled condensed punch font for YouTube pacing',
    fontFamily: 'Anton, sans-serif',
    animationType: 'pop',
    tags: ['mrbeast', 'youtube', 'pop', 'energy'],
  },
  {
    id: 'sub-karaoke-gold',
    name: 'Karaoke Word Glow',
    category: 'subtitles',
    previewText: 'FOLLOW EACH WORD AS IT SPEAKS',
    color: '#F59E0B',
    secondaryColor: '#71717A',
    className: 'font-extrabold tracking-wide text-amber-400 uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]',
    styleDescription: 'Active word illuminates gold while preceding text rests in silver',
    fontFamily: 'Montserrat, sans-serif',
    animationType: 'karaoke',
    tags: ['karaoke', 'glow', 'word-by-word', 'gold'],
  },
  {
    id: 'sub-minimal-luxury',
    name: 'Minimalist Luxury',
    category: 'subtitles',
    previewText: 'silence is the ultimate luxury',
    color: '#E5E5E5',
    className: 'font-light tracking-[0.25em] text-zinc-200 lowercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]',
    styleDescription: 'Refined ultra-wide letter spacing for aesthetic and luxury reels',
    fontFamily: 'Inter, sans-serif',
    tags: ['luxury', 'minimal', 'aesthetic', 'lowercase'],
  },
  {
    id: 'sub-neon-cyan',
    name: 'Cyber Cyan Strike',
    category: 'subtitles',
    previewText: 'SYSTEM VELOCITY ENGAGED',
    color: '#06B6D4',
    className: 'font-black tracking-wider text-cyan-400 uppercase drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)] border-b-2 border-cyan-400/60 pb-1',
    styleDescription: 'Crisp futuristic edge for tech, AI, and crypto breakdown reels',
    fontFamily: 'Space Grotesk, sans-serif',
    tags: ['cyan', 'cyber', 'tech', 'strike'],
  },
  {
    id: 'sub-crimson-grit',
    name: 'Crimson Aggression',
    category: 'subtitles',
    previewText: 'NOBODY CARES. OUTWORK THEM.',
    color: '#EF4444',
    className: 'font-black italic tracking-tight text-red-500 uppercase drop-shadow-[0_4px_14px_rgba(0,0,0,1)]',
    styleDescription: 'Intense slanted red font for gym motivation and high-octane focus',
    fontFamily: 'Impact, sans-serif',
    tags: ['red', 'gym', 'aggression', 'grit'],
  },
  {
    id: 'sub-vox-serif',
    name: 'Vox Documentary Serif',
    category: 'subtitles',
    previewText: 'How The World Actually Works',
    color: '#F4F4F5',
    className: 'font-serif font-medium tracking-normal text-zinc-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]',
    styleDescription: 'Prestigious journalistic serif for deep dives and storytelling',
    fontFamily: 'Playfair Display, serif',
    tags: ['vox', 'documentary', 'serif', 'story'],
  },
  {
    id: 'sub-hacker-term',
    name: 'Hacker Monospace Terminal',
    category: 'subtitles',
    previewText: '> DECRYPTING PROTOCOL 0x7F...',
    color: '#10B981',
    className: 'font-mono font-semibold tracking-tight text-emerald-400 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] bg-zinc-950/90 px-2 py-0.5 rounded border border-emerald-500/30',
    styleDescription: 'Green code terminal font with blinking underscore cursor',
    fontFamily: 'JetBrains Mono, monospace',
    animationType: 'typewriter',
    tags: ['hacker', 'monospace', 'terminal', 'code'],
  },
  {
    id: 'sub-cyber-bracket',
    name: 'Cyber HUD Brackets',
    category: 'subtitles',
    previewText: '[TARGET ACQUIRED: RELENTLESS]',
    color: '#3B82F6',
    className: 'font-mono font-bold tracking-widest text-blue-400 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,1)]',
    styleDescription: 'Targeting reticle brackets for military and robotic aesthetics',
    fontFamily: 'Space Grotesk, sans-serif',
    tags: ['hud', 'brackets', 'target', 'military'],
  },
  {
    id: 'sub-cinzel-gold',
    name: 'Stoic Roman Gold',
    category: 'subtitles',
    previewText: 'FORGE YOUR OWN DESTINY',
    color: '#D97706',
    className: 'font-serif font-bold tracking-widest text-amber-500 uppercase drop-shadow-[0_3px_10px_rgba(0,0,0,1)] border-y border-amber-500/30 py-1',
    styleDescription: 'Imperial Roman serif for Marcus Aurelius and philosophy videos',
    fontFamily: 'Cinzel, Georgia, serif',
    tags: ['stoic', 'roman', 'gold', 'cinzel'],
  },
  {
    id: 'sub-auto-emoji',
    name: 'Auto-Emoji Reaction',
    category: 'subtitles',
    previewText: 'THIS 1 HABIT 🧠 PRINTS CASH 💰',
    color: '#FFFFFF',
    className: 'font-black tracking-tight text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)]',
    styleDescription: 'Dynamic text highlighted with contextual emoji stamps',
    fontFamily: 'Inter, sans-serif',
    tags: ['emoji', 'reaction', 'contextual', 'viral'],
  },
  {
    id: 'sub-comic-pop',
    name: 'Comic Slanted Pop',
    category: 'subtitles',
    previewText: 'WAIT UNTIL THE END!!',
    color: '#F43F5E',
    className: 'font-black italic tracking-wide text-rose-500 uppercase drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]',
    styleDescription: 'Playful pop-art comic slant with bold offset drop shadow',
    fontFamily: 'Impact, sans-serif',
    tags: ['comic', 'pop', 'slanted', 'shadow'],
  },
  {
    id: 'sub-emerald-discipline',
    name: 'Emerald Discipline',
    category: 'subtitles',
    previewText: 'CONSISTENCY BEATS TALENT',
    color: '#10B981',
    className: 'font-black tracking-tight text-emerald-400 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Deep emerald green for high-agency, habit building reels',
    fontFamily: 'Montserrat, sans-serif',
    tags: ['emerald', 'discipline', 'habits'],
  },
  {
    id: 'sub-dual-speaker',
    name: 'Dual Speaker Podcast',
    category: 'subtitles',
    previewText: 'Host: Explain that. Guest: Gladly.',
    color: '#60A5FA',
    secondaryColor: '#F59E0B',
    className: 'font-bold tracking-normal text-blue-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Two-tone dialogue styling for interviews and podcast snippets',
    fontFamily: 'Inter, sans-serif',
    tags: ['podcast', 'interview', 'dual-speaker', 'dialogue'],
  },
  {
    id: 'sub-lofi-reflect',
    name: 'Lo-Fi Ambient Whisper',
    category: 'subtitles',
    previewText: 'take a deep breath and let it all go',
    color: '#A1A1AA',
    className: 'font-normal tracking-wide text-zinc-400 italic lowercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]',
    styleDescription: 'Soft atmospheric typography for bedtime and mindfulness audio',
    fontFamily: 'Inter, sans-serif',
    tags: ['lofi', 'whisper', 'ambient', 'mindfulness'],
  },
  {
    id: 'sub-retro-chrome',
    name: 'Retro 80s Synth Chrome',
    category: 'subtitles',
    previewText: 'MIDNIGHT DRIVE IN MIAMI',
    color: '#E0E7FF',
    className: 'font-black italic tracking-wider text-indigo-200 uppercase drop-shadow-[0_3px_12px_rgba(99,102,241,0.8)] border-b border-pink-500/50',
    styleDescription: 'Glossy metallic chrome with neon magenta reflection',
    fontFamily: 'Montserrat, sans-serif',
    tags: ['synthwave', 'chrome', 'retro', '80s'],
  },

  // --- HOOKS ---
  {
    id: 'hook-curiosity',
    name: 'Curiosity Gap Banner',
    category: 'hooks',
    previewText: 'THE 1 TRUTH NOBODY TELLS YOU',
    color: '#FACC15',
    className: 'font-black tracking-tight text-yellow-400 uppercase bg-zinc-950/90 px-4 py-2 rounded-lg border border-yellow-400/40 text-center shadow-2xl',
    styleDescription: 'Immediate hook box designed to stop scrolling in first 1.5 seconds',
    fontFamily: 'Impact, sans-serif',
    tags: ['hook', 'curiosity', 'retention', 'banner'],
  },
  {
    id: 'hook-stat-counter',
    name: 'Stat Counter Hook',
    category: 'hooks',
    previewText: '99.4% OF PEOPLE FAIL HERE',
    color: '#EF4444',
    className: 'font-black tracking-tighter text-red-500 uppercase bg-red-950/40 px-4 py-2 rounded-lg border border-red-500/30 text-center',
    styleDescription: 'Shock stat framing creating instant cognitive tension',
    fontFamily: 'Anton, sans-serif',
    tags: ['stat', 'percent', 'tension', 'hook'],
  },
  {
    id: 'hook-urgent-warning',
    name: 'Urgent Warning Pill',
    category: 'hooks',
    previewText: '🚨 STOP DOING THIS IN 2026',
    color: '#FFFFFF',
    className: 'font-extrabold tracking-wide text-white uppercase bg-red-600 px-4 py-1.5 rounded-full shadow-lg text-center',
    styleDescription: 'Urgent red alert badge signaling crucial change',
    fontFamily: 'Inter, sans-serif',
    tags: ['alert', 'warning', 'stop', 'urgent'],
  },
  {
    id: 'hook-phase-step',
    name: 'Phase Identifier Box',
    category: 'hooks',
    previewText: 'PHASE 01: THE AWAKENING',
    color: '#3B82F6',
    className: 'font-mono font-bold tracking-widest text-blue-400 uppercase bg-blue-950/50 px-5 py-2.5 rounded-xl border border-blue-500/40',
    styleDescription: 'Numbered chapter badge structuring multi-part frameworks',
    fontFamily: 'Space Grotesk, sans-serif',
    tags: ['phase', 'step', 'chapter', 'framework'],
  },
  {
    id: 'hook-rule-id',
    name: 'Rule Number Hook',
    category: 'hooks',
    previewText: 'RULE #4: NEVER EXPLAIN YOURSELF',
    color: '#F59E0B',
    className: 'font-serif font-black tracking-wide text-amber-400 uppercase bg-zinc-900/90 px-4 py-2 rounded-md border-l-4 border-amber-500',
    styleDescription: 'Commandment style header with accent left border',
    fontFamily: 'Cinzel, Georgia, serif',
    tags: ['rule', 'stoic', 'principle', 'accent'],
  },
  {
    id: 'hook-paradox',
    name: 'Paradox Curiosity Hook',
    category: 'hooks',
    previewText: 'WHY WORKING LESS MAKES YOU MORE',
    color: '#10B981',
    className: 'font-extrabold tracking-tight text-emerald-400 uppercase bg-zinc-950/80 px-4 py-2 rounded-lg border border-emerald-500/30',
    styleDescription: 'Counter-intuitive statement triggering psychological curiosity',
    fontFamily: 'Montserrat, sans-serif',
    tags: ['paradox', 'counter-intuitive', 'mindset'],
  },
  {
    id: 'hook-secret-blueprint',
    name: 'Secret Blueprint Pill',
    category: 'hooks',
    previewText: 'THE PRIVATE WEALTH FORMULA',
    color: '#E5E5E5',
    className: 'font-mono font-bold tracking-widest text-zinc-100 uppercase bg-zinc-900/90 px-4 py-1.5 rounded border border-zinc-700',
    styleDescription: 'Confidential insider aesthetic for financial intelligence',
    fontFamily: 'JetBrains Mono, monospace',
    tags: ['blueprint', 'wealth', 'insider', 'secret'],
  },
  {
    id: 'hook-high-stakes',
    name: 'High Stakes Question',
    category: 'hooks',
    previewText: 'WHAT IF EVERYTHING YOU KNEW WAS A LIE?',
    color: '#A855F7',
    className: 'font-black tracking-tight text-purple-400 uppercase bg-purple-950/40 px-4 py-2 rounded-lg border border-purple-500/30',
    styleDescription: 'Deep inquiry hook demanding immediate attention',
    fontFamily: 'Inter, sans-serif',
    tags: ['question', 'stakes', 'curiosity'],
  },

  // --- QUOTES ---
  {
    id: 'quote-steve-jobs',
    name: 'Steve Jobs Glass Card',
    category: 'quotes',
    previewText: '"Stay hungry. Stay foolish."',
    color: '#FFFFFF',
    className: 'font-sans font-medium tracking-tight text-white italic bg-zinc-900/80 backdrop-blur-md p-5 rounded-xl border border-zinc-700/50 shadow-2xl',
    styleDescription: 'Frosted glassmorphism card with balanced typography and drop shadow',
    fontFamily: 'Inter, sans-serif',
    tags: ['quote', 'steve-jobs', 'glass', 'minimal'],
  },
  {
    id: 'quote-naval-tweet',
    name: 'Naval Ravikant Tweet Box',
    category: 'quotes',
    previewText: '"Seek wealth, not money or status. Wealth is having assets that earn while you sleep."',
    color: '#E4E4E7',
    className: 'font-sans font-normal tracking-normal text-zinc-200 bg-black/90 p-4 rounded-xl border border-zinc-800 shadow-xl',
    styleDescription: 'Crisp social card layout modeled after iconic philosophical tweets',
    fontFamily: 'Inter, sans-serif',
    tags: ['quote', 'naval', 'tweet', 'wealth'],
  },
  {
    id: 'quote-stoic-stone',
    name: 'Stoic Stone Inscription',
    category: 'quotes',
    previewText: '"You have power over your mind - not outside events. Realize this, and you will find strength."',
    color: '#D4D4D8',
    className: 'font-serif font-medium tracking-wide text-zinc-300 italic bg-zinc-950/90 p-5 rounded-lg border-y border-amber-600/40 text-center',
    styleDescription: 'Engraved Roman marble aesthetic for timeless ancient wisdom',
    fontFamily: 'Cinzel, Georgia, serif',
    tags: ['stoic', 'aurelius', 'stone', 'ancient'],
  },
  {
    id: 'quote-terminal-code',
    name: 'Terminal Code Quote',
    category: 'quotes',
    previewText: '// "Talk is cheap. Show me the code." - Linus Torvalds',
    color: '#34D399',
    className: 'font-mono text-emerald-400 bg-zinc-950 p-4 rounded-lg border border-emerald-500/20 shadow-md',
    styleDescription: 'Monospace comment quote for programming and engineering reels',
    fontFamily: 'JetBrains Mono, monospace',
    tags: ['code', 'terminal', 'tech', 'quote'],
  },

  // --- LOWER THIRDS ---
  {
    id: 'lt-glass-bar',
    name: 'Modern Glass Lower Third',
    category: 'lowerthirds',
    previewText: 'ALEX VANCE | FOUNDER & CEO',
    color: '#FFFFFF',
    className: 'font-sans font-bold tracking-wider text-white text-sm bg-zinc-900/85 backdrop-blur-md px-4 py-2 rounded-r-lg border-l-4 border-blue-500 shadow-lg',
    styleDescription: 'Clean executive nameplate with blue accent identifier',
    fontFamily: 'Inter, sans-serif',
    tags: ['lowerthird', 'executive', 'glass', 'nameplate'],
  },
  {
    id: 'lt-cyber-hud',
    name: 'Cyber HUD Identifier',
    category: 'lowerthirds',
    previewText: 'ID // 089-A: NEURAL ARCHITECT',
    color: '#06B6D4',
    className: 'font-mono font-bold text-xs tracking-widest text-cyan-400 bg-zinc-950/90 px-3 py-1.5 rounded border border-cyan-500/40',
    styleDescription: 'Futuristic technical callout for sci-fi and data presentations',
    fontFamily: 'Space Grotesk, sans-serif',
    tags: ['lowerthird', 'cyber', 'hud', 'tech'],
  },
  {
    id: 'lt-social-handle',
    name: 'Social Creator Handle',
    category: 'lowerthirds',
    previewText: '@ApexMind.ai | Subscribe For More',
    color: '#A1A1AA',
    className: 'font-sans font-semibold text-xs tracking-wide text-zinc-300 bg-zinc-900/90 px-3 py-1.5 rounded-full border border-zinc-700/60 shadow',
    styleDescription: 'Subtle bottom-corner social identifier pill',
    fontFamily: 'Inter, sans-serif',
    tags: ['lowerthird', 'social', 'handle', 'subscribe'],
  },

  // --- CTA CARDS ---
  {
    id: 'cta-follow-part2',
    name: 'Follow For Part 2',
    category: 'cta',
    previewText: '👉 FOLLOW FOR PART 2',
    color: '#FACC15',
    className: 'font-black tracking-tight text-yellow-400 uppercase bg-zinc-950/95 px-5 py-2.5 rounded-xl border border-yellow-400/50 shadow-2xl text-center',
    styleDescription: 'High-conversion ending hook to drive follower retention',
    fontFamily: 'Impact, sans-serif',
    tags: ['cta', 'follow', 'part2', 'retention'],
  },
  {
    id: 'cta-save-reel',
    name: 'Save This Reel',
    category: 'cta',
    previewText: '🔖 SAVE THIS BEFORE IT GETS DELETED',
    color: '#38BDF8',
    className: 'font-extrabold tracking-wide text-sky-400 uppercase bg-sky-950/50 px-5 py-2 rounded-xl border border-sky-500/40 text-center shadow-lg',
    styleDescription: 'Algorithmic save booster maximizing Instagram & TikTok reach',
    fontFamily: 'Montserrat, sans-serif',
    tags: ['cta', 'save', 'bookmark', 'algorithm'],
  },
  {
    id: 'cta-link-bio',
    name: 'Link In Bio Pill',
    category: 'cta',
    previewText: '🔗 FULL BLUEPRINT IN BIO',
    color: '#10B981',
    className: 'font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-5 py-2 rounded-full border border-emerald-500/40 text-center',
    styleDescription: 'Direct off-platform conversion driver for products and courses',
    fontFamily: 'Inter, sans-serif',
    tags: ['cta', 'bio', 'link', 'conversion'],
  },
];

// ============================================================================
// 2. VISUAL ELEMENTS & STICKERS
// ============================================================================

export interface VisualElementItem {
  id: string;
  name: string;
  category: 'badges' | 'social' | 'memes' | 'progress' | 'waveforms' | 'frames' | 'arrows' | 'tech';
  label: string;
  desc: string;
  color: string;
  iconName: string;
  type: 'badge' | 'sticker' | 'progress' | 'waveform' | 'shape' | 'arrow' | 'hud';
  tags: string[];
}

export const VISUAL_ELEMENTS: VisualElementItem[] = [
  // --- VIRAL BADGES ---
  { id: 'b-rule-1', name: 'Rule #1 Core Principle', category: 'badges', label: 'RULE #1', desc: 'Core Foundation', color: 'from-amber-500 to-orange-600', iconName: 'Zap', type: 'badge', tags: ['rule', 'core', 'amber'] },
  { id: 'b-one-percent', name: 'The 1% Club', category: 'badges', label: 'THE 1% CLUB', desc: 'Elite Standards', color: 'from-blue-600 to-indigo-700', iconName: 'Crown', type: 'badge', tags: ['1%', 'elite', 'blue'] },
  { id: 'b-no-excuses', name: 'No Excuses', category: 'badges', label: 'NO EXCUSES', desc: 'Raw Discipline', color: 'from-red-600 to-rose-700', iconName: 'Flame', type: 'badge', tags: ['discipline', 'red', 'excuses'] },
  { id: 'b-stoic-mind', name: 'Stoic Mindset', category: 'badges', label: 'STOIC MINDSET', desc: 'Mental Fortress', color: 'from-zinc-600 to-zinc-800', iconName: 'Shield', type: 'badge', tags: ['stoic', 'shield', 'zinc'] },
  { id: 'b-day-one', name: 'Day 1 Or One Day', category: 'badges', label: 'DAY 1 OR ONE DAY', desc: 'Action Bias', color: 'from-emerald-600 to-teal-700', iconName: 'Target', type: 'badge', tags: ['action', 'emerald', 'day1'] },
  { id: 'b-silent-warrior', name: 'Silent Warrior', category: 'badges', label: 'SILENT WARRIOR', desc: 'Zero Talk', color: 'from-purple-600 to-indigo-800', iconName: 'Award', type: 'badge', tags: ['silent', 'purple', 'warrior'] },
  { id: 'b-four-am', name: '4:00 AM Club', category: 'badges', label: '4:00 AM CLUB', desc: 'Early Discipline', color: 'from-cyan-600 to-blue-700', iconName: 'Zap', type: 'badge', tags: ['morning', 'cyan', 'early'] },
  { id: 'b-zero-distract', name: 'Zero Distractions', category: 'badges', label: 'ZERO DISTRACTIONS', desc: 'Laser Focus', color: 'from-fuchsia-600 to-pink-700', iconName: 'Target', type: 'badge', tags: ['focus', 'fuchsia', 'laser'] },
  { id: 'b-forge-self', name: 'Forge Yourself', category: 'badges', label: 'FORGE YOURSELF', desc: 'Iron Will', color: 'from-orange-600 to-red-700', iconName: 'Flame', type: 'badge', tags: ['iron', 'orange', 'will'] },
  { id: 'b-unstoppable', name: 'Unstoppable Momentum', category: 'badges', label: 'UNSTOPPABLE', desc: 'Pure Momentum', color: 'from-emerald-500 to-cyan-600', iconName: 'Crown', type: 'badge', tags: ['momentum', 'unstoppable'] },
  { id: 'b-memento-mori', name: 'Memento Mori', category: 'badges', label: 'MEMENTO MORI', desc: 'Time Scarcity', color: 'from-zinc-700 to-zinc-900', iconName: 'Shield', type: 'badge', tags: ['time', 'memento', 'mori'] },
  { id: 'b-empire-build', name: 'Empire Builder', category: 'badges', label: 'EMPIRE BUILDER', desc: 'Generational Wealth', color: 'from-amber-600 to-yellow-700', iconName: 'Award', type: 'badge', tags: ['empire', 'wealth', 'gold'] },
  { id: 'b-monk-mode', name: 'Monk Mode', category: 'badges', label: 'MONK MODE', desc: 'Isolated Focus', color: 'from-slate-700 to-zinc-900', iconName: 'Shield', type: 'badge', tags: ['monk', 'mode', 'isolation'] },
  { id: 'b-stay-hard', name: 'Stay Hard', category: 'badges', label: 'STAY HARD', desc: 'Goggins Energy', color: 'from-red-700 to-neutral-900', iconName: 'Flame', type: 'badge', tags: ['goggins', 'hard', 'grit'] },
  { id: 'b-dopamine-detox', name: 'Dopamine Detox', category: 'badges', label: 'DOPAMINE DETOX', desc: 'Reset Chemistry', color: 'from-teal-600 to-emerald-800', iconName: 'Zap', type: 'badge', tags: ['dopamine', 'detox', 'reset'] },
  { id: 'b-high-agency', name: 'High Agency', category: 'badges', label: 'HIGH AGENCY', desc: 'Bend Reality', color: 'from-indigo-600 to-violet-800', iconName: 'Crown', type: 'badge', tags: ['agency', 'leadership'] },

  // --- SOCIAL ENGAGEMENT ---
  { id: 's-yt-sub', name: 'YouTube Subscribe Pill', category: 'social', label: 'SUBSCRIBE', desc: 'Red Button with Bell', color: 'from-red-600 to-red-700', iconName: 'Youtube', type: 'sticker', tags: ['youtube', 'subscribe', 'social'] },
  { id: 's-ig-tag', name: 'Instagram Creator Tag', category: 'social', label: '@ApexMind.ai', desc: 'IG gradient handle', color: 'from-purple-600 via-pink-600 to-amber-500', iconName: 'Instagram', type: 'sticker', tags: ['instagram', 'handle', 'social'] },
  { id: 's-share-arrow', name: 'Share This Video', category: 'social', label: 'SHARE THIS REEL', desc: 'Virality Reminder', color: 'from-blue-500 to-indigo-600', iconName: 'Share2', type: 'sticker', tags: ['share', 'viral', 'arrow'] },
  { id: 's-save-bookmark', name: 'Save For Later', category: 'social', label: 'SAVE REEL', desc: 'Bookmark Badge', color: 'from-amber-500 to-orange-500', iconName: 'Bookmark', type: 'sticker', tags: ['save', 'bookmark'] },
  { id: 's-verified-blue', name: 'Verified Badge Blue', category: 'social', label: 'VERIFIED', desc: 'Official Checkmark', color: 'from-sky-500 to-blue-600', iconName: 'CheckCircle', type: 'badge', tags: ['verified', 'blue', 'official'] },
  { id: 's-verified-gold', name: 'Verified Badge Gold', category: 'social', label: 'VIP GOLD', desc: 'Gold Verified Check', color: 'from-amber-400 to-yellow-600', iconName: 'CheckCircle', type: 'badge', tags: ['verified', 'gold', 'vip'] },
  { id: 's-like-counter', name: '100K Likes Pill', category: 'social', label: '❤️ 142K LIKES', desc: 'Social Proof Badge', color: 'from-rose-600 to-pink-700', iconName: 'Heart', type: 'sticker', tags: ['likes', 'social-proof', 'heart'] },
  { id: 's-bell-notif', name: 'Notification Bell', category: 'social', label: 'TURN ON 🔔', desc: 'Alert Reminder', color: 'from-yellow-500 to-amber-600', iconName: 'Bell', type: 'sticker', tags: ['bell', 'notification'] },

  // --- MEME STAMPS ---
  { id: 'm-chad-jaw', name: 'Gigachad Silhouette', category: 'memes', label: 'CHAD MINDSET', desc: 'Pure Alpha Energy', color: 'from-zinc-700 to-black', iconName: 'UserCheck', type: 'sticker', tags: ['chad', 'meme', 'alpha'] },
  { id: 'm-sigma-smirk', name: 'Sigma Rule Stamp', category: 'memes', label: 'SIGMA RULE #42', desc: 'Grind in Silence', color: 'from-zinc-800 to-zinc-950', iconName: 'Shield', type: 'badge', tags: ['sigma', 'meme', 'grind'] },
  { id: 'm-mindblown', name: 'Mind Blown Energy', category: 'memes', label: 'MIND BLOWN 🤯', desc: 'Perspective Shift', color: 'from-purple-600 to-pink-600', iconName: 'Sparkles', type: 'sticker', tags: ['mindblown', 'explosion', 'meme'] },
  { id: 'm-laser-eyes', name: 'Laser Eyes Crypto', category: 'memes', label: 'BULLISH ⚡', desc: 'Red Laser Vision', color: 'from-red-600 to-rose-700', iconName: 'Zap', type: 'sticker', tags: ['laser', 'crypto', 'bullish'] },
  { id: 'm-cap-nocap', name: 'NO CAP Certified', category: 'memes', label: '100% NO CAP', desc: 'Absolute Fact', color: 'from-emerald-600 to-teal-700', iconName: 'Check', type: 'badge', tags: ['nocap', 'fact', 'truth'] },
  { id: 'm-stonks-up', name: 'Stonks Growth Arrow', category: 'memes', label: 'STONKS ONLY GO UP 📈', desc: 'Exponential Surge', color: 'from-green-500 to-emerald-600', iconName: 'TrendingUp', type: 'sticker', tags: ['stonks', 'growth', 'crypto'] },

  // --- PROGRESS INDICATORS ---
  { id: 'p-top-line', name: 'Top Story Progress Line', category: 'progress', label: 'TOP SCRUB LINE', desc: 'Instagram Story Bar', color: 'from-blue-500 to-indigo-500', iconName: 'Sliders', type: 'progress', tags: ['progress', 'top', 'story'] },
  { id: 'p-seg-dots', name: '3-Step Segment Dots', category: 'progress', label: 'STEP 1 OF 3', desc: 'Bottom Carousel Dots', color: 'from-zinc-600 to-zinc-400', iconName: 'Circle', type: 'progress', tags: ['dots', 'steps', 'carousel'] },
  { id: 'p-circle-30s', name: '30s Countdown Ring', category: 'progress', label: '30s TIMER', desc: 'Circular Time Ring', color: 'from-amber-500 to-red-500', iconName: 'Clock', type: 'progress', tags: ['timer', 'countdown', 'circle'] },
  { id: 'p-battery-meter', name: '100% Energy Battery', category: 'progress', label: 'ENERGY 100%', desc: 'Battery Status Bar', color: 'from-emerald-500 to-teal-600', iconName: 'BatteryCharging', type: 'progress', tags: ['battery', 'energy', 'meter'] },
  { id: 'p-speedometer', name: 'Velocity Speedometer', category: 'progress', label: '100 KM/H SPEED', desc: 'Needle Dial Gauge', color: 'from-cyan-500 to-blue-600', iconName: 'Gauge', type: 'progress', tags: ['speed', 'gauge', 'velocity'] },

  // --- AUDIO WAVEFORMS ---
  { id: 'w-center-wave', name: 'Center Audio Waveform', category: 'waveforms', label: 'PULSE WAVE', desc: 'Symmetrical Audio Bars', color: 'from-blue-500 to-cyan-400', iconName: 'Activity', type: 'waveform', tags: ['waveform', 'audio', 'pulse'] },
  { id: 'w-bottom-spectrum', name: 'Bottom Frequency Spectrum', category: 'waveforms', label: 'SPECTRUM BARS', desc: 'Dancing Frequency Bars', color: 'from-purple-500 to-indigo-500', iconName: 'BarChart2', type: 'waveform', tags: ['spectrum', 'frequency', 'bars'] },
  { id: 'w-circular-radar', name: 'Circular Sound Radar', category: 'waveforms', label: 'RADAR WAVE', desc: 'Expanding Sound Pulse', color: 'from-emerald-500 to-teal-400', iconName: 'Radio', type: 'waveform', tags: ['radar', 'circular', 'sound'] },
  { id: 'w-cyber-hud-wave', name: 'Cyber Voice Scanner', category: 'waveforms', label: 'VOICE HUD SCAN', desc: 'Speech Frequency Analyzer', color: 'from-cyan-400 to-blue-600', iconName: 'Cpu', type: 'waveform', tags: ['voice', 'hud', 'scanner'] },

  // --- FRAMES & CONTAINERS ---
  { id: 'f-glass-quote', name: 'Rounded Glass Quote Box', category: 'frames', label: 'GLASS CONTAINER', desc: 'Dark Blur Container', color: 'from-zinc-900 to-zinc-950', iconName: 'Square', type: 'shape', tags: ['glass', 'quote', 'container'] },
  { id: 'f-spotlight', name: 'Center Radial Spotlight', category: 'frames', label: 'CENTER SPOTLIGHT', desc: 'Focus Radial Glow', color: 'from-blue-900/40 to-transparent', iconName: 'Circle', type: 'shape', tags: ['spotlight', 'radial', 'lighting'] },
  { id: 'f-letterbox', name: '2.39:1 Cinema Letterbox', category: 'frames', label: 'CINEMA BARS', desc: 'Top/Bottom Film Borders', color: 'from-black to-black', iconName: 'Layers', type: 'shape', tags: ['letterbox', 'cinema', 'anamorphic'] },
  { id: 'f-crt-scanlines', name: 'Retro CRT Scanlines', category: 'frames', label: 'CRT SCANLINES', desc: 'Cyberpunk Monitor Grid', color: 'from-zinc-800 to-zinc-900', iconName: 'Tv', type: 'shape', tags: ['crt', 'scanlines', 'retro'] },
  { id: 'f-reticle-brackets', name: 'Corner Target Brackets', category: 'frames', label: 'HUD RETICLE', desc: '4-Corner Targeting Box', color: 'from-cyan-500 to-blue-500', iconName: 'Maximize2', type: 'hud', tags: ['brackets', 'hud', 'reticle'] },
  { id: 'f-split-screen', name: 'Split Screen Divider', category: 'frames', label: 'SPLIT DIVIDER', desc: 'Vertical Video Split Line', color: 'from-zinc-700 to-zinc-900', iconName: 'Columns', type: 'shape', tags: ['split', 'divider', 'columns'] },

  // --- ARROWS & POINTERS ---
  { id: 'a-doodle-arrow', name: 'Curved Viral Arrow', category: 'arrows', label: 'CURVED POINTER', desc: 'Hand-Drawn Attention Arrow', color: 'from-yellow-400 to-amber-500', iconName: 'CornerRightDown', type: 'arrow', tags: ['arrow', 'pointer', 'curved'] },
  { id: 'a-laser-crosshair', name: 'Laser Crosshair Target', category: 'arrows', label: 'TARGET RETICLE', desc: 'Sniper Bullseye Scope', color: 'from-red-500 to-rose-600', iconName: 'Crosshair', type: 'arrow', tags: ['target', 'crosshair', 'scope'] },
  { id: 'a-growth-up', name: 'Viral Growth Arrow', category: 'arrows', label: 'UPWARD SURGE', desc: 'Diagonal Growth Vector', color: 'from-emerald-400 to-teal-500', iconName: 'ArrowUpRight', type: 'arrow', tags: ['growth', 'arrow', 'upward'] },
  { id: 'a-double-chevron', name: 'Double Chevron Fast-Forward', category: 'arrows', label: 'FAST FORWARD >>', desc: 'Speed Transition Arrow', color: 'from-blue-400 to-indigo-500', iconName: 'ChevronsRight', type: 'arrow', tags: ['chevron', 'fast', 'forward'] },

  // --- CRYPTO & TECH ---
  { id: 't-bitcoin', name: 'Bitcoin Gold Badge', category: 'tech', label: 'BITCOIN ₿', desc: 'Digital Gold Standard', color: 'from-amber-500 to-orange-600', iconName: 'Coins', type: 'badge', tags: ['bitcoin', 'crypto', 'btc'] },
  { id: 't-ethereum', name: 'Ethereum Crystal', category: 'tech', label: 'ETHEREUM Ξ', desc: 'Smart Contract Engine', color: 'from-indigo-500 to-blue-600', iconName: 'Hexagon', type: 'badge', tags: ['ethereum', 'crypto', 'eth'] },
  { id: 't-ai-neural', name: 'AI Neural Core', category: 'tech', label: 'NEURAL AI CORE', desc: 'Synapse Engine', color: 'from-cyan-500 to-emerald-500', iconName: 'Cpu', type: 'badge', tags: ['ai', 'neural', 'core'] },
  { id: 't-terminal-root', name: 'Root Terminal Hash', category: 'tech', label: 'ROOT ACCESS #', desc: 'Administrator Level', color: 'from-emerald-600 to-green-700', iconName: 'Terminal', type: 'badge', tags: ['root', 'terminal', 'linux'] },
];

// ============================================================================
// 3. CURATED 9:16 VERTICAL STOCK IMAGES
// ============================================================================

export interface StockImageItem {
  id: string;
  title: string;
  category: 'stoic' | 'luxury' | 'gym' | 'cyber' | 'cosmos' | 'abstract' | 'nature' | 'brutalist';
  url: string;
  thumbnail: string;
  author: string;
  resolution: string;
  tags: string[];
}

// ============================================================================
// 4. CURATED 9:16 VERTICAL VIDEO LOOPS
// ============================================================================

export interface StockVideoItem {
  id: string;
  title: string;
  category: 'atmospheric' | 'urban' | 'abstract' | 'grit';
  videoUrl: string;
  posterUrl: string;
  duration: string;
  resolution: string;
  tags: string[];
}

// ============================================================================
// 5. CURATED SOUNDTRACKS & MUSIC
// ============================================================================

export interface SoundtrackItem {
  id: string;
  title: string;
  genre: 'phonk' | 'cinematic' | 'lofi' | 'synthwave' | 'ambient' | 'trap' | 'vlog' | 'acoustic';
  duration: string;
  bpm: number;
  mood: string;
  audioUrl: string;
  tags: string[];
}
export const CURATED_SOUNDTRACKS: SoundtrackItem[] = [];


// ============================================================================
// 6. CURATED SOUND EFFECTS (SFX)
// ============================================================================

export interface SoundEffectItem {
  id: string;
  name: string;
  category: 'whoosh' | 'impact' | 'click' | 'digital' | 'notification' | 'riser' | 'nature' | 'retro';
  duration: string;
  audioUrl: string;
  tags: string[];
}

export const CURATED_SFX: SoundEffectItem[] = [];

// ============================================================================
// 7. 24-PAD INSTANT VIRAL MEME SOUNDBOARD
// ============================================================================

export interface MemeSoundboardItem {
  id: string;
  name: string;
  emoji: string;
  shortcut: string;
  category: 'viral' | 'impact' | 'fail' | 'win';
  audioUrl: string;
  desc: string;
}

export const VIRAL_MEME_SOUNDBOARD: MemeSoundboardItem[] = [];

// ============================================================================
// 8. 24 CINEMATIC COLOR LUTS & FILM GRADING
// ============================================================================

export interface ColorLUTItem {
  id: string;
  name: string;
  desc: string;
  cssFilter: string;
  previewGradient: string;
  category: 'cinematic' | 'moody' | 'vintage' | 'creative';
}

export const COLOR_LUTS: ColorLUTItem[] = [
  { id: 'lut-natural', name: 'Natural Studio Balanced', desc: 'Original balanced colorimetry', cssFilter: 'none', previewGradient: 'from-zinc-800 to-zinc-900', category: 'cinematic' },
  { id: 'lut-teal-orange', name: 'Moody Teal & Orange', desc: 'Hollywood blockbuster skin contrast', cssFilter: 'contrast(1.15) saturate(1.2) hue-rotate(-8deg)', previewGradient: 'from-teal-900 via-zinc-900 to-amber-900', category: 'cinematic' },
  { id: 'lut-noir-1950', name: 'Noir 1950 High Contrast', desc: 'Deep crushed blacks & silver whites', cssFilter: 'grayscale(1) contrast(1.4) brightness(0.95)', previewGradient: 'from-black via-zinc-600 to-white', category: 'moody' },
  { id: 'lut-cyber-matrix', name: 'Cyber Matrix Green-Cyan', desc: 'Futuristic code tint in shadows', cssFilter: 'contrast(1.2) hue-rotate(35deg) saturate(1.1)', previewGradient: 'from-emerald-950 via-zinc-900 to-cyan-900', category: 'creative' },
  { id: 'lut-golden-hour', name: 'Golden Hour Sunset', desc: 'Warm amber glow on highlights', cssFilter: 'sepia(0.25) contrast(1.1) saturate(1.25) brightness(1.05)', previewGradient: 'from-amber-950 via-orange-900 to-yellow-800', category: 'cinematic' },
  { id: 'lut-emerald-noir', name: 'Emerald Noir Shadow', desc: 'Deep forest shadows with cold skin', cssFilter: 'contrast(1.25) hue-rotate(25deg) brightness(0.9)', previewGradient: 'from-emerald-950 via-slate-900 to-teal-950', category: 'moody' },
  { id: 'lut-bleach-bypass', name: 'Bleach Bypass Thriller', desc: 'Desaturated gritty battlefield look', cssFilter: 'saturate(0.4) contrast(1.4) brightness(1.05)', previewGradient: 'from-zinc-900 via-stone-800 to-zinc-700', category: 'cinematic' },
  { id: 'lut-kodachrome', name: 'Vintage Kodachrome 70s', desc: 'Rich analog warm film emulsion', cssFilter: 'sepia(0.3) saturate(1.3) contrast(1.1)', previewGradient: 'from-red-950 via-amber-900 to-orange-800', category: 'vintage' },
  { id: 'lut-midnight-indigo', name: 'Midnight Indigo Navy', desc: 'Chilled deep blue night ambiance', cssFilter: 'hue-rotate(-25deg) contrast(1.2) brightness(0.9)', previewGradient: 'from-indigo-950 via-blue-950 to-slate-900', category: 'moody' },
  { id: 'lut-savage-grit', name: 'Savage Gym Grit', desc: 'Extreme sharpness & low saturation', cssFilter: 'contrast(1.35) saturate(0.7) brightness(0.95)', previewGradient: 'from-zinc-950 via-neutral-900 to-zinc-800', category: 'moody' },
  { id: 'lut-rose-gold', name: 'Rose Gold Luxury', desc: 'Champagne and delicate blush warmth', cssFilter: 'sepia(0.2) hue-rotate(-15deg) contrast(1.08) saturate(1.15)', previewGradient: 'from-rose-950 via-pink-900 to-amber-900', category: 'creative' },
  { id: 'lut-cold-steel', name: 'Cold Industrial Steel', desc: 'Cyan monochrome with silver tone', cssFilter: 'saturate(0.25) hue-rotate(-20deg) contrast(1.3)', previewGradient: 'from-slate-950 via-zinc-900 to-cyan-950', category: 'cinematic' },
];

// ============================================================================
// 9. 24 VIDEO TRANSITIONS
// ============================================================================

export interface VideoTransitionItem {
  id: string;
  name: string;
  duration: number; // in seconds
  type: 'whip' | 'zoom' | 'flash' | 'glitch' | 'slide' | 'fade';
  direction?: 'left' | 'right' | 'up' | 'down';
  desc: string;
}

export const VIDEO_TRANSITIONS: VideoTransitionItem[] = [
  { id: 'trans-whip-left', name: 'Whip Pan Left', duration: 0.4, type: 'whip', direction: 'left', desc: 'Fast motion blur camera whip to the left' },
  { id: 'trans-whip-right', name: 'Whip Pan Right', duration: 0.4, type: 'whip', direction: 'right', desc: 'Fast motion blur camera whip to the right' },
  { id: 'trans-zoom-in', name: 'Zoom In Punch', duration: 0.35, type: 'zoom', desc: 'High-impact center zoom punch into subject' },
  { id: 'trans-zoom-out', name: 'Zoom Out Spin', duration: 0.45, type: 'zoom', desc: 'Spinning zoom outward revealing new scene' },
  { id: 'trans-film-burn', name: 'Film Burn Light Leak', duration: 0.5, type: 'flash', desc: 'Vintage warm 35mm projector light flare' },
  { id: 'trans-glitch-cut', name: 'Digital Glitch Tear', duration: 0.3, type: 'glitch', desc: 'Chromatic aberration horizontal glitch tear' },
  { id: 'trans-split-slide', name: 'Split Screen Slide', duration: 0.4, type: 'slide', desc: 'Clean geometric slide separating two halves' },
  { id: 'trans-fade-obsidian', name: 'Dip to Obsidian Black', duration: 0.5, type: 'fade', desc: 'Smooth cinematic fade to black and return' },
  { id: 'trans-lens-flare', name: 'Anamorphic Lens Flare Flash', duration: 0.4, type: 'flash', desc: 'Horizontal blue optical streak flash' },
];
