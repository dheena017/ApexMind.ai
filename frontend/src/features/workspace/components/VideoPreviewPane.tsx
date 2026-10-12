import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Music2,
  Mic,
} from 'lucide-react';
import { GeneratedScript, VisualBackdrop, MusicTrack } from '../types';

interface VideoPreviewPaneProps {
  script: GeneratedScript;
  activeBackdrop: VisualBackdrop;
  activeMusic?: MusicTrack;
  selectedVoice: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  audioUrl: string | null;
  loadingAudio: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  channelName?: string;
}

// Backdrop-specific visual theme configs
const BACKDROP_THEMES: Record<string, {
  gradient: string;
  accentColor: string;
  overlayGlow: string;
  titleShadow: string;
}> = {
  v1: {
    gradient: 'linear-gradient(180deg, #0a0f2c 0%, #111a45 30%, #1a0a3a 65%, #08070f 100%)',
    accentColor: '#3B82F6',
    overlayGlow: 'radial-gradient(ellipse 85% 60% at 50% 35%, rgba(59,130,246,0.28) 0%, transparent 70%)',
    titleShadow: '0 0 35px rgba(59,130,246,0.9), 0 2px 20px rgba(0,0,0,0.8)',
  },
  v2: {
    gradient: 'linear-gradient(180deg, #050d1a 0%, #0a1a35 30%, #120825 65%, #050508 100%)',
    accentColor: '#06B6D4',
    overlayGlow: 'radial-gradient(ellipse 85% 60% at 50% 35%, rgba(6,182,212,0.28) 0%, transparent 70%)',
    titleShadow: '0 0 35px rgba(6,182,212,0.9), 0 2px 20px rgba(0,0,0,0.8)',
  },
  v3: {
    gradient: 'linear-gradient(180deg, #160a02 0%, #291402 30%, #1c0a02 65%, #0a0500 100%)',
    accentColor: '#F59E0B',
    overlayGlow: 'radial-gradient(ellipse 85% 60% at 50% 35%, rgba(245,158,11,0.25) 0%, transparent 70%)',
    titleShadow: '0 0 35px rgba(245,158,11,0.9), 0 2px 20px rgba(0,0,0,0.8)',
  },
  v4: {
    gradient: 'linear-gradient(180deg, #010d18 0%, #021c2e 30%, #011420 65%, #010608 100%)',
    accentColor: '#2DD4BF',
    overlayGlow: 'radial-gradient(ellipse 85% 60% at 50% 35%, rgba(45,212,191,0.25) 0%, transparent 70%)',
    titleShadow: '0 0 35px rgba(45,212,191,0.9), 0 2px 20px rgba(0,0,0,0.8)',
  },
};

const WAVEFORM_BARS = [16, 26, 42, 58, 76, 92, 68, 48, 84, 98, 70, 52, 38, 62, 82, 88, 56, 40, 72, 90, 66, 36, 78, 94, 60, 46, 28, 68, 86, 50];

export const VideoPreviewPane: React.FC<VideoPreviewPaneProps> = ({
  script,
  activeBackdrop,
  activeMusic,
  selectedVoice,
  isPlaying,
  onTogglePlay,
  audioUrl,
  loadingAudio,
  currentTime,
  duration,
  onSeek,
  channelName = 'ApexMind',
}) => {
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = duration > 0 ? duration : 15;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));
  const theme = BACKDROP_THEMES[activeBackdrop.id] || BACKDROP_THEMES.v1;

  // Active subtitle text matching current playback position
  const activeSubtitle = (() => {
    if (!script.subtitles || script.subtitles.length === 0) {
      return script.hook || script.quote || '';
    }
    const current = script.subtitles.find(
      (s) => currentTime >= s.start && currentTime <= s.start + (s.duration || 3)
    );
    if (current) return current.text;
    if (currentTime > 0 && script.subtitles.length > 0) {
      return script.cta || script.subtitles[script.subtitles.length - 1].text;
    }
    return script.hook || script.subtitles[0]?.text || '';
  })();

  return (
    <div className="w-full h-full flex items-center justify-center select-none font-sans-studio">
      {/* ── 9:16 Vertical Video Studio Canvas ────────────────────────── */}
      <div
        className="relative flex flex-col justify-between overflow-hidden h-full max-h-full transition-all"
        style={{
          aspectRatio: '9/16',
          width: 'auto',
          maxWidth: '100%',
          background: '#050505',
        }}
      >
        {/* Layer 1: Cinematic Gradient Background */}
        <div
          className="absolute inset-0 z-0 transition-all duration-700"
          style={{ background: theme.gradient }}
        />

        {/* Layer 2: Ambient Glow */}
        <div
          className="absolute inset-0 z-0"
          style={{ background: theme.overlayGlow }}
        />

        {/* Layer 3: Atmospheric Grain Texture */}
        <div
          className="absolute inset-0 z-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '100px 100px',
          }}
        />

        {/* Layer 4: Top & Bottom Vignettes */}
        <div className="absolute top-0 inset-x-0 h-28 z-0 bg-linear-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-44 z-0 bg-linear-to-t from-black via-black/85 to-transparent pointer-events-none" />

        {/* ── TOP SECTION: Header Info & Title ──────────────────────── */}
        <div className="relative z-10 p-4 space-y-2">
          {/* Studio Resolution Badge & Category */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.accentColor }} />
              <span className="text-[9px] font-mono-studio font-bold text-white/80">9:16 VERTICAL HD</span>
            </div>

            <div className="flex items-center gap-1 text-[9px] font-semibold text-white/70 bg-black/50 px-2.5 py-0.5 rounded-full border border-white/10">
              <Sparkles className="w-2.5 h-2.5" style={{ color: theme.accentColor }} />
              <span className="truncate max-w-[130px]">{script.speechStyle || 'AI Director'}</span>
            </div>
          </div>

          {/* Video Title */}
          <h1
            className="font-black uppercase tracking-tight text-white text-center leading-tight drop-shadow-md pt-1"
            style={{
              fontSize: 'clamp(14px, 4.2vw, 19px)',
              textShadow: theme.titleShadow,
            }}
          >
            {script.title || 'UNTITLED SHORTS REEL'}
          </h1>
        </div>

        {/* ── CENTER SECTION: Kinetic Typography & Subtitles Stage ──── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
          <span
            className="text-[9px] font-extrabold uppercase tracking-[0.25em] mb-2 font-mono-studio"
            style={{ color: theme.accentColor, textShadow: `0 0 10px ${theme.accentColor}` }}
          >
            • LIVE SUBTITLES •
          </span>
          {activeSubtitle ? (
            <p
              className="font-black uppercase text-white leading-tight transition-all duration-150 animate-fade-in"
              style={{
                fontSize: 'clamp(13px, 4vw, 18px)',
                textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 0 25px rgba(255,255,255,0.4)',
                maxWidth: '92%',
              }}
            >
              {activeSubtitle}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5 opacity-60">
              <Sparkles className="w-5 h-5 text-[#60A5FA] animate-pulse" />
              <p className="text-[11px] font-mono-studio text-white/70 uppercase tracking-widest text-center">
                Ready to Generate AI Script
              </p>
            </div>
          )}

          {/* Audio generation loading indicator */}
          {loadingAudio && (
            <div className="mt-3 px-3 py-1 rounded-full bg-black/75 border border-[#3B82F6]/50 flex items-center gap-2 text-[10px] text-[#60A5FA] animate-pulse">
              <Mic className="w-3 h-3 animate-spin" />
              <span>Synthesizing Voiceover...</span>
            </div>
          )}
        </div>

        {/* ── BOTTOM SECTION: Metadata & Transport Controls ──────────── */}
        <div className="relative z-20 p-3 pt-0 space-y-2">
          {/* Channel Name, Voice, Music & Hashtags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[9px] text-white/90">
              <span className="font-bold flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accentColor }} />
                <span>{channelName}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 font-mono-studio bg-black/40 px-2 py-0.5 rounded-md border border-white/10 text-white/90">
                  <Mic className="w-2.5 h-2.5 text-[#60A5FA]" />
                  <span>{selectedVoice}</span>
                </span>
                {activeMusic && (
                  <span className="flex items-center gap-1 font-mono-studio bg-black/40 px-2 py-0.5 rounded-md border border-white/10 text-white/90">
                    <Music2 className="w-2.5 h-2.5 text-[#34D399]" />
                    <span className="truncate max-w-[110px]">{activeMusic.title}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Hashtags */}
            {script.hashtags && script.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {script.hashtags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] font-semibold"
                    style={{ color: theme.accentColor }}
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Audio Waveform */}
          <div className="flex items-end justify-center gap-[2px] h-5 px-1">
            {WAVEFORM_BARS.map((h, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-150"
                style={{
                  width: '2px',
                  background: theme.accentColor,
                  height: isPlaying
                    ? `${Math.max(15, Math.round(h * (0.4 + Math.random() * 0.6)))}%`
                    : `${Math.max(10, h * 0.25)}%`,
                  opacity: isPlaying ? 0.95 : 0.35,
                }}
              />
            ))}
          </div>

          {/* Scrubber Progress Bar */}
          <div className="space-y-1">
            <div
              className="relative w-full h-[4px] bg-white/20 hover:h-[6px] rounded-full cursor-pointer transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                onSeek(pos * totalDuration);
              }}
            >
              <div
                className="h-full rounded-full relative transition-all"
                style={{ width: `${progressPercent}%`, background: theme.accentColor }}
              >
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md"
                  style={{ boxShadow: `0 0 6px ${theme.accentColor}` }}
                />
              </div>
            </div>

            {/* Time Indicators */}
            <div className="flex items-center justify-between text-[8px] font-mono-studio text-white/60 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Transport Controls Row */}
          <div className="flex items-center justify-center gap-6 pt-1 text-white">
            <button
              type="button"
              onClick={() => onSeek(0)}
              className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              title="Restart"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Main Play / Pause Button */}
            <button
              type="button"
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${theme.accentColor}, #1d4ed8)`,
                boxShadow: `0 0 20px ${theme.accentColor}60, 0 4px 12px rgba(0,0,0,0.6)`,
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSeek(totalDuration)}
              className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              title="Skip to End"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

