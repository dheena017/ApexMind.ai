import { useState } from 'react';
import { Youtube } from 'lucide-react';
import { Badge, Button, Card } from '@/src/shared/ui/common';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ProfileChannelsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { channels, loading, error, setChannels } = useCreatorStudioData();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const disconnect = async (channelId: string, name: string) => {
    if (!window.confirm(`Disconnect ${name} from this studio?`)) return;
    setDisconnectingId(channelId);
    setActionError(null);
    setNotice(null);
    try {
      const removed = await youtubeApi.deleteChannel(channelId);
      if (!removed) throw new Error('The channel could not be disconnected.');
      setChannels((current) => current.filter((channel) => channel.id !== channelId));
      setNotice(`${name} disconnected.`);
    } catch (disconnectError) {
      setActionError(disconnectError instanceof Error ? disconnectError.message : 'Could not disconnect the YouTube channel.');
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/25 text-red-400">
            <Youtube className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Connected YouTube Channels</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">Manage the channels connected to your studio account for live sync &amp; automations.</p>
          </div>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={() => onNavigate('youtube')}>Open YouTube Manager</Button>
      </div>
      {loading ? <p className="text-sm text-[#9CA3AF]">Loading connected channels…</p> : channels.length === 0 ? (
        <div className="py-8 text-center">
          <Youtube className="mx-auto h-8 w-8 text-red-400" />
          <h2 className="mt-3 font-semibold text-white">No connected channels</h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">Connect a channel in YouTube Manager to publish and track Shorts.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => onNavigate('youtube')}>Connect a channel</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => (
            <div key={channel.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#2F2F2F] bg-[#121212] p-4">
              <div className="flex min-w-0 items-center gap-3">
                {channel.avatarUrl ? (
                  <img src={channel.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E1E1E] text-red-400"><Youtube className="h-5 w-5" /></div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{channel.name}</p>
                    {channel.verified && <Badge variant="green">Verified</Badge>}
                  </div>
                  <p className="truncate text-xs text-[#9CA3AF]">{channel.handle} · {channel.subscribers.toLocaleString()} subscribers</p>
                  <p className="mt-1 text-[11px] text-[#6B7280]">Connected {formatDate(channel.connectedAt)} · {channel.niche}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={disconnectingId === channel.id}
                onClick={() => void disconnect(channel.id, channel.name)}
              >
                {disconnectingId === channel.id ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </div>
          ))}
        </div>
      )}
      {(error || actionError) && <p role="alert" className="mt-4 text-sm text-red-300">{actionError || error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}
    </div>
  );
}
