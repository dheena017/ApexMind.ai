import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Sparkles,
  Mic,
  Film,
  HardDrive,
  AlertTriangle,
  Info,
  X,
  CheckCheck,
  Trash2,
  ExternalLink,
  ChevronRight,
  Radio,
  Layers,
} from 'lucide-react';
import { useWorkspaceNotifications } from '../hooks/useWorkspaceNotifications';
import { WorkspaceNotification, WorkspaceNotificationCategory } from '../types';
import { WorkspaceTabType } from './WorkspaceSidebar';

interface WorkspaceStatusBarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  activeWorkspacePane?: WorkspaceTabType;
  onWorkspacePaneChange?: (pane: WorkspaceTabType) => void;
  workspaceStatus: {
    aspectRatio: string;
    currentTime: number;
    duration: number;
    playbackRate: number;
    voice: string;
    music: string;
    visual: string;
    captionCount: number;
    overlay: string;
    sfx: string;
    isPlaying: boolean;
    isExporting: boolean;
  };
}

const formatWorkspaceTime = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const remainder = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

const getRelativeTime = (isoString: string) => {
  try {
    const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Recent';
  }
};

const getCategoryIcon = (category: WorkspaceNotificationCategory, type: string) => {
  if (type === 'error') return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  if (type === 'ai' || category === 'script') return <Sparkles className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />;
  if (category === 'voice') return <Mic className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  if (category === 'media') return <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  if (category === 'autosave') return <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  if (category === 'export') return <Layers className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />;
  return <Info className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />;
};

export const WorkspaceStatusBar: React.FC<WorkspaceStatusBarProps> = ({
  activePage,
  onNavigate,
  activeWorkspacePane = 'editor',
  onWorkspacePaneChange,
  workspaceStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'script' | 'voice' | 'autosave'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
    notify,
  } = useWorkspaceNotifications();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'script') return item.category === 'script';
    if (filter === 'voice') return item.category === 'voice';
    if (filter === 'autosave') return item.category === 'autosave';
    return true;
  });

  const handleActionClick = (item: WorkspaceNotification) => {
    markRead(item.id);
    if (activePage !== 'workspace') {
      onNavigate('workspace');
    }
    if (item.targetPane && onWorkspacePaneChange) {
      onWorkspacePaneChange(item.targetPane as WorkspaceTabType);
    }
    setIsOpen(false);
  };

  const isWorkspace = activePage === 'workspace';

  const paneLabels: Record<string, string> = {
    script: 'AI Script Studio',
    prompt: 'AI Script Studio',
    editor: 'Script & Subtitles',
    canvas: 'Canvas',
    media: 'Media Library',
    text: 'Text & Titles',
    elements: 'Elements',
    audio: 'Audio & SFX',
    image: 'Stock Images',
    video: 'Stock Videos',
  };

  return (
    <>
      {/* =========================================================================
          WORKSPACE BOTTOM STATUS & NOTIFICATION BAR
          Matches ApexMind Studio Design System: #0D0D0D, #2F2F2F, #3B82F6, #E5E5E5
          ========================================================================= */}
      <footer className="h-6 shrink-0 border-t border-[#2F2F2F] bg-[#0D0D0D] px-2.5 sm:px-3 flex items-center justify-between gap-2.5 font-mono-studio text-[9px] text-[#9CA3AF] select-none z-30 relative">
        {/* Left: Studio Metrics & Context */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {isWorkspace ? (
            <>
              <button
                type="button"
                onClick={() => onWorkspacePaneChange?.(activeWorkspacePane)}
                className="hidden sm:inline-flex items-center gap-1 truncate text-[#E5E5E5] hover:text-[#60A5FA] transition-colors cursor-pointer"
                title="Current active workspace pane"
              >
                <span>{paneLabels[activeWorkspacePane] || 'Workspace Studio'}</span>
              </button>
              <span className="text-[#6B7280]" title="Aspect Ratio">
                {workspaceStatus.aspectRatio}
              </span>
              <span className="hidden sm:inline tabular-nums text-[#9CA3AF]" title="Playhead / Timeline Duration">
                {formatWorkspaceTime(workspaceStatus.currentTime)} / {formatWorkspaceTime(workspaceStatus.duration)}
              </span>
              {workspaceStatus.visual && (
                <span className="hidden lg:inline max-w-28 truncate text-[#9CA3AF]" title={`Visual Backdrop: ${workspaceStatus.visual}`}>
                  V1 {workspaceStatus.visual}
                </span>
              )}
              {workspaceStatus.captionCount > 0 && (
                <span className="hidden lg:inline text-[#60A5FA] font-medium" title={`${workspaceStatus.captionCount} subtitle cue cards`}>
                  T1 {workspaceStatus.captionCount}
                </span>
              )}
            </>
          ) : (
            /* Studio Status Across Other Pages */
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 font-semibold tracking-wide">
                <Radio className="w-2.5 h-2.5 text-[#60A5FA]" />
                AI Studio Live
              </span>
              <span className="hidden md:inline text-[#4A4A4A]">|</span>
              <span className="text-[#9CA3AF] truncate">
                {workspaceStatus.aspectRatio} • {formatWorkspaceTime(workspaceStatus.duration)} • Voice {workspaceStatus.voice || 'Fenrir'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('workspace')}
                className="hidden sm:inline-flex items-center gap-1 text-[#60A5FA] hover:text-[#93C5FD] font-semibold hover:underline cursor-pointer ml-1"
              >
                <span>Open Studio</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Studio Playback State + Workspace Notification Center Bell */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden lg:inline text-[#6B7280]">{workspaceStatus.playbackRate}x</span>
          <span className="hidden md:inline max-w-24 truncate text-[#E5E5E5]">
            {workspaceStatus.voice}
          </span>
          {workspaceStatus.music && (
            <span className="hidden xl:inline max-w-28 truncate text-[#9CA3AF]">
              {workspaceStatus.music}
            </span>
          )}

          {/* Engine Activity Status Indicator */}
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
              workspaceStatus.isExporting
                ? 'text-[#60A5FA] bg-[#3B82F6]/15 border border-[#3B82F6]/30'
                : workspaceStatus.isPlaying
                ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                : 'text-[#9CA3AF]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span className="capitalize">
              {workspaceStatus.isExporting ? 'Exporting' : workspaceStatus.isPlaying ? 'Playing' : 'Paused'}
            </span>
          </span>

          {/* Vertical Divider */}
          <span className="h-3 w-[1px] bg-[#2F2F2F]" aria-hidden="true" />

          {/* Dedicated Workspace Notifications Trigger */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded-md cursor-pointer transition-colors border ${
              isOpen
                ? 'bg-[#1E1E1E] text-white border-[#3B82F6]/50'
                : unreadCount > 0
                ? 'bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/40 hover:bg-[#3B82F6]/25'
                : 'text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] border-transparent hover:border-[#2F2F2F]'
            }`}
            title="Open Workspace Production Notifications"
            aria-label="Workspace Notifications"
            aria-expanded={isOpen}
          >
            <Bell className={`w-3 h-3 ${unreadCount > 0 ? 'text-[#60A5FA]' : 'text-[#9CA3AF]'}`} />
            <span className="hidden sm:inline font-semibold">Workspace</span>

            {/* Unread Pill Count */}
            {unreadCount > 0 ? (
              <span className="flex items-center justify-center px-1 py-0.2 min-w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-[#3B82F6] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Studio Idle & Synced" />
            )}
          </button>
        </div>
      </footer>

      {/* =========================================================================
          WORKSPACE NOTIFICATION CENTER POPOVER TRAY
          Strictly following Website Design System (#141414, #2F2F2F, #3B82F6)
          ========================================================================= */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed bottom-7 right-2 sm:right-3 w-[calc(100vw-16px)] sm:w-96 max-h-[480px] bg-[#141414] border border-[#2F2F2F] rounded-2xl z-50 flex flex-col overflow-hidden font-sans-studio shadow-2xl"
          role="dialog"
          aria-label="Workspace Notification Center"
        >
          {/* Popover Header */}
          <div className="p-3.5 px-4 border-b border-[#2F2F2F] bg-[#181818] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-[#E5E5E5] tracking-wide">Workspace Alerts</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#6B7280]">Timeline • Vocal • Media • Render Events</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-rose-400 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3.5 py-2 border-b border-[#2F2F2F] bg-[#101010] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'script', label: 'AI Script' },
                { id: 'voice', label: 'Voices' },
                { id: 'autosave', label: 'Auto-Save' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#3B82F6] text-white font-semibold'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[320px] scrollbar-thin scrollbar-thumb-[#2F2F2F]">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-[#4A4A4A]" />
                <p className="text-xs font-semibold text-[#E5E5E5]">No notifications</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {filter === 'unread'
                    ? 'All workspace events have been read.'
                    : 'Workspace pipeline is operating smoothly.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.read && markRead(item.id)}
                  className={`p-3 rounded-xl border transition-all text-left flex gap-2.5 group relative ${
                    item.read
                      ? 'bg-[#121212] border-[#2F2F2F] text-[#9CA3AF] hover:border-[#3D3D3D]'
                      : 'bg-[#161C26] border-[#3B82F6]/30 text-[#E5E5E5]'
                  }`}
                >
                  {/* Category Indicator Icon */}
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] shrink-0 h-fit">
                    {getCategoryIcon(item.category, item.type)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[11px] font-bold truncate ${item.read ? 'text-[#E5E5E5]' : 'text-white'}`}>
                        {item.title}
                      </span>
                      <span className="text-[9px] text-[#6B7280] shrink-0 font-mono-studio">
                        {getRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-[10px] leading-relaxed text-[#9CA3AF] line-clamp-2">
                      {item.message}
                    </p>

                    {/* Progress Bar for Rendering / Export tasks */}
                    {item.progress !== undefined && (
                      <div className="mt-1.5 w-full bg-[#1E1E1E] h-1.5 rounded-full overflow-hidden border border-[#2F2F2F]">
                        <div
                          className="bg-[#3B82F6] h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Action Link / Jump to Studio Pane */}
                    {item.targetPane && (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(item);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#60A5FA] hover:text-[#93C5FD] hover:underline cursor-pointer"
                        >
                          <span>{item.actionLabel || `Open ${paneLabels[item.targetPane] || 'Pane'}`}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#6B7280] hover:text-rose-400 rounded-lg transition-opacity cursor-pointer"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unread Dot Indicator */}
                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Diagnostic Tools */}
          <div className="p-2.5 px-4 border-t border-[#2F2F2F] bg-[#101010] flex items-center justify-between text-[10px] text-[#6B7280] font-mono-studio shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Auto-Save Active
            </span>
            <button
              type="button"
              onClick={() => {
                notify({
                  title: 'Manual Test Event',
                  message: `Studio diagnostic broadcast sent at ${new Date().toLocaleTimeString()}.`,
                  category: 'script',
                  type: 'ai',
                  targetPane: 'editor',
                  actionLabel: 'View Script',
                });
              }}
              className="text-[#9CA3AF] hover:text-[#60A5FA] hover:underline cursor-pointer"
            >
              + Emit Test Event
            </button>
          </div>
        </div>
      )}
    </>
  );
};
