import { useEffect, useState } from 'react';
import { Sparkles, Youtube, RefreshCw, Plus, Zap, Users, ArrowUpRight, Volume2 } from 'lucide-react';
import { Button, Card, Badge } from '@/src/shared/ui/common';
import { dashboardApi } from '../api/dashboardApi';
import { YouTubeChannel, YouTubeVideo } from '../types';
import { RecentStudioActivity } from '@/src/features/profile/components/RecentStudioActivity';

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getDashboardData();
      setChannels(data.channels);
      setVideos(data.videos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2F2F2F]">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-linear-to-tr from-[#3B82F6] to-[#2563EB] text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Automation Dashboard</h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Automated AI Motivational Shorts & YouTube Publishing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={loadData}>
            Refresh Stats
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
            New AI Quote Short
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Shorts Generated</span>
            <div className="p-2 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-3 tabular-nums font-mono-studio">{videos.length}</div>
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mt-2">
            <Zap className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Generated via Gemini API</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Total YouTube Views</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <Youtube className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-3 tabular-nums font-mono-studio">{totalViews.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mt-2">
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            <span>Live catalog engagement</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Channel Subscribers</span>
            <div className="p-2 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-3 tabular-nums font-mono-studio">
            {channels[0]?.subscribers !== undefined ? channels[0].subscribers.toLocaleString() : '0'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#60A5FA] mt-2">
            <span>{channels[0]?.handle ? `${channels[0].handle} Connected` : 'No Channel Connected'}</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Gemini TTS Voice Model</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-3 font-mono-studio">24kHz WAV</div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 mt-2">
            <span>gemini-3.8-flash-lite-tts</span>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F]">
              <div>
                <h3 className="text-lg font-bold text-white">Connected YouTube Channel</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Automated upload status and daily schedule</p>
              </div>
              <Button variant="outline" size="sm" icon={<ArrowUpRight className="w-3.5 h-3.5" />} onClick={() => onNavigate('youtube')}>
                Channel Manager
              </Button>
            </div>

            {channels.length === 0 ? (
              <div className="pt-6 pb-2 text-center text-[#9CA3AF] text-xs">
                <p>No YouTube channel connected yet.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => onNavigate('youtube')}>
                  Connect Channel
                </Button>
              </div>
            ) : (
              channels.map((ch) => (
                <div key={ch.id} className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={ch.avatarUrl} alt={ch.name} className="w-12 h-12 rounded-2xl bg-[#121212] border border-[#2F2F2F] p-1" />
                    <div>
                      <h4 className="font-bold text-white text-base">{ch.name}</h4>
                      <p className="text-xs text-[#9CA3AF]">{ch.handle} · {ch.niche}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={ch.isAutoUploadEnabled ? 'blue' : 'gray'}>
                      {ch.isAutoUploadEnabled ? `${ch.scheduleCron || 'Daily Schedule'} Active` : 'Auto-Upload Paused'}
                    </Badge>
                    <Button size="sm" icon={<Zap className="w-3.5 h-3.5" />} onClick={() => onNavigate('workspace')}>
                      Generate Now
                    </Button>
                  </div>

                </div>
              ))
            )}
          </Card>

          {/* Recent Studio Activity Component */}
          <RecentStudioActivity
            limit={6}
            showFilters={true}
            showSearch={true}
            title="Recent Studio Activity"
            subtitle="Latest AI generated scripts and published YouTube Shorts."
            onNavigate={onNavigate}
          />
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-linear-to-b from-[#1E1E1E] to-[#3B82F6]/10 border-[#3B82F6]/30">
            <div className="flex items-center gap-2 text-[#60A5FA] font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Studio Quick Automation</span>
            </div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Launch the AI Motivation Creation Studio to synthesize custom Gemini script monologues and voiceovers.
            </p>
            <Button variant="primary" className="w-full mt-4" icon={<Plus className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
              Open Creation Studio
            </Button>
          </Card>

        </div>
      </div>
    </div>
  );
}
