import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Clock,
  Zap,
  Play,
  Pause,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  Radio,
  Sliders,
  X,
  Volume2,
  Copy,
  Check,
  Video,
  Youtube,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  BarChart3,
  Globe,
} from 'lucide-react';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { AutomationJob, AutomationHistoryEntry } from '@/src/features/youtube/types';
import { toast } from 'sonner';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export interface AutomationsPaneProps {
  onNavigate?: (page: string) => void;
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
  { value: 'every_8h', label: 'Every 8 Hours (Recommended)', schedule: 'Every 8 Hours' },
  { value: 'every_12h', label: 'Every 12 Hours', schedule: 'Every 12 Hours' },
  { value: 'custom', label: 'Custom Interval...', schedule: 'Custom' },
];

export const AutomationsPane: React.FC<AutomationsPaneProps> = ({
  onNavigate,
  className = '',
  activeTimeline,
}) => {
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
  const [musicTrack, setMusicTrack] = useState('Epic Cinematic');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'scheduled'>('public');

  // Channel authorization state & runtime execution feedback
  const [authStatus, setAuthStatus] = useState<{ connected: boolean; channel?: any } | null>(null);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const [activePipelinePhase, setActivePipelinePhase] = useState<number>(0);

  // Live countdown, Run History, Pause/Resume & Safe Delete state
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [historyByJob, setHistoryByJob] = useState<Record<string, AutomationHistoryEntry[]>>({});
  const [loadingHistoryByJob, setLoadingHistoryByJob] = useState<Record<string, boolean>>({});
  const [expandedHistoryJobId, setExpandedHistoryJobId] = useState<string | null>(null);
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState<string | null>(null);
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);

  // Live tick every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const data = await youtubeApi.getAutomations();
      setAutomations(data);
    } catch (err: any) {
      console.warn('Failed to load automations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (jobId: string, force = false) => {
    if (!force && historyByJob[jobId]) return;
    setLoadingHistoryByJob((prev) => ({ ...prev, [jobId]: true }));
    try {
      const entries = await youtubeApi.getAutomationHistory(jobId);
      setHistoryByJob((prev) => ({ ...prev, [jobId]: entries }));
    } catch (err) {
      console.warn(`Failed to load history for ${jobId}:`, err);
    } finally {
      setLoadingHistoryByJob((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleClearHistory = async (jobId: string) => {
    try {
      await youtubeApi.clearAutomationHistory(jobId);
      setHistoryByJob((prev) => ({ ...prev, [jobId]: [] }));
      toast.success('Run history cleared');
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear history');
    }
  };

  const loadAuthStatus = async () => {
    try {
      const res = await youtubeApi.getAuthStatus();
      if (res && res.success) {
        setAuthStatus({ connected: Boolean(res.connected), channel: res.channel });
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    loadAutomations();
    loadAuthStatus();
  }, []);

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
      const updated = await youtubeApi.toggleAutomation(id);
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
      await youtubeApi.deleteAutomation(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteJobId(null);
      toast.success('Automation rule and history deleted');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete automation');
    }
  };

  const handleRunNow = async (id: string, jobTheme: string) => {
    setRunningJobId(id);
    setActivePipelinePhase(0);

    // Dynamic phase progression timer
    const phaseTimer1 = setTimeout(() => setActivePipelinePhase(1), 3200); // Gemini Voice
    const phaseTimer2 = setTimeout(() => setActivePipelinePhase(2), 7000); // FFmpeg 1080x1920 MP4
    const phaseTimer3 = setTimeout(() => setActivePipelinePhase(3), 12000); // YouTube Publish

    try {
      toast.info(`Executing autonomous pipeline for "${jobTheme}"...`);
      const payload = (activeTimeline?.videoClips?.length || activeTimeline?.imageClips?.length)
        ? activeTimeline
        : undefined;
      const res = await youtubeApi.runAutomationNow(id, payload);
      const isLive = Boolean(res.data?.isLive || res.data?.youtubeStatus === 'uploaded');
      const title = res.data?.title || jobTheme;
      
      if (isLive) {
        toast.success(`Pipeline complete! "${title}" published live to YouTube Shorts.`);
      } else {
        toast.success(`Pipeline complete! "${title}" rendered and cataloged in Studio Library.`);
      }
      await loadAutomations();
      await loadHistory(id, true);
    } catch (err: any) {
      toast.error(err.message || 'Pipeline execution failed');
      await loadAutomations();
      await loadHistory(id, true);
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      setRunningJobId(null);
      setActivePipelinePhase(0);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
        musicTrack,
        privacyStatus,
        active: true,
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

  const activeCount = automations.filter((a) => a.active).length;

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
      return { icon: '🏛️', gradient: 'bg-amber-500/15 border-amber-500/30 text-amber-300', dot: 'bg-amber-400', badgeText: 'Stoic Philosophy' };
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
    return { icon: '⚡', gradient: 'bg-blue-500/15 border-blue-500/30 text-blue-300', dot: 'bg-blue-400', badgeText: 'Motivation' };
  };

  const formatNextRun = (isoString?: string) => {
    return formatNextRunInfo(isoString).display;
  };

  return (
    <div className={`flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B] ${className}`}>
      {/* ── Top Header Bar ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-white truncate">Daily Automations</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shrink-0">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`h-7 px-2.5 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
              activeSubTab === 'create'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50'
            }`}
            title="Configure New Automation Schedule"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={loadAutomations}
            disabled={loading}
            className="w-7 h-7 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#323238]"
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
            className="h-7 px-2 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[11px] font-medium text-white transition-colors cursor-pointer border border-[#323238] flex items-center gap-1 shrink-0"
            title="Open Automations Hub in a new tab"
          >
            <ExternalLink className="w-3 h-3 text-[#A1A1AA]" />
            <span className="hidden sm:inline">Hub</span>
          </a>
        </div>
      </div>

      {/* ── Subtabs Header Bar (Exact AI Script Studio / Workspace Pane Style) ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveSubTab('pipelines')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 capitalize transition-all cursor-pointer border-b-2 -mb-px shrink-0 ${
            activeSubTab === 'pipelines'
              ? 'text-white border-[#3B82F6] font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${activeSubTab === 'pipelines' ? 'text-[#60A5FA]' : 'text-[#71717A]'}`} />
          <span>Pipelines</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#26262B] text-zinc-400 font-mono-studio">
            {automations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('create')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 capitalize transition-all cursor-pointer border-b-2 -mb-px shrink-0 ${
            activeSubTab === 'create'
              ? 'text-white border-[#3B82F6] font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeSubTab === 'create' ? 'text-[#60A5FA]' : 'text-[#71717A]'}`} />
          <span>New Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('channel')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 capitalize transition-all cursor-pointer border-b-2 -mb-px shrink-0 ${
            activeSubTab === 'channel'
              ? 'text-white border-[#3B82F6] font-bold'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <Youtube className={`w-3.5 h-3.5 ${activeSubTab === 'channel' ? 'text-red-500' : 'text-[#71717A]'}`} />
          <span>Channel &amp; Target</span>
          {authStatus?.connected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          )}
        </button>
      </div>

      {/* ── Subtab 1: Pipelines ── */}
      {activeSubTab === 'pipelines' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Executive Unified Status Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#17171C] via-[#141418] to-[#17171C] border-b border-[#26262E] flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
            {/* Target Channel Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                authStatus?.connected
                  ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400'
              }`}>
                <Youtube className="w-4 h-4" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Publish Target</div>
                {authStatus?.connected ? (
                  <div className="flex items-center gap-1.5 truncate mt-0.5">
                    <span className="text-xs font-bold text-white truncate">{authStatus.channel?.name || '@channel'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                      Live Shorts
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold text-amber-300">Studio Library</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                      Local MP4
                    </span>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('youtube-channels')}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline ml-1 cursor-pointer"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 24/7 Daemon Pulse */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1B1B22] border border-[#2B2B36] shadow-sm ml-auto shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="text-right">
                <div className="text-[10px] font-bold text-emerald-400 leading-tight">24/7 Daemon Active</div>
                <div className="text-[9px] text-zinc-500 font-mono leading-tight">Pulse: 60s</div>
              </div>
            </div>
          </div>

          {/* Main Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-3.5">
            {/* Section Heading */}
            <div className="text-[10px] uppercase font-mono-studio text-[#A1A1AA] font-bold tracking-wider">
              Configured Pipelines ({automations.length})
            </div>

            {/* Automation Rules List */}
            {loading ? (
              <div className="space-y-2.5 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#17171C] border border-[#26262E] space-y-2">
                    <div className="h-3.5 bg-zinc-800 rounded w-2/3" />
                    <div className="h-2.5 bg-zinc-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : automations.length === 0 ? (
              <div className="p-5 rounded-xl bg-[#17171C] border border-[#26262E] text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">No Active Automation Schedules</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Set up an autonomous schedule to generate scripts with Gemini 3.8 Flash, synthesize voice, render 9:16 vertical MP4, and upload to YouTube.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('create')}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Schedule</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map((job) => {
                  const isRunning = runningJobId === job.id || job.lastStatus === 'running';
                  const themeMeta = getThemeMeta(job.theme);
                  const scheduleLabel = formatScheduleLabel(job.publishTime || job.schedule);
                  const nextRunInfo = formatNextRunInfo(job.nextRun);
                  const isExpandedHistory = expandedHistoryJobId === job.id;
                  const historyList = historyByJob[job.id] || [];
                  const isHistoryLoading = loadingHistoryByJob[job.id];
                  const totalRunsCount = historyList.length > 0 ? historyList.length : (job.lastRun ? 1 : 0);
                  const isConfirmingDelete = confirmDeleteJobId === job.id;
                  const isToggling = togglingJobId === job.id;

                  return (
                    <div
                      key={job.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-b from-[#18181D] to-[#141418] border border-[#26262E] hover:border-zinc-700/80 transition-all flex flex-col gap-3 shadow-md"
                    >
                      {/* Top row: Theme Accent, Schedule Badges, Pause/Resume & Status Badge */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border text-base ${themeMeta.gradient}`}>
                            <span>{themeMeta.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-white truncate">{job.theme}</h4>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium border ${themeMeta.gradient}`}>
                                {themeMeta.badgeText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-1 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-[#202026] text-zinc-300 border border-[#2D2D36]">
                                ⏰ {scheduleLabel}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#202026] text-zinc-300 border border-[#2D2D36]">
                                🎙️ {job.voice || 'Fenrir'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle Switch & Pause/Resume */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggle(job.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shadow-sm ${
                              job.active
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            } disabled:opacity-50`}
                            title={job.active ? 'Pause automated runs' : 'Resume automated runs'}
                          >
                            {isToggling ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : job.active ? (
                              <Pause className="w-2.5 h-2.5 fill-current" />
                            ) : (
                              <Play className="w-2.5 h-2.5 fill-current" />
                            )}
                            <span>{job.active ? 'Pause' : 'Resume'}</span>
                          </button>

                          <span
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              job.active
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${job.active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                            <span>{job.active ? 'Active' : 'Paused'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Schedule Timing & Visibility Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#111114] border border-[#222228] text-[10px]">
                        <div className="flex items-center gap-1.5 text-zinc-400 min-w-0">
                          <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>Next:</span>
                          <strong className="text-zinc-200">{nextRunInfo.display}</strong>
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${
                            nextRunInfo.isPast
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-mono'
                          }`}>
                            {nextRunInfo.relative}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-zinc-400 ml-auto shrink-0">
                          <Globe className="w-3 h-3 text-zinc-500" />
                          <span>Release:</span>
                          <span className="font-semibold text-zinc-200 capitalize">
                            {job.privacyStatus === 'scheduled' ? 'Scheduled' : 'Public'}
                          </span>
                        </div>
                      </div>

                      {/* Performance Metrics Strip */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1.5 rounded-lg bg-[#141418] border border-[#222228]">
                          <div className="text-[9px] text-zinc-500 font-mono uppercase">Total Runs</div>
                          <div className="text-[11px] font-bold text-zinc-200 mt-0.5">{totalRunsCount} recorded</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#141418] border border-[#222228]">
                          <div className="text-[9px] text-zinc-500 font-mono uppercase">Output Quality</div>
                          <div className="text-[11px] font-bold text-zinc-200 mt-0.5">1080x1920 MP4</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#141418] border border-[#222228]">
                          <div className="text-[9px] text-zinc-500 font-mono uppercase">Target</div>
                          <div className="text-[11px] font-bold text-emerald-400 truncate mt-0.5">
                            {authStatus?.connected ? (authStatus.channel?.name || 'YouTube Live') : 'Studio Library'}
                          </div>
                        </div>
                      </div>

                      {/* ── Dynamic Live Pipeline Stepper (Visible during active execution) ── */}
                      {isRunning && (
                        <div className="p-3 rounded-lg bg-blue-950/25 border border-blue-500/40 flex flex-col gap-2.5 animate-fade-in shadow-inner">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-blue-300 flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                              <span>Autonomous Pipeline In Progress</span>
                            </span>
                            <span className="font-mono text-xs text-blue-400/80 font-semibold">Stage {activePipelinePhase + 1}/4</span>
                          </div>

                          {/* 4-Step Visual Track */}
                          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                            {[
                              { name: '1. Script', desc: 'Gemini 3.8' },
                              { name: '2. Voice', desc: job.voice || 'Fenrir' },
                              { name: '3. Render', desc: '1080p MP4' },
                              { name: '4. Publish', desc: job.privacyStatus === 'scheduled' ? 'Schedule' : 'Shorts' },
                            ].map((step, idx) => {
                              const isDone = activePipelinePhase > idx;
                              const isCurrent = activePipelinePhase === idx;

                              return (
                                <div
                                  key={step.name}
                                  className={`p-1.5 rounded-lg border text-center transition-all ${
                                    isDone
                                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                                      : isCurrent
                                      ? 'bg-blue-600/30 border-blue-400 text-blue-200 ring-1 ring-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                                      : 'bg-[#121216] border-[#222228] text-zinc-500'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold truncate flex items-center justify-center gap-1">
                                    {isDone && <Check className="w-2.5 h-2.5 shrink-0 text-emerald-400" />}
                                    {isCurrent && <Loader2 className="w-2.5 h-2.5 shrink-0 animate-spin text-blue-400" />}
                                    <span>{step.name}</span>
                                  </div>
                                  <div className="text-[8px] text-zinc-400 truncate mt-0.5">{step.desc}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Latest Execution Outcome Block ── */}
                      {!isRunning && job.lastStatus && job.lastStatus !== 'idle' && (
                        <div
                          className={`p-2.5 rounded-lg border text-xs flex flex-col gap-2 transition-all ${
                            job.lastStatus === 'success'
                              ? job.lastIsLive
                                ? 'bg-emerald-950/20 border-emerald-500/35 border-l-4 border-l-emerald-500'
                                : 'bg-blue-950/20 border-blue-500/35 border-l-4 border-l-blue-500'
                              : 'bg-rose-950/20 border-rose-500/35 border-l-4 border-l-rose-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {job.lastStatus === 'success' ? (
                                job.lastIsLive ? (
                                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Published to YouTube Live</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                                    <span>Cataloged in Studio Library</span>
                                  </span>
                                )
                              ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Last Execution Failed</span>
                                </span>
                              )}
                            </div>

                            {job.lastRun && (
                              <span className="text-[9px] font-mono text-zinc-400">
                                {new Date(job.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          {/* Video Title */}
                          {job.lastVideoTitle && (
                            <div className="text-[11px] font-semibold text-white truncate flex items-center gap-1.5">
                              <span className="text-zinc-400 font-normal">Video:</span>
                              <span className="italic text-zinc-100">"{job.lastVideoTitle}"</span>
                            </div>
                          )}

                          {/* Execution Message */}
                          {job.lastRunMessage && (
                            <p className="text-[10px] text-zinc-300 leading-normal line-clamp-2">
                              {job.lastRunMessage}
                            </p>
                          )}

                          {/* Outcome Actions */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5 flex-wrap">
                            {job.lastVideoUrl && (
                              <>
                                {job.lastIsLive ? (
                                  <a
                                    href={job.lastVideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Watch on YouTube</span>
                                  </a>
                                ) : (
                                  onNavigate && (
                                    <button
                                      type="button"
                                      onClick={() => onNavigate('videos')}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[10px] font-bold text-blue-300 hover:text-blue-200 transition-colors cursor-pointer"
                                    >
                                      <Video className="w-3 h-3" />
                                      <span>Open in Studio Catalog</span>
                                    </button>
                                  )
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(job.lastVideoUrl!, job.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer ml-auto border border-zinc-700"
                                >
                                  {copiedJobId === job.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Link</span>
                                    </>
                                  )}
                                </button>
                              </>
                            )}

                            {job.lastStatus === 'failed' && (
                              <button
                                type="button"
                                onClick={() => handleRunNow(job.id, job.theme)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-bold text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Retry Pipeline</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── Collapsible Run History Drawer with Direct Video & Publish Links ── */}
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = isExpandedHistory ? null : job.id;
                            setExpandedHistoryJobId(next);
                            if (next) loadHistory(job.id);
                          }}
                          className="flex items-center justify-between w-full py-1.5 px-2.5 rounded-lg bg-[#131317] hover:bg-[#1A1A20] border border-[#24242C] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-blue-400" />
                            <span>Execution &amp; Video History</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#202026] text-zinc-400 font-mono">
                              {totalRunsCount}
                            </span>
                          </span>
                          {isExpandedHistory ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </button>

                        {isExpandedHistory && (
                          <div className="p-2.5 rounded-lg bg-[#101014] border border-[#222228] flex flex-col gap-2 animate-fade-in">
                            {isHistoryLoading ? (
                              <div className="py-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                                <span>Loading execution records...</span>
                              </div>
                            ) : historyList.length === 0 ? (
                              <div className="py-3 text-center text-xs text-zinc-500">
                                No previous runs recorded yet for this automation rule.
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                {historyList.map((entry) => {
                                  const isLiveShort = entry.isLive || (entry.status === 'success' && Boolean(entry.youtubeUrl));
                                  return (
                                    <div
                                      key={entry.id}
                                      className="p-2.5 rounded-lg bg-[#16161B] border border-[#26262E] flex flex-col gap-1.5 text-xs"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          {entry.status === 'success' ? (
                                            isLiveShort ? (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                                <Youtube className="w-3 h-3 text-red-500" />
                                                <span>Live YouTube Short</span>
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400">
                                                <Video className="w-3 h-3 text-blue-400" />
                                                <span>Studio Catalog</span>
                                              </span>
                                            )
                                          ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                                              <AlertCircle className="w-3 h-3 text-rose-400" />
                                              <span>Failed</span>
                                            </span>
                                          )}
                                        </div>

                                        <span className="text-[9px] font-mono text-zinc-400">
                                          {new Date(entry.executedAt).toLocaleString([], {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </div>

                                      {entry.videoTitle && (
                                        <div className="text-[11px] font-semibold text-white truncate">
                                          "{entry.videoTitle}"
                                        </div>
                                      )}

                                      {entry.message && (
                                        <p className="text-[10px] text-zinc-400 line-clamp-1">{entry.message}</p>
                                      )}

                                      {/* Links Row */}
                                      <div className="flex items-center gap-2 pt-1 border-t border-white/5 flex-wrap">
                                        {entry.youtubeUrl && (
                                          <a
                                            href={entry.youtubeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400 transition-colors"
                                          >
                                            <Youtube className="w-3 h-3 text-red-500" />
                                            <span>Watch Short</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}

                                        {entry.videoUrl && (
                                          <a
                                            href={entry.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-300 transition-colors"
                                          >
                                            <Video className="w-3 h-3 text-blue-400" />
                                            <span>Open MP4</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}

                                        {(entry.youtubeUrl || entry.videoUrl) && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyLink(entry.youtubeUrl || entry.videoUrl!, entry.id)}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer ml-auto border border-zinc-700"
                                          >
                                            {copiedJobId === entry.id ? (
                                              <>
                                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                                                <span className="text-emerald-400">Copied</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-2.5 h-2.5" />
                                                <span>Copy Link</span>
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleClearHistory(job.id)}
                                    className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  >
                                    Clear History
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Safe Delete Confirmation Banner ── */}
                      {isConfirmingDelete && (
                        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs flex flex-col gap-2 animate-fade-in shadow-inner">
                          <div className="flex items-center gap-2 text-rose-300 font-bold">
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span>Delete this automation schedule?</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed">
                            This will permanently remove <strong className="text-white">"{job.theme}"</strong> and all of its recorded history.
                          </p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteJobId(null)}
                              className="px-3 py-1 rounded bg-[#202026] hover:bg-[#2C2C34] text-zinc-300 text-[11px] font-semibold border border-[#32323A] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => executeDelete(job.id)}
                              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Confirm Delete</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons row */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <button
                          type="button"
                          disabled={isRunning}
                          onClick={() => handleRunNow(job.id, job.theme)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                            isRunning
                              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-emerald-950/40 hover:shadow-emerald-900/60 active:scale-[0.99]'
                          }`}
                          title="Trigger full generation and publish now"
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating & Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Run Pipeline Now</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteJobId(isConfirmingDelete ? null : job.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
                            isConfirmingDelete
                              ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                              : 'bg-[#202026] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border-[#2E2E38] hover:border-rose-800/40'
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
              <div className="flex items-center justify-between">
                <div className="text-white font-bold text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Autonomous 4-Stage Production Engine</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                  Fully Autonomous
                </span>
              </div>

              {/* 4 Steps Visual Flow */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { step: '01', title: 'Gemini 3.8', sub: 'Script & Hook' },
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
          className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-4 animate-fade-in"
        >
          {/* Header intro */}
          <div className="flex flex-col gap-1 pb-2 border-b border-[#242428]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Configure New Publishing Rule</span>
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              ApexMind will autonomously generate, narrate, render 9:16 vertical MP4, and upload to YouTube on your schedule.
            </p>
          </div>

          {/* Theme */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
              Niche / Theme
            </label>
            <CustomSelect
              options={THEME_OPTIONS}
              value={theme}
              onChange={(val) => setTheme(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#151518] !border-[#26262B] !py-2 !rounded-lg text-xs"
              menuClassName="!bg-[#16161A] !border-[#2E2E38]"
            />
          </div>

          {/* Schedule Frequency (Segmented Pill Toggle) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
              Schedule Frequency
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#101013] rounded-xl border border-[#26262B] gap-1">
              <button
                type="button"
                onClick={() => setFrequencyType('interval')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  frequencyType === 'interval'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#71717A] hover:text-white hover:bg-[#16161A]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${frequencyType === 'interval' ? 'text-white' : 'text-[#71717A]'}`} />
                <span>Every X Hours / Mins</span>
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('daily')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  frequencyType === 'daily'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#71717A] hover:text-white hover:bg-[#16161A]'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${frequencyType === 'daily' ? 'text-white' : 'text-[#71717A]'}`} />
                <span>Daily at Time</span>
              </button>
            </div>
          </div>

          {/* Interval Selection OR Daily Time & Privacy Status */}
          {frequencyType === 'interval' ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
                    Interval (e.g. 3h, 8h)
                  </label>
                  <CustomSelect
                    options={INTERVAL_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                    value={intervalSelection}
                    onChange={(val) => setIntervalSelection(val)}
                    className="w-full text-xs"
                    buttonClassName="!bg-[#151518] !border-[#26262B] !py-2 !rounded-lg text-xs"
                    menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
                    YouTube Release
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'public', label: 'Instant Public' },
                      { value: 'scheduled', label: 'Scheduled (publishAt)' },
                    ]}
                    value={privacyStatus}
                    onChange={(val) => setPrivacyStatus(val as any)}
                    className="w-full text-xs"
                    buttonClassName="!bg-[#151518] !border-[#26262B] !py-2 !rounded-lg text-xs"
                    menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                  />
                </div>
              </div>

              {/* Custom interval builder when 'custom' is selected */}
              {intervalSelection === 'custom' && (
                <div className="p-2.5 rounded-lg bg-[#141418] border border-blue-500/25 flex items-center gap-2">
                  <span className="text-xs text-zinc-300 font-medium shrink-0">Run every:</span>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={customValue}
                    onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 bg-[#101013] border border-[#26262B] rounded-md px-2 py-1 text-xs text-white text-center font-bold"
                  />
                  <CustomSelect
                    options={[
                      { value: 'hours', label: 'Hours (e.g. 3 hr, 8 hr)' },
                      { value: 'minutes', label: 'Minutes (e.g. 30 min)' },
                    ]}
                    value={customUnit}
                    onChange={(val) => setCustomUnit(val as any)}
                    className="flex-1 text-xs"
                    buttonClassName="!bg-[#101013] !border-[#26262B] !py-1 !rounded-md text-xs"
                    menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
                  Time (UTC)
                </label>
                <input
                  type="time"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                  required
                  className="w-full bg-[#151518] border border-[#26262B] focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
                  YouTube Release
                </label>
                <CustomSelect
                  options={[
                    { value: 'public', label: 'Instant Public' },
                    { value: 'scheduled', label: 'Scheduled (publishAt)' },
                  ]}
                  value={privacyStatus}
                  onChange={(val) => setPrivacyStatus(val as any)}
                  className="w-full text-xs"
                  buttonClassName="!bg-[#151518] !border-[#26262B] !py-2 !rounded-lg text-xs"
                  menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                />
              </div>
            </div>
          )}

          {/* AI Voice Persona */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
              Gemini Voice Persona
            </label>
            <CustomSelect
              options={VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.name }))}
              value={voice}
              onChange={(val) => setVoice(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#151518] !border-[#26262B] !py-2 !rounded-lg text-xs"
              menuClassName="!bg-[#16161A] !border-[#2E2E38]"
            />
          </div>

          {/* Soundtrack */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold tracking-wider">
              Soundtrack
            </label>
            <CustomSelect
              options={MUSIC_OPTIONS}
              value={musicTrack}
              onChange={(val) => setMusicTrack(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#151518] !border-[#26262B] !py-2 !rounded-lg text-xs"
              menuClassName="!bg-[#16161A] !border-[#2E2E38]"
            />
          </div>

          {/* Target Channel Notification */}
          <div className="p-3 rounded-xl bg-[#151518] border border-[#24242A] flex items-center gap-2.5 text-[11px]">
            <Youtube className={`w-4 h-4 shrink-0 ${authStatus?.connected ? 'text-red-500' : 'text-zinc-500'}`} />
            <div className="text-zinc-300 min-w-0 truncate">
              {authStatus?.connected ? (
                <span>Publishing target: <strong className="text-emerald-400">{authStatus.channel?.name || '@channel'}</strong></span>
              ) : (
                <span>Publishing target: <strong className="text-amber-400/90">Studio Library</strong> (Connect channel to auto-publish)</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242428] mt-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('pipelines')}
              className="px-3.5 py-2 rounded-lg bg-[#222226] text-xs text-[#A1A1AA] hover:text-white font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md transition-all"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Activate Automation Cron</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Subtab 3: Channel & Target ── */}
      {activeSubTab === 'channel' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-3.5 animate-fade-in">
          {/* Target Channel Card */}
          <div className="p-4 rounded-xl bg-[#18181C] border border-[#2E2E38] shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#24242A]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <Youtube className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">YouTube Target Channel</h4>
                  <p className="text-[10px] text-zinc-400">Autonomous Video Publishing Destination</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${
                  authStatus?.connected
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}
              >
                {authStatus?.connected ? 'Connected' : 'Studio Mode'}
              </span>
            </div>

            {authStatus?.connected ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#121215] border border-[#24242A] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">
                    {authStatus.channel?.name?.charAt(0) || 'Y'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{authStatus.channel?.name || 'Connected Channel'}</p>
                    <p className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Ready for Instant Shorts Publishing</span>
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  All automated scheduled pipeline runs will render in 1080x1920 MP4 format and upload live directly to your channel's YouTube Shorts catalog.
                </p>

                <div className="pt-2 border-t border-[#24242A] flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">OAuth 2.0 Token Active</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('youtube-channels');
                      else window.open('/youtube/channels', '_blank');
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#323238] flex items-center gap-1"
                  >
                    <span>Manage Channel</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-300 block font-semibold">Local Studio Storage Mode</strong>
                    Videos are synthesized, rendered into Full HD 1080x1920 MP4, and saved to your Studio Library catalog. Connect your Google YouTube account to enable zero-click live uploads.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate('youtube-channels');
                    else window.open('/youtube/channels', '_blank');
                  }}
                  className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>Connect YouTube Channel</span>
                </button>
              </div>
            )}
          </div>

          {/* Engine & Pipeline Architecture Diagnostic */}
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#222226] text-xs text-zinc-400 flex flex-col gap-2.5">
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
                <span className="text-blue-400 font-mono font-semibold">Gemini 3.8 Flash</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationsPane;

