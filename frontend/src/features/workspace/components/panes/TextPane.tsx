import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Type,
  Search,
  Check,
  X,
  Plus,
  RefreshCw,
  Sliders,
  Palette,
  Bookmark,
  Trash2,
  Save,
} from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { ScrollableTabs, TabItem } from '@/src/shared/ui/ScrollableTabs';
import { toast } from 'sonner';
import { addWorkspaceNotification } from '../../utils/workspaceNotificationManager';
import { workspaceApi } from '../../api/workspaceApi';

export interface TextPreset {
  id: string;
  name: string;
  family?: string;
  fontFamily: string;
  category?: string;
  categoryKey?: string;
  designer?: string;
  popularity?: number;
  weights?: number[];
  defaultWeight?: number;
  hasItalic?: boolean;
  stylesCount?: number;
  googleFontUrl?: string;
  className?: string;
  color?: string;
  styleDescription?: string;
  provider?: string;
  tags?: string[];
  previewText?: string;
  fontSize?: number;
  fontWeight?: number;
  textTransform?: string;
  animationType?: string;
}

export interface TextPaneProps {
  onApplyPreset?: (preset: TextPreset) => void;
  onUpdateHook?: (hook: string) => void;
  currentText?: string;
}

export const FONT_CATEGORIES = [
  { value: 'all', label: '✨ All Categories' },
  { value: 'bold-impact', label: '⚡ Bold & Impactful (Viral Shorts)' },
  { value: 'display', label: '💥 Display & Headlines' },
  { value: 'sans-serif', label: '⚡ Sans-Serif (Clean & Modern)' },
  { value: 'minimal', label: '💎 Minimal & Geometric (Tech)' },
  { value: 'condensed', label: '📐 Condensed & Tall (Titles)' },
  { value: 'serif', label: '🗿 Serif (Stoic & Editorial)' },
  { value: 'slab-serif', label: '🏛️ Slab Serif (Heavy & News)' },
  { value: 'monospace', label: '💻 Monospace (Terminal & Cyber)' },
  { value: 'futuristic', label: '🚀 Futuristic & Sci-Fi' },
  { value: 'retro', label: '👾 Retro, Y2K & Pixel' },
  { value: 'handwriting', label: '✍️ Handwriting & Casual' },
  { value: 'calligraphy', label: '✒️ Calligraphy & Signature' },
] as const;

export const TEXT_PROVIDERS = [
  { id: 'all', label: '✨ All Live Providers' },
  { id: 'google_fonts', label: '🌐 Google Fonts (1,900+)' },
  { id: 'fontshare', label: '💎 Fontshare ITF (Viral Display)' },
  { id: 'fontsource', label: '📚 Fontsource CDN (1,600+)' },
  { id: 'bunny', label: '🐰 Bunny Fonts (1,900+)' },
  { id: 'gwfh', label: '🏛️ GWFH Open Fonts (1,500+)' },
] as const;

// ── Dropdown Options (Expanded with comprehensive typography choices) ──

export const FONT_WEIGHT_OPTIONS = [
  { value: 950, label: '950 Ultra Black (Maximum Thickness)' },
  { value: 900, label: '900 Black (Heavy Impact)' },
  { value: 800, label: '800 ExtraBold (Punchy Headline)' },
  { value: 700, label: '700 Bold (Classic Caption)' },
  { value: 600, label: '600 SemiBold (Modern Accent)' },
  { value: 500, label: '500 Medium (Clean Editorial)' },
  { value: 400, label: '400 Regular (Balanced Body)' },
  { value: 300, label: '300 Light (Tech Minimal)' },
  { value: 200, label: '200 ExtraLight (Delicate Elegant)' },
  { value: 100, label: '100 Thin / Hairline (Ultra Sleek)' },
];

export const TEXT_CASING_OPTIONS = [
  { value: 'none', label: 'Normal Case' },
  { value: 'uppercase-wide', label: 'UPPERCASE (Wide Cinematic Tracking)' },
  { value: 'uppercase-tight', label: 'UPPERCASE (Compact / Punchy)' },
  { value: 'uppercase', label: 'UPPERCASE (Standard)' },
  { value: 'capitalize', label: 'Capitalize Each Word' },
  { value: 'capitalize-wide', label: 'Capitalize (Spaced Luxury)' },
  { value: 'lowercase', label: 'lowercase (Aesthetic / Gen-Z)' },
  { value: 'small-caps', label: 'SMALL CAPS (Editorial & Formal)' },
  { value: 'mono-spaced', label: 'Monospace Spaced (Terminal / Code)' },
];

export const DARK_OUTLINE_OPTIONS = [
  { value: 'none', label: 'None (Clean Flat Text)' },
  { value: 'subtle-dark', label: 'Subtle 0.75px Shadow Outline' },
  { value: 'thin', label: 'Thin 1px Jet Black Stroke' },
  { value: 'medium', label: 'Medium 1.5px Black Stroke' },
  { value: 'heavy', label: 'Heavy 2px Solid Black Stroke' },
  { value: 'ultra-black', label: 'Ultra 3px Deep Black Stroke' },
  { value: 'massive-black', label: 'Massive 4px MrBeast Style Stroke' },
  { value: 'white-stroke', label: 'Crisp 1.5px White Stroke' },
  { value: 'neon-blue-stroke', label: 'Neon Blue Outline (1.5px #3B82F6)' },
  { value: 'gold-stroke', label: 'Metallic Gold Outline (1.5px #EAB308)' },
  { value: 'crimson-stroke', label: 'Crimson Red Outline (1.5px #EF4444)' },
  { value: 'emerald-stroke', label: 'Cyber Emerald Outline (1.5px #10B981)' },
  { value: 'double-stroke', label: 'Double Ring Layered Outline' },
];

export const SHADOW_GLOW_OPTIONS = [
  { value: 'deep-drop', label: 'Deep Drop Shadow' },
  { value: 'soft-drop', label: 'Soft Ambient Drop Shadow' },
  { value: 'ultra-black-drop', label: 'Ultra Hard Multi-Stop Shadow' },
  { value: 'pop3d-right', label: '3D Comic Hard Extrusion (Bottom-Right)' },
  { value: 'pop3d-left', label: '3D Hard Extrusion (Bottom-Left)' },
  { value: '3d-stacked', label: '3D Isometric Multi-Layer Shadow' },
  { value: 'neon-cyan', label: 'Electric Cyan Neon Glow' },
  { value: 'neon-blue', label: 'Cobalt Blue Outer Glow' },
  { value: 'neon-purple', label: 'Synthwave Purple Glow' },
  { value: 'neon-amber', label: 'Sunset Gold / Amber Glow' },
  { value: 'neon-emerald', label: 'Matrix Emerald Glow' },
  { value: 'neon-rose', label: 'Hot Magenta / Rose Glow' },
  { value: 'retro-anaglyph', label: 'Retro 3D Anaglyph (Red / Cyan)' },
  { value: 'hologram', label: 'Sci-Fi Hologram Flicker Glow' },
  { value: 'none', label: 'None (Flat Clean)' },
];

export const BACKGROUND_PILL_OPTIONS = [
  { value: 'none', label: 'None (Floating Text)' },
  { value: 'pill-black', label: 'Solid Jet Black Pill' },
  { value: 'pill-black-outline', label: 'Black Pill + Subtle White Border' },
  { value: 'pill-semi-dark', label: 'Dark Translucent Glass Pill' },
  { value: 'box-rectangular', label: 'Sharp Editorial Box' },
  { value: 'glass-frosted', label: 'Apple-Style Frosted Glass' },
  { value: 'glass-dark', label: 'Dark Smoked Glass' },
  { value: 'neon-cyan-box', label: 'Cyber Cyan Border Box' },
  { value: 'neon-purple-box', label: 'Synthwave Purple Border Box' },
  { value: 'neon-amber-box', label: 'Viral Gold Border Box' },
  { value: 'gradient-dark', label: 'Obsidian Dark Gradient Box' },
  { value: 'gradient-sunset', label: 'Sunset Red-Amber Gradient Pill' },
  { value: 'gradient-cyber', label: 'Cyber Violet-Cyan Gradient Pill' },
  { value: 'tag-badge', label: 'Minimal Bracketed Tag Badge' },
];

export const KINETIC_ANIMATION_OPTIONS = [
  { value: 'none', label: 'Static (No Motion)' },
  { value: 'word-bounce', label: 'Word Bounce (Viral TikTok / Reels)' },
  { value: 'pop-spring', label: 'Elastic Pop Spring (Hormozi Impact)' },
  { value: 'slide-fade-up', label: 'Smooth Slide & Fade Up (Cinematic)' },
  { value: 'slide-fade-down', label: 'Smooth Slide & Fade Down' },
  { value: 'typewriter', label: 'High-Speed Typewriter Stream' },
  { value: 'karaoke-highlight', label: 'Karaoke Active Word Highlight' },
  { value: 'karaoke-pill', label: 'Karaoke Word Background Pill' },
  { value: 'scale-pulse', label: 'Rhythmic Scale Pulse (Beat Synced)' },
  { value: 'glow-pulse', label: 'Breathing Neon Glow Pulse' },
  { value: 'shake-impact', label: 'Punchy Impact Shake (Heavy Hit)' },
  { value: 'flip-in', label: '3D Perspective Flip In (X-Axis)' },
  { value: 'glitch-cyber', label: 'Cyberpunk Glitch & Jitter' },
  { value: 'blur-reveal', label: 'Motion Blur to Sharp Focus Reveal' },
  { value: 'wobble', label: 'Playful Elastic Wobble' },
];

export const COLOR_PRESETS = [
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Viral Yellow', value: '#FACC15' },
  { name: 'Electric Cyan', value: '#22D3EE' },
  { name: 'Lime Green', value: '#4ADE80' },
  { name: 'Coral Red', value: '#F87171' },
  { name: 'Hot Pink', value: '#F43F5E' },
  { name: 'Soft Purple', value: '#C084FC' },
  { name: 'Sunset Orange', value: '#FB923C' },
  { name: 'Obsidian Silver', value: '#E4E4E7' },
];

const LOCAL_STORAGE_CUSTOM_STYLES_KEY = 'apexmind_saved_custom_typography_styles';
const loadedFontUrls = new Set<string>();

// Dynamic stylesheet injector without URL hash collisions and with reactive load notification
function ensureFontLoaded(url?: string, onFontReady?: () => void) {
  if (!url || typeof document === 'undefined') return;
  if (loadedFontUrls.has(url)) return;
  loadedFontUrls.add(url);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  if (onFontReady) {
    link.onload = () => {
      if (document.fonts) {
        document.fonts.ready.then(() => onFontReady()).catch(() => onFontReady());
      } else {
        onFontReady();
      }
    };
  }
  document.head.appendChild(link);
}

// Clean preview formatter: truncates long project scripts for card display
function getCardPreviewText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 36) return trimmed;
  const firstSentence = trimmed.split(/[.?!]/)[0].trim();
  if (firstSentence && firstSentence.length >= 8 && firstSentence.length <= 40) {
    return firstSentence;
  }
  return trimmed.slice(0, 34).trim() + '...';
}

function renderFontProviderBadge(provider?: string) {
  switch (provider) {
    case 'fontshare':
      return (
        <span className="text-[9px] font-mono-studio text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 rounded shrink-0">
          Fontshare
        </span>
      );
    case 'gwfh':
    case 'open_font_library':
      return (
        <span className="text-[9px] font-mono-studio text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1 rounded shrink-0">
          GWFH
        </span>
      );
    case 'fontsource':
      return (
        <span className="text-[9px] font-mono-studio text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 rounded shrink-0">
          Fontsource
        </span>
      );
    case 'bunny':
    case 'coollabs':
      return (
        <span className="text-[9px] font-mono-studio text-pink-300 bg-pink-500/15 border border-pink-500/30 px-1 rounded shrink-0">
          Bunny
        </span>
      );
    default:
      return (
        <span className="text-[9px] font-mono-studio text-blue-300 bg-blue-500/15 border border-blue-500/30 px-1 rounded shrink-0">
          Google
        </span>
      );
  }
}

export const TextPane: React.FC<TextPaneProps> = ({
  onApplyPreset,
  currentText = '',
}) => {
  const [activeTab, setActiveTab] = useState<'fonts' | 'customizer' | 'saved'>('fonts');
  const [selectedFontId, setSelectedFontId] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number>(700);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live provider stream state
  const [fonts, setFonts] = useState<TextPreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalFonts, setTotalFonts] = useState<number>(0);
  const [loadedVersion, setLoadedVersion] = useState<number>(0);

  // Specimen preview text controls (defaults to 'The quick brown fox' matching Google Fonts)
  const [previewMode, setPreviewMode] = useState<'sentence' | 'title' | 'numbers' | 'name' | 'custom'>('sentence');
  const [customPreviewText, setCustomPreviewText] = useState<string>('The quick brown fox');

  // Customizer state
  const [customFont, setCustomFont] = useState<string>('Montserrat, sans-serif');
  const [customColor, setCustomColor] = useState<string>('#FFFFFF');
  const [customWeight, setCustomWeight] = useState<number>(700);
  const [customTransform, setCustomTransform] = useState<string>('none');
  const [customOutline, setCustomOutline] = useState<string>('none');
  const [customShadow, setCustomShadow] = useState<string>('deep-drop');
  const [customContainer, setCustomContainer] = useState<string>('none');
  const [customAnimation, setCustomAnimation] = useState<string>('none');
  const [customStyleName, setCustomStyleName] = useState<string>('');
  const [savedCustomStyles, setSavedCustomStyles] = useState<TextPreset[]>([]);

  // Load saved custom styles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CUSTOM_STYLES_KEY);
      if (stored) {
        setSavedCustomStyles(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const triggerFontRepaint = useCallback(() => {
    setLoadedVersion((v) => v + 1);
  }, []);

  const triggerFeedback = (msg: string) => {
    toast.success(msg);
    addWorkspaceNotification({
      title: 'Font Updated',
      message: msg,
      category: 'script',
      type: 'success',
      targetPane: 'text',
      actionLabel: 'Typography',
    });
  };

  // Live search query to backend /api/media/font-search
  const fetchFonts = useCallback(
    async (currentPage: number = 1, append: boolean = false) => {
      setIsLoading(true);
      try {
        const prov = selectedProvider;
        const res = await workspaceApi.searchOpenFonts(
          searchQuery,
          selectedCategory,
          prov,
          currentPage,
          24
        );

        if (res && res.items) {
          const items: TextPreset[] = res.items;
          items.forEach((item) => {
            if (item.googleFontUrl) {
              ensureFontLoaded(item.googleFontUrl, triggerFontRepaint);
            }
          });

          if (append) {
            setFonts((prev) => [...prev, ...items]);
          } else {
            setFonts(items);
            if (items.length > 0 && !selectedFontId) {
              setSelectedFontId(items[0].id);
              setSelectedWeight(items[0].defaultWeight || 700);
              setCustomFont(items[0].fontFamily || `"${items[0].family}", sans-serif`);
              setCustomWeight(items[0].defaultWeight || 700);
            }
          }
          setTotalFonts(res.total || items.length);
        }
      } catch (err) {
        console.error('Failed to load live fonts:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedCategory, selectedProvider, selectedFontId, triggerFontRepaint]
  );

  // Trigger search on filter changes with debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchFonts(1, false);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, selectedCategory, selectedProvider, fetchFonts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFonts(nextPage, true);
  };

  const handleApplyFont = (font: TextPreset, weight?: number) => {
    setSelectedFontId(font.id);
    const chosenWeight = weight || font.defaultWeight || 700;
    setSelectedWeight(chosenWeight);
    setCustomFont(font.fontFamily || `"${font.family}", sans-serif`);
    setCustomWeight(chosenWeight);

    if (font.googleFontUrl) {
      ensureFontLoaded(font.googleFontUrl, triggerFontRepaint);
    }

    const applied: TextPreset = {
      ...font,
      fontWeight: chosenWeight,
      previewText: currentText?.trim() || font.name,
      color: '#FFFFFF',
    };

    if (onApplyPreset) {
      onApplyPreset(applied);
    }
    triggerFeedback(`Applied Font: ${font.name} (${chosenWeight})`);
  };

  // Compute CSS styling classes based on the 6 customizer controls
  const computedCustomClass = useMemo(() => {
    const parts: string[] = [];

    // Weight
    if (customWeight >= 950) parts.push('font-black tracking-tighter');
    else if (customWeight >= 900) parts.push('font-black');
    else if (customWeight >= 800) parts.push('font-extrabold');
    else if (customWeight >= 700) parts.push('font-bold');
    else if (customWeight >= 600) parts.push('font-semibold');
    else if (customWeight >= 500) parts.push('font-medium');
    else if (customWeight >= 400) parts.push('font-normal');
    else if (customWeight >= 300) parts.push('font-light');
    else if (customWeight >= 200) parts.push('font-extralight');
    else parts.push('font-thin');

    // Casing & Tracking
    switch (customTransform) {
      case 'uppercase-wide':
        parts.push('uppercase tracking-[0.2em]');
        break;
      case 'uppercase-tight':
        parts.push('uppercase tracking-tighter');
        break;
      case 'uppercase':
        parts.push('uppercase tracking-tight');
        break;
      case 'capitalize-wide':
        parts.push('capitalize tracking-[0.12em]');
        break;
      case 'capitalize':
        parts.push('capitalize tracking-normal');
        break;
      case 'lowercase':
        parts.push('lowercase tracking-normal');
        break;
      case 'small-caps':
        parts.push('uppercase text-[0.9em] tracking-wider');
        break;
      case 'mono-spaced':
        parts.push('tracking-[0.25em] font-mono-studio');
        break;
      default:
        parts.push('normal-case');
        break;
    }

    // Outline / Stroke
    switch (customOutline) {
      case 'massive-black':
        parts.push('[-webkit-text-stroke:4px_#000] [paint-order:stroke_fill] [text-shadow:-3px_-3px_0_#000,3px_-3px_0_#000,-3px_3px_0_#000,3px_3px_0_#000,0_6px_20px_rgba(0,0,0,1)]');
        break;
      case 'ultra-black':
        parts.push('[-webkit-text-stroke:3px_#000] [paint-order:stroke_fill] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,0_4px_16px_rgba(0,0,0,0.95)]');
        break;
      case 'heavy':
        parts.push('[-webkit-text-stroke:2px_#000] [paint-order:stroke_fill] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,0_4px_12px_rgba(0,0,0,0.95)]');
        break;
      case 'medium':
        parts.push('[-webkit-text-stroke:1.5px_#000] [paint-order:stroke_fill] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]');
        break;
      case 'thin':
        parts.push('[-webkit-text-stroke:1px_#000]');
        break;
      case 'subtle-dark':
        parts.push('[-webkit-text-stroke:0.75px_rgba(0,0,0,0.7)]');
        break;
      case 'white-stroke':
        parts.push('[-webkit-text-stroke:1.5px_#fff] [paint-order:stroke_fill] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]');
        break;
      case 'neon-blue-stroke':
        parts.push('[-webkit-text-stroke:1.5px_#3B82F6] [paint-order:stroke_fill] [text-shadow:0_0_12px_rgba(59,130,246,0.8)]');
        break;
      case 'gold-stroke':
        parts.push('[-webkit-text-stroke:1.5px_#EAB308] [paint-order:stroke_fill] [text-shadow:0_0_12px_rgba(234,179,8,0.7)]');
        break;
      case 'crimson-stroke':
        parts.push('[-webkit-text-stroke:1.5px_#EF4444] [paint-order:stroke_fill] [text-shadow:0_0_12px_rgba(239,68,68,0.8)]');
        break;
      case 'emerald-stroke':
        parts.push('[-webkit-text-stroke:1.5px_#10B981] [paint-order:stroke_fill] [text-shadow:0_0_12px_rgba(16,185,129,0.8)]');
        break;
      case 'double-stroke':
        parts.push('[-webkit-text-stroke:2px_#000] [paint-order:stroke_fill] [text-shadow:0_0_0_3px_#3B82F6,0_4px_16px_rgba(0,0,0,1)]');
        break;
      default:
        break;
    }

    // Shadow / Glow / FX
    switch (customShadow) {
      case 'soft-drop':
        parts.push('drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]');
        break;
      case 'deep-drop':
        parts.push('drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]');
        break;
      case 'ultra-black-drop':
        parts.push('drop-shadow-[0_6px_24px_rgba(0,0,0,1)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]');
        break;
      case 'pop3d-right':
        parts.push('drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]');
        break;
      case 'pop3d-left':
        parts.push('drop-shadow-[-4px_4px_0px_rgba(0,0,0,1)]');
        break;
      case '3d-stacked':
        parts.push('drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] drop-shadow-[4px_4px_0px_rgba(0,0,0,0.8)] drop-shadow-[6px_6px_0px_rgba(0,0,0,0.6)]');
        break;
      case 'neon-cyan':
        parts.push('drop-shadow-[0_0_16px_rgba(6,182,212,0.95)] drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]');
        break;
      case 'neon-blue':
        parts.push('drop-shadow-[0_0_16px_rgba(59,130,246,0.95)] drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]');
        break;
      case 'neon-purple':
        parts.push('drop-shadow-[0_0_16px_rgba(168,85,247,0.95)] drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]');
        break;
      case 'neon-amber':
        parts.push('drop-shadow-[0_0_16px_rgba(245,158,11,0.95)] drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]');
        break;
      case 'neon-emerald':
        parts.push('drop-shadow-[0_0_16px_rgba(16,185,129,0.95)] drop-shadow-[0_0_30px_rgba(16,185,129,0.6)]');
        break;
      case 'neon-rose':
        parts.push('drop-shadow-[0_0_16px_rgba(244,63,94,0.95)] drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]');
        break;
      case 'retro-anaglyph':
        parts.push('[text-shadow:-3px_0_0_rgba(239,68,68,0.8),3px_0_0_rgba(6,182,212,0.8)]');
        break;
      case 'hologram':
        parts.push('drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] drop-shadow-[0_0_25px_rgba(129,140,248,0.5)] opacity-95');
        break;
      default:
        break;
    }

    // Container
    switch (customContainer) {
      case 'pill-black':
        parts.push('bg-black/95 px-4 py-1.5 rounded-full shadow-2xl');
        break;
      case 'pill-black-outline':
        parts.push('bg-black/90 px-4 py-1.5 rounded-full border border-white/20 shadow-2xl');
        break;
      case 'pill-semi-dark':
        parts.push('bg-zinc-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg');
        break;
      case 'box-rectangular':
        parts.push('bg-black px-3.5 py-1 rounded-sm shadow-xl');
        break;
      case 'glass-frosted':
        parts.push('backdrop-blur-xl bg-white/10 px-4 py-1.5 rounded-2xl border border-white/20 shadow-xl');
        break;
      case 'glass-dark':
        parts.push('backdrop-blur-xl bg-black/60 px-4 py-1.5 rounded-2xl border border-white/10 shadow-xl');
        break;
      case 'neon-cyan-box':
        parts.push('bg-cyan-950/60 px-4 py-1.5 rounded-xl border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]');
        break;
      case 'neon-purple-box':
        parts.push('bg-purple-950/60 px-4 py-1.5 rounded-xl border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]');
        break;
      case 'neon-amber-box':
        parts.push('bg-amber-950/60 px-4 py-1.5 rounded-xl border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]');
        break;
      case 'gradient-dark':
        parts.push('bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-1.5 rounded-xl border border-zinc-800 shadow-xl');
        break;
      case 'gradient-sunset':
        parts.push('bg-gradient-to-r from-rose-600/90 via-orange-600/90 to-amber-600/90 px-4 py-1.5 rounded-full shadow-xl');
        break;
      case 'gradient-cyber':
        parts.push('bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-cyan-600/90 px-4 py-1.5 rounded-full shadow-xl');
        break;
      case 'tag-badge':
        parts.push('bg-black/90 px-3 py-1 rounded border-l-4 border-blue-500 shadow-md');
        break;
      default:
        break;
    }

    return parts.join(' ');
  }, [customWeight, customTransform, customOutline, customShadow, customContainer]);

  const effectiveCustomPreviewText = currentText?.trim()
    ? getCardPreviewText(currentText)
    : customFont.split(',')[0].replace(/['"]/g, '');

  const handleApplyCustomizer = () => {
    const fontName = customFont.split(',')[0].replace(/['"]/g, '');
    const appliedPreset: TextPreset = {
      id: `custom-${Date.now()}`,
      name: customStyleName.trim() || `${fontName} Custom Style`,
      fontFamily: customFont,
      className: computedCustomClass,
      color: customColor,
      fontWeight: customWeight,
      fontSize: 24,
      animationType: customAnimation !== 'none' ? customAnimation : undefined,
      previewText: effectiveCustomPreviewText,
      styleDescription: `${fontName} • ${customWeight} • ${customTransform}`,
    };

    if (onApplyPreset) {
      onApplyPreset(appliedPreset);
    }
    triggerFeedback(`Applied Custom Style: "${appliedPreset.name}"`);
  };

  const handleSaveCustomStyle = () => {
    const fontName = customFont.split(',')[0].replace(/['"]/g, '');
    const styleName = customStyleName.trim() || `${fontName} Preset ${savedCustomStyles.length + 1}`;
    const newStyle: TextPreset = {
      id: `saved-${Date.now()}`,
      name: styleName,
      fontFamily: customFont,
      className: computedCustomClass,
      color: customColor,
      fontWeight: customWeight,
      fontSize: 24,
      animationType: customAnimation !== 'none' ? customAnimation : undefined,
      previewText: effectiveCustomPreviewText,
      styleDescription: `${fontName} • ${customWeight} • ${customTransform}`,
    };

    const updated = [newStyle, ...savedCustomStyles];
    setSavedCustomStyles(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_STYLES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save custom style:', err);
    }
    setCustomStyleName('');
    triggerFeedback(`Saved "${styleName}" to your presets!`);
  };

  const handleDeleteSavedStyle = (id: string) => {
    const updated = savedCustomStyles.filter((s) => s.id !== id);
    setSavedCustomStyles(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_STYLES_KEY, JSON.stringify(updated));
    } catch {}
    triggerFeedback('Preset deleted');
  };

  const TABS: TabItem<'fonts' | 'customizer' | 'saved'>[] = [
    { id: 'fonts', label: 'Live Fonts', icon: Type, badge: totalFonts ? `${totalFonts}` : undefined },
    { id: 'customizer', label: 'Style Customizer', icon: Sliders },
    { id: 'saved', label: 'Saved Styles', icon: Bookmark, badge: savedCustomStyles.length || undefined },
  ];

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0">
      {/* ── Header Title Bar ── */}
      <div className="relative h-12 px-3.5 bg-[#141416] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] border border-[#33333A] text-white">
            <Type className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-white">
              Typography Studio
            </span>
            <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              {totalFonts ? `${totalFonts.toLocaleString()} Live Fonts` : '8,500+ Live Fonts'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchFonts(1, false)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
          title="Refresh live font catalog"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>

      {/* ── Top Navigation Tabs ── */}
      <div className="px-3 pt-2.5 pb-2 bg-[#141416] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          containerBgClassName="bg-[#121214]"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: LIVE MODULAR FONTS CATALOG */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fonts' && (
        <>
          {/* Search, Categories & Providers */}
          <div className="border-b border-[#242424] bg-[#141416] p-3 shrink-0 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search live fonts (e.g. Satoshi, Montserrat, Clash Display, Bebas)..."
                  className="w-full bg-[#181818] border border-[#242424] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="shrink-0 w-40 sm:w-52">
                <CustomSelect
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val);
                    setPage(1);
                  }}
                  options={FONT_CATEGORIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                  }))}
                  variant="compact"
                  align="right"
                  buttonClassName="!w-full !justify-between !bg-[#181818] !border-[#242424] !text-xs !py-2 !px-3 font-semibold hover:!border-white/10"
                />
              </div>
            </div>

            {/* Text Providers Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
              {TEXT_PROVIDERS.map((provider) => {
                const isProviderActive =
                  (provider.id === 'all' && selectedProvider === 'all') ||
                  (provider.id === selectedProvider);

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      isProviderActive
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-[#181818] hover:bg-[#202020] text-zinc-400 hover:text-white border border-[#262626]'
                    }`}
                  >
                    {provider.label}
                  </button>
                );
              })}
            </div>

            {/* Specimen Preview Text Bar (Classic Google Fonts Pangram & Custom Test) */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#222226]">
              <span className="text-[10px] text-zinc-500 font-medium shrink-0">Sample:</span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setPreviewMode('sentence')}
                  className={`px-2 py-0.5 rounded-md text-[10px] transition-all shrink-0 cursor-pointer ${
                    previewMode === 'sentence'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                      : 'bg-[#18181A] text-zinc-400 hover:text-white border border-[#26262A]'
                  }`}
                  title="Specimen pangram (shows all font characters)"
                >
                  🦊 The quick brown fox
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('title')}
                  className={`px-2 py-0.5 rounded-md text-[10px] transition-all shrink-0 cursor-pointer ${
                    previewMode === 'title'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                      : 'bg-[#18181A] text-zinc-400 hover:text-white border border-[#26262A]'
                  }`}
                  title="Headline title preview"
                >
                  ⚡ Master Your Mind
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('numbers')}
                  className={`px-2 py-0.5 rounded-md text-[10px] transition-all shrink-0 cursor-pointer ${
                    previewMode === 'numbers'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                      : 'bg-[#18181A] text-zinc-400 hover:text-white border border-[#26262A]'
                  }`}
                  title="Numbers & symbols preview"
                >
                  🔢 123 $99
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('name')}
                  className={`px-2 py-0.5 rounded-md text-[10px] transition-all shrink-0 cursor-pointer ${
                    previewMode === 'name'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                      : 'bg-[#18181A] text-zinc-400 hover:text-white border border-[#26262A]'
                  }`}
                  title="Font family name preview"
                >
                  🏷️ Font Name
                </button>
                <div className="relative flex-1 min-w-[120px]">
                  <input
                    type="text"
                    value={previewMode === 'custom' ? customPreviewText : ''}
                    placeholder="Type custom text..."
                    onChange={(e) => {
                      setPreviewMode('custom');
                      setCustomPreviewText(e.target.value);
                    }}
                    onFocus={() => {
                      if (previewMode !== 'custom') {
                        setPreviewMode('custom');
                      }
                    }}
                    className="w-full bg-[#18181A] border border-[#26262A] focus:border-blue-500/50 rounded px-2 py-0.5 text-[10px] text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Font Cards Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3 custom-scrollbar">
            {isLoading && fonts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-xs font-mono-studio">Fetching live font providers...</span>
              </div>
            ) : fonts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs">
                No fonts found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {fonts.map((font) => {
                  const isSelected = selectedFontId === font.id;
                  const availableWeights = font.weights && font.weights.length > 0 ? font.weights : [400, 700];

                  let textToDisplay = 'The quick brown fox';
                  if (previewMode === 'sentence') {
                    textToDisplay = 'The quick brown fox';
                  } else if (previewMode === 'title') {
                    textToDisplay = currentText?.trim() ? getCardPreviewText(currentText) : 'Master Your Mind';
                  } else if (previewMode === 'numbers') {
                    textToDisplay = '123,456 $99.00 !?#';
                  } else if (previewMode === 'name') {
                    textToDisplay = font.name;
                  } else if (previewMode === 'custom') {
                    textToDisplay = customPreviewText.trim() || 'The quick brown fox';
                  }

                  return (
                    <div
                      key={font.id}
                      onClick={() => handleApplyFont(font)}
                      className={`group relative rounded-xl border p-3 bg-[#181818] hover:bg-[#1D1D22] transition-all flex flex-col gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-blue-500/80 bg-[#171B26] ring-1 ring-blue-500/30'
                          : 'border-[#242424] hover:border-[#383842]'
                      }`}
                    >
                      {/* Font Header Info (100% Google Fonts style) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-bold text-white tracking-tight truncate">
                            {font.name}
                          </span>
                          {renderFontProviderBadge(font.provider)}
                          <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/25 shrink-0">
                            {font.category || 'Sans Serif'}
                          </span>
                          <span className="text-[10px] font-mono-studio text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full border border-zinc-700/40 shrink-0 hidden sm:inline">
                            {font.stylesCount || availableWeights.length} styles
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Dynamic Font Specimen Preview Box */}
                      <div
                        key={`${font.id}-${loadedVersion}`}
                        className="bg-[#0C0C0F] border border-[#202028] rounded-xl py-3.5 px-4 flex items-center justify-center text-center min-h-[58px] overflow-hidden group-hover:border-[#2E2E38] transition-colors"
                      >
                        <span
                          className="text-xl sm:text-2xl leading-snug select-none text-white tracking-tight transition-all duration-150"
                          style={{
                            fontFamily: font.fontFamily || `"${font.family}", sans-serif`,
                            fontWeight: isSelected ? selectedWeight : font.defaultWeight || 700,
                          }}
                        >
                          {textToDisplay}
                        </span>
                      </div>

                      {/* Provider Details & Weight Selector Chips */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[11px] text-zinc-500 truncate">
                          {font.designer ? `by ${font.designer}` : font.name}
                        </span>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {availableWeights.slice(0, 5).map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => handleApplyFont(font, w)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono-studio transition-all cursor-pointer ${
                                isSelected && selectedWeight === w
                                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                                  : 'bg-[#22222A] text-zinc-400 hover:text-white border border-[#2D2D38]'
                              }`}
                              title={`Apply weight ${w}`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Pagination Container */}
                <div className="pt-2 pb-2 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C22] hover:bg-[#25252E] border border-[#2D2D35] hover:border-blue-500/50 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  >
                    <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>Load More Font Styles</span>
                    <span className="text-[10px] font-mono-studio text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      +24
                    </span>
                  </button>
                  <span className="text-[10px] font-mono-studio text-zinc-500 text-center">
                    Showing {fonts.length} of {totalFonts ? totalFonts.toLocaleString() : '8,500+'} Font Styles
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: INTERACTIVE CUSTOM STYLE BUILDER (6 EXPANDED DROPDOWNS) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'customizer' && (
        <div className="flex-1 overflow-y-auto min-h-0 p-3.5 space-y-4 custom-scrollbar">
          {/* Live Interactive Custom Preview Card */}
          <div className="bg-[#18181C] border border-blue-500/30 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Live Custom Typography Preview
              </span>
              <span className="text-[10px] text-zinc-400 font-mono-studio">
                {customFont.split(',')[0].replace(/['"]/g, '')}
              </span>
            </div>

            <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg p-5 flex items-center justify-center text-center min-h-[72px] overflow-hidden">
              <span
                className={`text-xl sm:text-2xl leading-tight select-none transition-all duration-150 ${computedCustomClass}`}
                style={{
                  color: customColor,
                  fontFamily: customFont,
                }}
              >
                {effectiveCustomPreviewText}
              </span>
            </div>

            {/* Quick Apply Button */}
            <button
              type="button"
              onClick={handleApplyCustomizer}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.99]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Custom Style to Video</span>
            </button>
          </div>

          {/* Color Presets Palette */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
              <span>Text Color & Accent</span>
              <span className="text-[10px] font-mono-studio text-zinc-500 uppercase">{customColor}</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCustomColor(c.value)}
                  className={`w-6 h-6 rounded-md border transition-transform cursor-pointer flex items-center justify-center ${
                    customColor === c.value ? 'scale-110 border-white ring-2 ring-blue-500/50' : 'border-black/50 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {customColor === c.value && (
                    <Check className={`w-3 h-3 stroke-[3] ${c.value === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-6 h-6 rounded-md border border-[#33333A] bg-transparent cursor-pointer p-0"
                title="Custom Color"
              />
            </div>
          </div>

          {/* ── ALL 6 EXPANDED DROPDOWNS (Pixel-perfect to user's layout) ── */}
          <div className="space-y-3 pt-1">
            {/* Row 1: Font Weight & Text Casing */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Font Weight</label>
                <select
                  value={customWeight}
                  onChange={(e) => setCustomWeight(Number(e.target.value))}
                  className="bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
                >
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Text Casing</label>
                <select
                  value={customTransform}
                  onChange={(e) => setCustomTransform(e.target.value)}
                  className="bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
                >
                  {TEXT_CASING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Dark Outline & Shadow & Glow */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Dark Outline</label>
                <select
                  value={customOutline}
                  onChange={(e) => setCustomOutline(e.target.value)}
                  className="bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
                >
                  {DARK_OUTLINE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Shadow &amp; Glow</label>
                <select
                  value={customShadow}
                  onChange={(e) => setCustomShadow(e.target.value)}
                  className="bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
                >
                  {SHADOW_GLOW_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Background Pill & Kinetic Animation */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Background Pill</label>
                <select
                  value={customContainer}
                  onChange={(e) => setCustomContainer(e.target.value)}
                  className="bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
                >
                  {BACKGROUND_PILL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Kinetic Animation</label>
                <select
                  value={customAnimation}
                  onChange={(e) => setCustomAnimation(e.target.value)}
                  className="bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
                >
                  {KINETIC_ANIMATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Save to My Styles Section */}
          <div className="pt-2 border-t border-[#242428] flex flex-col gap-2">
            <span className="text-[11px] font-bold text-zinc-300">Save This Style to Presets</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customStyleName}
                onChange={(e) => setCustomStyleName(e.target.value)}
                placeholder="Style Name (e.g. Viral Shorts Gold Punch)..."
                className="flex-1 bg-[#121215] border border-[#25252B] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleSaveCustomStyle}
                className="px-3.5 py-2 rounded-lg bg-[#22222A] hover:bg-[#2C2C36] border border-[#353542] hover:border-blue-500/40 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5 text-blue-400" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: SAVED CUSTOM STYLES */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'saved' && (
        <div className="flex-1 overflow-y-auto min-h-0 p-3.5 space-y-3 custom-scrollbar">
          {savedCustomStyles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs gap-2 text-center p-4">
              <Bookmark className="w-8 h-8 text-zinc-600" />
              <span>No custom styles saved yet.</span>
              <button
                type="button"
                onClick={() => setActiveTab('customizer')}
                className="mt-1 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold cursor-pointer transition-colors"
              >
                Open Style Customizer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {savedCustomStyles.map((style) => (
                <div
                  key={style.id}
                  className="group relative rounded-xl border border-[#242424] hover:border-[#383842] p-3 bg-[#181818] hover:bg-[#1D1D22] transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {style.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (onApplyPreset) onApplyPreset(style);
                          triggerFeedback(`Applied "${style.name}"`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedStyle(style.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-[#251518] transition-colors cursor-pointer"
                        title="Delete saved style"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0C0C0F] border border-[#23232A] rounded-lg p-3.5 flex items-center justify-center text-center min-h-[50px] overflow-hidden">
                    <span
                      className={`text-base sm:text-lg leading-tight select-none ${style.className || ''}`}
                      style={{ color: style.color || '#FFFFFF', fontFamily: style.fontFamily }}
                    >
                      {effectiveCustomPreviewText}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-500 truncate font-mono-studio">
                    {style.styleDescription || style.fontFamily}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextPane;
