import React from 'react';
import {
  Sparkles,
  ArrowLeft,
  Bell,
  Youtube,
} from 'lucide-react';
import { UserProfile } from '@/src/features/auth/types';

interface WorkspaceHeaderProps {
  user: UserProfile | null;
  unreadCount: number;
  onNavigate: (page: string) => void;
  projectTitle?: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  user,
  unreadCount,
  onNavigate,
  projectTitle = 'Master Your Day',
}) => {
  return (
    <header className="h-14 shrink-0 z-30 w-full bg-[#121212] border-b border-[#2F2F2F] px-3 sm:px-6 flex items-center justify-between gap-4 font-sans-studio select-none">
      {/* Left: Back to Dashboard & Studio Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border border-transparent hover:border-[#2F2F2F] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-[#60A5FA]" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="h-4 w-px bg-[#2F2F2F] hidden sm:block" />

        {/* Brand Label */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-sm shadow-[#3B82F6]/30">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white">ApexMind Studio</span>
            <span className="text-xs text-[#6B7280]">/</span>
            <span className="text-xs font-semibold text-[#60A5FA]">Shorts Director</span>
          </div>
        </div>

        {/* Cloud Sync Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Autosaved to Memory</span>
        </div>
      </div>

      {/* Center: Current Short Project Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#181818] border border-[#2F2F2F]">
        <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider">Active Reel:</span>
        <span className="text-xs font-bold text-white truncate max-w-[200px]">{projectTitle}</span>
      </div>

      {/* Right: Channel Link, Notifications & User Avatar */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => onNavigate('youtube')}
          className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-[#2F2F2F]"
          title="Open YouTube Channel Manager"
        >
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="hidden sm:inline">Channel</span>
        </button>

        <button
          onClick={() => onNavigate('notifications')}
          className="relative p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer border border-transparent hover:border-[#2F2F2F]"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#121212]" />
          )}
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className="p-0.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer flex items-center justify-center"
          title={user ? `${user.name} (${user.email})` : 'Profile'}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 rounded-md bg-[#1E1E1E] border border-[#2F2F2F] object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-[#1E1E1E] border border-[#2F2F2F] flex items-center justify-center text-[10px] font-bold text-[#60A5FA]">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
            </div>
          )}
        </button>
      </div>
    </header>
  );
};
