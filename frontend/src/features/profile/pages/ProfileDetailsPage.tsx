import React, { useState, useEffect } from 'react';
import { UserRound, Save, Calendar, CheckCircle2, Youtube, Clock } from 'lucide-react';
import { Button, Badge } from '@/src/shared/ui/common';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import type { YouTubeChannel } from '@/src/features/youtube/types';
import { apiUrl } from '@/src/shared/utils/api';

const inputClass = 'w-full rounded-xl border border-[#2F2F2F] bg-[#121212] px-3.5 py-2.5 text-sm text-[#E5E5E5] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]';

const DEFAULT_MINDSET_FORGE_CHANNEL: YouTubeChannel = {
  id: 'UCH0jnQrHaBOglbsLCBRoklg',
  name: 'Mindset Forge',
  handle: '@mindsetforge-v3q',
  avatarUrl: 'https://yt3.ggpht.com/8RRzGPIl4gUnVVz8gC0pdRjOD69LEx_-4Cnwy-hj30U_CWtW_CpfQZg51Qj6LfQGS57eI6mv=s800-c-k-c0x00ffffff-no-rj',
  bannerUrl: 'https://yt3.googleusercontent.com/q7mOI6glVARA73wcjSyKrYkX-83wV9oJfv043VBaW26C83Uhq-_PNlGCeENFENygPM1vgfPs2A',
  subscribers: 0,
  videosUploaded: 0,
  totalLifetimeViews: 0,
  description: 'Welcome to Mindset Forge. In a world filled with constant noise and distraction, true power lies in mastering your mind. Here, we forge mental toughness, calm resilience, and unbreakable focus through timeless Stoic wisdom, self-discipline, and high-performance habits.',
  channelUrl: 'https://www.youtube.com/@mindsetforge-v3q',
  verified: true,
  isAutoUploadEnabled: true,
  niche: 'Stoic Mindset & Discipline',
  connectedAt: '2026-11-03T11:37:27.300432+00:00',
  isOAuthAuthenticated: true,
  joinedDate: '2026-10-13',
};

function formatPrettyDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ProfileDetailsPage() {
  const { profile, setProfile, save, error, user } = useCreatorProfileSettings();
  const [notice, setNotice] = useState<string | null>(null);

  // Initialize with cached channel or default for instant zero-flash render
  const [ytChannel, setYtChannel] = useState<YouTubeChannel>(() => {
    try {
      const cached = localStorage.getItem('apexmind_yt_channel_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name) return parsed;
      }
    } catch {}
    return DEFAULT_MINDSET_FORGE_CHANNEL;
  });

  // Fetch YouTube channel data to auto-populate all channel fields & dates
  useEffect(() => {
    let isMounted = true;
    youtubeApi.getChannelDetails('mindsetforge-v3q')
      .then((ch) => {
        if (!isMounted || !ch) return;
        setYtChannel(ch);
        try {
          localStorage.setItem('apexmind_yt_channel_cache', JSON.stringify(ch));
        } catch {}

        setProfile((prev) => {
          const cleanBio = (ch.description || '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\n+/g, ' ');

          return {
            ...prev,
            displayName: prev.displayName || ch.name || user?.name || 'Mindset Forge',
            creatorHandle: prev.creatorHandle || ch.handle || '@mindsetforge-v3q',
            avatarUrl: prev.avatarUrl || ch.avatarUrl || user?.avatarUrl || DEFAULT_MINDSET_FORGE_CHANNEL.avatarUrl,
            bannerUrl: prev.bannerUrl || ch.bannerUrl || DEFAULT_MINDSET_FORGE_CHANNEL.bannerUrl,
            youtubeUrl: prev.youtubeUrl || ch.channelUrl || `https://www.youtube.com/${(ch.handle || '@mindsetforge-v3q').replace(/^@?/, '@')}`,
            websiteUrl: prev.websiteUrl || ch.channelUrl || 'https://www.youtube.com/@mindsetforge-v3q',
            bio: prev.bio || cleanBio,
          };
        });
      })
      .catch(() => {
        fetch(apiUrl('/api/youtube/channels'))
          .then((r) => r.json())
          .then((data) => {
            if (isMounted && data.channels && data.channels.length > 0) {
              const ch = data.channels[0];
              setYtChannel(ch);
              try {
                localStorage.setItem('apexmind_yt_channel_cache', JSON.stringify(ch));
              } catch {}
              setProfile((prev) => ({
                ...prev,
                displayName: prev.displayName || ch.name || 'Mindset Forge',
                creatorHandle: prev.creatorHandle || ch.handle || '@mindsetforge-v3q',
                avatarUrl: prev.avatarUrl || ch.avatarUrl || DEFAULT_MINDSET_FORGE_CHANNEL.avatarUrl,
                bannerUrl: prev.bannerUrl || ch.bannerUrl || DEFAULT_MINDSET_FORGE_CHANNEL.bannerUrl,
                youtubeUrl: prev.youtubeUrl || `https://www.youtube.com/${ch.handle || '@mindsetforge-v3q'}`,
              }));
            }
          })
          .catch(() => {});
      });

    return () => { isMounted = false; };
  }, []);

  const field = (
    label: string,
    key: 'displayName' | 'creatorHandle' | 'avatarUrl' | 'bannerUrl' | 'websiteUrl' | 'instagramUrl' | 'tiktokUrl' | 'youtubeUrl',
    type = 'text',
    placeholder?: string
  ) => (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={profile[key] || DEFAULT_MINDSET_FORGE_CHANNEL[key as keyof YouTubeChannel] || ''}
        onChange={(event) => {
          setProfile((current) => ({ ...current, [key]: event.target.value }));
        }}
        className={inputClass}
        placeholder={placeholder}
        maxLength={key === 'displayName' ? 80 : key === 'creatorHandle' ? 40 : undefined}
      />
    </label>
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(save(profile) ? 'Creator details and YouTube metadata saved on this browser.' : null);
  };

  const channelJoinedDate = formatPrettyDate(ytChannel?.joinedDate || DEFAULT_MINDSET_FORGE_CHANNEL.joinedDate);
  const studioConnectedDate = formatPrettyDate(ytChannel?.connectedAt || DEFAULT_MINDSET_FORGE_CHANNEL.connectedAt);
  const lastActiveDate = formatPrettyDate(user?.lastLoginAt) || 'Today';

  return (
    <div className="w-full space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA]">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Edit Creator Details</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              All live YouTube channel metadata, links, bio, and timeline dates.
            </p>
          </div>
        </div>

        <Badge variant="green">
          <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-400" />
          Live YouTube Synced
        </Badge>
      </div>

      {/* ── Channel Timeline Dates Row (Immediate, Zero Flash) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-[#27272A] bg-[#121214] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Youtube className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">YouTube Channel Created</p>
            <p className="text-xs sm:text-sm font-bold text-white font-mono-studio">
              {channelJoinedDate}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#27272A] bg-[#121214] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Studio Connected Date</p>
            <p className="text-xs sm:text-sm font-bold text-white font-mono-studio">
              {studioConnectedDate}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#27272A] bg-[#121214] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Last Active Session</p>
            <p className="text-xs sm:text-sm font-bold text-white font-mono-studio">
              {lastActiveDate}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form Inputs (Populated with Live YouTube Channel Data) ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Display name', 'displayName', 'text', 'Mindset Forge')}
          
          <label className="block space-y-1.5">
            <span className={labelClass}>Channel email</span>
            <input
              value={user?.email && !user.email.includes('gmail.com') ? user.email : 'mindsetforge-v3q@youtube.com'}
              readOnly
              className={`${inputClass} cursor-not-allowed text-[#888]`}
            />
          </label>

          {field('Creator handle', 'creatorHandle', 'text', '@mindsetforge-v3q')}
          {field('Avatar image URL', 'avatarUrl', 'url', 'https://yt3.ggpht.com/...')}
          {field('Cover banner image URL', 'bannerUrl', 'url', 'https://yt3.googleusercontent.com/...')}
          {field('Website', 'websiteUrl', 'url', 'https://www.youtube.com/@mindsetforge-v3q')}
          {field('Instagram profile', 'instagramUrl', 'url', 'https://instagram.com/mindsetforge')}
          {field('TikTok profile', 'tiktokUrl', 'url', 'https://tiktok.com/@mindsetforge')}
          {field('YouTube profile', 'youtubeUrl', 'url', 'https://www.youtube.com/@mindsetforge-v3q')}
        </div>

        <label className="block space-y-1.5">
          <span className={labelClass}>Short bio</span>
          <textarea
            value={profile.bio || DEFAULT_MINDSET_FORGE_CHANNEL.description || ''}
            onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
            className={`${inputClass} min-h-28 resize-y`}
            maxLength={280}
            placeholder="Channel description from YouTube..."
          />
          <span className="block text-right text-[11px] text-[#6B7280]">{(profile.bio || DEFAULT_MINDSET_FORGE_CHANNEL.description || '').length}/280</span>
        </label>

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary">
            <Save className="h-4 w-4 mr-1.5" />
            <span>Save creator details</span>
          </Button>
        </div>
      </form>

      <p className="mt-4 border-t border-[#262626] pt-4 text-xs text-[#6B7280]">
        Creator details and channel links are synchronized from your verified YouTube channel profile.
      </p>
    </div>
  );
}
