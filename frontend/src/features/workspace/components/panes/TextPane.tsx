import React, { useState, useEffect } from 'react';
import {
  Type,
  AlignLeft,
  Check,
  Plus,
  Zap,
  Bookmark,
  Trash2,
  Copy,
  Sliders,
  Sparkles,
  Search,
} from 'lucide-react';

export interface TextPreset {
  id: string;
  name: string;
  previewText: string;
  className: string;
  color: string;
  styleDescription: string;
  fontFamily?: string;
}

export interface TextPaneProps {
  onInsertText?: (text: string, type: 'heading' | 'subheading' | 'body') => void;
  onApplyPreset?: (preset: TextPreset) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateHook?: (hook: string) => void;
  onUpdateQuote?: (quote: string) => void;
}

const VIRAL_TYPOGRAPHY_PRESETS: TextPreset[] = [
  {
    id: 'impact-bold',
    name: 'Titan Impact',
    previewText: 'STAY IN SILENCE',
    color: '#FFFFFF',
    className: 'font-black tracking-tight text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)]',
    styleDescription: 'High-contrast TikTok & Shorts bold punchy font',
    fontFamily: 'Impact, sans-serif',
  },
  {
    id: 'neon-cyan',
    name: 'Cyber Cyan Bold',
    previewText: 'RELENTLESS MOMENTUM',
    color: '#06B6D4',
    className: 'font-black tracking-wider text-[#06B6D4] uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Crisp cyber style for tech & motivation reels',
    fontFamily: 'Inter, sans-serif',
  },
  {
    id: 'golden-legacy',
    name: 'Stoic Gold',
    previewText: 'FORGE YOUR DESTINY',
    color: '#F59E0B',
    className: 'font-extrabold tracking-wide text-amber-400 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Warm luxury gold for philosophy and wealth',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  {
    id: 'crimson-fury',
    name: 'Aggressive Crimson',
    previewText: 'NOBODY CARES. WORK HARDER.',
    color: '#EF4444',
    className: 'font-black tracking-tighter text-red-500 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'High adrenaline gym & grind energy',
    fontFamily: 'Anton, sans-serif',
  },
  {
    id: 'emerald-mindset',
    name: 'Emerald Discipline',
    previewText: 'CONSISTENCY BEATS TALENT',
    color: '#10B981',
    className: 'font-extrabold tracking-tight text-emerald-400 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'Discipline, financial habits, and growth',
    fontFamily: 'Montserrat, sans-serif',
  },
  {
    id: 'minimal-mono',
    name: 'Minimalist Terminal',
    previewText: '4:00 AM • THE STANDARD',
    color: '#E4E4E7',
    className: 'font-mono font-bold tracking-[0.2em] text-zinc-200 uppercase',
    styleDescription: 'Clean documentary aesthetic with spaced tracking',
    fontFamily: 'Courier New, monospace',
  },
  {
    id: 'syne-futuristic',
    name: 'Syne Hyper Future',
    previewText: 'THE UNSEEN GRIND',
    color: '#A855F7',
    className: 'font-black tracking-widest text-purple-400 uppercase drop-shadow-[0_3px_10px_rgba(168,85,247,0.4)]',
    styleDescription: 'Ultra futuristic aesthetic for deep tech & AI reels',
    fontFamily: 'Trebuchet MS, sans-serif',
  },
  {
    id: 'bebas-poster',
    name: 'Bebas Billboard',
    previewText: 'WIN IN THE DARK',
    color: '#FACC15',
    className: 'font-black tracking-normal text-yellow-300 uppercase drop-shadow-[0_4px_14px_rgba(0,0,0,1)]',
    styleDescription: 'Giant vertical typography dominating screen space',
    fontFamily: 'Impact, sans-serif',
  },
  {
    id: 'classic-editorial',
    name: 'Roman Editorial',
    previewText: 'AMOR FATI',
    color: '#F4F4F5',
    className: 'font-serif italic tracking-wide text-zinc-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]',
    styleDescription: 'Timeless Roman wisdom and literature aesthetic',
    fontFamily: 'Georgia, serif',
  },
  {
    id: 'pastel-punch',
    name: 'Electric Coral',
    previewText: 'RESET YOUR MIND',
    color: '#FB7185',
    className: 'font-extrabold tracking-tight text-rose-400 uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]',
    styleDescription: 'High contrast lifestyle and self-improvement pop',
    fontFamily: 'Verdana, sans-serif',
  },
];

const VIRAL_HOOK_CATEGORIES = [
  {
    category: 'Stoic Discipline',
    hooks: [
      'Nobody is coming to save you.',
      'Rule #1: Never explain your goals.',
      'Silence is your deadliest weapon.',
      'Win in private before you speak in public.',
      'You are not tired. You are undisciplined.',
    ],
  },
  {
    category: 'Fitness & Iron Will',
    hooks: [
      'Your excuses are lying to you.',
      'Suffer the pain of discipline or the pain of regret.',
      'The standard is the standard.',
      'Do it tired. Do it broke. Just do it.',
      'Pain today. Strength tomorrow.',
    ],
  },
  {
    category: 'Dark Psychology',
    hooks: [
      'They do not want you to succeed. They want you to fit in.',
      'Never reveal your next move.',
      'Observe everything. React to nothing.',
      'The loudest in the room is the weakest.',
      'Master your mind or someone else will.',
    ],
  },
  {
    category: 'Wealth & Success',
    hooks: [
      'In 6 months, you can be unrecognizable.',
      'Stop trading your focus for cheap validation.',
      'Build the empire while they party.',
      'Focus is the new currency of the 21st century.',
      'Consistency compounds in the dark.',
    ],
  },
];

const LOCAL_STORAGE_SNIPPETS_KEY = 'apexmind_saved_text_snippets';

export const TextPane: React.FC<TextPaneProps> = ({
  onInsertText,
  onApplyPreset,
  onUpdateTitle,
  onUpdateHook,
  onUpdateQuote,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'hooks' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('impact-bold');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Custom Snippets
  const [savedSnippets, setSavedSnippets] = useState<string[]>([]);
  const [newSnippetInput, setNewSnippetInput] = useState('');

  // Load saved snippets
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SNIPPETS_KEY);
      if (stored) {
        setSavedSnippets(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const triggerFeedback = (msg: string) => {
    setAppliedFeedback(msg);
    setTimeout(() => setAppliedFeedback(null), 1800);
  };

  const handleApplyPreset = (preset: TextPreset) => {
    setSelectedPresetId(preset.id);
    if (onApplyPreset) {
      onApplyPreset(preset);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback(`Applied "${preset.name}" preset`);
  };

  const handleInsertHook = (hookText: string) => {
    if (onUpdateHook) {
      onUpdateHook(hookText);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback('Hook applied to reel');
  };

  const handleInsertTitle = (text: string) => {
    if (onUpdateTitle) {
      onUpdateTitle(text);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback('Title updated');
  };

  const handleInsertQuote = (text: string) => {
    if (onUpdateQuote) {
      onUpdateQuote(text);
    }
    window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'text' }));
    triggerFeedback('Quote updated');
  };

  const handleSaveCustomSnippet = () => {
    if (!newSnippetInput.trim()) return;
    const snippet = newSnippetInput.trim();
    const updated = [snippet, ...savedSnippets];
    setSavedSnippets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SNIPPETS_KEY, JSON.stringify(updated));
    } catch {}
    setNewSnippetInput('');
    triggerFeedback('Snippet saved to library');
  };

  const handleDeleteSnippet = (index: number) => {
    const updated = savedSnippets.filter((_, i) => i !== index);
    setSavedSnippets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_SNIPPETS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const allHooks = VIRAL_HOOK_CATEGORIES.flatMap((c) =>
    c.hooks.map((h) => ({ hook: h, category: c.category }))
  );

  const filteredHooks = allHooks.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.hook.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Type className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Typography &amp; Captions
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            FONTS
          </span>
        </div>

        {appliedFeedback && (
          <span className="text-[10px] font-mono-studio px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ✓ {appliedFeedback}
          </span>
        )}
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'presets'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Typography Styles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hooks')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'hooks'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          Viral Hook Vault ({allHooks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'custom'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Bookmark className="w-3 h-3" />
          My Snippets ({savedSnippets.length})
        </button>
      </div>

      {/* ── Hook Categories (When in hooks tab) ── */}
      {activeTab === 'hooks' && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#26262B]/60 overflow-x-auto custom-scrollbar shrink-0 bg-[#141416]">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'Stoic Discipline', label: 'Stoic' },
            { id: 'Fitness & Iron Will', label: 'Fitness' },
            { id: 'Dark Psychology', label: 'Psychology' },
            { id: 'Wealth & Success', label: 'Wealth' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'bg-[#1C1C20] text-[#A1A1AA] hover:text-white hover:bg-[#26262C] border border-[#2A2A30]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {/* ── Tab 1: Presets ── */}
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono-studio text-[#71717A] uppercase tracking-wider">
              Curated Reel Typography Packs
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {VIRAL_TYPOGRAPHY_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 text-left ${
                      isSelected
                        ? 'bg-[#1E2330] border-[#3B82F6] ring-1 ring-[#3B82F6]/50 shadow-lg'
                        : 'bg-[#1C1C20] border-[#2A2A30] hover:border-[#3A3A42] hover:bg-[#222228]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.color }}
                        />
                        {isSelected && (
                          <div className="p-1 rounded-full bg-[#3B82F6] text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="bg-[#121214] border border-[#26262C] rounded-lg p-2.5 flex items-center justify-center text-center">
                      <span className={`text-sm ${preset.className}`}>
                        {preset.previewText}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
                      {preset.styleDescription}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 2: Viral Hook Vault ── */}
        {activeTab === 'hooks' && (
          <div className="flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hook phrases..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              {filteredHooks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] hover:border-[#3A3A42] transition-all flex flex-col gap-2"
                >
                  <p className="text-xs font-bold text-white tracking-wide leading-relaxed">
                    &ldquo;{item.hook}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#26262B]">
                    <span className="text-[9px] font-mono-studio text-[#60A5FA]">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInsertHook(item.hook)}
                        className="px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Set as Hook
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertQuote(item.hook)}
                        className="px-2 py-1 rounded-lg bg-[#2A2A32] hover:bg-[#34343E] text-white text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Set Quote
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 3: Custom Snippets ── */}
        {activeTab === 'custom' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
              <span className="text-xs font-bold text-white">Save Custom Hook or Quote</span>
              <textarea
                value={newSnippetInput}
                onChange={(e) => setNewSnippetInput(e.target.value)}
                placeholder="Type or paste your viral hook..."
                rows={3}
                className="w-full bg-[#141417] border border-[#2A2A30] rounded-lg p-2.5 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6] resize-none"
              />
              <button
                type="button"
                onClick={handleSaveCustomSnippet}
                disabled={!newSnippetInput.trim()}
                className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Save to Library
              </button>
            </div>

            {savedSnippets.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-6 text-center text-xs text-[#A1A1AA]">
                No custom snippets saved yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {savedSnippets.map((snippet, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#2A2A30] bg-[#1C1C20] flex flex-col gap-2"
                  >
                    <p className="text-xs text-white leading-relaxed">&ldquo;{snippet}&rdquo;</p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#26262B]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInsertHook(snippet)}
                          className="px-2 py-0.5 rounded bg-[#3B82F6] text-white text-[10px] font-bold"
                        >
                          Hook
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertQuote(snippet)}
                          className="px-2 py-0.5 rounded bg-[#2A2A32] text-white text-[10px] font-semibold"
                        >
                          Quote
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSnippet(idx)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextPane;
