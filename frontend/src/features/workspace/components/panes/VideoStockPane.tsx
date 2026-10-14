import React, { useState, useRef } from 'react';
import {
  Film,
  Play,
  Check,
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
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Film className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Video Loops &amp; Motion
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            1080x1920
          </span>
        </div>

        <span className="text-[10px] font-mono-studio text-[#A1A1AA]">
          {filteredVideos.length} Clips
        </span>
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'gym', label: 'Gym' },
            { id: 'clouds', label: 'Clouds' },
            { id: 'city', label: 'City' },
            { id: 'ocean', label: 'Ocean' },
            { id: 'fire', label: 'Fire' },
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
        <div className="grid grid-cols-2 gap-2">
          {filteredVideos.map((vid) => {
            const isSelected = activeVideoUrl === vid.videoUrl || selectedId === vid.id;
            const isHovered = hoveredId === vid.id;

            return (
              <div
                key={vid.id}
                onClick={() => handleApply(vid)}
                onMouseEnter={() => handleMouseEnter(vid.id)}
                onMouseLeave={() => handleMouseLeave(vid.id)}
                className={`group relative rounded-xl border overflow-hidden aspect-[9/14] bg-[#1C1C20] transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 shadow-lg'
                    : 'border-[#2A2A30] hover:border-[#3A3A42]'
                }`}
              >
                <img
                  src={vid.posterUrl}
                  alt={vid.title}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isHovered ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading="lazy"
                />

                <video
                  ref={(el) => {
                    videoRefs.current[vid.id] = el;
                  }}
                  src={vid.videoUrl}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                  muted
                  loop
                  playsInline
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                <div className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 text-white/90 backdrop-blur-xs">
                  <Play className="w-3 h-3 fill-white" />
                </div>

                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                    {vid.title}
                  </p>
                  <p className="text-[9px] text-[#A1A1AA] truncate">
                    {vid.duration} • {vid.resolution}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-[#3B82F6] text-white shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VideoStockPane;
