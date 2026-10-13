import { Activity, CheckCircle2, Sparkles, Star, Youtube } from 'lucide-react';
import { Card } from '@/src/shared/ui/common';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ProfileActivityPage() {
  const { channels, videos, stats, scripts, loading, error } = useCreatorStudioData();
  const scriptCount = stats?.totalQuotesGenerated ?? scripts.length;
  const shortCount = stats?.totalShortsGenerated ?? videos.length;
  const achievements = [
    { name: 'First script', description: 'Generate your first script', earned: scriptCount >= 1, value: Math.min(scriptCount, 1), goal: 1, icon: <Sparkles className="h-5 w-5" /> },
    { name: 'Storyteller', description: 'Generate 10 scripts', earned: scriptCount >= 10, value: Math.min(scriptCount, 10), goal: 10, icon: <Star className="h-5 w-5" /> },
    { name: 'First Short', description: 'Create your first Short', earned: shortCount >= 1, value: Math.min(shortCount, 1), goal: 1, icon: <Youtube className="h-5 w-5" /> },
    { name: 'Channel connected', description: 'Connect a YouTube channel', earned: channels.length > 0, value: Math.min(channels.length, 1), goal: 1, icon: <CheckCircle2 className="h-5 w-5" /> },
  ];
  const entries = [
    ...scripts.map((script) => ({
      key: `script-${script.id}`,
      title: script.title || 'Generated script',
      detail: script.category || 'Script',
      date: script.generated_at,
      icon: <Sparkles className="h-4 w-4" />,
      color: 'bg-[#3B82F6]/10 text-[#60A5FA]',
      url: undefined as string | undefined,
    })),
    ...videos.map((video) => ({
      key: `short-${video.id}`,
      title: video.title || 'YouTube Short',
      detail: `${video.category || 'Short'} · ${video.status}`,
      date: video.publishedAt,
      icon: <Youtube className="h-4 w-4" />,
      color: 'bg-red-500/10 text-red-400',
      url: video.videoUrl || undefined,
    })),
  ].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()).slice(0, 12);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Activity & milestones</h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">See your recent work and badges earned from real studio activity.</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white">Milestones</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <Card key={achievement.name}>
              <div className="flex items-start gap-3">
                <span className={`rounded-xl border p-2.5 ${achievement.earned ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-[#2F2F2F] bg-[#121212] text-[#6B7280]'}`}>
                  {achievement.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{achievement.name}</h3>
                    {achievement.earned && <span className="text-[11px] font-semibold text-emerald-400">Earned</span>}
                  </div>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{achievement.earned ? 'Milestone unlocked' : achievement.description}</p>
                  {!achievement.earned && <p className="mt-2 text-[11px] text-[#6B7280]">{achievement.value}/{achievement.goal}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <Card>
        <div className="mb-4 flex items-center gap-3 border-b border-[#2F2F2F] pb-4">
          <Activity className="h-5 w-5 text-[#60A5FA]" />
          <div>
            <h2 className="text-base font-bold text-white">Recent activity</h2>
            <p className="mt-1 text-xs text-[#9CA3AF]">Recent generated scripts and created Shorts.</p>
          </div>
        </div>
        {error && <p role="alert" className="mb-4 text-sm text-amber-300">{error}</p>}
        {loading ? <p className="text-sm text-[#9CA3AF]">Loading activity…</p> : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#9CA3AF]">Your scripts and Shorts will appear here as you create them.</p>
        ) : (
          <div className="divide-y divide-[#2F2F2F]">
            {entries.map((entry) => (
              <div key={entry.key} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`rounded-lg p-2 ${entry.color}`}>{entry.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{entry.title}</p>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">{entry.detail} · {formatDate(entry.date)}</p>
                  </div>
                </div>
                {entry.url && <a href={entry.url} target="_blank" rel="noreferrer" className="text-xs text-[#60A5FA] hover:text-white">Open video</a>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
