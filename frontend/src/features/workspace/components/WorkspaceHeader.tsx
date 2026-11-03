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
  Sparkles,
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
  const [canPublish, setCanPublish] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [hasTimelineContent, setHasTimelineContent] = useState(false);
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
    <header className="sticky top-0 h-11 shrink-0 z-30 w-full overflow-hidden bg-[#111111]/98 backdrop-blur-2xl border-b border-[#242424] px-3 sm:px-4 flex items-center justify-between gap-2.5 font-sans-studio select-none text-[#E5E5E5] shadow-sm">
      {/* ── Left: Studio Title, Brand Logo, Breadcrumb & Project Title ── */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
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

        {/* Project Breadcrumb & Title Input */}
        <div className="hidden md:flex items-center gap-2 min-w-0 ml-1">
          <div className="h-4 w-px bg-[#262626]" />
          <span className="text-[11px] font-medium text-[#9CA3AF] whitespace-nowrap">
            Shorts Director
          </span>
          <span className="text-[#52525B]">/</span>
          <div className="relative flex items-center min-w-0 max-w-[200px] xl:max-w-[280px]">
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
      </div>

      {/* ── Right: Panel Toggles + Actions + Settings + Profile ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notice Badge */}
        {notice && (
          <span className="text-[10px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-[#333333] animate-pulse hidden xl:inline">
            {notice}
          </span>
        )}

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

        {/* Publish to YouTube (Professional Accent Button) */}
        <button
          type="button"
          onClick={handlePublishClick}
          disabled={!canPublish || publishing}
          title={
            publishing ? 'Publishing to YouTube…' :
            publishedSuccess ? 'Published successfully!' :
            !canPublish ? 'Generate a script first to publish' :
            'Publish to YouTube'
          }
          className={`h-7.5 px-3.5 sm:px-4 text-[10.5px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            publishedSuccess
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : !canPublish || publishing
              ? 'bg-[#121212] text-[#52525B] border border-[#242424] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white shadow-[0_0_14px_rgba(37,99,235,0.35)] border border-[#60A5FA]/30 active:scale-95'
          }`}
        >
          {publishing ? (
            <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : publishedSuccess ? (
            <Check className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3 fill-white" />
          )}
          <span className="hidden sm:inline">
            {publishing ? 'Publishing...' : publishedSuccess ? 'Published!' : 'Publish to YouTube'}
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
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-1 p-0.5 rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#202020] border border-transparent hover:border-[#2A2A2A] transition-all cursor-pointer"
          title={user ? `${user.name} (${user.email})` : 'Profile'}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-6 h-6 rounded-full bg-[#181818] border border-[#2A2A2A] object-cover shadow-xs"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] border border-[#60A5FA]/30 flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
            </div>
          )}
          <ChevronDown className="w-3 h-3 text-[#737373]" />
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
