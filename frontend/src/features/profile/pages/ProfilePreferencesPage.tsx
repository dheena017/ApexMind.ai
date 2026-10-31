import React, { useState } from 'react';
import { Sliders, Save } from 'lucide-react';
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
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Content &amp; Studio Preferences</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">Set default niche, tone, voice, and audience parameters for script &amp; video generation.</p>
          </div>
        </div>
      </div>
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
          <Button type="submit" variant="primary">
            <Save className="h-4 w-4" />
            <span>Save preferences</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
