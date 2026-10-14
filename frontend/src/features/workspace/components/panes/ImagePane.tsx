import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Search,
  Check,
  X,
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
      searchQuery.trim() === '' ||
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
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Backdrop Images
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            1080P HD
          </span>
        </div>

        <span className="text-[10px] font-mono-studio text-[#A1A1AA]">
          {filteredImages.length} Photos
        </span>
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'stoic', label: 'Stoic' },
            { id: 'gym', label: 'Gym' },
            { id: 'cyber', label: 'Cyber' },
            { id: 'nature', label: 'Nature' },
            { id: 'minimal', label: 'Minimal' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              selectedCategory === tab.id
                ? 'text-white border-white'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock photos..."
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

        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-2">
          {filteredImages.map((img) => {
            const isSelected = activeImageUrl === img.url || selectedId === img.id;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => handleApply(img)}
                className={`group relative rounded-xl border overflow-hidden aspect-[9/14] bg-[#1C1C20] transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 shadow-lg'
                    : 'border-[#2A2A30] hover:border-[#3A3A42]'
                }`}
              >
                <img
                  src={img.thumbnail}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                    {img.title}
                  </p>
                  <p className="text-[9px] text-[#A1A1AA] truncate">by {img.author}</p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-[#3B82F6] text-white shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImagePane;
