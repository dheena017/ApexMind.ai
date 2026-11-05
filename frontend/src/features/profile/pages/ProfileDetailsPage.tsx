import React, { useState, useEffect } from 'react';
import { UserRound, Save, CheckCircle2, Clock, Mail, KeyRound } from 'lucide-react';
import { Button, Badge } from '@/src/shared/ui/common';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';

const inputClass = 'w-full rounded-xl border border-[#2F2F2F] bg-[#121212] px-3.5 py-2.5 text-sm text-[#E5E5E5] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]';

function formatPrettyDate(dateStr?: string | null): string {
  if (!dateStr) return 'Active';
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

  // Initialize profile with user's login information if fields are empty
  useEffect(() => {
    if (!user) return;
    setProfile((prev) => ({
      ...prev,
      displayName: prev.displayName.trim() || user.name || '',
      creatorHandle: prev.creatorHandle.trim() || (user.email ? `@${user.email.split('@')[0]}` : ''),
      avatarUrl: prev.avatarUrl || user.avatarUrl || '',
    }));
  }, [user, setProfile]);

  const field = (
    label: string,
    key: 'displayName' | 'creatorHandle' | 'avatarUrl' | 'bannerUrl' | 'websiteUrl' | 'instagramUrl',
    type = 'text',
    placeholder?: string
  ) => (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={profile[key] || ''}
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
    setNotice(save(profile) ? 'User profile details saved successfully.' : null);
  };

  const authProviderLabel = user?.provider
    ? user.provider === 'google'
      ? 'Google Account'
      : user.provider === 'email'
        ? 'Email & Password'
        : user.provider
    : 'ApexMind Account';

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
            <h2 className="text-lg font-bold text-white">Edit User Profile</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Manage your personal account details, display name, and profile settings.
            </p>
          </div>
        </div>

        <Badge variant="blue">
          <CheckCircle2 className="w-3 h-3 inline mr-1 text-sky-400" />
          {user?.verified !== false ? 'Verified Account' : 'Active Account'}
        </Badge>
      </div>

      {/* ── Account Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-[#27272A] bg-[#121214] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Account Email</p>
            <p className="text-xs sm:text-sm font-bold text-white truncate" title={user?.email || '—'}>
              {user?.email || '—'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#27272A] bg-[#121214] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Sign-In Provider</p>
            <p className="text-xs sm:text-sm font-bold text-white capitalize truncate">
              {authProviderLabel}
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

      {/* ── User Profile Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Display name', 'displayName', 'text', 'Enter your name')}
          
          <label className="block space-y-1.5">
            <span className={labelClass}>Account email</span>
            <input
              value={user?.email || ''}
              placeholder={user?.provider === 'instagram' || user?.provider === 'facebook' ? 'Not shared by provider' : '—'}
              readOnly
              className={`${inputClass} cursor-not-allowed text-[#888]`}
            />
          </label>

          {field('Username / handle', 'creatorHandle', 'text', '@yourhandle')}
          {field('Profile photo URL', 'avatarUrl', 'url', 'https://...')}
          {field('Cover banner image URL', 'bannerUrl', 'url', 'https://...')}
          {field('Personal website', 'websiteUrl', 'url', 'https://yourwebsite.com')}
          {field('Instagram profile', 'instagramUrl', 'url', 'https://instagram.com/yourhandle')}
        </div>

        <label className="block space-y-1.5">
          <span className={labelClass}>Short bio</span>
          <textarea
            value={profile.bio || ''}
            onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
            className={`${inputClass} min-h-28 resize-y`}
            maxLength={280}
            placeholder="Tell us about yourself..."
          />
          <span className="block text-right text-[11px] text-[#6B7280]">{(profile.bio || '').length}/280</span>
        </label>

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary">
            <Save className="h-4 w-4 mr-1.5" />
            <span>Save profile details</span>
          </Button>
        </div>
      </form>

      <p className="mt-4 border-t border-[#262626] pt-4 text-xs text-[#6B7280]">
        User profile details are stored securely for your authenticated ApexMind account.
      </p>
    </div>
  );
}
