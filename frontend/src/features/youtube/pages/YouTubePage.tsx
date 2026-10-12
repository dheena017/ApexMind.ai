import React, { useEffect, useState } from 'react';
import { Youtube, Plus, Zap, RefreshCw, Clock, Play } from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '@/src/shared/ui/common';
import { youtubeApi } from '../api/youtubeApi';
import { YouTubeChannel, YouTubeVideo, AutomationJob } from '../types';

export default function YouTubePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [automations, setAutomations] = useState<AutomationJob[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [channelName, setChannelName] = useState('');
  const [handle, setHandle] = useState('');
  const [niche, setNiche] = useState('Motivational Quotes');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await youtubeApi.getYouTubeData();
      const autoData = await youtubeApi.getAutomations();
      setChannels(data.channels);
      setVideos(data.videos);
      setAutomations(autoData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConnectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newChan = await youtubeApi.connectYouTubeChannel(channelName, handle, niche);
      setChannels([...channels, newChan]);
      setShowConnectModal(false);
      setChannelName('');
      setHandle('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAuto = async (id: string) => {
    try {
      const updated = await youtubeApi.toggleAutomation(id);
      setAutomations(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2F2F2F]">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-lg shadow-red-500/10">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">YouTube Automation & Channel Manager</h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Manage connected YouTube channels, upload schedules, and video catalogs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={loadData}>
            Sync Channels
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowConnectModal(true)}>
            Connect YouTube Channel
          </Button>
        </div>
      </div>

      {/* Connected Channels Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">Connected YouTube Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {channels.length === 0 ? (
            <div className="col-span-full">
              <Card className="text-center py-10 space-y-3">
                <Youtube className="w-10 h-10 text-red-500/60 mx-auto" />
                <h4 className="text-base font-bold text-white">No YouTube Channels Connected</h4>
                <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
                  Connect your YouTube channel to enable automated Shorts uploading and scheduling.
                </p>
                <Button variant="primary" size="sm" onClick={() => setShowConnectModal(true)}>
                  Connect YouTube Channel
                </Button>
              </Card>
            </div>
          ) : (
            channels.map((ch) => (
              <Card key={ch.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img src={ch.avatarUrl} alt={ch.name} className="w-14 h-14 rounded-2xl bg-[#121212] border border-[#2F2F2F] p-1" />
                    <div>
                      <h4 className="font-extrabold text-white text-base">{ch.name}</h4>
                      <p className="text-xs text-[#9CA3AF]">{ch.handle} · {ch.niche}</p>
                      <div className="flex items-center gap-3 text-xs text-[#6B7280] mt-2">
                        <span className="font-bold text-white tabular-nums font-mono-studio">{ch.subscribers.toLocaleString()} subscribers</span>
                        <span>·</span>
                        <span>{ch.videosUploaded} Shorts</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="green">Connected</Badge>
                </div>

                <div className="mt-5 pt-4 border-t border-[#2F2F2F] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#60A5FA] font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Auto-Publish: {ch.scheduleCron}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onNavigate('workspace')}>
                    Generate Short
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Scheduled Automation Rules */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F] mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Automated Daily Upload Schedule</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Recurring pipelines that auto-generate scripts & publish shorts</p>
          </div>
          <Badge variant="blue">2 Active Pipelines</Badge>
        </div>

        <div className="space-y-3">
          {automations.map((auto) => (
            <div key={auto.id} className="p-4 rounded-xl bg-[#121212] border border-[#2F2F2F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#3B82F6]" />
                  <h4 className="font-bold text-white text-sm">{auto.theme}</h4>
                </div>
                <p className="text-xs text-[#9CA3AF]">Schedule: {auto.schedule} · Voice: {auto.voice} · Track: {auto.musicTrack}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B7280] font-mono-studio">Next: {new Date(auto.nextRun).toLocaleDateString()}</span>
                <button
                  onClick={() => handleToggleAuto(auto.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    auto.active
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-gray-800 border-gray-700 text-[#9CA3AF]'
                  }`}
                >
                  {auto.active ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Published Video Catalog */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F] mb-4">
          <h3 className="text-lg font-bold text-white">YouTube Shorts Catalog</h3>
          <span className="text-xs text-[#9CA3AF]">{videos.length} Published Videos</span>
        </div>

        <div className="divide-y divide-[#2F2F2F]">
          {videos.map((vid) => (
            <div key={vid.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-[#3B82F6]/30 to-[#121212] border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] font-bold text-xs shrink-0 shadow">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{vid.title}</h4>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 italic">"{vid.quote}"</p>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1">
                    <span>{new Date(vid.publishedAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>Voice: {vid.voice}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-bold text-white tabular-nums font-mono-studio">{vid.views.toLocaleString()} views</div>
                  <div className="text-xs text-emerald-400 font-medium">{vid.likes.toLocaleString()} likes</div>
                </div>
                <Badge variant="green">Published</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Connect Channel Modal */}
      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Connect YouTube Channel">
        <form onSubmit={handleConnectChannel} className="space-y-4">
          <Input label="Channel Name" value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="E.g., ApexMind Mindset" required />
          <Input label="Channel Handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="E.g., @apexmindmindset" required />
          <Input label="Content Niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="E.g., Motivational Quotes" required />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowConnectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Connect Channel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
