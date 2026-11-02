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
    <header className="sticky top-0 h-11 shrink-0 z-30 w-full overflow-hidden bg-[#0B0E17]/95 backdrop-blur-2xl border-b border-white/[0.08] px-3 sm:px-4 flex items-center justify-between gap-2.5 font-sans-studio select-none text-slate-100 shadow-sm">
      {/* ── Left: Studio Title & Brand Pill ── */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        {/* Creator Dashboard Home Shortcut */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          aria-label="Creator Dashboard"
          title="Back to Creator Dashboard"
          className="h-8 w-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs group"
        >
          <LayoutDashboard className="w-4 h-4 text-sky-400 transition-transform group-hover:scale-105" />
        </button>

        <div className="h-4 w-px bg-white/[0.08] hidden min-[440px]:block" />

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-[0_0_12px_rgba(56,189,248,0.35)]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-xs tracking-tight text-white whitespace-nowrap hidden min-[440px]:inline">
            ApexMind <span className="text-sky-400">Studio</span>
          </span>
          <span className="font-extrabold text-xs tracking-tight text-white whitespace-nowrap min-[440px]:hidden">
            ApexMind
          </span>
        </div>
      </div>

        {/* Project Breadcrumb & Title Input */}
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <div className="h-4 w-px bg-white/[0.08]" />
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
            Shorts Director
          </span>
          <span className="text-slate-600">/</span>
          <div className="relative flex items-center min-w-0 max-w-[200px] xl:max-w-[280px]">
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Project"
              aria-label="Video project title"
              className="h-7 w-full px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] focus:bg-[#121622] border border-white/[0.08] focus:border-sky-400/50 text-[11px] font-medium text-slate-200 focus:text-white placeholder:text-slate-500 focus:outline-none transition-all truncate shadow-inner"
            />
          </div>
        </div>

      {/* ── Right: Panel Toggles + Actions + Settings + Profile ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notice Badge */}
        {notice && (
          <span className="text-[10px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 animate-pulse hidden xl:inline">
            {notice}
          </span>
        )}

        {/* Quick Search / Command Palette trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('workspace:open-command-palette'))}
          className="hidden md:flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer group"
          title="Open Command Palette (⌘K or Ctrl+K)"
        >
          <Search className="w-3 h-3 text-slate-400 group-hover:text-sky-400 transition-colors" />
          <span className="text-[10px] font-medium text-slate-300">Quick Actions</span>
          <kbd className="text-[9px] font-mono px-1.5 py-0.2 bg-black/40 border border-white/10 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Panel Layout Toggles (Left, Bottom, Right) Pill Group */}
        <div className="hidden sm:flex items-center gap-0.5 bg-[#121622] p-0.5 rounded-lg border border-white/[0.08]">
          <button
            type="button"
            onClick={() => handleTogglePanel('left')}
            className={`p-1 rounded-md transition-all cursor-pointer ${
              showLeftPane
                ? 'bg-blue-600/25 text-sky-300 border border-sky-400/30 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
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
                ? 'bg-blue-600/25 text-sky-300 border border-sky-400/30 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
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
                ? 'bg-blue-600/25 text-sky-300 border border-sky-400/30 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            title={showRightPane ? 'Hide Right Inspector' : 'Show Right Inspector'}
            aria-label="Toggle Right Inspector"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

        {/* Export MP4 (Pill Button) */}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="hidden sm:flex items-center gap-1.5 h-7.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-[10.5px] font-semibold text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          title={exporting ? 'Rendering the final video' : 'Export the composed video preview'}
        >
          <Download className="w-3 h-3 text-sky-400" />
          <span>{exporting ? (notice?.startsWith('Rendering') ? notice : 'Exporting...') : 'Export MP4'}</span>
        </button>

        {/* Save Draft (Pill Button) */}
        <button
          type="button"
          onClick={handleSaveDraft}
          className="hidden sm:flex items-center gap-1.5 h-7.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-[10.5px] font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
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
              ? 'bg-blue-500/10 text-sky-300 border-sky-400/30 hover:bg-blue-500/20 hover:border-sky-400/60 shadow-xs'
              : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
          }`}
          title="Save this video to your Website Video Library"
        >
          <Film className="w-3 h-3" />
          <span>Save to Library</span>
        </button>

        {/* Publish to YouTube (Professional Accent Button) */}
        <button
          type="button"
          onClick={handlePublishClick}
          disabled={!canPublish || publishing}
          className={`h-7.5 px-3.5 sm:px-4 text-[10.5px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            publishedSuccess
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : !canPublish || publishing
              ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_14px_rgba(37,99,235,0.35)] border border-sky-400/30 active:scale-95'
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

        <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

        {/* Settings button (Pill Shape) */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="h-7.5 w-7.5 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer"
          title="Studio Settings"
          aria-label="Studio Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Profile button (Pill Avatar) */}
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-1 p-0.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer"
          title={user ? `${user.name} (${user.email})` : 'Profile'}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-6 h-6 rounded-full bg-[#1E1E1E] border border-white/20 object-cover shadow-xs"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 border border-white/20 flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
            </div>
          )}
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
