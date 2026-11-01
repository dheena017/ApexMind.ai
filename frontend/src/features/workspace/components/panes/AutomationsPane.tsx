import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Clock,
  Zap,
  Play,
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
} from 'lucide-react';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { AutomationJob } from '@/src/features/youtube/types';
import { toast } from 'sonner';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';

export interface AutomationsPaneProps {
  onNavigate?: (page: string) => void;
  className?: string;
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

export const AutomationsPane: React.FC<AutomationsPaneProps> = ({
  onNavigate,
  className = '',
}) => {
  const [automations, setAutomations] = useState<AutomationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form inputs
  const [theme, setTheme] = useState('Stoic Mindset & Discipline');
  const [publishTime, setPublishTime] = useState('08:00');
  const [voice, setVoice] = useState('Fenrir');
  const [musicTrack, setMusicTrack] = useState('Epic Cinematic');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'scheduled'>('public');

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

  useEffect(() => {
    loadAutomations();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const updated = await youtubeApi.toggleAutomation(id);
      setAutomations(updated);
      toast.success('Automation schedule updated');
    } catch (err: any) {
      toast.error(err.message || 'Could not toggle automation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this automated daily publishing rule?')) return;
    try {
      await youtubeApi.deleteAutomation(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success('Automation rule deleted');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete automation');
    }
  };

  const handleRunNow = async (id: string, jobTheme: string) => {
    setRunningJobId(id);
    try {
      toast.info(`Executing autonomous pipeline for "${jobTheme}"...`);
      const res = await youtubeApi.runAutomationNow(id);
      const title = res.data?.title || jobTheme;
      toast.success(`Pipeline complete! "${title}" published to YouTube Shorts.`);
      loadAutomations();
    } catch (err: any) {
      toast.error(err.message || 'Pipeline execution failed');
    } finally {
      setRunningJobId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
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
      toast.success('New daily automation rule scheduled!');
      setShowCreateForm(false);
      loadAutomations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create automation');
    } finally {
      setCreating(false);
    }
  };

  const activeCount = automations.filter((a) => a.active).length;

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
            onClick={loadAutomations}
            disabled={loading}
            className="w-7 h-7 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#323238]"
            title="Refresh Schedules"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('youtube-schedules')}
              className="h-7 px-2 rounded-md bg-[#222226] hover:bg-[#2C2C32] text-[11px] font-medium text-white transition-colors cursor-pointer border border-[#323238] flex items-center gap-1 shrink-0"
              title="Open full Automations Hub"
            >
              <ExternalLink className="w-3 h-3 text-[#A1A1AA]" />
              <span className="hidden sm:inline">Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Background Cron Status Banner ── */}
      <div className="px-3.5 py-2 bg-[#151518] border-b border-[#242428] flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-zinc-300 font-medium truncate">24/7 Server Background Cron</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono shrink-0">Checks every 60s</span>
      </div>

      {/* ── Main Scrollable Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 flex flex-col gap-3.5">
        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase font-mono-studio text-[#A1A1AA] font-bold">
            Configured Pipelines ({automations.length})
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>{showCreateForm ? 'Close Form' : 'New Schedule'}</span>
          </button>
        </div>

        {/* ── Inline New Schedule Form ── */}
        {showCreateForm && (
          <form
            onSubmit={handleCreate}
            className="p-3.5 rounded-xl bg-[#18181C] border border-[#2E2E38] shadow-lg flex flex-col gap-3 animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#24242A]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>New Daily Publishing Rule</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold">
                Niche / Theme
              </label>
              <CustomSelect
                options={THEME_OPTIONS}
                value={theme}
                onChange={(val) => setTheme(val)}
                className="w-full text-xs"
                buttonClassName="!bg-[#121215] !border-[#2A2A30] !py-2 !rounded-lg text-xs"
                menuClassName="!bg-[#16161A] !border-[#2E2E38]"
              />
            </div>

            {/* Publish Time & Privacy Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold">
                  Time (UTC)
                </label>
                <input
                  type="time"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                  required
                  className="w-full bg-[#121215] border border-[#2A2A30] focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold">
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
                  buttonClassName="!bg-[#121215] !border-[#2A2A30] !py-2 !rounded-lg text-xs"
                  menuClassName="!bg-[#16161A] !border-[#2E2E38]"
                />
              </div>
            </div>

            {/* AI Voice Persona */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold">
                Gemini Voice
              </label>
              <CustomSelect
                options={VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.name }))}
                value={voice}
                onChange={(val) => setVoice(val)}
                className="w-full text-xs"
                buttonClassName="!bg-[#121215] !border-[#2A2A30] !py-2 !rounded-lg text-xs"
                menuClassName="!bg-[#16161A] !border-[#2E2E38]"
              />
            </div>

            {/* Soundtrack */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono-studio uppercase text-[#A1A1AA] font-semibold">
                Soundtrack
              </label>
              <CustomSelect
                options={MUSIC_OPTIONS}
                value={musicTrack}
                onChange={(val) => setMusicTrack(val)}
                className="w-full text-xs"
                buttonClassName="!bg-[#121215] !border-[#2A2A30] !py-2 !rounded-lg text-xs"
                menuClassName="!bg-[#16161A] !border-[#2E2E38]"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#24242A]">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-lg bg-[#222226] text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Activate Daily Cron</span>
              </button>
            </div>
          </form>
        )}

        {/* ── Automation Rules List ── */}
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
          <div className="p-5 rounded-xl bg-[#17171C] border border-[#26262E] text-center flex flex-col items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">No Active Automation Schedules</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Add your first schedule above to have ApexMind auto-generate and publish daily Shorts to YouTube.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((job) => {
              const isRunning = runningJobId === job.id || job.lastStatus === 'running';

              return (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-[#18181C] border border-[#26262E] hover:border-[#3B82F6]/40 transition-all flex flex-col gap-2.5 shadow-sm"
                >
                  {/* Top row: Theme & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{job.theme}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {job.publishTime || job.schedule} · Voice: {job.voice}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggle(job.id)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition-colors cursor-pointer shrink-0 ${
                        job.active
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {job.active ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  {/* Metadata info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 pt-1 border-t border-[#222228]">
                    <span>Release: <strong className="text-zinc-200">{job.privacyStatus === 'scheduled' ? 'Scheduled' : 'Public'}</strong></span>
                    <span>•</span>
                    <span>Next: <strong className="text-blue-400">{formatNextRun(job.nextRun)}</strong></span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => handleRunNow(job.id, job.theme)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isRunning
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-not-allowed'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                      }`}
                      title="Run the pipeline now on demand"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Generating & Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Run Now</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(job.id)}
                      className="p-1.5 rounded-lg bg-[#222226] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-[#2E2E36] hover:border-rose-800/40 transition-colors cursor-pointer"
                      title="Delete schedule"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── System Architecture Card ── */}
        <div className="p-3 rounded-xl bg-[#141418] border border-[#222226] text-xs text-zinc-400 flex flex-col gap-2">
          <div className="text-white font-semibold text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous Daily Architecture</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Every day at the designated time, the server writes an original script with Gemini 3.8 Flash, dedupes with SQLite memory, synthesizes voice, renders 9:16 vertical MP4, and pushes to YouTube.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutomationsPane;

