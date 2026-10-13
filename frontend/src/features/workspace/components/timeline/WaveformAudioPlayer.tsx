import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Repeat,
  ChevronUp,
  Smartphone,
  SlidersHorizontal,
} from 'lucide-react';

interface WaveformAudioPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  audioUrl?: string | null;
  isLooping?: boolean;
  onToggleLoop?: () => void;
  showGuides?: boolean;
  onToggleGuides?: () => void;
  onOpenImageEditor?: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Procedural waveform peaks for instant visual preview
const SYNTHETIC_PEAKS = [
  0.15, 0.3, 0.6, 0.85, 0.5, 0.7, 0.9, 0.4, 0.65, 0.8, 0.3, 0.55, 0.95, 0.7, 0.45,
  0.6, 0.8, 0.4, 0.2, 0.5, 0.75, 0.9, 0.6, 0.35, 0.7, 0.85, 0.5, 0.3, 0.65, 0.9,
  0.75, 0.4, 0.6, 0.8, 0.55, 0.35, 0.7, 0.9, 0.8, 0.45, 0.65, 0.3, 0.5, 0.85, 0.6,
  0.4, 0.75, 0.9, 0.5, 0.3, 0.6, 0.8, 0.65, 0.45, 0.7, 0.85, 0.4, 0.25, 0.5, 0.7,
];

export const WaveformAudioPlayer: React.FC<WaveformAudioPlayerProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  audioUrl,
  isLooping = true,
  onToggleLoop,
  showGuides = false,
  onToggleGuides,
  onOpenImageEditor,
  onTogglePlay,
  onSeek,
  onToggleMute,
  onVolumeChange,
  onPlaybackRateChange,
  onToggleFullscreen,
}) => {
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);

  const totalDuration = Math.max(0.1, duration > 0 ? duration : 30);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformContainerRef.current) return;

    try {
      const ws = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: '#374151',
        progressColor: '#3B82F6',
        cursorColor: '#60A5FA',
        cursorWidth: 2,
        height: 28,
        barWidth: 2,
        barGap: 1.5,
        barRadius: 2,
        normalize: true,
        interact: true,
        url: audioUrl || undefined,
        peaks: audioUrl ? undefined : [SYNTHETIC_PEAKS],
        duration: totalDuration,
      });

      ws.on('interaction', (newProgress) => {
        onSeek(newProgress * totalDuration);
      });

      wavesurferRef.current = ws;

      return () => {
        ws.destroy();
        wavesurferRef.current = null;
      };
    } catch {
      // Fallback gracefully if Web Audio context is not permitted
    }
  }, [audioUrl]);

  // Sync WaveSurfer progress with external currentTime
  useEffect(() => {
    if (wavesurferRef.current && totalDuration > 0) {
      const targetProgress = Math.min(1, Math.max(0, currentTime / totalDuration));
      const currentWSProgress = wavesurferRef.current.getDuration() > 0
        ? wavesurferRef.current.getCurrentTime() / wavesurferRef.current.getDuration()
        : 0;
      if (Math.abs(currentWSProgress - targetProgress) > 0.02) {
        wavesurferRef.current.setTime(currentTime);
      }
    }
  }, [currentTime, totalDuration]);

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverX(ratio * 100);
    setHoverTime(ratio * totalDuration);
  };

  const handleWaveformMouseLeave = () => {
    setHoverTime(null);
  };

  const stepBackward = () => {
    onSeek(Math.max(0, currentTime - 5));
  };

  const stepForward = () => {
    onSeek(Math.min(totalDuration, currentTime + 5));
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent px-2.5 pt-2 pb-2.5 select-none font-sans-studio transition-all">
      {/* ── 1. Wavesurfer.js Interactive Waveform Track ─────────── */}
      <div
        className="relative w-full cursor-pointer py-0.5 group/wave mb-1"
        onMouseMove={handleWaveformMouseMove}
        onMouseLeave={handleWaveformMouseLeave}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onSeek(ratio * totalDuration);
        }}
      >
        {/* Wavesurfer Mounting Container with fixed safe height */}
        <div ref={waveformContainerRef} className="w-full h-[22px] max-h-[22px] overflow-hidden rounded" />

        {/* Fallback Progress Line */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#262626] rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full bg-[#3B82F6] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hover Time Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#2F2F2F] text-[9px] font-mono-studio text-white pointer-events-none z-40"
            style={{ left: `${hoverX}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* ── 2. Unified Playback Controls, Timecode & Tools Strip ───────── */}
      <div className="flex items-center justify-between gap-1 text-[#E5E5E5]">
        {/* Left: Playback, Steps & Live Timecode */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-6 h-6 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center transition-all cursor-pointer border border-[#60A5FA]/30 active:scale-95 shadow-sm"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-white" />
            ) : (
              <Play className="w-3 h-3 fill-white ml-0.5" />
            )}
          </button>

          {/* Rewind 5s */}
          <button
            type="button"
            onClick={stepBackward}
            className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Rewind 5s (←)"
            aria-label="Rewind 5 seconds"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Forward 5s */}
          <button
            type="button"
            onClick={stepForward}
            className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Forward 5s (→)"
            aria-label="Forward 5 seconds"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          {/* Timecode Readout */}
          <div className="flex items-center gap-1 text-[9px] font-mono-studio text-[#9CA3AF] pl-0.5">
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-[#6B7280]">/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Right: Loop, Safe Guides, Filter Editor, Volume, Speed & Fullscreen */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Loop Shorts Toggle */}
          {onToggleLoop && (
            <button
              type="button"
              onClick={onToggleLoop}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isLooping
                  ? 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30'
                  : 'text-[#6B7280] hover:text-white hover:bg-white/[0.06]'
              }`}
              title={isLooping ? 'Loop: Active' : 'Loop: Off'}
              aria-label="Toggle loop playback"
            >
              <Repeat className="w-3 h-3" />
            </button>
          )}

          {/* Shorts UI Safe Zone Overlay Toggle */}
          {onToggleGuides && (
            <button
              type="button"
              onClick={onToggleGuides}
              className={`p-1 rounded transition-colors cursor-pointer ${
                showGuides
                  ? 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30'
                  : 'text-[#6B7280] hover:text-white hover:bg-white/[0.06]'
              }`}
              title={showGuides ? 'Hide Safe Zone' : 'Show Shorts Safe Zone'}
              aria-label="Toggle Shorts Safe Zone"
            >
              <Smartphone className="w-3 h-3" />
            </button>
          )}

          {/* Backdrop Image Editor Trigger */}
          {onOpenImageEditor && (
            <button
              type="button"
              onClick={onOpenImageEditor}
              className="p-1 rounded text-[#9CA3AF] hover:text-[#60A5FA] hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Edit visual backdrop filters"
              aria-label="Open image editor"
            >
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-0.5 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3 h-3 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-3 h-3 text-[#9CA3AF]" />
              ) : (
                <Volume2 className="w-3 h-3 text-[#9CA3AF]" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume slider"
              className="w-10 h-1 bg-[#262626] rounded-full accent-[#3B82F6] cursor-pointer"
            />
          </div>

          {/* Speed Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
              className="px-1 py-0.5 rounded bg-[#181818] hover:bg-[#222222] border border-[#2F2F2F] text-[9px] font-mono-studio text-[#CBD5E1] hover:text-white transition-colors cursor-pointer flex items-center gap-0.5"
              title="Playback speed"
            >
              <span>{playbackRate}x</span>
              <ChevronUp className="w-2 h-2 opacity-60" />
            </button>

            {speedMenuOpen && (
              <div className="absolute bottom-full mb-1.5 right-0 rounded-xl bg-[#141414] border border-[#2F2F2F] p-1 z-50 flex flex-col min-w-[65px] shadow-2xl">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      onPlaybackRateChange(rate);
                      setSpeedMenuOpen(false);
                    }}
                    className={`px-2 py-0.5 text-[9px] font-mono-studio rounded-md text-left transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#3B82F6]/20 text-[#60A5FA] font-bold'
                        : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-3 h-3" />
            ) : (
              <Maximize className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaveformAudioPlayer;
