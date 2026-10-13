import React, { useState } from 'react';
import { UserRound, Save } from 'lucide-react';
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
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA]">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Edit Creator Details</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">Update your public creator identity, avatar photo, and social presence.</p>
          </div>
        </div>
      </div>
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
          <Button type="submit" variant="primary">
            <Save className="h-4 w-4" />
            <span>Save creator details</span>
          </Button>
        </div>
      </form>
      <p className="mt-4 border-t border-[#262626] pt-4 text-xs text-[#6B7280]">
        Details are stored in this browser for this signed-in profile and are not synced to other devices.
      </p>
    </div>
  );
}
