import React, { useState, useEffect, useRef } from 'react';
import { Youtube, ChevronDown, Check, Plus, Radio } from 'lucide-react';
import { socialApi } from '@/src/features/social/api/socialApi';
import { SocialAccount } from '@/src/features/social/types';
import { useAuth } from '@/src/features/auth/context/AuthContext';

interface ChannelSwitcherProps {
  onOpenFleetDrawer?: () => void;
  className?: string;
}

export const ChannelSwitcher: React.FC<ChannelSwitcherProps> = ({
  onOpenFleetDrawer,
  className = '',
}) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadChannels = async () => {
    try {
      const fleet = await socialApi.getFleetAccounts();
      const ytChannels = fleet.filter((acc) => acc.platform === 'youtube');
      setChannels(ytChannels);

      // Determine active channel
      const stored = localStorage.getItem('apexmind_yt_active_channel');
      if (stored && ytChannels.some((ch) => ch.handle === stored || ch.id === stored)) {
        setActiveChannelId(stored);
      } else if (ytChannels.length > 0) {
        setActiveChannelId(ytChannels[0].handle || ytChannels[0].id);
        localStorage.setItem('apexmind_yt_active_channel', ytChannels[0].handle || ytChannels[0].id);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadChannels();

    const handleFleetUpdate = () => loadChannels();
    window.addEventListener('social:fleet-updated', handleFleetUpdate);
    return () => window.removeEventListener('social:fleet-updated', handleFleetUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeChannel = channels.find(
    (ch) => ch.handle === activeChannelId || ch.id === activeChannelId
  ) || channels[0];

  const handleSelectChannel = (ch: SocialAccount) => {
    const targetKey = ch.handle || ch.id;
    setActiveChannelId(targetKey);
    localStorage.setItem('apexmind_yt_active_channel', targetKey);
    setIsOpen(false);

    // Broadcast channel switch event to workspace and studio components
    window.dispatchEvent(
      new CustomEvent('youtube:channel-switched', {
        detail: { channel: ch, handle: targetKey },
      })
    );
  };

  if (channels.length === 0) {
    return (
      <button
        type="button"
        onClick={() => {
          if (onOpenFleetDrawer) onOpenFleetDrawer();
          else window.dispatchEvent(new CustomEvent('social:open-fleet-drawer'));
        }}
        className={`flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-xs font-medium text-red-300 hover:text-white transition-all cursor-pointer ${className}`}
        title="Connect YouTube Channel"
      >
        <Youtube className="w-3.5 h-3.5 text-red-400 fill-current" />
        <span className="text-[11px] font-semibold">Connect Channel</span>
        <Plus className="w-3 h-3 text-red-400" />
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 h-7.5 px-2.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#383838] text-xs text-white transition-all cursor-pointer shadow-xs"
        title="Switch Active YouTube Channel"
      >
        <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 bg-red-600 flex items-center justify-center">
          {activeChannel?.avatarUrl ? (
            <img src={activeChannel.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Youtube className="w-2.5 h-2.5 text-white fill-current" />
          )}
        </div>
        <span className="text-[11px] font-semibold text-[#E5E5E5] max-w-[110px] truncate">
          {activeChannel?.name || 'Channel'}
        </span>
        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 hidden sm:inline">
          YT
        </span>
        <ChevronDown className={`w-3 h-3 text-[#737373] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-[#2A2A2A] bg-[#141416]/98 backdrop-blur-xl shadow-2xl p-2 z-50 space-y-1">
          <div className="px-2.5 py-1.5 border-b border-[#242424] flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
              Connected Channels ({channels.length})
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
            {channels.map((ch) => {
              const isSelected = (ch.handle === activeChannelId || ch.id === activeChannelId);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-red-950/40 border border-red-500/30 text-white' : 'hover:bg-[#1E1E22] text-[#D4D4D8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        ch.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ch.name)}`
                      }
                      alt=""
                      className="w-6 h-6 rounded-full object-cover shrink-0 border border-zinc-700"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight text-white">{ch.name}</p>
                      <p className="text-[10px] text-[#A1A1AA] truncate">{ch.handle}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-red-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-[#242424] space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenFleetDrawer) {
                  onOpenFleetDrawer();
                } else {
                  window.dispatchEvent(new CustomEvent('social:open-fleet-drawer'));
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-[11px] font-medium text-red-300 hover:text-white border border-red-500/25 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3 text-red-400" />
              <span>+ Add / Link Another Channel</span>
            </button>

            <a
              href="/channels"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                window.location.pathname = '/channels';
              }}
              className="w-full flex items-center justify-center gap-1 px-3 py-1 rounded-lg bg-[#18181C] hover:bg-[#202026] text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>View Full Fleet Hub →</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

