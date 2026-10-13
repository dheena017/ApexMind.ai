import React from 'react';
import { Heart, MessageCircle, Share2, Disc, ShieldAlert } from 'lucide-react';

export interface CanvasSafeZonesOverlayProps {
  isVisible: boolean;
  platform?: 'shorts' | 'reels' | 'tiktok';
}

export const CanvasSafeZonesOverlay: React.FC<CanvasSafeZonesOverlayProps> = ({
  isVisible,
  platform = 'shorts',
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 select-none transition-opacity duration-200">
      {/* ── Top Header Safe Buffer (10%) ── */}
      <div className="w-full pt-1 pb-2 border-b border-dashed border-red-500/50 bg-red-500/10 rounded-t-lg flex items-center justify-between px-2">
        <span className="text-[9px] font-mono-studio font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-red-400" /> Top System Header Buffer
        </span>
        <span className="text-[8px] font-mono-studio text-red-400">Avoid Titles Here</span>
      </div>

      {/* ── Center Safe Production Area ── */}
      <div className="flex-1 my-2 border-2 border-dashed border-emerald-400/40 bg-emerald-500/5 rounded-xl flex items-center justify-center relative">
        <span className="text-[9px] font-mono-studio text-emerald-400/70 uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-black/40">
          Target Safe Zone (1080×1920)
        </span>

        {/* Right-Hand Social Action Strip Simulation (Like, Comment, Share, Sound Disc) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 p-1.5 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10">
          <div className="flex flex-col items-center gap-0.5">
            <Heart className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[7px] text-amber-300 font-mono-studio">Like</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[7px] text-amber-300 font-mono-studio">Reply</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Share2 className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[7px] text-amber-300 font-mono-studio">Share</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Disc className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span className="text-[7px] text-amber-300 font-mono-studio">Sound</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Caption & Profile Buffer (20%) ── */}
      <div className="w-full pt-2 pb-1 border-t border-dashed border-red-500/50 bg-red-500/10 rounded-b-lg flex flex-col gap-0.5 px-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono-studio font-bold text-red-300 uppercase tracking-wider">
            Bottom UI Buffer (@Channel • Caption • Audio Title)
          </span>
          <span className="text-[8px] font-mono-studio text-red-400">Keep Subtitles Above</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasSafeZonesOverlay;
