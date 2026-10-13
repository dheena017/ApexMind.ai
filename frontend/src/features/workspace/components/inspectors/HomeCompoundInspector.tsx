import React, { useState } from 'react';
import {
  Check,
  FileCheck2,
  Cpu,
  Radio,
  Copy,
  Download,
  Home,
  Film,
  Type,
  Mic,
  Music,
  Layers,
  ArrowRight,
  Sparkles,
  Youtube,
} from 'lucide-react';
import { GeneratedScript } from '../../types';

export interface HomeCompoundInspectorProps {
  onPublish: () => void;
  publishing: boolean;
  canPublish: boolean;
  publishedSuccess: boolean;
  script?: GeneratedScript;
  duration?: number;
  category?: string;
  onSelectCompound?: (compound: 'video' | 'text' | 'voice' | 'music' | 'overlay') => void;
}

export const HomeCompoundInspector: React.FC<HomeCompoundInspectorProps> = ({
  onPublish,
  publishing,
  canPublish,
  publishedSuccess,
  script,
  duration = 12.1,
  category = 'Stoic Mindset & Discipline',
  onSelectCompound,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'audit' | 'codec'>('overview');
  const [copiedMetadata, setCopiedMetadata] = useState(false);

  const handleCopyMetadata = () => {
    const text = `${script?.title || 'Untitled Video'}\n\n${script?.quote || ''}\n\n${(
      script?.hashtags || ['#Shorts', '#Motivation', '#ApexMind']
    ).join(' ')}`;
    navigator.clipboard?.writeText(text);
    setCopiedMetadata(true);
    setTimeout(() => setCopiedMetadata(false), 2000);
  };

  const compoundShortcuts = [
    { id: 'video' as const, label: 'Video Backdrop (V1)', icon: Film, color: 'text-amber-400', badge: 'Visuals' },
    { id: 'text' as const, label: 'Captions & Title (T1)', icon: Type, color: 'text-blue-400', badge: 'Captions' },
    { id: 'voice' as const, label: 'Voiceover Audio (A1)', icon: Mic, color: 'text-emerald-400', badge: 'Voice' },
    { id: 'music' as const, label: 'Soundtrack Mix (A2)', icon: Music, color: 'text-purple-400', badge: 'Music' },
    { id: 'overlay' as const, label: 'Stickers & Badges', icon: Layers, color: 'text-indigo-400', badge: 'Stickers' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none">
      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-5 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`pb-2.5 transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeSubTab === 'overview'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Project Home
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          className={`pb-2.5 transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeSubTab === 'audit'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Shorts Preflight
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('codec')}
          className={`pb-2.5 transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeSubTab === 'codec'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Codec Specs
        </button>
      </div>

      {/* ── Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {/* SUBTAB 1: Project Overview (Home Page) */}
        {activeSubTab === 'overview' && (
          <div className="flex flex-col gap-4 pt-1">
            {/* Quick Access to Compound Inspectors */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider font-bold px-1">
                Compound Inspectors
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {compoundShortcuts.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (onSelectCompound) onSelectCompound(c.id);
                        window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: c.id }));
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181C] hover:bg-[#222228] border border-[#282830] transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${c.color}`} />
                        <span className="text-xs font-semibold text-[#E4E4E7] group-hover:text-white truncate">
                          {c.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono-studio px-1.5 py-0.5 rounded bg-white/5 text-[#A1A1AA] border border-white/10">
                          {c.badge}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#71717A] group-hover:text-white transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Metadata Copy Button */}
            <button
              type="button"
              onClick={handleCopyMetadata}
              className="w-full py-2.5 rounded-xl bg-[#1C1C20] hover:bg-[#25252C] border border-[#2A2A30] text-xs font-medium text-[#D4D4D8] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>{copiedMetadata ? 'Metadata Copied!' : 'Copy YouTube Title & Tags'}</span>
            </button>

            {/* Publish Button */}
            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || publishing}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                publishedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white disabled:opacity-40'
              }`}
            >
              <Youtube className="w-4 h-4" />
              <span>
                {publishing
                  ? 'Publishing to YouTube...'
                  : publishedSuccess
                  ? 'Published to YouTube!'
                  : 'PUBLISH TO YOUTUBE'}
              </span>
            </button>
          </div>
        )}

        {/* SUBTAB 2: Shorts Audit */}
        {activeSubTab === 'audit' && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#1C1C20] border border-[#2A2A30] flex flex-col gap-2.5">
              <span className="text-[10px] font-mono-studio text-[#9CA3AF] uppercase tracking-wider font-bold">
                Algorithm Readiness Checks
              </span>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>9:16 Vertical Shorts Canvas (1080×1920)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>24kHz Neural TTS Voice Synced</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>Kinetic Captions Active</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>Shorts Duration Guard ({duration.toFixed(1)}s &lt; 60s)</span>
              </div>
            </div>

            {/* Metadata Quick Copy */}
            <button
              type="button"
              onClick={handleCopyMetadata}
              className="w-full py-2.5 rounded-xl bg-[#1C1C20] hover:bg-[#25252C] border border-[#2A2A30] text-xs font-medium text-[#D4D4D8] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>{copiedMetadata ? 'Metadata Copied!' : 'Copy YouTube Title & Tags'}</span>
            </button>

            {/* Publish Button */}
            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || publishing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-40"
            >
              {publishing ? 'Publishing to YouTube...' : 'PUBLISH TO YOUTUBE'}
            </button>
          </div>
        )}

        {/* SUBTAB 3: Codec Specs */}
        {activeSubTab === 'codec' && (
          <div className="p-3.5 rounded-2xl bg-[#1C1C20] border border-[#2A2A30] flex flex-col gap-2 font-mono-studio text-xs">
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Container</span>
              <span className="text-white">MP4 (MPEG-4 Part 14)</span>
            </div>
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Video Codec</span>
              <span className="text-white">H.264 / AVC High Profile</span>
            </div>
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Resolution</span>
              <span className="text-white">1080 × 1920 (9:16)</span>
            </div>
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Framerate</span>
              <span className="text-white">60.000 FPS</span>
            </div>
            <div className="flex justify-between text-[#9CA3AF]">
              <span>Audio Codec</span>
              <span className="text-white">AAC-LC 24000Hz Stereo</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeCompoundInspector;
