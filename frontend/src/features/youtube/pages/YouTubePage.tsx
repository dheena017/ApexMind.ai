import React, { useEffect, useState } from 'react';
import {
  Youtube,
  Plus,
  Zap,
  RefreshCw,
  Clock,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  Sliders,
  Trash2,
  Film,
  Sparkles,
  Users,
  Video,
  Copy,
  Check,
  Calendar,
  Layers,
  Radio,
  ArrowUpRight,
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '@/src/shared/ui/common';
import { youtubeApi } from '../api/youtubeApi';
import {
  YouTubeChannel,
  YouTubeVideo,
  AutomationJob,
  YouTubeLookupResult,
  YouTubeLiveShort,
} from '../types';

export default function YouTubePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [automations, setAutomations] = useState<AutomationJob[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Channel details interactive states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedFilterChannel, setSelectedFilterChannel] = useState<string>('all');
  const [togglingAutoUploadId, setTogglingAutoUploadId] = useState<string | null>(null);

  // Connect Channel Modal & Live Lookup
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [channelInput, setChannelInput] = useState('');
  const [niche, setNiche] = useState('');

  const [lookupResult, setLookupResult] = useState<YouTubeLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  // Correct Handle Modal
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [channelToCorrect, setChannelToCorrect] = useState<YouTubeChannel | null>(null);
  const [newHandleInput, setNewHandleInput] = useState('');
  const [correctLoading, setCorrectLoading] = useState(false);

  // Sync state per channel
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Live Shorts Explorer
  const [selectedChannelForShorts, setSelectedChannelForShorts] = useState<YouTubeChannel | null>(null);
  const [liveShorts, setLiveShorts] = useState<YouTubeLiveShort[]>([]);
  const [liveShortsLoading, setLiveShortsLoading] = useState(false);

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

  // Show temporary status notification
  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4500);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    notify(`Channel ID copied: ${id}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleAutoUpload = async (ch: YouTubeChannel) => {
    setTogglingAutoUploadId(ch.id);
    try {
      const nextStatus = !ch.isAutoUploadEnabled;
      const updated = await youtubeApi.updateChannel(ch.id, { isAutoUploadEnabled: nextStatus });
      setChannels((prev) => prev.map((item) => (item.id === ch.id ? updated : item)));
      notify(`Auto-upload ${nextStatus ? 'enabled' : 'paused'} for ${ch.name}`);
    } catch (err: any) {
      notify(`Failed to toggle auto-upload: ${err.message}`);
    } finally {
      setTogglingAutoUploadId(null);
    }
  };

  // Perform Live YouTube channel lookup
  const handleLookupChannel = async (queryToLookup?: string) => {
    const q = (queryToLookup || channelInput).trim();
    if (!q) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const result = await youtubeApi.lookupChannel(q);
      setLookupResult(result);
    } catch (err: any) {
      setLookupError(err.message || 'Could not find YouTube channel. Check handle and retry.');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Connect verified or manual channel
  const handleConnectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectLoading(true);
    try {
      const payload = lookupResult
        ? {
            channelName: lookupResult.name,
            handle: lookupResult.handle,
            niche: niche || 'General motivation',
            avatarUrl: lookupResult.avatarUrl,
            subscribers: lookupResult.subscribers,
            videosUploaded: lookupResult.videosUploaded,
            autoResolve: false,
          }
        : {
            handle: channelInput,
            niche: niche || 'General motivation',
            autoResolve: true,
          };

      const newChan = await youtubeApi.connectYouTubeChannel(payload);
      setChannels((prev) => [newChan, ...prev.filter((c) => c.id !== newChan.id)]);
      setShowConnectModal(false);
      setLookupResult(null);
      setChannelInput('');
      notify(`Connected & verified YouTube channel: ${newChan.name} (${newChan.handle})`);
    } catch (e: any) {
      setLookupError(e.message || 'Failed to connect YouTube channel');
    } finally {
      setConnectLoading(false);
    }
  };

  // Sync channel with live YouTube
  const handleSyncChannel = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await youtubeApi.syncChannel(id);
      setChannels((prev) => prev.map((c) => (c.id === id ? res.channel : c)));
      notify(res.message);
    } catch (err: any) {
      notify(`Sync failed: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  // Open Correct Handle Modal
  const openCorrectModal = (ch: YouTubeChannel) => {
    setChannelToCorrect(ch);
    setNewHandleInput(ch.handle);
    setShowCorrectModal(true);
  };

  // Execute Correction
  const handleCorrectChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelToCorrect) return;
    setCorrectLoading(true);
    try {
      const res = await youtubeApi.correctChannel(channelToCorrect.id, newHandleInput);
      setChannels((prev) => prev.map((c) => (c.id === channelToCorrect.id ? res.channel : c)));
      setShowCorrectModal(false);
      notify(res.message);
    } catch (err: any) {
      notify(`Correction error: ${err.message}`);
    } finally {
      setCorrectLoading(false);
    }
  };

  // Remove channel
  const handleDeleteChannel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name}?`)) return;
    try {
      await youtubeApi.deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (selectedChannelForShorts?.id === id) {
        setSelectedChannelForShorts(null);
        setLiveShorts([]);
      }
      notify(`Disconnected YouTube channel: ${name}`);
    } catch (err: any) {
      notify(`Failed to disconnect: ${err.message}`);
    }
  };

  // Load Live Shorts for Channel
  const handleLoadLiveShorts = async (ch: YouTubeChannel) => {
    setSelectedChannelForShorts(ch);
    setLiveShortsLoading(true);
    try {
      const shorts = await youtubeApi.getLiveShorts(ch.id, 12);
      setLiveShorts(shorts);
      notify(`Fetched ${shorts.length} live Shorts from ${ch.name}`);
    } catch (err: any) {
      notify(`Could not load live shorts: ${err.message}`);
    } finally {
      setLiveShortsLoading(false);
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
    <div className="flex-1 w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] p-6 lg:p-8 space-y-8 font-sans-studio">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2F2F2F]">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-lg shadow-red-500/10">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                YouTube Automation & Channel Manager
              </h1>
              <Badge variant="blue">Live Service Active</Badge>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Connect and verify YouTube channels with real-time live subscriber metrics, catalogs, and Shorts workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Sync All
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setLookupResult(null);
              setLookupError(null);
              setShowConnectModal(true);
            }}
          >
            Connect YouTube Channel
          </Button>
        </div>
      </div>

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#60A5FA] shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-blue-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Channel Portfolio Overview Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
            <Youtube className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Connected Channels</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{channels.length}</p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Verified
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Audience Reach</p>
            <p className="text-xl font-extrabold text-white mt-0.5 font-mono-studio">
              {channels.reduce((sum, c) => sum + (c.subscribers || 0), 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-[#93C5FD] font-medium mt-0.5">Total Subscribers</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">YouTube Uploads</p>
            <p className="text-xl font-extrabold text-white mt-0.5 font-mono-studio">
              {channels.reduce((sum, c) => sum + (c.videosUploaded || 0), 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-[#C084FC] font-medium mt-0.5">Channel Videos</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Automation Status</p>
            <p className="text-xl font-extrabold text-white mt-0.5 font-mono-studio">
              {channels.filter((c) => c.isAutoUploadEnabled).length} / {channels.length} Active
            </p>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Scheduled Publishing</p>
          </div>
        </div>
      </div>

      {/* Connected Channels Grid with All Channel Data Displayed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">
            Connected YouTube Channels ({channels.length})
          </h3>
          <span className="text-xs text-[#6B7280]">Live Verified via YouTube Data API v3</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {channels.length === 0 ? (
            <div className="col-span-full">
              <Card className="text-center py-12 space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 w-fit mx-auto">
                  <Youtube className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">No YouTube Channels Connected</h4>
                  <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
                    Connect your YouTube channel using your @handle or URL to automatically fetch and verify live channel stats, subscribers, and enable automated Shorts publishing.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setChannelInput('');
                      setShowConnectModal(true);
                    }}
                  >
                    Connect with YouTube Handle
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            channels.map((ch) => {
              const isSyncing = syncingId === ch.id;
              const isToggling = togglingAutoUploadId === ch.id;
              const ytUrl = ch.handle.startsWith('@')
                ? `https://www.youtube.com/${ch.handle}`
                : `https://www.youtube.com/@${ch.handle}`;
              const studioUrl = 'https://studio.youtube.com';
              const channelVideos = videos.filter((v) => v.channelId === ch.id);

              return (
                <Card key={ch.id} className="relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all p-6 space-y-5 bg-[#171717] border-[#2F2F2F] shadow-xl">
                  {/* Top Bar with Niche, Auto-Upload Toggle & Direct Action Links */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2F2F2F]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-semibold">
                        {ch.niche || 'Motivational Quotes'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleAutoUpload(ch)}
                        disabled={isToggling}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          ch.isAutoUploadEnabled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-gray-800 border-gray-700 text-[#9CA3AF] hover:text-white'
                        }`}
                        title="Click to toggle automated Shorts publishing"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ch.isAutoUploadEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                        <span>{ch.isAutoUploadEnabled ? 'Auto-Upload Active' : 'Auto-Upload Paused'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={ytUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white hover:border-[#60A5FA] transition-all text-xs flex items-center gap-1"
                        title="View Channel on YouTube"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <span className="hidden sm:inline">Channel</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                      <a
                        href={studioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white hover:border-[#60A5FA] transition-all text-xs flex items-center gap-1"
                        title="Open YouTube Studio"
                      >
                        <span className="hidden sm:inline">Studio</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleDeleteChannel(ch.id, ch.name)}
                        className="p-1 rounded-lg bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                        title="Disconnect channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Channel Identity Header */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={ch.avatarUrl}
                        alt={ch.name}
                        className="w-16 h-16 rounded-2xl bg-[#121212] border-2 border-[#2F2F2F] p-0.5 object-cover shadow-lg"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#171717] flex items-center justify-center text-[9px] text-white font-bold" title="Channel Active">
                        ✓
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-white text-lg tracking-tight truncate hover:text-[#60A5FA] transition-colors">
                          {ch.name}
                        </h4>
                        <span
                          title="Verified on YouTube"
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] text-xs font-bold shrink-0"
                        >
                          ✓
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF]">
                        <a
                          href={ytUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white text-[#60A5FA] font-medium font-mono-studio inline-flex items-center gap-1"
                        >
                          {ch.handle}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(ch.id)}
                          className="inline-flex items-center gap-1 font-mono-studio text-[11px] text-[#9CA3AF] hover:text-white bg-[#121212] px-2 py-0.5 rounded border border-[#2F2F2F] cursor-pointer"
                          title="Click to copy Database ID"
                        >
                          <span>ID: {ch.id}</span>
                          {copiedId === ch.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#6B7280]" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] pt-0.5 font-mono-studio">
                        <Calendar className="w-3 h-3" />
                        <span>Connected: {new Date(ch.connectedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive 4-Metric Grid per Channel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#121212] border border-[#2F2F2F]">
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
                        <span className="text-[11px] uppercase font-semibold">Subscribers</span>
                        <Users className="w-3.5 h-3.5 text-[#60A5FA]" />
                      </div>
                      <p className="text-base font-extrabold text-white tabular-nums font-mono-studio">
                        {ch.subscribers.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-medium">Live YouTube</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121212] border border-[#2F2F2F]">
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
                        <span className="text-[11px] uppercase font-semibold">Total Videos</span>
                        <Video className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <p className="text-base font-extrabold text-white tabular-nums font-mono-studio">
                        {ch.videosUploaded.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-purple-300 font-medium">Channel Total</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121212] border border-[#2F2F2F]">
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
                        <span className="text-[11px] uppercase font-semibold">Shorts Catalog</span>
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-base font-extrabold text-white tabular-nums font-mono-studio">
                        {channelVideos.length}
                      </p>
                      <span className="text-[10px] text-amber-300 font-medium">ApexMind Shorts</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121212] border border-[#2F2F2F]">
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
                        <span className="text-[11px] uppercase font-semibold">Schedule</span>
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-xs font-bold text-white truncate" title={ch.scheduleCron}>
                        {ch.scheduleCron.includes('at') ? ch.scheduleCron.split('at')[1].trim() : ch.scheduleCron}
                      </p>
                      <span className="text-[10px] text-emerald-300 font-medium">Automated Cron</span>
                    </div>
                  </div>

                  {/* Channel Production Specifications Strip */}
                  <div className="p-3 rounded-xl bg-[#121212]/80 border border-[#2F2F2F] text-xs flex flex-wrap items-center justify-between gap-3 text-[#9CA3AF]">
                    <div className="flex items-center gap-1.5 font-medium text-white">
                      <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
                      <span>{ch.scheduleCron}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span>Voice: <strong className="text-white">Fenrir (24kHz)</strong></span>
                      <span>·</span>
                      <span>Format: <strong className="text-white">1080x1920 (9:16)</strong></span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">API Verified</span>
                    </div>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
                        disabled={isSyncing}
                        onClick={() => handleSyncChannel(ch.id)}
                        title="Query YouTube Data API to verify real live metrics"
                      >
                        {isSyncing ? 'Syncing…' : 'Sync Live'}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Film className="w-3.5 h-3.5" />}
                        onClick={() => handleLoadLiveShorts(ch)}
                        title="Load recent live shorts feed"
                      >
                        Live Feed
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Sliders className="w-3.5 h-3.5" />}
                        onClick={() => openCorrectModal(ch)}
                        title="Change handle or query"
                      >
                        Edit Handle
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        onClick={() => onNavigate('workspace')}
                      >
                        Create Short
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Live YouTube Shorts Explorer (If Channel Selected) */}
      {selectedChannelForShorts && (
        <Card className="border-[#3B82F6]/30 bg-gradient-to-b from-[#1E1E1E] to-[#121212]">
          <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F] mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Live YouTube Shorts: {selectedChannelForShorts.name} ({selectedChannelForShorts.handle})
                </h3>
                <p className="text-xs text-[#9CA3AF]">
                  Recent short-form content retrieved directly from live YouTube channel feed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${liveShortsLoading ? 'animate-spin' : ''}`} />}
                onClick={() => handleLoadLiveShorts(selectedChannelForShorts)}
              >
                Refresh
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedChannelForShorts(null);
                  setLiveShorts([]);
                }}
              >
                Close
              </Button>
            </div>
          </div>

          {liveShortsLoading ? (
            <div className="py-12 text-center text-[#9CA3AF] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#3B82F6]" />
              <p className="text-xs">Fetching live YouTube Shorts feed for {selectedChannelForShorts.handle}…</p>
            </div>
          ) : liveShorts.length === 0 ? (
            <div className="py-8 text-center text-[#9CA3AF]">
              <p className="text-xs">No live Shorts found on this channel yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {liveShorts.map((sh) => (
                <a
                  key={sh.id}
                  href={sh.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl overflow-hidden border border-[#2F2F2F] bg-[#0A0A0A] hover:border-[#3B82F6] transition-all flex flex-col"
                >
                  <div className="aspect-[9/16] bg-[#171717] relative overflow-hidden">
                    {sh.thumbnailUrl ? (
                      <img
                        src={sh.thumbnailUrl}
                        alt={sh.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Play className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-bold text-white drop-shadow">
                      <span className="font-mono-studio">{sh.views}</span>
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </div>
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h5 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-[#60A5FA]">
                      {sh.title}
                    </h5>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Scheduled Automation Rules */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F] mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Automated Daily Upload Schedule</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Recurring pipelines that auto-generate scripts & publish shorts</p>
          </div>
          <Badge variant="blue">{automations.filter((a) => a.active).length} Active Pipelines</Badge>
        </div>

        <div className="space-y-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="p-4 rounded-xl bg-[#121212] border border-[#2F2F2F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#3B82F6]" />
                  <h4 className="font-bold text-white text-sm">{auto.theme}</h4>
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Schedule: {auto.schedule} · Voice: {auto.voice} · Track: {auto.musicTrack}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B7280] font-mono-studio">
                  Next: {new Date(auto.nextRun).toLocaleDateString()}
                </span>
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

      {/* Published Video Catalog with Channel Filtering */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2F2F2F] mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">YouTube Shorts Catalog</h3>
            <p className="text-xs text-[#9CA3AF]">Completed video productions and uploaded YouTube Shorts</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedFilterChannel('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilterChannel === 'all'
                  ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/20'
                  : 'bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white'
              }`}
            >
              All Channels ({videos.length})
            </button>
            {channels.map((ch) => {
              const count = videos.filter((v) => v.channelId === ch.id).length;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedFilterChannel(ch.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    selectedFilterChannel === ch.id
                      ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/20'
                      : 'bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <img src={ch.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                  <span>{ch.name}</span>
                  <span className="opacity-70 font-mono-studio">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {(() => {
          const displayVideos = selectedFilterChannel === 'all'
            ? videos
            : videos.filter((v) => v.channelId === selectedFilterChannel);

          return (
            <div className="divide-y divide-[#2F2F2F]">
              {displayVideos.length === 0 ? (
                <div className="py-10 text-center text-[#9CA3AF] space-y-2">
                  <Film className="w-8 h-8 text-[#6B7280] mx-auto opacity-50" />
                  <p className="text-xs">
                    {selectedFilterChannel === 'all'
                      ? 'No rendered shorts published to catalog yet. Use AI Studio to create one!'
                      : 'No shorts published for this channel yet.'}
                  </p>
                  <Button size="sm" variant="primary" onClick={() => onNavigate('workspace')}>
                    Launch Studio
                  </Button>
                </div>
              ) : (
                displayVideos.map((vid) => {
                  const targetChannel = channels.find((c) => c.id === vid.channelId);
                  return (
                    <div
                      key={vid.id}
                      className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#121212]/40 transition-colors px-2 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-[#3B82F6]/30 to-[#121212] border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] font-bold text-xs shrink-0 shadow">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{vid.title}</h4>
                            {targetChannel && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#252525] text-[#93C5FD] border border-[#333] font-medium flex items-center gap-1">
                                <Youtube className="w-2.5 h-2.5 text-red-400" />
                                {targetChannel.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#9CA3AF] italic">"{vid.quote}"</p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280]">
                            <span>{new Date(vid.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span>·</span>
                            <span>Voice: {vid.voice || 'Fenrir'}</span>
                            <span>·</span>
                            <span>Category: {vid.category}</span>
                            <span>·</span>
                            <span>Duration: {vid.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-white tabular-nums font-mono-studio">
                            {vid.views.toLocaleString()} views
                          </div>
                          <div className="text-xs text-emerald-400 font-medium">{vid.likes.toLocaleString()} likes</div>
                        </div>
                        <Badge variant="green">Published</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}
      </Card>

      {/* Connect YouTube Channel Modal with Real Live Verification */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title="Connect & Verify YouTube Channel"
      >
        <form onSubmit={handleConnectChannel} className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            Enter a YouTube handle or channel URL to fetch real live subscriber and video metrics.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
              YouTube Channel Handle or URL
            </label>
            <div className="flex gap-2">
              <input
                value={channelInput}
                onChange={(e) => {
                  setChannelInput(e.target.value);
                  setLookupResult(null);
                  setLookupError(null);
                }}
                placeholder="Enter a YouTube handle or channel URL"
                className="flex-1 bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#3B82F6]"
                required
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Search className={`w-3.5 h-3.5 ${lookupLoading ? 'animate-spin' : ''}`} />}
                disabled={lookupLoading || !channelInput.trim()}
                onClick={() => handleLookupChannel()}
              >
                {lookupLoading ? 'Checking…' : 'Verify'}
              </Button>
            </div>
          </div>

          {/* Lookup Error */}
          {lookupError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Live Preview Card */}
          {lookupResult && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#121212] via-[#1E1E1E] to-[#121212] border border-[#3B82F6]/40 space-y-3 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <img
                  src={lookupResult.avatarUrl}
                  alt={lookupResult.name}
                  className="w-14 h-14 rounded-2xl bg-[#0A0A0A] border border-[#2F2F2F] object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-white text-base truncate">{lookupResult.name}</h4>
                    {lookupResult.verified && (
                      <span className="text-xs bg-[#3B82F6]/20 text-[#60A5FA] px-1.5 py-0.5 rounded font-bold">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#60A5FA] font-mono-studio">{lookupResult.handle}</p>
                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mt-1 font-mono-studio">
                    <span className="font-bold text-white">{lookupResult.subscribers.toLocaleString()} subscribers</span>
                    <span>·</span>
                    <span>{lookupResult.videosUploaded.toLocaleString()} videos</span>
                  </div>
                </div>
              </div>
              {lookupResult.description && (
                <p className="text-[11px] text-[#9CA3AF] line-clamp-2 italic border-t border-[#2F2F2F] pt-2">
                  "{lookupResult.description}"
                </p>
              )}
            </div>
          )}

          <Input
            label="Content Niche / Studio Focus"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Enter your content niche or focus area"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowConnectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={connectLoading}
              icon={connectLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            >
              {connectLoading ? 'Connecting…' : 'Connect Channel'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Correct Channel Handle Modal */}
      <Modal
        isOpen={showCorrectModal}
        onClose={() => setShowCorrectModal(false)}
        title="Correct YouTube Channel Link"
      >
        <form onSubmit={handleCorrectChannel} className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            Update or fix the YouTube handle for <strong className="text-white">{channelToCorrect?.name}</strong>.
            ApexMind will verify with live YouTube and refresh all metrics.
          </p>

          <Input
            label="Updated YouTube Handle or URL"
            value={newHandleInput}
            onChange={(e) => setNewHandleInput(e.target.value)}
            placeholder="Enter the corrected YouTube handle or URL"
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowCorrectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={correctLoading}
              icon={correctLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              {correctLoading ? 'Correcting…' : 'Save & Correct'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
