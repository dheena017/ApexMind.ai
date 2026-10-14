import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { UserProfile } from '@/src/features/auth/types';

interface WorkspaceHeaderProps {
  user?: UserProfile | null;
  unreadCount?: number;
  onNavigate: (page: string) => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  user,
  onNavigate,
}) => {
  const [publishing, setPublishing] = useState(false);
  const [canPublish, setCanPublish] = useState(true);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');

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
      }>;
      if (customEvent.detail) {
        setPublishing(customEvent.detail.publishing);
        setCanPublish(customEvent.detail.canPublish);
        setPublishedSuccess(customEvent.detail.publishedSuccess);
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
    window.dispatchEvent(new CustomEvent('workspace:trigger-publish'));
  };

  const handleExport = () => {
    window.dispatchEvent(new CustomEvent('workspace:export-video'));
  };

  const handleSaveDraft = () => {
    window.dispatchEvent(new CustomEvent('workspace:save-draft'));
  };

  return (
    <header className="sticky top-0 h-10 shrink-0 z-30 w-full overflow-hidden bg-[#111111] border-b border-[#242424] px-2 sm:px-3 flex items-center justify-between gap-2 font-sans-studio select-none text-[#E5E5E5]">
      {/* ── Left: Dashboard Button & Studio Title ── */}
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#282828] bg-[#161616] text-[#737373] transition-all cursor-pointer hover:text-[#60A5FA] hover:bg-[#1C1C1C] hover:border-[#383838]"
          title="Exit to Dashboard"
          aria-label="Exit to Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
        </button>

        <span className="font-extrabold text-xs tracking-tight text-white whitespace-nowrap">
          ApexMind Studio
        </span>
      </div>

      {/* ── Center: Breadcrumb & Editable Video Title ── */}
      <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-[#737373] min-w-0 truncate px-2">
        <span className="text-[#999999] hover:text-white transition-colors cursor-default whitespace-nowrap">
          ApexMind.ai
        </span>
        <span className="text-[#444444]">/</span>
        <span className="text-[#999999] whitespace-nowrap">Shorts Director</span>
        <span className="text-[#444444]">/</span>
        <div className="flex items-center gap-1 bg-[#171717] px-2 py-0.5 rounded-md border border-[#282828] hover:border-[#3B82F6]/50 focus-within:border-[#3B82F6] transition-all max-w-[200px] lg:max-w-[280px]">
          <Film className="w-3 h-3 text-[#3B82F6] shrink-0" />
          <input
            type="text"
            value={videoTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Video"
            className="bg-transparent text-white font-semibold text-[11px] focus:outline-none w-full truncate leading-none"
            title="Click to rename video"
          />
        </div>
      </div>

      {/* ── Right: Panel Toggles + Actions + Settings + Profile ── */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Notice Badge */}
        {notice && (
          <span className="text-[10px] text-[#A3A3A3] bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#282828] animate-pulse hidden xl:inline">
            {notice}
          </span>
        )}

        {/* Quick Search / Command Palette trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('workspace:open-command-palette'))}
          className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#161616] hover:bg-[#202022] border border-[#262626] hover:border-[#3B82F6]/50 text-[11px] text-[#A0A0AB] hover:text-white transition-all cursor-pointer shadow-xs group"
          title="Open Command Palette (⌘K or Ctrl+K)"
        >
          <Search className="w-3 h-3 text-[#71717A] group-hover:text-[#3B82F6] transition-colors" />
          <span className="text-[10px] font-medium">Quick Actions</span>
          <kbd className="text-[9px] font-mono px-1 py-0.5 bg-[#0F0F10] border border-[#2D2D33] rounded text-[#71717A] group-hover:text-[#CCCCCC]">
            ⌘K
          </kbd>
        </button>

        {/* Panel Layout Toggles (Left, Bottom, Right) */}
        <div className="flex items-center gap-0.5 bg-[#161616] p-0.5 rounded-lg border border-[#262626]">
          <button
            type="button"
            onClick={() => handleTogglePanel('left')}
            className={`p-1 rounded-md transition-all cursor-pointer ${
              showLeftPane
                ? 'bg-[#2A2A2A] text-white shadow-xs'
                : 'text-[#666666] hover:text-[#CCCCCC] hover:bg-[#1E1E1E]'
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
                ? 'bg-[#2A2A2A] text-white shadow-xs'
                : 'text-[#666666] hover:text-[#CCCCCC] hover:bg-[#1E1E1E]'
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
                ? 'bg-[#2A2A2A] text-white shadow-xs'
                : 'text-[#666666] hover:text-[#CCCCCC] hover:bg-[#1E1E1E]'
            }`}
            title={showRightPane ? 'Hide Right Inspector' : 'Show Right Inspector'}
            aria-label="Toggle Right Inspector"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#262626] mx-0.5 hidden sm:block" />

        {/* Export MP4 */}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="hidden sm:flex items-center gap-1 h-7 px-2 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-[#282828] hover:border-[#383838] text-[10px] font-semibold text-[#CCCCCC] hover:text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          title={exporting ? 'Rendering the final video' : 'Export the composed video preview'}
        >
          <Download className="w-3 h-3 text-[#3B82F6]" />
          <span>{exporting ? 'Exporting...' : 'Export MP4'}</span>
        </button>

        {/* Save Draft */}
        <button
          type="button"
          onClick={handleSaveDraft}
          className="hidden sm:flex items-center gap-1 h-7 px-2 rounded-lg bg-[#161616] hover:bg-[#1F1F1F] border border-[#282828] hover:border-[#383838] text-[10px] font-semibold text-[#CCCCCC] hover:text-white transition-all cursor-pointer"
        >
          <Bookmark className="w-3 h-3 text-amber-400" />
          <span>Save Draft</span>
        </button>

        {/* Save to Website Library */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('workspace:save-to-library'))}
          disabled={!canPublish}
          className={`hidden sm:flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
            canPublish
              ? 'bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/40 hover:bg-[#3B82F6]/20 hover:border-[#3B82F6]/70'
              : 'bg-[#181818] text-[#555555] border-[#262626] cursor-not-allowed'
          }`}
          title="Save this video to your Website Video Library"
        >
          <Film className="w-3 h-3" />
          <span>Save to Library</span>
        </button>

        {/* Publish to YouTube */}
        <button
          type="button"
          onClick={handlePublishClick}
          disabled={!canPublish || publishing}
          className={`h-7 px-2.5 sm:px-3 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
            publishedSuccess
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : !canPublish || publishing
              ? 'bg-[#181818] text-[#555555] border border-[#262626] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#60A5FA] hover:to-[#3B82F6] text-white'
          }`}
        >
          {publishing ? (
            <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : publishedSuccess ? (
            <Check className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3 fill-white" />
          )}
          <span className="tracking-wide">
            {publishing ? 'Publishing...' : publishedSuccess ? 'Published!' : 'PUBLISH TO YOUTUBE'}
          </span>
        </button>

        <div className="h-4 w-px bg-[#262626] mx-0.5 hidden sm:block" />

        {/* Settings button */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#1C1C1C] border border-transparent hover:border-[#282828] transition-all cursor-pointer"
          title="Studio Settings"
          aria-label="Studio Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Profile button */}
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-1 p-0.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1C1C1C] border border-transparent hover:border-[#282828] transition-all cursor-pointer"
          title={user ? `${user.name} (${user.email})` : 'Profile'}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-5.5 h-5.5 rounded-md bg-[#1E1E1E] border border-[#282828] object-cover"
            />
          ) : (
            <div className="w-5.5 h-5.5 rounded-md bg-[#1E1E1E] border border-[#282828] flex items-center justify-center text-[9px] font-bold text-[#60A5FA]">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
            </div>
          )}
          <ChevronDown className="w-3 h-3 text-[#555555]" />
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
