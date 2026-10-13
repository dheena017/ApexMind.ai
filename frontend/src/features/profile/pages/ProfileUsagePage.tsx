import { Card } from '@/src/shared/ui/common';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';

export default function ProfileUsagePage() {
  const { stats, videos, scripts, channels, loading, error } = useCreatorStudioData();
  const totalScripts = stats?.totalQuotesGenerated ?? scripts.length;
  const totalShorts = stats?.totalShortsGenerated ?? videos.length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Studio activity</h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">Review counts from your saved studio activity.</p>
      </header>
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Scripts generated', totalScripts.toLocaleString()],
          ['Shorts created', totalShorts.toLocaleString()],
          ['Connected channels', channels.length.toLocaleString()],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs text-[#9CA3AF]">{label}</p>
            <p className="mt-2 text-xl font-bold text-white">{loading ? '—' : value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
