import React, { useState } from 'react';
import { Card, Button } from '@/src/shared/ui/common';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';

const inputClass = 'w-full rounded-xl border border-[#2F2F2F] bg-[#121212] px-3.5 py-2.5 text-sm text-[#E5E5E5] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]';

export default function ProfileDetailsPage() {
  const { profile, setProfile, save, error, user } = useCreatorProfileSettings();
  const [notice, setNotice] = useState<string | null>(null);
  const [displayNameEdited, setDisplayNameEdited] = useState(false);
  const [avatarUrlEdited, setAvatarUrlEdited] = useState(false);

  const field = (label: string, key: 'displayName' | 'creatorHandle' | 'avatarUrl' | 'websiteUrl' | 'instagramUrl' | 'tiktokUrl' | 'youtubeUrl', type = 'text', placeholder?: string) => (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={
          key === 'displayName' && !displayNameEdited
            ? profile.displayName || user?.name || ''
            : key === 'avatarUrl' && !avatarUrlEdited
              ? profile.avatarUrl || user?.avatarUrl || ''
              : profile[key]
        }
        onChange={(event) => {
          if (key === 'displayName') setDisplayNameEdited(true);
          if (key === 'avatarUrl') setAvatarUrlEdited(true);
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
    const profileToSave = {
      ...profile,
      displayName: !displayNameEdited ? profile.displayName || user?.name || '' : profile.displayName,
      avatarUrl: !avatarUrlEdited ? profile.avatarUrl || user?.avatarUrl || '' : profile.avatarUrl,
    };
    setNotice(save(profileToSave) ? 'Creator details saved on this browser.' : null);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Creator details</h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">Manage your public creator identity and profile links.</p>
      </header>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('Display name', 'displayName', 'text', 'Enter your public creator name')}
            <label className="block space-y-1.5">
              <span className={labelClass}>Account email</span>
              <input value={user?.email || ''} readOnly className={`${inputClass} cursor-not-allowed text-[#777]`} />
            </label>
            {field('Creator handle', 'creatorHandle', 'text', '@yourchannel')}
            {field('Avatar image URL', 'avatarUrl', 'url', 'Paste an image URL')}
            {field('Website', 'websiteUrl', 'url', 'https://yourwebsite.com')}
            {field('Instagram profile', 'instagramUrl', 'url', 'https://instagram.com/yourname')}
            {field('TikTok profile', 'tiktokUrl', 'url', 'https://tiktok.com/@yourname')}
            {field('YouTube profile', 'youtubeUrl', 'url', 'https://youtube.com/@yourchannel')}
          </div>
          <label className="block space-y-1.5">
            <span className={labelClass}>Short bio</span>
            <textarea
              value={profile.bio}
              onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
              className={`${inputClass} min-h-28 resize-y`}
              maxLength={280}
              placeholder="What do you create and who do you create it for?"
            />
            <span className="block text-right text-[11px] text-[#6B7280]">{profile.bio.length}/280</span>
          </label>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
          <div className="flex justify-end">
            <Button type="submit" variant="primary">Save creator details</Button>
          </div>
        </form>
        <p className="mt-4 border-t border-[#2F2F2F] pt-4 text-xs text-[#6B7280]">
          Details are stored in this browser for this signed-in profile and are not synced to other devices.
        </p>
      </Card>
    </div>
  );
}
