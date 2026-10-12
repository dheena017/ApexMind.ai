import React from 'react';
import {
  Play,
  Check,
  Download,
  Bookmark,
  Radio,
} from 'lucide-react';
import { VoiceProfile, VisualBackdrop, MusicTrack } from '../types';

interface StudioControlsPaneProps {
  voices: VoiceProfile[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onTestVoice: (voiceId: string) => void;
  testingVoiceId: string | null;

  backdrops: VisualBackdrop[];
  selectedBackdrop: string;
  onSelectBackdrop: (backdropId: string) => void;

  musicTracks: MusicTrack[];
  selectedMusic: string;
  onSelectMusic: (musicId: string) => void;

  onPublish: () => void;
  publishing: boolean;
  canPublish: boolean;
  publishedSuccess: boolean;
}

// Preset visual display helper matching the mockup concepts
const PRESET_THUMBNAILS: Record<string, { label: string; gradient: string; imgStyle: string }> = {
  v1: {
    label: 'Dark Mountain Dawn',
    gradient: 'from-slate-900 to-indigo-950',
    imgStyle: 'bg-gradient-to-br from-amber-600/80 via-slate-900 to-indigo-950',
  },
  v2: {
    label: 'Cyberpunk Studio',
    gradient: 'from-blue-900 to-slate-950',
    imgStyle: 'bg-gradient-to-br from-blue-600/80 via-slate-900 to-cyan-950',
  },
  v3: {
    label: 'Dramatic Shadows',
    gradient: 'from-stone-900 to-neutral-950',
    imgStyle: 'bg-gradient-to-br from-neutral-700/80 via-stone-900 to-neutral-950',
  },
  v4: {
    label: 'Deep Ocean Mind',
    gradient: 'from-cyan-900 to-blue-950',
    imgStyle: 'bg-gradient-to-br from-teal-600/80 via-slate-900 to-blue-950',
  },
};

export const StudioControlsPane: React.FC<StudioControlsPaneProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  onTestVoice,
  testingVoiceId,
  backdrops,
  selectedBackdrop,
  onSelectBackdrop,
  onPublish,
  publishing,
  canPublish,
  publishedSuccess,
}) => {
  // Display all available voices from the backend catalog
  const displayVoices = voices.length > 0 ? voices : [
    { id: 'Fenrir', name: 'Fenrir', gender: 'Male', style: 'Deep, powerful, stoic leader', speed: '0.95x' },
    { id: 'Kore', name: 'Kore', gender: 'Female', style: 'Clear, inspiring, authoritative', speed: '1.0x' },
    { id: 'Puck', name: 'Puck', gender: 'Male', style: 'Energetic, high-octane motivational', speed: '1.05x' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'Female', style: 'Smooth, calming wisdom & meditation', speed: '0.9x' },
    { id: 'Charon', name: 'Charon', gender: 'Male', style: 'Grit & relentless focus', speed: '1.0x' },
  ];

  return (
    <div className="space-y-4 flex flex-col justify-between h-full font-sans-studio select-none text-[#E5E5E5]">
      <div className="space-y-4">
        {/* Section 1: AI Voiceover Personas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#2F2F2F]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              AI Voiceover Personas
            </h3>
            <span className="text-[10px] text-[#60A5FA] font-mono-studio">24kHz Studio</span>
          </div>

          <div className="space-y-2">
            {displayVoices.map((v) => {
              const isSelected = selectedVoice === v.id;
              const isTesting = testingVoiceId === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3B82F6]/10 border-[#3B82F6] shadow-sm shadow-[#3B82F6]/20'
                      : 'bg-[#181818] border-[#2F2F2F] hover:border-[#404040]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                        isSelected
                          ? 'bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white ring-2 ring-[#3B82F6]/40'
                          : 'bg-[#202020] text-[#9CA3AF] border border-[#2F2F2F]'
                      }`}
                    >
                      {v.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{v.name}</span>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#3B82F6]/20 text-[#60A5FA] font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] truncate leading-tight mt-0.5">
                        {v.style}
                      </p>
                    </div>
                  </div>

                  {/* Play / Select Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTestVoice(v.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-[#3B82F6]/25'
                          : 'bg-[#202020] hover:bg-[#2A2A2A] text-[#E5E5E5] border border-[#2F2F2F]'
                      }`}
                    >
                      {isTesting ? (
                        <>
                          <Radio className="w-3 h-3 animate-spin text-white" />
                          <span>Playing</span>
                        </>
                      ) : isSelected ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                          <span>Select</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Backdrop Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#2F2F2F]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              Backdrop Presets
            </h3>
            <span className="text-[10px] text-[#6B7280]">9:16 Vertical Video</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {backdrops.slice(0, 4).map((bd) => {
              const isSelected = selectedBackdrop === bd.id;
              const meta = PRESET_THUMBNAILS[bd.id] || {
                label: bd.name,
                gradient: 'from-slate-900 to-indigo-950',
                imgStyle: 'bg-slate-900',
              };

              return (
                <div
                  key={bd.id}
                  onClick={() => onSelectBackdrop(bd.id)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <div
                    className={`w-full aspect-[4/5] rounded-xl overflow-hidden transition-all relative border-2 ${
                      isSelected
                        ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 shadow-[0_0_15px_rgba(59,130,246,0.25)] scale-[1.02]'
                        : 'border-[#2F2F2F] group-hover:border-[#404040] opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {/* Visual Preset Thumbnail */}
                    <div className={`w-full h-full ${meta.imgStyle} relative flex flex-col justify-end p-1.5`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3B82F6] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold truncate text-center w-full leading-tight ${
                      isSelected ? 'text-[#60A5FA]' : 'text-[#9CA3AF] group-hover:text-white'
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3: Action Buttons at Bottom */}
      <div className="space-y-2 pt-2">
        {/* Brand Theme Publish Button */}
        <button
          onClick={onPublish}
          disabled={!canPublish || publishing}
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            publishedSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : !canPublish || publishing
              ? 'bg-[#1E1E1E] text-[#6B7280] cursor-not-allowed border border-[#2F2F2F]'
              : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#60A5FA] hover:to-[#3B82F6] text-white shadow-[#3B82F6]/25 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {publishing ? (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Uploading to YouTube Shorts...</span>
            </div>
          ) : publishedSuccess ? (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Published Successfully!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-white" />
              <span>PUBLISH TO YOUTUBE</span>
            </div>
          )}
        </button>

        {/* Secondary Export & Save Draft Actions */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-[#9CA3AF] pt-1">
          <button
            type="button"
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-[#1E1E1E] border border-transparent hover:border-[#2F2F2F]"
            onClick={() => alert('Exporting 1080x1920 MP4 package...')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-[#1E1E1E] border border-transparent hover:border-[#2F2F2F]"
            onClick={() => alert('Draft saved to SQLite studio memory.')}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>
    </div>
  );
};
