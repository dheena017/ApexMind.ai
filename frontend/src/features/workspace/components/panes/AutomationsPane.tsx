import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Clock,
  Zap,
  Play,
  Pause,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Video,
  Youtube,
  ChevronDown,
  ChevronUp,
  History,
  Globe,
  Square,
} from 'lucide-react';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { AutomationJob, AutomationHistoryEntry, YouTubeChannel } from '@/src/features/youtube/types';
import { WorkspaceTabType } from '../WorkspaceSidebar';
import { toast } from 'sonner';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import useAuth from '@/src/features/auth/hooks/useAuth';
import { DEFAULT_SCRIPT_MODEL, DEFAULT_SCRIPT_MODEL_LABEL } from '@/src/shared/aiModels';
import { useAvailableScriptModels } from '@/src/shared/hooks/useAvailableScriptModels';
import { ScrollableTabs, TabItem } from '@/src/shared/ui/ScrollableTabs';

export interface AutomationsPaneProps {
  onNavigate?: (page: string) => void;
  onPaneChange?: (pane: WorkspaceTabType) => void;
  className?: string;
  activeTimeline?: {
    videoClips?: any[];
    imageClips?: any[];
    subtitles?: any[];
    title?: string;
    quote?: string;
    audioUrl?: string;
    musicUrl?: string;
    duration?: number;
  };
}

const THEME_OPTIONS = [
  'Stoic Mindset & Discipline',
  'Fitness & Iron Will',
  'Deep Focus & Flow',
  'Calm & Resilience',
  'Unstoppable Motivation',
];

const ASPECT_RATIO_OPTIONS = [
  { value: '9:16', label: '9:16 (Vertical • Shorts / Reels)' },
  { value: '16:9', label: '16:9 (Landscape • YouTube Video)' },
  { value: '1:1', label: '1:1 (Square • Instagram / Feed)' },
];

const LENGTH_OPTIONS = [
  { value: '15 seconds', label: '15 Seconds (Fast Cut)' },
  { value: '30 seconds', label: '30 Seconds (Standard • Recommended)' },
  { value: '45 seconds', label: '45 Seconds (Extended)' },
  { value: '60 seconds', label: '60 Seconds (Deep Dive)' },
];

const VOICE_OPTIONS = [
  { id: 'Fenrir', name: 'Fenrir (Deep, Stoic Leader)', gender: 'Male' },
  { id: 'Kore', name: 'Kore (Clear, Inspiring, Authoritative)', gender: 'Female' },
  { id: 'Puck', name: 'Puck (High-Octane Motivational)', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr (Smooth, Calming Wisdom)', gender: 'Female' },
  { id: 'Charon', name: 'Charon (Grit & Relentless Focus)', gender: 'Male' },
];

const MUSIC_OPTIONS = [
  'Epic Cinematic',
  'Ambient Lo-Fi',
  'Dark Phonk Bass',
  'Triumphant Strings',
  'None (Voice Only)',
];

const INTERVAL_OPTIONS = [
  { value: 'every_30m', label: 'Every 30 Minutes', schedule: 'Every 30 Minutes' },
  { value: 'every_1h', label: 'Every 1 Hour', schedule: 'Every 1 Hour' },
  { value: 'every_2h', label: 'Every 2 Hours', schedule: 'Every 2 Hours' },
  { value: 'every_3h', label: 'Every 3 Hours (Recommended)', schedule: 'Every 3 Hours' },
  { value: 'every_4h', label: 'Every 4 Hours', schedule: 'Every 4 Hours' },
  { value: 'every_6h', label: 'Every 6 Hours', schedule: 'Every 6 Hours' },
  { value: 'every_8h', label: 'Every 8 Hours', schedule: 'Every 8 Hours' },
  { value: 'every_12h', label: 'Every 12 Hours', schedule: 'Every 12 Hours' },
  { value: 'custom', label: 'Custom Interval...', schedule: 'Custom' },
];

const DEFAULT_CHANNEL = {
  id: '',
  name: 'YouTube Channel',
  handle: '@channel',
  avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=creator',
  bannerUrl: '',
  channelUrl: 'https://www.youtube.com',
  subscribers: 0,
  videosUploaded: 0,
};

export const AutomationsPane: React.FC<AutomationsPaneProps> = ({
  onNavigate,
  onPaneChange,
  className = '',
  activeTimeline,
}) => {
  const { user } = useAuth();
  const { models: scriptModels, defaultModel, loading: modelsLoading, error: modelsError } =
    useAvailableScriptModels();
  const [automations, setAutomations] = useState<AutomationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'pipelines' | 'create' | 'channel'>('pipelines');
  const [creating, setCreating] = useState(false);

  // Form inputs
  const [theme, setTheme] = useState('Stoic Mindset & Discipline');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'interval'>('interval');
  const [publishTime, setPublishTime] = useState('08:00');
  const [intervalSelection, setIntervalSelection] = useState('every_3h');
  const [customValue, setCustomValue] = useState(3);
  const [customUnit, setCustomUnit] = useState<'hours' | 'minutes'>('hours');
  const [voice, setVoice] = useState('Fenrir');
  const [aiModel, setAiModel] = useState(DEFAULT_SCRIPT_MODEL);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [length, setLength] = useState('30 seconds');
  const [musicTrack, setMusicTrack] = useState('Epic Cinematic');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'scheduled'>('public');

  useEffect(() => {
    if (!scriptModels.length) return;
    setAiModel((current: string) =>
      scriptModels.some((model) => model.value === current) ? current : defaultModel,
    );
  }, [scriptModels, defaultModel]);

  // Channel authorization state & runtime execution feedback
  const [authStatus, setAuthStatus] = useState<{ connected: boolean; channel?: YouTubeChannel } | null>(() => {
    return { connected: false, channel: DEFAULT_CHANNEL };
  });
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const [liveChannelBanner, setLiveChannelBanner] = useState('');
  const [liveChannelBannerLoading, setLiveChannelBannerLoading] = useState(false);
  const [liveChannelBannerError, setLiveChannelBannerError] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  // Live countdown, Run History, Pause/Resume & Safe Delete state
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [historyByJob, setHistoryByJob] = useState<Record<string, AutomationHistoryEntry[]>>({});
  const [loadingHistoryByJob, setLoadingHistoryByJob] = useState<Record<string, boolean>>({});
  const [expandedHistoryJobs, setExpandedHistoryJobs] = useState<Record<string, boolean>>({});
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState<string | null>(null);
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);

  // Live tick every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAutomations = async (userIdOverride?: string) => {
    setLoading(true);
    try {
      const effectiveUid = userIdOverride !== undefined ? userIdOverride : user?.id;
      const data = await youtubeApi.getAutomations(effectiveUid);
      setAutomations(data);
      // Automatically prefetch history for every automation schedule
      if (Array.isArray(data)) {
        data.forEach((job) => {
          loadHistory(job.id, true, effectiveUid);
        });
      }
    } catch (err: any) {
      console.warn('Failed to load automations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (jobId: string, force = false, userIdOverride?: string) => {
    if (!force && historyByJob[jobId]) return;
    setLoadingHistoryByJob((prev) => ({ ...prev, [jobId]: true }));
    try {
      const effectiveUid = userIdOverride !== undefined ? userIdOverride : user?.id;
      const entries = await youtubeApi.getAutomationHistory(jobId, effectiveUid);
      setHistoryByJob((prev) => ({ ...prev, [jobId]: entries }));
    } catch (err) {
      console.warn(`Failed to load history for ${jobId}:`, err);
    } finally {
      setLoadingHistoryByJob((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleClearHistory = async (jobId: string) => {
    try {
      await youtubeApi.clearAutomationHistory(jobId, user?.id);
      setHistoryByJob((prev) => ({ ...prev, [jobId]: [] }));
      toast.success('Run history cleared');
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear history');
    }
  };

  const activeChannel = {
    id: authStatus?.channel?.id || authStatus?.channel?.channelId || '',
    name: authStatus?.channel?.name || (user?.name ? `${user.name} Channel` : DEFAULT_CHANNEL.name),
    handle: authStatus?.channel?.handle || user?.handle || DEFAULT_CHANNEL.handle,
    avatarUrl: authStatus?.channel?.avatarUrl || user?.avatarUrl || DEFAULT_CHANNEL.avatarUrl,
    bannerUrl: authStatus?.channel?.bannerUrl || DEFAULT_CHANNEL.bannerUrl,
    channelUrl: authStatus?.channel?.channelUrl || DEFAULT_CHANNEL.channelUrl,
  };
  const hasSelectedYouTubeChannel = Boolean(
    activeChannel.id,
  );

  useEffect(() => {
    if (!activeChannel.id) {
      setLiveChannelBanner('');
      setLiveChannelBannerLoading(false);
      setLiveChannelBannerError(false);
      return;
    }

    let cancelled = false;
    setLiveChannelBanner('');
    setLiveChannelBannerLoading(true);
    setLiveChannelBannerError(false);
    youtubeApi.getChannelDetails(activeChannel.handle || activeChannel.id)
      .then((details) => {
        if (!cancelled) setLiveChannelBanner(details.bannerUrl || '');
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('Could not load the YouTube channel banner:', error);
          setLiveChannelBannerError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLiveChannelBannerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeChannel.id, activeChannel.handle]);

  const loadAuthStatus = async () => {
    setAuthStatusLoading(true);
    setAuthStatus({ connected: false, channel: DEFAULT_CHANNEL });
    try {
      const [statusResult, channelsResult] = await Promise.allSettled([
        youtubeApi.getAuthStatus(),
        youtubeApi.getChannels(),
      ]);
      const channels = channelsResult.status === 'fulfilled' ? channelsResult.value : [];
      const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
      const serverSelectedChannel = status?.activeChannelId
        ? channels.find((item) => item.id === status.activeChannelId)
        : undefined;
      const statusChannel = status?.connected ? status.channel as YouTubeChannel | undefined : undefined;
      const requestFailed = statusResult.status === 'rejected' || channelsResult.status === 'rejected';
      const channel = serverSelectedChannel || statusChannel;
      const connected = Boolean(status?.connected && channel);
      if (statusResult.status === 'rejected' || channelsResult.status === 'rejected') {
        console.warn('Could not fully verify the selected YouTube channel.', {
          statusError: statusResult.status === 'rejected' ? statusResult.reason : undefined,
          channelsError: channelsResult.status === 'rejected' ? channelsResult.reason : undefined,
        });
      }
      setAuthStatus(channel
        ? { connected, channel }
        : { connected: false, channel: DEFAULT_CHANNEL });
      if (connected && channel) {
        localStorage.setItem('apexmind_yt_channel', JSON.stringify({ ...channel, userId: user?.id }));
        if (channel.handle) localStorage.setItem('apexmind_yt_active_channel', channel.handle);
      } else if (!requestFailed) {
        localStorage.removeItem('apexmind_yt_channel');
        localStorage.removeItem('apexmind_yt_active_channel');
      }
    } catch (error) {
      console.warn('Could not load the connected YouTube channel:', error);
      setAuthStatus({ connected: false, channel: DEFAULT_CHANNEL });
    } finally {
      setAuthStatusLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations(user?.id);
    loadAuthStatus();

    const refreshChannel = () => {
      if (document.visibilityState === 'visible') {
        void loadAuthStatus();
      }
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'apexmind_yt_active_channel' || event.key === 'apexmind_social_active_account') {
        refreshChannel();
      }
    };

    window.addEventListener('focus', refreshChannel);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', refreshChannel);
    return () => {
      window.removeEventListener('focus', refreshChannel);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', refreshChannel);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleChannelSwitched = (event: Event) => {
      const { platform } = (event as CustomEvent<{
        platform?: string;
      }>).detail || {};
      if (platform && platform !== 'youtube') return;
      void loadAuthStatus();
    };
    window.addEventListener('youtube:channel-switched', handleChannelSwitched);
    return () => window.removeEventListener('youtube:channel-switched', handleChannelSwitched);
  }, [user?.id]);

  const previousStatusesRef = React.useRef<Record<string, AutomationJob['lastStatus']>>({});

  useEffect(() => {
    automations.forEach((job) => {
      const previousStatus = previousStatusesRef.current[job.id];
      if (previousStatus === 'running' && job.lastStatus !== 'running') {
        if (job.lastStatus === 'success') {
          toast.success(`Pipeline complete: "${job.lastVideoTitle || job.theme}".`);
        } else if (job.lastStatus === 'failed') {
          toast.error(job.lastRunMessage || `Pipeline failed for "${job.theme}".`);
        }
        loadHistory(job.id, true, user?.id);
      }
      previousStatusesRef.current[job.id] = job.lastStatus;
    });
  }, [automations, user?.id]);

  useEffect(() => {
    if (!automations.some((job) => job.lastStatus === 'running')) return;
    const timer = setInterval(async () => {
      const data = await youtubeApi.getAutomations(user?.id);
      setAutomations(data);
    }, 4000);
    return () => clearInterval(timer);
  }, [automations, user?.id]);

  const handleCopyLink = (url: string, jobId: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedJobId(jobId);
    toast.success('Video link copied to clipboard');
    setTimeout(() => setCopiedJobId(null), 2500);
  };

  const handleToggle = async (id: string) => {
    setTogglingJobId(id);
    try {
      const updated = await youtubeApi.toggleAutomation(id, user?.id);
      setAutomations(updated);
      const target = updated.find((a) => a.id === id);
      if (target?.active) {
        toast.success(`Automation resumed: "${target.theme}"`);
      } else {
        toast.info(`Automation paused: "${target?.theme || 'Rule'}"`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not toggle automation');
    } finally {
      setTogglingJobId(null);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await youtubeApi.deleteAutomation(id, user?.id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteJobId(null);
      toast.success('Automation rule and history deleted');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete automation');
    }
  };

  const getJobStageIndex = (job: AutomationJob): number => {
    if (!job.lastRunMessage) return 0;
    const m = job.lastRunMessage.match(/Stage (\d)\/6/i);
    return m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
  };

  const handleStopPipeline = async (id: string) => {
    setRunningJobId(null);
    try {
      await youtubeApi.stopAutomation(id);
      toast.info('Pipeline execution stopped');
    } catch {
      toast.error('Failed to stop pipeline');
    }
    await loadAutomations();
  };

  const handleRunNow = async (id: string, jobTheme: string) => {
    setRunningJobId(id);

    try {
      toast.info(`Executing autonomous 6-stage pipeline for "${jobTheme}"...`);
      const payload = (activeTimeline?.videoClips?.length || activeTimeline?.imageClips?.length)
        ? activeTimeline
        : undefined;
      const res = await youtubeApi.runAutomationNow(id, payload);
      toast.info(
        res.accepted
          ? `Pipeline started for "${jobTheme}". Progress will update as each stage completes.`
          : `Pipeline is already running for "${jobTheme}".`,
      );
      await loadAutomations();
    } catch (err: any) {
      toast.error(err.message || 'Pipeline execution failed');
      await loadAutomations();
    } finally {
      setRunningJobId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authStatusLoading || !authStatus?.connected) {
      toast.error('Connect a YouTube channel before creating a publishing schedule.');
      setActiveSubTab('channel');
      return;
    }
    setCreating(true);

    let finalSchedule = `Daily at ${publishTime} UTC`;
    let finalPublishTime = publishTime;

    if (frequencyType === 'interval') {
      if (intervalSelection === 'custom') {
        const unitLabel = customUnit === 'hours' ? (customValue === 1 ? 'Hour' : 'Hours') : (customValue === 1 ? 'Minute' : 'Minutes');
        finalSchedule = `Every ${customValue} ${unitLabel}`;
        finalPublishTime = `every_${customValue}${customUnit === 'hours' ? 'h' : 'm'}`;
      } else {
        const opt = INTERVAL_OPTIONS.find((o) => o.value === intervalSelection);
        finalSchedule = opt ? opt.schedule : 'Every 3 Hours';
        finalPublishTime = intervalSelection;
      }
    }

    try {
      await youtubeApi.createAutomation({
        theme,
        publishTime: finalPublishTime,
        schedule: finalSchedule,
        voice,
        aiModel,
        aspectRatio,
        length,
        musicTrack,
        privacyStatus,
        active: true,
        channelId: activeChannel.id || undefined,
        userId: user?.id,
      });
      toast.success(`New automation rule scheduled: ${finalSchedule}!`);
      setActiveSubTab('pipelines');
      loadAutomations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create automation');
    } finally {
      setCreating(false);
    }
  };

  const formatScheduleLabel = (val?: string): string => {
    if (!val) return 'Active Schedule';
    const clean = val.trim();
    if (clean === 'every_30m') return 'Every 30 Minutes';
    if (clean === 'every_1h') return 'Every 1 Hour';
    if (clean === 'every_2h') return 'Every 2 Hours';
    if (clean === 'every_3h') return 'Every 3 Hours';
    if (clean === 'every_4h') return 'Every 4 Hours';
    if (clean === 'every_6h') return 'Every 6 Hours';
    if (clean === 'every_8h') return 'Every 8 Hours';
    if (clean === 'every_12h') return 'Every 12 Hours';
    if (clean.startsWith('every_')) {
      const match = clean.match(/every_(\d+)([hm])/);
      if (match) {
        const num = match[1];
        const unit = match[2] === 'h' ? (num === '1' ? 'Hour' : 'Hours') : (num === '1' ? 'Minute' : 'Minutes');
        return `Every ${num} ${unit}`;
      }
    }
    if (clean.match(/^\d{1,2}:\d{2}$/)) {
      return `Daily at ${clean} UTC`;
    }
    return clean.replace(/UTC/gi, '').trim();
  };

  const formatNextRunInfo = (isoString?: string): { display: string; relative: string; isPast: boolean } => {
    if (!isoString) return { display: 'Pending schedule', relative: 'Queued', isPast: false };
    try {
      const target = new Date(isoString);
      const diffMs = target.getTime() - currentTime;
      const timeFormatted = target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dayFormatted = target.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

      if (diffMs > 0) {
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        let relative = '';
        if (hours > 0) {
          relative = `in ${hours}h ${mins}m ${secs}s`;
        } else if (mins > 0) {
          relative = `in ${mins}m ${secs}s`;
        } else {
          relative = `in ${secs}s`;
        }
        return { display: `${dayFormatted}, ${timeFormatted}`, relative, isPast: false };
      } else {
        return { display: `${dayFormatted}, ${timeFormatted}`, relative: 'Triggering now...', isPast: true };
      }
    } catch {
      return { display: isoString, relative: '', isPast: false };
    }
  };

  const getThemeMeta = (themeName: string) => {
    const lower = themeName.toLowerCase();
    if (lower.includes('stoic')) {
      return { icon: '🗿', gradient: 'bg-amber-500/15 border-amber-500/30 text-amber-300', dot: 'bg-amber-400', badgeText: 'Stoic Philosophy' };
    }
    if (lower.includes('fitness') || lower.includes('iron')) {
      return { icon: '🔥', gradient: 'bg-orange-500/15 border-orange-500/30 text-orange-300', dot: 'bg-orange-400', badgeText: 'Fitness & Will' };
    }
    if (lower.includes('calm') || lower.includes('resilience')) {
      return { icon: '🌊', gradient: 'bg-teal-500/15 border-teal-500/30 text-teal-300', dot: 'bg-teal-400', badgeText: 'Inner Calm' };
    }
    if (lower.includes('focus') || lower.includes('flow')) {
      return { icon: '🧠', gradient: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300', dot: 'bg-indigo-400', badgeText: 'Deep Focus' };
    }
    return { icon: '⚡', gradient: 'bg-[#181818] border-[#242424] text-zinc-300', dot: 'bg-white', badgeText: 'Motivation' };
  };

  return (
    <div className={`flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0 ${className}`}>
      {/* ── Top Header Bar ── */}
      <div className="relative h-11 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#181818] border border-[#242424] flex items-center justify-center shrink-0 text-white">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-white truncate">Daily Automations</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`h-7 px-2.5 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
              activeSubTab === 'create' ? 'bg-[#2563EB] text-white border border-[#60A5FA]/40 shadow-xs' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#60A5FA]/40 shadow-xs'
            }`}
            title="Configure New Automation Schedule"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={() => void loadAutomations()}
            disabled={loading}
            className="w-7 h-7 rounded-md bg-white/[0.06] hover:bg-[#222222] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#2E2E2E]"
            title="Refresh Schedules"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href="/youtube/schedules"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              window.open('/youtube/schedules', '_blank');
            }}
            className="h-7 px-2 rounded-md bg-white/[0.06] hover:bg-[#222222] text-[11px] font-medium text-white transition-colors cursor-pointer border border-[#2E2E2E] flex items-center gap-1 shrink-0"
            title="Open Automations Hub in a new tab"
          >
            <ExternalLink className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Hub</span>
          </a>
        </div>
      </div>

      {/* ── Subtabs Segmented Control (Standardized ScrollableTabs) ── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <ScrollableTabs
          tabs={[
            { id: 'pipelines', label: 'Pipelines', icon: Zap, badge: automations.length },
            { id: 'create', label: 'Schedule', icon: Sparkles },
            {
              id: 'channel',
              label: 'Channel',
              icon: Youtube,
              badge: authStatus?.connected ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.8)]" title="Connected to YouTube" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block" title="Studio Local Mode" />
              ),
            },
          ]}
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab)}
          containerBgClassName="bg-[#181818]"
        />
      </div>

      {/* ── Subtab 1: Pipelines ── */}
      {activeSubTab === 'pipelines' && (
        <div className="flex-1 flex flex-col min-h-0">


          {/* Main Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-3.5">
            {/* Section Heading */}
            <div className="text-[10px] uppercase font-mono-studio text-slate-400 font-bold tracking-wider">
              Configured Pipelines ({automations.length})
            </div>

            {/* Automation Rules List */}
            {loading ? (
              <div className="space-y-2.5 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#17171C] border border-[#242424] space-y-2">
                    <div className="h-3.5 bg-zinc-800 rounded w-2/3" />
                    <div className="h-2.5 bg-zinc-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : automations.length === 0 ? (
              <div className="p-5 rounded-xl bg-[#17171C] border border-[#242424] text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#181818] text-zinc-300 border border-[#242424] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">No Active Automation Schedules</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Set up an autonomous schedule to generate scripts with {DEFAULT_SCRIPT_MODEL_LABEL}, synthesize voice, render 9:16 vertical MP4, and upload to YouTube.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('create')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer border border-[#60A5FA]/40 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Schedule</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map((job) => {
                  const isRunning = runningJobId === job.id || job.lastStatus === 'running';
                  const isPaused = !job.active && !isRunning;
                  const isActive = job.active && !isRunning;
                  const themeMeta = getThemeMeta(job.theme);
                  const scheduleLabel = formatScheduleLabel(job.publishTime || job.schedule);
                  const nextRunInfo = formatNextRunInfo(job.nextRun);
                  const rawHistory = historyByJob[job.id] || [];
                  const fallbackHistory: AutomationHistoryEntry[] = job.lastRun ? [{
                    id: `fallback-${job.id}`,
                    jobId: job.id,
                    status: (job.lastStatus === 'failed' ? 'failed' : 'success') as 'success' | 'failed',
                    videoTitle: job.lastVideoTitle || job.theme,
                    videoUrl: job.lastVideoUrl,
                    youtubeUrl: job.lastIsLive ? job.lastVideoUrl : undefined,
                    isLive: Boolean(job.lastIsLive),
                    durationSeconds: 15,
                    message: job.lastRunMessage || (job.lastIsLive ? 'Published live to YouTube Shorts' : 'Saved to Studio Library (Connect YouTube channel to publish live)'),
                    executedAt: job.lastRun,
                  }] : [];
                  const historyList = rawHistory.length > 0 ? rawHistory : fallbackHistory;
                  const isHistoryLoading = loadingHistoryByJob[job.id] && rawHistory.length === 0 && !job.lastRun;
                  const totalRunsCount = historyList.length;
                  const isConfirmingDelete = confirmDeleteJobId === job.id;
                  const isToggling = togglingJobId === job.id;

                  return (
                    <div
                      key={job.id}
                      className={`p-3.5 sm:p-4 rounded-2xl transition-all flex flex-col gap-3.5 shadow-lg border ${
                        isRunning
                          ? 'bg-gradient-to-b from-[#181820] via-[#141419] to-[#121216] border-blue-500/35 shadow-lg shadow-blue-950/20'
                          : isPaused
                          ? 'bg-gradient-to-b from-[#16161B] via-[#131317] to-[#111114] border-zinc-800/80 opacity-95'
                          : 'bg-[#161616] border border-[#242424] hover:border-[#383838]'
                      }`}
                    >
                      {/* ── 1. UNIFIED PIPELINE CONTROL & STATUS CARD ── */}
                      <div className="flex flex-col gap-3">
                        {/* Header: Icon + Title + Status Badge */}
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 border border-blue-500/25 text-base shadow-sm">
                              <span>{themeMeta.icon}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white tracking-tight leading-tight truncate" title={job.theme}>
                              {job.theme}
                            </h4>
                          </div>

                          <div className="shrink-0">
                            {isRunning ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2563EB] border border-[#60A5FA]/40 text-white text-[10px] font-bold shadow-xs">
                                <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
                                <span>Running</span>
                              </span>
                            ) : isActive ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2563EB] border border-[#60A5FA]/40 text-white text-[10px] font-bold shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                                <Pause className="w-2.5 h-2.5 fill-current text-[#60A5FA]" />
                                <span>Paused</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Unified Information Deck */}
                        <div className="p-3.5 rounded-xl bg-[#141416] border border-[#24242A] text-xs flex flex-col gap-3">
                          {/* Schedule / Next Run Row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Clock className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                              <span className="text-zinc-400 text-xs font-medium">Schedule:</span>
                              <span className="text-white text-xs font-semibold font-mono truncate">{scheduleLabel}</span>
                            </div>
                            {isActive && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                nextRunInfo.isPast
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                                  : 'bg-[#2563EB] text-white border border-[#60A5FA]/40 font-mono shadow-xs'
                              }`}>
                                {nextRunInfo.relative}
                              </span>
                            )}
                            {isPaused && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                                Suspended
                              </span>
                            )}
                          </div>

                          {/* Target Channel Destination */}
                          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#202026] text-xs">
                            <span className="flex items-center gap-1.5 text-zinc-400 shrink-0">
                              <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span>Target Channel:</span>
                            </span>
                            <a
                              href={activeChannel.channelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-1.5 min-w-0 max-w-[70%] justify-end hover:opacity-95 transition-opacity"
                              title={`Target Channel: ${activeChannel.name} (${activeChannel.handle}) on YouTube`}
                            >
                              <div className="relative shrink-0 flex items-center">
                                <img
                                  src={activeChannel.avatarUrl}
                                  alt={activeChannel.name}
                                  className="w-4 h-4 rounded-full object-cover ring-1 ring-red-500/50 shadow-xs"
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-[#141416]" />
                              </div>
                              <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                                {activeChannel.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono truncate">
                                {activeChannel.handle}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 shrink-0 flex items-center gap-0.5">
                                <span>Shorts</span>
                              </span>
                            </a>
                          </div>

                          {/* 4 Clean Attribute Tags in a 2x2 Grid (No overflowing or truncated pills) */}
                          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#202026]">
                            <div className="p-2 rounded-lg bg-[#101014] border border-[#22222A] flex flex-col justify-center">
                              <span className="text-[9.5px] text-zinc-500 font-mono uppercase tracking-wider">Niche / Category</span>
                              <span className="text-xs font-bold text-[#93C5FD] truncate mt-0.5">{themeMeta.badgeText}</span>
                            </div>

                            <div className="p-2 rounded-lg bg-[#101014] border border-[#22222A] flex flex-col justify-center">
                              <span className="text-[9.5px] text-zinc-500 font-mono uppercase tracking-wider">Voice & Audio</span>
                              <span className="text-xs font-bold text-white truncate mt-0.5 flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-blue-400 shrink-0" />
                                <span>{job.voice || 'Fenrir'}</span>
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-[#101014] border border-[#22222A] flex flex-col justify-center">
                              <span className="text-[9.5px] text-zinc-500 font-mono uppercase tracking-wider">Completed Runs</span>
                              <span className="text-xs font-bold text-white font-mono mt-0.5">{totalRunsCount} {totalRunsCount === 1 ? 'Video' : 'Videos'}</span>
                            </div>

                            <div className="p-2 rounded-lg bg-[#101014] border border-[#22222A] flex flex-col justify-center">
                              <span className="text-[9.5px] text-zinc-500 font-mono uppercase tracking-wider">Resolution & Engine</span>
                              <span className="text-xs font-bold text-white font-mono mt-0.5 truncate">
                                1080p • <span className="text-[#60A5FA]">{job.aiModel?.includes('flash') ? 'Flash' : 'Gemini'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── 3B. RECENT ERROR BANNER (When last execution failed) ── */}
                      {job.lastStatus === 'failed' && !isRunning && (
                        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs flex flex-col gap-1 shadow-sm animate-fade-in">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                              <span>Pipeline Execution Failed</span>
                            </span>
                            {job.lastRun && (
                              <span className="text-[9px] font-mono text-rose-300/70">
                                {new Date(job.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-rose-200/90 leading-snug font-mono break-words">
                            {job.lastRunMessage || 'Pipeline execution failed. Please verify API credentials and retry.'}
                          </p>
                        </div>
                      )}

                      {/* ── 4. DYNAMIC LIVE 6-STAGE PIPELINE STEPPER (when executing) ── */}
                      {isRunning && (
                        <div className="p-3 rounded-xl bg-[#111116] border border-[#252532] flex flex-col gap-2.5 animate-fade-in shadow-inner">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#60A5FA]" />
                              <span>Autonomous Pipeline</span>
                            </span>
                            <span className="font-mono text-[10px] text-white font-bold bg-[#2563EB] px-2.5 py-0.5 rounded-full border border-[#60A5FA]/40 shadow-xs">
                              Stage {Math.min(6, getJobStageIndex(job) + 1)} of 6
                            </span>
                          </div>

                          {/* 2-column layout to allow labels and status pills to breathe without clipping */}
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            {[
                              { num: '1', name: 'Script', desc: job.aiModel?.includes('flash') ? 'Gemini Flash' : 'Gemini AI' },
                              { num: '2', name: 'Voice', desc: job.voice || 'Fenrir' },
                              { num: '3', name: 'B-Roll', desc: '4K B-Roll' },
                              { num: '4', name: 'Captions', desc: 'Sync Subtitles' },
                              { num: '5', name: 'Render', desc: '1080p MP4' },
                              { num: '6', name: 'Publish', desc: job.privacyStatus === 'scheduled' ? 'Scheduled' : 'YouTube Shorts' },
                            ].map((step, idx) => {
                              const curStage = getJobStageIndex(job);
                              const isDone = curStage > idx;
                              const isCurrent = curStage === idx;

                              return (
                                <div
                                  key={step.num}
                                  className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                                    isDone
                                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                                      : isCurrent
                                      ? 'bg-blue-500/20 border-[#3B82F6] text-white ring-1 ring-blue-500/40 shadow-sm'
                                      : 'bg-[#141418] border-[#22222A] text-zinc-500'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                        isDone || isCurrent ? 'bg-[#3B82F6] text-white' : 'bg-[#22222A] text-zinc-400'
                                      }`}>
                                        {step.num}
                                      </span>
                                      <span className="text-xs font-bold text-white truncate">{step.name}</span>
                                    </div>
                                    {isDone ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-[#2563EB] px-2 py-0.5 rounded-md shrink-0 border border-[#60A5FA]/40">
                                        <Check className="w-2.5 h-2.5 stroke-[3] text-[#60A5FA]" /> Done
                                      </span>
                                    ) : isCurrent ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#93C5FD] bg-blue-500/25 px-1.5 py-0.5 rounded-md shrink-0 animate-pulse">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin text-[#60A5FA]" /> Active
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-zinc-500 font-mono shrink-0">Pending</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 truncate pl-5">{step.desc}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── 5. EXECUTION & VIDEO HISTORY SECTION (DROPDOWN / COLLAPSIBLE ACCORDION) ── */}
                      <div className="rounded-xl bg-[#141414] border border-[#242424] overflow-hidden">
                        {/* History Header Bar (Accordion Trigger) */}
                        <div
                          onClick={() => setExpandedHistoryJobs((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
                          className="px-3 py-2 bg-[#181818] hover:bg-[#1E1E22] transition-colors cursor-pointer flex items-center justify-between gap-2 select-none"
                        >
                          <div className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-[#60A5FA]" />
                            <span className="text-xs font-bold text-white">Execution History</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#1A1A1A] text-[#9CA3AF] font-mono font-semibold border border-[#2A2A2A]">
                              {historyList.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadHistory(job.id, true);
                              }}
                              disabled={isHistoryLoading}
                              className="p-1 rounded-md bg-[#1F1F28] hover:bg-[#282834] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#2A2A38]"
                              title="Refresh History"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isHistoryLoading ? 'animate-spin text-blue-400' : ''}`} />
                            </button>

                            {historyList.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearHistory(job.id);
                                }}
                                className="text-[9px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer font-medium px-1"
                              >
                                Clear
                              </button>
                            )}

                            {/* Chevron Toggle Icon */}
                            <span className="text-zinc-400 transition-transform duration-200">
                              {expandedHistoryJobs[job.id] ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[#60A5FA]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible History Content Body */}
                        {expandedHistoryJobs[job.id] && (
                        <div className="p-2.5 border-t border-[#242424] animate-fade-in">
                          {isHistoryLoading && historyList.length === 0 ? (
                            <div className="py-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                              <span>Loading records...</span>
                            </div>
                          ) : historyList.length === 0 ? (
                            <div className="py-3 text-center flex flex-col items-center gap-1 text-xs text-zinc-400">
                              <Clock className="w-4 h-4 text-zinc-600 mb-0.5" />
                              <p className="font-semibold text-zinc-300 text-[11px]">No executions recorded yet</p>
                              <p className="text-[10px] text-zinc-500 max-w-xs">
                                Will generate automatically at <strong className="text-zinc-400">{nextRunInfo.display}</strong>, or trigger manually below.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
                              {historyList.map((entry) => {
                                const isLiveShort = entry.isLive || Boolean(entry.youtubeUrl);
                                const isSuccess = entry.status === 'success';

                                return (
                                  <div
                                    key={entry.id}
                                    className={`p-3 rounded-xl border flex flex-col gap-2 transition-all shadow-xs ${
                                      isSuccess
                                        ? 'bg-[#141414] border-[#242424] hover:border-[#303030]'
                                        : 'bg-[#181113] border-rose-500/30 hover:border-rose-500/50'
                                    }`}
                                  >
                                    {/* Top Status & Timestamp */}
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        {isSuccess ? (
                                          isLiveShort ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 text-[9.5px] font-semibold">
                                              <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                                              <span>YouTube Short</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181818] text-zinc-300 border border-[#282828] text-[9.5px] font-semibold">
                                              <Video className="w-3 h-3 text-zinc-400 shrink-0" />
                                              <span>Studio Video</span>
                                            </span>
                                          )
                                        ) : entry.status === 'stopped' ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[9.5px] font-semibold">
                                            <Square className="w-2.5 h-2.5 shrink-0" />
                                            <span>Stopped</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[9.5px] font-semibold">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            <span>Failed</span>
                                          </span>
                                        )}
                                      </div>

                                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                        {new Date(entry.executedAt).toLocaleString([], {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                        {entry.durationSeconds > 0 && ` • ${Math.round(entry.durationSeconds)}s`}
                                      </span>
                                    </div>

                                    {/* Video Title + Message */}
                                    {(entry.videoTitle || entry.message) && (
                                      <div className="flex flex-col gap-0.5 min-w-0">
                                        {entry.videoTitle && (
                                          <p className="text-xs font-semibold text-zinc-100 italic line-clamp-1">
                                            "{entry.videoTitle}"
                                          </p>
                                        )}
                                        {entry.message && (
                                          <p className="text-[10.5px] text-zinc-400 leading-snug line-clamp-1">
                                            {entry.message}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* Action Buttons Grid */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#242424]">
                                      {entry.youtubeUrl && (
                                        <a
                                          href={entry.youtubeUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="h-8 px-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10.5px] font-semibold flex items-center justify-center gap-1.5 border border-[#60A5FA]/40 shadow-xs truncate transition-colors"
                                        >
                                          <Youtube className="w-3 h-3 text-white shrink-0" />
                                          <span>Watch Short</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-blue-200 shrink-0" />
                                        </a>
                                      )}

                                      {entry.videoUrl && (
                                        <a
                                          href={entry.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="h-8 px-2.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white text-[10.5px] font-medium flex items-center justify-center gap-1.5 border border-[#242424] hover:border-white/10 truncate transition-colors"
                                        >
                                          <Video className="w-3 h-3 text-zinc-400 shrink-0" />
                                          <span>Open MP4</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                                        </a>
                                      )}

                                      {(entry.youtubeUrl || entry.videoUrl) && (
                                        <button
                                          type="button"
                                          aria-pressed={frequencyType === 'interval'}
                                          onClick={() => {
                                            const pData = entry.projectData || {};
                                            const vUrl = entry.videoUrl || pData.videoUrl;
                                            const vTitle = entry.videoTitle || pData.title || 'Studio Video';
                                            const dur = entry.durationSeconds || pData.duration || 15.0;
                                            window.dispatchEvent(new CustomEvent('workspace:load-timeline', {
                                              detail: {
                                                title: vTitle,
                                                videoUrl: vUrl,
                                                audioUrl: pData.audioUrl,
                                                duration: dur,
                                                voice: pData.voice,
                                                storyboard: pData.storyboard,
                                                subtitles: pData.subtitles,
                                                projectData: pData,
                                              }
                                            }));
                                            toast.success(`Loaded "${vTitle}" into Studio Timeline`);
                                            if (onPaneChange) onPaneChange('editor');
                                            if (onNavigate) onNavigate('workspace-editor');
                                          }}
                                          className="h-8 px-2.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white text-[10.5px] font-medium flex items-center justify-center gap-1.5 border border-[#242424] hover:border-white/10 truncate transition-colors cursor-pointer"
                                          title="Load this video project into Studio Timeline for manual edits"
                                        >
                                          <Sparkles className="w-3 h-3 text-[#60A5FA] shrink-0" />
                                          <span>Edit in Timeline</span>
                                        </button>
                                      )}

                                      {(entry.youtubeUrl || entry.videoUrl) && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopyLink(entry.youtubeUrl || entry.videoUrl!, entry.id)}
                                          className="h-8 px-2.5 rounded-lg bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white text-[10.5px] font-medium flex items-center justify-center gap-1.5 transition-all border border-[#242424] hover:border-white/10 cursor-pointer truncate"
                                        >
                                          {copiedJobId === entry.id ? (
                                            <>
                                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                              <span className="text-emerald-400 font-bold">Copied</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3 shrink-0" />
                                              <span>Copy Link</span>
                                            </>
                                          )}
                                        </button>
                                      )}

                                      {entry.status === 'failed' && (
                                        <button
                                          type="button"
                                          onClick={() => handleRunNow(job.id, job.theme)}
                                          className="h-8 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-white text-[10.5px] font-medium flex items-center justify-center gap-1.5 truncate transition-colors cursor-pointer col-span-2"
                                        >
                                          <RefreshCw className="w-2.5 h-2.5" />
                                          <span>Retry</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        )}
                      </div>

                      {/* ── 6. SAFE DELETE CONFIRMATION ALERT (when delete clicked) ── */}
                      {isConfirmingDelete && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs flex flex-col gap-2 animate-fade-in shadow-xl ring-1 ring-rose-500/40">
                          <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete this schedule?</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            Permanently stop recurring publishing for <strong className="text-white">"{job.theme}"</strong> and clear history.
                          </p>
                          <div className="flex items-center justify-end gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteJobId(null)}
                              className="px-3 py-1 rounded-lg bg-[#202028] hover:bg-[#2A2A34] text-zinc-300 text-[11px] font-semibold border border-[#2E2E3C] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => executeDelete(job.id)}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Confirm</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── 7. BOTTOM ACTION TOOLBAR ── */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {isRunning ? (
                          <>
                            {/* Running Progress Indicator */}
                            <div
                              className="flex-1 h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-[#181818] text-white border border-[#242424] shadow-xs overflow-hidden select-none"
                              title="Autonomous pipeline currently executing"
                            >
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#60A5FA] shrink-0" />
                              <span className="truncate">
                                {job.lastRunMessage || 'Stage 1/6: Writing Script with Gemini...'}
                              </span>
                            </div>

                            {/* Stop Active Pipeline Execution */}
                            <button
                              type="button"
                              onClick={() => handleStopPipeline(job.id)}
                              className="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm shrink-0 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border-rose-500/50 hover:border-rose-400 active:scale-95"
                              title="Stop autonomous pipeline execution"
                            >
                              <Square className="w-3 h-3 fill-current text-rose-400 shrink-0" />
                              <span>Stop</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Run Now Primary Button */}
                            <button
                              type="button"
                              onClick={() => handleRunNow(job.id, job.theme)}
                              className={`flex-1 h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-[0.99] ${
                                isPaused
                                  ? 'bg-[#1C1C24] hover:bg-[#252530] text-zinc-200 hover:text-white border border-[#2A2A38] hover:border-zinc-500'
                                  : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white border border-[#60A5FA]/30 shadow-md font-semibold'
                              }`}
                              title={
                                isPaused
                                  ? 'Trigger manual pipeline execution for paused schedule'
                                  : 'Trigger full generation and publish now'
                              }
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                              <span>{isPaused ? 'Run Pipeline (Manual)' : 'Run Pipeline Now'}</span>
                            </button>

                            {/* Pause / Resume Schedule Secondary Button */}
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggle(job.id)}
                              className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm shrink-0 ${
                                isActive
                                  ? 'bg-[#181818] hover:bg-[#222222] text-[#D4D4D8] hover:text-white border border-[#2A2A2A] hover:border-[#383838]'
                                  : 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border-emerald-500/40'
                              }`}
                              title={isActive ? "Pause automated recurring generation" : "Resume automated recurring generation"}
                            >
                              {isToggling ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isActive ? (
                                <>
                                  <Pause className="w-3 h-3 fill-current text-[#60A5FA]" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 fill-current text-emerald-400" />
                                  <span>Resume</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {/* Delete Schedule Button */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteJobId(isConfirmingDelete ? null : job.id)}
                          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
                            isConfirmingDelete
                              ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                              : 'bg-[#181818] hover:bg-rose-950/40 text-[#9CA3AF] hover:text-rose-400 border border-[#2A2A2A] hover:border-rose-800/40'
                          }`}
                          title="Delete automation schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Autonomous Daily Architecture Engine Preview */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#16161B] to-[#121215] border border-[#24242C] text-xs text-zinc-400 flex flex-col gap-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-white font-bold text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Autonomous 4-Stage Production Engine</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                  Fully Autonomous
                </span>
              </div>

              {/* 4 Steps Visual Flow */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { step: '01', title: DEFAULT_SCRIPT_MODEL_LABEL, sub: 'Script & Hook' },
                  { step: '02', title: 'Neural TTS', sub: 'Pro Voiceover' },
                  { step: '03', title: 'GPU Render', sub: '1080x1920 MP4' },
                  { step: '04', title: 'Live Shorts', sub: 'Auto Publish' },
                ].map((s) => (
                  <div key={s.step} className="p-2 rounded-lg bg-[#18181E] border border-[#262630] text-center">
                    <div className="text-[9px] font-mono text-blue-400 font-bold">{s.step}</div>
                    <div className="text-[10px] font-bold text-zinc-200 truncate mt-0.5">{s.title}</div>
                    <div className="text-[8px] text-zinc-500 truncate mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-zinc-400 leading-relaxed border-t border-[#222228] pt-2">
                Server cron triggers on your schedule, queries SQLite memory to deduplicate topics, synthesizes natural audio, and renders high-definition Shorts hands-free.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Subtab 2: New Schedule Form ── */}
      {activeSubTab === 'create' && (
        <form
          onSubmit={handleCreate}
          className="flex-1 min-w-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-3.5 animate-fade-in w-full max-w-5xl mx-auto"
        >
          {/* Header intro card */}
          <div className="p-3 rounded-xl bg-[#161616] border border-[#242424] flex flex-col gap-1.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Create a publishing schedule</span>
            </span>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Choose a video theme and production settings, then set when the automation runs on your connected YouTube channel.
            </p>
          </div>

          {/* Theme */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Video theme
            </label>
            <CustomSelect
              options={THEME_OPTIONS}
              value={theme}
              onChange={(val) => setTheme(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
              menuClassName="!bg-[#181818] !border-[#242424]"
            />
          </div>

          {/* Script model */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Script model
            </label>
            <CustomSelect
              options={scriptModels}
              value={aiModel}
              onChange={(val) => setAiModel(val)}
              disabled={modelsLoading || scriptModels.length === 0}
              className="w-full text-xs"
              buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
              menuClassName="!bg-[#181818] !border-[#242424]"
            />
            {modelsLoading && <p className="mt-1 text-[10px] text-zinc-500">Loading models from Google…</p>}
            {modelsError && <p role="alert" className="mt-1 text-[10px] text-red-400">{modelsError}</p>}
          </div>

          {/* Aspect Ratio & Video Length */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                Aspect Ratio
              </label>
              <CustomSelect
                options={ASPECT_RATIO_OPTIONS}
                value={aspectRatio}
                onChange={(val) => setAspectRatio(val as any)}
                className="w-full text-xs"
                buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
                menuClassName="!bg-[#181818] !border-[#242424]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                Video duration
              </label>
              <CustomSelect
                options={LENGTH_OPTIONS}
                value={length}
                onChange={(val) => setLength(val)}
                className="w-full text-xs"
                buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
                menuClassName="!bg-[#181818] !border-[#242424]"
              />
            </div>
          </div>

          {/* Schedule Frequency (Segmented Pill Toggle) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Schedule Frequency
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#101013] rounded-xl border border-[#242428] gap-1">
              <button
                type="button"
                aria-pressed={frequencyType === 'interval'}
                onClick={() => {
                  setFrequencyType('interval');
                  setPrivacyStatus('public');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  frequencyType === 'interval'
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#18181C]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${frequencyType === 'interval' ? 'text-white' : 'text-slate-400'}`} />
                <span>At an interval</span>
              </button>
              <button
                type="button"
                aria-pressed={frequencyType === 'daily'}
                onClick={() => setFrequencyType('daily')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  frequencyType === 'daily'
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#18181C]'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${frequencyType === 'daily' ? 'text-white' : 'text-slate-400'}`} />
                <span>Daily at Time</span>
              </button>
            </div>
          </div>

          {/* Interval Selection OR Daily Time & Privacy Status */}
          {frequencyType === 'interval' ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                    Run interval
                  </label>
                  <CustomSelect
                    options={INTERVAL_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                    value={intervalSelection}
                    onChange={(val) => setIntervalSelection(val)}
                    className="w-full text-xs"
                    buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
                    menuClassName="!bg-[#181818] !border-[#242424]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                    Release
                  </span>
                  <div className="min-h-10 flex items-center gap-2 rounded-xl bg-[#141416] border border-[#26262E] px-3 text-[11px] text-[#9CA3AF]">
                    <Globe className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                    <span>Publish immediately after each run</span>
                  </div>
                </div>
              </div>

              {/* Custom interval builder when 'custom' is selected */}
              {intervalSelection === 'custom' && (
                <div className="p-2.5 rounded-lg bg-[#111111] border border-blue-500/25 flex items-center gap-2">
                  <span className="text-xs text-zinc-300 font-medium shrink-0">Run every:</span>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={customValue}
                    onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 bg-[#101013] border border-[#242424] rounded-md px-2 py-1 text-xs text-white text-center font-bold"
                  />
                  <CustomSelect
                    options={[
                      { value: 'hours', label: 'Hours (e.g. 3 hr, 8 hr)' },
                      { value: 'minutes', label: 'Minutes (e.g. 30 min)' },
                    ]}
                    value={customUnit}
                    onChange={(val) => setCustomUnit(val as any)}
                    className="flex-1 text-xs"
                    buttonClassName="!bg-[#101013] !border-[#242424] !py-1 !rounded-md text-xs"
                    menuClassName="!bg-[#181818] !border-[#242424]"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="automation-daily-run-time" className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                  Daily run time (UTC)
                </label>
                <input
                  id="automation-daily-run-time"
                  type="time"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                  required
                  className="w-full bg-[#151518] border border-[#242424] focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                  Release
                </label>
                <CustomSelect
                  options={[
                    { value: 'public', label: 'Publish immediately' },
                    { value: 'scheduled', label: 'Schedule for next occurrence' },
                  ]}
                  value={privacyStatus}
                  onChange={(val) => setPrivacyStatus(val as 'public' | 'scheduled')}
                  className="w-full text-xs"
                  buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
                  menuClassName="!bg-[#181818] !border-[#242424]"
                />
              </div>
            </div>
          )}

          {/* AI Voice Persona */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Voice
            </label>
            <CustomSelect
              options={VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.name }))}
              value={voice}
              onChange={(val) => setVoice(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
              menuClassName="!bg-[#181818] !border-[#242424]"
            />
          </div>

          {/* Soundtrack */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Soundtrack
            </label>
            <CustomSelect
              options={MUSIC_OPTIONS}
              value={musicTrack}
              onChange={(val) => setMusicTrack(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#141416] !border-[#26262E] hover:!border-[#3B82F6]/50 !py-2.5 !rounded-xl text-xs"
              menuClassName="!bg-[#181818] !border-[#242424]"
            />
          </div>

          {/* YouTube publishing destination */}
          <div className="p-3 rounded-xl bg-[#141416] border border-[#26262E] flex items-center justify-between gap-2.5 text-[11px]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                {authStatusLoading ? (
                  <div className="w-7 h-7 rounded-lg bg-[#1E1E1E] border border-[#333333] flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-[#9CA3AF] animate-spin" />
                  </div>
                ) : authStatus?.connected ? (
                  <img
                    src={activeChannel.avatarUrl}
                    alt={activeChannel.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#3B82F6]/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#1E1E1E] border border-[#333333] flex items-center justify-center">
                    <Youtube className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                )}
                {authStatus?.connected && !authStatusLoading && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-[#141416]" />
                )}
              </div>
              <div className="text-zinc-300 min-w-0">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">
                    {authStatusLoading
                      ? 'Checking channel'
                      : authStatus?.connected
                        ? 'Connected channel'
                        : activeChannel.id
                          ? 'Saved channel'
                          : 'Publishing destination'}
                  </div>
                  <div className="font-semibold text-white truncate">
                    {authStatusLoading
                      ? 'Checking YouTube connection…'
                      : activeChannel.id
                      ? `${activeChannel.name} ${activeChannel.handle}`
                      : 'No YouTube channel connected'}
                </div>
              </div>
            </div>
            {authStatus?.connected ? (
              <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                Connected
              </span>
            ) : !authStatusLoading ? (
              <button
                type="button"
                onClick={() => onNavigate?.('channels')}
                className="text-[10px] text-[#60A5FA] hover:text-white font-semibold shrink-0"
              >
                Manage in Social Accounts
              </button>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242428] mt-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('pipelines')}
              className="px-3.5 py-2 rounded-lg bg-white/[0.06] text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || authStatusLoading || !authStatus?.connected}
              title={!authStatus?.connected ? 'Connect a YouTube channel before creating a publishing schedule' : undefined}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md transition-all"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>
                {creating ? 'Creating schedule…' : authStatusLoading ? 'Checking channel…' : 'Create schedule'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* ── Subtab 3: Channel & Target ── */}
      {activeSubTab === 'channel' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-3.5 animate-fade-in">
          {/* ── YouTube Channel Banner Card ── */}
          {hasSelectedYouTubeChannel ? (
          <div className="rounded-2xl bg-[#141414] border border-[#242424] overflow-hidden shadow-xl">
            {liveChannelBanner && (
              <div className="relative w-full h-24 bg-[#101014] overflow-hidden shrink-0">
                <img
                  src={liveChannelBanner}
                  alt={`${activeChannel.name} YouTube channel banner`}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
              </div>
            )}

            {/* Avatar + Info row */}
            <div className="bg-[#111111] border-t border-[#1E1E1E] px-3 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="relative shrink-0 -mt-6">
                <img
                  src={activeChannel.avatarUrl}
                  alt={activeChannel.name}
                  className="w-10 h-10 rounded-full border-2 border-[#111111] object-cover shadow-lg"
                />
              </div>

              {/* Name + Handle + Stats */}
              <div className="flex-[1_1_120px] min-w-0 pt-1">
                <p className="text-xs font-bold text-white truncate leading-tight">{activeChannel.name}</p>
                <p className="text-[10px] text-zinc-500 truncate leading-tight">{activeChannel.handle}</p>
                <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${authStatus?.connected ? 'text-emerald-400' : 'text-amber-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${authStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span>
                    {authStatusLoading
                      ? 'Verifying saved selection…'
                      : authStatus?.connected
                        ? 'Target Publishing Destination'
                        : 'Sign in again to verify and publish'}
                  </span>
                </p>
              </div>

              {/* Action button */}
              <a
                href={activeChannel.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto shrink-0 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#26262C] text-[10.5px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#242424] hover:border-white/10 flex items-center gap-1"
              >
                <span>View Channel</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>

            {/* Footer info strip */}
            {authStatus?.connected && (
              <div className="bg-[#0D0D0D] border-t border-[#1E1E1E] px-3 py-1.5 flex items-center justify-between">
                <span className="text-[9.5px] text-zinc-600 font-mono">OAuth 2.0 Token Active</span>
                <span className="text-[9.5px] text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready for Shorts Publishing
                </span>
              </div>
            )}
            {!authStatusLoading && !authStatus?.connected && (
              <div className="border-t border-amber-500/20 bg-amber-950/20 px-3 py-2 text-[10px] text-amber-200">
                The saved channel is displayed, but YouTube authorization could not be verified. Sign in again before scheduling or publishing.
              </div>
            )}
          </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-950/15 p-4 text-sm">
              <p className="font-semibold text-amber-200">No active YouTube channel is selected.</p>
              <p className="mt-1 text-xs text-amber-100/70">
                Select a connected YouTube channel in Social Accounts, then return here. This prevents publishing to a placeholder channel.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.('channels')}
                className="mt-3 rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/10"
              >
                Open Social Accounts
              </button>
            </div>
          )}

          {/* Engine & Pipeline Architecture Diagnostic */}
          <div className="p-3.5 rounded-xl bg-[#111111] border border-[#222226] text-xs text-zinc-400 flex flex-col gap-2.5">
            <span className="text-white font-semibold text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Cron Daemon &amp; Engine Diagnostic</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-[#101013] border border-[#222226]">
                <span className="text-zinc-500 block">Cron Daemon</span>
                <span className="text-emerald-400 font-mono font-semibold">Active (APScheduler)</span>
              </div>
              <div className="p-2 rounded-lg bg-[#101013] border border-[#222226]">
                <span className="text-zinc-500 block">Tick Interval</span>
                <span className="text-white font-mono font-semibold">60 seconds</span>
              </div>
              <div className="p-2 rounded-lg bg-[#101013] border border-[#222226]">
                <span className="text-zinc-500 block">Video Format</span>
                <span className="text-white font-mono font-semibold">9:16 Shorts (1080x1920)</span>
              </div>
              <div className="p-2 rounded-lg bg-[#101013] border border-[#222226]">
                <span className="text-zinc-500 block">AI Script Model</span>
                <span className="text-blue-400 font-mono font-semibold">{DEFAULT_SCRIPT_MODEL_LABEL}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationsPane;
