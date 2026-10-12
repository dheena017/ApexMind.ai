import React from 'react';
import { User, ShieldCheck, Award, Zap, Youtube, CheckCircle2, Star } from 'lucide-react';
import { Button, Card, Badge } from '@/src/shared/ui/common';

export default function ProfilePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="flex-1 w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#2F2F2F]">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Creator Profile & Badges</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Manage your ApexMind creator account, channel tiers, and milestones</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate('settings')}>
          Account Settings
        </Button>
      </div>

      {/* User Card */}
      <Card className="bg-gradient-to-r from-[#1E1E1E] via-[#2A2A2A] to-[#1E1E1E] border-[#2F2F2F]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center justify-center text-[#60A5FA] shadow-xl">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">ApexMind Creator Pro</h2>
                <Badge variant="blue">Verified Channel Admin</Badge>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1">creator@apexmind.ai</p>
              <p className="text-xs text-[#60A5FA] font-mono mt-0.5">Creator Studio Account · Active</p>
            </div>
          </div>

          <Button variant="primary" size="sm" icon={<Zap className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
            Open Creation Studio
          </Button>
        </div>
      </Card>

      {/* Achievements & Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">YouTube Shorts Ready</h4>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Automated 9:16 Video Generation</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Gemini TTS Synthesis</h4>
              <p className="text-xs text-[#9CA3AF] mt-0.5">24kHz Audio Voice Synthesis</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Zero Copyright Risk</h4>
              <p className="text-xs text-[#9CA3AF] mt-0.5">100% Free Music & Visual Assets</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage Stats & Quota */}
      <Card>
        <h3 className="text-lg font-bold text-white pb-3 border-b border-[#2F2F2F] mb-4">Gemini API Usage & Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Script Generation (Gemini 3.8 Flash)</span>
              <span className="font-mono text-[#60A5FA] font-bold">Active & Unlimited</span>
            </div>
            <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden">
              <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: '25%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Voiceover TTS Synthesis (24kHz WAV)</span>
              <span className="font-mono text-cyan-400 font-bold">Ready</span>
            </div>
            <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
