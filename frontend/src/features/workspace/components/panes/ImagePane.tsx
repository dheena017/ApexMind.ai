import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Search,
  Check,
  Sparkles,
  ExternalLink,
  Filter,
} from 'lucide-react';

export interface StockImageItem {
  id: string;
  title: string;
  category: 'stoic' | 'gym' | 'cyber' | 'nature' | 'minimal';
  url: string;
  thumbnail: string;
  author: string;
  resolution: string;
}

export interface ImagePaneProps {
  onSelectImage: (imageUrl: string) => void;
  activeImageUrl?: string;
}

const STOCK_IMAGES: StockImageItem[] = [
  {
    id: 'img-1',
    title: 'Dark Misty Mountains Dawn',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    author: 'Kalen Emsley',
    resolution: '1080x1920 HD',
  },
  {
    id: 'img-2',
    title: 'Cyberpunk Neon Tokyo Corridor',
    category: 'cyber',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    author: 'Lorenzo Herrera',
    resolution: '1080x1920 HD',
  },
  {
    id: 'img-3',
    title: 'Heavy Barbell Chalked Hands',
    category: 'gym',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    author: 'Sven Mieke',
    resolution: '1080x1920 HD',
  },
  {
    id: 'img-4',
    title: 'Deep Oceanic Storm Waves',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
    author: 'Silas Baisch',
    resolution: '1080x1920 HD',
  },
  {
    id: 'img-5',
    title: 'Stoic Classical Marble Statue',
    category: 'stoic',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
    author: 'Birmingham Museums',
    resolution: '1080x1920 HD',
  },
  {
    id: 'img-6',
    title: 'Solitary Figure in Dense Fog',
    category: 'stoic',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80',
    author: 'Mitchell Luo',
    resolution: '1080x1920 HD',
  },
  {
    id: 'img-7',
    title: 'Atmospheric Rainy City Night',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=400&q=80',
    author: 'Maxime Baud',
    resolution: '1080x1920 HD',
  },
  {
    id: 'img-8',
    title: 'Golden Hour Mountain Silhouette',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=85',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    author: 'Bailey Zindel',
    resolution: '1080x1920 HD',
  },
];

export const ImagePane: React.FC<ImagePaneProps> = ({
  onSelectImage,
  activeImageUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredImages = STOCK_IMAGES.filter((img) => {
    const matchesCategory = selectedCategory === 'all' || img.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleApply = (img: StockImageItem) => {
    setSelectedId(img.id);
    onSelectImage(img.url);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
  };

  return (
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-4">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Stock Images</h2>
            <p className="text-[10px] text-[#9CA3AF]">Royalty-Free Vertical 9:16 Backdrops</p>
          </div>
        </div>

        <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-full bg-[#181818] border border-[#2F2F2F] text-[#9CA3AF]">
          Unsplash Open
        </span>
      </div>

      {/* ── Search Input ─────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search mountains, gym, stoic, neon, ocean..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#262626] bg-[#0E0E0E] text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
        />
      </div>

      {/* ── Category Chips ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Photos' },
          { id: 'stoic', label: 'Stoic & Dark' },
          { id: 'gym', label: 'Gym & Iron' },
          { id: 'cyber', label: 'Cyberpunk' },
          { id: 'nature', label: 'Nature' },
          { id: 'minimal', label: 'Minimalist' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'bg-[#141414] border border-[#262626] text-[#9CA3AF] hover:text-white hover:border-[#404040]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Image Grid ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider px-1">
          <span>Curated Vertical Frames ({filteredImages.length})</span>
          <span className="text-[10px] lowercase font-normal text-[#71717A]">click to apply as backdrop</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {filteredImages.map((img) => {
            const isCurrent = activeImageUrl === img.url || selectedId === img.id;
            return (
              <div
                key={img.id}
                onClick={() => handleApply(img)}
                className={`group relative flex flex-col rounded-xl border overflow-hidden bg-[#141414] transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 scale-[1.01]'
                    : 'border-[#262626] hover:border-[#404040]'
                }`}
              >
                {/* 4:5 vertical thumbnail */}
                <div className="relative aspect-[4/5] w-full bg-[#0E0E0E] overflow-hidden">
                  <img
                    src={img.thumbnail}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {isCurrent && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-md z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="absolute bottom-1.5 inset-x-1.5 text-left">
                    <p className="text-[10px] font-bold text-white truncate leading-tight">
                      {img.title}
                    </p>
                    <p className="text-[8px] text-[#A1A1AA] truncate font-mono-studio">
                      by {img.author}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 flex items-center justify-between text-[9px] font-mono-studio text-[#71717A]">
                  <span>{img.resolution}</span>
                  <span className="text-[#3B82F6] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Apply →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
