import React, { useState } from 'react';
import { ListVideo, Play, Plus, ExternalLink, Sparkles, Layers } from 'lucide-react';
import { Card, Badge, Button, Modal, Input } from '@/src/shared/ui/common';
import { YouTubeChannel, YouTubeLiveVideo } from '../types';

export interface YouTubePlaylistsPageProps {
  channels: YouTubeChannel[];
  liveVideos?: YouTubeLiveVideo[];
  onNavigate: (page: string) => void;
}

export const YouTubePlaylistsPage: React.FC<YouTubePlaylistsPageProps> = ({
  channels,
  liveVideos = [],
  onNavigate,
}) => {
  const activeChannel = channels[0];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Dynamic playlists derived from real channel videos
  const [playlists, setPlaylists] = useState<Array<{
    id: string;
    title: string;
    description: string;
    videoCount: number;
    lastUpdated: string;
    thumbnailUrl: string;
  }>>([]);

  React.useEffect(() => {
    if (liveVideos.length > 0) {
      setPlaylists([
        {
          id: 'pl-channel-uploads',
          title: 'Official Channel Uploads & Series',
          description: `All published videos and challenges on ${activeChannel?.name || 'the channel'}.`,
          videoCount: liveVideos.length,
          lastUpdated: 'Live Feed',
          thumbnailUrl: liveVideos[0].thumbnailUrl,
        },
        ...(liveVideos.length > 2
          ? [
              {
                id: 'pl-popular-challenges',
                title: 'Featured Challenges & Quizzes',
                description: `High-engagement uploads on ${activeChannel?.name || 'YouTube'}.`,
                videoCount: Math.min(5, liveVideos.length),
                lastUpdated: 'Live Feed',
                thumbnailUrl: liveVideos[1]?.thumbnailUrl || liveVideos[0].thumbnailUrl,
              },
            ]
          : []),
      ]);
    }
  }, [liveVideos, activeChannel?.name]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const fallbackThumb = liveVideos[0]?.thumbnailUrl || activeChannel?.avatarUrl || '';
    setPlaylists((prev) => [
      {
        id: `pl-${Date.now()}`,
        title: newTitle.trim(),
        description: newDesc.trim() || `Curated series on ${activeChannel?.name || 'YouTube'}.`,
        videoCount: 1,
        lastUpdated: 'Just now',
        thumbnailUrl: fallbackThumb,
      },
      ...prev,
    ]);
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#60A5FA] border border-blue-500/20">
            <ListVideo className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Channel Playlists &amp; Series</h3>
            <p className="text-xs text-[#9CA3AF]">
              Thematic collections to increase subscriber retention and binge-watching
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Playlist
        </Button>
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="rounded-2xl bg-[#141414] border border-[#2F2F2F] overflow-hidden hover:border-[#3B82F6] transition-all flex flex-col justify-between group shadow-xl"
          >
            {/* Playlist Thumbnail Cover with Stacked Effect */}
            <div className="aspect-video w-full relative overflow-hidden bg-[#0A0A0A] border-b border-[#262626]">
              <img
                src={pl.thumbnailUrl}
                alt={pl.title}
                onError={(e) => {
                  e.currentTarget.src = 'https://i.ytimg.com/vi/DXHgZhfhDGI/hqdefault.jpg';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-black/75 border border-white/20 text-white group-hover:scale-110 group-hover:bg-[#3B82F6] transition-all flex items-center justify-center shadow-xl">
                  <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                </div>
              </div>

              {/* Video Count Overlay Bar */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono-studio font-bold text-white shadow">
                <Layers className="w-3 h-3 text-[#60A5FA]" />
                <span>{pl.videoCount} videos</span>
              </div>
            </div>

            {/* Playlist Info */}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white group-hover:text-[#60A5FA] transition-colors leading-snug">
                  {pl.title}
                </h4>
                <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                  {pl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-[11px] text-[#6B7280]">
                <span>Updated: {pl.lastUpdated}</span>
                <span className="text-[#60A5FA] group-hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span>Play All</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Playlist Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Channel Playlist"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Playlist Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. 7-Day Stoic Focus Sprint"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What will viewers learn or experience in this playlist series?"
              rows={3}
              className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl p-3 text-xs text-white placeholder-[#6B7280] outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<Plus className="w-4 h-4" />}>
              Save Playlist
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default YouTubePlaylistsPage;
