import React, { useState, useMemo } from 'react';
import {
  Activity,
  Sparkles,
  Youtube,
  ExternalLink,
  Copy,
  Check,
  Search,
  Eye,
  Clock,
  FileText,
  X,
  Play,
  Calendar,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { useCreatorStudioData, RecentGeneratedScript } from '../hooks/useCreatorStudioData';
import { YouTubeVideo } from '@/src/features/youtube/types';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface ActivityItem {
  key: string;
  type: 'script' | 'video';
  title: string;
  category: string;
  snippet?: string;
  date: string;
  url?: string;
  views?: number | string;
  duration?: string;
  rawScript?: RecentGeneratedScript;
  rawVideo?: YouTubeVideo;
}

export interface RecentStudioActivityProps {
  scripts?: RecentGeneratedScript[];
  videos?: YouTubeVideo[];
  loading?: boolean;
  error?: string | null;
  limit?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  title?: string;
  subtitle?: string;
  onNavigate?: (page: string) => void;
  className?: string;
}

export const RecentStudioActivity: React.FC<RecentStudioActivityProps> = ({
  scripts: propScripts,
  videos: propVideos,
  loading: propLoading,
  error: propError,
  limit,
  showFilters = true,
  showSearch = true,
  title = 'Recent Studio Activity',
  subtitle = 'Timeline of your generated scripts and published YouTube Shorts.',
  onNavigate,
  className = '',
}) => {
  const hookData = useCreatorStudioData();

  const scripts = propScripts ?? hookData.scripts;
  const videos = propVideos ?? hookData.videos;
  const loading = propLoading ?? hookData.loading;
  const error = propError ?? hookData.error;

  const [filterType, setFilterType] = useState<'all' | 'scripts' | 'videos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState<RecentGeneratedScript | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allEntries: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [
      ...scripts.map((script) => ({
        key: `script-${script.id}`,
        type: 'script' as const,
        title: script.title || 'Generated script',
        category: script.category || 'Script',
        snippet: script.hook || script.quote || undefined,
        date: script.generated_at,
        rawScript: script,
      })),
      ...videos.map((video) => ({
        key: `short-${video.id}`,
        type: 'video' as const,
        title: video.title || 'YouTube Short',
        category: video.category || 'Short',
        snippet: video.quote || undefined,
        date: video.publishedAt || video.published || new Date().toISOString(),
        url: video.videoUrl || undefined,
        views: video.views,
        duration: video.duration,
        rawVideo: video,
      })),
    ];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [scripts, videos]);

  const filteredEntries = useMemo(() => {
    let result = allEntries.filter((item) => {
      const matchesType =
        filterType === 'all' ? true : filterType === 'scripts' ? item.type === 'script' : item.type === 'video';
      const matchesSearch =
        searchQuery.trim() === ''
          ? true
          : item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.snippet && item.snippet.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });

    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [allEntries, filterType, searchQuery, limit]);

  const handleCopyScript = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <section
      className={`rounded-2xl border border-[#2F2F2F] bg-[#141414] overflow-hidden divide-y divide-[#262626] ${className}`}
    >
      {/* Board Header & Controls */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                {limit && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#9CA3AF] border border-[#2F2F2F] font-mono-studio">
                    {filteredEntries.length} latest
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#9CA3AF]">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!limit && (
              <div className="text-xs font-mono-studio text-[#9CA3AF] bg-[#121212] px-3 py-1.5 rounded-lg border border-[#262626]">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'activity item' : 'activity items'}
              </div>
            )}
            {limit && onNavigate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigate('profile-activity')}
              >
                See all
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search Strip */}
        {(showFilters || showSearch) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Filter Pills */}
            {showFilters && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121212] border border-[#262626] w-fit">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-[#1E293B] text-white border border-[#3B82F6]/40'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  All ({allEntries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('scripts')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filterType === 'scripts'
                      ? 'bg-[#172554] text-[#93C5FD] border border-[#3B82F6]/40'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-[#60A5FA]" />
                  <span>Scripts ({scripts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('videos')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filterType === 'videos'
                      ? 'bg-[#450A0A] text-[#FCA5A5] border border-red-500/40'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Youtube className="h-3 w-3 text-red-400" />
                  <span>Shorts ({videos.length})</span>
                </button>
              </div>
            )}

            {/* Quick Search Input */}
            {showSearch && (
              <div className="relative min-w-[200px] sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search activity by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#262626] bg-[#121212] pl-8 pr-3 py-1.5 text-xs text-[#E5E5E5] outline-none placeholder-[#6B7280] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Items List */}
      <div className="p-4 sm:p-6 bg-[#121212]/40">
        {error && <p role="alert" className="mb-4 text-sm text-amber-300">{error}</p>}

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-[#141414] animate-pulse border border-[#262626]" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Activity className="mx-auto h-10 w-10 text-[#525252] opacity-40" />
            <h4 className="text-sm font-bold text-white">No activity found</h4>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
              {searchQuery
                ? 'No scripts or Shorts match your search query. Try clearing the filter.'
                : 'Your generated scripts and published YouTube Shorts will appear here as you create them.'}
            </p>
            {searchQuery && (
              <Button type="button" variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((item) => (
              <div
                key={item.key}
                className="group relative rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#3B82F6]/40 p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Icon & Details */}
                <div className="flex min-w-0 items-start sm:items-center gap-3.5 flex-1">
                  {/* Icon Badge */}
                  <div
                    className={`h-11 w-11 rounded-xl flex shrink-0 items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${
                      item.type === 'script'
                        ? 'border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA]'
                        : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {item.type === 'script' ? (
                      <Sparkles className="h-5 w-5 text-[#60A5FA]" />
                    ) : (
                      <Youtube className="h-5 w-5 text-red-400" />
                    )}
                  </div>

                  {/* Metadata & Title */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.type === 'script'
                            ? 'bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/25'
                            : 'bg-red-500/10 text-red-400 border-red-500/25'
                        }`}
                      >
                        {item.type === 'script' ? 'Script' : 'Short'}
                      </span>

                      {/* Category Chip */}
                      {item.category && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#1F1F1F] text-[#9CA3AF] border border-[#2F2F2F]">
                          {item.category}
                        </span>
                      )}

                      {/* Video Status Badge if video */}
                      {item.rawVideo?.status && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                          {item.rawVideo.status}
                        </span>
                      )}
                    </div>

                    {/* Main Title */}
                    <h4 className="mt-1.5 text-sm font-semibold text-white group-hover:text-[#60A5FA] transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Quote / Hook Excerpt Preview */}
                    {item.snippet && (
                      <p className="mt-1 text-xs text-[#9CA3AF] line-clamp-1 italic leading-relaxed">
                        "{item.snippet}"
                      </p>
                    )}

                    {/* Timestamp & Video Stats */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#737373]">
                      <span className="inline-flex items-center gap-1 font-mono-studio">
                        <Calendar className="h-3 w-3 text-[#737373]" />
                        {formatDate(item.date)}
                      </span>

                      {typeof item.views === 'number' && (
                        <span className="inline-flex items-center gap-1 font-mono-studio text-[#9CA3AF]">
                          <Eye className="h-3 w-3 text-[#60A5FA]" />
                          {item.views.toLocaleString()} views
                        </span>
                      )}

                      {item.duration && (
                        <span className="inline-flex items-center gap-1 font-mono-studio">
                          <Clock className="h-3 w-3 text-[#737373]" />
                          {item.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-[#262626] w-full md:w-auto justify-end">
                  {item.type === 'video' && item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white text-xs font-semibold border border-red-500/30 hover:border-red-500/50 transition-all cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Watch Short</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  )}

                  {item.type === 'script' && item.rawScript && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedScript(item.rawScript!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] text-[#CBD5E1] hover:text-white text-xs font-semibold border border-[#2F2F2F] hover:border-white/20 transition-all cursor-pointer"
                        title="View complete script text"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#60A5FA]" />
                        <span>View script</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyScript(
                            `${item.rawScript?.title}\n\n${item.rawScript?.hook ? `Hook: ${item.rawScript.hook}\n\n` : ''}${item.rawScript?.quote || ''}`,
                            item.key
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#60A5FA] hover:text-white text-xs font-semibold border border-[#3B82F6]/30 hover:border-[#3B82F6]/60 transition-all cursor-pointer"
                        title="Copy script text"
                      >
                        {copiedId === item.key ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Script Inspection Modal */}
      {selectedScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#2F2F2F] bg-[#141414] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#262626] pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/25">
                  {selectedScript.category || 'Script'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedScript.title}</h3>
                <p className="text-xs text-[#9CA3AF]">{formatDate(selectedScript.generated_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScript(null)}
                className="rounded-lg p-1.5 text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedScript.hook && (
              <div className="rounded-xl border border-[#2F2F2F] bg-[#181818] p-3 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">Hook</p>
                <p className="text-sm text-[#E5E5E5] leading-relaxed">{selectedScript.hook}</p>
              </div>
            )}

            <div className="rounded-xl border border-[#2F2F2F] bg-[#121212] p-4 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Content / Quote</p>
              <p className="text-sm text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">{selectedScript.quote}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedScript(null)}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  handleCopyScript(
                    `${selectedScript.title}\n\n${selectedScript.hook ? `Hook: ${selectedScript.hook}\n\n` : ''}${selectedScript.quote}`,
                    selectedScript.id
                  );
                }}
              >
                {copiedId === selectedScript.id ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Full Script</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RecentStudioActivity;
