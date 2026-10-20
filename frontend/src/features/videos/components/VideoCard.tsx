import React, { useState, useRef } from 'react';
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
  Flame,
} from 'lucide-react';
import { WebsiteVideo } from '../types';
import { apiUrl } from '@/src/shared/utils/api';

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
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Resolve video URL properly (supports relative /api/videos/... paths)
  const resolvedVideoUrl = React.useMemo(() => {
    if (!video.videoUrl) return '';
    const raw = video.videoUrl.trim();
    if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    return apiUrl(raw.startsWith('/') ? raw : `/${raw}`);
  }, [video.videoUrl]);

  // Resolve cover image properly (supports relative /api/media/... paths)
  const coverSrc = React.useMemo(() => {
    if (imgError || !video?.coverImageUrl) return '';
    const raw = video.coverImageUrl.trim();
    if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    return apiUrl(raw.startsWith('/') ? raw : `/${raw}`);
  }, [video?.coverImageUrl, imgError]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && resolvedVideoUrl) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onPlay(video)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#141414] hover:bg-[#181818] border border-[#262626] hover:border-[#3B82F6]/50 transition-all duration-200 cursor-pointer shadow-lg"
      >
        {/* Left: Thumbnail / Live Video Preview & Main Info */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Media Container */}
          <div className="relative w-22 h-32 sm:w-26 sm:h-36 rounded-xl overflow-hidden shrink-0 bg-[#1E1E1E] border border-[#2E2E2E] group-hover:border-[#3B82F6]/50 transition-colors">
            {/* Live Video Preview on Hover */}
            {resolvedVideoUrl && (
              <video
                ref={videoRef}
                src={resolvedVideoUrl}
                poster={coverSrc}
                muted
                loop
                playsInline
                preload="metadata"
                onCanPlay={() => setVideoLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isHovered ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            )}

            {/* Static High-Res Cover Image */}
            <img
              src={coverSrc}
              alt={video.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none z-15" />

            {/* Play overlay button */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/40 z-20 ${
              isHovered ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="w-9 h-9 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 ml-0.5 fill-white" />
              </div>
            </div>

            {/* Live Preview Indicator on Hover */}
            {isHovered && resolvedVideoUrl && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md z-25 animate-pulse">
                Preview
              </span>
            )}

            {/* Duration pill */}
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-white backdrop-blur-xs z-20">
              {video.duration || '00:25'}
            </span>

            {/* Ratio badge */}
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#3B82F6]/90 text-white z-20">
              {video.aspectRatio || '9:16'}
            </span>
          </div>

          {/* Info Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
                {video.category}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Rendered Video
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#60A5FA] transition-colors truncate">
              {video.title}
            </h3>

            <p className="text-xs text-[#9CA3AF] line-clamp-2 italic font-serif">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            title="Preview Video Player"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Play</span>
          </button>

          <button
            onClick={() => onEditInStudio(video)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F1F1F] hover:bg-[#282828] text-[#9CA3AF] hover:text-white text-xs font-semibold border border-[#303030] hover:border-[#404040] transition-colors cursor-pointer"
            title="Open in AI Video Studio"
          >
            <Wand2 className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span className="hidden md:inline">Edit</span>
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

  // Grid Mode (Card layout with live hover video preview)
  return (
    <div
      onClick={() => onPlay(video)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col rounded-2xl bg-[#131313] hover:bg-[#161616] border border-[#262626] hover:border-[#3B82F6]/50 transition-all duration-300 overflow-hidden cursor-pointer shadow-xl hover:shadow-[#3B82F6]/15 flex-1"
    >
      {/* ── Prominent Video Preview / Cover Section ── */}
      <div className="relative w-full aspect-[9/14] sm:aspect-[9/13] overflow-hidden bg-black">
        {/* Live Video Preview on Hover */}
        {resolvedVideoUrl && (
          <video
            ref={videoRef}
            src={resolvedVideoUrl}
            poster={coverSrc}
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovered ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        )}

        {/* High-Definition Theme Cover Backdrop */}
        <img
          src={coverSrc}
          alt={video.title}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-black/60 pointer-events-none z-15" />

        {/* Top Badges (Aspect Ratio, Shorts, and Duration) */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-black/80 backdrop-blur-md text-white border border-white/10 shadow-sm">
              {video.aspectRatio || '9:16'}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#3B82F6] backdrop-blur-md text-white shadow-sm flex items-center gap-1">
              <Film className="w-2.5 h-2.5" />
              Shorts
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isHovered && resolvedVideoUrl && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500 text-black shadow-lg animate-pulse">
                Playing
              </span>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/80 backdrop-blur-md text-white border border-white/10">
              <Clock className="w-2.5 h-2.5 text-[#60A5FA]" />
              <span>{video.duration || '00:25'}</span>
            </div>
          </div>
        </div>

        {/* Center Hover Action Pill */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 z-20 ${
          isHovered ? 'opacity-100 bg-black/20' : 'opacity-0 bg-black/40'
        }`}>
          <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(video);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-2xl transition-all cursor-pointer scale-100 hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Video</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditInStudio(video);
              }}
              className="p-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs border border-white/20 transition-all cursor-pointer hover:border-[#60A5FA]"
              title="Open in AI Video Studio"
            >
              <Wand2 className="w-4 h-4 text-[#60A5FA]" />
            </button>
          </div>
        </div>

        {/* Bottom Cover Tag (Category) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[#E5E5E5] border border-white/10 truncate max-w-[70%]">
            {video.category}
          </span>
          <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded">
            Ready
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
