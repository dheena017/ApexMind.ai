import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Wifi,
  BatteryMedium,
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

export const VideoPreviewPane: React.FC<VideoPreviewPaneProps> = ({
  script,
  activeBackdrop,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 25;

  // Active kinetic typography line based on time
  const activeSubtitle = (() => {
    if (!script.subtitles || script.subtitles.length === 0) {
      return script.hook || script.quote || 'THE POWER OF HABITS!';
    }
    const current = script.subtitles.find(
      (s) => currentTime >= s.start && currentTime <= s.start + s.duration
    );
    if (current) return current.text;
    if (currentTime > 0 && script.subtitles[script.subtitles.length - 1]) {
      return script.cta || script.subtitles[script.subtitles.length - 1].text;
    }
    return script.hook || script.subtitles[0].text;
  })();

  return (
    <div className="w-full h-full flex items-center justify-center select-none font-sans-studio">
      {/* Smartphone Simulator */}
      <div className="relative h-full max-h-[510px] aspect-[9/16] bg-black rounded-[38px] border-[5px] border-[#2A2A2A] shadow-2xl shadow-black/80 flex flex-col justify-between overflow-hidden ring-1 ring-white/10">
        {/* Dynamic Island / Status Bar */}
        <div className="relative z-30 pt-2.5 px-5 flex items-center justify-between text-white/90 text-[10px] font-mono-studio pointer-events-none">
          <span className="font-bold">9:16</span>
          {/* Dynamic Island Pill */}
          <div className="w-20 h-4 bg-black rounded-full border border-white/15 flex items-center justify-center gap-1 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="text-[7.5px] font-bold text-white/70">Apex HD</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Video Motion Stage Backdrop */}
        <div
          className={`absolute inset-0 z-10 bg-gradient-to-b ${activeBackdrop.previewColor} transition-all duration-700 flex flex-col justify-between p-4 pt-10 pb-20 overflow-hidden`}
        >
          {/* Atmosphere Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/70 pointer-events-none" />

          {/* Top Kinetic Title Overlay */}
          <div className="relative z-20 text-center pt-4 px-2">
            <h1
              className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_4px_16px_rgba(59,130,246,0.85)] font-sans-studio"
              style={{
                textShadow: '0 0 24px rgba(59, 130, 246, 0.9), 0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              {script.title || 'MASTER YOUR DAY'}
            </h1>
          </div>

          {/* Center Stage Subtitle & Inspiration */}
          <div className="relative z-20 my-auto text-center px-2 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#60A5FA] font-mono-studio drop-shadow">
              INSPIRATIONS
            </span>
            <div className="min-h-[60px] flex items-center justify-center">
              <p
                className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-snug animate-fade-in"
                style={{
                  textShadow: '0 0 16px rgba(255, 255, 255, 0.7), 0 2px 4px rgba(0,0,0,0.9)',
                }}
              >
                {activeSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Audio Visualizer & Transport Deck (Inside Phone) */}
        <div className="relative z-30 bg-gradient-to-t from-black via-black/90 to-transparent pt-4 pb-2 px-4 space-y-2">
          {/* Waveform Equalizer Bars */}
          <div className="flex items-end justify-center gap-[3px] h-7 px-2">
            {[30, 45, 70, 90, 60, 40, 85, 100, 75, 50, 65, 80, 95, 60, 40, 70, 85, 50].map(
              (height, i) => (
                <div
                  key={i}
                  className="w-[2.5px] rounded-full bg-[#3B82F6] transition-all duration-200"
                  style={{
                    height: isPlaying ? `${Math.max(15, Math.round(height * Math.random()))}%` : `${height * 0.4}%`,
                    opacity: isPlaying ? 0.95 : 0.4,
                  }}
                />
              )
            )}
          </div>

          {/* Scrubber Progress Line */}
          <div className="space-y-1">
            <div
              className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer overflow-visible"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                onSeek(pos * (duration || 15));
              }}
            >
              <div
                className="h-full bg-[#3B82F6] rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#60A5FA] shadow-[0_0_8px_#3B82F6]" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono-studio text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 15)}</span>
            </div>
          </div>

          {/* Transport Controls Row */}
          <div className="flex items-center justify-center gap-5 pt-0.5 text-white">
            <button
              onClick={() => onSeek(0)}
              className="text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Restart"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-[#3B82F6]/30 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(duration || 15)}
              className="text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Fast Forward"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              className="text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Volume"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* iPhone Home Bar */}
          <div className="w-20 h-1 bg-white/40 rounded-full mx-auto mt-1" />
        </div>
      </div>
    </div>
  );
};
