import React from 'react';
import { Activity, CheckCircle2, Sparkles, Star, Youtube } from 'lucide-react';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';
import { RecentStudioActivity } from '../components/RecentStudioActivity';

export default function ProfileActivityPage() {
  const { channels, stats, scripts, videos } = useCreatorStudioData();

  const scriptCount = stats?.totalQuotesGenerated ?? scripts.length;
  const shortCount = stats?.totalShortsGenerated ?? videos.length;

  const achievements = [
    { name: 'First script', description: 'Generate your first script', earned: scriptCount >= 1, value: Math.min(scriptCount, 1), goal: 1, icon: <Sparkles className="h-5 w-5" /> },
    { name: 'Storyteller', description: 'Generate 10 scripts', earned: scriptCount >= 10, value: Math.min(scriptCount, 10), goal: 10, icon: <Star className="h-5 w-5" /> },
    { name: 'First Short', description: 'Create your first Short', earned: shortCount >= 1, value: Math.min(shortCount, 1), goal: 1, icon: <Youtube className="h-5 w-5" /> },
    { name: 'Channel connected', description: 'Connect a YouTube channel', earned: channels.length > 0, value: Math.min(channels.length, 1), goal: 1, icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

  return (
    <div className="w-full space-y-8 font-sans-studio text-[#E5E5E5]">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Activity &amp; Milestones</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">See your recent work and badges earned from real studio activity.</p>
          </div>
        </div>
      </div>

      {/* ── Section 1: Milestones ── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Milestones &amp; Badges</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-[#9CA3AF] border border-[#2F2F2F] font-mono-studio">
              {achievements.filter((a) => a.earned).length}/{achievements.length} Unlocked
            </span>
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.name}
              className={`rounded-2xl border p-4 transition-all duration-200 ${
                achievement.earned
                  ? 'border-emerald-500/30 bg-[#121212]'
                  : 'border-[#262626] bg-[#121212]/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`rounded-xl border p-2.5 shrink-0 ${
                    achievement.earned
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                      : 'border-[#2F2F2F] bg-[#161616] text-[#6B7280]'
                  }`}
                >
                  {achievement.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="truncate text-sm font-bold text-white">{achievement.name}</h3>
                    {achievement.earned ? (
                      <span className="shrink-0 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] text-[#737373] font-mono-studio">
                        {achievement.value}/{achievement.goal}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#9CA3AF] leading-relaxed">
                    {achievement.earned ? 'Milestone unlocked' : achievement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Reusable Standalone Recent Studio Activity Component ── */}
      <RecentStudioActivity />
    </div>
  );
}
