import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Play,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Volume2,
  Video,
  Send,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  History,
  Globe,
  Search,
  Square,
} from 'lucide-react';
import { Card } from '@/src/shared/ui/common';
import { AutomationJob, AutomationHistoryEntry } from '../types';
import { youtubeApi } from '../api/youtubeApi';

export interface YouTubeSchedulesPageProps {
  automations: AutomationJob[];
  loading?: boolean;
  onToggleAuto: (id: string) => void;
  onRefresh?: () => void;
  onNavigate?: (page: string) => void;
}

const THEME_OPTIONS = [
  'Stoic Mindset & Discipline',
  'Fitness & Iron Will',
  'Deep Focus & Flow',
  'Calm & Resilience',
  'Unstoppable Motivation',
];

const AI_MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Adaptive & High Quality Ã¢â‚¬Â¢ Recommended)' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Next-Gen Speed & Storyboarding)' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (Rapid & Lightweight)' },
  { value: 'gemini-flash-latest', label: 'Gemini Flash Latest (Cutting-Edge)' },
];

const ASPECT_RATIO_OPTIONS = [
  { value: '9:16', label: '9:16 (Vertical Ã¢â‚¬Â¢ Shorts / Reels)' },
  { value: '16:9', label: '16:9 (Landscape Ã¢â‚¬Â¢ YouTube Video)' },
  { value: '1:1', label: '1:1 (Square Ã¢â‚¬Â¢ Instagram / Feed)' },
];

const LENGTH_OPTIONS = [
  { value: '15 seconds', label: '15 Seconds (Fast Cut)' },
  { value: '30 seconds', label: '30 Seconds (Standard Ã¢â‚¬Â¢ Recommended)' },
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

export const YouTubeSchedulesPage: React.FC<YouTubeSchedulesPageProps> = ({
  automations,
  loading = false,
  onToggleAuto,
  onRefresh,
  onNavigate,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [activePipelinePhase, setActivePipelinePhase] = useState<number>(0);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const [runSuccessNotice, setRunSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search and status filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [historyByJob, setHistoryByJob] = useState<Record<string, AutomationHistoryEntry[]>>({});
  const [loadingHistoryByJob, setLoadingHistoryByJob] = useState<Record<string, boolean>>({});
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadHistory = async (jobId: string, force = false) => {
    if (!force && historyByJob[jobId]) return;
    setLoadingHistoryByJob((prev) => ({ ...prev, [jobId]: true }));
    try {
      const entries = await youtubeApi.getAutomationHistory(jobId);
      setHistoryByJob((prev) => ({ ...prev, [jobId]: entries }));
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoadingHistoryByJob((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleClearHistory = async (jobId: string) => {
    try {
      await youtubeApi.clearAutomationHistory(jobId);
      setHistoryByJob((prev) => ({ ...prev, [jobId]: [] }));
    } catch (err: any) {
      alert(err.message || 'Failed to clear history');
    }
  };

  React.useEffect(() => {
    if (Array.isArray(automations)) {
      automations.forEach((job) => {
        loadHistory(job.id, true);
      });
    }
  }, [automations]);

  // Form state
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

  const activeCount = automations.filter((a) => a.active).length;

  const handleCopyLink = (url: string, jobId: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedJobId(jobId);
    setTimeout(() => setCopiedJobId(null), 2500);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

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
      setShowCreateModal(false);
      onRefresh?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create automation schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this automated publishing schedule?')) {
      return;
    }
    try {
      await youtubeApi.deleteAutomation(id);
      onRefresh?.();
    } catch (err: any) {
      alert(`Could not delete schedule: ${err.message}`);
    }
  };

  const getAutoStageIndex = (job: AutomationJob): number => {
    if (runningJobId === job.id) return activePipelinePhase;
    if (!job.lastRunMessage) return 0;
    const m = job.lastRunMessage.match(/Stage (\d)\/6/i);
    return m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
  };

  const runningTimersRef = React.useRef<any[]>([]);

  const handleStopPipeline = async (id: string) => {
    runningTimersRef.current.forEach(clearTimeout);
    runningTimersRef.current = [];
    setRunningJobId(null);
    setActivePipelinePhase(0);
    try {
      await youtubeApi.stopAutomation(id);
      setRunSuccessNotice('Pipeline execution stopped');
    } catch {
      setErrorMessage('Failed to stop pipeline');
    }
    onRefresh?.();
  };

  const handleRunPipelineNow = async (id: string, jobTheme: string) => {
    setRunningJobId(id);
    setActivePipelinePhase(0);
    setRunSuccessNotice(null);
    setErrorMessage(null);

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
      const res = await youtubeApi.runAutomationNow(id);
      setActivePipelinePhase(6);
      const videoTitle = res.data?.title || jobTheme;
      const isLive = Boolean(res.data?.isLive || res.data?.youtubeStatus === 'uploaded');
      if (isLive) {
        setRunSuccessNotice(`Pipeline executed! '${videoTitle}' published live to YouTube Shorts.`);
      } else {
        setRunSuccessNotice(`Pipeline executed! '${videoTitle}' rendered and cataloged in Studio Library.`);
      }
      onRefresh?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Pipeline execution failed');
      onRefresh?.();
    } finally {
      timers.forEach(clearTimeout);
      setRunningJobId(null);
      setActivePipelinePhase(0);
    }
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
      return { icon: 'Ã°Å¸ï¿½â€ºÃ¯Â¸ï¿½', gradient: 'bg-amber-500/15 border-amber-500/30 text-amber-300', dot: 'bg-amber-400', badgeText: 'Stoic Philosophy' };
    }
    if (lower.includes('fitness') || lower.includes('iron')) {
      return { icon: 'Ã°Å¸â€�Â¥', gradient: 'bg-orange-500/15 border-orange-500/30 text-orange-300', dot: 'bg-orange-400', badgeText: 'Fitness & Will' };
    }
    if (lower.includes('calm') || lower.includes('resilience')) {
      return { icon: 'Ã°Å¸Å’Å ', gradient: 'bg-teal-500/15 border-teal-500/30 text-teal-300', dot: 'bg-teal-400', badgeText: 'Inner Calm' };
    }
    if (lower.includes('focus') || lower.includes('flow')) {
      return { icon: 'Ã°Å¸Â§Â ', gradient: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300', dot: 'bg-indigo-400', badgeText: 'Deep Focus' };
    }
    return { icon: 'Ã¢Å¡Â¡', gradient: 'bg-[#181818] border-[#242424] text-zinc-300', dot: 'bg-white', badgeText: 'Motivation' };
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
      const match = clean.match(/every_(\\d+)([hm])/);
      if (match) {
        const num = match[1];
        const unit = match[2] === 'h' ? (num === '1' ? 'Hour' : 'Hours') : (num === '1' ? 'Minute' : 'Minutes');
        return `Every ${num} ${unit}`;
      }
    }
    if (clean.match(/^\\d{1,2}:\\d{2}$/)) {
      return `Daily at ${clean} UTC`;
    }
    return clean.replace(/UTC/gi, '').trim();
  };

  const formatNextRun = (isoString?: string) => {
    if (!isoString) return 'Pending schedule';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredAutomations = automations.filter((auto) => {
    const matchesSearch =
      !searchQuery.trim() ||
      auto.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auto.voice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (auto.schedule && auto.schedule.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return auto.active;
    if (statusFilter === 'paused') return !auto.active;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ Top Bar: Search, Status Filtering, and Quick Actions Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedules by theme, voice, or prompt..."
            className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#6B7280] outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-[#2F2F2F]">
            {(['all', 'active', 'paused'] as const).map((filter) => {
              const count =
                filter === 'all'
                  ? automations.length
                  : filter === 'active'
                  ? activeCount
                  : automations.length - activeCount;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === filter ? 'bg-[#2563EB] border border-[#60A5FA]/40 text-white shadow-xs' : 'text-[#9CA3AF] hover:text-white hover:bg-[#26262C] hover:border-white/10 border border-transparent'
                  }`}
                >
                  <span>{filter}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onRefresh?.()}
            className="p-2 rounded-xl bg-[#121212] hover:bg-[#1A1A1A] border border-[#2F2F2F] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            title="Refresh automations list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Daily Schedule</span>
          </button>
        </div>
      </div>

      {/* Top Notification / Banner */}
      {runSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{runSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRunSuccessNotice(null)}
            className="text-emerald-400/70 hover:text-emerald-400 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400/70 hover:text-rose-400 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <Card className="bg-[#141414] border-[#262626] p-5 sm:p-6 rounded-2xl shadow-2xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#242424] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Autonomous Daily YouTube Publishing
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeCount} Active
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Automatically generates script, synthesizes voiceover, renders vertical MP4, and publishes to YouTube.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Daily Schedule</span>
          </button>
        </div>

        {/* Schedules Grid / List */}
        {filteredAutomations.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-[#181818] border border-[#242424]">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">
              {searchQuery || statusFilter !== 'all' ? 'No Schedules Matching Filters' : 'No Active Automation Schedules'}
            </h4>
            <p className="text-xs text-[#8E8E93] max-w-md mx-auto mt-1 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filter selection to find existing schedules.'
                : 'Create your first daily automated publishing schedule to have ApexMind auto-generate and upload viral motivational Shorts to your YouTube channel every day.'}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#222226] hover:bg-[#2C2C32] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Schedule</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredAutomations.map((auto) => {
              const isRunning = runningJobId === auto.id || auto.lastStatus === 'running';
              const isPaused = !auto.active && !isRunning;
              const isActive = auto.active && !isRunning;
              const themeMeta = getThemeMeta(auto.theme);
              const scheduleLabel = formatScheduleLabel(auto.publishTime || auto.schedule);
              const nextRunInfo = formatNextRunInfo(auto.nextRun);
              const rawHistory = historyByJob[auto.id] || [];
              const fallbackHistory: AutomationHistoryEntry[] = auto.lastRun ? [{
                id: `fallback-${auto.id}`,
                jobId: auto.id,
                status: (auto.lastStatus === 'failed' ? 'failed' : 'success') as 'success' | 'failed',
                videoTitle: auto.lastVideoTitle || auto.theme,
                videoUrl: auto.lastVideoUrl,
                youtubeUrl: auto.lastIsLive ? auto.lastVideoUrl : undefined,
                isLive: Boolean(auto.lastIsLive),
                durationSeconds: 15,
                message: auto.lastRunMessage || (auto.lastIsLive ? 'Published live to YouTube Shorts' : 'Saved to Studio Library (Connect YouTube channel to publish live)'),
                executedAt: auto.lastRun,
              }] : [];
              const historyList = rawHistory.length > 0 ? rawHistory : fallbackHistory;
              const isHistoryLoading = loadingHistoryByJob[auto.id] && rawHistory.length === 0 && !auto.lastRun;
              const totalRunsCount = historyList.length;
              const isConfirmingDelete = confirmDeleteJobId === auto.id;

              return (
                <div
                  key={auto.id}
                  className={`p-4 sm:p-5 rounded-2xl transition-all flex flex-col gap-4 shadow-xl border ${
                    isRunning
                      ? 'bg-gradient-to-b from-[#181820] via-[#141419] to-[#121216] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : isPaused
                      ? 'bg-gradient-to-b from-[#17171C] via-[#141418] to-[#121215] border-zinc-800/90 opacity-95'
                      : 'bg-gradient-to-b from-[#191920] via-[#15151B] to-[#131317] border-[#2A2A38] hover:border-[#38384A]'
                  }`}
                >
                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 1. HEADER ROW: ICON + TITLE + BADGES + STATUS + STOP/RESUME CONTROL Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#252532]">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border text-xl ${themeMeta.gradient} shadow-md`}>
                        <span>{themeMeta.icon}</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white tracking-tight truncate">{auto.theme}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${themeMeta.gradient}`}>
                            {themeMeta.badgeText}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#20202A] text-zinc-300 border border-[#2D2D3C] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-blue-400" />
                            <span>{scheduleLabel}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#20202A] text-zinc-300 border border-[#2D2D3C] flex items-center gap-1">
                            <Volume2 className="w-2.5 h-2.5 text-purple-400" />
                            <span>{auto.voice || 'Fenrir'}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#20202A] text-zinc-400 border border-[#2D2D3C]">
                            {auto.privacyStatus === 'scheduled' ? 'Ã°Å¸â€œâ€¦ Scheduled' : 'Ã°Å¸Å’ï¿½ Public'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top-Right: Status Badge and Stop/Resume Action */}
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                      {isRunning ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          <span>Live Generation Active</span>
                        </span>
                      ) : isActive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Active (24/7 Schedule)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                          <Play className="w-3 h-3 fill-current text-amber-400" />
                          <span>Stopped / Paused</span>
                        </span>
                      )}

                      {/* Explicit Stop / Resume Button */}
                      {!isRunning && (
                        <button
                          type="button"
                          onClick={() => onToggleAuto(auto.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                            isActive
                              ? 'bg-[#22222C] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border-[#323242] hover:border-amber-500/40'
                              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                          }`}
                          title={isActive ? "Stop automated recurring pipeline" : "Resume automated recurring pipeline"}
                        >
                          {isActive ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Stop Automatic</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                              <span>Resume Automatic</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 2. NEXT START SCHEDULE & TIMING BANNER Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#121217] border border-[#23232E] text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-zinc-400 font-medium">Next Start Time:</span>
                      <strong className="text-white font-mono">{nextRunInfo.display}</strong>
                      {isActive && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          nextRunInfo.isPast
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                            : 'bg-[#2563EB] text-white border border-[#60A5FA]/40 font-mono shadow-xs'
                        }`}>
                          Ã¢ï¿½Â³ {nextRunInfo.relative}
                        </span>
                      )}
                      {isPaused && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Schedule Suspended
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400 text-xs ml-auto shrink-0">
                      <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Release:</span>
                      <span className="font-semibold text-zinc-200 capitalize">
                        {auto.privacyStatus === 'scheduled' ? 'Scheduled (publishAt)' : 'Public Shorts'}
                      </span>
                    </div>
                  </div>

                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 3. PERFORMANCE & TELEMETRY METRICS STRIP Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-[#14141A] border border-[#242430]">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Total Recorded Runs</div>
                      <div className="text-xs font-bold text-white mt-0.5 font-mono">{totalRunsCount} videos</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#14141A] border border-[#242430]">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Render Specs</div>
                      <div className="text-xs font-bold text-zinc-200 mt-0.5 truncate">{auto.aspectRatio || '9:16'} Ã¢â‚¬Â¢ {auto.length ? auto.length.replace(' seconds', 's') : '30s'} Ã¢â‚¬Â¢ 1080p</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#14141A] border border-[#242430]">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Pipeline Engine</div>
                      <div className="text-xs font-bold text-zinc-300 mt-0.5 truncate">{auto.aiModel || 'Gemini 2.5 Flash'}</div>
                    </div>
                  </div>

                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 3B. RECENT ERROR BANNER (When last execution failed) Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  {auto.lastStatus === 'failed' && !isRunning && (
                    <div className="p-3 rounded-xl bg-rose-950/35 border border-rose-500/40 text-xs flex flex-col gap-1.5 shadow-sm animate-fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>Pipeline Execution Failed</span>
                        </span>
                        {auto.lastRun && (
                          <span className="text-[10px] font-mono text-rose-300/70">
                            {new Date(auto.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-snug font-mono break-words">
                        {auto.lastRunMessage || 'Pipeline execution failed. Please verify API credentials and retry.'}
                      </p>
                    </div>
                  )}

                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 4. DYNAMIC LIVE 6-STAGE PIPELINE STEPPER (when executing) Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  {isRunning && (
                    <div className="p-3.5 rounded-xl bg-[#111116] border border-[#252532] flex flex-col gap-2.5 animate-fade-in shadow-inner">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-200 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>Autonomous 6-Stage Pipeline Live</span>
                        </span>
                        <span className="font-mono text-xs text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          Stage {Math.min(6, getAutoStageIndex(auto) + 1)} of 6
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                        {[
                          { name: '1. Script', desc: auto.aiModel || 'Gemini 2.5 Flash' },
                          { name: '2. Voice', desc: auto.voice || 'Fenrir TTS' },
                          { name: '3. B-Roll', desc: '4K Pexels/Pixabay' },
                          { name: '4. Captions', desc: 'Acoustic Sync' },
                          { name: '5. Render', desc: '1080p MP4' },
                          { name: '6. Publish', desc: auto.privacyStatus === 'scheduled' ? 'Scheduled' : 'Shorts Live' },
                        ].map((step, idx) => {
                          const curStage = getAutoStageIndex(auto);
                          const isDone = curStage > idx;
                          const isCurrent = curStage === idx;

                          return (
                            <div
                              key={step.name}
                              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                                isDone
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  : isCurrent
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-1 ring-emerald-500/50 shadow-sm'
                                  : 'bg-[#15151C] border-[#22222C] text-zinc-500'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-white truncate">{step.name}</span>
                                {isDone ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                                    <Check className="w-3 h-3 stroke-[3] text-emerald-400" /> Done
                                  </span>
                                ) : isCurrent ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/25 px-2 py-0.5 rounded shrink-0 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> Working
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">Pending</span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate">{step.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 5. EXECUTION & VIDEO HISTORY SECTION (PROMINENT & DETAILED) Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  <div className="rounded-xl bg-[#121217] border border-[#23232E] overflow-hidden">
                    {/* History Header Bar */}
                    <div className="p-3 bg-[#16161D] border-b border-[#23232E] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">Execution &amp; Video History</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22222C] text-zinc-300 font-mono font-semibold border border-[#2F2F3D]">
                          {historyList.length} {historyList.length === 1 ? 'Run' : 'Runs'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadHistory(auto.id, true)}
                          disabled={isHistoryLoading}
                          className="p-1 rounded-md bg-[#22222C] hover:bg-[#2C2C38] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-[#2F2F3D]"
                          title="Refresh History"
                        >
                          <RefreshCw className={`w-3 h-3 ${isHistoryLoading ? 'animate-spin text-blue-400' : ''}`} />
                        </button>

                        {historyList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearHistory(auto.id)}
                            className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer font-medium"
                          >
                            Clear History
                          </button>
                        )}
                      </div>
                    </div>

                    {/* History Content */}
                    <div className="p-3">
                      {isHistoryLoading && historyList.length === 0 ? (
                        <div className="py-5 flex items-center justify-center gap-2 text-xs text-zinc-400">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Loading execution records...</span>
                        </div>
                      ) : historyList.length === 0 ? (
                        <div className="py-4 text-center flex flex-col items-center gap-1.5 text-xs text-zinc-400">
                          <Clock className="w-5 h-5 text-zinc-600 mb-0.5" />
                          <p className="font-semibold text-zinc-300">No automated executions recorded yet</p>
                          <p className="text-[11px] text-zinc-500 max-w-sm">
                            The next video will be generated automatically at <strong className="text-zinc-400">{nextRunInfo.display}</strong>, or trigger the pipeline immediately below.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                          {historyList.map((entry) => {
                            const isLiveShort = entry.isLive || Boolean(entry.youtubeUrl);
                            const isSuccess = entry.status === 'success';

                            return (
                              <div
                                key={entry.id}
                                className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                                  isSuccess
                                    ? isLiveShort
                                      ? 'bg-[#151B18] border-emerald-500/30 hover:border-emerald-500/50'
                                      : 'bg-[#181818] border-[#242424] hover:bg-[#26262C] hover:border-white/10'
                                    : 'bg-[#1D1418] border-rose-500/30 hover:border-rose-500/50'
                                }`}
                              >
                                {/* Top Status & Timestamp */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    {isSuccess ? (
                                      isLiveShort ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold">
                                          <Play className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                          <span>Published YouTube Short</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1F1F28] text-zinc-300 border border-[#2B2B38] text-[10px] font-bold">
                                          <Video className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                          <span>Studio Video Catalog</span>
                                        </span>
                                      )
                                    ) : entry.status === 'stopped' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                        <Square className="w-3 h-3 shrink-0" />
                                        <span>Stopped by User</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>Run Failed</span>
                                      </span>
                                    )}
                                  </div>

                                  <span className="text-[10px] font-mono text-zinc-400">
                                    {new Date(entry.executedAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {entry.durationSeconds > 0 && ` Ã¢â‚¬Â¢ ${Math.round(entry.durationSeconds)}s`}
                                  </span>
                                </div>

                                {/* Video Title */}
                                {entry.videoTitle && (
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span className="text-zinc-400 font-normal">Video:</span>
                                    <span className="text-zinc-100">"{entry.videoTitle}"</span>
                                  </div>
                                )}

                                {/* Message */}
                                {entry.message && (
                                  <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                                    {entry.message}
                                  </p>
                                )}

                                {/* Action Links Row (YouTube Video link & Studio MP4 Video link) */}
                                <div className="flex items-center gap-2 pt-1 border-t border-white/5 flex-wrap">
                                  {entry.youtubeUrl && (
                                    <a
                                      href={entry.youtubeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-[11px] font-bold text-red-300 hover:text-white transition-colors"
                                    >
                                      <Play className="w-3.5 h-3.5 text-red-500" />
                                      <span>Watch on YouTube Shorts</span>
                                      <ExternalLink className="w-3 h-3 text-red-400" />
                                    </a>
                                  )}

                                  {entry.videoUrl && (
                                    <a
                                      href={entry.videoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1C1C24] hover:bg-[#252530] border border-[#2D2D3A] text-[11px] font-bold text-zinc-200 hover:text-white transition-colors"
                                    >
                                      <Video className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>Open Studio MP4</span>
                                      <ExternalLink className="w-3 h-3 text-zinc-400" />
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
                                        if (onNavigate) {
                                          onNavigate('workspace-editor');
                                        }
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22222E] hover:bg-[#2C2C3A] text-[10px] font-bold text-amber-300 hover:text-white transition-colors cursor-pointer border border-[#323242]"
                                      title="Load this video project into Studio Timeline for manual edits"
                                    >
                                      <Sparkles className="w-3 h-3 text-amber-400" />
                                      <span>Edit in Timeline</span>
                                    </button>
                                  )}

                                  {(entry.youtubeUrl || entry.videoUrl) && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyLink(entry.youtubeUrl || entry.videoUrl!, entry.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#20202A] hover:bg-[#2C2C3A] text-[10px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer ml-auto border border-[#2E2E3E]"
                                    >
                                      {copiedJobId === entry.id ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400 font-bold">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy Link</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {entry.status === 'failed' && (
                                    <button
                                      type="button"
                                      onClick={() => handleRunPipelineNow(auto.id, auto.theme)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-[11px] font-bold text-rose-300 transition-colors cursor-pointer"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      <span>Retry Pipeline</span>
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

                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 6. SAFE DELETE CONFIRMATION ALERT (when delete clicked) Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  {isConfirmingDelete && (
                    <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs flex flex-col gap-2.5 animate-fade-in shadow-xl ring-1 ring-rose-500/40">
                      <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Delete this automation schedule?</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        This will permanently stop recurring publishing for <strong className="text-white">"{auto.theme}"</strong> and purge all recorded execution history. This action cannot be undone.
                      </p>
                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteJobId(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#22222A] hover:bg-[#2C2C36] text-zinc-300 text-xs font-semibold border border-[#323240] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await youtubeApi.deleteAutomation(auto.id);
                              setConfirmDeleteJobId(null);
                              onRefresh?.();
                            } catch (err: any) {
                              alert(err.message || 'Could not delete automation');
                            }
                          }}
                          className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirm Delete</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ã¢â€�â‚¬Ã¢â€�â‚¬ 7. BOTTOM ACTION TOOLBAR Ã¢â€�â‚¬Ã¢â€�â‚¬ */}
                  <div className="flex items-center justify-between gap-2.5 pt-1">
                    {isRunning ? (
                      <>
                        {/* Running Status Indicator */}
                        <div
                          className="flex-1 h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 shadow-inner overflow-hidden select-none"
                          title="Autonomous pipeline currently executing"
                        >
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                          <span className="truncate">
                            {runningJobId === auto.id
                              ? (activePipelinePhase === 0
                                  ? 'Stage 1/6: Generating Script with Gemini...'
                                  : activePipelinePhase === 1
                                  ? 'Stage 2/6: Synthesizing Neural Voiceover...'
                                  : activePipelinePhase === 2
                                  ? 'Stage 3/6: Resolving 4K Stock B-Roll...'
                                  : activePipelinePhase === 3
                                  ? 'Stage 4/6: Aligning Word Syllable Captions...'
                                  : activePipelinePhase === 4
                                  ? 'Stage 5/6: Rendering 1080x1920 MP4 Video...'
                                  : 'Stage 6/6: Publishing to YouTube Shorts...')
                              : (auto.lastRunMessage || 'Stage 1/6: Generating Script with Gemini...')}
                          </span>
                        </div>

                        {/* Stop Active Pipeline Execution */}
                        <button
                          type="button"
                          onClick={() => handleStopPipeline(auto.id)}
                          className="h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm shrink-0 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border-rose-500/50 hover:border-rose-400 active:scale-95"
                          title="Stop pipeline execution"
                        >
                          <Square className="w-3.5 h-3.5 fill-current text-rose-400 shrink-0" />
                          <span>Stop</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Run Now Primary Button */}
                        <button
                          type="button"
                          onClick={() => handleRunPipelineNow(auto.id, auto.theme)}
                          className={`flex-1 h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] ${
                            isPaused
                              ? 'bg-[#1F1F27] hover:bg-[#282834] text-zinc-200 hover:text-white border border-[#2E2E3E] hover:border-zinc-500'
                              : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                          }`}
                          title={
                            isPaused
                              ? 'Trigger manual pipeline execution for paused schedule'
                              : 'Trigger full generation and publish now'
                          }
                        >
                          <Play className="w-4 h-4 fill-current text-white" />
                          <span>{isPaused ? 'Run Pipeline (Manual)' : 'Run Pipeline Now'}</span>
                        </button>

                        {/* Pause / Resume Button in bottom bar */}
                        <button
                          type="button"
                          onClick={() => onToggleAuto(auto.id)}
                          className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                            isActive
                              ? 'bg-[#1F1F27] hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border-[#2E2E3E] hover:border-amber-500/40'
                              : 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border-emerald-500/40'
                          }`}
                          title={isActive ? "Pause automated recurring generation" : "Resume automated recurring generation"}
                        >
                          {isActive ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                              <span>Resume</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* Delete Schedule Button */}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteJobId(isConfirmingDelete ? null : auto.id)}
                      className={`h-10 px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                        isConfirmingDelete
                          ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                          : 'bg-[#1F1F27] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border-[#2E2E3E] hover:border-rose-800/40'
                      }`}
                      title="Delete automation schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Production Automation Policy Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#60A5FA] border border-blue-500/20 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Zero-Intervention Cron Execution</h4>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Background workers trigger at your specified UTC time every day without requiring browser sessions.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Gemini 3.8 Creative Script Engine</h4>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Every video generates viral hooks, authentic storytelling, and high-retention vertical pacing.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Native YouTube Scheduling</h4>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Using YouTube Data API's <code className="text-white text-[11px]">publishAt</code>, videos upload privately and YouTube flips them to Public at peak hours.
            </p>
          </div>
        </div>
      </div>

      {/* Create Daily Automation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-[#242424] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Daily Publishing Schedule</h3>
                  <p className="text-xs text-[#8E8E93]">Set theme, daily time, AI voice, and YouTube release strategy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-[#202020] hover:bg-[#282828] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSchedule} className="p-5 overflow-y-auto space-y-4">
              {/* Theme / Category */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Motivational Theme / Niche
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  {THEME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Script Engine / Model */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5 flex items-center justify-between">
                  <span>AI Script Engine / Model</span>
                  <span className="text-[10px] text-blue-400 font-mono">Dynamic Selection</span>
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer font-medium"
                >
                  {AI_MODEL_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio & Video Length */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer font-medium"
                  >
                    {ASPECT_RATIO_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">
                    Target Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer font-medium"
                  >
                    {LENGTH_OPTIONS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Frequency Mode Tabs (Studio Panel Tab Style) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white">
                  Schedule Frequency
                </label>
                <div className="flex items-center gap-5 border-b border-[#26262B] pt-0.5">
                  <button
                    type="button"
                    onClick={() => setFrequencyType('interval')}
                    className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 shrink-0 ${
                      frequencyType === 'interval'
                        ? 'text-white border-blue-500 font-bold'
                        : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${frequencyType === 'interval' ? 'text-blue-400' : 'text-[#71717A]'}`} />
                    <span>Every X Hours / Mins</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequencyType('daily')}
                    className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 shrink-0 ${
                      frequencyType === 'daily'
                        ? 'text-white border-blue-500 font-bold'
                        : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 ${frequencyType === 'daily' ? 'text-blue-400' : 'text-[#71717A]'}`} />
                    <span>Daily at Time</span>
                  </button>
                </div>
              </div>

              {/* Interval Selection OR Daily Publish Time */}
              {frequencyType === 'interval' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">
                        Interval (e.g. 3h, 8h)
                      </label>
                      <select
                        value={intervalSelection}
                        onChange={(e) => setIntervalSelection(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        {INTERVAL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">
                        YouTube Privacy & Release
                      </label>
                      <select
                        value={privacyStatus}
                        onChange={(e) => setPrivacyStatus(e.target.value as any)}
                        className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="public">Instant Public (Uploaded Live)</option>
                        <option value="scheduled">Scheduled (YouTube publishAt)</option>
                      </select>
                    </div>
                  </div>

                  {intervalSelection === 'custom' && (
                    <div className="p-3 rounded-xl bg-[#141414] border border-blue-500/30 flex items-center gap-2">
                      <span className="text-xs text-zinc-300 font-medium shrink-0">Run every:</span>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={customValue}
                        onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-20 bg-[#1c1c1c] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-bold"
                      />
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value as any)}
                        className="flex-1 bg-[#1c1c1c] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer"
                      >
                        <option value="hours">Hours (e.g. 3 hr, 8 hr)</option>
                        <option value="minutes">Minutes (e.g. 30 min)</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      Daily Publish Time (UTC)
                    </label>
                    <input
                      type="time"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      required
                      className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <span className="text-[10px] text-[#7A7A7A] mt-1 block">
                      Runs every 24 hours at this exact time.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">
                      YouTube Privacy & Release
                    </label>
                    <select
                      value={privacyStatus}
                      onChange={(e) => setPrivacyStatus(e.target.value as any)}
                      className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="public">Instant Public (Uploaded Live)</option>
                      <option value="scheduled">Scheduled (YouTube publishAt)</option>
                    </select>
                    <span className="text-[10px] text-[#7A7A7A] mt-1 block">
                      {privacyStatus === 'scheduled'
                        ? 'Uploads private; YouTube auto-releases at peak hours.'
                        : 'Publishes immediately upon generation.'}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Voice Selection */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gemini AI Voice Profile
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Music Selection */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Soundtrack Preset
                </label>
                <select
                  value={musicTrack}
                  onChange={(e) => setMusicTrack(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2e2e2e] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  {MUSIC_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-[#242424] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202020] hover:bg-[#282828] text-xs font-semibold text-[#A0A0A0] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Activate Daily Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeSchedulesPage;
