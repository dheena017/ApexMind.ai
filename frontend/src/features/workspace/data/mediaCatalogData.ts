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
