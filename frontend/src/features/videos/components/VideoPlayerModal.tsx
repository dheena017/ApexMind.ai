import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  RotateCcw,
  Maximize2,
  Minimize2,
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
  AlertCircle,
  Radio,
  Flame,
} from 'lucide-react';
import { WebsiteVideo } from '../types';
import { apiUrl } from '@/src/shared/utils/api';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(25);
  const [imgError, setImgError] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerFrameRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isDraggingSeek = useRef(false);

  // Parse default duration from video metadata (e.g. "00:25" -> 25)
  const defaultDurationSeconds = useMemo(() => {
    if (!video?.duration) return 25;
    const parts = video.duration.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return Math.max(3, parts[0] * 60 + parts[1]);
    }
    return 25;
  }, [video?.duration]);

  // Resolved Audio URL (handling relative /api/audio paths)
  const resolvedAudioUrl = useMemo(() => {
    if (!video?.audioUrl) return '';
    const raw = video.audioUrl.trim();
    if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    return apiUrl(raw.startsWith('/') ? raw : `/${raw}`);
  }, [video?.audioUrl]);

  // Resolved Video URL (handling relative /api/videos paths)
  const resolvedVideoUrl = useMemo(() => {
    if (!video?.videoUrl) return '';
    const raw = video.videoUrl.trim();
    if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    return apiUrl(raw.startsWith('/') ? raw : `/${raw}`);
  }, [video?.videoUrl]);

  // Reset state on video change
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(defaultDurationSeconds);
    setImgError(false);
    setVideoFailed(false);
    setAudioFailed(false);
    setAutoplayBlocked(false);
  }, [video?.id, defaultDurationSeconds]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isPlaying]);

  // Sync media play/pause
  const executePlay = useCallback(async () => {
    let playSuccessful = false;
    try {
      const promises: Promise<void>[] = [];
      if (videoRef.current && !videoFailed && resolvedVideoUrl) {
        promises.push(videoRef.current.play());
      }
      if (audioRef.current && !audioFailed && resolvedAudioUrl) {
        promises.push(audioRef.current.play());
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      playSuccessful = true;
      setAutoplayBlocked(false);
      setIsPlaying(true);
    } catch (err: any) {
      console.warn('Playback initiation note:', err);
      if (err?.name === 'NotAllowedError') {
        // Autoplay policy prevented playback, offer user tap-to-play
        setAutoplayBlocked(true);
        setIsPlaying(false);
      } else {
        // Fallback or retry
        setIsPlaying(true);
      }
    }
  }, [videoFailed, audioFailed, resolvedVideoUrl, resolvedAudioUrl]);

  const executePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      executePause();
    } else {
      executePlay();
    }
  };

  // Attempt automatic start when modal mounts
  useEffect(() => {
    if (!video) return;
    const timer = setTimeout(() => {
      executePlay().catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [video?.id, executePlay]);

  // Fallback timer simulation if there is no audio or video element
  useEffect(() => {
    const hasMedia = (resolvedVideoUrl && !videoFailed) || (resolvedAudioUrl && !audioFailed);
    if (hasMedia || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        if (next >= duration) {
          setProgress(0);
          return 0;
        }
        setProgress((next / duration) * 100);
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, duration, video?.videoUrl, videoFailed, resolvedAudioUrl, audioFailed]);

  // Audio time update handler
  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || duration;
    setCurrentTime(cur);
    if (dur && !isNaN(dur) && dur > 0) {
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  // Video time update handler
  const handleVideoTimeUpdate = () => {
    // If audio is also playing, let audio be master clock
    if (resolvedAudioUrl && !audioFailed && audioRef.current) return;
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(cur);
    if (dur && !isNaN(dur) && dur > 0) {
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  // Audio ended handler (loop playback)
  const handleAudioEnded = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    setCurrentTime(0);
    setProgress(0);
    executePlay().catch(() => {});
  };

  // Volume & Mute Controls
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
    if (audioRef.current) audioRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      if (videoRef.current) videoRef.current.muted = false;
      if (audioRef.current) audioRef.current.muted = false;
    }
    if (videoRef.current) videoRef.current.volume = clamped;
    if (audioRef.current) audioRef.current.volume = clamped;
  };

  // Scrubbing & Seeking
  const performSeek = (clientX: number) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;

    if (videoRef.current && !videoFailed) {
      videoRef.current.currentTime = targetTime;
    }
    if (audioRef.current && !audioFailed) {
      audioRef.current.currentTime = targetTime;
    }
    setCurrentTime(targetTime);
    setProgress(ratio * 100);
  };

  const handleSeekMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingSeek.current = true;
    performSeek(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingSeek.current) {
        performSeek(moveEvent.clientX);
      }
    };

    const onMouseUp = () => {
      isDraggingSeek.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Replay
  const handleReplay = () => {
    if (videoRef.current) videoRef.current.currentTime = 0;
    if (audioRef.current) audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    executePlay().catch(() => {});
  };

  // Toggle Fullscreen on player
  const toggleFullscreen = () => {
    if (!playerFrameRef.current) return;
    if (!document.fullscreenElement) {
      playerFrameRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Copy Quote
  const handleCopyQuote = () => {
    if (!video) return;
    navigator.clipboard.writeText(`"${video.quote}" - ${video.title}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Script
  const handleDownloadScript = () => {
    if (!video) return;
    const textContent = `=== ${video.title} ===
Category: ${video.category}
Voice: ${video.voice}
Duration: ${video.duration || '00:30'}

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

  if (!video) return null;

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

  const coverSrc = useMemo(() => {
    if (imgError || !video?.coverImageUrl) return '';
    const raw = video.coverImageUrl.trim();
    if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    return apiUrl(raw.startsWith('/') ? raw : `/${raw}`);
  }, [video?.coverImageUrl, imgError]);

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs || 0));
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${String(m).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  // Words breakdown for dynamic caption highlight
  const quoteWords = (video.quote || '').split(' ');
  const highlightedWordCount = Math.floor((progress / 100) * quoteWords.length);

  const hasLiveVideo = Boolean(resolvedVideoUrl && !videoFailed);
  const hasLiveAudio = Boolean(resolvedAudioUrl && !audioFailed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans-studio">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Hidden Audio Player for Synchronized AI Voiceover */}
      {resolvedAudioUrl && !audioFailed && (
        <audio
          ref={audioRef}
          src={resolvedAudioUrl}
          preload="auto"
          playsInline
          muted={isMuted}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={(e) => {
            const dur = (e.target as HTMLAudioElement).duration;
            if (dur && !isNaN(dur) && dur > 0) setDuration(dur);
          }}
          onEnded={handleAudioEnded}
          onError={() => {
            console.warn('Audio element load warning; continuing visual preview.');
            setAudioFailed(true);
          }}
        />
      )}

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl lg:max-w-5xl max-h-[94vh] bg-[#121212] border border-[#2D2D2D] rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10">
        {/* Close Button Top-Right on Mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-[#9CA3AF] hover:text-white border border-white/10 transition-colors cursor-pointer"
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Left: Video Player Frame (9:16 Shorts Presentation) ── */}
        <div className="w-full lg:w-[410px] xl:w-[440px] shrink-0 bg-[#080808] border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col items-center justify-center p-3 sm:p-5 relative">
          
          <div
            ref={playerFrameRef}
            className="relative w-full max-w-[270px] sm:max-w-[310px] lg:max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-[#333333] bg-black flex items-center justify-center group select-none"
          >
            {/* Live Video Element OR High-Definition Cover Backdrop */}
            {hasLiveVideo ? (
              <video
                ref={videoRef}
                src={resolvedVideoUrl}
                poster={coverSrc}
                playsInline
                loop
                muted={isMuted}
                preload="metadata"
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={(e) => {
                  const dur = (e.target as HTMLVideoElement).duration;
                  if (!hasLiveAudio && dur && !isNaN(dur) && dur > 0) setDuration(dur);
                }}
                onError={() => {
                  console.warn('Video failed to stream smoothly. Falling back to HD animated backdrop.');
                  setVideoFailed(true);
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden bg-black">
                <img
                  src={coverSrc}
                  alt={video.title}
                  onError={() => setImgError(true)}
                  className={`w-full h-full object-cover transition-transform ease-out duration-1000 ${
                    isPlaying ? 'scale-110' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/60" />
                
                {/* Ambient dynamic glow particle effect */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#3B82F6]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}

            {/* Floating Dynamic Motivational Typography Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none z-10 text-center">
              {/* Top category pill & live status */}
              <div className="pt-2 flex items-center justify-between">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-black/60 backdrop-blur-md text-[#60A5FA] border border-[#3B82F6]/30 shadow-md">
                  {video.category.split('&')[0].trim()}
                </span>
                {hasLiveAudio && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                    <Mic className="w-2.5 h-2.5" />
                    <span>{video.voice}</span>
                  </span>
                )}
              </div>

              {/* Center quote typography with dynamic progress highlight */}
              <div className="px-1.5 sm:px-2 py-4">
                <div className="text-white text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                  {quoteWords.map((word, idx) => {
                    const isPassed = idx <= highlightedWordCount;
                    return (
                      <span
                        key={idx}
                        className={`transition-colors duration-200 inline-block mr-1 ${
                          isPassed
                            ? 'text-white underline decoration-[#3B82F6] decoration-2'
                            : 'text-white/70'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>

                {video.hook && (
                  <div className="mt-2.5 inline-block px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-amber-500/30">
                    <p className="text-[#FBBF24] text-[10px] font-bold drop-shadow-md flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{video.hook}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom: Audio Visualizer Waves (when playing) + Watermark */}
              <div className="pb-10 flex flex-col items-center gap-1.5">
                {isPlaying && (
                  <div className="flex items-center gap-1 h-3">
                    <span className="w-0.5 h-full bg-[#3B82F6] rounded-full animate-pulse" />
                    <span className="w-0.5 h-2/3 bg-[#60A5FA] rounded-full animate-bounce" />
                    <span className="w-0.5 h-full bg-[#3B82F6] rounded-full animate-pulse" />
                    <span className="w-0.5 h-4/5 bg-[#93C5FD] rounded-full animate-bounce" />
                    <span className="w-0.5 h-1/2 bg-[#3B82F6] rounded-full animate-pulse" />
                  </div>
                )}
                <span className="text-[10px] font-bold text-white/75 tracking-wider drop-shadow-md">
                  @ApexMind.ai
                </span>
              </div>
            </div>

            {/* Tap to Unmute Overlay if browser blocked initial autoplay sound */}
            {autoplayBlocked && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-25 cursor-pointer animate-fade-in p-4 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                  <Play className="w-7 h-7 ml-1 fill-white" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Tap to Play & Listen</span>
                  <span className="text-[10px] text-white/70 block">Audio synced with {video.voice} persona</span>
                </div>
              </div>
            )}

            {/* Central Play/Pause Click Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-black/20 transition-colors cursor-pointer"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {!isPlaying && !autoplayBlocked && (
                <div className="w-13 h-13 rounded-full bg-[#3B82F6]/90 hover:bg-[#3B82F6] text-white flex items-center justify-center shadow-2xl transform scale-100 hover:scale-110 transition-transform backdrop-blur-xs">
                  <Play className="w-6 h-6 ml-0.5 fill-white" />
                </div>
              )}
            </button>

            {/* Video Controls Bottom Bar */}
            <div className="absolute bottom-2 inset-x-2 flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 z-20 shadow-2xl">
              
              {/* Scrubbable Progress Bar */}
              <div
                ref={progressBarRef}
                onClick={(e) => performSeek(e.clientX)}
                onMouseDown={handleSeekMouseDown}
                className="group/progress relative h-2 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer flex items-center"
                title="Click or drag to seek"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Scrubber Knob */}
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md transform scale-0 group-hover/progress:scale-100 transition-transform" />
                </div>
              </div>

              {/* Lower Control Buttons Row */}
              <div className="flex items-center justify-between text-white text-xs">
                {/* Left: Play/Pause, Replay, Time Display */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-1 hover:text-[#60A5FA] transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  </button>

                  <button
                    onClick={handleReplay}
                    className="p-1 hover:text-[#60A5FA] transition-colors cursor-pointer text-white/80"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  <span className="text-[10px] font-mono text-[#D1D5DB] tracking-tight">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right: Volume & Fullscreen */}
                <div className="flex items-center gap-2 relative">
                  {/* Volume Slider Container */}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={toggleMute}
                      className="p-1 hover:text-[#60A5FA] transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {showVolumeSlider && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#1A1A1A] border border-[#333333] rounded-xl shadow-xl z-30 flex flex-col items-center">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-16 h-1 accent-[#3B82F6] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1 hover:text-[#60A5FA] transition-colors cursor-pointer text-white/80"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Under-player status indicator */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#9CA3AF] flex-wrap justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>
              {hasLiveVideo
                ? 'Website Video Player'
                : hasLiveAudio
                ? 'AI Studio Voiceover Synced'
                : 'Studio Motion Backdrop'}
            </span>
            <span>•</span>
            <span>{video.aspectRatio || '9:16'} Shorts</span>
            {hasLiveAudio && (
              <>
                <span>•</span>
                <span className="text-[#60A5FA] font-medium">Fenrir Voice</span>
              </>
            )}
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
              {hasLiveAudio && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Audio Track Ready
                </span>
              )}
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
                <Layers className="w-3 h-3 text-blue-400" />
                {video.aspectRatio || '9:16'} Vertical
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#171717] border border-[#262626] col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-medium text-[#777777] uppercase tracking-wider">
                Duration
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-amber-400" />
                {formatTime(duration)}
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
