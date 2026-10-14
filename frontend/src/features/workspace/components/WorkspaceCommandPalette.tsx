import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  Wand2,
  FileText,
  LayoutTemplate,
  FolderOpen,
  Type,
  Shapes,
  Music,
  Image as ImageIcon,
  Film,
  Play,
  Volume2,
  Camera,
  Download,
  Copy,
  Sparkles,
  Search,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { WorkspaceTabType } from './WorkspaceSidebar';

interface WorkspaceCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPane: (pane: WorkspaceTabType) => void;
  onSelectAspectRatio?: (ratio: '9:16' | '16:9' | '1:1' | '4:5' | '21:9') => void;
  onTogglePlay?: () => void;
  onToggleMute?: () => void;
  onGenerateScript?: () => void;
  onCaptureSnapshot?: () => void;
  onToggleTimeline?: () => void;
}

export const WorkspaceCommandPalette: React.FC<WorkspaceCommandPaletteProps> = ({
  open,
  onOpenChange,
  onSelectPane,
  onSelectAspectRatio,
  onTogglePlay,
  onToggleMute,
  onGenerateScript,
  onCaptureSnapshot,
  onToggleTimeline,
}) => {
  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        // Prevent default if not typing in an input
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          if (e.key === '/') return;
        }
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  const runAction = (fn: () => void, label: string) => {
    fn();
    onOpenChange(false);
    toast.success(label);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0 -z-10"
        onClick={() => onOpenChange(false)}
      />

      <div className="w-full max-w-xl bg-[#141416] border border-[#2A2A30] rounded-2xl shadow-2xl overflow-hidden text-white font-sans-studio ring-1 ring-white/10">
        <Command label="Studio Command Menu" className="w-full flex flex-col">
          {/* Top Search Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#26262B] bg-[#17171A]">
            <Search className="w-4 h-4 text-[#71717A] shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command, switch panels, or trigger action... (ESC to exit)"
              className="w-full bg-transparent text-sm text-white placeholder:text-[#52525B] outline-none border-none"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-80 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1 text-xs">
            <Command.Empty className="py-6 text-center text-xs text-[#71717A]">
              No matching studio commands found.
            </Command.Empty>

            {/* Quick Actions Group */}
            <Command.Group heading="QUICK ACTIONS" className="text-[10px] uppercase font-mono text-zinc-400 px-2 py-1.5">
              {onGenerateScript && (
                <Command.Item
                  onSelect={() =>
                    runAction(() => {
                      onGenerateScript();
                      try {
                        confetti({ particleCount: 40, spread: 60 });
                      } catch {}
                    }, 'Generating AI Reel Script...')
                  }
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#60A5FA]" />
                  <span>Generate AI Viral Script</span>
                </Command.Item>
              )}

              {onCaptureSnapshot && (
                <Command.Item
                  onSelect={() => runAction(onCaptureSnapshot, 'Snapshotting Canvas Frame')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <Camera className="w-4 h-4 text-[#10B981]" />
                  <span>Take High-Res Canvas Snapshot</span>
                </Command.Item>
              )}

              {onTogglePlay && (
                <Command.Item
                  onSelect={() => runAction(onTogglePlay, 'Toggled Video Playback')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <Play className="w-4 h-4 text-amber-400" />
                  <span>Play / Pause Video Preview</span>
                </Command.Item>
              )}

              {onToggleMute && (
                <Command.Item
                  onSelect={() => runAction(onToggleMute, 'Toggled Audio Mute')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Toggle Audio Volume Mute</span>
                </Command.Item>
              )}

              {onToggleTimeline && (
                <Command.Item
                  onSelect={() => runAction(onToggleTimeline, 'Toggled Bottom Timeline')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <LayoutTemplate className="w-4 h-4 text-cyan-400" />
                  <span>Toggle Multi-Track Timeline</span>
                </Command.Item>
              )}
            </Command.Group>

            {/* Switch Studio Panels Group */}
            <Command.Group heading="STUDIO PANELS" className="text-[10px] uppercase font-mono text-zinc-400 px-2 py-1.5 mt-2 border-t border-[#26262B]">
              <Command.Item
                onSelect={() => runAction(() => onSelectPane('prompt'), 'Switched to AI Agent Studio')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <Wand2 className="w-4 h-4 text-[#60A5FA]" />
                <span>AI Script Studio (Agent Prompt)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('editor'), 'Switched to Script & Subtitles')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Script &amp; Subtitles Editor</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('canvas'), 'Switched to Canvas & Frame')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <LayoutTemplate className="w-4 h-4 text-amber-400" />
                <span>Canvas Format &amp; Gradients</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('media'), 'Switched to Project Media')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>Project Media Assets Bin</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('text'), 'Switched to Typography')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <Type className="w-4 h-4 text-pink-400" />
                <span>Typography, Fonts &amp; Hook Vault</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('elements'), 'Switched to Elements')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <Shapes className="w-4 h-4 text-rose-400" />
                <span>Badges, Frames &amp; Overlays</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('audio'), 'Switched to Audio & SFX')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <Music className="w-4 h-4 text-indigo-400" />
                <span>Audio Mixer, SFX &amp; Voiceover</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('image'), 'Switched to Backdrop Images')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>Stock Photos &amp; Color Grading</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runAction(() => onSelectPane('video'), 'Switched to Stock Video Clips')}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
              >
                <Film className="w-4 h-4 text-emerald-400" />
                <span>Motion Stock Video Loops</span>
              </Command.Item>
            </Command.Group>

            {/* Canvas Aspect Ratios */}
            {onSelectAspectRatio && (
              <Command.Group heading="CANVAS ASPECT RATIO" className="text-[10px] uppercase font-mono text-zinc-400 px-2 py-1.5 mt-2 border-t border-[#26262B]">
                <Command.Item
                  onSelect={() => runAction(() => onSelectAspectRatio('9:16'), 'Aspect Ratio: 9:16 Shorts/Reels')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <span className="font-mono text-zinc-400">9:16</span>
                  <span>Shorts, Reels, TikTok (1080×1920)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => runAction(() => onSelectAspectRatio('16:9'), 'Aspect Ratio: 16:9 Widescreen')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <span className="font-mono text-zinc-400">16:9</span>
                  <span>YouTube Standard (1920×1080)</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => runAction(() => onSelectAspectRatio('1:1'), 'Aspect Ratio: 1:1 Square Post')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-white hover:bg-[#3B82F6]/20 hover:text-[#60A5FA] transition-colors"
                >
                  <span className="font-mono text-zinc-400">1:1</span>
                  <span>Instagram Square Post (1080×1080)</span>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Navigation Hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#26262B] bg-[#17171A] text-[10px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span>Navigate with <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">↑</kbd><kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">↓</kbd></span>
              <span>Select with <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">↵</kbd></span>
            </div>
            <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">Ctrl+K</kbd> anytime</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default WorkspaceCommandPalette;
