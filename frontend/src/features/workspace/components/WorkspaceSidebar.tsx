import React from 'react';
import {
  FileText,
  FolderOpen,
  LayoutTemplate,
  Type,
  Shapes,
  Music,
  Image as ImageIcon,
  Film,
  Youtube,
  CalendarClock,
  LayoutDashboard,
} from 'lucide-react';

export type WorkspaceTabType =
  | 'youtube'
  | 'automations'
  | 'script'
  | 'prompt'
  | 'editor'
  | 'canvas'
  | 'media'
  | 'text'
  | 'elements'
  | 'audio'
  | 'image'
  | 'video';

export interface WorkspaceSidebarProps {
  activeTab: WorkspaceTabType;
  onTabChange: (tab: WorkspaceTabType) => void;
  onNavigate?: (page: string) => void;
  mode?: 'all' | 'desktop-only' | 'mobile-only';
}

const SIDEBAR_ITEMS: Array<{
  id: WorkspaceTabType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isScriptGroup?: boolean;
}> = [
  { id: 'youtube', label: 'YouTube Studio', shortLabel: 'YouTube', icon: Youtube },
  { id: 'automations', label: 'Daily Automations', shortLabel: 'Auto', icon: CalendarClock },
  { id: 'script', label: 'Script & AI', shortLabel: 'Script', icon: FileText, isScriptGroup: true },
  { id: 'canvas', label: 'Canvas & Frame', shortLabel: 'Canvas', icon: LayoutTemplate },
  { id: 'media', label: 'Media Library', shortLabel: 'Media', icon: FolderOpen },
  { id: 'video', label: 'Stock Videos', shortLabel: 'Videos', icon: Film },
  { id: 'image', label: 'Stock Photos', shortLabel: 'Photos', icon: ImageIcon },
  { id: 'audio', label: 'Audio & SFX', shortLabel: 'Audio', icon: Music },
  { id: 'text', label: 'Text & Captions', shortLabel: 'Text', icon: Type },
  { id: 'elements', label: 'Visual Elements', shortLabel: 'Elements', icon: Shapes },
];

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  onTabChange,
  onNavigate,
  mode = 'all',
}) => {
  const showMobile = mode === 'all' || mode === 'mobile-only';
  const showDesktop = mode === 'all' || mode === 'desktop-only';

  return (
    <>
      {/* ── Mobile Horizontal Tab Bar (< 640px) ── */}
      {showMobile && (
        <nav
          aria-label="Studio tools navigation"
          className="flex sm:hidden w-full h-11 px-2.5 bg-[#0A0E1A]/95 border-b border-white/10 overflow-x-auto scrollbar-none items-center gap-1.5 shrink-0 z-20 select-none font-sans-studio backdrop-blur-xl"
        >
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              aria-label="Creator Dashboard"
              title="Creator Dashboard"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border border-white/10 bg-white/5 text-slate-300 hover:text-white shrink-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              <span className="text-[11px] leading-none">Home</span>
            </button>
          )}
          {SIDEBAR_ITEMS.map((item) => {
            const IconComp = item.icon;
            const isActive = item.isScriptGroup
              ? activeTab === 'script' || activeTab === 'prompt' || activeTab === 'editor'
              : activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'border-sky-400/50 bg-gradient-to-r from-blue-600/30 to-sky-500/30 text-white shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <IconComp className={`h-3.5 w-3.5 shrink-0 ${item.id === 'youtube' && isActive ? 'text-red-400' : item.id === 'automations' && isActive ? 'text-emerald-400' : ''}`} />
                <span className="text-[11px] leading-none">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Desktop Vertical Left Sidebar (>= 640px) ── */}
      {showDesktop && (
        <aside className="hidden sm:flex relative w-14 shrink-0 h-full bg-[#0B0E17]/95 border-r border-white/[0.08] flex-col items-center justify-between py-2.5 z-20 select-none font-sans-studio backdrop-blur-xl">
          <div className="flex w-full flex-col items-center gap-1.5 px-1.5 pt-1">
            {SIDEBAR_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive = item.isScriptGroup
                ? activeTab === 'script' || activeTab === 'prompt' || activeTab === 'editor'
                : activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className={`group relative flex flex-col h-11 w-11 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? item.id === 'youtube'
                        ? 'border-red-500/40 bg-red-950/25 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                        : item.id === 'automations'
                        ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'border-sky-400/40 bg-blue-600/20 text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                      : 'border-transparent text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <IconComp
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                      item.id === 'youtube'
                        ? (isActive ? 'text-red-400' : 'group-hover:text-red-400')
                        : item.id === 'automations'
                        ? (isActive ? 'text-emerald-400' : 'group-hover:text-emerald-400')
                        : isActive ? 'text-sky-300' : ''
                    }`}
                  />
                  <span className={`text-[8.5px] font-semibold mt-1 tracking-tight truncate max-w-[44px] leading-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.shortLabel}
                  </span>

                  {/* Flyout Tooltip (Pill Style) */}
                  <span className="pointer-events-none absolute left-14 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-[#121622] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full h-2" aria-hidden="true" />
        </aside>
      )}
    </>
  );
};

export const WorkspaceMobileTabs: React.FC<Omit<WorkspaceSidebarProps, 'mode'>> = (props) => {
  return <WorkspaceSidebar {...props} mode="mobile-only" />;
};
