import React, { useState } from 'react';
import {
  LayoutDashboard,
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
} from 'lucide-react';
import { Badge, Button } from '@/src/shared/ui/common';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';

const sections = [
  { id: 'profile', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'profile-details', label: 'Creator details', icon: <UserRound className="h-4 w-4" /> },
  { id: 'profile-preferences', label: 'Preferences', icon: <Sliders className="h-4 w-4" /> },
  { id: 'profile-channels', label: 'Channels', icon: <Youtube className="h-4 w-4" /> },
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
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const displayName = profile.displayName.trim() || user?.name || 'Dheena Dayalan';

  const profileLinks = [
    { label: 'Website', value: profile.websiteUrl },
    { label: 'Instagram', value: profile.instagramUrl },
    { label: 'TikTok', value: profile.tiktokUrl },
    { label: 'YouTube', value: profile.youtubeUrl },
  ].filter((link) => link.value && link.value.trim());

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8 font-sans-studio text-[#E5E5E5]">
      {/* ── 1. Unified Creator Profile Header & Account Info (Single Border Container) ── */}
      <section className="rounded-2xl border border-[#2F2F2F] bg-[#141414] overflow-hidden divide-y divide-[#2F2F2F]">
        {/* Creator Hub Header */}
        <header className="relative p-5 sm:p-6 overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Creator profile
              </h1>
              <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
                Your creator identity, studio activity, and account setup in one place.
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E1E1E] hover:bg-[#262626] border border-[#2F2F2F] hover:border-white/20 text-xs font-semibold text-[#E5E5E5] transition-all cursor-pointer"
                title="Share profile link"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-[#9CA3AF]" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('workspace')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-xs font-semibold text-[#60A5FA] hover:text-white transition-all cursor-pointer"
                title="Open Creation Workspace"
              >
                <Sparkles className="h-4 w-4 text-[#60A5FA]" />
                <span>Create Video</span>
              </button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onNavigate('profile-details')}
              >
                <UserRound className="h-4 w-4" />
                Edit profile
              </Button>
            </div>
          </div>
        </header>

        {/* Common Creator Profile Identity Section */}
        <div className="p-5 sm:p-6 bg-[#141414]">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              {profile.avatarUrl || user?.avatarUrl ? (
                <img
                  src={profile.avatarUrl || user?.avatarUrl}
                  alt={`${displayName}'s profile`}
                  className="h-20 w-20 rounded-2xl border border-[#2F2F2F] bg-[#121212] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#2F2F2F] bg-[#161616] text-[#60A5FA]">
                  <UserRound className="h-9 w-9" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-bold tracking-tight text-white">{displayName}</h2>
                  {(user?.verified !== false) && <Badge variant="green">Verified account</Badge>}
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#60A5FA] border border-blue-500/20 font-mono-studio font-semibold">
                    Pro Creator
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-[#9CA3AF]">{user?.email || 'durgumkumar2011@gmail.com'}</p>
                {profile.creatorHandle && <p className="mt-1 text-sm font-medium text-[#60A5FA]">{profile.creatorHandle}</p>}
                <p className="mt-2.5 max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-[#CBD5E1]">
                  {profile.bio || 'Add a short bio to introduce your creator profile.'}
                </p>

                {/* Profile Social Links Strip */}
                {profileLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
                    {profileLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] border border-[#2F2F2F] text-xs text-[#CBD5E1] hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-[#60A5FA]" />
                        <span>{link.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Unified Section Navigation Tabs & Active Page Content ── */}
      <section className="rounded-2xl border border-[#2F2F2F] bg-[#141414] overflow-hidden divide-y divide-[#2F2F2F]">
        {/* Section Navigation Tabs Bar */}
        <nav
          aria-label="Profile sections"
          className="profile-section-scrollbar sticky top-0 z-20 flex shrink-0 items-center justify-between gap-2 overflow-x-auto bg-[#141414]/95 p-2 backdrop-blur-2xl"
        >
          <div className="flex items-center gap-1.5 min-w-max">
            {sections.map((section) => {
              const selected = activePage === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => onNavigate(section.id)}
                  className={`group relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 cursor-pointer ${
                    selected
                      ? 'border-[#3B82F6]/50 bg-[#1E293B] text-white'
                      : 'border-transparent text-[#9CA3AF] hover:border-[#2F2F2F] hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                    selected
                      ? 'bg-[#3B82F6]/20 text-[#60A5FA]'
                      : 'text-[#737373] group-hover:text-[#D4D4D4]'
                  }`}>
                    {section.icon}
                  </span>
                  <span>{section.label}</span>
                  {selected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 pr-1 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1.5 text-xs font-semibold text-[#60A5FA] transition-all hover:border-[#3B82F6]/60 hover:bg-[#3B82F6]/20 hover:text-white cursor-pointer"
              title="Open Video Creation Studio"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#60A5FA]" />
              <span>Studio</span>
            </button>
          </div>
        </nav>

        {/* Active Sub-Page Content Container */}
        <div className="p-5 sm:p-6 bg-[#141414]">
          {children}
        </div>
      </section>
    </div>
  );
}
