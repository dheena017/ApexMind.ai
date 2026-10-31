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
  Search,
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

interface NotificationTheme {
  iconBg: string;
  iconColor: string;
  badge: {
    label: string;
    className: string;
  };
  progressBar: string;
}

const getNotificationTheme = (item: WorkspaceNotification): NotificationTheme => {
  const titleLower = item.title.toLowerCase();
  const cat = item.category;
  const typ = item.type;

  // 1. Success / Export Finished
  if (
    titleLower.includes('completed') ||
    titleLower.includes('published') ||
    (cat === 'export' && typ === 'success') ||
    (typ === 'success' && !titleLower.includes('script') && !titleLower.includes('vocal'))
  ) {
    return {
      iconBg: 'bg-emerald-950/40 border border-emerald-500/30',
      iconColor: 'text-emerald-400',
      badge: {
        label: 'COMPLETED',
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
      },
      progressBar: 'bg-emerald-500',
    };
  }

  // 2. Export / Render In-Progress
  if (
    typ === 'render' ||
    cat === 'export' ||
    titleLower.includes('render') ||
    titleLower.includes('export')
  ) {
    return {
      iconBg: 'bg-blue-950/40 border border-blue-500/30',
      iconColor: 'text-[#60A5FA]',
      badge: {
        label: 'RENDER',
        className: 'bg-blue-500/10 text-[#60A5FA] border border-blue-500/25',
      },
      progressBar: 'bg-[#3B82F6]',
    };
  }

  // 3. AI Script & Pipeline
  if (
    typ === 'ai' ||
    cat === 'script' ||
    titleLower.includes('pipeline') ||
    titleLower.includes('script')
  ) {
    return {
      iconBg: 'bg-amber-950/40 border border-amber-500/30',
      iconColor: 'text-amber-400',
      badge: {
        label: 'AI SCRIPT',
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
      },
      progressBar: 'bg-amber-500',
    };
  }

  // 4. Voiceover & Audio
  if (
    cat === 'voice' ||
    titleLower.includes('voice') ||
    titleLower.includes('vocal') ||
    titleLower.includes('audio') ||
    titleLower.includes('sfx')
  ) {
    return {
      iconBg: 'bg-purple-950/40 border border-purple-500/30',
      iconColor: 'text-purple-400',
      badge: {
        label: 'AUDIO',
        className: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
      },
      progressBar: 'bg-purple-500',
    };
  }

  // 5. Media & Backdrop & Visuals
  if (
    cat === 'media' ||
    titleLower.includes('backdrop') ||
    titleLower.includes('visual') ||
    titleLower.includes('aspect') ||
    titleLower.includes('video')
  ) {
    return {
      iconBg: 'bg-teal-950/40 border border-teal-500/30',
      iconColor: 'text-teal-400',
      badge: {
        label: 'MEDIA',
        className: 'bg-teal-500/10 text-teal-400 border border-teal-500/25',
      },
      progressBar: 'bg-teal-500',
    };
  }

  // 6. Errors & Warnings
  if (
    typ === 'error' ||
    typ === 'warning' ||
    titleLower.includes('fail') ||
    titleLower.includes('error')
  ) {
    return {
      iconBg: 'bg-rose-950/40 border border-rose-500/30',
      iconColor: 'text-rose-400',
      badge: {
        label: 'ALERT',
        className: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
      },
      progressBar: 'bg-rose-500',
    };
  }

  // 7. Auto-Save & Timeline System Default
  return {
    iconBg: 'bg-[#1E1E24] border border-[#2E2E36]',
    iconColor: 'text-[#A1A1AA]',
    badge: {
      label: 'SYSTEM',
      className: 'bg-[#222228] text-[#A1A1AA] border border-[#2E2E36]',
    },
    progressBar: 'bg-[#3B82F6]',
  };
};

const getCategoryIcon = (category: WorkspaceNotificationCategory, type: string, title: string) => {
  const t = title.toLowerCase();
  if (type === 'error' || type === 'warning' || t.includes('fail') || t.includes('error')) {
    return <AlertTriangle className="w-3.5 h-3.5" />;
  }
  if (t.includes('completed') || t.includes('published') || (type === 'success' && !t.includes('script'))) {
    return <CheckCircle2 className="w-3.5 h-3.5" />;
  }
  if (type === 'ai' || category === 'script' || t.includes('pipeline') || t.includes('script')) {
    return <Sparkles className="w-3.5 h-3.5" />;
  }
  if (category === 'voice' || t.includes('voice') || t.includes('audio') || t.includes('sfx')) {
    return <Mic className="w-3.5 h-3.5" />;
  }
  if (category === 'media' || t.includes('backdrop') || t.includes('aspect') || t.includes('visual')) {
    return <Film className="w-3.5 h-3.5" />;
  }
  if (category === 'autosave' || t.includes('save') || t.includes('snapshot')) {
    return <HardDrive className="w-3.5 h-3.5" />;
  }
  if (category === 'export' || type === 'render' || t.includes('render') || t.includes('export')) {
    return <Layers className="w-3.5 h-3.5" />;
  }
  return <Info className="w-3.5 h-3.5" />;
};

export const WorkspaceStatusBar: React.FC<WorkspaceStatusBarProps> = ({
  activePage,
  onNavigate,
  activeWorkspacePane = 'editor',
  onWorkspacePaneChange,
  workspaceStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'script' | 'voice' | 'media' | 'autosave' | 'export'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    removeNotification,
    clearRead,
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
    if (filter === 'unread' && item.read) return false;
    if (filter === 'script' && item.category !== 'script') return false;
    if (filter === 'voice' && item.category !== 'voice') return false;
    if (filter === 'media' && item.category !== 'media') return false;
    if (filter === 'autosave' && item.category !== 'autosave') return false;
    if (filter === 'export' && item.category !== 'export') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchCat) return false;
    }

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

  const filterTabs = [
    { id: 'all' as const, label: `All (${notifications.length})` },
    { id: 'unread' as const, label: `Unread (${unreadCount})` },
    { id: 'script' as const, label: 'AI Script' },
    { id: 'voice' as const, label: 'Voices' },
    { id: 'media' as const, label: 'Media' },
    { id: 'autosave' as const, label: 'Auto-Save' },
    { id: 'export' as const, label: 'Exports' },
  ];

  return (
    <>
      {/* =========================================================================
          WORKSPACE BOTTOM STATUS & NOTIFICATION BAR (ApexMind Studio Theme)
          ========================================================================= */}
      <footer className="h-6 shrink-0 border-t border-[#2F2F2F] bg-[#0D0D0D] px-2.5 sm:px-3 flex items-center justify-between gap-2.5 font-mono-studio text-[9px] text-[#9CA3AF] select-none z-30 relative">
        {/* Left: Studio Metrics & Context */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {isWorkspace ? (
            <>
              <button
                type="button"
                onClick={() => onWorkspacePaneChange?.(activeWorkspacePane)}
                className="hidden sm:inline-flex items-center gap-1 truncate text-[#E5E5E5] hover:text-white transition-colors cursor-pointer"
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
                <span className="hidden lg:inline text-teal-400 font-medium" title={`${workspaceStatus.captionCount} subtitle cue cards`}>
                  T1 {workspaceStatus.captionCount}
                </span>
              )}
            </>
          ) : (
            /* Studio Status Across Other Pages */
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-[#1E1E1E] text-[#E5E5E5] border border-[#2F2F2F] font-semibold tracking-wide">
                <Radio className="w-2.5 h-2.5 text-[#A1A1AA]" />
                AI Studio Live
              </span>
              <span className="hidden md:inline text-[#4A4A4A]">|</span>
              <span className="text-[#9CA3AF] truncate">
                {workspaceStatus.aspectRatio} • {formatWorkspaceTime(workspaceStatus.duration)} • Voice {workspaceStatus.voice || 'Fenrir'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('workspace')}
                className="hidden sm:inline-flex items-center gap-1 text-[#E5E5E5] hover:text-white font-semibold hover:underline cursor-pointer ml-1"
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
                ? 'text-[#3B82F6] bg-[#1E2A3A] border border-[#3B82F6]/30'
                : workspaceStatus.isPlaying
                ? 'text-[#10B981] bg-emerald-500/10 border border-emerald-500/20'
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
                ? 'bg-[#1E2A3A] text-white border-[#3B82F6]'
                : unreadCount > 0
                ? 'bg-[#1E1E1E] text-[#E5E5E5] border-[#3A3A3A] hover:bg-[#2A2A2A]'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border-transparent hover:border-[#2F2F2F]'
            }`}
            title="Open Workspace Production Notifications"
            aria-label="Workspace Notifications"
            aria-expanded={isOpen}
          >
            <Bell className={`w-3 h-3 ${unreadCount > 0 ? 'text-[#3B82F6]' : 'text-[#9CA3AF]'}`} />
            <span className="hidden sm:inline font-semibold">Workspace</span>

            {/* Unread Pill Count */}
            {unreadCount > 0 ? (
              <span className="flex items-center justify-center px-1.5 py-0.2 min-w-3.5 h-3.5 text-[8.5px] font-bold rounded-full bg-[#3B82F6] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" title="Studio Idle & Synced" />
            )}
          </button>
        </div>
      </footer>

      {/* =========================================================================
          WORKSPACE NOTIFICATION CENTER POPOVER TRAY (Official ApexMind Theme)
          ========================================================================= */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed bottom-7 right-2 sm:right-3 w-[calc(100vw-16px)] sm:w-[420px] max-h-[520px] bg-[#141416] border border-[#2F2F38] rounded-2xl z-50 flex flex-col overflow-hidden font-sans-studio shadow-2xl shadow-black/80"
          role="dialog"
          aria-label="Workspace Notification Center"
        >
          {/* Popover Header */}
          <div className="p-3 px-3.5 border-b border-[#26262E] bg-[#18181C] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#202026] border border-[#2E2E38] flex items-center justify-center text-[#3B82F6] shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-wide whitespace-nowrap">
                    Workspace Production Alerts
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono-studio font-bold rounded-md bg-[#1E2A3A] text-[#60A5FA] border border-[#3B82F6]/30 whitespace-nowrap shrink-0 leading-none">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#71717A] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  AI Scripts • Audio • Media • Timeline • Renders
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="px-2 py-1 rounded-lg text-[#60A5FA] hover:text-white bg-[#1E2A3A] hover:bg-[#25354A] border border-[#3B82F6]/30 transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.some((n) => n.read) && (
                <button
                  type="button"
                  onClick={clearRead}
                  className="px-2 py-1 rounded-lg text-[#9CA3AF] hover:text-white bg-[#1E1E24] hover:bg-[#282830] border border-[#2F2F38] transition-colors cursor-pointer text-[10px] font-medium whitespace-nowrap"
                  title="Clear read items"
                >
                  Clear Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-[#202026] transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-3.5 py-2 border-b border-[#24242C] bg-[#101012] flex items-center gap-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
            <input
              type="text"
              placeholder="Filter notifications (e.g., Fenrir, 9:16, Script, Export)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-white placeholder-[#71717A] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#71717A] hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills with Website Theme Styling */}
          <div className="px-3 py-2 border-b border-[#24242C] bg-[#101012] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#3B82F6] text-white font-semibold border-[#3B82F6] shadow-xs'
                      : 'bg-[#18181C] text-[#9CA3AF] hover:text-white hover:bg-[#202026] border-[#26262E]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[320px] scrollbar-thin scrollbar-thumb-[#2E2E38]">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#4A4A55]" />
                <p className="text-xs font-semibold text-[#E5E5E5]">No notifications found</p>
                <p className="text-[10px] text-[#71717A] mt-1">
                  {searchQuery
                    ? 'No workspace events match your search query.'
                    : filter === 'unread'
                    ? 'All workspace events have been read.'
                    : 'Workspace pipeline is operating smoothly.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const theme = getNotificationTheme(item);

                return (
                  <div
                    key={item.id}
                    onClick={() => !item.read && markRead(item.id)}
                    className={`p-3 rounded-xl border text-left flex gap-3 group relative cursor-pointer transition-all ${
                      item.read
                        ? 'bg-[#161618] border-[#24242C] text-[#9CA3AF] hover:border-[#343440]'
                        : 'bg-[#1A1A20] border-[#32323E] hover:border-[#3B82F6]/60 text-white shadow-xs'
                    }`}
                  >
                    {/* Category Indicator Icon Container */}
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 h-fit transition-transform group-hover:scale-105 ${theme.iconBg} ${theme.iconColor}`}>
                      {getCategoryIcon(item.category, item.type, item.title)}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[11.5px] font-bold truncate ${item.read ? 'text-[#D4D4D8]' : 'text-white'}`}>
                            {item.title}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono-studio font-bold shrink-0 ${theme.badge.className}`}>
                            {theme.badge.label}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-[#71717A] shrink-0 font-mono-studio">
                          {getRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-[10.5px] leading-relaxed text-[#A1A1AA] line-clamp-2">
                        {item.message}
                      </p>

                      {/* Progress Bar for Rendering / Export tasks */}
                      {item.progress !== undefined && (
                        <div className="mt-2 w-full bg-[#121214] h-1.5 rounded-full overflow-hidden border border-[#2A2A34]">
                          <div
                            className={`h-full transition-all duration-300 ${theme.progressBar}`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Action Link / Jump to Studio Pane */}
                      {item.targetPane && (
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(item);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#22222A] hover:bg-[#2C2C38] text-[#E5E5E5] hover:text-white border border-[#2F2F3C] hover:border-[#3B82F6]/50 transition-all cursor-pointer shadow-xs"
                          >
                            <span>{item.actionLabel || `Open ${paneLabels[item.targetPane] || 'Pane'}`}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#3B82F6]" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#71717A] hover:text-rose-400 rounded-lg hover:bg-[#22222A] transition-all cursor-pointer"
                            title="Dismiss"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Unread Glow Dot Indicator */}
                    {!item.read && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0 self-center shadow-xs"
                        title="Unread"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Diagnostic & Quick Event Emitters (ApexMind Theme) */}
          <div className="p-2.5 px-4 border-t border-[#26262E] bg-[#101012] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono-studio shrink-0">
            <span className="flex items-center gap-1.5 text-[#10B981] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Auto-Save Sync Active
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  notify({
                    title: 'Voiceover Synthesized',
                    message: '24kHz vocal profile Fenrir synthesized for current script hook.',
                    category: 'voice',
                    type: 'success',
                    targetPane: 'audio',
                    actionLabel: 'Audio Settings',
                  });
                }}
                className="px-2 py-0.5 rounded bg-[#18181C] hover:bg-[#202026] text-[#9CA3AF] hover:text-white border border-[#26262E] transition-colors cursor-pointer font-medium"
              >
                + Voice
              </button>
              <button
                type="button"
                onClick={() => {
                  notify({
                    title: 'Render Completed',
                    message: 'Hardware encoder completed 1080×1920 MP4 rendering at 60FPS.',
                    category: 'export',
                    type: 'render',
                    targetPane: 'canvas',
                    actionLabel: 'Preview',
                  });
                }}
                className="px-2 py-0.5 rounded bg-[#18181C] hover:bg-[#202026] text-[#9CA3AF] hover:text-white border border-[#26262E] transition-colors cursor-pointer font-medium"
              >
                + Render
              </button>
              <button
                type="button"
                onClick={() => {
                  notify({
                    title: 'Aspect Ratio: 9:16',
                    message: 'Viewport adjusted to 9:16 Vertical Short format.',
                    category: 'media',
                    type: 'info',
                    targetPane: 'canvas',
                    actionLabel: 'Canvas',
                  });
                }}
                className="px-2 py-0.5 rounded bg-[#18181C] hover:bg-[#202026] text-[#9CA3AF] hover:text-white border border-[#26262E] transition-colors cursor-pointer font-medium"
              >
                + Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceStatusBar;
