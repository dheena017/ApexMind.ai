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
  Sparkles,
  Volume2,
  Video,
  ShieldCheck,
  Send,
  Loader2,
  ArrowRight,
  Radio,
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

export const YouTubeSchedulesPage: React.FC<YouTubeSchedulesPageProps> = ({
  automations,
  loading = false,
  onToggleAuto,
  onRefresh,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [runSuccessNotice, setRunSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [theme, setTheme] = useState('Stoic Mindset & Discipline');
  const [publishTime, setPublishTime] = useState('08:00');
  const [voice, setVoice] = useState('Fenrir');
  const [musicTrack, setMusicTrack] = useState('Epic Cinematic');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'scheduled'>('public');

  const activeCount = automations.filter((a) => a.active).length;

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await youtubeApi.createAutomation({
        theme,
        publishTime,
        schedule: `Daily at ${publishTime} UTC`,
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
    setRunSuccessNotice(null);
    setErrorMessage(null);
    try {
      const res = await youtubeApi.runAutomationNow(id);
      const videoTitle = res.data?.title || jobTheme;
      setRunSuccessNotice(`Pipeline executed successfully! '${videoTitle}' generated and published to YouTube Shorts.`);
      onRefresh?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Pipeline execution failed');
    } finally {
      setRunningJobId(null);
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

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
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
        {automations.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-[#181818] border border-[#242424]">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">No Active Automation Schedules</h4>
            <p className="text-xs text-[#8E8E93] max-w-md mx-auto mt-1 mb-4">
              Create your first daily automated publishing schedule to have ApexMind auto-generate and upload viral motivational Shorts to your YouTube channel every day.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Schedule</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {automations.map((auto) => {
              const isRunning = runningJobId === auto.id || auto.lastStatus === 'running';

              return (
                <div
                  key={auto.id}
                  className="p-4 sm:p-5 rounded-xl bg-[#181818] border border-[#262626] hover:border-[#3B82F6]/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
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
                        Time: <strong className="text-white">{auto.publishTime || auto.schedule}</strong>
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
                          <span>Generating & Uploading...</span>
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

              {/* Daily Publish Time */}
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
