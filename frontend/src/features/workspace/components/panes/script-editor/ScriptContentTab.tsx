/**
 * frontend/src/features/workspace/components/panes/script-editor/ScriptContentTab.tsx
 */

import React, { useRef, useState } from 'react';
import {
  Volume2,
  Bold,
  Italic,
  Sparkles,
  Hash,
  Copy,
  ArrowLeftRight,
  Camera,
  Layers,
  Play,
  Pause,
  RefreshCw,
  Music,
} from 'lucide-react';
import { GeneratedScript, HookOption } from '../../../types';
import { HookSelector } from './HookSelector';
import { applyFormatting, countWords, estimateReadingDuration } from '../../../utils/scriptFormatter';
import { studioApi } from '../../../api/studioApi';

interface ScriptContentTabProps {
  script: GeneratedScript;
  timelineDuration: number;
  activePlayingKey: string | null;
  onUpdateField: (field: keyof GeneratedScript, value: any) => void;
  onPlayPreview: (text: string, rate: number, key: string) => void;
  onSyncToCues: () => void;
  onShowNotice: (msg: string) => void;
  onRegenerateSceneVoice?: (sceneId: string) => Promise<void>;
  regeneratingSceneId?: string | null;
}

export const ScriptContentTab: React.FC<ScriptContentTabProps> = ({
  script,
  timelineDuration,
  activePlayingKey,
  onUpdateField,
  onPlayPreview,
  onSyncToCues,
  onShowNotice,
  onRegenerateSceneVoice,
  regeneratingSceneId,
}) => {
  const hookRef = useRef<HTMLTextAreaElement | null>(null);
  const quoteRef = useRef<HTMLTextAreaElement | null>(null);
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const [audioElement] = useState<HTMLAudioElement>(() => new Audio());
  const [localRegeneratingScene, setLocalRegeneratingScene] = useState<string | null>(null);

  const fullText = [script.hook, script.quote, script.cta].filter(Boolean).join(' ').trim();
  const totalWords = countWords(fullText);
  const estimatedSpeechSeconds = estimateReadingDuration(fullText);

  const formatSelection = (field: 'hook' | 'quote', style: 'bold' | 'italic' | 'caps') => {
    const ref = field === 'hook' ? hookRef : quoteRef;
    const current = (field === 'hook' ? script.hook : script.quote) || '';
    if (!ref.current) return;

    const { selectionStart, selectionEnd } = ref.current;
    const nextValue = applyFormatting(current, selectionStart, selectionEnd, style);
    onUpdateField(field, nextValue);
  };

  const handleCopyHashtags = () => {
    const tags = (script.hashtags || []).length > 0
      ? script.hashtags.join(' ')
      : '#Shorts #Viral #Trending';
    navigator.clipboard?.writeText(tags);
    onShowNotice('Copied hashtags to clipboard');
  };

  const scenes = (script as any).scenes || [];

  const togglePlayAudio = (key: string, url?: string) => {
    if (!url) return;
    if (playingAudioKey === key) {
      audioElement.pause();
      setPlayingAudioKey(null);
    } else {
      audioElement.src = url;
      audioElement.play().catch(() => {});
      setPlayingAudioKey(key);
      audioElement.onended = () => setPlayingAudioKey(null);
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    if (localRegeneratingScene || regeneratingSceneId) return;
    setLocalRegeneratingScene(sceneId);
    try {
      if (onRegenerateSceneVoice) {
        await onRegenerateSceneVoice(sceneId);
      } else {
        const scriptId = (script as any).scriptId;
        if (scriptId) {
          await studioApi.regenerateSceneVoice(scriptId, sceneId);
          onShowNotice(`Scene ${sceneId} voice regenerated`);
        } else {
          onShowNotice('No active script ID found for selective scene regeneration');
        }
      }
    } catch (err: any) {
      onShowNotice(`Regeneration failed: ${err.message || err}`);
    } finally {
      setLocalRegeneratingScene(null);
    }
  };

  const masterAudioUrl = (script as any).audioUrl || (script as any).masterAudioUrl || ((script as any).scriptId ? `/media/voice/${(script as any).scriptId}/narration_master.wav` : undefined);

  return (
    <div className="space-y-4">
      {/* Quick Metrics Header Strip */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#141418] border border-[#24242A] text-center">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono-studio uppercase text-[#9CA3AF]">Words</span>
          <span className="text-xs font-bold text-white font-mono">{totalWords}</span>
        </div>
        <div className="flex flex-col border-x border-[#24242A]">
          <span className="text-[9px] font-mono-studio uppercase text-[#9CA3AF]">Voice Time</span>
          <span className="text-xs font-bold text-white font-mono">
            {totalWords ? `~${estimatedSpeechSeconds}s` : '--'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono-studio uppercase text-[#9CA3AF]">Video Length</span>
          <span className="text-xs font-bold text-[#60A5FA] font-mono">{Math.round(timelineDuration || 30)}s</span>
        </div>
      </div>

      {/* Reel Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono-studio">
          <span className="text-[#9CA3AF] uppercase font-semibold">Title</span>
          <span className="text-zinc-500 text-[9px] font-mono">
            {(script.title || '').length} / 70
          </span>
        </div>
        <input
          type="text"
          value={script.title || ''}
          maxLength={70}
          onChange={(e) => onUpdateField('title', e.target.value)}
          placeholder="Add a title for this video"
          className="w-full bg-[#16161A] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-all placeholder:text-zinc-600"
        />
      </div>

      {/* Hook Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-xs font-bold text-white tracking-tight">Hook (First 3 Seconds)</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-[#18181C] rounded-lg border border-[#27272A] p-0.5">
              <button
                type="button"
                onClick={() => formatSelection('hook', 'bold')}
                className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('hook', 'italic')}
                className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                title="Italic"
              >
                <Italic className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('hook', 'caps')}
                className="px-1.5 py-0.5 text-[9px] font-bold rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                title="Uppercase"
              >
                CAPS
              </button>
            </div>

            <button
              type="button"
              onClick={() => onPlayPreview(script.hook || '', 1.05, 'hook')}
              className={`h-6 px-2 rounded-lg text-[10px] font-medium transition-colors border flex items-center gap-1 cursor-pointer ${
                activePlayingKey === 'hook'
                  ? 'bg-[#2563EB] text-white border-[#3B82F6]'
                  : 'bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#27272A]'
              }`}
              title="Audition TTS voice preview"
            >
              <Volume2 className="w-3 h-3" />
              <span>{activePlayingKey === 'hook' ? 'Stop' : 'Audition'}</span>
            </button>
          </div>
        </div>

        {script.hooks && script.hooks.length > 0 && (
          <HookSelector
            hooks={script.hooks}
            currentHook={script.hook}
            onSelectHook={(h: HookOption) => {
              onUpdateField('hook', h.text);
              if (script.subtitles && script.subtitles.length > 0) {
                const updatedSubs = [...script.subtitles];
                updatedSubs[0] = { ...updatedSubs[0], text: h.text };
                onUpdateField('subtitles', updatedSubs);
              }
              onShowNotice(`Applied "${h.angle}" hook`);
            }}
          />
        )}

        <div className="relative">
          <textarea
            ref={hookRef}
            value={script.hook || ''}
            onChange={(e) => onUpdateField('hook', e.target.value)}
            rows={2}
            placeholder="The opening line that stops the scroll in the first 3 seconds..."
            className="w-full bg-[#16161A] border border-[#27272A] rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 resize-none font-medium leading-relaxed transition-all"
          />
        </div>
      </div>

      {/* Core Body / Quote */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-xs font-bold text-white tracking-tight">Body &amp; Core Insight</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-[#18181C] rounded-lg border border-[#27272A] p-0.5">
              <button
                type="button"
                onClick={() => formatSelection('quote', 'bold')}
                className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('quote', 'italic')}
                className="p-1 rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                title="Italic"
              >
                <Italic className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection('quote', 'caps')}
                className="px-1.5 py-0.5 text-[9px] font-bold rounded hover:bg-[#24242A] text-zinc-400 hover:text-white transition-colors"
                title="Uppercase"
              >
                CAPS
              </button>
            </div>

            <button
              type="button"
              onClick={() => onPlayPreview(script.quote || '', 0.95, 'quote')}
              className={`h-6 px-2 rounded-lg text-[10px] font-medium transition-colors border flex items-center gap-1 cursor-pointer ${
                activePlayingKey === 'quote'
                  ? 'bg-[#2563EB] text-white border-[#3B82F6]'
                  : 'bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#27272A]'
              }`}
              title="Audition TTS voice preview"
            >
              <Volume2 className="w-3 h-3" />
              <span>{activePlayingKey === 'quote' ? 'Stop' : 'Audition'}</span>
            </button>
          </div>
        </div>

        <textarea
          ref={quoteRef}
          value={script.quote || ''}
          onChange={(e) => onUpdateField('quote', e.target.value)}
          rows={4}
          placeholder="The core philosophical lesson, narrative breakdown, or actionable insight..."
          className="w-full bg-[#16161A] border border-[#27272A] rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 resize-none leading-relaxed transition-all"
        />
      </div>

      {/* Call to Action */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-xs font-bold text-white tracking-tight">Call to Action (CTA)</span>
          <button
            type="button"
            onClick={() => onPlayPreview(script.cta || '', 1.0, 'cta')}
            className={`h-6 px-2 rounded-lg text-[10px] font-medium transition-colors border flex items-center gap-1 cursor-pointer ${
              activePlayingKey === 'cta'
                ? 'bg-[#2563EB] text-white border-[#3B82F6]'
                : 'bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#27272A]'
            }`}
            title="Audition TTS voice preview"
          >
            <Volume2 className="w-3 h-3" />
            <span>{activePlayingKey === 'cta' ? 'Stop' : 'Audition'}</span>
          </button>
        </div>

        <input
          type="text"
          value={script.cta || ''}
          onChange={(e) => onUpdateField('cta', e.target.value)}
          placeholder="e.g. Subscribe for daily principles • Share with someone who needs this"
          className="w-full bg-[#16161A] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
        />
      </div>

      {/* Hashtags Strip */}
      <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Hash className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Hashtags</span>
            <span className="text-[10px] font-normal text-zinc-500">
              {(script.hashtags || []).length || 5}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyHashtags}
            className="px-2.5 py-1.5 rounded-lg bg-[#18181C] hover:bg-[#202026] text-zinc-300 hover:text-white border border-[#27272A] text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="Copy hashtags"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {((script.hashtags && script.hashtags.length > 0)
            ? script.hashtags.slice(0, 5)
            : ['#Shorts', '#Viral', '#Trending', '#Reels', '#Video']
          ).map((tag: string, tIdx: number) => (
            <span
              key={tIdx}
              className="px-2 py-1 rounded-md bg-[#18181C] border border-[#27272A] text-[10px] text-zinc-300 font-mono"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>

      {/* Master Narration Track (if available) */}
      {masterAudioUrl && (
        <div className="p-3 rounded-xl bg-[#141C2E] border border-[#2563EB]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB]/25 flex items-center justify-center text-[#60A5FA]">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Master Narration Track</div>
              <div className="text-[10px] text-[#93C5FD]">Stage 2 Assembled Voice Timeline</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => togglePlayAudio('master', masterAudioUrl)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {playingAudioKey === 'master' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{playingAudioKey === 'master' ? 'Pause' : 'Play Narration'}</span>
          </button>
        </div>
      )}

      {/* 3D Cinematic Storyboard Breakdown (if scenes present) */}
      {scenes.length > 0 && (
        <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-xs font-bold text-white tracking-tight">3D Scene Breakdown</span>
              <span className="px-1.5 py-0.2 rounded bg-[#18181C] text-[#60A5FA] font-mono text-[9px] border border-[#27272A]">
                {scenes.length} Scenes
              </span>
            </div>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {scenes.map((scene: any, sIdx: number) => {
              const sceneId = scene.sceneId || `scene_${scene.sceneNumber || sIdx + 1}`;
              const scriptId = (script as any).scriptId;
              const sceneAudioUrl = scene.audioUrl || (scriptId ? `/media/voice/${scriptId}/${sceneId}_v${scene.version || 1}.wav` : undefined);
              const isPlaying = playingAudioKey === sceneId;
              const isThisRegenerating = localRegeneratingScene === sceneId || regeneratingSceneId === sceneId;

              return (
                <div
                  key={sceneId}
                  className="p-2.5 rounded-lg bg-[#18181C] border border-[#27272A] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#60A5FA]">Scene {scene.sceneNumber || sIdx + 1} ({scene.duration || 4}s)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#24242A] text-zinc-300 font-mono">
                        v{scene.version || 1}
                      </span>
                      <span className="text-zinc-400 capitalize">{scene.camera?.framing || 'Medium'}</span>
                    </div>
                  </div>
                  <p className="text-zinc-200 text-[11px] leading-relaxed">
                    {scene.visualDescription || scene.narration}
                  </p>
                  {scene.characters && scene.characters.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] text-zinc-400">
                      <Layers className="w-3 h-3 text-zinc-500" />
                      <span>Characters: {scene.characters.map((c: any) => c.name || c.characterId).join(', ')}</span>
                    </div>
                  )}

                  {/* Stage 2 Scene Audio & Regeneration Controls */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#24242A]/60">
                    <button
                      type="button"
                      onClick={() => togglePlayAudio(sceneId, sceneAudioUrl)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        isPlaying
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#1A2234] hover:bg-[#2563EB]/30 text-[#93C5FD] border border-[#3B82F6]/30'
                      }`}
                      title={isPlaying ? 'Pause scene audio' : 'Play scene audio'}
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isPlaying ? 'Pause' : 'Scene Audio'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRegenerateScene(sceneId)}
                      disabled={isThisRegenerating}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#141418] hover:bg-[#202026] text-zinc-300 hover:text-white text-[10px] border border-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
                      title="Regenerate Voice for this Scene"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isThisRegenerating ? 'animate-spin text-[#3B82F6]' : 'text-zinc-400'}`} />
                      <span>{isThisRegenerating ? 'Regenerating…' : 'Regenerate'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Scene Plan Strip (if motivational reel metadata present) */}
      {(script.shotPacing || script.transitionStyle || script.subtitleMotion || script.cameraMovement) && (
        <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="text-xs font-bold text-white tracking-tight">AI Scene Plan</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {script.shotPacing && (
              <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Shot Pacing</div>
                <div className="text-zinc-200 truncate">{script.shotPacing}</div>
              </div>
            )}
            {script.transitionStyle && (
              <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Transition</div>
                <div className="text-zinc-200 truncate">{script.transitionStyle}</div>
              </div>
            )}
            {script.subtitleMotion && (
              <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Caption Motion</div>
                <div className="text-zinc-200 truncate">{script.subtitleMotion}</div>
              </div>
            )}
            {script.cameraMovement && (
              <div className="p-2 rounded-lg bg-[#18181C] border border-[#27272A]">
                <div className="text-[9px] font-mono uppercase text-[#9CA3AF] mb-0.5">Camera</div>
                <div className="text-zinc-200 truncate">{script.cameraMovement}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync to Subtitles Banner */}
      <div className="p-3 rounded-xl bg-[#141418] border border-[#24242A] flex items-center justify-between gap-3 shadow-xs">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white">Sync Script to Timeline Cues</div>
          <div className="text-[10px] text-[#9CA3AF]">Convert hook, body, and CTA into short-form subtitle timings.</div>
        </div>
        <button
          type="button"
          onClick={onSyncToCues}
          className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
        >
          <span>Sync to Cues</span>
          <ArrowLeftRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
