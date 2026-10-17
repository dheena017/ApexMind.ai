import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Tag,
  Copy,
  Check,
  ExternalLink,
  Flame,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Card, Button } from '@/src/shared/ui/common';
import { youtubeApi } from '../api/youtubeApi';

export const YouTubeSeoPage: React.FC = () => {
  // Autocomplete state
  const [keywordQuery, setKeywordQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  // Competitor Tag Inspector state
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [inspectedTags, setInspectedTags] = useState<string[]>([]);
  const [inspectedTitle, setInspectedTitle] = useState<string>('');
  const [loadingTags, setLoadingTags] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const handleFetchSuggestions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keywordQuery.trim()) return;
    setLoadingSuggestions(true);
    try {
      const videos = await youtubeApi.searchVideos(keywordQuery.trim(), 'video', 8);
      setSuggestions(videos.map((v) => v.title).filter(Boolean));
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInspectTags = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!videoUrlInput.trim()) return;

    let vidId = videoUrlInput.trim();
    if (vidId.includes('v=')) {
      vidId = vidId.split('v=')[1].split('&')[0];
    } else if (vidId.includes('shorts/')) {
      vidId = vidId.split('shorts/')[1].split('?')[0];
    } else if (vidId.includes('youtu.be/')) {
      vidId = vidId.split('youtu.be/')[1].split('?')[0];
    }

    setLoadingTags(true);
    try {
      const [tagList, details] = await Promise.all([
        youtubeApi.getVideoTags(vidId),
        youtubeApi.getVideoDetails(vidId),
      ]);
      setInspectedTags(tagList);
      setInspectedTitle(details?.title || `Video ${vidId}`);
    } catch {
      setInspectedTags([]);
      setInspectedTitle('');
    } finally {
      setLoadingTags(false);
    }
  };

  const copyToClipboard = (text: string, isKeyword = true) => {
    navigator.clipboard.writeText(text);
    if (isKeyword) {
      setCopiedKeyword(text);
      setTimeout(() => setCopiedKeyword(null), 2000);
    } else {
      setCopiedTag(text);
      setTimeout(() => setCopiedTag(null), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* ── 1. Header Banner ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-[#121212] border border-[#2F2F2F] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>YouTube Live SEO &amp; Discovery Suite</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Keyword Predictor &amp; Competitor Tag Inspector
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Stream live search queries and competitor tags directly from YouTube without database storage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 2. Live Search Autocomplete ── */}
        <Card className="p-5 sm:p-6 bg-[#141414] border border-[#2F2F2F] rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#262626]">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Search Autocomplete</h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Discover what viewers are actively typing into YouTube right now
              </p>
            </div>
          </div>

          <form onSubmit={handleFetchSuggestions} className="flex gap-2">
            <input
              type="text"
              value={keywordQuery}
              onChange={(e) => setKeywordQuery(e.target.value)}
              placeholder="e.g. brain teasers for, stoic motivation..."
              className="flex-1 bg-[#121212] border border-[#333] focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#6B7280] outline-none transition-colors"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loadingSuggestions}
              icon={loadingSuggestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              className="text-xs shrink-0"
            >
              Search
            </Button>
          </form>

          {/* Results List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              <span>Predictions ({suggestions.length})</span>
              {suggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(suggestions.join(', '))}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Copy All
                </button>
              )}
            </div>

            {suggestions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280]">
                Type a seed phrase above to stream real-time YouTube search suggestions.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] hover:border-blue-500/40 flex items-center justify-between gap-3 text-xs text-[#E5E5E5] transition-colors"
                  >
                    <span className="truncate">{item}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item)}
                      title="Copy keyword"
                      className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#333] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKeyword === item ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── 3. Competitor Video Tag Inspector ── */}
        <Card className="p-5 sm:p-6 bg-[#141414] border border-[#2F2F2F] rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#262626]">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Competitor Tag Inspector</h3>
              <p className="text-[11px] text-[#9CA3AF]">
                Extract hidden SEO tags and ranking keywords from top competitor videos
              </p>
            </div>
          </div>

          <form onSubmit={handleInspectTags} className="flex gap-2">
            <input
              type="text"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="Paste YouTube Video URL or ID..."
              className="flex-1 bg-[#121212] border border-[#333] focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#6B7280] outline-none transition-colors"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={loadingTags}
              icon={loadingTags ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
              className="text-xs shrink-0"
            >
              Inspect
            </Button>
          </form>

          {/* Inspected Tags Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              <span>{inspectedTitle ? `Tags: ${inspectedTitle}` : `Extracted Tags (${inspectedTags.length})`}</span>
              {inspectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(inspectedTags.join(', '), false)}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Copy All
                </button>
              )}
            </div>

            {inspectedTags.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280]">
                Paste any YouTube video link to inspect its hidden ranking keywords.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto custom-scrollbar p-1">
                {inspectedTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => copyToClipboard(tag, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] hover:border-purple-500/50 text-xs text-[#E5E5E5] hover:text-white transition-all cursor-pointer"
                  >
                    <span>{tag}</span>
                    {copiedTag === tag ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#6B7280] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default YouTubeSeoPage;
