import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Wand2,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  Layers,
  Clock,
  Mic,
  Tag,
  Share2,
} from 'lucide-react';
import { WebsiteVideo } from '../types';

interface VideoPlayerModalProps {
  video: WebsiteVideo | null;
  onClose: () => void;
  onEditInStudio: (video: WebsiteVideo) => void;
  onDelete: (videoId: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onEditInStudio,
  onDelete,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);
  }, [video?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`"${video.quote}" - ${video.title}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const textContent = `=== ${video.title} ===
Category: ${video.category}
Voice: ${video.voice}
Duration: ${video.duration}

[HOOK]:
${video.hook || 'N/A'}

[QUOTE]:
"${video.quote}"

[CTA]:
${video.cta || 'N/A'}

[TAGS]:
${video.tags || ''}
`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.title.replace(/\s+/g, '_')}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parsedTags: string[] = (() => {
    if (!video.tags) return [];
    if (Array.isArray(video.tags)) return video.tags;
    try {
      const parsed = JSON.parse(video.tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof video.tags === 'string'
        ? video.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    }
  })();


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-sans-studio">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#121212] border border-[#2D2D2D] rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10">
        {/* Close Button Top-Right on Mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-[#9CA3AF] hover:text-white border border-white/10 transition-colors cursor-pointer"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Left: Video Player Frame (9:16 Shorts Presentation) ── */}
        <div className="lg:w-[380px] shrink-0 bg-[#080808] border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col items-center justify-center p-4 sm:p-6 relative">
          <div className="relative w-[210px] sm:w-[240px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-[#333333] bg-black flex items-center justify-center group select-none">
            {/* Live Video Element or Animated Backdrop */}
            {video.videoUrl ? (
              <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.coverImageUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={video.coverImageUrl}
                  alt={video.title}
                  className={`w-full h-full object-cover transition-transform duration-1000 ${
                    isPlaying ? 'scale-110' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
              </div>
            )}

            {/* Floating Dynamic Motivational Typography Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none z-10 text-center">
              {/* Top watermark / category */}
              <div className="pt-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-black/60 backdrop-blur-md text-[#60A5FA] border border-[#3B82F6]/30 shadow-md">
                  {video.category.split('&')[0]}
                </span>
              </div>

              {/* Center quote typography */}
              <div className="px-2">
                <p className="text-white text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                  "{video.quote}"
                </p>
                {video.hook && (
                  <p className="text-[#FBBF24] text-[10px] font-bold mt-2 drop-shadow-md">
                    {video.hook}
                  </p>
                )}
              </div>

              {/* Bottom handle watermark */}
              <div className="pb-2">
                <span className="text-[10px] font-bold text-white/80 tracking-wider">
                  @ApexMind.ai
                </span>
              </div>
            </div>

            {/* Play/Pause Hover Toggle Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors cursor-pointer"
            >
              {!isPlaying && (
                <div className="w-12 h-12 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-2xl transform scale-100 hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 ml-0.5 fill-white" />
                </div>
              )}
            </button>

            {/* Video Controls Bottom Bar */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 z-20">
              <button
                onClick={togglePlay}
                className="text-white hover:text-[#60A5FA] transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>

              {/* Progress bar */}
              <div className="flex-1 mx-2 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3B82F6] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                onClick={toggleMute}
                className="text-white hover:text-[#60A5FA] transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#9CA3AF]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Website Video Player</span>
            <span>•</span>
            <span>{video.aspectRatio || '9:16'} Shorts</span>
          </div>
        </div>

        {/* ── Right: Script & Details Section ── */}
        <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-6 max-h-[75vh] lg:max-h-none">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 uppercase tracking-wider">
                {video.category}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1F1F1F] text-[#9CA3AF] border border-[#303030]">
                {video.status === 'ready' ? 'Studio Rendered' : video.status}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {video.title}
            </h2>
          </div>

          {/* Metadata Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626]">
              <span className="block text-[10px] font-medium text-[#777777] uppercase tracking-wider">
                Voice Persona
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                <Mic className="w-3 h-3 text-[#3B82F6]" />
                {video.voice}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626]">
              <span className="block text-[10px] font-medium text-[#777777] uppercase tracking-wider">
                Format
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                <Layers className="w-3 h-3 text-purple-400" />
                {video.aspectRatio} Vertical
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626] col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-medium text-[#777777] uppercase tracking-wider">
                Duration
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-amber-400" />
                {video.duration || '00:30'}
              </span>
            </div>
          </div>

          {/* Script Monologues */}
          <div className="space-y-3">
            {video.hook && (
              <div className="p-3 rounded-xl bg-[#171717] border border-[#262626]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FBBF24]">
                  Visual Hook
                </span>
                <p className="text-xs text-[#D1D5DB] mt-1 font-medium">{video.hook}</p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#303030]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#60A5FA]">
                Core Motivational Quote
              </span>
              <p className="text-sm text-white mt-1 italic font-serif leading-relaxed">
                "{video.quote}"
              </p>
            </div>

            {video.cta && (
              <div className="p-3 rounded-xl bg-[#171717] border border-[#262626]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Call to Action (CTA)
                </span>
                <p className="text-xs text-[#D1D5DB] mt-1 font-medium">{video.cta}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {parsedTags.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#888888] flex items-center gap-1 mb-2">
                <Tag className="w-3 h-3" />
                Tags & Viral Hashtags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsedTags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#1C1C1C] text-[#9CA3AF] border border-[#2B2B2B]"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-[#262626] flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                onEditInStudio(video);
                onClose();
              }}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>Edit in AI Studio</span>
            </button>

            <button
              onClick={handleCopyQuote}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-white text-xs font-semibold border border-[#2E2E2E] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#9CA3AF]" />
                  <span>Copy Quote</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadScript}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-white text-xs font-semibold border border-[#2E2E2E] transition-colors cursor-pointer"
              title="Download script text"
            >
              <Download className="w-4 h-4 text-[#9CA3AF]" />
              <span>Script</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete "${video.title}"?`)) {
                  onDelete(video.id);
                  onClose();
                }
              }}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
              title="Delete Video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
