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
  Square,
} from 'lucide-react';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { AutomationJob, AutomationHistoryEntry } from '@/src/features/youtube/types';
import { WorkspaceTabType } from '../WorkspaceSidebar';
import { toast } from 'sonner';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

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

const AI_MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Adaptive & High Quality • Recommended)' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Next-Gen Speed & Storyboarding)' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (Rapid & Lightweight)' },
  { value: 'gemini-flash-latest', label: 'Gemini Flash Latest (Cutting-Edge)' },
];

const ASPECT_RATIO_OPTIONS = [
  { value: '9:16', label: '9:16 (Vertical • Shorts / Reels / TikTok)' },
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
  { value: 'every_8h', label: 'Every 8 Hours (Recommended)', schedule: 'Every 8 Hours' },
  { value: 'every_12h', label: 'Every 12 Hours', schedule: 'Every 12 Hours' },
  { value: 'custom', label: 'Custom Interval...', schedule: 'Custom' },
];

export const AutomationsPane: React.FC<AutomationsPaneProps> = ({
  onNavigate,
  onPaneChange,
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
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [length, setLength] = useState('30 seconds');
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
      // Automatically prefetch history for every automation schedule
      if (Array.isArray(data)) {
        data.forEach((job) => {
          loadHistory(job.id, true);
        });
      }
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

  const runningTimersRef = React.useRef<any[]>([]);

  const getJobStageIndex = (job: AutomationJob): number => {
    if (runningJobId === job.id) return activePipelinePhase;
    if (!job.lastRunMessage) return 0;
    const m = job.lastRunMessage.match(/Stage (\d)\/6/i);
    return m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
  };

  const handleStopPipeline = async (id: string) => {
    runningTimersRef.current.forEach(clearTimeout);
    runningTimersRef.current = [];
    setRunningJobId(null);
    setActivePipelinePhase(0);
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
    setActivePipelinePhase(0);

    // Dynamic phase progression based on realistic pipeline stage durations (zero network polling)
    const timers = [
      setTimeout(() => setActivePipelinePhase(1), 16000), // Stage 2: Voice (Script takes ~16s)
      setTimeout(() => setActivePipelinePhase(2), 23000), // Stage 3: B-Roll
      setTimeout(() => setActivePipelinePhase(3), 32000), // Stage 4: Captions
      setTimeout(() => setActivePipelinePhase(4), 42000), // Stage 5: Render
      setTimeout(() => setActivePipelinePhase(5), 58000), // Stage 6: Publish
    ];
    runningTimersRef.current = timers;

    try {
      toast.info(`Executing autonomous 6-stage pipeline for "${jobTheme}"...`);
      const payload = (activeTimeline?.videoClips?.length || activeTimeline?.imageClips?.length)
        ? activeTimeline
        : undefined;
      const res = await youtubeApi.runAutomationNow(id, payload);
      // On success, mark all 6 stages as completed
      setActivePipelinePhase(6);
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
      timers.forEach(clearTimeout);
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
        aiModel,
        aspectRatio,
        length,
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
    <div className={`flex flex-col h-full bg-[#141414] text-white font-sans-studio select-none overflow-hidden rounded-none border-0 ${className}`}>
      {/* ── Top Header Bar ── */}
      <div className="relative h-11 px-3.5 bg-[#141414] border-b border-[#242424] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center shrink-0 text-[#60A5FA]">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-white truncate">Daily Automations</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] font-semibold border border-[#3B82F6]/30 shrink-0">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`h-7 px-2.5 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
              activeSubTab === 'create' ? 'bg-[#3B82F6]/25 text-[#60A5FA] border border-[#3B82F6]/40' : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white border border-[#60A5FA]/30 shadow-xs'
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

      {/* ── Subtabs Segmented Control (High-Precision Studio Navigation) ── */}
      <div className="p-2.5 bg-[#111111] border-b border-[#242424] shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#181818] rounded-none border-0">
          {/* Tab 1: Pipelines */}
          <button
            type="button"
            onClick={() => setActiveSubTab('pipelines')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeSubTab === 'pipelines'
                ? 'bg-[#3B82F6]/15 text-[#60A5FA] shadow-xs font-semibold border border-[#3B82F6]/40'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border border-transparent'
            }`}
            title="Active Autonomous Pipelines"
          >
            <Zap className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'pipelines' ? 'text-[#60A5FA]' : 'text-slate-400'}`} />
            <span className="truncate">Pipelines</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono shrink-0 transition-colors ${
                activeSubTab === 'pipelines'
                  ? 'bg-[#3B82F6]/20 text-[#60A5FA] font-bold border border-[#3B82F6]/30'
                  : 'bg-[#26262B] text-zinc-400'
              }`}
            >
              {automations.length}
            </span>
          </button>

          {/* Tab 2: New Schedule */}
          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeSubTab === 'create'
                ? 'bg-[#3B82F6]/15 text-[#60A5FA] shadow-xs font-semibold border border-[#3B82F6]/40'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border border-transparent'
            }`}
            title="Configure New Automation Schedule"
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'create' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="truncate">Schedule</span>
          </button>

          {/* Tab 3: Channel Target */}
          <button
            type="button"
            onClick={() => setActiveSubTab('channel')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-w-0 ${
              activeSubTab === 'channel'
                ? 'bg-[#3B82F6]/15 text-[#60A5FA] shadow-xs font-semibold border border-[#3B82F6]/40'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border border-transparent'
            }`}
            title="Publishing Destination & Channel Target"
          >
            <Youtube className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'channel' ? 'text-red-500' : 'text-slate-400'}`} />
            <span className="truncate">Channel</span>
            {authStatus?.connected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" title="Connected to YouTube" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" title="Studio Local Mode" />
            )}
          </button>
        </div>
      </div>

      {/* ── Subtab 1: Pipelines ── */}
      {activeSubTab === 'pipelines' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Executive Unified Status Header */}
          <div className="px-3.5 py-2.5 bg-[#161616] border-b border-[#242424] flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
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
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 font-semibold shrink-0">
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
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#181818] border border-[#242424] shadow-sm ml-auto shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#60A5FA]"></span>
              </span>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#60A5FA] leading-tight">24/7 Daemon Active</div>
                <div className="text-[9px] text-zinc-500 font-mono leading-tight">Pulse: 60s</div>
              </div>
            </div>
          </div>

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
                          ? 'bg-gradient-to-b from-[#181820] via-[#141419] to-[#121216] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                          : isPaused
                          ? 'bg-gradient-to-b from-[#16161B] via-[#131317] to-[#111114] border-zinc-800/80 opacity-95'
                          : 'bg-[#161616] border border-[#242424] hover:border-[#383838]'
                      }`}
                    >
                      {/* ── 1. HEADER ROW: ICON + TITLE + STATUS PILL ── */}
                      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-[#23232D]">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border text-lg ${themeMeta.gradient} shadow-sm`}>
                            <span>{themeMeta.icon}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-white tracking-tight leading-snug break-words">
                                {job.theme}
                              </h4>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold border shrink-0 ${themeMeta.gradient}`}>
                                {themeMeta.badgeText}
                              </span>
                            </div>
                            {/* Badges strip */}
                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-mono mt-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-[#1E1E1E] text-[#D4D4D8] border border-[#2A2A2A] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-[#60A5FA] shrink-0" />
                                <span>{scheduleLabel}</span>
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#1E1E1E] text-[#D4D4D8] border border-[#2A2A2A] flex items-center gap-1">
                                <Volume2 className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                <span>{job.voice || 'Fenrir'}</span>
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#1E1E1E] text-[#9CA3AF] border border-[#2A2A2A]">
                                {job.privacyStatus === 'scheduled' ? '📅 Scheduled' : '🌐 Public'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top-Right: Clean single status pill */}
                        <div className="shrink-0 pt-0.5">
                          {isRunning ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-400" />
                              <span>Running</span>
                            </span>
                          ) : isActive ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-[#60A5FA] text-[10px] font-bold shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
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

                      {/* ── 2. NEXT START SCHEDULE & TARGET BANNER ── */}
                      <div className="p-2.5 rounded-xl bg-[#181818] border border-[#242424] text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                            <span className="text-zinc-400 text-[11px]">Next:</span>
                            <strong className="text-white text-[11px] font-mono truncate">{nextRunInfo.display}</strong>
                          </div>
                          {isActive && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                              nextRunInfo.isPast
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                                : 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 font-mono'
                            }`}>
                              {nextRunInfo.relative}
                            </span>
                          )}
                          {isPaused && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                              Suspended
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#242424] text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>Target:</span>
                          </span>
                          {authStatus?.connected ? (
                            <span className="font-bold text-[#E5E5E5] flex items-center gap-1.5 truncate">
                              <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="truncate">YouTube Shorts Live</span>
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-300 truncate">Studio Video Library</span>
                          )}
                        </div>
                      </div>

                      {/* ── 3. PERFORMANCE & TELEMETRY STRIP (2 Balanced Cards) ── */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-[#181818] border border-[#242424]">
                          <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Completed Runs</div>
                          <div className="text-xs font-bold text-white mt-0.5 font-mono">{totalRunsCount} {totalRunsCount === 1 ? 'Video' : 'Videos'}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-[#181818] border border-[#242424] min-w-0" title={`1080p • ${job.aspectRatio || '9:16'} • ${job.length ? job.length.replace(' seconds', 's') : '30s'} • ${job.aiModel || 'Gemini 3.8'}`}>
                          <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Specs &amp; Engine</div>
                          <div className="text-xs font-bold text-zinc-200 mt-0.5 truncate font-mono">1080p • {job.aspectRatio || '9:16'} • job.aiModel?.includes('flash') ? 'Gemini Flash' : 'Gemini 3.8'</div>
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
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                              <span>Autonomous 6-Stage Pipeline Live</span>
                            </span>
                            <span className="font-mono text-[10px] text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              Stage {Math.min(6, getJobStageIndex(job) + 1)} of 6
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                            {[
                              { name: '1. Script', desc: job.aiModel || 'Gemini 2.5 Flash' },
                              { name: '2. Voice', desc: job.voice || 'Fenrir TTS' },
                              { name: '3. B-Roll', desc: '4K Pexels/Pixabay' },
                              { name: '4. Captions', desc: 'Acoustic Sync' },
                              { name: '5. Render', desc: '1080p MP4' },
                              { name: '6. Publish', desc: job.privacyStatus === 'scheduled' ? 'Schedule' : 'Shorts Live' },
                            ].map((step, idx) => {
                              const curStage = getJobStageIndex(job);
                              const isDone = curStage > idx;
                              const isCurrent = curStage === idx;

                              return (
                                <div
                                  key={step.name}
                                  className={`p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                                    isDone
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                      : isCurrent
                                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-1 ring-emerald-500/50 shadow-sm'
                                      : 'bg-[#15151C] border-[#22222C] text-zinc-500'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-bold text-white truncate">{step.name}</span>
                                    {isDone ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                                        <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-400" /> Done
                                      </span>
                                    ) : isCurrent ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/25 px-1.5 py-0.5 rounded shrink-0 animate-pulse">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-400" /> Working
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-zinc-500 font-mono shrink-0">Pending</span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-zinc-400 truncate">{step.desc}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── 5. EXECUTION & VIDEO HISTORY SECTION (PROMINENT & CLEAN) ── */}
                      <div className="rounded-xl bg-[#141414] border border-[#242424] overflow-hidden">
                        {/* History Header Bar */}
                        <div className="px-3 py-2 bg-[#181818] border-b border-[#242424] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs font-bold text-white">Execution History</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#1A1A1A] text-[#9CA3AF] font-mono font-semibold border border-[#2A2A2A]">
                              {historyList.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => loadHistory(job.id, true)}
                              disabled={isHistoryLoading}
                              className="p-1 rounded-md bg-[#1F1F28] hover:bg-[#282834] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#2A2A38]"
                              title="Refresh History"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${isHistoryLoading ? 'animate-spin text-blue-400' : ''}`} />
                            </button>

                            {historyList.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleClearHistory(job.id)}
                                className="text-[9px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer font-medium"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* History Content */}
                        <div className="p-2.5">
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
                                    className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                                      isSuccess
                                        ? isLiveShort
                                          ? 'bg-[#181818] border border-[#242424] hover:border-[#383838]'
                                          : 'bg-[#181818] border border-[#242424] hover:border-[#383838]'
                                        : 'bg-[#1B1216] border-rose-500/30 hover:border-rose-500/50'
                                    }`}
                                  >
                                    {/* Top Status & Timestamp */}
                                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        {isSuccess ? (
                                          isLiveShort ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-bold">
                                              <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                                              <span>YouTube Short</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1F1F28] text-zinc-300 border border-[#2B2B38] text-[9px] font-bold">
                                              <Video className="w-3 h-3 text-zinc-400 shrink-0" />
                                              <span>Studio Video</span>
                                            </span>
                                          )
                                        ) : entry.status === 'stopped' ? (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                                            <Square className="w-2.5 h-2.5 shrink-0" />
                                            <span>Stopped</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[9px] font-bold">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
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
                                        {entry.durationSeconds > 0 && ` • ${Math.round(entry.durationSeconds)}s`}
                                      </span>
                                    </div>

                                    {/* Video Title */}
                                    {entry.videoTitle && (
                                      <div className="text-[11px] font-bold text-white flex items-center gap-1">
                                        <span className="text-zinc-400 font-normal">Video:</span>
                                        <span className="text-zinc-100 italic truncate">"{entry.videoTitle}"</span>
                                      </div>
                                    )}

                                    {/* Message */}
                                    {entry.message && (
                                      <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2">
                                        {entry.message}
                                      </p>
                                    )}

                                    {/* Action Links Row */}
                                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 flex-wrap">
                                      {entry.youtubeUrl && (
                                        <a
                                          href={entry.youtubeUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[10px] font-semibold text-red-400 hover:text-white transition-colors"
                                        >
                                          <Youtube className="w-3 h-3 text-red-500" />
                                          <span>Watch Short</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-red-400" />
                                        </a>
                                      )}

                                      {entry.videoUrl && (
                                        <a
                                          href={entry.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1E1E1E] hover:bg-[#262626] border border-[#2A2A2A] text-[10px] font-semibold text-[#D4D4D8] hover:text-white transition-colors"
                                        >
                                          <Video className="w-3 h-3 text-zinc-400" />
                                          <span>Open MP4</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                                        </a>
                                      )}

                                      {(entry.youtubeUrl || entry.videoUrl) && (
                                        <button
                                          type="button"
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
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/30 text-[10px] font-semibold text-[#60A5FA] hover:text-white transition-colors cursor-pointer"
                                          title="Load this video project into Studio Timeline for manual edits"
                                        >
                                          <Sparkles className="w-2.5 h-2.5 text-[#60A5FA]" />
                                          <span>Edit in Timeline</span>
                                        </button>
                                      )}

                                      {(entry.youtubeUrl || entry.videoUrl) && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopyLink(entry.youtubeUrl || entry.videoUrl!, entry.id)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1E1E1E] hover:bg-[#262626] border border-[#2A2A2A] text-[10px] font-medium text-[#9CA3AF] hover:text-white transition-colors cursor-pointer ml-auto"
                                        >
                                          {copiedJobId === entry.id ? (
                                            <>
                                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                                              <span className="text-emerald-400 font-bold">Copied</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-2.5 h-2.5" />
                                              <span>Copy Link</span>
                                            </>
                                          )}
                                        </button>
                                      )}

                                      {entry.status === 'failed' && (
                                        <button
                                          type="button"
                                          onClick={() => handleRunNow(job.id, job.theme)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-[10px] font-bold text-rose-300 transition-colors cursor-pointer"
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
                              className="flex-1 h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 shadow-inner overflow-hidden select-none"
                              title="Autonomous pipeline currently executing"
                            >
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                              <span className="truncate">
                                {runningJobId === job.id
                                  ? (activePipelinePhase === 0
                                      ? 'Stage 1/6: Writing Script with Gemini...'
                                      : activePipelinePhase === 1
                                      ? 'Stage 2/6: Synthesizing Neural Voice...'
                                      : activePipelinePhase === 2
                                      ? 'Stage 3/6: Resolving 4K Stock B-Roll...'
                                      : activePipelinePhase === 3
                                      ? 'Stage 4/6: Aligning Word Captions...'
                                      : activePipelinePhase === 4
                                      ? 'Stage 5/6: Rendering 1080p MP4 Video...'
                                      : 'Stage 6/6: Uploading to YouTube Shorts...')
                                  : (job.lastRunMessage || 'Stage 1/6: Writing Script with Gemini...')}
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
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Niche / Theme
            </label>
            <CustomSelect
              options={THEME_OPTIONS}
              value={theme}
              onChange={(val) => setTheme(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
              menuClassName="!bg-[#181818] !border-[#242424]"
            />
          </div>

          {/* AI Model Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider flex items-center justify-between">
              <span>AI Engine / Model</span>
              <span className="text-[9px] text-blue-400 font-mono">Dynamic Selection</span>
            </label>
            <CustomSelect
              options={AI_MODEL_OPTIONS}
              value={aiModel}
              onChange={(val) => setAiModel(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
              menuClassName="!bg-[#181818] !border-[#242424]"
            />
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
                buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
                menuClassName="!bg-[#181818] !border-[#242424]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                Target Length
              </label>
              <CustomSelect
                options={LENGTH_OPTIONS}
                value={length}
                onChange={(val) => setLength(val)}
                className="w-full text-xs"
                buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
                menuClassName="!bg-[#181818] !border-[#242424]"
              />
            </div>
          </div>

          {/* Schedule Frequency (Segmented Pill Toggle) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Schedule Frequency
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#101013] rounded-none border-0 gap-1">
              <button
                type="button"
                onClick={() => setFrequencyType('interval')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  frequencyType === 'interval'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-white hover:bg-[#181818]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${frequencyType === 'interval' ? 'text-white' : 'text-slate-500'}`} />
                <span>Every X Hours / Mins</span>
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('daily')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  frequencyType === 'daily'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-white hover:bg-[#181818]'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${frequencyType === 'daily' ? 'text-white' : 'text-slate-500'}`} />
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
                    Interval (e.g. 3h, 8h)
                  </label>
                  <CustomSelect
                    options={INTERVAL_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                    value={intervalSelection}
                    onChange={(val) => setIntervalSelection(val)}
                    className="w-full text-xs"
                    buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
                    menuClassName="!bg-[#181818] !border-[#242424]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
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
                    buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
                    menuClassName="!bg-[#181818] !border-[#242424]"
                  />
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
                <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
                  Time (UTC)
                </label>
                <input
                  type="time"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                  required
                  className="w-full bg-[#151518] border border-[#242424] focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
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
                  buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
                  menuClassName="!bg-[#181818] !border-[#242424]"
                />
              </div>
            </div>
          )}

          {/* AI Voice Persona */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono-studio uppercase text-slate-400 font-semibold tracking-wider">
              Gemini Voice Persona
            </label>
            <CustomSelect
              options={VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.name }))}
              value={voice}
              onChange={(val) => setVoice(val)}
              className="w-full text-xs"
              buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
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
              buttonClassName="!bg-[#151518] !border-[#242424] !py-2 !rounded-lg text-xs"
              menuClassName="!bg-[#181818] !border-[#242424]"
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
              className="px-3.5 py-2 rounded-lg bg-white/[0.06] text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
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
          <div className="p-4 rounded-xl bg-[#181818] border border-[#242424] shadow-md flex flex-col gap-3">
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
                <div className="p-3 rounded-lg bg-[#141414] border border-[#24242A] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">
                    {authStatus.channel?.name?.charAt(0) || 'Y'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{authStatus.channel?.name || 'Connected Channel'}</p>
                    <p className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
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
                    className="px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-[#222222] text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer border border-[#2E2E2E] flex items-center gap-1"
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

