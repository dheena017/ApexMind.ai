import React, { useState } from 'react';
import {
  Play,
  Wand2,
  Copy,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Volume2,
  Film,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { WebsiteVideo } from '../types';

interface VideoCardProps {
  video: WebsiteVideo;
  viewMode?: 'grid' | 'list';
  onPlay: (video: WebsiteVideo) => void;
  onEditInStudio: (video: WebsiteVideo) => void;
  onDelete: (videoId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  viewMode = 'grid',
  onPlay,
  onEditInStudio,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`"${video.quote}" - ${video.title}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${video.title}" from your Website Video Library?`)) {
      setDeleting(true);
      onDelete(video.id);
    }
  };

  const formattedDate = (() => {
    try {
      const d = new Date(video.createdAt);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return video.createdAt;
    }
  })();

  // Fallback cover image if error or missing
  const coverSrc = imgError || !video.coverImageUrl
    ? 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    : video.coverImageUrl;

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onPlay(video)}
        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#141414] hover:bg-[#181818] border border-[#262626] hover:border-[#3B82F6]/40 transition-all duration-200 cursor-pointer shadow-lg"
      >
        {/* Left: Thumbnail & Main Info */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Cover Image Container */}
          <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-[#1E1E1E] border border-[#2E2E2E] group-hover:border-[#3B82F6]/50 transition-colors">
            <img
              src={coverSrc}
              alt={video.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Play overlay button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-lg">
                <Play className="w-4 h-4 ml-0.5 fill-white" />
              </div>
            </div>

            {/* Duration pill */}
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-white backdrop-blur-xs">
              {video.duration || '00:30'}
            </span>

            {/* Ratio badge */}
            <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-bold bg-[#3B82F6]/90 text-white">
              {video.aspectRatio || '9:16'}
            </span>
          </div>

          {/* Info Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#202020] text-[#9CA3AF] border border-[#303030]">
                {video.category}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Website Studio
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#60A5FA] transition-colors truncate">
              {video.title}
            </h3>

            <p className="text-xs text-[#9CA3AF] line-clamp-1 italic font-serif">
              "{video.quote}"
            </p>

            <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
              <span className="flex items-center gap-1 text-[#9CA3AF]">
                <Volume2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                {video.voice}
              </span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onPlay(video)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F1F1F] hover:bg-[#282828] text-white text-xs font-semibold border border-[#303030] hover:border-[#404040] transition-colors cursor-pointer"
            title="Preview Video Player"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span className="hidden md:inline">Play</span>
          </button>

          <button
            onClick={() => onEditInStudio(video)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 text-[#60A5FA] text-xs font-semibold border border-[#3B82F6]/30 hover:border-[#3B82F6]/50 transition-colors cursor-pointer"
            title="Open in AI Video Studio"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Edit in Studio</span>
          </button>

          <button
            onClick={handleCopyQuote}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] text-[#9CA3AF] hover:text-white border border-[#2E2E2E] transition-colors cursor-pointer"
            title={copied ? 'Quote Copied!' : 'Copy Quote Text'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-red-500/15 text-[#9CA3AF] hover:text-red-400 border border-[#2E2E2E] hover:border-red-500/30 transition-colors cursor-pointer"
            title="Delete Video"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Grid Mode (Default card layout showcasing the cover image)
  return (
    <div
      onClick={() => onPlay(video)}
      className="group relative flex flex-col rounded-2xl bg-[#131313] hover:bg-[#161616] border border-[#262626] hover:border-[#3B82F6]/50 transition-all duration-300 overflow-hidden cursor-pointer shadow-xl hover:shadow-[#3B82F6]/10 flex-1"
    >
      {/* ── Prominent Cover Image Section ── */}
      <div className="relative w-full aspect-[9/13] overflow-hidden bg-[#1A1A1A]">
        <img
          src={coverSrc}
          alt={video.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-black/60 pointer-events-none" />

        {/* Top Badges (Aspect Ratio & Duration) */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/10 shadow-sm">
              {video.aspectRatio || '9:16'}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#3B82F6]/90 backdrop-blur-md text-white shadow-sm flex items-center gap-1">
              <Film className="w-2.5 h-2.5" />
              Shorts
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/75 backdrop-blur-md text-white border border-white/10">
            <Clock className="w-2.5 h-2.5 text-[#60A5FA]" />
            <span>{video.duration || '00:30'}</span>
          </div>
        </div>

        {/* Center Hover Action Pill */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/40 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(video);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-2xl transition-all cursor-pointer scale-100 hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Preview</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditInStudio(video);
              }}
              className="p-2 rounded-xl bg-black/75 hover:bg-black text-white text-xs border border-white/20 transition-all cursor-pointer hover:border-[#60A5FA]"
              title="Open in AI Video Studio"
            >
              <Wand2 className="w-4 h-4 text-[#60A5FA]" />
            </button>
          </div>
        </div>

        {/* Bottom Cover Tag (Category) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[#E5E5E5] border border-white/10 truncate max-w-[70%]">
            {video.category}
          </span>
          <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
            Website Only
          </span>
        </div>
      </div>

      {/* ── Content Details Section ── */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3 bg-[#131313]">
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#60A5FA] transition-colors line-clamp-1 leading-snug">
            {video.title}
          </h3>

          <p className="text-xs text-[#9CA3AF] line-clamp-2 italic font-serif leading-relaxed">
            "{video.quote}"
          </p>
        </div>

        {/* Footer Meta & Quick Buttons */}
        <div className="pt-2.5 border-t border-[#222222] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] truncate">
            <Volume2 className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
            <span className="font-medium text-white truncate">{video.voice}</span>
            <span className="text-[#555555]">·</span>
            <span className="text-[10px] text-[#777777] shrink-0">{formattedDate}</span>
          </div>

          {/* Quick Icon Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCopyQuote}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#202020] transition-colors cursor-pointer"
              title={copied ? 'Quote Copied!' : 'Copy Quote'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => onEditInStudio(video)}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#60A5FA] hover:bg-[#3B82F6]/10 transition-colors cursor-pointer"
              title="Edit in Studio"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Delete Video"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
