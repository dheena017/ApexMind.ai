import React, { useState } from 'react';
import { Button, Card } from '@/src/shared/ui/common';
import { useCreatorProfileSettings } from '../hooks/useCreatorProfileSettings';

const inputClass = 'w-full rounded-xl border border-[#2F2F2F] bg-[#121212] px-3.5 py-2.5 text-sm text-[#E5E5E5] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]';

export default function ProfilePreferencesPage() {
  const { profile, setProfile, save, error } = useCreatorProfileSettings();
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(save(profile) ? 'Creator preferences saved. They will be used by the Creation Studio.' : null);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Content preferences</h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">Set defaults for new scripts and voiceovers in the Creation Studio.</p>
      </header>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-1.5">
            <span className={labelClass}>Niche / default category</span>
            <select value={profile.niche} onChange={(event) => setProfile((current) => ({ ...current, niche: event.target.value }))} className={inputClass}>
              {[
                'Stoic Mindset & Discipline',
                'Morning Energy & Grit',
                'Fitness & Power',
                'Financial Freedom',
                'Dark Psychology & Focus',
                'Warrior Mentality & Resilience',
              ].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Preferred tone</span>
            <select value={profile.tone} onChange={(event) => setProfile((current) => ({ ...current, tone: event.target.value }))} className={inputClass}>
              {['Authoritative & Inspiring', 'Calm & Reflective', 'Energetic & Bold', 'Warm & Encouraging'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Default voice</span>
            <select value={profile.defaultVoice} onChange={(event) => setProfile((current) => ({ ...current, defaultVoice: event.target.value }))} className={inputClass}>
              {['Fenrir', 'Kore', 'Puck', 'Zephyr', 'Charon'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Target audience</span>
            <input
              value={profile.audience}
              onChange={(event) => setProfile((current) => ({ ...current, audience: event.target.value }))}
              className={inputClass}
              maxLength={120}
              placeholder="e.g. busy professionals building better habits"
            />
          </label>
          <p className="text-xs leading-relaxed text-[#6B7280]">
            The niche and tone are sent with script generation. The target audience is included in the generation prompt, and the default voice is selected for voiceovers.
          </p>
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
          <div className="flex justify-end">
            <Button type="submit" variant="primary">Save preferences</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
