import React, { useState } from 'react';
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
  Volume2,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';

const sections = [
  { id: 'profile-details', label: 'Creator details', icon: <UserRound className="h-4 w-4" /> },
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

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSignOut = async () => {
    await logout();
    onNavigate('login');
  };

  const displayName = profile.displayName.trim() || user?.name || 'Dheena Dayalan';
  const creatorHandle = profile.creatorHandle || (user?.email ? `@${user.email.split('@')[0]}` : '@creator');

  const profileLinks = [
    { label: 'Website', value: profile.websiteUrl },
    { label: 'Instagram', value: profile.instagramUrl },
    { label: 'TikTok', value: profile.tiktokUrl },
    { label: 'YouTube', value: profile.youtubeUrl },
  ].filter((link) => link.value && link.value.trim());

  return (
    <div className="flex h-full w-full flex-col gap-5 overflow-y-auto p-2 sm:p-5 lg:p-7 font-sans-studio text-[#E5E5E5] bg-[#0A0A0A]">
      
      {/* ── 1. Wide Hero Creator Banner (Custom Cover or Cosmic Gradient) ── */}
      <div className="relative w-full h-36 sm:h-48 md:h-56 lg:h-64 rounded-3xl overflow-hidden border border-[#2F2F2F] shadow-2xl group bg-[#0C101D]">
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt={`${displayName} Cover Banner`}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-between px-6 sm:px-12 bg-gradient-to-r from-[#070D1F] via-[#0E172E] to-[#170C2E] relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Subtle Grid Accent */}
            <div
              className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-1 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-sky-300 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>ApexMind Creator Studio</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {displayName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {profile.niche} • Autonomous AI Shorts Director
              </p>
            </div>
          </div>
        )}

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />

        {/* Floating Quick Action Pills on Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={handleShareProfile}
            className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            title="Share profile link"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-slate-300" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-sky-400/40 text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-lg"
              title="Visit external website"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="hidden sm:inline">Website</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* ── 2. Creator Identity Row (Overlapping the Banner) ── */}
      <div className="relative px-2 sm:px-4 -mt-10 sm:-mt-14 md:-mt-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 z-10">
        
        {/* Left: Avatar + Identity Text */}
        <div className="flex items-start sm:items-end gap-4 sm:gap-5 min-w-0">
          {/* Circular Avatar */}
          <div className="relative shrink-0">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1 bg-[#0A0A0A] shadow-2xl border-2 border-[#2F2F2F]">
              {profile.avatarUrl || user?.avatarUrl ? (
                <img
                  src={profile.avatarUrl || user?.avatarUrl}
                  alt={`${displayName}'s avatar`}
                  className="w-full h-full rounded-full object-cover bg-[#161616]"
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-[#60A5FA] border border-white/10">
                  <UserRound className="w-8 h-8 sm:w-12 sm:h-12" />
                </div>
              )}
            </div>

            {/* Verified Pro Status Badge Dot */}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-[#0A0A0A] flex items-center justify-center shadow-md"
              title="Verified Creator Account"
            >
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </span>
          </div>

          {/* Name & Handle Information */}
          <div className="space-y-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
                {displayName}
              </h1>
              {user?.verified !== false && <Badge variant="green">Verified</Badge>}
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-sky-400 border border-blue-500/20 font-mono-studio">
                PRO CREATOR
              </span>
            </div>

            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 font-mono-studio">
              <span>{creatorHandle}</span>
              <span>•</span>
              <span className="text-slate-300 font-sans-studio">{profile.niche}</span>
            </p>

            {profile.bio && (
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed line-clamp-2 pt-0.5">
                {profile.bio}
              </p>
            )}

            {/* Social Link Pills */}
            {profileLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {profileLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#60A5FA]" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Buttons Group (Pill Buttons) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-end pb-1">
          <button
            type="button"
            onClick={() => onNavigate('profile-details')}
            className="px-4 py-2 rounded-full bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <UserRound className="w-3.5 h-3.5 text-slate-300" />
            <span>Edit Details</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('workspace')}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-1.5 border border-white/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('youtube')}
            className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/50 text-xs font-semibold text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube Studio</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 py-2 rounded-full bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-xs font-semibold text-slate-400 hover:text-red-400 transition-all cursor-pointer flex items-center gap-1"
            title="Sign out of ApexMind Studio"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── 3. High-Contrast Segmented Pill Navigation Bar (Matching User Reference) ── */}
      <div className="w-full flex items-center justify-between gap-2 overflow-x-auto p-1.5 bg-[#141414] border border-[#242424] rounded-2xl">
        <nav aria-label="Profile navigation" className="flex items-center gap-1 min-w-max">
          {sections.map((section) => {
            const selected = activePage === section.id || (section.id === 'profile-details' && activePage === 'profile');
            return (
              <button
                key={section.id}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => onNavigate(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selected ? 'bg-[#2563EB] text-white shadow-xs font-bold border border-[#60A5FA]/40' : 'text-[#9CA3AF] hover:text-white hover:bg-[#26262C] hover:border-white/10'
                }`}
              >
                <span className={selected ? 'text-white' : 'text-[#9CA3AF] group-hover:text-white'}>
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 4. Four Creator Info Cards Row (Directly Matching Reference Image) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Creator Niche */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] hover:border-sky-500/40 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Creator Niche</p>
            <p className="text-sm font-bold text-white truncate">{profile.niche || 'Stoic Mindset'}</p>
            <p className="text-[11px] text-[#60A5FA] truncate">Active Category</p>
          </div>
        </div>

        {/* Card 2: Neural AI Voice */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] hover:border-indigo-500/40 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Voice Model</p>
            <p className="text-sm font-bold text-white truncate">{profile.defaultVoice || 'Fenrir'}</p>
            <p className="text-[11px] text-indigo-400 truncate">Gemini 3.8 Neural TTS</p>
          </div>
        </div>

        {/* Card 3: Preferred Tone */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] hover:border-emerald-500/40 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Preferred Tone</p>
            <p className="text-sm font-bold text-white truncate">{profile.tone || 'Inspiring'}</p>
            <p className="text-[11px] text-emerald-400 truncate">Script Modulation</p>
          </div>
        </div>

        {/* Card 4: Creator Account */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2F2F2F] hover:border-amber-500/40 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Creator Status</p>
            <p className="text-sm font-bold text-white truncate">Pro Creator</p>
            <p className="text-[11px] text-amber-400 truncate">{user?.verified !== false ? 'Verified Account' : 'Standard'}</p>
          </div>
        </div>
      </div>

      {/* ── 5. Active Sub-Page Content Container ── */}
      <div className="rounded-2xl border border-[#242424] bg-[#141414] p-5 sm:p-7 shadow-xl">
        {children}
      </div>

    </div>
  );
}
