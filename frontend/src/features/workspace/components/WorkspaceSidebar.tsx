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
          className="flex sm:hidden w-full h-10 px-2 bg-[#121212] border-b border-[#242424] overflow-x-auto scrollbar-none items-center gap-1.5 shrink-0 z-20 select-none font-sans-studio"
        >
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'border-red-500/50 bg-[#1A1A1A] text-white shadow-xs'
                    : 'border-transparent text-[#8E8E93] hover:text-[#E5E5E5] hover:bg-[#181818]'
                }`}
              >
                <IconComp className={`h-3.5 w-3.5 shrink-0 ${item.id === 'youtube' && isActive ? 'text-red-500' : item.id === 'automations' && isActive ? 'text-emerald-400' : ''}`} />
                <span className="text-[11px] leading-none">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Desktop Vertical Left Sidebar (>= 640px) ── */}
      {showDesktop && (
        <aside className="hidden sm:flex relative w-10 shrink-0 h-full bg-[#121212] border-r border-[#2F2F2F] shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)] flex-col items-center justify-between py-2 z-20 select-none font-sans-studio">
          <div className="flex w-full flex-col items-center gap-1">
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
                  className={`group relative flex flex-col h-8 w-8 items-center justify-center rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? item.id === 'youtube'
                        ? 'border-red-500/50 bg-red-950/20 text-white'
                        : item.id === 'automations'
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-white'
                        : 'border-[#2F2F2F] bg-[#1A1A1A] text-white'
                      : 'border-transparent text-[#757575] hover:border-[#2F2F2F] hover:bg-[#171717] hover:text-[#E5E5E5]'
                  }`}
                >
                  <IconComp
                    className={`h-3 w-3 shrink-0 transition-transform group-hover:scale-110 ${
                      item.id === 'youtube'
                        ? (isActive ? 'text-red-500' : 'group-hover:text-red-500')
                        : item.id === 'automations'
                        ? (isActive ? 'text-emerald-400' : 'group-hover:text-emerald-400')
                        : ''
                    }`}
                  />
                  <span className="text-[6px] font-semibold mt-0.5 tracking-tight truncate max-w-[30px] leading-none">
                    {item.shortLabel}
                  </span>

                  {/* Flyout Tooltip */}
                  <span className="pointer-events-none absolute left-11 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#2F2F2F] bg-[#1E1E1E] px-2 py-0.5 text-[9px] font-medium text-white opacity-0 shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-opacity group-hover:opacity-100">
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
