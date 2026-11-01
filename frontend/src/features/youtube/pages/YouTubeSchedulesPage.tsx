import React, { useState } from 'react';
import {
  Zap,
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
  ShieldCheck,
  Send,
  Loader2,
  ArrowRight,
  Radio,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Card, Badge } from '@/src/shared/ui/common';
import { AutomationJob } from '../types';
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

  // Form state
  const [theme, setTheme] = useState('Stoic Mindset & Discipline');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'interval'>('interval');
  const [publishTime, setPublishTime] = useState('08:00');
  const [intervalSelection, setIntervalSelection] = useState('every_3h');
  const [customValue, setCustomValue] = useState(3);
  const [customUnit, setCustomUnit] = useState<'hours' | 'minutes'>('hours');
  const [voice, setVoice] = useState('Fenrir');
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

  const handleRunPipelineNow = async (id: string, jobTheme: string) => {
    setRunningJobId(id);
    setActivePipelinePhase(0);
    setRunSuccessNotice(null);
    setErrorMessage(null);

    const phaseTimer1 = setTimeout(() => setActivePipelinePhase(1), 3200);
    const phaseTimer2 = setTimeout(() => setActivePipelinePhase(2), 7000);
    const phaseTimer3 = setTimeout(() => setActivePipelinePhase(3), 12000);

    try {
      const res = await youtubeApi.runAutomationNow(id);
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
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      setRunningJobId(null);
      setActivePipelinePhase(0);
    }
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
      {/* ── Top Bar: Search, Status Filtering, and Quick Actions ── */}
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
                    statusFilter === filter
                      ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA]'
                      : 'text-[#9CA3AF] hover:text-white border border-transparent'
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
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
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
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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

              return (
                <div
                  key={auto.id}
                  className="p-4 sm:p-5 rounded-xl bg-[#181818] border border-[#262626] hover:border-[#3B82F6]/40 transition-all flex flex-col gap-3.5"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Zap className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-white text-sm">{auto.theme}</h4>
                        <Badge variant={auto.active ? 'green' : 'gray'}>
                          {auto.active ? 'Active' : 'Paused'}
                        </Badge>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] border border-[#2e2e2e]">
                          {auto.privacyStatus === 'scheduled' ? 'Scheduled (publishAt)' : 'Instant Public'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8E8E93]">
                        <span>
                          Schedule: <strong className="text-white">{auto.schedule || auto.publishTime}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Voice: <span className="text-blue-400 font-medium">{auto.voice}</span>
                        </span>
                        <span>•</span>
                        <span>Music: {auto.musicTrack}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#7A7A7A]">
                        <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
                        <span>Next execution: <strong className="text-[#A0A0A0]">{formatNextRun(auto.nextRun)}</strong></span>
                        {auto.lastRun && (
                          <>
                            <span>•</span>
                            <span>Last run: {new Date(auto.lastRun).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center shrink-0">
                      {/* Run Now Button */}
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() => handleRunPipelineNow(auto.id, auto.theme)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isRunning
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-not-allowed'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                        }`}
                        title="Run the automated script generation, video rendering, and YouTube upload now"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Pipeline Executing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Run Now</span>
                          </>
                        )}
                      </button>

                      {/* Toggle Active Switch */}
                      <button
                        type="button"
                        onClick={() => onToggleAuto(auto.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          auto.active
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-gray-800 border-gray-700 text-[#9CA3AF] hover:text-white'
                        }`}
                      >
                        {auto.active ? 'Active' : 'Paused'}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(auto.id)}
                        className="p-2 rounded-xl bg-[#202020] hover:bg-rose-500/15 text-[#8E8E93] hover:text-rose-400 border border-[#2e2e2e] hover:border-rose-500/30 transition-colors cursor-pointer"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── Dynamic Live Pipeline Stepper ── */}
                  {isRunning && (
                    <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 flex flex-col gap-2.5 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          <span>Autonomous Pipeline In Progress</span>
                        </span>
                        <span className="font-mono text-zinc-400 text-[11px]">Phase {activePipelinePhase + 1} / 4</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { name: '1. Script Generation', desc: 'Gemini 3.8 Deduplication' },
                          { name: '2. Voice Synthesis', desc: `${auto.voice} Persona TTS` },
                          { name: '3. Video Render', desc: '1080x1920 MP4 at 60 FPS' },
                          { name: '4. Cloud Publishing', desc: auto.privacyStatus === 'scheduled' ? 'YouTube Scheduled' : 'YouTube Shorts Live' },
                        ].map((step, idx) => {
                          const isDone = activePipelinePhase > idx;
                          const isCurrent = activePipelinePhase === idx;

                          return (
                            <div
                              key={step.name}
                              className={`p-2 rounded-lg border text-left transition-all ${
                                isDone
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : isCurrent
                                  ? 'bg-blue-600/25 border-blue-500 text-blue-300 ring-1 ring-blue-500/50 shadow-sm'
                                  : 'bg-[#141414] border-[#262626] text-zinc-500'
                              }`}
                            >
                              <div className="text-xs font-bold truncate flex items-center gap-1">
                                {isDone && <Check className="w-3 h-3 shrink-0 text-emerald-400" />}
                                {isCurrent && <Loader2 className="w-3 h-3 shrink-0 animate-spin text-blue-400" />}
                                <span>{step.name}</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{step.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Latest Execution Outcome Block ── */}
                  {!isRunning && auto.lastStatus && auto.lastStatus !== 'idle' && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex flex-col gap-2 transition-all ${
                        auto.lastStatus === 'success'
                          ? auto.lastIsLive
                            ? 'bg-emerald-950/15 border-emerald-500/30'
                            : 'bg-blue-950/15 border-blue-500/30'
                          : 'bg-rose-950/15 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {auto.lastStatus === 'success' ? (
                            auto.lastIsLive ? (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Published Live to YouTube Shorts</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                <span>Rendered & Saved in Studio Catalog</span>
                              </span>
                            )
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Last Execution Failed</span>
                            </span>
                          )}
                        </div>

                        {auto.lastRun && (
                          <span className="text-[11px] font-mono text-zinc-400">
                            {new Date(auto.lastRun).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Video Title */}
                      {auto.lastVideoTitle && (
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span className="text-zinc-400 font-normal">Video Produced:</span>
                          <span className="italic">"{auto.lastVideoTitle}"</span>
                        </div>
                      )}

                      {/* Execution Message */}
                      {auto.lastRunMessage && (
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {auto.lastRunMessage}
                        </p>
                      )}

                      {/* Outcome Actions */}
                      <div className="flex items-center gap-3 pt-1.5 border-t border-white/5">
                        {auto.lastVideoUrl && (
                          <>
                            {auto.lastIsLive ? (
                              <a
                                href={auto.lastVideoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Watch on YouTube</span>
                              </a>
                            ) : (
                              onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('videos')}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Open in Studio Catalog</span>
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyLink(auto.lastVideoUrl!, auto.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto"
                            >
                              {copiedJobId === auto.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {auto.lastStatus === 'failed' && (
                          <button
                            type="button"
                            onClick={() => handleRunPipelineNow(auto.id, auto.theme)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry Pipeline</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Memory Deduplication Guard</h4>
            <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
              Every generated quote is cross-checked against SQLite memory history so themes never repeat.
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
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
