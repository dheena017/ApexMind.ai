import React, { useState } from 'react';
import { Settings, Key, ShieldCheck, Youtube, Sliders, Bell, CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Badge } from '@/src/shared/ui/common';

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
    <div className="flex-1 w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
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
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Default Gemini Voiceover</label>
              <select
                value={defaultVoice}
                onChange={(e) => setDefaultVoice(e.target.value)}
                className="w-full bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] rounded-xl p-3 outline-none focus:border-[#3B82F6]"
              >
                <option value="Fenrir">Fenrir (Male · Deep & Powerful)</option>
                <option value="Kore">Kore (Female · Inspiring & Authoritative)</option>
                <option value="Zephyr">Zephyr (Female · Calm Wisdom)</option>
                <option value="Puck">Puck (Male · High-Octane Motivational)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Default Non-Copyright Music Track</label>
              <select
                value={defaultMusic}
                onChange={(e) => setDefaultMusic(e.target.value)}
                className="w-full bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] rounded-xl p-3 outline-none focus:border-[#3B82F6]"
              >
                <option value="Ambient Motivation">Ambient Motivation (Cinematic Ambient)</option>
                <option value="Cinematic Triumph">Cinematic Triumph (Orchestral Hybrid)</option>
                <option value="Epic Growth">Epic Growth (Deep Synthwave)</option>
                <option value="Lo-Fi Chill Discipline">Lo-Fi Chill Discipline (Lo-Fi Beats)</option>
              </select>
            </div>

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
