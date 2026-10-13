import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  Heart,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Youtube,
} from 'lucide-react';
import { Badge, Button } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';
import { RecentStudioActivity } from '../components/RecentStudioActivity';

export default function ProfilePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { profile, user } = useCreatorProfileSettings();
  const { channels, videos, stats, scripts, loading, error } = useCreatorStudioData();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    onNavigate('landing');
  };

  const displayName = profile.displayName.trim() || user?.name || 'Dheena Dayalan';

  const completion = [
    Boolean((profile.displayName.trim() || user?.name?.trim()) && (profile.avatarUrl.trim() || user?.avatarUrl)),
    Boolean(profile.bio.trim()),
    Boolean(profile.websiteUrl.trim() || profile.instagramUrl.trim() || profile.tiktokUrl.trim() || profile.youtubeUrl.trim()),
    Boolean(profile.niche && profile.tone && profile.defaultVoice),
    channels.length > 0,
  ];
  const completedCount = completion.filter(Boolean).length;

  const setupSteps = [
    { title: 'Personalize your creator identity', description: 'Add a display name and profile photo.', page: 'profile-details' },
    { title: 'Write a short bio', description: 'Tell people what you create and who it is for.', page: 'profile-details' },
    { title: 'Add a public link', description: 'Connect your website or a social profile.', page: 'profile-details' },
    { title: 'Set your content preferences', description: 'Choose defaults for your next script or voiceover.', page: 'profile-preferences' },
    { title: 'Connect a YouTube channel', description: 'Bring your channel activity into the Studio.', page: 'profile-channels' },
  ];
  const nextStepIndex = completion.findIndex((isComplete) => !isComplete);

  const profileLinks = [
    { label: 'Website', value: profile.websiteUrl },
    { label: 'Instagram', value: profile.instagramUrl },
    { label: 'TikTok', value: profile.tiktokUrl },
    { label: 'YouTube', value: profile.youtubeUrl },
  ].filter((link) => link.value && link.value.trim());


  const profileBadges = [
    { name: 'First script', description: 'Generate your first script', value: Math.min(stats?.totalQuotesGenerated ?? scripts.length, 1), goal: 1, icon: <Sparkles className="h-4 w-4" /> },
    { name: 'Storyteller', description: 'Generate 10 scripts', value: Math.min(stats?.totalQuotesGenerated ?? scripts.length, 10), goal: 10, icon: <Star className="h-4 w-4" /> },
    { name: 'First Short', description: 'Create your first Short', value: Math.min(stats?.totalShortsGenerated ?? videos.length, 1), goal: 1, icon: <Youtube className="h-4 w-4" /> },
    { name: 'Channel connected', description: 'Connect a YouTube channel', value: Math.min(channels.length, 1), goal: 1, icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Date unavailable'
      : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full space-y-6 pb-8 font-sans-studio text-[#E5E5E5]">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA]">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Creator Overview &amp; Analytics</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">High-level performance metrics, milestone progress, and creator setup tools.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 cursor-pointer"
          title="Sign out of ApexMind Studio"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* ── 1. The 4 Creator Stat Cards (Matching User Image) ── */}
      <section aria-label="Creator activity summary" className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Scripts generated',
            value: stats?.totalQuotesGenerated ?? scripts.length,
            icon: <Sparkles className="h-4 w-4 text-[#60A5FA]" />,
            color: 'bg-[#3B82F6]/10 border border-[#3B82F6]/20',
          },
          {
            label: 'Shorts created',
            value: stats?.totalShortsGenerated ?? videos.length,
            icon: <Youtube className="h-4 w-4 text-red-400" />,
            color: 'bg-red-500/10 border border-red-500/20',
          },
          {
            label: 'Total views',
            value: stats?.totalViews ?? 0,
            icon: <Eye className="h-4 w-4 text-purple-400" />,
            color: 'bg-purple-500/10 border border-purple-500/20',
          },
          {
            label: 'Total likes',
            value: stats?.totalLikes ?? 0,
            icon: <Heart className="h-4 w-4 text-pink-400" />,
            color: 'bg-pink-500/10 border border-pink-500/20',
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#9CA3AF] tracking-tight">{metric.label}</span>
              <span className={`rounded-xl p-2.5 ${metric.color}`} aria-hidden="true">{metric.icon}</span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono-studio">
              {loading ? '—' : metric.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      {/* ── 2. Complete Your Creator Setup (A great place to start) ── */}
      <div className="rounded-2xl border border-[#2F2F2F] bg-[#141414] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#60A5FA]">A great place to start</p>
            <h2 className="mt-1 text-base font-bold text-white">Complete your creator setup</h2>
            <p className="mt-1 text-sm text-[#9CA3AF]">A few quick steps can make your Studio feel more like yours.</p>
          </div>
          <Badge variant={completedCount === completion.length ? 'green' : 'blue'}>
            {completedCount} of {completion.length} complete
          </Badge>
        </div>
        {error && <p role="alert" className="mt-3 text-xs text-amber-300">{error}</p>}
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#1A1A1A] border border-[#262626]"
          role="progressbar"
          aria-label="Profile setup progress"
          aria-valuemin={0}
          aria-valuemax={completion.length}
          aria-valuenow={completedCount}
          aria-valuetext={`${completedCount} of ${completion.length} setup steps complete`}
        >
          <div className="h-full rounded-full bg-[#3B82F6] transition-all" style={{ width: `${(completedCount / completion.length) * 100}%` }} />
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {setupSteps.map((step, index) => {
            const isComplete = completion[index];
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => onNavigate(step.page)}
                className={`group flex min-h-[64px] items-start gap-2.5 rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] cursor-pointer ${
                  isComplete
                    ? 'border-[#262626] bg-[#121212] hover:border-[#3B82F6]/40'
                    : index === nextStepIndex
                      ? 'border-[#3B82F6]/40 bg-[#3B82F6]/5 hover:border-[#3B82F6]/70'
                      : 'border-[#262626] bg-[#121212]/60 hover:border-[#3B82F6]/40'
                }`}
              >
                {isComplete
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  : <Circle className={`mt-0.5 h-4 w-4 shrink-0 ${index === nextStepIndex ? 'text-[#60A5FA]' : 'text-[#6B7280]'}`} aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{step.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6B7280] transition-transform group-hover:translate-x-0.5 group-hover:text-[#60A5FA]" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[#9CA3AF]">{step.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Creator Details & Content Preferences Quick Cards ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#2F2F2F] bg-[#141414] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Creator details</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Your profile information and public links.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-details')}>Edit details</Button>
          </div>
          <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {[
              ['Display name', displayName],
              ['Creator handle', profile.creatorHandle || 'Not added'],
              ['Avatar image', profile.avatarUrl ? 'Custom image' : user?.avatarUrl ? 'Using account photo' : 'Not added'],
              ['Account email', user?.email || 'durgumkumar2011@gmail.com'],
              ['Bio', profile.bio || 'Not added'],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-[#6B7280]">{label}</dt>
                <dd className="mt-1 break-words text-sm text-[#E5E5E5]">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-[#262626] pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Public links</h3>
            {profileLinks.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {profileLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={/^https?:\/\//i.test(link.value) ? link.value : undefined}
                      target={/^https?:\/\//i.test(link.value) ? '_blank' : undefined}
                      rel={/^https?:\/\//i.test(link.value) ? 'noreferrer' : undefined}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#2F2F2F] bg-[#121212] px-3 py-2 text-xs text-[#60A5FA] hover:border-[#3B82F6]/40 hover:text-white transition-colors"
                    >
                      <span className="truncate">{link.label}: {link.value}</span>
                      {/^https?:\/\//i.test(link.value) && <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#6B7280]">No public links added yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2F2F2F] bg-[#141414] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Content preferences</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Defaults used when you create new content.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-preferences')}>Edit preferences</Button>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Niche', profile.niche],
              ['Preferred tone', profile.tone],
              ['Default voice', profile.defaultVoice],
              ['Target audience', profile.audience],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl border border-[#262626] bg-[#121212] p-3">
                <dt className="text-xs text-[#6B7280]">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-[#E5E5E5]">{value || 'Not set'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── 4. Connected Channels & Account Usage Cards ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#2F2F2F] bg-[#141414] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Connected channels</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Your linked YouTube accounts.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-channels')}>Manage</Button>
          </div>
          {loading ? <p className="text-sm text-[#9CA3AF]">Loading channels…</p> : channels.length ? (
            <ul className="space-y-3">
              {channels.map((channel) => (
                <li key={channel.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#262626] bg-[#121212] p-3">
                  {channel.avatarUrl
                    ? <img src={channel.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover border border-[#2F2F2F]" />
                    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"><Youtube className="h-5 w-5" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{channel.name}</span>
                      {channel.verified && <Badge variant="green">Verified</Badge>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#9CA3AF] font-mono-studio">{channel.handle} · {channel.subscribers.toLocaleString()} subscribers</span>
                    <span className="mt-0.5 block text-[11px] text-[#6B7280]">{channel.niche} · {channel.videosUploaded.toLocaleString()} videos</span>
                    <span className="mt-0.5 block text-[11px] text-[#6B7280]">
                      Connected {formatDate(channel.connectedAt)} · Auto-publish {channel.isAutoUploadEnabled ? 'on' : 'off'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-[#2F2F2F] px-4 py-6 text-center">
              <Youtube className="mx-auto h-6 w-6 text-[#6B7280]" />
              <p className="mt-2 text-sm text-[#9CA3AF]">No YouTube channels connected.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onNavigate('profile-channels')}>Connect a channel</Button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#2F2F2F] bg-[#141414] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Account & usage</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Sign-in status and your studio activity.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-security')}>Security</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Sign-in provider', user?.provider || 'ApexMind Auth'],
              ['Email verification', user?.verified !== false ? 'Verified' : 'Not verified'],
              ['Scripts generated', (stats?.totalQuotesGenerated ?? scripts.length).toLocaleString()],
              ['Shorts created', (stats?.totalShortsGenerated ?? videos.length).toLocaleString()],
              ['Total views', (stats?.totalViews ?? 0).toLocaleString()],
              ['Total likes', (stats?.totalLikes ?? 0).toLocaleString()],
              ['Active channels', (stats?.activeChannelsCount ?? channels.length).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                <p className="text-xs text-[#6B7280]">{label}</p>
                <p className="mt-1 text-sm font-semibold capitalize text-[#E5E5E5] font-mono-studio">{loading && label !== 'Sign-in provider' && label !== 'Email verification' ? '—' : value}</p>
              </div>
            ))}
          </div>
          {user?.lastLoginAt && <p className="mt-3 text-xs text-[#6B7280]">Last sign-in: {formatDate(user.lastLoginAt)}</p>}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#2F2F2F] bg-[#121212] p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-[#9CA3AF]">Protected creator account with authenticated session security.</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out of ApexMind Studio
          </button>
        </div>
      </div>

      {/* ── 5. Creator Badges & Recent Activity ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#2F2F2F] bg-[#141414] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Creator badges</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Milestones from your real studio activity.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-activity')}>View activity</Button>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {profileBadges.map((badge) => (
              <li key={badge.name} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${badge.value === badge.goal ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-[#262626] bg-[#121212] text-[#6B7280]'}`}>
                <span className="mt-0.5">{badge.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[#E5E5E5] font-medium">{badge.name}</span>
                  <span className="mt-0.5 block text-xs">{badge.value === badge.goal ? 'Earned' : `${badge.description} · ${badge.value}/${badge.goal}`}</span>
                </span>
                {badge.value === badge.goal && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-label="Earned" />}
              </li>
            ))}
          </ul>
        </div>

        <RecentStudioActivity
          limit={5}
          showFilters={false}
          showSearch={false}
          title="Recent activity"
          subtitle="Your latest scripts and Shorts."
          onNavigate={onNavigate}
        />

      </div>
    </div>
  );
}
