/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/PublishingTab.tsx
 */

import React from 'react';
import { Share2, CheckCircle2 } from 'lucide-react';

export interface PlatformConfig {
  id: string;
  label: string;
}

export const DEFAULT_PLATFORMS: PlatformConfig[] = [
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'instagram', label: 'Instagram Reels' },
  { id: 'facebook', label: 'Facebook Reels' },
];

interface PublishingTabProps {
  enabledPlatforms: Record<string, boolean>;
  onTogglePlatform: (platformId: string) => void;
  platforms?: PlatformConfig[];
}

export const PublishingTab: React.FC<PublishingTabProps> = ({
  enabledPlatforms,
  onTogglePlatform,
  platforms = DEFAULT_PLATFORMS,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="text-[10px] font-mono-studio text-[#9CA3AF]">
        <span className="font-semibold uppercase flex items-center gap-1.5">
          <Share2 className="w-3 h-3 text-[#3B82F6]" />
          <span>Syndication Channels</span>
        </span>
      </div>
      <p className="text-[11px] text-[#8E8E93] leading-relaxed">
        Choose target video platforms to automatically tailor aspect ratio and tags for export.
      </p>
      <div className="space-y-1.5">
        {platforms.map((item) => {
          const active = Boolean(enabledPlatforms[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTogglePlatform(item.id)}
              aria-pressed={active}
              className={`w-full min-h-10 px-3 rounded-lg border text-[11px] font-medium flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60 ${
                active
                  ? 'bg-[#1A2234] border-[#3B82F6]/50 text-white'
                  : 'bg-[#18181C] border-[#24242A] text-[#A1A1AA] hover:text-white hover:bg-[#1A2234]/60 hover:border-[#3B82F6]/40'
              }`}
            >
              <span>{item.label}</span>
              {active ? (
                <CheckCircle2 className="w-4 h-4 text-[#60A5FA]" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-[#52525B]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

