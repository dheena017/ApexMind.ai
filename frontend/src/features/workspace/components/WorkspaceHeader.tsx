import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Play,
  Check,
  Download,
  Bookmark,
  PanelLeft,
  PanelBottom,
  PanelRight,
  Settings,
  ChevronDown,
  Film,
  Search,
  Sparkles,
  Share2,
  Radio,
  Menu,
  X,
  User,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '@/src/features/auth/types';
import { ChannelSwitcher } from '@/src/features/youtube/components/ChannelSwitcher';
import { SocialFleetDrawer } from '@/src/features/social/components/SocialFleetDrawer';
import { OmnichannelPublishModal } from '@/src/features/social/components/OmnichannelPublishModal';
import { WorkspaceTabType } from './WorkspaceSidebar';

interface WorkspaceHeaderProps {
  user?: UserProfile | null;
  unreadCount?: number;
  onNavigate: (page: string) => void;
  activeWorkspacePane: WorkspaceTabType;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onSignOut: () => void | Promise<void>;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  user,
  onNavigate,
  activeWorkspacePane,
  mobileMenuOpen,
  onToggleMobileMenu,
  onSignOut,
}) => {
  const [publishing, setPublishing] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [hasTimelineContent, setHasTimelineContent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');

  // Omnichannel Modals State
  const [showFleetDrawer, setShowFleetDrawer] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Panel layout toggles state
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showRightPane, setShowRightPane] = useState(true);

  useEffect(() => {
    const handlePublishState = (e: Event) => {
      const customEvent = e as CustomEvent<{
        publishing: boolean;
        canPublish: boolean;
        publishedSuccess: boolean;
        hasTimelineContent?: boolean;
      }>;
      if (customEvent.detail) {
        setPublishing(customEvent.detail.publishing);
        setCanPublish(customEvent.detail.canPublish);
        setPublishedSuccess(customEvent.detail.publishedSuccess);
        if (customEvent.detail.hasTimelineContent !== undefined) {
          setHasTimelineContent(customEvent.detail.hasTimelineContent);
        }
      }
    };

    const handlePanelState = (e: Event) => {
      const customEvent = e as CustomEvent<{
        showLeftPane: boolean;
        showTimeline: boolean;
        showRightPane: boolean;
      }>;
      if (customEvent.detail) {
        setShowLeftPane(customEvent.detail.showLeftPane);
        setShowTimeline(customEvent.detail.showTimeline);
        setShowRightPane(customEvent.detail.showRightPane);
      }
    };

    const handleTitleState = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string }>;
      if (customEvent.detail?.title !== undefined) {
        setVideoTitle(customEvent.detail.title);
      }
    };

    const handleExportState = (e: Event) => {
      const customEvent = e as CustomEvent<{ exporting: boolean; message: string }>;
      if (!customEvent.detail) return;
      setExporting(customEvent.detail.exporting);
      setNotice(customEvent.detail.message);
      if (!customEvent.detail.exporting) {
        window.setTimeout(() => setNotice(null), 5000);
      }
    };

    const handleSaveDraftState = (e: Event) => {
      const customEvent = e as CustomEvent<{ saved: boolean; message: string }>;
      if (!customEvent.detail) return;
      setNotice(customEvent.detail.message);
      window.setTimeout(() => setNotice(null), 3000);
    };

    window.addEventListener('workspace:publish-state', handlePublishState);
    window.addEventListener('workspace:panel-state', handlePanelState);
    window.addEventListener('workspace:title-change', handleTitleState);
    window.addEventListener('workspace:export-state', handleExportState);
    window.addEventListener('workspace:save-draft-state', handleSaveDraftState);

    return () => {
      window.removeEventListener('workspace:publish-state', handlePublishState);
      window.removeEventListener('workspace:panel-state', handlePanelState);
      window.removeEventListener('workspace:title-change', handleTitleState);
      window.removeEventListener('workspace:export-state', handleExportState);
      window.removeEventListener('workspace:save-draft-state', handleSaveDraftState);
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleTitleChange = (nextTitle: string) => {
    setVideoTitle(nextTitle);
    window.dispatchEvent(
      new CustomEvent('workspace:update-title', { detail: { title: nextTitle } })
    );
  };

  const handleTogglePanel = (panel: 'left' | 'bottom' | 'right') => {
    window.dispatchEvent(
      new CustomEvent('workspace:toggle-panel', { detail: { panel } })
    );
  };

  const handlePublishClick = () => {
    // Open Omnichannel Cross-Publish Modal
    setShowPublishModal(true);
  };

  const handleExport = () => {
    if (!hasTimelineContent) {
      setNotice('Add media to the timeline first');
      window.setTimeout(() => setNotice(null), 3000);
      return;
    }
    window.dispatchEvent(new CustomEvent('workspace:export-video'));
  };

  const handleSaveDraft = () => {
    window.dispatchEvent(new CustomEvent('workspace:save-draft'));
  };

  return (
    <>
      <header className="sticky top-0 h-11 shrink-0 z-30 w-full bg-[#111111]/98 backdrop-blur-2xl border-b border-[#242424] px-3 sm:px-4 max-[359px]:px-2 flex items-center justify-between gap-2.5 max-[439px]:gap-1 max-[359px]:gap-0 font-sans-studio select-none text-[#E5E5E5] shadow-sm">
        {/* ── Left: Studio Title, Brand Logo, Breadcrumb, Title & Channel Switcher ── */}
        <div className="flex items-center gap-2.5 max-[439px]:gap-1 max-[359px]:gap-0 shrink-0 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="workspace-mobile-menu-trigger md:hidden h-8 w-8 shrink-0 rounded-lg border border-[#2A2A2A] bg-[#181818] text-[#D4D4D8] hover:bg-[#26262C] hover:text-white flex items-center justify-center transition-colors"
            aria-label={mobileMenuOpen ? 'Close studio menu' : 'Open studio menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="workspace-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-xs tracking-tight text-white whitespace-nowrap hidden min-[440px]:inline">
              ApexMind <span className="text-[#60A5FA]">Studio</span>
            </span>
            <span className="font-extrabold text-xs tracking-tight text-white whitespace-nowrap min-[440px]:hidden">
              ApexMind
            </span>
          </div>
          <span className="workspace-mobile-current-tool md:hidden max-w-24 max-[439px]:max-w-16 max-[399px]:hidden truncate text-[10px] font-medium text-[#9CA3AF]">
            {activeWorkspacePane === 'script' || activeWorkspacePane === 'editor' || activeWorkspacePane === 'prompt'
              ? 'Script & AI'
              : activeWorkspacePane.charAt(0).toUpperCase() + activeWorkspacePane.slice(1)}
          </span>

          {/* Project Breadcrumb & Title Input */}
          <div className="hidden md:flex items-center gap-2 min-w-0 ml-1">
            <div className="h-4 w-px bg-[#262626]" />
            <span className="text-[11px] font-medium text-[#9CA3AF] whitespace-nowrap">
              Director
            </span>
            <span className="text-[#52525B]">/</span>
            <div className="relative flex items-center min-w-0 max-w-[170px] xl:max-w-[220px]">
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Project"
                aria-label="Video project title"
                className="h-7 w-full px-2.5 rounded-lg bg-[#161616] hover:bg-[#1A1A1A] focus:bg-[#1E1E1E] border border-[#2A2A2A] focus:border-[#3B82F6]/60 text-[11px] font-medium text-white placeholder:text-[#737373] focus:outline-none transition-all truncate shadow-inner"
              />
            </div>
          </div>

          {/* Active YouTube Channel Selector */}
          <div className="h-4 w-px bg-[#262626] hidden md:block" />
          <div className="hidden md:block">
            <ChannelSwitcher onOpenFleetDrawer={() => setShowFleetDrawer(true)} />
          </div>
        </div>

        {/* ── Right: Fleet Manager + Panel Toggles + Actions + Publish ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 max-[439px]:gap-1 max-[359px]:gap-0 shrink-0">
          {/* Notice Badge */}
          {notice && (
            <span className="text-[10px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-[#333333] animate-pulse hidden xl:inline">
              {notice}
            </span>
          )}

          {/* Social Fleet Drawer Trigger */}
          <button
            type="button"
            onClick={() => setShowFleetDrawer(true)}
            className="flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#383838] text-[11px] text-[#A1A1AA] hover:text-white transition-all cursor-pointer group"
            title="Manage Social Fleet (YouTube, Instagram, Facebook, TikTok)"
          >
            <Radio className="w-3 h-3 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold text-[#D4D4D8] hidden sm:inline">Fleet</span>
          </button>

          {/* Quick Search / Command Palette trigger */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('workspace:open-command-palette'))}
            className="hidden md:flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#383838] text-[11px] text-[#9CA3AF] hover:text-white transition-all cursor-pointer group"
            title="Open Command Palette (⌘K or Ctrl+K)"
          >
            <Search className="w-3 h-3 text-[#737373] group-hover:text-[#60A5FA] transition-colors" />
            <span className="text-[10px] font-medium text-[#D4D4D8]">Quick Actions</span>
            <kbd className="text-[9px] font-mono px-1.5 py-0.2 bg-[#0A0A0A] border border-[#262626] rounded text-[#737373]">
              ⌘K
            </kbd>
          </button>

          {/* Panel Layout Toggles (Left, Bottom, Right) Pill Group */}
          <div className="hidden sm:flex items-center gap-0.5 bg-[#141414] p-0.5 rounded-lg border border-[#242424]">
            <button
              type="button"
              onClick={() => handleTogglePanel('left')}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                showLeftPane
                  ? 'bg-[#2563EB] text-white border border-[#60A5FA]/40 shadow-xs'
                  : 'text-[#8E8E93] hover:text-white hover:bg-[#26262C] hover:border-white/10 border border-transparent'
              }`}
              title={showLeftPane ? 'Hide Left Panel' : 'Show Left Panel'}
              aria-label="Toggle Left Panel"
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleTogglePanel('bottom')}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                showTimeline
                  ? 'bg-[#2563EB] text-white border border-[#60A5FA]/40 shadow-xs'
                  : 'text-[#8E8E93] hover:text-white hover:bg-[#26262C] hover:border-white/10 border border-transparent'
              }`}
              title={showTimeline ? 'Hide Bottom Timeline' : 'Show Bottom Timeline'}
              aria-label="Toggle Bottom Timeline"
            >
              <PanelBottom className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleTogglePanel('right')}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                showRightPane
                  ? 'bg-[#2563EB] text-white border border-[#60A5FA]/40 shadow-xs'
                  : 'text-[#8E8E93] hover:text-white hover:bg-[#26262C] hover:border-white/10 border border-transparent'
              }`}
              title={showRightPane ? 'Hide Right Inspector' : 'Show Right Inspector'}
              aria-label="Toggle Right Inspector"
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#262626] mx-0.5 hidden sm:block" />

          {/* Export MP4 (Pill Button) */}
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !hasTimelineContent}
            className={`hidden sm:flex items-center gap-1.5 h-7.5 px-3 rounded-lg text-[10.5px] font-semibold transition-all border ${
              !hasTimelineContent
                ? 'bg-[#121212] text-[#52525B] border-[#1F1F1F] cursor-not-allowed'
                : exporting
                ? 'bg-[#161616] text-[#D4D4D8] border-[#2A2A2A] cursor-wait opacity-60'
                : 'bg-[#161616] hover:bg-[#202020] text-[#D4D4D8] hover:text-white border-[#2A2A2A] hover:border-[#383838] cursor-pointer'
            }`}
            title={
              !hasTimelineContent
                ? 'Add media to the timeline to export'
                : exporting
                ? 'Rendering the final video…'
                : 'Export the composed video'
            }
          >
            <Download className={`w-3 h-3 ${!hasTimelineContent ? 'text-[#3A3A3A]' : 'text-[#60A5FA]'}`} />
            <span>{exporting ? (notice?.startsWith('Rendering') ? notice : 'Exporting…') : 'Export MP4'}</span>
          </button>

          {/* Save Draft (Pill Button) */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="hidden sm:flex items-center gap-1.5 h-7.5 px-3 rounded-lg bg-[#161616] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#383838] text-[10.5px] font-semibold text-[#D4D4D8] hover:text-white transition-all cursor-pointer"
          >
            <Bookmark className="w-3 h-3 text-amber-400" />
            <span>Save Draft</span>
          </button>

          {/* Save to Website Library (Pill Button) */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('workspace:save-to-library'))}
            disabled={!canPublish}
            className={`hidden sm:flex items-center gap-1.5 h-7.5 px-3 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer border ${
              canPublish
                ? 'bg-[#161616] hover:bg-[#202020] text-[#60A5FA] border-[#2A2A2A] hover:border-[#3B82F6]/40 shadow-xs'
                : 'bg-[#121212] text-[#52525B] border-[#1F1F1F] cursor-not-allowed'
            }`}
            title={!canPublish ? 'Generate a script first to save to library' : 'Save this video to your Website Library'}
          >
            <Film className="w-3 h-3" />
            <span>Save to Library</span>
          </button>

          {/* One-Click Omnichannel Publish (Cross-Post Syndicate) Button */}
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={!canPublish || publishing}
            title={
              publishing
                ? 'Publishing…'
                : publishedSuccess
                ? 'Published successfully!'
                : !canPublish
                ? 'Generate a script first to publish'
                : 'One-Click Multi-Platform Publish'
            }
            className={`h-7.5 px-3.5 sm:px-4 max-[359px]:px-2 text-[10.5px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              publishedSuccess
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : !canPublish || publishing
                ? 'bg-[#121212] text-[#52525B] border border-[#242424] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#2563EB] to-indigo-600 hover:from-[#1D4ED8] hover:to-indigo-500 text-white shadow-[0_0_14px_rgba(37,99,235,0.35)] border border-[#60A5FA]/30 active:scale-95'
            }`}
          >
            {publishing ? (
              <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : publishedSuccess ? (
              <Check className="w-3 h-3" />
            ) : (
              <Share2 className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {publishing ? 'Publishing...' : publishedSuccess ? 'Published!' : 'Cross-Publish'}
            </span>
            <span className="sm:hidden">
              {publishing ? 'Pub...' : publishedSuccess ? 'Done' : 'Publish'}
            </span>
          </button>

          <div className="h-4 w-px bg-[#262626] mx-0.5 hidden sm:block" />

          {/* Settings button */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="h-7.5 w-7.5 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#202020] border border-transparent hover:border-[#2A2A2A] transition-all cursor-pointer"
            title="Studio Settings"
            aria-label="Studio Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Profile button */}
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              className={`flex items-center gap-1 p-0.5 rounded-full border transition-all cursor-pointer ${
                accountMenuOpen
                  ? 'text-white bg-[#202020] border-[#3B82F6]/50'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#202020] border-transparent hover:border-[#2A2A2A]'
              }`}
              title={user ? `${user.name} (${user.email})` : 'Profile'}
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              aria-controls="workspace-account-menu"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full bg-[#181818] border border-[#2A2A2A] object-cover shadow-xs"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] border border-[#60A5FA]/30 flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
                </div>
              )}
              <ChevronDown className={`w-3 h-3 text-[#737373] transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {accountMenuOpen && (
              <div
                id="workspace-account-menu"
                role="menu"
                aria-label="Account menu"
                className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-[#2A2A2A] bg-[#141416] shadow-2xl p-2 z-50"
              >
                <div className="px-2.5 py-2 border-b border-[#242424]">
                  <p className="text-xs font-semibold text-white truncate">{user?.name || 'Your account'}</p>
                  {user?.email && <p className="mt-0.5 text-[10px] text-[#9CA3AF] truncate">{user.email}</p>}
                </div>
                <div className="py-1">
                  {[
                    { label: 'Profile & Badges', page: 'profile', icon: User },
                    { label: 'Preferences', page: 'profile-preferences', icon: Settings },
                    { label: 'Social Linking & Fleet', page: 'channels', icon: Radio },
                    { label: 'Studio Settings', page: 'settings', icon: Settings },
                  ].map(({ label, page, icon: Icon }) => (
                    <button
                      key={page}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onNavigate(page);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-[#D4D4D8] hover:text-white hover:bg-[#202020] transition-colors cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="pt-1 border-t border-[#242424]">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      void onSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Social Channels Fleet Drawer */}
      <SocialFleetDrawer
        isOpen={showFleetDrawer}
        onClose={() => setShowFleetDrawer(false)}
        onNavigate={onNavigate}
      />

      {/* Omnichannel Cross-Publish Modal */}
      <OmnichannelPublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        videoUrl=""
        defaultTitle={videoTitle}
      />
    </>
  );
};

export default WorkspaceHeader;
