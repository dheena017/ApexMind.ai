import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Bookmark,
  RefreshCw,
  Sliders,
  Eye,
  RotateCcw,
  Sun,
  Contrast,
  Droplets,
  Layers,
  History,
} from 'lucide-react';
import { workspaceApi } from '../../api/workspaceApi';

export interface StockImageItem {
  id: string;
  title: string;
  category: 'stoic' | 'gym' | 'cyber' | 'nature' | 'minimal' | 'architecture';
  url: string;
  thumbnail: string;
  author: string;
  resolution: string;
  tags?: string[];
}

export interface ImagePaneProps {
  onSelectImage: (imageUrl: string) => void;
  activeImageUrl?: string;
}

import { CURATED_STOCK_IMAGES as EXPANDED_IMAGES } from '../../data/mediaCatalogData';

const CURATED_STOCK_IMAGES: StockImageItem[] = [
  ...EXPANDED_IMAGES.map((img) => ({
    id: img.id,
    title: img.title,
    category: (img.category === 'stoic' ? 'stoic' : img.category === 'gym' ? 'gym' : img.category === 'cyber' ? 'cyber' : img.category === 'luxury' ? 'architecture' : img.category === 'cosmos' ? 'nature' : 'minimal') as any,
    url: img.url,
    thumbnail: img.thumbnail,
    author: img.author,
    resolution: img.resolution,
    tags: img.tags,
  })),
  {
    id: 'img-2',
    title: 'Cyberpunk Neon Tokyo Corridor',
    category: 'cyber',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    author: 'Lorenzo Herrera',
    resolution: '1080x1920 HD',
    tags: ['neon', 'cyberpunk', 'city', 'night'],
  },
  {
    id: 'img-3',
    title: 'Heavy Barbell Chalked Hands',
    category: 'gym',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    author: 'Sven Mieke',
    resolution: '1080x1920 HD',
    tags: ['gym', 'grit', 'iron', 'workout'],
  },
  {
    id: 'img-4',
    title: 'Deep Oceanic Storm Waves',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
    author: 'Silas Baisch',
    resolution: '1080x1920 HD',
    tags: ['ocean', 'storm', 'power', 'nature'],
  },
  {
    id: 'img-5',
    title: 'Marcus Aurelius Roman Marble Statue',
    category: 'stoic',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
    author: 'Birmingham Museums',
    resolution: '1080x1920 HD',
    tags: ['statue', 'stoic', 'marble', 'rome'],
  },
  {
    id: 'img-6',
    title: 'Solitary Figure in Dense Fog',
    category: 'stoic',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80',
    author: 'Mitchell Luo',
    resolution: '1080x1920 HD',
    tags: ['solitary', 'fog', 'mystery', 'lone'],
  },
  {
    id: 'img-7',
    title: 'Atmospheric Rainy City Night',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=400&q=80',
    author: 'Maxime Baud',
    resolution: '1080x1920 HD',
    tags: ['rain', 'night', 'moody', 'dark'],
  },
  {
    id: 'img-8',
    title: 'Golden Hour Mountain Silhouette',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    author: 'Bailey Zindel',
    resolution: '1080x1920 HD',
    tags: ['golden-hour', 'silhouette', 'horizon'],
  },
  {
    id: 'img-9',
    title: 'Ancient Greek Temple Columns',
    category: 'architecture',
    url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=400&q=80',
    author: 'Sorin Gheorghita',
    resolution: '1080x1920 HD',
    tags: ['greece', 'columns', 'temple', 'ancient'],
  },
  {
    id: 'img-10',
    title: 'Athletic Runner Concrete Grit',
    category: 'gym',
    url: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=400&q=80',
    author: 'Chander R',
    resolution: '1080x1920 HD',
    tags: ['running', 'sprint', 'discipline', 'athlete'],
  },
  {
    id: 'img-11',
    title: 'Moody Obsidian Stone Texture',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=400&q=80',
    author: 'Mourad Saadi',
    resolution: '1080x1920 HD',
    tags: ['stone', 'black', 'texture', 'minimal'],
  },
  {
    id: 'img-12',
    title: 'Electric Violet Cyber Highway',
    category: 'cyber',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    author: 'Florian Olivo',
    resolution: '1080x1920 HD',
    tags: ['highway', 'speed', 'violet', 'future'],
  },
];

const SEARCH_TOPIC_CHIPS = [
  '#stoic',
  '#statue',
  '#gym',
  '#discipline',
  '#fog',
  '#rain',
  '#neon',
  '#cyberpunk',
  '#mountains',
  '#night',
  '#minimal',
];

const LOCAL_STORAGE_KEY = 'apexmind_custom_images';
const RECENT_IMAGES_KEY = 'apexmind_recent_images';

export const ImagePane: React.FC<ImagePaneProps> = ({
  onSelectImage,
  activeImageUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'url' | 'filters' | 'saved'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [images, setImages] = useState<StockImageItem[]>(CURATED_STOCK_IMAGES);
  const [savedImages, setSavedImages] = useState<StockImageItem[]>([]);
  const [recentImages, setRecentImages] = useState<StockImageItem[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  // Backdrop Image Filter Settings
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0);
  const [vignette, setVignette] = useState<boolean>(true);

  // Load saved & recent images from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) setSavedImages(JSON.parse(stored));
      const recent = localStorage.getItem(RECENT_IMAGES_KEY);
      if (recent) setRecentImages(JSON.parse(recent));
    } catch {}
  }, []);

  // Fetch live media from backend media-library API
  useEffect(() => {
    let isMounted = true;
    const fetchBackendMedia = async () => {
      try {
        setIsLoadingBackend(true);
        const data = await workspaceApi.getMediaLibrary();
        if (isMounted && data?.visualBackdrops?.length) {
          const apiImages: StockImageItem[] = data.visualBackdrops
            .filter((b) => Boolean(b.imageUrl))
            .map((b) => ({
              id: `api-img-${b.id}`,
              title: b.name,
              category: (b.category?.toLowerCase() || 'stoic') as any,
              url: b.imageUrl!,
              thumbnail: b.imageUrl!,
              author: 'Apex Media Engine',
              resolution: '1080x1920 HD',
            }));

          if (apiImages.length > 0) {
            setImages((prev) => {
              const existingIds = new Set(prev.map((i) => i.url));
              const newItems = apiImages.filter((i) => !existingIds.has(i.url));
              return [...newItems, ...prev];
            });
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingBackend(false);
      }
    };
    fetchBackendMedia();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApply = (img: StockImageItem) => {
    setSelectedId(null);
    onSelectImage(img.url);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));

    // Add to recent images
    setRecentImages((prev) => {
      const filtered = prev.filter((i) => i.url !== img.url);
      const updated = [img, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_IMAGES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleStageImage = (img: StockImageItem) => setSelectedId(img.id);

  const [isSearchingOpenverse, setIsSearchingOpenverse] = useState(false);

  const handleSearchOpenverse = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearchingOpenverse(true);
      const res = await workspaceApi.searchOpenImages(searchQuery);
      if (res?.items?.length) {
        const liveItems: StockImageItem[] = res.items.map((it: any) => ({
          id: it.id || `ov-${Date.now()}-${Math.random()}`,
          title: it.title || searchQuery,
          category: 'nature',
          url: it.url,
          thumbnail: it.thumbnail || it.url,
          author: it.author || 'Openverse CC0',
          resolution: it.resolution || '1080x1920 HD',
          tags: it.tags || [searchQuery],
        }));
        setImages((prev) => {
          const existing = new Set(prev.map((p) => p.url));
          const newOnes = liveItems.filter((it) => !existing.has(it.url));
          return [...newOnes, ...prev];
        });
      }
    } finally {
      setIsSearchingOpenverse(false);
    }
  };

  const handleGeneratePollinationsAi = () => {
    const prompt = searchQuery.trim() || 'Cinematic dark moody luxury vertical photography';
    const aiUrl = workspaceApi.getFreeAiImageUrl(prompt);
    const aiItem: StockImageItem = {
      id: `ai-pollinations-${Date.now()}`,
      title: `AI: ${prompt}`,
      category: 'cyber',
      url: aiUrl,
      thumbnail: aiUrl,
      author: 'Pollinations AI (Free)',
      resolution: '1080x1920 4K',
      tags: ['ai', 'generated', 'free'],
    };
    setImages((prev) => [aiItem, ...prev]);
    handleApply(aiItem);
  };

  const handleAddCustomUrl = (saveToFavorites = false) => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    const title = customTitleInput.trim() || 'Custom Web Image';

    const newItem: StockImageItem = {
      id: `custom-${Date.now()}`,
      title,
      category: 'minimal',
      url,
      thumbnail: url,
      author: 'Imported Asset',
      resolution: 'Custom URL',
    };

    handleApply(newItem);

    if (saveToFavorites) {
      const updated = [newItem, ...savedImages];
      setSavedImages(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    }

    setCustomUrlInput('');
    setCustomTitleInput('');
    setUrlPreviewValid(null);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedImages.filter((item) => item.id !== id);
    setSavedImages(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setVignette(true);
  };

  const sourceList = activeTab === 'saved' ? savedImages : images;

  const filteredImages = sourceList.filter((img) => {
    const matchesCategory =
      selectedCategory === 'all' || img.category === selectedCategory;
    const cleanQuery = searchQuery.trim().replace(/^#/, '').toLowerCase();
    const matchesQuery =
      cleanQuery === '' ||
      img.title.toLowerCase().includes(cleanQuery) ||
      img.author.toLowerCase().includes(cleanQuery) ||
      (img.tags && img.tags.some((t) => t.toLowerCase().includes(cleanQuery)));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="w-4 h-4 shrink-0 text-indigo-400" />
          <span className="text-xs font-bold text-white truncate">
            Backdrop Photos
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoadingBackend && (
            <RefreshCw className="w-3.5 h-3.5 text-[#60A5FA] animate-spin" />
          )}
          <span className="text-[10px] font-mono-studio text-[#A1A1AA] bg-[#222226] px-2 py-0.5 rounded-full border border-[#2F2F36]">
            {filteredImages.length} Photos
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Photo Catalog
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('filters')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'filters'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Color Filters</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'url'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Direct URL
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'saved'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Saved ({savedImages.length})</span>
        </button>
      </div>

      {/* ── Category Chips Filter ── */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-1.5 border-b border-[#26262B]/60 bg-[#141416] py-2 shrink-0">
          <div className="flex items-center gap-1.5 px-4 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: 'all', label: 'All Photos' },
                { id: 'stoic', label: 'Stoic Statues' },
                { id: 'gym', label: 'Iron Gym' },
                { id: 'cyber', label: 'Cyberpunk' },
                { id: 'nature', label: 'Dramatic Nature' },
                { id: 'architecture', label: 'Temple & Arch' },
                { id: 'minimal', label: 'Minimalist' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-[#1C1C20] text-[#A1A1AA] hover:text-white hover:bg-[#26262C] border border-[#2A2A30]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Keyword Search Chips */}
          <div className="flex items-center gap-1 px-4 overflow-x-auto custom-scrollbar pt-0.5">
            {SEARCH_TOPIC_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSearchQuery(chip)}
                className="text-[9px] px-2 py-0.5 rounded-full bg-[#1C1C22] text-zinc-400 hover:text-white border border-zinc-800 shrink-0 cursor-pointer transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3.5">
        {/* ── Tab 2: Color Filters & Backdrop Tuning ── */}
        {activeTab === 'filters' ? (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Backdrop Image Grading
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Brightness Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A] flex items-center gap-1">
                    <Sun className="w-3 h-3" /> BRIGHTNESS
                  </span>
                  <span className="text-[#60A5FA] font-bold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Contrast Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A] flex items-center gap-1">
                    <Contrast className="w-3 h-3" /> CONTRAST
                  </span>
                  <span className="text-[#60A5FA] font-bold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Saturation Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A] flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> SATURATION
                  </span>
                  <span className="text-[#60A5FA] font-bold">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Background Blur Slider (For Caption Legibility) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono-studio">
                  <span className="text-[#71717A]">BACKGROUND BLUR (TEXT FOCUS)</span>
                  <span className="text-[#60A5FA] font-bold">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full accent-[#3B82F6]"
                />
              </div>

              {/* Vignette Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-[#26262B]">
                <span className="text-xs text-zinc-300">Cinematic Vignette Shadow</span>
                <button
                  type="button"
                  onClick={() => setVignette((v) => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    vignette ? 'bg-[#3B82F6]' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      vignette ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Filter Presets */}
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-mono-studio text-[#71717A]">
                Quick Cinematic Color Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Moody Dark Stoic', b: 70, c: 130, s: 70, bl: 2 },
                  { name: 'Pure B&W Grayscale', b: 90, c: 140, s: 0, bl: 0 },
                  { name: 'Cyber Neon Glow', b: 110, c: 140, s: 150, bl: 1 },
                  { name: 'Muted Film Look', b: 85, c: 90, s: 80, bl: 0 },
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setBrightness(p.b);
                      setContrast(p.c);
                      setSaturation(p.s);
                      setBlur(p.bl);
                    }}
                    className="p-2 rounded-lg bg-[#141417] hover:bg-[#222228] border border-[#2A2A30] text-left text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'url' ? (
          /* Custom Image URL Importer */
          <div className="flex flex-col gap-4">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs font-bold text-white">Import Custom Image URL</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Paste any high-resolution image URL (Unsplash, Pexels, Imgur, or CDN link) to set as canvas background.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Image Title</label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder="e.g. Cinematic Mountain Sunset"
                  className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Direct Image URL (JPG / PNG / WebP)</label>
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setUrlPreviewValid(null);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Preview Container */}
              {customUrlInput.trim() && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#2A2A30] bg-[#121214] aspect-[9/12] max-h-56 relative flex items-center justify-center">
                  <img
                    src={customUrlInput.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onLoad={() => setUrlPreviewValid(true)}
                    onError={() => setUrlPreviewValid(false)}
                  />
                  {urlPreviewValid === false && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-xs text-rose-400 font-semibold">Unable to load image preview</p>
                      <p className="text-[10px] text-[#A1A1AA] mt-1">Make sure URL allows direct embedding</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddCustomUrl(false)}
                  disabled={!customUrlInput.trim()}
                  className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply to Canvas
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCustomUrl(true)}
                  disabled={!customUrlInput.trim()}
                  className="bg-[#2A2A32] hover:bg-[#34343E] disabled:opacity-50 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-[#3A3A44]"
                  title="Save to My Library"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Catalog or Saved Images Grid */
          <>
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stock photos or #tags..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Free Open-Source API Action Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSearchOpenverse}
                disabled={!searchQuery.trim() || isSearchingOpenverse}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#1E2330] hover:bg-[#252D3F] disabled:opacity-50 border border-[#3B82F6]/30 text-[#60A5FA] text-[10px] font-bold transition-all cursor-pointer shadow-sm"
              >
                {isSearchingOpenverse ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Search className="w-3 h-3" />
                )}
                <span>Search Openverse (Free CC0)</span>
              </button>

              <button
                type="button"
                onClick={handleGeneratePollinationsAi}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-[#2A2438] hover:bg-[#352D47] border border-purple-500/30 text-purple-300 text-[10px] font-bold transition-all cursor-pointer shadow-sm shrink-0"
                title="Generate instant 4K visual via Pollinations AI (100% Free)"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Free AI</span>
              </button>
            </div>

            {/* Recently Used Carousel */}
            {activeTab === 'catalog' && recentImages.length > 0 && !searchQuery && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono-studio text-[#71717A] uppercase flex items-center gap-1">
                  <History className="w-3 h-3" /> Recently Used
                </span>
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {recentImages.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => handleApply(rec)}
                      className="w-16 h-20 rounded-lg overflow-hidden border border-[#2A2A30] hover:border-[#3B82F6] shrink-0 relative group"
                    >
                      <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover" />
                      {activeImageUrl === rec.url && (
                        <div className="absolute inset-0 bg-[#3B82F6]/40 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Saved State */}
            {activeTab === 'saved' && savedImages.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2.5">
                <Bookmark className="w-8 h-8 text-[#52525B]" />
                <p className="text-xs font-bold text-white">No Saved Images Yet</p>
                <p className="text-[11px] text-[#A1A1AA] max-w-xs">
                  Import images using the &ldquo;Direct URL&rdquo; tab to build your custom studio backdrops library.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className="mt-2 bg-[#3B82F6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#2563EB] transition-colors"
                >
                  Import an Image
                </button>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-8 text-center text-xs text-[#A1A1AA]">
                No images matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              /* Image Grid */
              <div className="grid grid-cols-2 gap-2.5">
                {filteredImages.map((img) => {
                  const isSelected = selectedId === img.id || (!selectedId && activeImageUrl === img.url);
                  return (
                    <div
                      key={img.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleStageImage(img)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleStageImage(img);
                        }
                      }}
                      className={`group relative rounded-xl border overflow-hidden aspect-[9/14] bg-[#1C1C20] transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/40'
                          : 'border-[#2A2A30] hover:border-[#3A3A42]'
                      }`}
                    >
                      <img
                        src={img.thumbnail}
                        alt={img.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                      <div className="absolute bottom-2 left-2 right-16">
                        <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                          {img.title}
                        </p>
                        <p className="text-[9px] text-[#A1A1AA] truncate">by {img.author}</p>
                      </div>

                      {/* Resolution Tag */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-mono-studio text-white/80 border border-white/10 uppercase">
                        {img.category}
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleApply(img);
                        }}
                        className="absolute bottom-2 right-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] px-2 py-1 text-[9px] font-bold text-white"
                      >
                        Apply
                      </button>

                      {/* Delete button for Saved images */}
                      {activeTab === 'saved' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSaved(img.id, e);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                          title="Delete from Saved"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ImagePane;
