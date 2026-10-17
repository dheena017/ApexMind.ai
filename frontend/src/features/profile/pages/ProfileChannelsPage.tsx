import { useState } from 'react';
import { Youtube, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { Badge, Button } from '@/src/shared/ui/common';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import { connectYouTubeWithGoogle } from '@/src/features/youtube/utils/googleOAuthConnect';
import { YouTubeIcon } from '@/src/features/youtube/components/YouTubeIcon';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';

function formatDate(value?: string): string {
  if (!value) return 'Date unavailable';
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
  const [connecting, setConnecting] = useState(false);

  const handleConnectWithGoogle = () => {
    setActionError(null);
    setNotice(null);
    connectYouTubeWithGoogle({
      onLoading: setConnecting,
      onSuccess: (connectedChannel) => {
        setChannels([connectedChannel]);
        setNotice(`Successfully connected YouTube channel "${connectedChannel.name}" (${connectedChannel.handle})!`);
      },
      onError: (err) => {
        setActionError(err);
      },
    });
  };

  const disconnect = async (channelId: string, name: string) => {
    if (!window.confirm(`Disconnect ${name} from this studio?`)) return;
    setDisconnectingId(channelId);
    setActionError(null);
    setNotice(null);
    try {
      const removed = await youtubeApi.disconnectOAuth();
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
      {/* Page Header */}
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

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={connecting}
            icon={<YouTubeIcon />}
            onClick={handleConnectWithGoogle}
          >
            {connecting ? 'Connecting…' : 'Connect YouTube Channel'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('youtube')}>
            Open Studio
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Loading connected channels…</p>
      ) : channels.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-[#141414] border border-[#2F2F2F] space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <Youtube className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">No connected YouTube channel</h2>
            <p className="mt-1 text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
              Connect your YouTube channel using Google Sign-In to stream authentic video statistics, manage uploads, and publish Shorts.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={connecting}
            icon={<YouTubeIcon />}
            onClick={handleConnectWithGoogle}
          >
            {connecting ? 'Connecting…' : 'Connect YouTube Channel'}
          </Button>
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

      {actionError && <p role="alert" className="mt-4 text-sm text-red-300">{actionError}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}

    </div>
  );
}
