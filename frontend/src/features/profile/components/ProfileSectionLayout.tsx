import React, { useState, useEffect } from 'react';
import {
  UserRound,
  Sliders,
  Youtube,
  Activity,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Share2,
  Check,
  ExternalLink,
  LogOut,
  CheckCircle2,
  Eye,
  Video,
  Users,
} from 'lucide-react';
import { Badge } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';
import { youtubeApi } from '@/src/features/youtube/api/youtubeApi';
import type { YouTubeChannel } from '@/src/features/youtube/types';
import { apiUrl } from '@/src/shared/utils/api';

const sections = [
  { id: 'profile-details', label: 'Creator details', icon: <UserRound className="h-4 w-4" /> },
  { id: 'profile-channels', label: 'YouTube Channel', icon: <Youtube className="h-4 w-4" /> },
  { id: 'profile-preferences', label: 'Preferences', icon: <Sliders className="h-4 w-4" /> },
  { id: 'profile-activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
  { id: 'profile-usage', label: 'Studio activity', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'profile-security', label: 'Security', icon: <ShieldCheck className="h-4 w-4" /> },
];

interface ProfileSectionLayoutProps {
  activePage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function ProfileSectionLayout({ activePage, onNavigate, children }: ProfileSectionLayoutProps) {
  const { profile, user } = useCreatorProfileSettings();
  const { logout } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [ytChannel, setYtChannel] = useState<YouTubeChannel | null>(null);
  const [loadingChannel, setLoadingChannel] = useState(true);

  useEffect(() => {
    let isMounted = true;
    youtubeApi.getChannelDetails('mindsetforge-v3q')
      .then((ch) => {
        if (isMounted && ch) {
          setYtChannel(ch);
          setLoadingChannel(false);
        }
      })
      .catch(() => {
        fetch(apiUrl('/api/youtube/channels'))
          .then((r) => r.json())
          .then((data) => {
            if (isMounted && data.channels && data.channels.length > 0) {
              setYtChannel(data.channels[0]);
            }
          })
          .catch(() => {})
          .finally(() => {
            if (isMounted) setLoadingChannel(false);
          });
      });

    return () => { isMounted = false; };
  }, []);

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSignOut = async () => {
    await logout();
    onNavigate('login');
  };

  const displayName = profile.displayName.trim() || ytChannel?.name || user?.name || 'Mindset Forge';
  const creatorHandle = ytChannel?.handle || profile.creatorHandle || '@mindsetforge-v3q';
  const bannerUrl = profile.bannerUrl || ytChannel?.bannerUrl || '';
  const avatarUrl = profile.avatarUrl || ytChannel?.avatarUrl || user?.avatarUrl || '';
  const channelUrl = ytChannel?.channelUrl || `https://www.youtube.com/${creatorHandle.startsWith('@') ? creatorHandle : `@${creatorHandle}`}`;

  // Clean description: strip raw markdown asterisks and leading newlines
  const rawBio = profile.bio || ytChannel?.description || '';
  const cleanBio = rawBio
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n+/g, ' ');

  const subscribersCount = ytChannel?.subscribers ?? 0;
  const videosCount = ytChannel?.videosUploaded ?? 0;

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-3 sm:p-6 lg:p-8 font-sans-studio text-[#E5E5E5] bg-[#0A0A0A]">
      
      {/* ── 1. Hero Creator Banner (Proportional Aspect Ratio & Clean Rounded Edges) ── */}
      <div className="relative w-full aspect-[16/6] min-h-[160px] max-h-[240px] sm:max-h-[280px] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#27272A] shadow-2xl group bg-[#0C101D]">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${displayName} Cover Banner`}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-between px-6 sm:px-12 bg-gradient-to-r from-[#070D1F] via-[#0E172E] to-[#170C2E] relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            <div
              className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-1.5 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-sky-300 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>ApexMind Creator Studio</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {displayName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {profile.niche || 'Stoic Mindset & Discipline'} • Autonomous AI Shorts Director
              </p>
            </div>
          </div>
        )}

        {/* Subtle Dark Gradient Overlay for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {/* Floating Quick Action Pills on Top Right */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={handleShareProfile}
            className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
            title="Share profile link"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-slate-300" />
                <span>Share</span>
              </>
            )}
          </button>

          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-red-500/25 backdrop-blur-md border border-white/10 hover:border-red-500/40 text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
            title="View Official Channel on YouTube"
          >
            <Youtube className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>YouTube</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* ── 2. Creator Identity Row (Carefully Proportioned Avatar & Details) ── */}
      <div className="relative px-2 sm:px-4 -mt-10 sm:-mt-14 md:-mt-16 flex flex-col lg:flex-row lg:items-end justify-between gap-5 z-10">
        
        {/* Left: Avatar + Title & Bio */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5 min-w-0">
          
          {/* Circular Channel Avatar */}
          <div className="relative shrink-0">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-1 bg-[#0A0A0A] shadow-2xl border-2 border-[#2F2F2F]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${displayName}'s avatar`}
                  className="w-full h-full rounded-full object-cover bg-[#161616]"
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-[#60A5FA] border border-white/10">
                  <UserRound className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              )}
            </div>

            {/* Verified Account Badge Dot */}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-[#0A0A0A] flex items-center justify-center shadow-md"
              title="Verified YouTube Creator Account"
            >
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </span>
          </div>

          {/* Name, Badges & Meta */}
          <div className="space-y-1.5 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
                {displayName}
              </h1>
              <Badge variant="green">Verified</Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 text-[10px] font-bold tracking-wider">
                <Youtube className="w-3 h-3 fill-current" />
                <span>YOUTUBE CREATOR</span>
              </span>
            </div>

            {/* Handle, Niche & Stats Summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-white">{creatorHandle}</span>
              <span className="text-[#52525B]">•</span>
              <span className="text-slate-400">{profile.niche || 'Stoic Mindset & Discipline'}</span>
              <span className="text-[#52525B]">•</span>
              <span className="text-slate-400 font-mono-studio">
                {loadingChannel ? '—' : `${subscribersCount.toLocaleString()} subscribers`}
              </span>
              <span className="text-[#52525B]">•</span>
              <span className="text-slate-400 font-mono-studio">
                {loadingChannel ? '—' : `${videosCount.toLocaleString()} videos`}
              </span>
            </div>

            {/* Cleaned Description (No asterisks) */}
            {cleanBio && (
              <p className="text-xs sm:text-[13px] text-slate-300 max-w-2xl leading-relaxed line-clamp-2 pt-0.5">
                {cleanBio}
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-end pb-1">
          <button
            type="button"
            onClick={() => onNavigate('profile-channels')}
            className="px-4 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Youtube className="w-3.5 h-3.5 text-red-400 fill-current" />
            <span>Channel Details</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile-details')}
            className="px-4 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <UserRound className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('youtube')}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-red-950/40 flex items-center gap-1.5 active:scale-95"
          >
            <Youtube className="w-3.5 h-3.5 fill-current" />
            <span>YouTube Studio</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 rounded-xl bg-[#18181B] hover:bg-red-500/15 border border-[#27272A] hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Sign out of ApexMind Studio"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* ── 3. High-Contrast Segmented Pill Navigation Bar ── */}
      <div className="w-full flex items-center justify-between gap-2 overflow-x-auto p-1.5 bg-[#141416] border border-[#27272A] rounded-2xl shadow-sm">
        <nav aria-label="Profile navigation" className="flex items-center gap-1 min-w-max">
          {sections.map((section) => {
            const selected = activePage === section.id || (section.id === 'profile-details' && activePage === 'profile');
            return (
              <button
                key={section.id}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => onNavigate(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  selected
                    ? 'bg-[#2563EB] text-white shadow-sm font-bold border border-[#60A5FA]/40'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#1E1E22]'
                }`}
              >
                <span className={selected ? 'text-white' : 'text-[#A1A1AA] group-hover:text-white'}>
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 4. Four Creator Info Cards Row with Real YouTube Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: YouTube Subscribers */}
        <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272A] hover:border-red-500/40 transition-colors flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subscribers</p>
            <p className="text-base sm:text-lg font-black text-white font-mono-studio">
              {loadingChannel ? '—' : (ytChannel?.subscribers ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-red-400 truncate">Live YouTube Sync</p>
          </div>
        </div>

        {/* Card 2: Videos & Shorts Uploaded */}
        <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272A] hover:border-sky-500/40 transition-colors flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Videos Uploaded</p>
            <p className="text-base sm:text-lg font-black text-white font-mono-studio">
              {loadingChannel ? '—' : (ytChannel?.videosUploaded ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-sky-400 truncate">Total Channel Content</p>
          </div>
        </div>

        {/* Card 3: Total Lifetime Views */}
        <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272A] hover:border-emerald-500/40 transition-colors flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Views</p>
            <p className="text-base sm:text-lg font-black text-white font-mono-studio">
              {loadingChannel ? '—' : (ytChannel?.totalLifetimeViews ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-400 truncate">Audience Reach</p>
          </div>
        </div>

        {/* Card 4: Channel Status */}
        <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272A] hover:border-amber-500/40 transition-colors flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Channel Status</p>
            <p className="text-sm font-bold text-white truncate">Connected</p>
            <p className="text-[11px] text-emerald-400 truncate flex items-center gap-1 font-mono-studio">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
              <span>OAuth 2.0 Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. Active Sub-Page Content Container ── */}
      <div className="rounded-2xl border border-[#27272A] bg-[#141416] p-5 sm:p-7 shadow-xl">
        {children}
      </div>

    </div>
  );
}
