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

export const WORKSPACE_SIDEBAR_ITEMS: Array<{
  id: WorkspaceTabType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isScriptGroup?: boolean;
}> = [
  { id: 'script', label: 'Script & AI', shortLabel: 'Script', icon: FileText, isScriptGroup: true },
  { id: 'canvas', label: 'Canvas & Frame', shortLabel: 'Canvas', icon: LayoutTemplate },
  { id: 'media', label: 'Media Library', shortLabel: 'Media', icon: FolderOpen },
  { id: 'video', label: 'Stock Videos', shortLabel: 'Videos', icon: Film },
  { id: 'image', label: 'Stock Photos', shortLabel: 'Photos', icon: ImageIcon },
  { id: 'audio', label: 'Audio & SFX', shortLabel: 'Audio', icon: Music },
  { id: 'text', label: 'Text & Captions', shortLabel: 'Text', icon: Type },
  { id: 'elements', label: 'Visual Elements', shortLabel: 'Elements', icon: Shapes },
  { id: 'youtube', label: 'YouTube Studio', shortLabel: 'YouTube', icon: Youtube },
  { id: 'automations', label: 'Daily Automations', shortLabel: 'Auto', icon: CalendarClock },
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
          className="flex sm:hidden w-full h-11 px-2.5 bg-[#111111]/95 border-b border-[#2A2A2A] overflow-x-auto scrollbar-none items-center gap-1.5 shrink-0 z-20 select-none font-sans-studio backdrop-blur-xl"
        >
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              aria-label="Creator Dashboard"
              title="Creator Dashboard"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border border-[#2A2A2A] bg-white/5 text-slate-300 hover:text-white shrink-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              <span className="text-[11px] leading-none">Home</span>
            </button>
          )}
          {WORKSPACE_SIDEBAR_ITEMS.map((item) => {
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
                    ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs font-semibold'
                    : 'border-[#242424] bg-[#161616] text-[#9CA3AF] hover:text-white hover:bg-[#26262C]'
                }`}
              >
                <IconComp className={`h-3.5 w-3.5 shrink-0 ${item.id === 'youtube' && isActive ? 'text-red-400' : item.id === 'automations' && isActive ? 'text-emerald-400' : ''}`} />
                <span className="text-[11px] leading-none">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Desktop Vertical Left Sidebar (>= 768px) ── */}
      {showDesktop && (
        <aside className="hidden md:flex relative w-14 shrink-0 h-full bg-[#111111]/95 border-r border-[#242424] flex-col items-center justify-between py-2 z-20 select-none font-sans-studio backdrop-blur-xl">
          <div className="flex w-full flex-col items-center gap-1.5 px-1.5">
            {WORKSPACE_SIDEBAR_ITEMS.map((item) => {
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
                  className={`group relative flex flex-col h-11 w-11 items-center justify-center rounded-2xl border transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] border-[#60A5FA]/40 text-white shadow-[0_0_14px_rgba(37,99,235,0.35)]'
                      : 'border-transparent text-[#9CA3AF] hover:bg-[#26262C] hover:text-white hover:border-white/10'
                  }`}
                >
                  <IconComp
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-[#9CA3AF] group-hover:text-white'
                    }`}
                  />
                  <span className={`text-[8.5px] font-semibold mt-1 tracking-tight truncate max-w-[44px] leading-none ${
                    isActive ? 'text-white' : 'text-[#9CA3AF] group-hover:text-white'
                  }`}>
                    {item.shortLabel}
                  </span>

                  {/* Flyout Tooltip (Pill Style) */}
                  <span className="pointer-events-none absolute left-14 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#333333] bg-[#1A1A1A] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {onNavigate && (
            <div className="flex w-full justify-center border-t border-[#242424] px-1.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                aria-label="Creator Dashboard"
                title="Creator Dashboard"
                className="group relative flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-transparent text-[#9CA3AF] transition-all hover:border-white/10 hover:bg-[#26262C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-[#60A5FA] transition-transform group-hover:scale-105" />
                <span className="mt-1 max-w-[44px] truncate text-[8.5px] font-semibold leading-none text-[#9CA3AF] group-hover:text-white">
                  Home
                </span>
                <span className="pointer-events-none absolute bottom-1/2 left-14 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#333333] bg-[#1A1A1A] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
                  Creator Dashboard
                </span>
              </button>
            </div>
          )}
        </aside>
      )}
    </>
  );
};

export const WorkspaceMobileTabs: React.FC<Omit<WorkspaceSidebarProps, 'mode'>> = (props) => {
  return <WorkspaceSidebar {...props} mode="mobile-only" />;
};
