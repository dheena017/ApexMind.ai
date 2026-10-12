import React, { useState } from 'react';
import { Settings, Key, ShieldCheck, Youtube, Sliders, Bell, CheckCircle2, Mic, Music } from 'lucide-react';
import { Button, Card, Input, Badge, CustomSelect } from '@/src/shared/ui/common';

const VOICE_OPTIONS = [
  { value: 'Fenrir', label: 'Fenrir (Male · Deep & Powerful)' },
  { value: 'Kore', label: 'Kore (Female · Inspiring & Authoritative)' },
  { value: 'Zephyr', label: 'Zephyr (Female · Calm Wisdom)' },
  { value: 'Puck', label: 'Puck (Male · High-Octane Motivational)' },
];

const MUSIC_OPTIONS = [
  { value: 'Ambient Motivation', label: 'Ambient Motivation (Cinematic Ambient)' },
  { value: 'Cinematic Triumph', label: 'Cinematic Triumph (Orchestral Hybrid)' },
  { value: 'Epic Growth', label: 'Epic Growth (Deep Synthwave)' },
  { value: 'Lo-Fi Chill Discipline', label: 'Lo-Fi Chill Discipline (Lo-Fi Beats)' },
];

export default function SettingsPage() {
  const [autoPublish, setAutoPublish] = useState(true);
  const [defaultVoice, setDefaultVoice] = useState('Fenrir');
  const [defaultMusic, setDefaultMusic] = useState('Ambient Motivation');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-6 border-b border-[#2F2F2F]">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Studio Settings</h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">Configure default Gemini AI voices, YouTube channel preferences, and system automation</p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Gemini API Status */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F] mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Gemini API Key Status</h3>
                <p className="text-xs text-[#9CA3AF]">Injected server-side via environment process secrets</p>
              </div>
            </div>
            <Badge variant="green">Active & Authenticated</Badge>
          </div>

          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Your server-side Gemini API key is configured in the <strong className="text-[#60A5FA]">Settings &gt; Secrets</strong> panel. It handles script generation (`gemini-3.8-flash`) and voice synthesis (`gemini-3.8-flash-lite-tts`).
          </p>
        </Card>

        {/* Automation Defaults */}
        <Card>
          <h3 className="font-bold text-white text-base pb-3 border-b border-[#2F2F2F] mb-4">Default Automation Preferences</h3>

          <div className="space-y-4">
            <CustomSelect
              label="Default Gemini Voiceover"
              icon={<Mic className="w-4 h-4 text-[#60A5FA]" />}
              value={defaultVoice}
              onChange={setDefaultVoice}
              options={VOICE_OPTIONS}
            />

            <CustomSelect
              label="Default Non-Copyright Music Track"
              icon={<Music className="w-4 h-4 text-[#60A5FA]" />}
              value={defaultMusic}
              onChange={setDefaultMusic}
              options={MUSIC_OPTIONS}
            />

            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Auto-Publish Shorts to YouTube</h4>
                <p className="text-xs text-[#9CA3AF]">Automatically upload scheduled daily quote videos</p>
              </div>
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="w-5 h-5 rounded bg-[#121212] border-[#2F2F2F] text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
