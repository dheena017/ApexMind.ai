import React, { useState, useRef } from 'react';
import {
  Film,
  Play,
  Pause,
  Check,
  Sparkles,
  Search,
  Flame,
  Activity,
  Layers,
} from 'lucide-react';

export interface StockVideoItem {
  id: string;
  title: string;
  category: 'gym' | 'clouds' | 'city' | 'ocean' | 'fire';
  videoUrl: string;
  posterUrl: string;
  duration: string;
  resolution: string;
}

export interface VideoStockPaneProps {
  onSelectVideo: (videoUrl: string) => void;
  activeVideoUrl?: string;
}

const STOCK_VIDEOS: StockVideoItem[] = [
  {
    id: 'vid-1',
    title: 'Cinematic Clouds & Mountain Drone',
    category: 'clouds',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    duration: '15s Loop',
    resolution: '1080x1920',
  },
  {
    id: 'vid-2',
    title: 'Heavy Barbell Gym Deadlift Grit',
    category: 'gym',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    duration: '20s Loop',
    resolution: '1080x1920',
  },
  {
    id: 'vid-3',
    title: 'Cyberpunk Neon Traffic Lights',
    category: 'city',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    duration: '12s Loop',
    resolution: '1080x1920',
  },
  {
    id: 'vid-4',
    title: 'Deep Oceanic Storm Mist Waves',
    category: 'ocean',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
    duration: '18s Loop',
    resolution: '1080x1920',
  },
  {
    id: 'vid-5',
    title: 'Glowing Fire Sparks & Embers',
    category: 'fire',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80',
    duration: '10s Loop',
    resolution: '1080x1920',
  },
];

export const VideoStockPane: React.FC<VideoStockPaneProps> = ({
  onSelectVideo,
  activeVideoUrl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const filteredVideos = STOCK_VIDEOS.filter((vid) => {
    if (selectedCategory === 'all') return true;
    return vid.category === selectedCategory;
  });

  const handleMouseEnter = (id: string) => {
    setHoveredId(id);
    const video = videoRefs.current[id];
    if (video) {
      video.play().catch(() => {});
    }
  };

  const handleMouseLeave = (id: string) => {
    setHoveredId(null);
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  const handleApply = (vid: StockVideoItem) => {
    setSelectedId(vid.id);
    onSelectVideo(vid.videoUrl);
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
  };

  return (
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-4">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Stock Videos</h2>
            <p className="text-[10px] text-[#9CA3AF]">9:16 Vertical B-Roll Video Loops</p>
          </div>
        </div>

        <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-full bg-[#181818] border border-[#2F2F2F] text-[#9CA3AF]">
          Open Source B-Roll
        </span>
      </div>

      {/* ── Category Chips ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Loops' },
          { id: 'clouds', label: 'Dark Clouds' },
          { id: 'gym', label: 'Gym & Iron' },
          { id: 'city', label: 'Neon City' },
          { id: 'ocean', label: 'Ocean Waves' },
          { id: 'fire', label: 'Embers & Fire' },
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

      {/* ── Video Grid ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider px-1">
          <span>Cinematic Vertical Loops ({filteredVideos.length})</span>
          <span className="text-[10px] lowercase font-normal text-[#71717A]">hover to preview clip</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {filteredVideos.map((vid) => {
            const isCurrent = activeVideoUrl === vid.videoUrl || selectedId === vid.id;
            const isHovered = hoveredId === vid.id;

            return (
              <div
                key={vid.id}
                onClick={() => handleApply(vid)}
                onMouseEnter={() => handleMouseEnter(vid.id)}
                onMouseLeave={() => handleMouseLeave(vid.id)}
                className={`group relative flex flex-col rounded-xl border overflow-hidden bg-[#141414] transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 scale-[1.01]'
                    : 'border-[#262626] hover:border-[#404040]'
                }`}
              >
                {/* 4:5 aspect thumbnail/video */}
                <div className="relative aspect-[4/5] w-full bg-[#0E0E0E] overflow-hidden">
                  <video
                    ref={(el) => {
                      videoRefs.current[vid.id] = el;
                    }}
                    src={vid.videoUrl}
                    poster={vid.posterUrl}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                  {/* Play icon overlay if not hovered */}
                  {!isHovered && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Applied Checkmark */}
                  {isCurrent && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-md z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Duration Tag */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[8px] font-mono-studio text-[#E5E5E5]">
                    {vid.duration}
                  </div>

                  <div className="absolute bottom-1.5 inset-x-1.5 text-left pointer-events-none">
                    <p className="text-[10px] font-bold text-white truncate leading-tight">
                      {vid.title}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 flex items-center justify-between text-[9px] font-mono-studio text-[#71717A]">
                  <span>{vid.resolution}</span>
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
