import { Activity, ArrowRight, BadgeCheck, CheckCircle2, Circle, ExternalLink, LockKeyhole, Settings2, ShieldCheck, Sparkles, Star, UserRound, WalletCards, Youtube } from 'lucide-react';
import { Badge, Button, Card } from '@/src/shared/ui/common';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';
import { useCreatorStudioData } from '../hooks/useCreatorStudioData';

const profilePages = [
  { id: 'profile-details', title: 'Creator details', description: 'Update your display name, bio, avatar, and social links.', icon: <BadgeCheck className="h-5 w-5" /> },
  { id: 'profile-preferences', title: 'Content preferences', description: 'Set your default niche, tone, audience, and voice for the Studio.', icon: <Settings2 className="h-5 w-5" /> },
  { id: 'profile-channels', title: 'YouTube channels', description: 'Review connected channels or connect and disconnect accounts.', icon: <Youtube className="h-5 w-5" /> },
  { id: 'profile-activity', title: 'Activity & milestones', description: 'See recent scripts, Shorts, and earned creator badges.', icon: <Activity className="h-5 w-5" /> },
  { id: 'profile-usage', title: 'Studio activity', description: 'Review your saved creation counts and connected channels.', icon: <WalletCards className="h-5 w-5" /> },
  { id: 'profile-security', title: 'Account security', description: 'Review your sign-in provider and available account protections.', icon: <LockKeyhole className="h-5 w-5" /> },
];

export default function ProfilePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { profile, user } = useCreatorProfileSettings();
  const { channels, videos, stats, scripts, loading, error } = useCreatorStudioData();
  const displayName = profile.displayName.trim() || user?.name || 'Creator';
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
  ].filter((link) => link.value.trim());
  const recentActivity = [
    ...scripts.map((script) => ({
      id: `script-${script.id}`,
      title: script.title || 'Generated script',
      detail: script.category || 'Script',
      date: script.generated_at,
      icon: <Sparkles className="h-4 w-4" />,
      className: 'bg-[#3B82F6]/10 text-[#60A5FA]',
    })),
    ...videos.map((video) => ({
      id: `short-${video.id}`,
      title: video.title || 'YouTube Short',
      detail: `${video.category || 'Short'} · ${video.status}`,
      date: video.publishedAt,
      icon: <Youtube className="h-4 w-4" />,
      className: 'bg-red-500/10 text-red-400',
    })),
  ].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()).slice(0, 5);
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
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#60A5FA]">Your creator space</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Creator profile</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">Your creator identity, studio activity, and account setup in one place.</p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={() => onNavigate('profile-details')}>
          <UserRound className="h-4 w-4" />
          Edit profile
        </Button>
      </header>

      <Card className="bg-gradient-to-r from-[#1E1E1E] via-[#242424] to-[#1E1E1E]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            {profile.avatarUrl || user?.avatarUrl ? (
              <img
                src={profile.avatarUrl || user?.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-2xl border border-[#2F2F2F] bg-[#121212] object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2F2F2F] bg-[#121212] text-[#60A5FA]">
                <UserRound className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-white">{displayName}</h2>
                {user?.verified && <Badge variant="green">Verified account</Badge>}
              </div>
              <p className="mt-1 truncate text-xs text-[#9CA3AF]">{user?.email || 'No email on file'}</p>
              {profile.creatorHandle && <p className="mt-1 text-sm text-[#60A5FA]">{profile.creatorHandle}</p>}
              <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm text-[#B8B8B8]">{profile.bio || 'Add a short bio to introduce your creator profile.'}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
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
              ['Account email', user?.email || 'Not available'],
              ['Bio', profile.bio || 'Not added'],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-[#6B7280]">{label}</dt>
                <dd className="mt-1 break-words text-sm text-[#E5E5E5]">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-[#2F2F2F] pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Public links</h3>
            {profileLinks.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {profileLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={/^https?:\/\//i.test(link.value) ? link.value : undefined}
                      target={/^https?:\/\//i.test(link.value) ? '_blank' : undefined}
                      rel={/^https?:\/\//i.test(link.value) ? 'noreferrer' : undefined}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#2F2F2F] bg-[#121212] px-3 py-2 text-xs text-[#60A5FA] hover:border-[#3B82F6]/40 hover:text-white"
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
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Content preferences</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Defaults used when you create new content.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-preferences')}>Edit preferences</Button>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Niche', profile.niche],
              ['Preferred tone', profile.tone],
              ['Default voice', profile.defaultVoice],
              ['Target audience', profile.audience],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl border border-[#2F2F2F] bg-[#121212] p-3">
                <dt className="text-xs text-[#6B7280]">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-[#E5E5E5]">{value || 'Not set'}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
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
                <li key={channel.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#2F2F2F] bg-[#121212] p-3">
                  {channel.avatarUrl
                    ? <img src={channel.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400"><Youtube className="h-5 w-5" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{channel.name}</span>
                      {channel.verified && <Badge variant="green">Verified</Badge>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#9CA3AF]">{channel.handle} · {channel.subscribers.toLocaleString()} subscribers</span>
                    <span className="mt-0.5 block text-[11px] text-[#6B7280]">{channel.niche} · {channel.videosUploaded.toLocaleString()} videos</span>
                    <span className="mt-0.5 block text-[11px] text-[#6B7280]">
                      Connected {formatDate(channel.connectedAt)} · Auto-publish {channel.isAutoUploadEnabled ? 'on' : 'off'}
                    </span>
                    {channel.isAutoUploadEnabled && channel.scheduleCron && (
                      <span className="mt-0.5 block text-[11px] text-[#6B7280]">Schedule: {channel.scheduleCron}</span>
                    )}
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
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Account & usage</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Sign-in status and your studio activity.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-security')}>Security</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Sign-in provider', user?.provider || 'Unknown'],
              ['Email verification', user?.verified ? 'Verified' : 'Not verified'],
              ['Scripts generated', (stats?.totalQuotesGenerated ?? scripts.length).toLocaleString()],
              ['Shorts created', (stats?.totalShortsGenerated ?? videos.length).toLocaleString()],
              ['Total views', (stats?.totalViews ?? 0).toLocaleString()],
              ['Total likes', (stats?.totalLikes ?? 0).toLocaleString()],
              ['Active channels', (stats?.activeChannelsCount ?? channels.length).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#2F2F2F] bg-[#121212] p-3">
                <p className="text-xs text-[#6B7280]">{label}</p>
                <p className="mt-1 text-sm font-semibold capitalize text-[#E5E5E5]">{loading && label !== 'Sign-in provider' && label !== 'Email verification' ? '—' : value}</p>
              </div>
            ))}
          </div>
          {user?.lastLoginAt && <p className="mt-3 text-xs text-[#6B7280]">Last sign-in: {formatDate(user.lastLoginAt)}</p>}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-[#B8B8B8]">Two-factor authentication and session management are not available in this app.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Creator badges</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Milestones from your real studio activity.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-activity')}>View activity</Button>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {profileBadges.map((badge) => (
              <li key={badge.name} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${badge.value === badge.goal ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-[#2F2F2F] bg-[#121212] text-[#6B7280]'}`}>
                <span className="mt-0.5">{badge.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[#E5E5E5]">{badge.name}</span>
                  <span className="mt-0.5 block text-xs">{badge.value === badge.goal ? 'Earned' : `${badge.description} · ${badge.value}/${badge.goal}`}</span>
                </span>
                {badge.value === badge.goal && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-label="Earned" />}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Recent activity</h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">Your latest scripts and Shorts.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => onNavigate('profile-activity')}>See all</Button>
          </div>
          {loading ? <p className="text-sm text-[#9CA3AF]">Loading recent activity…</p> : recentActivity.length ? (
            <ul className="divide-y divide-[#2F2F2F]">
              {recentActivity.map((item) => (
                <li key={item.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`rounded-lg p-2 ${item.className}`}>{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#9CA3AF]">{item.detail}</span>
                  </span>
                  <time className="shrink-0 text-xs text-[#6B7280]">{formatDate(item.date)}</time>
                </li>
              ))}
            </ul>
          ) : <p className="py-5 text-center text-sm text-[#9CA3AF]">Your generated scripts and Shorts will appear here.</p>}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Your profile setup</h2>
            <p className="mt-1 text-sm text-[#9CA3AF]">A few quick steps can make your Studio feel more like yours.</p>
          </div>
          <Badge variant={completedCount === completion.length ? 'green' : 'blue'}>
            {completedCount} of {completion.length} complete
          </Badge>
        </div>
        {error && <p role="alert" className="mt-3 text-xs text-amber-300">{error}</p>}
        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-[#121212]"
          role="progressbar"
          aria-label="Profile setup progress"
          aria-valuemin={0}
          aria-valuemax={completion.length}
          aria-valuenow={completedCount}
          aria-valuetext={`${completedCount} of ${completion.length} setup steps complete`}
        >
          <div className="h-full rounded-full bg-[#3B82F6] transition-all" style={{ width: `${(completedCount / completion.length) * 100}%` }} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {setupSteps.map((step, index) => {
            const isComplete = completion[index];
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => onNavigate(step.page)}
                className={`group flex min-h-[76px] items-start gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                  isComplete
                    ? 'border-[#2F2F2F] bg-[#121212]/60 hover:border-emerald-500/30'
                    : index === nextStepIndex
                      ? 'border-[#3B82F6]/30 bg-[#3B82F6]/5 hover:border-[#3B82F6]/60'
                      : 'border-[#2F2F2F] bg-[#121212]/40 hover:border-[#4A4A4A]'
                }`}
              >
                {isComplete
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  : <Circle className={`mt-0.5 h-4 w-4 shrink-0 ${index === nextStepIndex ? 'text-[#60A5FA]' : 'text-[#6B7280]'}`} aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{step.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#6B7280] transition-transform group-hover:translate-x-0.5 group-hover:text-[#60A5FA]" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#9CA3AF]">{step.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        {profilePages.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="text-left focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 rounded-2xl"
          >
            <Card className="h-full transition-colors hover:border-[#3B82F6]/40">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 p-2.5 text-[#60A5FA]">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">{item.description}</p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#6B7280]" />
              </div>
            </Card>
          </button>
        ))}
      </section>
    </div>
  );
}
