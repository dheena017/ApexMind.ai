import React from 'react';
import { Film, Clock, Sparkles, Mic, Layers } from 'lucide-react';
import { Card } from '@/src/shared/ui/common';
import { WebsiteVideo } from '../types';

interface VideoMetricsBarProps {
  videos: WebsiteVideo[];
}

export const VideoMetricsBar: React.FC<VideoMetricsBarProps> = ({ videos }) => {
  // Compute top category
  const categoryCounts: Record<string, number> = {};
  videos.forEach((v) => {
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
  });
  const topCategory =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Stoic Mindset';

  // Compute unique voices
  const uniqueVoices = new Set(videos.map((v) => v.voice)).size;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#161616] to-[#121212] border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
            Website Videos
          </span>
          <div className="p-2 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
            <Film className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white mt-2.5 font-mono-studio">
          {videos.length}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mt-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 font-medium">Studio Rendered</span>
          <span className="text-[#6B7280]">· Website Only</span>
        </div>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-[#161616] to-[#121212] border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
            Total Content Runtime
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white mt-2.5 font-mono-studio">
          {`~${Math.max(1, Math.round(videos.length * 0.5))} mins`}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mt-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Full HD 9:16 Short Formats</span>
        </div>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-[#161616] to-[#121212] border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
            Leading Niche
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base sm:text-lg font-bold text-white mt-2.5 truncate" title={topCategory}>
          {topCategory}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mt-1.5">
          <span className="text-amber-400 font-medium">AI Negative Deduplicated</span>
        </div>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-[#161616] to-[#121212] border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
            AI Voices Utilized
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Mic className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white mt-2.5 font-mono-studio">
          {uniqueVoices || 1} Personas
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cyan-400 mt-1.5">
          <span>Gemini 24kHz Studio Audio</span>
        </div>
      </Card>
    </div>
  );
};
